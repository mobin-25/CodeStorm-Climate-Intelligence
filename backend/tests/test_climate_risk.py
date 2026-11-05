import asyncio
import unittest
from datetime import date, datetime, time, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app.climate_risk import (
    AssessmentUnavailable,
    ARCHIVE_URL,
    ARCHIVE_CACHE_TTL_SECONDS,
    ARCHIVE_REQUEST_TIMEOUT,
    _ARCHIVE_CACHE,
    _ARCHIVE_IN_FLIGHT,
    CityClimateRiskOverview,
    FLOOD_URL,
    FORECAST_URL,
    RiskCategories,
    RiskCategoryItem,
    aggregate_overall_score,
    category_for_score,
    score_air_pollution,
    score_drought,
    score_flood,
    score_heatwave,
    _request_json,
    _request_historical_archive,
    _merge_trailing_daily_series,
    _past_90_day_total,
    _validate_historical_payload,
)
from app.main import app


def make_overview(city_id="delhi", city_name="New Delhi", lat=28.6139, lng=77.209):
    return CityClimateRiskOverview(
        cityId=city_id,
        cityName=city_name,
        timestamp="2026-11-05T00:00:00Z",
        overallScore=50,
        overallCategory="Moderate",
        categories=RiskCategories(
            heatwave=RiskCategoryItem(
                id="heatwave", title="Heatwave Risk", score=40,
                category="Moderate", explanation="modeled estimate",
            ),
            flood=RiskCategoryItem(
                id="flood", title="Flood Risk", score=50,
                category="Moderate", explanation="modeled estimate",
            ),
            drought=RiskCategoryItem(
                id="drought", title="Drought Risk", score=60,
                category="High", explanation="modeled estimate",
            ),
            airPollution=RiskCategoryItem(
                id="air_pollution", title="Air Pollution Risk", score=50,
                category="Moderate", explanation="modeled estimate",
            ),
        ),
        coordinates={"lat": lat, "lng": lng},
        isSampleData=True,
        sampleNote="Open-Meteo model estimates",
        isDataUnavailable=False,
    )


class FakeResponse:
    def __init__(self, payload=None, error=None):
        self.payload = payload if payload is not None else {"current": {}}
        self.error = error

    def raise_for_status(self):
        if self.error:
            raise self.error

    def json(self):
        return self.payload


class FakeAsyncClient:
    def __init__(self, response=None, error=None, **_kwargs):
        self.response = response
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, _exc_type, _exc_value, _traceback):
        return False

    async def get(self, _url, params):
        self.params = params
        if self.error:
            raise self.error
        return self.response


class ClimateRiskScoringTests(unittest.TestCase):
    def test_category_boundaries(self):
        self.assertEqual(category_for_score(0), "Low")
        self.assertEqual(category_for_score(39.9), "Low")
        self.assertEqual(category_for_score(40), "Moderate")
        self.assertEqual(category_for_score(59.9), "Moderate")
        self.assertEqual(category_for_score(60), "High")
        self.assertEqual(category_for_score(79.9), "High")
        self.assertEqual(category_for_score(80), "Very High")
        self.assertEqual(category_for_score(100), "Very High")

    def test_heatwave_score_uses_severity_and_persistence(self):
        history = [float(value) for value in range(100)]
        score = score_heatwave([100, 90, 80], history)
        self.assertEqual(score, 90.0)

    def test_flood_score_uses_all_weights_when_discharge_exists(self):
        history = [float(value) for value in range(100)]
        score = score_flood(89, history, 50, 79, history)
        self.assertEqual(score, 77.0)

    def test_flood_score_renormalizes_when_discharge_is_unavailable(self):
        history = [float(value) for value in range(100)]
        score = score_flood(89, history, 50)
        self.assertEqual(score, 75.7)

    def test_drought_score_uses_precipitation_soil_and_et0_weights(self):
        history = [float(value) for value in range(100)]
        score = score_drought(20, history, 30, 80, history)
        self.assertEqual(score, 76.2)

    def test_air_pollution_normalizes_us_aqi_without_reusing_its_category(self):
        self.assertEqual(score_air_pollution(250), 50.0)

    def test_overall_score_is_mean_of_four_hazards(self):
        self.assertEqual(aggregate_overall_score([10, 20, 30, 40]), 25.0)


