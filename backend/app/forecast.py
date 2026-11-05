from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import json
import math
import time
from typing import Annotated, Any, Literal

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.weather import CITY_COORDINATES

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT = httpx.Timeout(20.0, connect=5.0)
MAX_ATTEMPTS = 3
RETRY_BASE_SECONDS = 0.5
RETRY_MAX_SECONDS = 8.0
CACHE_TTL_SECONDS = 30 * 60
CACHE_MAX_ENTRIES = 32

RainfallRiskCategory = Literal["Low", "Moderate", "High", "Very High"]
DAILY_FIELDS = (
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "precipitation_sum",
    "weather_code",
)
_CACHE: dict[tuple[Any, ...], tuple[float, dict[str, Any]]] = {}
_IN_FLIGHT: dict[tuple[Any, ...], asyncio.Task[dict[str, Any]]] = {}
_CACHE_LOCK = asyncio.Lock()


class WeatherCondition(BaseModel):
    code: str
    label: str
    icon: str


class ForecastDay(BaseModel):
    date: str
    dayLabel: str
    fullDateLabel: str
    maxTempCelsius: float
    minTempCelsius: float
    condition: WeatherCondition
    rainfallProbability: float
    expectedRainfallMm: float


class RainfallRiskOverview(BaseModel):
    level: RainfallRiskCategory
    score: float
    explanation: str
    totalWeeklyRainfallMm: float
    peakDay: str


class SevenDayForecastData(BaseModel):
    cityId: str
    cityName: str
    timestamp: str
    days: list[ForecastDay]
    rainfallRisk: RainfallRiskOverview
    isSampleData: bool
    sampleNote: str | None = None
    isDataUnavailable: bool
    apiContractNote: str | None = None
    coordinates: dict[str, float] | None = None


class ForecastUnavailable(Exception):
    """The provider response cannot support a complete forecast contract."""


def _is_finite_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
    )


def rainfall_risk_category(score: float) -> RainfallRiskCategory:
    if not math.isfinite(score) or not 0 <= score <= 100:
        raise ValueError("Rainfall risk score must be finite and between 0 and 100.")
    if score < 25:
        return "Low"
    if score < 50:
        return "Moderate"
    if score < 75:
        return "High"
    return "Very High"


def calculate_rainfall_risk(
    days: list[ForecastDay],
) -> RainfallRiskOverview:
    """Score rain burden as 60% weekly volume and 40% peak daily probability.

    Volume component scales linearly to 100 mm/week and caps at 100 points.
    Levels are Low <25, Moderate 25-<50, High 50-<75, Very High >=75.
    """
    if len(days) != 7:
        raise ForecastUnavailable("Exactly seven valid daily records are required for rainfall risk.")
    total_rainfall = sum(day.expectedRainfallMm for day in days)
    max_probability = max(day.rainfallProbability for day in days)
    volume_component = min(total_rainfall, 100.0)
    score = round(0.60 * volume_component + 0.40 * max_probability, 1)
    peak_index = max(range(7), key=lambda index: days[index].expectedRainfallMm)
    peak_day = "None" if total_rainfall == 0 else f"Day {peak_index + 1}"
    explanation = (
        "Rainfall risk score = 60% of weekly rainfall volume (scaled linearly to 100 points "
        "at 100 mm/week and capped) + 40% of the highest daily precipitation probability. "
        f"Weekly total: {total_rainfall:.1f} mm; peak daily probability: {max_probability:.0f}%."
    )
    return RainfallRiskOverview(
        level=rainfall_risk_category(score),
        score=score,
        explanation=explanation,
        totalWeeklyRainfallMm=round(total_rainfall, 1),
        peakDay=peak_day,
    )


