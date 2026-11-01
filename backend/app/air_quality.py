from datetime import datetime, timezone
import math
from typing import Annotated, Any, Literal

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.weather import CITY_COORDINATES

router = APIRouter(prefix="/api/air-quality", tags=["air-quality"])

OPEN_METEO_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
REQUEST_TIMEOUT = httpx.Timeout(8.0, connect=3.0)
CURRENT_FIELDS = (
    "us_aqi,us_aqi_pm2_5,us_aqi_pm10,us_aqi_nitrogen_dioxide,"
    "us_aqi_ozone,us_aqi_sulphur_dioxide,us_aqi_carbon_monoxide,"
    "pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
)

POLLUTANTS: dict[str, dict[str, str | float]] = {
    "pm25": {
        "provider_field": "pm2_5",
        "aqi_field": "us_aqi_pm2_5",
        "name": "Fine Particulate Matter",
        "chemicalFormula": "PM2.5",
        "unit": "µg/m³",
        "standardLimit": 60,
        "dominant_name": "PM2.5",
    },
    "pm10": {
        "provider_field": "pm10",
        "aqi_field": "us_aqi_pm10",
        "name": "Coarse Particulate Matter",
        "chemicalFormula": "PM10",
        "unit": "µg/m³",
        "standardLimit": 100,
        "dominant_name": "PM10",
    },
    "no2": {
        "provider_field": "nitrogen_dioxide",
        "aqi_field": "us_aqi_nitrogen_dioxide",
        "name": "Nitrogen Dioxide",
        "chemicalFormula": "NO₂",
        "unit": "µg/m³",
        "standardLimit": 80,
        "dominant_name": "NO₂",
    },
    "so2": {
        "provider_field": "sulphur_dioxide",
        "aqi_field": "us_aqi_sulphur_dioxide",
        "name": "Sulfur Dioxide",
        "chemicalFormula": "SO₂",
        "unit": "µg/m³",
        "standardLimit": 80,
        "dominant_name": "SO₂",
    },
    "co": {
        "provider_field": "carbon_monoxide",
        "aqi_field": "us_aqi_carbon_monoxide",
        "name": "Carbon Monoxide",
        "chemicalFormula": "CO",
        "unit": "mg/m³",
        "standardLimit": 2,
        "dominant_name": "CO",
    },
    "o3": {
        "provider_field": "ozone",
        "aqi_field": "us_aqi_ozone",
        "name": "Surface Ozone",
        "chemicalFormula": "O₃",
        "unit": "µg/m³",
        "standardLimit": 100,
        "dominant_name": "O₃",
    },
}


class AirPollutant(BaseModel):
    code: Literal["pm25", "pm10", "no2", "so2", "co", "o3"]
    name: str
    chemicalFormula: str
    value: float
    unit: str
    standardLimit: float
    status: Literal["good", "moderate", "poor", "hazardous"]


class AirQualityData(BaseModel):
    cityId: str
    cityName: str
    timestamp: str
    aqi: float
    category: Literal[
        "Good",
        "Moderate",
        "Unhealthy for Sensitive Groups",
        "Unhealthy",
        "Very Unhealthy",
        "Hazardous",
    ]
    dominantPollutant: str
    pollutants: dict[str, AirPollutant]
    healthAdvisory: str
    coordinates: dict[str, float] | None = None