class TrailingDailySeriesMergeTests(unittest.TestCase):
    def setUp(self):
        self.today = date(2026, 11, 5)
        self.start = self.today - timedelta(days=90)
        self.window = [self.start + timedelta(days=offset) for offset in range(90)]

    def test_merges_archive_and_forecast_by_calendar_date(self):
        archive = [(day, 1.0) for day in self.window[:60]]
        forecast = [(day, 2.0) for day in self.window[30:]]

        merged = _merge_trailing_daily_series(forecast, archive, self.today)

        self.assertEqual(len(merged), 90)
        self.assertEqual([day for day, _ in merged], self.window)
        self.assertEqual(merged[20][1], 1.0)
        self.assertEqual(merged[70][1], 2.0)

    def test_valid_forecast_values_take_precedence_on_overlapping_dates(self):
        archive = [(day, 1.0) for day in self.window]
        forecast = [(day, 9.0) for day in self.window[40:]]

        merged = _merge_trailing_daily_series(forecast, archive, self.today)

        self.assertEqual(merged[39][1], 1.0)
        self.assertEqual(merged[40][1], 9.0)
        self.assertEqual(merged[-1][1], 9.0)

    def test_archive_fills_earlier_missing_forecast_dates(self):
        archive = [(day, float(index + 1)) for index, day in enumerate(self.window[:35])]
        forecast = [(day, 100.0) for day in self.window[35:]]

        merged = _merge_trailing_daily_series(forecast, archive, self.today)

        self.assertEqual(merged[:35], archive)
        self.assertTrue(all(value == 100.0 for _, value in merged[35:]))

    def test_exactly_90_consecutive_merged_days_can_be_summed(self):
        archive = [(day, 1.0) for day in self.window[:40]]
        forecast = [(day, 2.0) for day in self.window[40:]]

        merged = _merge_trailing_daily_series(forecast, archive, self.today)

        self.assertEqual(len(merged), 90)
        self.assertEqual(_past_90_day_total(merged, self.today), 140.0)

    def test_missing_calendar_day_after_merge_remains_unavailable(self):
        missing_day = self.window[17]
        archive = [(day, 1.0) for day in self.window if day != missing_day]
        forecast = []

        with self.assertRaisesRegex(
            AssessmentUnavailable,
            f"missing valid values for: {missing_day.isoformat()}",
        ):
            _merge_trailing_daily_series(forecast, archive, self.today)

    def test_precipitation_and_et0_merge_independently(self):
        archive_precipitation = [(day, 1.0) for day in self.window]
        forecast_precipitation = [(day, 2.0) for day in self.window[30:]]
        archive_et0 = [(day, 4.0) for day in self.window]
        forecast_et0 = [(day, 3.0) for day in self.window[40:]]

        precipitation = _merge_trailing_daily_series(
            forecast_precipitation, archive_precipitation, self.today
        )
        et0 = _merge_trailing_daily_series(forecast_et0, archive_et0, self.today)

        self.assertEqual(_past_90_day_total(precipitation, self.today), 150.0)
        self.assertEqual(_past_90_day_total(et0, self.today), 310.0)


def archive_request_params(lat=19.076, lng=72.8777):
    return {
        "latitude": lat,
        "longitude": lng,
        "start_date": "1996-11-05",
        "end_date": "2026-10-31",
        "daily": "temperature_2m_max,apparent_temperature_max,precipitation_sum,et0_fao_evapotranspiration",
        "hourly": "soil_moisture_0_to_7cm,soil_moisture_7_to_28cm",
        "models": "era5",
        "timezone": "UTC",
    }


def valid_archive_payload():
    dates = [f"2020-01-{day:02d}" for day in range(1, 31)]
    return {
        "daily": {
            "time": dates,
            "temperature_2m_max": [30.0] * 30,
            "apparent_temperature_max": [32.0] * 30,
            "precipitation_sum": [1.0] * 30,
            "et0_fao_evapotranspiration": [2.0] * 30,
        },
        "hourly": {
            "time": [f"{day}T12:00" for day in dates],
            "soil_moisture_0_to_7cm": [0.2] * 30,
            "soil_moisture_7_to_28cm": [0.25] * 30,
        },
    }