def _condition_for_wmo_code(code: int) -> WeatherCondition:
    conditions = {
        0: ("Clear sky", "Sun"),
        1: ("Mainly clear", "SunMedium"),
        2: ("Partly cloudy", "CloudSun"),
        3: ("Overcast", "CloudFog"),
        45: ("Fog", "CloudFog"),
        48: ("Depositing rime fog", "CloudFog"),
        51: ("Light drizzle", "CloudDrizzle"),
        53: ("Moderate drizzle", "CloudDrizzle"),
        55: ("Dense drizzle", "CloudDrizzle"),
        56: ("Light freezing drizzle", "CloudDrizzle"),
        57: ("Dense freezing drizzle", "CloudDrizzle"),
        61: ("Slight rain", "CloudRain"),
        63: ("Moderate rain", "CloudRain"),
        65: ("Heavy rain", "CloudRain"),
        66: ("Light freezing rain", "CloudRain"),
        67: ("Heavy freezing rain", "CloudRain"),
        71: ("Slight snowfall", "CloudRain"),
        73: ("Moderate snowfall", "CloudRain"),
        75: ("Heavy snowfall", "CloudRain"),
        77: ("Snow grains", "CloudRain"),
        80: ("Slight rain showers", "CloudDrizzle"),
        81: ("Moderate rain showers", "CloudRain"),
        82: ("Violent rain showers", "CloudRain"),
        85: ("Slight snow showers", "CloudRain"),
        86: ("Heavy snow showers", "CloudRain"),
        95: ("Thunderstorm", "CloudRain"),
        96: ("Thunderstorm with slight hail", "CloudRain"),
        97: ("Heavy thunderstorm", "CloudRain"),
        99: ("Thunderstorm with heavy hail", "CloudRain"),
    }
    label, icon = conditions.get(code, ("Unknown conditions", "CloudSun"))
    return WeatherCondition(code=str(code), label=label, icon=icon)


def _parse_wmo_code(value: Any) -> int:
    if not _is_finite_number(value) or int(value) != float(value):
        raise ForecastUnavailable("Forecast provider returned an invalid weather code.")
    return int(value)


def _validate_payload(payload: dict[str, Any]) -> tuple[list[date], dict[str, list[Any]], timezone]:
    daily = payload.get("daily")
    if not isinstance(daily, dict) or not isinstance(daily.get("time"), list):
        raise ForecastUnavailable("Forecast provider response is missing daily dates.")
    dates: list[date] = []
    try:
        dates = [date.fromisoformat(value) for value in daily["time"]]
    except (TypeError, ValueError):
        raise ForecastUnavailable("Forecast provider returned an invalid daily date.") from None
    if len(dates) != 7 or len(set(dates)) != 7 or dates != sorted(dates):
        raise ForecastUnavailable("Forecast provider must return seven unique chronological dates.")
    if any((dates[index] - dates[index - 1]).days != 1 for index in range(1, len(dates))):
        raise ForecastUnavailable("Forecast provider dates must cover seven consecutive calendar days.")

    values: dict[str, list[Any]] = {}
    for field in DAILY_FIELDS:
        series = daily.get(field)
        if not isinstance(series, list) or len(series) != len(dates):
            raise ForecastUnavailable(f"Forecast provider response is missing or misaligned '{field}'.")
        values[field] = series

    timezone_name = payload.get("timezone")
    utc_offset_seconds = payload.get("utc_offset_seconds")
    if not isinstance(timezone_name, str) or not timezone_name:
        raise ForecastUnavailable("Forecast provider response is missing its location timezone.")
    if not _is_finite_number(utc_offset_seconds) or int(utc_offset_seconds) != float(utc_offset_seconds):
        raise ForecastUnavailable("Forecast provider response is missing a valid local UTC offset.")
    location_timezone = timezone(timedelta(seconds=int(utc_offset_seconds)))

    for field in DAILY_FIELDS[:-1]:
        if not all(_is_finite_number(value) for value in values[field]):
            raise ForecastUnavailable(f"Forecast provider returned missing or invalid values for '{field}'.")
    for probability in values["precipitation_probability_max"]:
        if not 0 <= float(probability) <= 100:
            raise ForecastUnavailable("Forecast precipitation probability must be between 0 and 100.")
    for rainfall in values["precipitation_sum"]:
        if float(rainfall) < 0:
            raise ForecastUnavailable("Forecast precipitation amounts cannot be negative.")
    for code in values["weather_code"]:
        _parse_wmo_code(code)
    return dates, values, location_timezone


