from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone
import math
import time
from typing import Annotated, Any, Literal

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.air_quality import get_air_quality_by_coordinates
from app.weather import CITY_COORDINATES

router = APIRouter(prefix="/api/climate-risk", tags=["climate-risk"])

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"
REQUEST_TIMEOUT = httpx.Timeout(20.0, connect=5.0)
ARCHIVE_REQUEST_TIMEOUT = httpx.Timeout(90.0, connect=5.0)
ARCHIVE_CACHE_TTL_SECONDS = 12 * 60 * 60
ARCHIVE_CACHE_MAX_ENTRIES = 8
HISTORY_YEARS = 30
MIN_REFERENCE_SAMPLES = 30
_ARCHIVE_CACHE: dict[tuple[Any, ...], tuple[float, dict[str, Any]]] = {}
_ARCHIVE_IN_FLIGHT: dict[tuple[Any, ...], asyncio.Task[dict[str, Any]]] = {}
_ARCHIVE_CACHE_LOCK = asyncio.Lock()

ClimateRiskCategory = Literal["Low", "Moderate", "High", "Very High"]
HazardId = Literal["heatwave", "flood", "drought", "air_pollution"]


class RiskCategoryItem(BaseModel):
    id: HazardId
    title: str
    score: float
    category: ClimateRiskCategory
    explanation: str


class RiskCategories(BaseModel):
    heatwave: RiskCategoryItem
    flood: RiskCategoryItem
    drought: RiskCategoryItem
    airPollution: RiskCategoryItem


class CityClimateRiskOverview(BaseModel):
    cityId: str
    cityName: str
    timestamp: str
    overallScore: float
    overallCategory: ClimateRiskCategory
    categories: RiskCategories
    coordinates: dict[str, float] | None = None
    isSampleData: bool
    sampleNote: str | None = None
    isDataUnavailable: bool
    apiContractNote: str | None = None


class AssessmentUnavailable(Exception):
    """Required provider data is missing or cannot support a defensible score."""


def _clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return min(max(value, lower), upper)


def _valid_values(values: list[Any]) -> list[float]:
    result: list[float] = []
    for value in values:
        try:
            numeric = float(value)
        except (TypeError, ValueError, OverflowError):
            continue
        if math.isfinite(numeric):
            result.append(numeric)
    return result


def _quantile(values: list[float], percentile: float) -> float:
    cleaned = sorted(_valid_values(values))
    if len(cleaned) < MIN_REFERENCE_SAMPLES:
        raise AssessmentUnavailable("Not enough historical samples for a local baseline.")
    position = (len(cleaned) - 1) * percentile
    lower_index = math.floor(position)
    upper_index = math.ceil(position)
    if lower_index == upper_index:
        return cleaned[lower_index]
    fraction = position - lower_index
    return cleaned[lower_index] + (cleaned[upper_index] - cleaned[lower_index]) * fraction


def _percentile_rank(value: float, reference: list[float]) -> float:
    cleaned = _valid_values(reference)
    if len(cleaned) < MIN_REFERENCE_SAMPLES:
        raise AssessmentUnavailable("Not enough historical samples for a local percentile.")
    return 100.0 * sum(sample <= value for sample in cleaned) / len(cleaned)


def category_for_score(score: float) -> ClimateRiskCategory:
    if not math.isfinite(score) or score < 0 or score > 100:
        raise ValueError("Risk score must be finite and between 0 and 100.")
    if score < 40:
        return "Low"
    if score < 60:
        return "Moderate"
    if score < 80:
        return "High"
    return "Very High"


def score_heatwave(
    forecast_apparent_max: list[float],
    historical_warm_apparent_max: list[float],
) -> float:
    forecast_values = _valid_values(forecast_apparent_max)
    if len(forecast_values) < 3:
        raise AssessmentUnavailable("Three forecast days of apparent temperature are required.")
    p90 = _quantile(historical_warm_apparent_max, 0.90)
    p99 = _quantile(historical_warm_apparent_max, 0.99)
    hottest = max(forecast_values[:3])
    severity = 100.0 if p99 <= p90 and hottest >= p90 else (
        0.0 if p99 <= p90 else _clamp(100.0 * (hottest - p90) / (p99 - p90))
    )
    persistence = 100.0 * sum(value > p90 for value in forecast_values[:3]) / 3
    return round(_clamp(0.70 * severity + 0.30 * persistence), 1)


