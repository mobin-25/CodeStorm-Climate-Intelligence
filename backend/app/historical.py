from __future__ import annotations

import asyncio
from email.utils import parsedate_to_datetime
from datetime import date, datetime, timedelta, timezone
import json
import math
from statistics import mean
import time
from typing import Annotated, Any, Literal

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.weather import CITY_COORDINATES

router = APIRouter(prefix="/api/historical", tags=["historical"])

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
REQUEST_TIMEOUT = httpx.Timeout(60.0, connect=5.0)
PROVIDER_MAX_ATTEMPTS = 3
RETRY_BASE_SECONDS = 0.5
RETRY_MAX_SECONDS = 8.0
ARCHIVE_CACHE_TTL_SECONDS = 12 * 60 * 60
AIR_CACHE_TTL_SECONDS = 12 * 60 * 60
FORECAST_CACHE_TTL_SECONDS = 30 * 60
PROVIDER_CACHE_MAX_ENTRIES = 32
AIR_QUALITY_GLOBAL_START = date(2022, 8, 1)
RAINFALL_MIN_BASELINE_MM_PER_DAY = 0.1

HistoricalRange = Literal["30d", "6m", "1y", "2y"]
WEATHER_FIELDS = (
    "temperature_2m_mean",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
)
AIR_FIELDS = ("us_aqi", "pm2_5", "pm10")
DATA_SOURCE = "Open-Meteo ERA5 reanalysis/Forecast API and CAMS Global air-quality model"
_PROVIDER_CACHE: dict[tuple[Any, ...], tuple[float, dict[str, Any]]] = {}
_PROVIDER_IN_FLIGHT: dict[tuple[Any, ...], asyncio.Task[dict[str, Any]]] = {}
_PROVIDER_CACHE_LOCK = asyncio.Lock()


class HistoricalDataPoint(BaseModel):
    timestamp: str
    label: str
    avgTemp: float
    maxTemp: float
    minTemp: float
    rainfallMm: float
    aqi: float
    pm25: float
    pm10: float


class HistoricalSummary(BaseModel):
    avgTemp: float
    maxTemp: float
    minTemp: float
    tempChangePercent: float
    totalRainfallMm: float
    rainfallAnomalyPercent: float
    avgAqi: float
    aqiChangePercent: float
    trendDescription: str


class CityHistoricalTrendsData(BaseModel):
    cityId: str
    cityName: str
    timestamp: str
    dataSource: str
    timeRange: HistoricalRange
    points: list[HistoricalDataPoint]
    summary: HistoricalSummary
    isSampleData: bool
    sampleNote: str | None = None
    isDataUnavailable: bool
    apiContractNote: str | None = None
    coordinates: dict[str, float]


class HistoricalDataUnavailable(Exception):
    """The provider data cannot produce a complete, aligned historical series."""


class DailyObservation:
    def __init__(
        self,
        day: date,
        avg_temp: float,
        max_temp: float,
        min_temp: float,
        rainfall_mm: float,
        aqi: float,
        pm25: float,
        pm10: float,
    ) -> None:
        self.day = day
        self.avg_temp = avg_temp
        self.max_temp = max_temp
        self.min_temp = min_temp
        self.rainfall_mm = rainfall_mm
        self.aqi = aqi
        self.pm25 = pm25
        self.pm10 = pm10


def _is_finite_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
    )


def _parse_date(value: Any) -> date:
    if not isinstance(value, str):
        raise HistoricalDataUnavailable("Provider returned a non-string date value.")
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        raise HistoricalDataUnavailable(f"Provider returned an invalid date: {value!r}.") from None