def _build_forecast_days(
    dates: list[date],
    values: dict[str, list[Any]],
    location_timezone: timezone,
    now: datetime | None = None,
) -> list[ForecastDay]:
    local_today = (now or datetime.now(timezone.utc)).astimezone(location_timezone).date()
    records: list[ForecastDay] = []
    for index, forecast_date in enumerate(dates):
        day_label = "Today" if forecast_date == local_today else forecast_date.strftime("%a")
        records.append(
            ForecastDay(
                date=forecast_date.isoformat(),
                dayLabel=day_label,
                fullDateLabel=f"{forecast_date.day} {forecast_date.strftime('%b')}",
                maxTempCelsius=round(float(values["temperature_2m_max"][index]), 1),
                minTempCelsius=round(float(values["temperature_2m_min"][index]), 1),
                condition=_condition_for_wmo_code(_parse_wmo_code(values["weather_code"][index])),
                rainfallProbability=round(float(values["precipitation_probability_max"][index]), 1),
                expectedRainfallMm=round(float(values["precipitation_sum"][index]), 1),
            )
        )
    return records


def _retry_after_seconds(response: httpx.Response, attempt: int) -> float:
    raw_value = response.headers.get("Retry-After")
    if raw_value:
        try:
            delay = float(raw_value)
        except ValueError:
            try:
                retry_time = parsedate_to_datetime(raw_value)
                if retry_time.tzinfo is None:
                    retry_time = retry_time.replace(tzinfo=timezone.utc)
                delay = (retry_time - datetime.now(timezone.utc)).total_seconds()
            except (TypeError, ValueError, OverflowError):
                delay = RETRY_BASE_SECONDS * (2**attempt)
    else:
        delay = RETRY_BASE_SECONDS * (2**attempt)
    return min(max(delay, 0.0), RETRY_MAX_SECONDS)


async def _fetch_payload(params: dict[str, Any]) -> dict[str, Any]:
    for attempt in range(MAX_ATTEMPTS):
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.get(OPEN_METEO_URL, params=params)
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as error:
            status = error.response.status_code
            if status == 429 and attempt + 1 < MAX_ATTEMPTS:
                await asyncio.sleep(_retry_after_seconds(error.response, attempt))
                continue
            if 500 <= status < 600 and attempt + 1 < MAX_ATTEMPTS:
                await asyncio.sleep(RETRY_BASE_SECONDS * 2**attempt)
                continue
            raise ForecastUnavailable(f"Open-Meteo Forecast API returned HTTP {status}.") from None
        except httpx.TimeoutException as error:
            if attempt + 1 < MAX_ATTEMPTS:
                await asyncio.sleep(RETRY_BASE_SECONDS * 2**attempt)
                continue
            raise ForecastUnavailable(
                f"Open-Meteo Forecast API timed out ({type(error).__name__})."
            ) from None
        except httpx.RequestError as error:
            if attempt + 1 < MAX_ATTEMPTS:
                await asyncio.sleep(RETRY_BASE_SECONDS * 2**attempt)
                continue
            raise ForecastUnavailable(
                f"Open-Meteo Forecast API network failure ({type(error).__name__})."
            ) from None
        except ValueError:
            raise ForecastUnavailable("Open-Meteo Forecast API returned invalid JSON.") from None

        if not isinstance(payload, dict) or payload.get("error"):
            reason = payload.get("reason") if isinstance(payload, dict) else None
            suffix = f": {reason}" if isinstance(reason, str) and reason else "."
            raise ForecastUnavailable(f"Open-Meteo Forecast API rejected the request{suffix}")
        _validate_payload(payload)
        return payload
    raise ForecastUnavailable(f"Open-Meteo Forecast API failed after {MAX_ATTEMPTS} attempts.")