def score_flood(
    forecast_rain_72h: float,
    historical_rain_72h: list[float],
    soil_wetness_percentile: float,
    river_discharge: float | None = None,
    historical_river_discharge: list[float] | None = None,
) -> float:
    rainfall_score = _percentile_rank(forecast_rain_72h, historical_rain_72h)
    if not math.isfinite(soil_wetness_percentile) or not 0 <= soil_wetness_percentile <= 100:
        raise AssessmentUnavailable("Antecedent soil moisture percentile is unavailable.")

    river_reference = _valid_values(historical_river_discharge or [])
    if river_discharge is not None and river_reference:
        river_score = _percentile_rank(river_discharge, river_reference)
        score = 0.45 * rainfall_score + 0.25 * soil_wetness_percentile + 0.30 * river_score
    else:
        # Minimum-data rule: require rainfall and soil wetness, then renormalize their weights.
        score = (0.45 * rainfall_score + 0.25 * soil_wetness_percentile) / 0.70
    return round(_clamp(score), 1)


def score_drought(
    precipitation_90d: float,
    historical_precipitation_90d: list[float],
    soil_moisture_percentile: float,
    et0_to_precipitation_90d: float,
    historical_et0_to_precipitation_90d: list[float],
) -> float:
    precipitation_deficit = 100.0 - _percentile_rank(
        precipitation_90d, historical_precipitation_90d
    )
    if not math.isfinite(soil_moisture_percentile) or not 0 <= soil_moisture_percentile <= 100:
        raise AssessmentUnavailable("Soil moisture percentile is unavailable.")
    soil_deficit = 100.0 - soil_moisture_percentile
    evapotranspiration_stress = _percentile_rank(
        et0_to_precipitation_90d, historical_et0_to_precipitation_90d
    )
    score = (
        0.45 * precipitation_deficit
        + 0.35 * soil_deficit
        + 0.20 * evapotranspiration_stress
    )
    return round(_clamp(score), 1)


def score_air_pollution(aqi: float) -> float:
    if not math.isfinite(aqi) or not 0 <= aqi <= 500:
        raise AssessmentUnavailable("Air Quality API returned an invalid US AQI value.")
    return round(_clamp(aqi / 5.0), 1)


def aggregate_overall_score(scores: list[float]) -> float:
    if len(scores) != 4 or any(not math.isfinite(score) or not 0 <= score <= 100 for score in scores):
        raise AssessmentUnavailable("All four valid hazard scores are required for an overall score.")
    return round(sum(scores) / 4.0, 1)


async def _request_json(
    url: str,
    params: dict[str, Any],
    provider: str,
    timeout: httpx.Timeout | None = None,
) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=timeout or REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
    except httpx.TimeoutException as error:
        raise AssessmentUnavailable(f"{provider} request timed out ({type(error).__name__}).") from None
    except httpx.HTTPStatusError as error:
        raise AssessmentUnavailable(
            f"{provider} returned HTTP {error.response.status_code}."
        ) from None
    except httpx.RequestError as error:
        raise AssessmentUnavailable(
            f"{provider} network request failed ({type(error).__name__})."
        ) from None
    except ValueError:
        raise AssessmentUnavailable(f"{provider} returned invalid JSON.") from None

    if not isinstance(payload, dict):
        raise AssessmentUnavailable(f"{provider} returned an invalid response shape; expected a JSON object.")
    if payload.get("error"):
        reason = payload.get("reason")
        detail = f": {reason}" if isinstance(reason, str) and reason else "."
        raise AssessmentUnavailable(f"{provider} rejected the request{detail}")
    return payload


