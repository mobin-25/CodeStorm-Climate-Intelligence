import unittest
from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app.forecast import (
    CACHE_TTL_SECONDS,
    _CACHE,
    _IN_FLIGHT,
    ForecastDay,
    ForecastUnavailable,
    _build_forecast_days,
    _condition_for_wmo_code,
    _get_forecast_payload,
    calculate_rainfall_risk,
    rainfall_risk_category,
)
from app.main import app


def make_payload(*, start_date=None, timezone_name="Asia/Kolkata"):
    offset = timedelta(seconds=19800 if timezone_name == "Asia/Kolkata" else 0)
    today_local = start_date or (datetime.now(timezone.utc) + offset).date()
    dates = [today_local + timedelta(days=index) for index in range(7)]
    return {
        "timezone": timezone_name,
        "utc_offset_seconds": 19800 if timezone_name == "Asia/Kolkata" else 0,
        "daily": {
            "time": [day.isoformat() for day in dates],
            "temperature_2m_max": [30 + index for index in range(7)],
            "temperature_2m_min": [20 + index for index in range(7)],
            "precipitation_probability_max": [index * 10 for index in range(7)],
            "precipitation_sum": [float(index) for index in range(7)],
            "weather_code": [0, 1, 2, 3, 61, 95, 99],
        },
    }


class ForecastApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        _CACHE.clear()
        _IN_FLIGHT.clear()

    def tearDown(self):
        _CACHE.clear()
        _IN_FLIGHT.clear()

    def test_city_endpoint_returns_frontend_response_contract(self):
        payload = make_payload()
        with patch("app.forecast._get_forecast_payload", new=AsyncMock(return_value=payload)):
            response = self.client.get("/api/forecast/MUMBAI")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["cityId"], "mumbai")
        self.assertEqual(body["cityName"], "Mumbai")
        self.assertEqual(body["coordinates"], {"lat": 19.076, "lng": 72.8777})
        self.assertEqual(
            set(body),
            {
                "cityId", "cityName", "timestamp", "days", "rainfallRisk", "isSampleData",
                "sampleNote", "isDataUnavailable", "apiContractNote", "coordinates",
            },
        )
        self.assertEqual(
            set(body["days"][0]),
            {
                "date", "dayLabel", "fullDateLabel", "maxTempCelsius", "minTempCelsius",
                "condition", "rainfallProbability", "expectedRainfallMm",
            },
        )
        self.assertEqual(
            set(body["rainfallRisk"]),
            {"level", "score", "explanation", "totalWeeklyRainfallMm", "peakDay"},
        )
        self.assertFalse(body["isSampleData"])
        self.assertFalse(body["isDataUnavailable"])
        self.assertEqual(len(body["days"]), 7)

    def test_coordinate_endpoint_maps_location_and_provider_query(self):
        payload = make_payload()
        with patch("app.forecast._get_forecast_payload", new=AsyncMock(return_value=payload)) as fetch:
            response = self.client.get("/api/forecast?lat=19.076&lng=72.8777")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["cityId"], "coordinates")
        self.assertEqual(body["cityName"], "Selected Location")
        self.assertEqual(body["coordinates"], {"lat": 19.076, "lng": 72.8777})
        fetch.assert_awaited_once_with(19.076, 72.8777)

    def test_coordinate_endpoint_preserves_input_precision(self):
        latitude = 19.076123456789
        longitude = 72.877712345678
        payload = make_payload()
        with patch("app.forecast._get_forecast_payload", new=AsyncMock(return_value=payload)) as fetch:
            response = self.client.get(f"/api/forecast?lat={latitude}&lng={longitude}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["coordinates"], {"lat": latitude, "lng": longitude})
        fetch.assert_awaited_once_with(latitude, longitude)

    def test_unknown_city_returns_404(self):
        response = self.client.get("/api/forecast/not-a-city")
        self.assertEqual(response.status_code, 404)

    def test_invalid_coordinates_return_422(self):
        for query in ("lat=91&lng=0", "lat=0&lng=181", "lat=-91&lng=0", "lat=0&lng=-181"):
            with self.subTest(query=query):
                response = self.client.get(f"/api/forecast?{query}")
                self.assertEqual(response.status_code, 422)

    def test_exactly_seven_chronological_days_and_local_labels(self):
        zone = timezone(timedelta(seconds=19800))
        today_local = datetime.now(timezone.utc).astimezone(zone).date()
        payload = make_payload(start_date=today_local)
        dates, values, resolved_zone = _validate_for_test(payload)
        days = _build_forecast_days(
            dates,
            values,
            resolved_zone,
            now=datetime.combine(today_local, datetime.min.time(), zone),
        )
        self.assertEqual(len(days), 7)
        self.assertEqual([date.fromisoformat(item.date) for item in days], sorted(date.fromisoformat(item.date) for item in days))
        self.assertEqual(days[0].dayLabel, "Today")
        self.assertEqual(days[0].fullDateLabel, f"{today_local.day} {today_local.strftime('%b')}")
        self.assertEqual(days[0].condition.icon, "Sun")

    def test_weather_code_mapping_uses_frontend_icon_names(self):
        self.assertEqual(_condition_for_wmo_code(0).model_dump(), {"code": "0", "label": "Clear sky", "icon": "Sun"})
        self.assertEqual(_condition_for_wmo_code(1).model_dump(), {"code": "1", "label": "Mainly clear", "icon": "SunMedium"})
        self.assertEqual(_condition_for_wmo_code(2).model_dump(), {"code": "2", "label": "Partly cloudy", "icon": "CloudSun"})
        self.assertEqual(_condition_for_wmo_code(3).model_dump(), {"code": "3", "label": "Overcast", "icon": "CloudFog"})
        self.assertEqual(_condition_for_wmo_code(45).model_dump(), {"code": "45", "label": "Fog", "icon": "CloudFog"})
        self.assertEqual(_condition_for_wmo_code(48).label, "Depositing rime fog")
        self.assertEqual(_condition_for_wmo_code(51).icon, "CloudDrizzle")
        self.assertEqual(_condition_for_wmo_code(56).icon, "CloudDrizzle")
        self.assertEqual(_condition_for_wmo_code(61).icon, "CloudRain")
        self.assertEqual(_condition_for_wmo_code(66).icon, "CloudRain")
        self.assertEqual(_condition_for_wmo_code(71).label, "Slight snowfall")
        self.assertEqual(_condition_for_wmo_code(77).label, "Snow grains")
        self.assertEqual(_condition_for_wmo_code(80).icon, "CloudDrizzle")
        self.assertEqual(_condition_for_wmo_code(85).label, "Slight snow showers")
        self.assertEqual(_condition_for_wmo_code(95).label, "Thunderstorm")
        self.assertEqual(_condition_for_wmo_code(96).label, "Thunderstorm with slight hail")
        self.assertEqual(_condition_for_wmo_code(97).label, "Heavy thunderstorm")
        self.assertEqual(_condition_for_wmo_code(99).label, "Thunderstorm with heavy hail")
        self.assertEqual(_condition_for_wmo_code(999).icon, "CloudSun")

    def test_rainfall_risk_threshold_boundaries(self):
        cases = {
            0: "Low",
            24.9: "Low",
            25: "Moderate",
            49.9: "Moderate",
            50: "High",
            74.9: "High",
            75: "Very High",
            100: "Very High",
        }
        for score, category in cases.items():
            with self.subTest(score=score):
                self.assertEqual(rainfall_risk_category(score), category)

    def test_rainfall_risk_weekly_total_and_peak_day(self):
        days = [_day(index, rainfall) for index, rainfall in enumerate([0, 1, 4, 3, 2, 8, 1])]
        risk = calculate_rainfall_risk(days)
        self.assertEqual(risk.totalWeeklyRainfallMm, 19.0)
        self.assertEqual(risk.peakDay, "Day 6")
        self.assertEqual(risk.score, round(0.6 * 19 + 0.4 * 60, 1))
        self.assertIn("60%", risk.explanation)

    def test_zero_rain_has_zero_low_risk_and_no_peak(self):
        days = [_day(index, 0, probability=0) for index in range(7)]
        risk = calculate_rainfall_risk(days)
        self.assertEqual(risk.level, "Low")
        self.assertEqual(risk.score, 0)
        self.assertEqual(risk.totalWeeklyRainfallMm, 0)
        self.assertEqual(risk.peakDay, "None")

    def test_missing_provider_data_returns_unavailable_contract(self):
        async def unavailable(*_args):
            raise ForecastUnavailable("Forecast provider missing precipitation values.")

        with patch("app.forecast._get_forecast_payload", new=AsyncMock(side_effect=unavailable)):
            response = self.client.get("/api/forecast/mumbai")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["isDataUnavailable"])
        self.assertFalse(body["isSampleData"])
        self.assertEqual(body["days"], [])
        self.assertIn("missing precipitation", body["apiContractNote"])

    def test_malformed_provider_data_returns_unavailable(self):
        payload = make_payload()
        payload["daily"]["precipitation_sum"][3] = None
        with patch("app.forecast._get_forecast_payload", new=AsyncMock(return_value=payload)):
            response = self.client.get("/api/forecast/mumbai")
        self.assertTrue(response.json()["isDataUnavailable"])
        self.assertEqual(response.json()["days"], [])

    def test_nonconsecutive_provider_dates_return_unavailable(self):
        payload = make_payload()
        payload["daily"]["time"][6] = (date.fromisoformat(payload["daily"]["time"][6]) + timedelta(days=2)).isoformat()
        with patch("app.forecast._get_forecast_payload", new=AsyncMock(return_value=payload)):
            response = self.client.get("/api/forecast/mumbai")
        self.assertTrue(response.json()["isDataUnavailable"])
        self.assertEqual(response.json()["days"], [])
        self.assertIn("consecutive", response.json()["apiContractNote"])

    def test_provider_timeout_is_converted_to_unavailable_response(self):
        async def timeout(*_args):
            raise ForecastUnavailable("Open-Meteo Forecast API timed out (ReadTimeout).")

        with patch("app.forecast._get_forecast_payload", new=AsyncMock(side_effect=timeout)):
            response = self.client.get("/api/forecast/mumbai")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["isDataUnavailable"])
        self.assertIn("timed out", response.json()["apiContractNote"])

    def test_provider_request_uses_seven_days_and_local_timezone(self):
        payload = make_payload()
        request = AsyncMock(return_value=payload)
        with patch("app.forecast._fetch_payload", new=request):
            response = self.client.get("/api/forecast?lat=19.076&lng=72.8777")
        self.assertEqual(response.status_code, 200)
        request.assert_awaited_once()
        params = request.await_args.args[0]
        self.assertEqual(params["forecast_days"], 7)
        self.assertEqual(params["timezone"], "auto")
        self.assertEqual(
            params["daily"],
            "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code",
        )

    def test_successful_provider_payload_is_cached(self):
        payload = make_payload()
        request = AsyncMock(return_value=payload)
        with patch("app.forecast._fetch_payload", new=request):
            first = asyncio_run(_get_forecast_payload(19.076, 72.8777))
            second = asyncio_run(_get_forecast_payload(19.076, 72.8777))
        self.assertIs(first, payload)
        self.assertIs(second, payload)
        request.assert_awaited_once()

    def test_provider_http_failure_is_diagnostic_and_unavailable(self):
        request = httpx.Request("GET", "https://api.open-meteo.com/v1/forecast")
        response = httpx.Response(502, request=request)
        error = httpx.HTTPStatusError("upstream failure", request=request, response=response)
        with patch("app.forecast.httpx.AsyncClient", side_effect=lambda **_kwargs: _FakeClient(error=error)):
            with self.assertRaisesRegex(ForecastUnavailable, "HTTP 502"):
                asyncio_run(_fetch_payload_for_test())


def _day(index, rainfall, probability=None):
    forecast_date = date(2026, 11, 5) + timedelta(days=index)
    return ForecastDay(
        date=forecast_date.isoformat(),
        dayLabel=forecast_date.strftime("%a"),
        fullDateLabel=f"{forecast_date.day} {forecast_date.strftime('%b')}",
        maxTempCelsius=30,
        minTempCelsius=20,
        condition=_condition_for_wmo_code(0),
        rainfallProbability=probability if probability is not None else index * 10,
        expectedRainfallMm=rainfall,
    )


def _validate_for_test(payload):
    from app.forecast import _validate_payload
    return _validate_payload(payload)


async def _fetch_payload_for_test():
    from app.forecast import _fetch_payload
    return await _fetch_payload({"latitude": 19.0, "longitude": 72.0})


def asyncio_run(awaitable):
    import asyncio
    return asyncio.run(awaitable)


class _FakeClient:
    def __init__(self, *, error):
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False

    async def get(self, *_args, **_kwargs):
        raise self.error


if __name__ == "__main__":
    unittest.main()
