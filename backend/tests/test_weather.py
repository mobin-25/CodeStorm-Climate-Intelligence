import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


CURRENT_WEATHER = {
    "time": "2026-11-01T12:00",
    "temperature_2m": 24.5,
    "apparent_temperature": 25.1,
    "relative_humidity_2m": 61,
    "wind_speed_10m": 8.4,
    "wind_direction_10m": 90,
    "surface_pressure": 1008.2,
    "uv_index": 3.2,
    "visibility": 10000,
    "weather_code": 2,
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

    async def get(self, _url, params):
        self.request_url = _url
        self.params = params
        return self.response


class WeatherApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_coordinate_endpoint_matches_current_weather_contract(self):
        response = FakeResponse({"current": CURRENT_WEATHER})
        client = FakeAsyncClient(response)
        with patch("app.weather.httpx.AsyncClient", return_value=client):
            result = self.client.get("/api/weather?lat=19.076&lng=72.8777")

        self.assertEqual(result.status_code, 200)
        data = result.json()
        self.assertEqual(
            set(data),
            {
                "cityId", "cityName", "timestamp", "temperatureCelsius",
                "feelsLikeCelsius", "humidityPercent", "windSpeedKmh",
                "windDirectionDeg", "windDirectionLabel", "pressureHpa",
                "uvIndex", "visibilityKm", "condition", "coordinates",
            },
        )
        self.assertEqual(data["condition"], {"code": "2", "label": "Partly cloudy", "icon": "CloudSun"})
        self.assertEqual(data["windDirectionLabel"], "E")
        self.assertEqual(data["visibilityKm"], 10)
        self.assertEqual(data["timestamp"], "2026-11-01T12:00:00Z")
        self.assertEqual(client.request_url, "https://api.open-meteo.com/v1/forecast")

    def test_city_endpoint_uses_baseline_city_mapping(self):
        response = FakeResponse({"current": CURRENT_WEATHER})
        client = FakeAsyncClient(response)
        with patch("app.weather.httpx.AsyncClient", return_value=client):
            result = self.client.get("/api/weather/DELHI")

        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["cityId"], "delhi")
        self.assertEqual(result.json()["cityName"], "New Delhi")
        self.assertEqual(client.params["latitude"], 28.6139)
        self.assertEqual(client.params["longitude"], 77.209)

    def test_invalid_coordinates_return_422(self):
        result = self.client.get("/api/weather?lat=91&lng=0")
        self.assertEqual(result.status_code, 422)

    def test_unknown_city_returns_404(self):
        result = self.client.get("/api/weather/not-a-city")
        self.assertEqual(result.status_code, 404)

    def test_provider_timeout_returns_503(self):
        import httpx

        response = FakeResponse(None, error=httpx.ReadTimeout("provider timed out"))
        with patch("app.weather.httpx.AsyncClient", return_value=FakeAsyncClient(response)):
            result = self.client.get("/api/weather/pune")

        self.assertEqual(result.status_code, 503)

    def test_missing_provider_values_return_503(self):
        incomplete = dict(CURRENT_WEATHER)
        incomplete["uv_index"] = None
        response = FakeResponse({"current": incomplete})
        with patch("app.weather.httpx.AsyncClient", return_value=FakeAsyncClient(response)):
            result = self.client.get("/api/weather/chennai")

        self.assertEqual(result.status_code, 503)


if __name__ == "__main__":
    unittest.main()