import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.air_quality import CURRENT_FIELDS, OPEN_METEO_URL
from app.air_quality import _category_for_aqi, _health_advisory_for_aqi


CURRENT_AIR_QUALITY = {
    "time": "2026-11-01T12:00",
    "us_aqi": 84,
    "us_aqi_pm2_5": 84,
    "us_aqi_pm10": 42,
    "us_aqi_nitrogen_dioxide": 12,
    "us_aqi_ozone": 30,
    "us_aqi_sulphur_dioxide": 5,
    "us_aqi_carbon_monoxide": 2,
    "pm2_5": 28.5,
    "pm10": 52.0,
    "nitrogen_dioxide": 24.0,
    "sulphur_dioxide": 8.0,
    "carbon_monoxide": 750.0,
    "ozone": 36.0,
}


class FakeResponse:
    def __init__(self, payload, error=None):
        self.payload = payload
        self.error = error

    def raise_for_status(self):
        if self.error:
            raise self.error

    def json(self):
        return self.payload


class FakeAsyncClient:
    def __init__(self, response):
        self.response = response

    async def __aenter__(self):
        return self

    async def __aexit__(self, _exc_type, _exc_value, _traceback):
        self.exit_args = (_exc_type, _exc_value, _traceback)
        return False

    async def get(self, url, params):
        self.request_url = url
        self.params = params
        return self.response


class AirQualityApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_coordinate_endpoint_maps_provider_data_to_frontend_contract(self):
        provider = FakeAsyncClient(FakeResponse({"current": CURRENT_AIR_QUALITY}))
        with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
            response = self.client.get("/api/air-quality?lat=19.076&lng=72.8777")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            set(data),
            {
                "cityId", "cityName", "timestamp", "aqi", "category",
                "dominantPollutant", "pollutants", "healthAdvisory", "coordinates",
            },
        )
        self.assertEqual(data["aqi"], 84)
        self.assertEqual(data["category"], "Moderate")
        self.assertEqual(data["dominantPollutant"], "PM2.5")
        self.assertEqual(data["pollutants"]["pm25"]["value"], 28.5)
        self.assertEqual(data["pollutants"]["pm25"]["unit"], "µg/m³")
        self.assertEqual(data["pollutants"]["co"]["value"], 0.75)
        self.assertEqual(data["pollutants"]["co"]["unit"], "mg/m³")
        self.assertEqual(data["pollutants"]["no2"]["value"], 24)
        self.assertEqual(data["pollutants"]["so2"]["value"], 8)
        self.assertEqual(data["pollutants"]["o3"]["value"], 36)
        self.assertEqual(data["timestamp"], "2026-11-01T12:00:00Z")
        self.assertEqual(provider.request_url, OPEN_METEO_URL)
        self.assertEqual(provider.params["current"], CURRENT_FIELDS)
        self.assertEqual(provider.params["timezone"], "UTC")

    def test_us_aqi_category_breakpoints(self):
        expected_categories = {
            50: "Good",
            51: "Moderate",
            100: "Moderate",
            101: "Unhealthy for Sensitive Groups",
            150: "Unhealthy for Sensitive Groups",
            151: "Unhealthy",
            200: "Unhealthy",
            201: "Very Unhealthy",
            300: "Very Unhealthy",
            301: "Hazardous",
            500: "Hazardous",
        }
        for aqi, expected in expected_categories.items():
            with self.subTest(aqi=aqi):
                self.assertEqual(_category_for_aqi(aqi), expected)

    def test_aqi_220_keeps_provider_value_and_is_very_unhealthy(self):
        current = dict(CURRENT_AIR_QUALITY, us_aqi=220)
        provider = FakeAsyncClient(FakeResponse({"current": current}))
        with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
            response = self.client.get("/api/air-quality?lat=19.076&lng=72.8777")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["aqi"], 220)
        self.assertEqual(response.json()["category"], "Very Unhealthy")
        self.assertIn("Health alert", response.json()["healthAdvisory"])

    def test_health_advisory_matches_us_aqi_levels(self):
        self.assertIn("little or no risk", _health_advisory_for_aqi(50))
        self.assertIn("Sensitive groups", _health_advisory_for_aqi(101))
        self.assertIn("Everyone may begin", _health_advisory_for_aqi(151))
        self.assertIn("Health alert", _health_advisory_for_aqi(201))
        self.assertIn("emergency conditions", _health_advisory_for_aqi(301))

    def test_aqi_outside_us_range_returns_503_without_clamping(self):
        for aqi in (-1, 501):
            with self.subTest(aqi=aqi):
                current = dict(CURRENT_AIR_QUALITY, us_aqi=aqi)
                provider = FakeAsyncClient(FakeResponse({"current": current}))
                with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
                    response = self.client.get("/api/air-quality/mumbai")
                self.assertEqual(response.status_code, 503)

    def test_city_endpoint_reuses_weather_city_coordinates(self):
        provider = FakeAsyncClient(FakeResponse({"current": CURRENT_AIR_QUALITY}))
        with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
            response = self.client.get("/api/air-quality/DELHI")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["cityId"], "delhi")
        self.assertEqual(data["cityName"], "New Delhi")
        self.assertEqual(provider.params["latitude"], 28.6139)
        self.assertEqual(provider.params["longitude"], 77.209)

    def test_invalid_coordinates_return_422(self):
        response = self.client.get("/api/air-quality?lat=-91&lng=0")
        self.assertEqual(response.status_code, 422)

    def test_unknown_city_returns_404(self):
        response = self.client.get("/api/air-quality/not-a-city")
        self.assertEqual(response.status_code, 404)

    def test_provider_timeout_returns_503(self):
        provider = FakeAsyncClient(FakeResponse(None, httpx.ReadTimeout("timeout")))
        with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
            response = self.client.get("/api/air-quality/pune")
        self.assertEqual(response.status_code, 503)

    def test_provider_http_error_returns_503(self):
        request = httpx.Request("GET", OPEN_METEO_URL)
        provider = FakeAsyncClient(
            FakeResponse(None, httpx.HTTPStatusError("provider error", request=request, response=httpx.Response(502)))
        )
        with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
            response = self.client.get("/api/air-quality/pune")
        self.assertEqual(response.status_code, 503)

    def test_missing_and_malformed_values_return_503(self):
        incomplete = dict(CURRENT_AIR_QUALITY)
        del incomplete["pm2_5"]
        malformed = dict(CURRENT_AIR_QUALITY)
        malformed["ozone"] = "not-a-number"

        for current in (incomplete, malformed):
            with self.subTest(current=current):
                provider = FakeAsyncClient(FakeResponse({"current": current}))
                with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
                    response = self.client.get("/api/air-quality/mumbai")
                self.assertEqual(response.status_code, 503)

    def test_malformed_provider_json_returns_503(self):
        class InvalidJsonResponse(FakeResponse):
            def json(self):
                raise ValueError("invalid json")

        provider = FakeAsyncClient(InvalidJsonResponse(None))
        with patch("app.air_quality.httpx.AsyncClient", return_value=provider):
            response = self.client.get("/api/air-quality/mumbai")
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()