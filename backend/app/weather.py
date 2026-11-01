from datetime import datetime, timezone
import math
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/weather", tags=["weather"])

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT = httpx.Timeout(8.0, connect=3.0)

CITY_COORDINATES: dict[str, tuple[str, float, float]] = {
    "delhi": ("New Delhi", 28.6139, 77.2090),
    "mumbai": ("Mumbai", 19.0760, 72.8777),
    "pune": ("Pune", 18.5204, 73.8567),
    "bengaluru": ("Bengaluru", 12.9716, 77.5946),
    "hyderabad": ("Hyderabad", 17.3850, 78.4867),
    "chennai": ("Chennai", 13.0827, 80.2707),
    "kolkata": ("Kolkata", 22.5726, 88.3639),
    "ahmedabad": ("Ahmedabad", 23.0225, 72.5714),
    "jaipur": ("Jaipur", 26.9124, 75.7873),
    "lucknow": ("Lucknow", 26.8467, 80.9462),
}


class WeatherCondition(BaseModel):
    code: str
    label: str
    icon: str


class CurrentWeather(BaseModel):
    cityId: str
    cityName: str
    timestamp: str
    temperatureCelsius: float
    feelsLikeCelsius: float
    humidityPercent: float
    windSpeedKmh: float
    windDirectionDeg: float
    windDirectionLabel: str
    pressureHpa: float
    uvIndex: float
    visibilityKm: float
    condition: WeatherCondition
    coordinates: dict[str, float] | None = None


def _condition_for_code(code: int) -> WeatherCondition:
    conditions = {
        0: ("Clear sky", "Sun"),
        1: ("Mainly clear", "Sun"),
        2: ("Partly cloudy", "CloudSun"),
        3: ("Overcast", "Cloud"),
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
        71: ("Slight snow", "CloudSnow"),
        73: ("Moderate snow", "CloudSnow"),
        75: ("Heavy snow", "CloudSnow"),
        77: ("Snow grains", "CloudSnow"),
        80: ("Slight rain showers", "CloudRain"),
        81: ("Moderate rain showers", "CloudRain"),
        82: ("Violent rain showers", "CloudRain"),
        85: ("Slight snow showers", "CloudSnow"),
        86: ("Heavy snow showers", "CloudSnow"),
        95: ("Thunderstorm", "CloudLightning"),
        96: ("Thunderstorm with slight hail", "CloudLightning"),
        99: ("Thunderstorm with heavy hail", "CloudLightning"),
    }
    label, icon = conditions.get(code, ("Unknown conditions", "Cloud"))
    return WeatherCondition(code=str(code), label=label, icon=icon)


def _wind_direction_label(degrees: float) -> str:
    compass_points = (
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
    )
    return compass_points[round(degrees % 360 / 22.5) % len(compass_points)]


def _timestamp_utc(value: Any) -> str:
    if not isinstance(value, str):
        raise ValueError("Missing observation time")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


async def _fetch_current(lat: float, lng: float) -> dict[str, Any]:
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": (
            "temperature_2m,apparent_temperature,relative_humidity_2m,"
            "wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,"
            "visibility,weather_code"
        ),
        "wind_speed_unit": "kmh",
        "timezone": "UTC",
        "timeformat": "iso8601",
    }
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(
            status_code=503,
            detail="Weather provider is unavailable or returned an invalid response.",
        ) from None

    if not isinstance(payload, dict) or payload.get("error"):
        raise HTTPException(
            status_code=503,
            detail="Weather provider is unavailable or returned an invalid response.",
        )
    current = payload.get("current")
    if not isinstance(current, dict):
        raise HTTPException(status_code=503, detail="Weather provider returned no current conditions.")
    return current


def _build_weather(
    current: dict[str, Any],
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
) -> CurrentWeather:
    fields = {
        "temperature_2m": "temperatureCelsius",
        "apparent_temperature": "feelsLikeCelsius",
        "relative_humidity_2m": "humidityPercent",
        "wind_speed_10m": "windSpeedKmh",
        "wind_direction_10m": "windDirectionDeg",
        "surface_pressure": "pressureHpa",
        "uv_index": "uvIndex",
        "visibility": "visibilityKm",
        "weather_code": "condition",
    }
    missing = [key for key in fields if current.get(key) is None]
    if missing or current.get("time") is None:
        raise HTTPException(
            status_code=503,
            detail="Weather provider returned incomplete current conditions.",
        )

    try:
        readings = {key: float(current[key]) for key in fields if key != "weather_code"}
        if not all(math.isfinite(value) for value in readings.values()):
            raise ValueError("Non-finite weather reading")
        weather_code = int(current["weather_code"])
        timestamp = _timestamp_utc(current["time"])
    except (TypeError, ValueError, OverflowError):
        raise HTTPException(
            status_code=503,
            detail="Weather provider returned invalid current conditions.",
        ) from None

    return CurrentWeather(
        cityId=city_id,
        cityName=city_name,
        timestamp=timestamp,
        temperatureCelsius=readings["temperature_2m"],
        feelsLikeCelsius=readings["apparent_temperature"],
        humidityPercent=readings["relative_humidity_2m"],
        windSpeedKmh=readings["wind_speed_10m"],
        windDirectionDeg=readings["wind_direction_10m"],
        windDirectionLabel=_wind_direction_label(readings["wind_direction_10m"]),
        pressureHpa=readings["surface_pressure"],
        uvIndex=readings["uv_index"],
        visibilityKm=readings["visibility"] / 1000,
        condition=_condition_for_code(weather_code),
        coordinates={"lat": lat, "lng": lng},
    )


@router.get("", response_model=CurrentWeather)
async def get_weather_by_coordinates(
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    lng: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
) -> CurrentWeather:
    current = await _fetch_current(lat, lng)
    return _build_weather(current, "coordinates", "Selected Location", lat, lng)


@router.get("/{city_id}", response_model=CurrentWeather)
async def get_weather_by_city(city_id: str) -> CurrentWeather:
    normalized_city_id = city_id.lower()
    city = CITY_COORDINATES.get(normalized_city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="Unknown city ID")
    city_name, lat, lng = city
    current = await _fetch_current(lat, lng)
    return _build_weather(current, normalized_city_id, city_name, lat, lng)