def _parse_timestamp(value: Any) -> datetime:
    if not isinstance(value, str):
        raise HistoricalDataUnavailable("Air-quality provider returned an invalid timestamp.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HistoricalDataUnavailable(
            f"Air-quality provider returned an invalid timestamp: {value!r}."
        ) from None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _month_start(year: int, month: int, months_before: int) -> date:
    month_index = year * 12 + month - 1 - months_before
    return date(month_index // 12, month_index % 12 + 1, 1)


def _range_dates(time_range: HistoricalRange, today: date | None = None) -> tuple[date, date]:
    current_day = today or datetime.now(timezone.utc).date()
    end_date = current_day - timedelta(days=1)
    if time_range == "30d":
        start_date = end_date - timedelta(days=29)
    else:
        months = {"6m": 6, "1y": 12, "2y": 24}[time_range]
        start_date = _month_start(current_day.year, current_day.month, months - 1)
    return start_date, end_date


def _retry_after_seconds(response: httpx.Response, attempt: int) -> float:
    value = response.headers.get("Retry-After")
    if value:
        try:
            delay = float(value)
        except ValueError:
            try:
                retry_time = parsedate_to_datetime(value)
                if retry_time.tzinfo is None:
                    retry_time = retry_time.replace(tzinfo=timezone.utc)
                delay = (retry_time - datetime.now(timezone.utc)).total_seconds()
            except (TypeError, ValueError, OverflowError):
                delay = RETRY_BASE_SECONDS * (2**attempt)
    else:
        delay = RETRY_BASE_SECONDS * (2**attempt)
    return min(max(delay, 0.0), RETRY_MAX_SECONDS)


def _provider_cache_ttl(url: str) -> float:
    if url == FORECAST_URL:
        return FORECAST_CACHE_TTL_SECONDS
    if url == AIR_QUALITY_URL:
        return AIR_CACHE_TTL_SECONDS
    return ARCHIVE_CACHE_TTL_SECONDS


def _provider_cache_key(url: str, params: dict[str, Any]) -> tuple[Any, ...]:
    canonical_params = json.dumps(params, sort_keys=True, separators=(",", ":"))
    return url, canonical_params


def _provider_cache_now() -> float:
    return time.monotonic()


def _validate_cacheable_provider_payload(url: str, payload: dict[str, Any]) -> None:
    if url == ARCHIVE_URL:
        _daily_weather_values(payload, "Historical Archive API")
    elif url == FORECAST_URL:
        _daily_weather_values(
            payload,
            "Forecast API",
            ("temperature_2m_max", "temperature_2m_min", "precipitation_sum"),
        )
        hourly = payload.get("hourly")
        if not isinstance(hourly, dict) or not isinstance(hourly.get("time"), list):
            raise HistoricalDataUnavailable("Forecast API response is missing hourly dates.")
        temperatures = hourly.get("temperature_2m")
        if not isinstance(temperatures, list) or len(temperatures) != len(hourly["time"]):
            raise HistoricalDataUnavailable("Forecast API response has misaligned hourly temperature values.")
    elif url == AIR_QUALITY_URL:
        _air_quality_daily_values(payload)


async def _fetch_json(url: str, params: dict[str, Any], provider: str) -> dict[str, Any]:
    for attempt in range(PROVIDER_MAX_ATTEMPTS):
        response: httpx.Response | None = None
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as error:
            status = error.response.status_code
            if status == 429 and attempt + 1 < PROVIDER_MAX_ATTEMPTS:
                await asyncio.sleep(_retry_after_seconds(error.response, attempt))
                continue
            if 500 <= status < 600 and attempt + 1 < PROVIDER_MAX_ATTEMPTS:
                await asyncio.sleep(RETRY_BASE_SECONDS * (2**attempt))
                continue
            status_detail = " (rate limited)" if status == 429 else ""
            raise HistoricalDataUnavailable(
                f"{provider} returned HTTP {status}{status_detail} after {attempt + 1} attempt(s)."
            ) from None
        except httpx.TimeoutException as error:
            if attempt + 1 < PROVIDER_MAX_ATTEMPTS:
                await asyncio.sleep(RETRY_BASE_SECONDS * (2**attempt))
                continue
            raise HistoricalDataUnavailable(
                f"{provider} request timed out ({type(error).__name__}) after {attempt + 1} attempt(s)."
            ) from None
        except httpx.RequestError as error:
            if attempt + 1 < PROVIDER_MAX_ATTEMPTS:
                await asyncio.sleep(RETRY_BASE_SECONDS * (2**attempt))
                continue
            raise HistoricalDataUnavailable(
                f"{provider} network request failed ({type(error).__name__}) after {attempt + 1} attempt(s)."
            ) from None
        except ValueError:
            raise HistoricalDataUnavailable(f"{provider} returned invalid JSON.") from None

        if not isinstance(payload, dict):
            raise HistoricalDataUnavailable(f"{provider} returned a non-object JSON response.")
        if payload.get("error"):
            reason = payload.get("reason")
            detail = f": {reason}" if isinstance(reason, str) and reason else "."
            raise HistoricalDataUnavailable(f"{provider} rejected the request{detail}")
        return payload

    raise HistoricalDataUnavailable(f"{provider} failed after {PROVIDER_MAX_ATTEMPTS} attempts.")


async def _load_cached_provider_response(
    key: tuple[Any, ...],
    url: str,
    params: dict[str, Any],
    provider: str,
) -> dict[str, Any]:
    try:
        payload = await _fetch_json(url, params, provider)
        _validate_cacheable_provider_payload(url, payload)
        async with _PROVIDER_CACHE_LOCK:
            now = _provider_cache_now()
            expired = [
                cache_key for cache_key, (expires_at, _) in _PROVIDER_CACHE.items()
                if expires_at <= now
            ]
            for cache_key in expired:
                _PROVIDER_CACHE.pop(cache_key, None)
            while len(_PROVIDER_CACHE) >= PROVIDER_CACHE_MAX_ENTRIES:
                _PROVIDER_CACHE.pop(next(iter(_PROVIDER_CACHE)))
            _PROVIDER_CACHE[key] = (now + _provider_cache_ttl(url), payload)
        return payload
    finally:
        async with _PROVIDER_CACHE_LOCK:
            if _PROVIDER_IN_FLIGHT.get(key) is asyncio.current_task():
                _PROVIDER_IN_FLIGHT.pop(key, None)


async def _fetch_cached_json(
    url: str,
    params: dict[str, Any],
    provider: str,
) -> dict[str, Any]:
    key = _provider_cache_key(url, params)
    async with _PROVIDER_CACHE_LOCK:
        now = _provider_cache_now()
        cached = _PROVIDER_CACHE.get(key)
        if cached is not None:
            expires_at, payload = cached
            if expires_at > now:
                return payload
            _PROVIDER_CACHE.pop(key, None)
        task = _PROVIDER_IN_FLIGHT.get(key)
        if task is None:
            task = asyncio.create_task(
                _load_cached_provider_response(key, url, params, provider)
            )
            _PROVIDER_IN_FLIGHT[key] = task
    return await asyncio.shield(task)


def _daily_weather_values(
    payload: dict[str, Any],
    provider: str,
    required_fields: tuple[str, ...] = WEATHER_FIELDS,
) -> dict[date, dict[str, float]]:
    daily = payload.get("daily")
    if not isinstance(daily, dict):
        if not required_fields:
            return {}
        raise HistoricalDataUnavailable(f"{provider} response is missing daily dates.")
    if not isinstance(daily.get("time"), list):
        if not required_fields:
            return {}
        raise HistoricalDataUnavailable(f"{provider} response is missing daily dates.")
    times = daily["time"]
    values_by_field: dict[str, list[Any]] = {}
    for field in required_fields:
        values = daily.get(field)
        if not isinstance(values, list) or len(values) != len(times):
            raise HistoricalDataUnavailable(
                f"{provider} response has missing or misaligned daily field '{field}'."
            )
        values_by_field[field] = values

    result: dict[date, dict[str, float]] = {}
    for index, timestamp in enumerate(times):
        day = _parse_date(timestamp)
        row = result.setdefault(day, {})
        for field in required_fields:
            value = values_by_field[field][index]
            if _is_finite_number(value):
                row[field] = float(value)
    return result


def _forecast_daily_weather_values(payload: dict[str, Any]) -> dict[date, dict[str, float]]:
    fields = ("temperature_2m_max", "temperature_2m_min", "precipitation_sum")
    result = _daily_weather_values(payload, "Forecast API", fields)
    daily = payload.get("daily")
    if isinstance(daily, dict):
        times = daily.get("time")
        means = daily.get("temperature_2m_mean")
        if isinstance(times, list) and isinstance(means, list) and len(times) == len(means):
            for timestamp, value in zip(times, means):
                if _is_finite_number(value):
                    result.setdefault(_parse_date(timestamp), {})["temperature_2m_mean"] = float(value)
    hourly = payload.get("hourly")
    if not isinstance(hourly, dict) or not isinstance(hourly.get("time"), list):
        return result
    timestamps = hourly["time"]
    temperatures = hourly.get("temperature_2m")
    if not isinstance(temperatures, list) or len(temperatures) != len(timestamps):
        return result

    daily_temperatures: dict[date, list[float]] = {}
    for timestamp, temperature in zip(timestamps, temperatures):
        if not _is_finite_number(temperature):
            continue
        day = _parse_timestamp(timestamp).date()
        daily_temperatures.setdefault(day, []).append(float(temperature))

    for day, values in daily_temperatures.items():
        if len(values) == 24:
            result.setdefault(day, {})["temperature_2m_mean"] = mean(values)
    return result


def _air_quality_daily_values(payload: dict[str, Any]) -> dict[date, dict[str, float]]:
    hourly = payload.get("hourly")
    if not isinstance(hourly, dict) or not isinstance(hourly.get("time"), list):
        raise HistoricalDataUnavailable("Air Quality API response is missing hourly dates.")
    times = hourly["time"]
    values_by_field: dict[str, list[Any]] = {}
    for field in AIR_FIELDS:
        values = hourly.get(field)
        if not isinstance(values, list) or len(values) != len(times):
            raise HistoricalDataUnavailable(
                f"Air Quality API response has missing or misaligned hourly field '{field}'."
            )
        values_by_field[field] = values

    grouped: dict[date, dict[str, list[float]]] = {}
    for index, timestamp in enumerate(times):
        day = _parse_timestamp(timestamp).date()
        values = [values_by_field[field][index] for field in AIR_FIELDS]
        if not all(_is_finite_number(value) for value in values):
            continue
        row = grouped.setdefault(day, {field: [] for field in AIR_FIELDS})
        for field, value in zip(AIR_FIELDS, values):
            row[field].append(float(value))

    return {
        day: {field: mean(values) for field, values in fields.items()}
        for day, fields in grouped.items()
        if all(len(fields[field]) == 24 for field in AIR_FIELDS)
    }


def _assemble_daily_observations(
    start_date: date,
    end_date: date,
    archive_payload: dict[str, Any],
    forecast_payload: dict[str, Any],
    air_payload: dict[str, Any],
) -> list[DailyObservation]:
    archive = (
        _daily_weather_values(archive_payload, "Historical Archive API")
        if archive_payload
        else {}
    )
    forecast = _forecast_daily_weather_values(forecast_payload)
    air = _air_quality_daily_values(air_payload)

    observations: list[DailyObservation] = []
    missing: list[str] = []
    day = start_date
    while day <= end_date:
        weather_row = dict(archive.get(day, {}))
        weather_row.update(forecast.get(day, {}))
        air_row = air.get(day)
        if not all(field in weather_row for field in WEATHER_FIELDS) or air_row is None:
            missing.append(day.isoformat())
        else:
            observations.append(
                DailyObservation(
                    day=day,
                    avg_temp=weather_row["temperature_2m_mean"],
                    max_temp=weather_row["temperature_2m_max"],
                    min_temp=weather_row["temperature_2m_min"],
                    rainfall_mm=weather_row["precipitation_sum"],
                    aqi=air_row["us_aqi"],
                    pm25=air_row["pm2_5"],
                    pm10=air_row["pm10"],
                )
            )
        day += timedelta(days=1)

    if missing:
        preview = ", ".join(missing[:5])
        if len(missing) > 5:
            preview += f", and {len(missing) - 5} more"
        raise HistoricalDataUnavailable(
            f"Historical weather and air-quality records do not jointly cover: {preview}."
        )
    return observations


async def _fetch_daily_observations(
    lat: float,
    lng: float,
    start_date: date,
    end_date: date,
) -> list[DailyObservation]:
    if start_date < AIR_QUALITY_GLOBAL_START:
        raise HistoricalDataUnavailable(
            "CAMS Global air-quality history is documented from August 2022 onward."
        )

    coordinates = {"latitude": lat, "longitude": lng}
    weather_daily = ",".join(WEATHER_FIELDS)
    archive_params = {
        **coordinates,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": weather_daily,
        "models": "era5",
        "timezone": "UTC",
        "timeformat": "iso8601",
    }
    forecast_params = {
        **coordinates,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "hourly": "temperature_2m",
        "past_days": 92,
        "forecast_days": 1,
        "timezone": "UTC",
        "timeformat": "iso8601",
    }
    air_params = {
        **coordinates,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hourly": ",".join(AIR_FIELDS),
        "domains": "cams_global",
        "timezone": "UTC",
        "timeformat": "iso8601",
    }
    archive_result, forecast_result, air_result = await asyncio.gather(
        _fetch_cached_json(ARCHIVE_URL, archive_params, "Open-Meteo Historical Weather API"),
        _fetch_cached_json(FORECAST_URL, forecast_params, "Open-Meteo Forecast API"),
        _fetch_cached_json(AIR_QUALITY_URL, air_params, "Open-Meteo Air Quality API"),
        return_exceptions=True,
    )
    if isinstance(forecast_result, Exception):
        raise HistoricalDataUnavailable(str(forecast_result)) from None
    if isinstance(air_result, Exception):
        raise HistoricalDataUnavailable(str(air_result)) from None
    archive_payload = archive_result if isinstance(archive_result, dict) else {}
    forecast_payload = forecast_result
    air_payload = air_result
    return _assemble_daily_observations(
        start_date,
        end_date,
        archive_payload,
        forecast_payload,
        air_payload,
    )


def _safe_percent_change(
    earlier: float,
    later: float,
    minimum_baseline: float = 0.0,
) -> float:
    if abs(earlier) < minimum_baseline or earlier == 0:
        return 0.0
    return (later - earlier) / abs(earlier) * 100.0


def _mean(values: list[float]) -> float:
    return mean(values) if values else 0.0


def _aggregate_points(
    observations: list[DailyObservation],
    time_range: HistoricalRange,
) -> list[HistoricalDataPoint]:
    if time_range == "30d":
        groups: dict[tuple[int, int, int], list[DailyObservation]] = {}
        for item in observations:
            groups[(item.day.year, item.day.month, item.day.day)] = [item]
    else:
        groups = {}
        for item in observations:
            groups.setdefault((item.day.year, item.day.month, 0), []).append(item)

    points: list[HistoricalDataPoint] = []
    for key, items in sorted(groups.items()):
        first_day = items[0].day
        if time_range == "30d":
            label = f"{first_day.day} {first_day.strftime('%b')}"
            timestamp_day = first_day
        else:
            month_name = first_day.strftime("%b")
            label = month_name if time_range == "6m" else f"{month_name} '{first_day.strftime('%y')}"
            timestamp_day = date(first_day.year, first_day.month, 1)
        points.append(
            HistoricalDataPoint(
                timestamp=datetime.combine(timestamp_day, datetime.min.time(), timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                label=label,
                avgTemp=round(_mean([item.avg_temp for item in items]), 1),
                maxTemp=round(max(item.max_temp for item in items), 1),
                minTemp=round(min(item.min_temp for item in items), 1),
                rainfallMm=round(sum(item.rainfall_mm for item in items), 1),
                aqi=round(_mean([item.aqi for item in items]), 1),
                pm25=round(_mean([item.pm25 for item in items]), 1),
                pm10=round(_mean([item.pm10 for item in items]), 1),
            )
        )
    return points


def _build_summary(observations: list[DailyObservation]) -> HistoricalSummary:
    midpoint = len(observations) // 2
    earlier = observations[:midpoint]
    later = observations[midpoint:]
    earlier_temp = _mean([item.avg_temp for item in earlier])
    later_temp = _mean([item.avg_temp for item in later])
    earlier_rain_daily_mean = _mean([item.rainfall_mm for item in earlier])
    later_rain_daily_mean = _mean([item.rainfall_mm for item in later])
    rainfall_comparison_suppressed = (
        abs(earlier_rain_daily_mean) < RAINFALL_MIN_BASELINE_MM_PER_DAY
    )
    earlier_aqi = _mean([item.aqi for item in earlier])
    later_aqi = _mean([item.aqi for item in later])
    return HistoricalSummary(
        avgTemp=round(_mean([item.avg_temp for item in observations]), 1),
        maxTemp=round(max(item.max_temp for item in observations), 1),
        minTemp=round(min(item.min_temp for item in observations), 1),
        tempChangePercent=round(_safe_percent_change(earlier_temp, later_temp), 1),
        totalRainfallMm=round(sum(item.rainfall_mm for item in observations), 1),
        rainfallAnomalyPercent=round(
            _safe_percent_change(
                earlier_rain_daily_mean,
                later_rain_daily_mean,
                minimum_baseline=RAINFALL_MIN_BASELINE_MM_PER_DAY,
            ),
            1,
        ),
        avgAqi=round(_mean([item.aqi for item in observations]), 1),
        aqiChangePercent=round(_safe_percent_change(earlier_aqi, later_aqi), 1),
        trendDescription=(
            "Temperature change, rainfallAnomalyPercent, and AQI change are period-over-period "
            "percentage changes comparing earlier and later chronological halves: "
            "(later-half daily mean - earlier-half daily mean) / |earlier-half daily mean| × 100. "
            f"For rainfall, if earlier-half daily mean is below {RAINFALL_MIN_BASELINE_MM_PER_DAY:g} "
            "mm/day, rainfallAnomalyPercent is set to 0 because a percentage is unstable; in that "
            f"case the comparison is {'suppressed' if rainfall_comparison_suppressed else 'calculated'}, "
            "and 0 does not mean rainfall was unchanged when suppressed. This is a period-over-period "
            "percentage change, not a climatological anomaly."
        ),
    )


def _unavailable_response(
    city_id: str,
    city_name: str,
    time_range: HistoricalRange,
    coordinates: dict[str, float],
    contract_note: str,
    reason: str,
) -> CityHistoricalTrendsData:
    return CityHistoricalTrendsData(
        cityId=city_id,
        cityName=city_name,
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        dataSource=DATA_SOURCE,
        timeRange=time_range,
        points=[],
        summary=HistoricalSummary(
            avgTemp=0,
            maxTemp=0,
            minTemp=0,
            tempChangePercent=0,
            totalRainfallMm=0,
            rainfallAnomalyPercent=0,
            avgAqi=0,
            aqiChangePercent=0,
            trendDescription=(
                "Historical data unavailable. Numeric summary fields are schema placeholders, "
                f"not measurements. {reason}"
            ),
        ),
        isSampleData=False,
        sampleNote=None,
        isDataUnavailable=True,
        apiContractNote=f"{contract_note}. {reason}",
        coordinates=coordinates,
    )


async def _get_historical_response(
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
    time_range: HistoricalRange,
    contract_note: str,
) -> CityHistoricalTrendsData:
    coordinates = {"lat": lat, "lng": lng}
    start_date, end_date = _range_dates(time_range)
    try:
        observations = await _fetch_daily_observations(lat, lng, start_date, end_date)
    except HistoricalDataUnavailable as error:
        return _unavailable_response(
            city_id, city_name, time_range, coordinates, contract_note, str(error)
        )

    return CityHistoricalTrendsData(
        cityId=city_id,
        cityName=city_name,
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        dataSource=DATA_SOURCE,
        timeRange=time_range,
        points=_aggregate_points(observations, time_range),
        summary=_build_summary(observations),
        isSampleData=False,
        sampleNote=None,
        isDataUnavailable=False,
        apiContractNote=None,
        coordinates=coordinates,
    )


@router.get("", response_model=CityHistoricalTrendsData)
async def get_historical_by_coordinates(
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    lng: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
    time_range: Annotated[HistoricalRange, Query(alias="range")] = "6m",
) -> CityHistoricalTrendsData:
    contract_note = f"GET /api/historical?lat={lat}&lng={lng}&range={time_range}"
    return await _get_historical_response(
        "coordinates", "Selected Location", lat, lng, time_range, contract_note
    )


@router.get("/{city_id}", response_model=CityHistoricalTrendsData)
async def get_historical_by_city(
    city_id: str,
    time_range: Annotated[HistoricalRange, Query(alias="range")] = "6m",
) -> CityHistoricalTrendsData:
    normalized_city_id = city_id.lower()
    city = CITY_COORDINATES.get(normalized_city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="Unknown city ID")
    city_name, lat, lng = city
    contract_note = f"GET /api/historical/{normalized_city_id}?range={time_range}"
    return await _get_historical_response(
        normalized_city_id, city_name, lat, lng, time_range, contract_note
    )