class HistoricalArchiveCacheTests(unittest.TestCase):
    def setUp(self):
        _ARCHIVE_CACHE.clear()
        _ARCHIVE_IN_FLIGHT.clear()

    def tearDown(self):
        _ARCHIVE_CACHE.clear()
        _ARCHIVE_IN_FLIGHT.clear()

    def test_archive_timeout_is_90_seconds_with_five_second_connect_timeout(self):
        self.assertEqual(ARCHIVE_REQUEST_TIMEOUT.read, 90.0)
        self.assertEqual(ARCHIVE_REQUEST_TIMEOUT.connect, 5.0)

    def test_repeated_request_uses_cached_payload(self):
        payload = valid_archive_payload()
        request = AsyncMock(return_value=payload)
        with patch("app.climate_risk._request_json", new=request):
            first = asyncio.run(_request_historical_archive(archive_request_params()))
            second = asyncio.run(_request_historical_archive(archive_request_params()))

        self.assertIs(first, payload)
        self.assertIs(second, payload)
        request.assert_awaited_once()
        self.assertIs(request.await_args.kwargs["timeout"], ARCHIVE_REQUEST_TIMEOUT)

    def test_cache_expires_after_twelve_hours(self):
        clock = [1000.0]
        request = AsyncMock(return_value=valid_archive_payload())
        with (
            patch("app.climate_risk._archive_cache_now", side_effect=lambda: clock[0]),
            patch("app.climate_risk._request_json", new=request),
        ):
            asyncio.run(_request_historical_archive(archive_request_params()))
            clock[0] += ARCHIVE_CACHE_TTL_SECONDS - 1
            asyncio.run(_request_historical_archive(archive_request_params()))
            self.assertEqual(request.await_count, 1)
            clock[0] += 2
            asyncio.run(_request_historical_archive(archive_request_params()))

        self.assertEqual(request.await_count, 2)

    def test_different_coordinates_have_separate_cache_entries(self):
        request = AsyncMock(return_value=valid_archive_payload())
        with patch("app.climate_risk._request_json", new=request):
            asyncio.run(_request_historical_archive(archive_request_params(19.0760, 72.8777)))
            asyncio.run(_request_historical_archive(archive_request_params(19.0762, 72.8777)))

        self.assertEqual(request.await_count, 2)

    def test_failed_or_incomplete_responses_are_not_cached(self):
        payload = valid_archive_payload()
        request = AsyncMock(
            side_effect=[AssessmentUnavailable("provider failed"), payload]
        )
        with patch("app.climate_risk._request_json", new=request):
            with self.assertRaisesRegex(AssessmentUnavailable, "provider failed"):
                asyncio.run(_request_historical_archive(archive_request_params()))
            result = asyncio.run(_request_historical_archive(archive_request_params()))
        self.assertIs(result, payload)
        self.assertEqual(request.await_count, 2)

        _ARCHIVE_CACHE.clear()
        incomplete_request = AsyncMock(side_effect=[{}, valid_archive_payload()])
        with patch("app.climate_risk._request_json", new=incomplete_request):
            with self.assertRaisesRegex(AssessmentUnavailable, "missing the 'daily' section"):
                asyncio.run(_request_historical_archive(archive_request_params()))
            asyncio.run(_request_historical_archive(archive_request_params()))
        self.assertEqual(incomplete_request.await_count, 2)

    def test_concurrent_identical_requests_share_one_download(self):
        async def delayed_request(*_args, **_kwargs):
            await asyncio.sleep(0.01)
            return valid_archive_payload()

        request = AsyncMock(side_effect=delayed_request)

        async def fetch_twice():
            params = archive_request_params()
            return await asyncio.gather(
                _request_historical_archive(params),
                _request_historical_archive(dict(params)),
            )

        with patch("app.climate_risk._request_json", new=request):
            first, second = asyncio.run(fetch_twice())

        self.assertIs(first, second)
        request.assert_awaited_once()


class ClimateRiskApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_city_endpoint_uses_shared_city_coordinates(self):
        with patch(
            "app.climate_risk._build_assessment",
            new=AsyncMock(return_value=make_overview()),
        ) as assessment:
            response = self.client.get("/api/climate-risk/DELHI")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["cityId"], "delhi")
        self.assertEqual(body["cityName"], "New Delhi")
        assessment.assert_awaited_once_with(
            "delhi", "New Delhi", 28.6139, 77.209, "GET /api/climate-risk/delhi"
        )

    def test_coordinate_endpoint_returns_frontend_overview(self):
        expected = make_overview("coordinates", "Selected Location", 19.076, 72.8777)
        with patch(
            "app.climate_risk._build_assessment",
            new=AsyncMock(return_value=expected),
        ) as assessment:
            response = self.client.get("/api/climate-risk?lat=19.076&lng=72.8777")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["categories"]["airPollution"]["id"], "air_pollution")
        self.assertEqual(body["coordinates"], {"lat": 19.076, "lng": 72.8777})
        assessment.assert_awaited_once_with(
            "coordinates",
            "Selected Location",
            19.076,
            72.8777,
            "GET /api/climate-risk?lat=19.0760&lng=72.8777",
        )

    def test_city_endpoint_builds_complete_assessment_from_mock_providers(self):
        today = datetime.now(timezone.utc).date()
        archive_start = today - timedelta(days=4 * 365)
        archive_end = today - timedelta(days=5)

        def date_range(start, end):
            current = start
            while current <= end:
                yield current
                current += timedelta(days=1)

        forecast_days = list(date_range(today - timedelta(days=92), today + timedelta(days=2)))
        archive_days = list(date_range(archive_start, archive_end))
        flood_days = list(date_range(archive_start, today + timedelta(days=2)))

        def daily_payload(days):
            temperatures = [25.0 + (10.0 if day.month in (4, 5, 6, 7) else 0.0) for day in days]
            return {
                "time": [day.isoformat() for day in days],
                "temperature_2m_max": temperatures,
                "apparent_temperature_max": [value + 2.0 for value in temperatures],
                "precipitation_sum": [3.0 + (day.month in (6, 7, 8)) * 5.0 for day in days],
                "et0_fao_evapotranspiration": [4.0 for _ in days],
            }

        def soil_hourly(days, top_key, root_key):
            timestamps = [
                datetime.combine(day, time(hour=12), timezone.utc).isoformat()
                for day in days
            ]
            return {
                "time": timestamps,
                top_key: [0.2 for _ in timestamps],
                root_key: [0.25 for _ in timestamps],
            }

        forecast_payload = {
            "daily": daily_payload(forecast_days),
            "hourly": soil_hourly(
                forecast_days,
                "soil_moisture_3_to_9cm",
                "soil_moisture_9_to_27cm",
            ),
        }
        archive_payload = {
            "daily": daily_payload(archive_days),
            "hourly": soil_hourly(
                archive_days,
                "soil_moisture_0_to_7cm",
                "soil_moisture_7_to_28cm",
            ),
        }
        flood_payload = {
            "daily": {
                "time": [day.isoformat() for day in flood_days],
                "river_discharge": [20.0 for _ in flood_days],
            }
        }

        async def mock_provider(url, _params, _provider, **_kwargs):
            if url == FORECAST_URL:
                return forecast_payload
            if url == ARCHIVE_URL:
                return archive_payload
            if url == FLOOD_URL:
                return flood_payload
            raise AssertionError(f"Unexpected provider URL: {url}")

        with (
            patch("app.climate_risk._request_json", new=AsyncMock(side_effect=mock_provider)) as request_mock,
            patch(
                "app.climate_risk.get_air_quality_by_coordinates",
                new=AsyncMock(return_value=SimpleNamespace(aqi=125, category="Unhealthy for Sensitive Groups")),
            ),
        ):
            response = self.client.get("/api/climate-risk/mumbai")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["isDataUnavailable"])
        self.assertEqual(body["cityId"], "mumbai")
        archive_call = next(
            call for call in request_mock.await_args_list if call.args[0] == ARCHIVE_URL
        )
        self.assertEqual(archive_call.args[1]["models"], "era5")
        self.assertIs(archive_call.kwargs["timeout"], ARCHIVE_REQUEST_TIMEOUT)
        self.assertEqual(set(body["categories"]), {"heatwave", "flood", "drought", "airPollution"})
        for item in body["categories"].values():
            self.assertGreaterEqual(item["score"], 0)
            self.assertLessEqual(item["score"], 100)
            self.assertIn(item["category"], {"Low", "Moderate", "High", "Very High"})
            self.assertIn("not a physical sensor reading", item["explanation"])
        expected_overall = round(
            sum(item["score"] for item in body["categories"].values()) / 4,
            1,
        )
        self.assertEqual(body["overallScore"], expected_overall)

    def test_invalid_coordinates_return_422(self):
        response = self.client.get("/api/climate-risk?lat=91&lng=0")
        self.assertEqual(response.status_code, 422)

    def test_unknown_city_returns_404(self):
        response = self.client.get("/api/climate-risk/not-a-city")
        self.assertEqual(response.status_code, 404)

    def test_missing_provider_data_returns_unavailable_payload(self):
        with (
            patch("app.climate_risk._request_json", new=AsyncMock(return_value={})),
            patch(
                "app.climate_risk.get_air_quality_by_coordinates",
                new=AsyncMock(return_value=SimpleNamespace(aqi=40, category="Good")),
            ),
        ):
            response = self.client.get("/api/climate-risk/delhi")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["isDataUnavailable"])
        self.assertEqual(body["overallScore"], 0)
        self.assertIn("unavailable", body["categories"]["heatwave"]["explanation"].lower())
        self.assertEqual(body["apiContractNote"], "GET /api/climate-risk/delhi")

    def test_missing_historical_values_are_identified_by_field(self):
        payload = {
            "daily": {
                "time": ["2026-01-01"] * 30,
                "temperature_2m_max": [30.0] * 30,
                "apparent_temperature_max": [None] * 30,
                "precipitation_sum": [1.0] * 30,
                "et0_fao_evapotranspiration": [2.0] * 30,
            },
            "hourly": {
                "time": ["2026-01-01T00:00"] * 30,
                "soil_moisture_0_to_7cm": [0.2] * 30,
                "soil_moisture_7_to_28cm": [0.25] * 30,
            },
        }
        with self.assertRaisesRegex(
            AssessmentUnavailable,
            r"daily\.apparent_temperature_max.*\(0; at least 30 required\)",
        ):
            _validate_historical_payload(payload)

    def test_provider_timeout_becomes_unavailable_assessment(self):
        timeout = httpx.ReadTimeout("provider timed out")
        with (
            patch("app.climate_risk.httpx.AsyncClient", side_effect=lambda **kwargs: FakeAsyncClient(error=timeout)),
            patch(
                "app.climate_risk.get_air_quality_by_coordinates",
                new=AsyncMock(return_value=SimpleNamespace(aqi=40, category="Good")),
            ),
        ):
            response = self.client.get("/api/climate-risk/delhi")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["isDataUnavailable"])

    def test_provider_http_error_becomes_unavailable_assessment(self):
        request = httpx.Request("GET", "https://api.open-meteo.com/v1/forecast")
        provider_response = httpx.Response(502, request=request)
        error = httpx.HTTPStatusError("upstream failed", request=request, response=provider_response)
        with (
            patch("app.climate_risk.httpx.AsyncClient", side_effect=lambda **kwargs: FakeAsyncClient(error=error)),
            patch(
                "app.climate_risk.get_air_quality_by_coordinates",
                new=AsyncMock(return_value=SimpleNamespace(aqi=40, category="Good")),
            ),
        ):
            response = self.client.get("/api/climate-risk/delhi")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["isDataUnavailable"])

    def test_request_json_rejects_provider_error_payload(self):
        with patch(
            "app.climate_risk.httpx.AsyncClient",
            side_effect=lambda **kwargs: FakeAsyncClient(response=FakeResponse({"error": True})),
        ):
            with self.assertRaises(AssessmentUnavailable):
                asyncio.run(_request_json("https://example.test", {}, "test provider"))

    def test_request_json_distinguishes_provider_failure_types(self):
        request = httpx.Request("GET", "https://example.test")
        cases = (
            (
                FakeAsyncClient(error=httpx.ReadTimeout("provider timed out")),
                r"request timed out \(ReadTimeout\)",
            ),
            (
                FakeAsyncClient(
                    response=FakeResponse(
                        error=httpx.HTTPStatusError(
                            "upstream failed",
                            request=request,
                            response=httpx.Response(502, request=request),
                        )
                    )
                ),
                "returned HTTP 502",
            ),
            (
                FakeAsyncClient(error=httpx.ConnectError("connection refused")),
                r"network request failed \(ConnectError\)",
            ),
        )
        for fake_client, expected in cases:
            with self.subTest(expected=expected), patch(
                "app.climate_risk.httpx.AsyncClient",
                side_effect=lambda **_kwargs: fake_client,
            ):
                with self.assertRaisesRegex(AssessmentUnavailable, expected):
                    asyncio.run(_request_json("https://example.test", {}, "Test provider"))

        class InvalidJsonResponse(FakeResponse):
            def json(self):
                raise ValueError("malformed JSON")

        invalid_json_client = FakeAsyncClient(response=InvalidJsonResponse())
        with patch(
            "app.climate_risk.httpx.AsyncClient",
            side_effect=lambda **_kwargs: invalid_json_client,
        ):
            with self.assertRaisesRegex(AssessmentUnavailable, "returned invalid JSON"):
                asyncio.run(_request_json("https://example.test", {}, "Test provider"))

        rejected_client = FakeAsyncClient(
            response=FakeResponse({"error": True, "reason": "invalid model"})
        )
        with patch(
            "app.climate_risk.httpx.AsyncClient",
            side_effect=lambda **_kwargs: rejected_client,
        ):
            with self.assertRaisesRegex(
                AssessmentUnavailable, "rejected the request: invalid model"
            ):
                asyncio.run(_request_json("https://example.test", {}, "Test provider"))


if __name__ == "__main__":
    unittest.main()