def _timestamp_utc(value: Any) -> str:
    if not isinstance(value, str):
        raise ValueError("Missing observation time")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _category_for_aqi(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def _health_advisory_for_aqi(aqi: float) -> str:
    if aqi <= 50:
        return "Air quality is satisfactory, and air pollution poses little or no risk."
    if aqi <= 100:
        return "Air quality is acceptable; unusually sensitive people may experience minor symptoms."
    if aqi <= 150:
        return "Sensitive groups may experience health effects; children, older adults, and people with heart or lung disease should limit prolonged outdoor exertion."
    if aqi <= 200:
        return "Everyone may begin to experience health effects; sensitive groups may experience more serious effects. Reduce prolonged or heavy outdoor exertion."
    if aqi <= 300:
        return "Health alert: everyone may experience more serious health effects. Avoid prolonged or heavy outdoor exertion."
    return "Health warning of emergency conditions: everyone is more likely to be affected. Avoid outdoor activity and follow local health guidance."


def _pollutant_status(value: float, standard_limit: float) -> str:
    ratio = value / standard_limit
    if ratio <= 0.5:
        return "good"
    if ratio <= 1:
        return "moderate"
    if ratio <= 2.5:
        return "poor"
    return "hazardous"


async def _fetch_current(lat: float, lng: float) -> dict[str, Any]:
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": CURRENT_FIELDS,
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
            detail="Air quality provider is unavailable or returned an invalid response.",
        ) from None

    if not isinstance(payload, dict) or payload.get("error"):
        raise HTTPException(
            status_code=503,
            detail="Air quality provider is unavailable or returned an invalid response.",
        )
    current = payload.get("current")
    if not isinstance(current, dict):
        raise HTTPException(status_code=503, detail="Air quality provider returned no current conditions.")
    return current


def _build_air_quality(
    current: dict[str, Any],
    city_id: str,
    city_name: str,
    lat: float,
    lng: float,
) -> AirQualityData:
    required_fields = ["us_aqi", "time"]
    for pollutant in POLLUTANTS.values():
        required_fields.extend([str(pollutant["provider_field"]), str(pollutant["aqi_field"])])
    if any(current.get(field) is None for field in required_fields):
        raise HTTPException(
            status_code=503,
            detail="Air quality provider returned incomplete current conditions.",
        )

    try:
        aqi = float(current["us_aqi"])
        if not math.isfinite(aqi) or not 0 <= aqi <= 500:
            raise ValueError("Invalid AQI")
        timestamp = _timestamp_utc(current["time"])
        pollutant_values: dict[str, float] = {}
        pollutant_aqis: dict[str, float] = {}
        for code, pollutant in POLLUTANTS.items():
            value = float(current[str(pollutant["provider_field"])])
            component_aqi = float(current[str(pollutant["aqi_field"])])
            if not math.isfinite(value) or value < 0 or not math.isfinite(component_aqi) or component_aqi < 0:
                raise ValueError("Invalid pollutant reading")
            pollutant_values[code] = value
            pollutant_aqis[code] = component_aqi
    except (TypeError, ValueError, OverflowError):
        raise HTTPException(
            status_code=503,
            detail="Air quality provider returned invalid current conditions.",
        ) from None

    pollutants: dict[str, AirPollutant] = {}
    for code, metadata in POLLUTANTS.items():
        standard_limit = float(metadata["standardLimit"])
        value = pollutant_values[code]
        if code == "co":
            value /= 1000
        pollutants[code] = AirPollutant(
            code=code,
            name=str(metadata["name"]),
            chemicalFormula=str(metadata["chemicalFormula"]),
            value=value,
            unit=str(metadata["unit"]),
            standardLimit=standard_limit,
            status=_pollutant_status(value, standard_limit),
        )

    dominant_code = max(pollutant_aqis, key=pollutant_aqis.get)
    dominant_pollutant = str(POLLUTANTS[dominant_code]["dominant_name"])
    return AirQualityData(
        cityId=city_id,
        cityName=city_name,
        timestamp=timestamp,
        aqi=aqi,
        category=_category_for_aqi(aqi),
        dominantPollutant=dominant_pollutant,
        pollutants=pollutants,
        healthAdvisory=_health_advisory_for_aqi(aqi),
        coordinates={"lat": lat, "lng": lng},
    )


@router.get("", response_model=AirQualityData)
async def get_air_quality_by_coordinates(
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    lng: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
) -> AirQualityData:
    current = await _fetch_current(lat, lng)
    return _build_air_quality(current, "coordinates", "Selected Location", lat, lng)


@router.get("/{city_id}", response_model=AirQualityData)
async def get_air_quality_by_city(city_id: str) -> AirQualityData:
    normalized_city_id = city_id.lower()
    city = CITY_COORDINATES.get(normalized_city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="Unknown city ID")
    city_name, lat, lng = city
    current = await _fetch_current(lat, lng)
    return _build_air_quality(current, normalized_city_id, city_name, lat, lng)