def _parse_day(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def _parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _daily_series(daily: Any, key: str) -> list[tuple[date, float]]:
    if not isinstance(daily, dict):
        return []
    times = daily.get("time")
    values = daily.get(key)
    if not isinstance(times, list) or not isinstance(values, list):
        return []
    return [
        (parsed_day, float(value))
        for day, value in zip(times, values)
        if (parsed_day := _parse_day(day)) is not None
        and value is not None
        and _is_finite_number(value)
    ]


def _hourly_series(hourly: Any, key: str) -> list[tuple[datetime, float]]:
    if not isinstance(hourly, dict):
        return []
    times = hourly.get("time")
    values = hourly.get(key)
    if not isinstance(times, list) or not isinstance(values, list):
        return []
    return [
        (parsed_time, float(value))
        for timestamp, value in zip(times, values)
        if (parsed_time := _parse_datetime(timestamp)) is not None
        and value is not None
        and _is_finite_number(value)
    ]


def _validate_historical_payload(payload: dict[str, Any]) -> None:
    required_fields = {
        "daily": (
            "temperature_2m_max",
            "apparent_temperature_max",
            "precipitation_sum",
            "et0_fao_evapotranspiration",
        ),
        "hourly": ("soil_moisture_0_to_7cm", "soil_moisture_7_to_28cm"),
    }
    for section, fields in required_fields.items():
        data = payload.get(section)
        if not isinstance(data, dict):
            raise AssessmentUnavailable(
                f"Historical Archive API response is missing the '{section}' section."
            )
        times = data.get("time")
        if not isinstance(times, list):
            raise AssessmentUnavailable(
                f"Historical Archive API response is missing '{section}.time'."
            )
        for field in fields:
            values = data.get(field)
            if not isinstance(values, list):
                raise AssessmentUnavailable(
                    f"Historical Archive API response is missing '{section}.{field}'."
                )
            valid_count = sum(_is_finite_number(value) for value in values)
            if valid_count < MIN_REFERENCE_SAMPLES:
                raise AssessmentUnavailable(
                    f"Historical Archive API returned insufficient non-null values for "
                    f"'{section}.{field}' ({valid_count}; at least {MIN_REFERENCE_SAMPLES} required)."
                )


def _archive_cache_key(params: dict[str, Any]) -> tuple[Any, ...]:
    return (
        round(float(params["latitude"]), 4),
        round(float(params["longitude"]), 4),
        params["start_date"],
        params["end_date"],
        params["models"],
        params.get("daily"),
        params.get("hourly"),
    )


def _archive_cache_now() -> float:
    return time.monotonic()


async def _load_historical_archive(
    key: tuple[Any, ...],
    params: dict[str, Any],
) -> dict[str, Any]:
    try:
        payload = await _request_json(
            ARCHIVE_URL,
            params,
            "Open-Meteo Historical Archive API",
            timeout=ARCHIVE_REQUEST_TIMEOUT,
        )
        _validate_historical_payload(payload)
        async with _ARCHIVE_CACHE_LOCK:
            now = _archive_cache_now()
            expired_keys = [
                cache_key for cache_key, (expires_at, _) in _ARCHIVE_CACHE.items()
                if expires_at <= now
            ]
            for cache_key in expired_keys:
                _ARCHIVE_CACHE.pop(cache_key, None)
            while len(_ARCHIVE_CACHE) >= ARCHIVE_CACHE_MAX_ENTRIES:
                _ARCHIVE_CACHE.pop(next(iter(_ARCHIVE_CACHE)))
            _ARCHIVE_CACHE[key] = (now + ARCHIVE_CACHE_TTL_SECONDS, payload)
        return payload
    finally:
        async with _ARCHIVE_CACHE_LOCK:
            if _ARCHIVE_IN_FLIGHT.get(key) is asyncio.current_task():
                _ARCHIVE_IN_FLIGHT.pop(key, None)


async def _request_historical_archive(params: dict[str, Any]) -> dict[str, Any]:
    key = _archive_cache_key(params)
    async with _ARCHIVE_CACHE_LOCK:
        now = _archive_cache_now()
        cached = _ARCHIVE_CACHE.get(key)
        if cached is not None:
            expires_at, payload = cached
            if expires_at > now:
                return payload
            _ARCHIVE_CACHE.pop(key, None)

        task = _ARCHIVE_IN_FLIGHT.get(key)
        if task is None:
            task = asyncio.create_task(_load_historical_archive(key, params))
            _ARCHIVE_IN_FLIGHT[key] = task

    return await asyncio.shield(task)


def _is_finite_number(value: Any) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError, OverflowError):
        return False