def _cache_key(lat: float, lng: float) -> tuple[float, float, str]:
    return lat, lng, "daily-7d-v1"


async def _load_cached_forecast(key: tuple[float, float, str], params: dict[str, Any]) -> dict[str, Any]:
    try:
        payload = await _fetch_payload(params)
        async with _CACHE_LOCK:
            now = time.monotonic()
            expired = [cache_key for cache_key, (expires_at, _) in _CACHE.items() if expires_at <= now]
            for cache_key in expired:
                _CACHE.pop(cache_key, None)
            while len(_CACHE) >= CACHE_MAX_ENTRIES:
                _CACHE.pop(next(iter(_CACHE)))
            _CACHE[key] = (now + CACHE_TTL_SECONDS, payload)
        return payload
    finally:
        async with _CACHE_LOCK:
            if _IN_FLIGHT.get(key) is asyncio.current_task():
                _IN_FLIGHT.pop(key, None)


async def _get_forecast_payload(lat: float, lng: float) -> dict[str, Any]:
    key = _cache_key(lat, lng)
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": ",".join(DAILY_FIELDS),
        "forecast_days": 7,
        "timezone": "auto",
        "timeformat": "iso8601",
    }
    async with _CACHE_LOCK:
        now = time.monotonic()
        cached = _CACHE.get(key)
        if cached is not None:
            expires_at, payload = cached
            if expires_at > now:
                return payload
            _CACHE.pop(key, None)
        task = _IN_FLIGHT.get(key)
        if task is None:
            task = asyncio.create_task(_load_cached_forecast(key, params))
            _IN_FLIGHT[key] = task
    return await asyncio.shield(task)


def _unavailable_response(
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
    contract_note: str,
    reason: str,
) -> SevenDayForecastData:
    return SevenDayForecastData(
        cityId=city_id,
        cityName=city_name,
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        days=[],
        rainfallRisk=RainfallRiskOverview(
            level="Low",
            score=0,
            explanation=f"Rainfall risk unavailable: {reason}",
            totalWeeklyRainfallMm=0,
            peakDay="None",
        ),
        isSampleData=False,
        sampleNote=None,
        isDataUnavailable=True,
        apiContractNote=f"{contract_note}. {reason}",
        coordinates={"lat": lat, "lng": lng},
    )


async def _build_response(
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
    contract_note: str,
) -> SevenDayForecastData:
    try:
        payload = await _get_forecast_payload(lat, lng)
        dates, values, local_timezone = _validate_payload(payload)
        days = _build_forecast_days(dates, values, local_timezone)
        rainfall_risk = calculate_rainfall_risk(days)
    except ForecastUnavailable as error:
        return _unavailable_response(city_id, city_name, lat, lng, contract_note, str(error))

    return SevenDayForecastData(
        cityId=city_id,
        cityName=city_name,
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        days=days,
        rainfallRisk=rainfall_risk,
        isSampleData=False,
        sampleNote=None,
        isDataUnavailable=False,
        apiContractNote=None,
        coordinates={"lat": lat, "lng": lng},
    )


@router.get("", response_model=SevenDayForecastData)
async def get_forecast_by_coordinates(
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    lng: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
) -> SevenDayForecastData:
    contract_note = f"GET /api/forecast?lat={lat}&lng={lng}"
    return await _build_response("coordinates", "Selected Location", lat, lng, contract_note)


@router.get("/{city_id}", response_model=SevenDayForecastData)
async def get_forecast_by_city(city_id: str) -> SevenDayForecastData:
    normalized_city_id = city_id.lower()
    city = CITY_COORDINATES.get(normalized_city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="Unknown city ID")
    city_name, lat, lng = city
    contract_note = f"GET /api/forecast/{normalized_city_id}"
    return await _build_response(normalized_city_id, city_name, lat, lng, contract_note)