def _rolling_totals(series: list[tuple[date, float]], days: int) -> list[tuple[date, float]]:
    ordered = sorted(series)
    totals: list[tuple[date, float]] = []
    for index in range(days - 1, len(ordered)):
        window = ordered[index - days + 1 : index + 1]
        if len(window) == days and all(
            (window[offset][0] - window[offset - 1][0]).days == 1
            for offset in range(1, days)
        ):
            totals.append((window[-1][0], sum(value for _, value in window)))
    return totals


def _seasonal_values(series: list[tuple[date, float]], target: date, radius_days: int = 45) -> list[float]:
    target_day = target.timetuple().tm_yday
    result = []
    for sample_day, value in series:
        sample_day_of_year = sample_day.timetuple().tm_yday
        distance = abs(sample_day_of_year - target_day)
        distance = min(distance, 366 - distance)
        if distance <= radius_days:
            result.append(value)
    return result


def _warm_season_values(
    temperature_series: list[tuple[date, float]],
    apparent_series: list[tuple[date, float]],
) -> list[float]:
    monthly_totals: dict[int, list[float]] = {}
    for sample_day, value in temperature_series:
        monthly_totals.setdefault(sample_day.month, []).append(value)
    if len(monthly_totals) < 4:
        raise AssessmentUnavailable("Historical temperatures do not establish a local warm season.")
    warm_months = {
        month
        for month, _ in sorted(
            ((month, sum(values) / len(values)) for month, values in monthly_totals.items()),
            key=lambda item: item[1],
            reverse=True,
        )[:4]
    }
    return [value for sample_day, value in apparent_series if sample_day.month in warm_months]


def _forecast_soil_moisture(hourly: Any, now: datetime) -> float:
    top = _hourly_series(hourly, "soil_moisture_3_to_9cm")
    root = _hourly_series(hourly, "soil_moisture_9_to_27cm")
    top_by_time = dict(top)
    root_by_time = dict(root)
    common_times = sorted(set(top_by_time) & set(root_by_time))
    for timestamp in reversed(common_times):
        if timestamp <= now:
            return (top_by_time[timestamp] + root_by_time[timestamp]) / 2.0
    raise AssessmentUnavailable("Recent forecast soil-moisture values are unavailable.")


def _historical_soil_values(hourly: Any) -> list[tuple[date, float]]:
    top = _hourly_series(hourly, "soil_moisture_0_to_7cm")
    root = _hourly_series(hourly, "soil_moisture_7_to_28cm")
    top_by_time = dict(top)
    root_by_time = dict(root)
    return [
        (timestamp.date(), (top_by_time[timestamp] + root_by_time[timestamp]) / 2.0)
        for timestamp in set(top_by_time) & set(root_by_time)
    ]


def _past_90_day_total(series: list[tuple[date, float]], today: date) -> float:
    past = [(sample_day, value) for sample_day, value in series if sample_day < today]
    past.sort()
    values = past[-90:]
    if len(values) < 90 or any(
        (values[index][0] - values[index - 1][0]).days != 1 for index in range(1, len(values))
    ):
        raise AssessmentUnavailable("Ninety consecutive daily weather values are required.")
    return sum(value for _, value in values)


def _merge_trailing_daily_series(
    forecast_series: list[tuple[date, float]],
    archive_series: list[tuple[date, float]],
    today: date,
    days: int = 90,
) -> list[tuple[date, float]]:
    archive_by_date = dict(archive_series)
    forecast_by_date = dict(forecast_series)
    start_date = today - timedelta(days=days)
    merged = [
        (start_date + timedelta(days=offset), forecast_by_date.get(start_date + timedelta(days=offset), archive_by_date.get(start_date + timedelta(days=offset))))
        for offset in range(days)
    ]
    missing_dates = [sample_day.isoformat() for sample_day, value in merged if value is None]
    if missing_dates:
        missing_summary = ", ".join(missing_dates[:5])
        if len(missing_dates) > 5:
            missing_summary += f", and {len(missing_dates) - 5} more"
        raise AssessmentUnavailable(
            f"Trailing {days}-day weather series has missing valid values for: {missing_summary}."
        )
    return [(sample_day, value) for sample_day, value in merged if value is not None]


def _dated_forecast_values(series: list[tuple[date, float]], today: date, days: int) -> list[float]:
    values = [value for sample_day, value in sorted(series) if today <= sample_day < today + timedelta(days=days)]
    if len(values) < days:
        raise AssessmentUnavailable(f"{days} forecast days of required weather data are unavailable.")
    return values[:days]


def _explanation(item: str, details: str) -> str:
    return f"Open-Meteo model estimate; not a physical sensor reading. {item}: {details}"


def _risk_item(
    hazard_id: HazardId,
    title: str,
    score: float,
    explanation: str,
) -> RiskCategoryItem:
    return RiskCategoryItem(
        id=hazard_id,
        title=title,
        score=round(_clamp(score), 1),
        category=category_for_score(score),
        explanation=explanation,
    )


def _unavailable_response(
    city_id: str,
    city_name: str,
    coordinates: dict[str, float],
    contract_note: str,
    reason: str,
) -> CityClimateRiskOverview:
    descriptions = {
        "heatwave": "Heatwave assessment unavailable: " + reason,
        "flood": "Flood assessment unavailable: " + reason,
        "drought": "Drought assessment unavailable: " + reason,
        "air_pollution": "Air-pollution assessment unavailable: " + reason,
    }
    return CityClimateRiskOverview(
        cityId=city_id,
        cityName=city_name,
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        overallScore=0,
        overallCategory="Low",
        categories=RiskCategories(
            heatwave=RiskCategoryItem(
                id="heatwave", title="Heatwave Risk", score=0, category="Low",
                explanation=descriptions["heatwave"],
            ),
            flood=RiskCategoryItem(
                id="flood", title="Flood Risk", score=0, category="Low",
                explanation=descriptions["flood"],
            ),
            drought=RiskCategoryItem(
                id="drought", title="Drought Risk", score=0, category="Low",
                explanation=descriptions["drought"],
            ),
            airPollution=RiskCategoryItem(
                id="air_pollution", title="Air Pollution Risk", score=0, category="Low",
                explanation=descriptions["air_pollution"],
            ),
        ),
        coordinates=coordinates,
        isSampleData=False,
        sampleNote=None,
        isDataUnavailable=True,
        apiContractNote=contract_note,
    )


async def _build_assessment(
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
    contract_note: str,
) -> CityClimateRiskOverview:
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    history_start = today.replace(
        year=today.year - HISTORY_YEARS,
        day=min(today.day, 28) if today.month == 2 else today.day,
    )
    history_end = today - timedelta(days=5)
    forecast_params = {
        "latitude": lat,
        "longitude": lng,
        "daily": "temperature_2m_max,apparent_temperature_max,precipitation_sum,et0_fao_evapotranspiration",
        "hourly": "soil_moisture_3_to_9cm,soil_moisture_9_to_27cm",
        "past_days": 92,
        "forecast_days": 3,
        "timezone": "UTC",
        "timeformat": "iso8601",
    }
    archive_params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": history_start.isoformat(),
        "end_date": history_end.isoformat(),
        "daily": "temperature_2m_max,apparent_temperature_max,precipitation_sum,et0_fao_evapotranspiration",
        "hourly": "soil_moisture_0_to_7cm,soil_moisture_7_to_28cm",
        "models": "era5",
        "timezone": "UTC",
        "timeformat": "iso8601",
    }
    flood_params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": history_start.isoformat(),
        "end_date": (today + timedelta(days=2)).isoformat(),
        "daily": "river_discharge",
        "timezone": "UTC",
        "timeformat": "iso8601",
    }

    forecast_result, archive_result, flood_result, air_result = await asyncio.gather(
        _request_json(FORECAST_URL, forecast_params, "Open-Meteo Forecast API"),
        _request_historical_archive(archive_params),
        _request_json(FLOOD_URL, flood_params, "Open-Meteo Flood API"),
        get_air_quality_by_coordinates(lat, lng),
        return_exceptions=True,
    )
    for result in (forecast_result, archive_result, air_result):
        if isinstance(result, Exception):
            detail = result.detail if isinstance(result, HTTPException) else str(result)
            raise AssessmentUnavailable(str(detail)) from None
    flood_payload = flood_result if isinstance(flood_result, dict) else None
    forecast = forecast_result
    archive = archive_result

    forecast_daily = forecast.get("daily")
    archive_daily = archive.get("daily")
    archive_hourly = archive.get("hourly")
    forecast_hourly = forecast.get("hourly")
    forecast_apparent = _dated_forecast_values(
        _daily_series(forecast_daily, "apparent_temperature_max"), today, 3
    )
    historical_temperature = _daily_series(archive_daily, "temperature_2m_max")
    historical_apparent = _daily_series(archive_daily, "apparent_temperature_max")
    warm_apparent = _warm_season_values(historical_temperature, historical_apparent)
    heat_score = score_heatwave(forecast_apparent, warm_apparent)
    heat_p90 = _quantile(warm_apparent, 0.90)
    heat_days = sum(value > heat_p90 for value in forecast_apparent)
    heat_item = _risk_item(
        "heatwave",
        "Heatwave Risk",
        heat_score,
        _explanation(
            "Three-day apparent-temperature severity and persistence",
            f"maximum {max(forecast_apparent):.1f}°C versus local warm-season P90 {heat_p90:.1f}°C; "
            f"{heat_days} of 3 forecast days exceed P90",
        ),
    )

    forecast_rain = _dated_forecast_values(
        _daily_series(forecast_daily, "precipitation_sum"), today, 3
    )
    historical_rain = _rolling_totals(
        _daily_series(archive_daily, "precipitation_sum"), 3
    )
    rainfall_reference = _seasonal_values(historical_rain, today)
    rain_72h = sum(forecast_rain)

    current_soil = _forecast_soil_moisture(forecast_hourly, now)
    historical_soil = _seasonal_values(_historical_soil_values(archive_hourly), today)
    soil_percentile = _percentile_rank(current_soil, historical_soil)

    river_current: float | None = None
    river_reference: list[float] = []
    if flood_payload is not None:
        flood_daily = flood_payload.get("daily")
        discharge_series = _daily_series(flood_daily, "river_discharge")
        river_forecast = [
            value for sample_day, value in discharge_series
            if today <= sample_day < today + timedelta(days=3)
        ]
        river_reference = _seasonal_values(
            [(sample_day, value) for sample_day, value in discharge_series if sample_day < today],
            today,
        )
        if river_forecast and len(_valid_values(river_reference)) >= MIN_REFERENCE_SAMPLES:
            river_current = max(river_forecast)
    flood_score = score_flood(
        rain_72h,
        rainfall_reference,
        soil_percentile,
        river_current,
        river_reference,
    )
    flood_details = (
        f"72-hour rainfall {rain_72h:.1f} mm is at historical P"
        f"{_percentile_rank(rain_72h, rainfall_reference):.0f}; soil wetness is at P{soil_percentile:.0f}"
    )
    if river_current is None:
        flood_details += "; river discharge unavailable, so rainfall and wetness weights were renormalized"
    else:
        flood_details += f"; forecast discharge {river_current:.1f} m³/s"
    flood_item = _risk_item(
        "flood", "Flood Risk", flood_score, _explanation("Rainfall and catchment wetness", flood_details)
    )

    historical_precipitation_90d = _seasonal_values(
        _rolling_totals(_daily_series(archive_daily, "precipitation_sum"), 90), today
    )
    precipitation_90d_series = _merge_trailing_daily_series(
        _daily_series(forecast_daily, "precipitation_sum"),
        _daily_series(archive_daily, "precipitation_sum"),
        today,
    )
    precipitation_90d = _past_90_day_total(precipitation_90d_series, today)
    historical_et0 = _daily_series(archive_daily, "et0_fao_evapotranspiration")
    historical_precip = _daily_series(archive_daily, "precipitation_sum")
    precipitation_90d_history = _rolling_totals(historical_precip, 90)
    historical_et0_90d = _rolling_totals(historical_et0, 90)
    et0_90d_by_day = dict(historical_et0_90d)
    precip_90d_by_day = dict(precipitation_90d_history)
    historical_stress = _seasonal_values(
        [
            (sample_day, et0_90d_by_day[sample_day] / max(precip_90d_by_day[sample_day], 1.0))
            for sample_day in et0_90d_by_day.keys() & precip_90d_by_day.keys()
        ],
        today,
    )
    et0_90d_series = _merge_trailing_daily_series(
        _daily_series(forecast_daily, "et0_fao_evapotranspiration"),
        _daily_series(archive_daily, "et0_fao_evapotranspiration"),
        today,
    )
    et0_90d = _past_90_day_total(et0_90d_series, today)
    stress_ratio = et0_90d / max(precipitation_90d, 1.0)
    drought_score = score_drought(
        precipitation_90d,
        historical_precipitation_90d,
        soil_percentile,
        stress_ratio,
        historical_stress,
    )
    precipitation_percentile = _percentile_rank(precipitation_90d, historical_precipitation_90d)
    drought_item = _risk_item(
        "drought",
        "Drought Risk",
        drought_score,
        _explanation(
            "Ninety-day precipitation deficit, soil moisture, and ET₀ stress",
            f"precipitation {precipitation_90d:.1f} mm is at P{precipitation_percentile:.0f}; "
            f"soil moisture is at P{soil_percentile:.0f}; ET₀/precipitation is {stress_ratio:.2f}",
        ),
    )

    air_score = score_air_pollution(float(air_result.aqi))
    air_item = _risk_item(
        "air_pollution",
        "Air Pollution Risk",
        air_score,
        _explanation(
            "Current US AQI normalized linearly to 0–100",
            f"AQI {float(air_result.aqi):.0f} maps to risk score {air_score:.1f}; "
            f"US AQI category is {air_result.category}",
        ),
    )

    items = [heat_item, flood_item, drought_item, air_item]
    overall_score = aggregate_overall_score([item.score for item in items])
    return CityClimateRiskOverview(
        cityId=city_id,
        cityName=city_name,
        timestamp=now.isoformat().replace("+00:00", "Z"),
        overallScore=overall_score,
        overallCategory=category_for_score(overall_score),
        categories=RiskCategories(
            heatwave=heat_item,
            flood=flood_item,
            drought=drought_item,
            airPollution=air_item,
        ),
        coordinates={"lat": lat, "lng": lng},
        # The existing frontend otherwise labels every non-demo response "Live Sensor".
        isSampleData=True,
        sampleNote="Open-Meteo model estimates; not physical sensor readings or official risk assessments.",
        isDataUnavailable=False,
        apiContractNote=None,
    )


async def _get_climate_risk(
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
    contract_note: str,
) -> CityClimateRiskOverview:
    try:
        return await _build_assessment(city_id, city_name, lat, lng, contract_note)
    except AssessmentUnavailable as error:
        return _unavailable_response(
            city_id, city_name, {"lat": lat, "lng": lng}, contract_note, str(error)
        )
    except (KeyError, TypeError, ValueError, OverflowError) as error:
        return _unavailable_response(
            city_id,
            city_name,
            {"lat": lat, "lng": lng},
            contract_note,
            f"Provider data could not be validated ({type(error).__name__}).",
        )


@router.get("", response_model=CityClimateRiskOverview)
async def get_climate_risk_by_coordinates(
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    lng: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
) -> CityClimateRiskOverview:
    contract_note = f"GET /api/climate-risk?lat={lat:.4f}&lng={lng:.4f}"
    return await _get_climate_risk("coordinates", "Selected Location", lat, lng, contract_note)


@router.get("/{city_id}", response_model=CityClimateRiskOverview)
async def get_climate_risk_by_city(city_id: str) -> CityClimateRiskOverview:
    normalized_city_id = city_id.lower()
    city = CITY_COORDINATES.get(normalized_city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="Unknown city ID")
    city_name, lat, lng = city
    contract_note = f"GET /api/climate-risk/{normalized_city_id}"
    return await _get_climate_risk(normalized_city_id, city_name, lat, lng, contract_note)