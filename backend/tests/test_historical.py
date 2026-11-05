import unittest
from datetime import date, datetime, timedelta, timezone
from statistics import mean
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app import historical
from app.historical import (
    AIR_QUALITY_URL,
    ARCHIVE_URL,
    _PROVIDER_CACHE,
    _PROVIDER_IN_FLIGHT,
    FORECAST_URL,
    RAINFALL_MIN_BASELINE_MM_PER_DAY,
    PROVIDER_MAX_ATTEMPTS,
    DailyObservation,
    HistoricalDataUnavailable,
    _aggregate_points,
    _assemble_daily_observations,
    _build_summary,
    _fetch_daily_observations,
    _fetch_cached_json,
    _fetch_json,
    _range_dates,
    _safe_percent_change,
)
from app.main import app


def observations_for(start: date, end: date) -> list[DailyObservation]:
    observations = []
    day = start
    index = 0
    while day <= end:
        observations.append(
            DailyObservation(
                day=day,
                avg_temp=20 + index / 10,
                max_temp=25 + index / 10,
                min_temp=15 + index / 10,
                rainfall_mm=float(index % 5),
                aqi=50 + index,
                pm25=10 + index / 10,
                pm10=20 + index / 10,
            )
        )
        day += timedelta(days=1)
        index += 1
    return observations


def weather_payload(days, *, precipitation=None):
    return {
        "daily": {
            "time": [day.isoformat() for day in days],
            "temperature_2m_mean": [20.0 for _ in days],
            "temperature_2m_max": [25.0 for _ in days],
            "temperature_2m_min": [15.0 for _ in days],
            "precipitation_sum": list(precipitation or [1.0 for _ in days]),
        }
    }


def air_payload(days, *, missing_hour=None):
    times = []
    values = {"us_aqi": [], "pm2_5": [], "pm10": []}
    for day in days:
        for hour in range(24):
            if missing_hour == (day, hour):
                continue
            times.append(datetime.combine(day, datetime.min.time(), timezone.utc).replace(hour=hour).isoformat())
            values["us_aqi"].append(60.0 + hour)
            values["pm2_5"].append(10.0 + hour / 10)
            values["pm10"].append(20.0 + hour / 10)
    return {"hourly": {"time": times, **values}}


class HistoricalApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_city_endpoint_returns_frontend_schema(self):
        async def fake_fetch(_lat, _lng, start, end):
            return observations_for(start, end)

        with patch("app.historical._fetch_daily_observations", side_effect=fake_fetch):
            response = self.client.get("/api/historical/mumbai?range=30d")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["cityId"], "mumbai")
        self.assertEqual(body["cityName"], "Mumbai")
        self.assertEqual(body["timeRange"], "30d")
        self.assertEqual(body["coordinates"], {"lat": 19.076, "lng": 72.8777})
        self.assertEqual(
            set(body),
            {
                "cityId", "cityName", "timestamp", "dataSource", "timeRange", "points",
                "summary", "isSampleData", "sampleNote", "isDataUnavailable",
                "apiContractNote", "coordinates",
            },
        )
        self.assertEqual(
            set(body["points"][0]),
            {"timestamp", "label", "avgTemp", "maxTemp", "minTemp", "rainfallMm", "aqi", "pm25", "pm10"},
        )
        self.assertEqual(
            set(body["summary"]),
            {
                "avgTemp", "maxTemp", "minTemp", "tempChangePercent", "totalRainfallMm",
                "rainfallAnomalyPercent", "avgAqi", "aqiChangePercent", "trendDescription",
            },
        )
        self.assertFalse(body["isDataUnavailable"])
        self.assertFalse(body["isSampleData"])
        self.assertEqual(len(body["points"]), 30)

    def test_coordinate_endpoint_returns_same_contract(self):
        async def fake_fetch(_lat, _lng, start, end):
            return observations_for(start, end)

        with patch("app.historical._fetch_daily_observations", side_effect=fake_fetch) as fetch:
            response = self.client.get("/api/historical?lat=19.076&lng=72.8777&range=30d")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["cityId"], "coordinates")
        self.assertEqual(response.json()["cityName"], "Selected Location")
        self.assertEqual(response.json()["coordinates"], {"lat": 19.076, "lng": 72.8777})
        fetch.assert_awaited_once()
        self.assertEqual(fetch.await_args.args[:2], (19.076, 72.8777))

    def test_all_supported_ranges_have_expected_point_intervals(self):
        expected_counts = {"30d": 30, "6m": 6, "1y": 12, "2y": 24}
        async def fake_fetch(_lat, _lng, start, end):
            return observations_for(start, end)

        with patch("app.historical._fetch_daily_observations", side_effect=fake_fetch):
            for range_name, expected_count in expected_counts.items():
                with self.subTest(range=range_name):
                    response = self.client.get(f"/api/historical/delhi?range={range_name}")
                    self.assertEqual(response.status_code, 200)
                    body = response.json()
                    self.assertEqual(body["timeRange"], range_name)
                    self.assertEqual(len(body["points"]), expected_count)
                    timestamps = [point["timestamp"] for point in body["points"]]
                    self.assertEqual(timestamps, sorted(timestamps))

    def test_invalid_range_returns_422(self):
        response = self.client.get("/api/historical/delhi?range=10d")
        self.assertEqual(response.status_code, 422)

    def test_invalid_latitude_and_longitude_return_422(self):
        for query in ("lat=91&lng=0", "lat=0&lng=181", "lat=-91&lng=0", "lat=0&lng=-181"):
            with self.subTest(query=query):
                response = self.client.get(f"/api/historical?{query}&range=30d")
                self.assertEqual(response.status_code, 422)

    def test_unknown_city_returns_404(self):
        response = self.client.get("/api/historical/not-a-city?range=30d")
        self.assertEqual(response.status_code, 404)

    def test_provider_failure_returns_unavailable_structure_with_no_points(self):
        async def failed_fetch(*_args):
            raise HistoricalDataUnavailable("Historical Archive API returned HTTP 503.")

        with patch("app.historical._fetch_daily_observations", side_effect=failed_fetch):
            response = self.client.get("/api/historical/mumbai?range=30d")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["isDataUnavailable"])
        self.assertEqual(body["points"], [])
        self.assertIn("not measurements", body["summary"]["trendDescription"])
        self.assertIn("HTTP 503", body["apiContractNote"])

    def test_city_response_summary_and_chronological_order(self):
        start, end = _range_dates("30d")
        records = observations_for(start, end)
        points = _aggregate_points(records, "30d")
        summary = _build_summary(records)

        self.assertEqual([point.timestamp for point in points], sorted(point.timestamp for point in points))
        self.assertEqual(summary.avgTemp, round(sum(item.avg_temp for item in records) / len(records), 1))
        self.assertEqual(summary.maxTemp, max(item.max_temp for item in records))
        self.assertEqual(summary.minTemp, min(item.min_temp for item in records))
        self.assertEqual(summary.totalRainfallMm, sum(item.rainfall_mm for item in records))
        self.assertIn("chronological halves", summary.trendDescription)


class HistoricalProviderDataTests(unittest.TestCase):
    def setUp(self):
        _PROVIDER_CACHE.clear()
        _PROVIDER_IN_FLIGHT.clear()

    def tearDown(self):
        _PROVIDER_CACHE.clear()
        _PROVIDER_IN_FLIGHT.clear()

    def test_archive_and_forecast_daily_weather_merge_by_date(self):
        days = [date(2026, 10, 1), date(2026, 10, 2)]
        archive = weather_payload(days)
        forecast = weather_payload(days, precipitation=[2.0, 3.0])
        air = air_payload(days)

        records = _assemble_daily_observations(days[0], days[-1], archive, forecast, air)

        self.assertEqual([record.day for record in records], days)
        self.assertEqual([record.rainfall_mm for record in records], [2.0, 3.0])
        self.assertAlmostEqual(records[0].aqi, 71.5)

    def test_missing_weather_data_is_unavailable_not_zero_filled(self):
        days = [date(2026, 10, 1)]
        archive = weather_payload(days, precipitation=[None])
        forecast = weather_payload([], precipitation=[])
        air = air_payload(days)

        with self.assertRaisesRegex(HistoricalDataUnavailable, "jointly cover"):
            _assemble_daily_observations(days[0], days[-1], archive, forecast, air)

    def test_missing_air_quality_data_is_unavailable(self):
        days = [date(2026, 10, 1)]
        archive = weather_payload(days)
        forecast = weather_payload([])
        air = air_payload(days, missing_hour=(days[0], 12))

        with self.assertRaisesRegex(HistoricalDataUnavailable, "jointly cover"):
            _assemble_daily_observations(days[0], days[-1], archive, forecast, air)

    def test_invalid_provider_date_is_rejected(self):
        archive = weather_payload([date(2026, 10, 1)])
        archive["daily"]["time"][0] = "not-a-date"
        with self.assertRaisesRegex(HistoricalDataUnavailable, "invalid date"):
            _assemble_daily_observations(
                date(2026, 10, 1),
                date(2026, 10, 1),
                archive,
                weather_payload([]),
                air_payload([date(2026, 10, 1)]),
            )

    def test_range_start_and_end_calculation(self):
        fixed_today = date(2026, 11, 5)
        self.assertEqual(_range_dates("30d", fixed_today), (date(2026, 10, 6), date(2026, 11, 4)))
        self.assertEqual(_range_dates("6m", fixed_today), (date(2026, 6, 1), date(2026, 11, 4)))
        self.assertEqual(_range_dates("1y", fixed_today), (date(2025, 12, 1), date(2026, 11, 4)))
        self.assertEqual(_range_dates("2y", fixed_today), (date(2024, 12, 1), date(2026, 11, 4)))

    def test_rainfall_comparison_suppresses_zero_and_near_zero_baselines(self):
        self.assertEqual(_safe_percent_change(0.0, 20.0), 0.0)
        self.assertEqual(
            _safe_percent_change(
                RAINFALL_MIN_BASELINE_MM_PER_DAY / 2,
                20.0,
                minimum_baseline=RAINFALL_MIN_BASELINE_MM_PER_DAY,
            ),
            0.0,
        )

        records = [
            DailyObservation(date(2026, 1, 1), 20, 25, 15, 0.01, 50, 10, 20),
            DailyObservation(date(2026, 1, 2), 20, 25, 15, 0.01, 50, 10, 20),
            DailyObservation(date(2026, 1, 3), 20, 25, 15, 20.0, 50, 10, 20),
            DailyObservation(date(2026, 1, 4), 20, 25, 15, 20.0, 50, 10, 20),
        ]
        summary = _build_summary(records)
        self.assertEqual(summary.rainfallAnomalyPercent, 0.0)
        self.assertIn("the comparison is suppressed", summary.trendDescription)
        self.assertIn("does not mean rainfall was unchanged", summary.trendDescription)
        self.assertIn("not a climatological anomaly", summary.trendDescription)
        self.assertNotIn("comparison_suppressed", summary.trendDescription)

    def test_rainfall_comparison_calculates_normal_period_change(self):
        self.assertEqual(
            _safe_percent_change(2.0, 3.0, minimum_baseline=RAINFALL_MIN_BASELINE_MM_PER_DAY),
            50.0,
        )

    def test_monthly_rainfall_and_total_are_daily_sums_once(self):
        july_days = [date(2026, 7, day) for day in range(1, 32)]
        daily_values = [float(day % 7) for day in range(1, 32)]
        records = [
            DailyObservation(day, 25, 30, 20, rainfall, 60, 10, 20)
            for day, rainfall in zip(july_days, daily_values)
        ]

        points = _aggregate_points(records, "1y")
        summary = _build_summary(records)

        self.assertEqual(len(points), 1)
        self.assertEqual(points[0].rainfallMm, sum(daily_values))
        self.assertEqual(summary.totalRainfallMm, sum(daily_values))

    def test_duplicate_daily_dates_are_not_counted_twice(self):
        day = date(2026, 7, 4)
        archive = {
            "daily": {
                "time": [day.isoformat(), day.isoformat()],
                "temperature_2m_mean": [25.0, 26.0],
                "temperature_2m_max": [30.0, 31.0],
                "temperature_2m_min": [20.0, 21.0],
                "precipitation_sum": [10.0, 15.0],
            }
        }
        forecast = {
            "daily": {
                "time": [],
                "temperature_2m_max": [],
                "temperature_2m_min": [],
                "precipitation_sum": [],
            },
            "hourly": {"time": [], "temperature_2m": []},
        }

        observations = _assemble_daily_observations(
            day, day, archive, forecast, air_payload([day])
        )
        point = _aggregate_points(observations, "30d")[0]
        summary = _build_summary(observations)

        self.assertEqual(len(observations), 1)
        self.assertEqual(len(_aggregate_points(observations, "1y")), 1)
        self.assertEqual(point.rainfallMm, 15.0)
        self.assertEqual(summary.totalRainfallMm, 15.0)

    def test_provider_request_uses_expected_endpoints_and_variables(self):
        start, end = date(2026, 10, 1), date(2026, 10, 2)
        empty_weather = weather_payload([start, end])
        empty_air = air_payload([start, end])
        async def mock_fetch(url, params, _provider):
            if url == ARCHIVE_URL:
                self.assertEqual(params["models"], "era5")
                return empty_weather
            if url == FORECAST_URL:
                return {
                    "daily": {
                        "time": [],
                        "temperature_2m_max": [],
                        "temperature_2m_min": [],
                        "precipitation_sum": [],
                    },
                    "hourly": {"time": [], "temperature_2m": []},
                }
            if url == AIR_QUALITY_URL:
                self.assertEqual(params["domains"], "cams_global")
                self.assertEqual(params["hourly"], "us_aqi,pm2_5,pm10")
                return empty_air
            raise AssertionError(url)

        with patch("app.historical._fetch_cached_json", side_effect=mock_fetch):
            records = asyncio_run(_fetch_daily_observations(19.076, 72.8777, start, end))
        self.assertEqual(len(records), 2)

    def test_http_429_retries_with_retry_after(self):
        class FakeResponse:
            def __init__(self, status, payload=None, headers=None):
                self.status_code = status
                self.payload = payload
                self.headers = headers or {}

            def raise_for_status(self):
                if self.status_code >= 400:
                    request = httpx.Request("GET", "https://example.test")
                    raise httpx.HTTPStatusError(
                        "rate limited",
                        request=request,
                        response=httpx.Response(
                            self.status_code, headers=self.headers, request=request
                        ),
                    )

            def json(self):
                return self.payload

        class FakeClient:
            def __init__(self, **_kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return False

            async def get(self, *_args, **_kwargs):
                responses = self.responses
                return responses.pop(0)

        client_instances = []
        response_queue = [
            FakeResponse(429, headers={"Retry-After": "2"}),
            FakeResponse(200, payload={"daily": {"ok": True}}),
        ]

        def fake_client(**kwargs):
            client = FakeClient(**kwargs)
            client.responses = response_queue
            client_instances.append(client)
            return client

        with (
            patch("app.historical.httpx.AsyncClient", side_effect=fake_client),
            patch("app.historical.asyncio.sleep", new=AsyncMock()) as sleep,
        ):
            result = asyncio_run(_fetch_json("https://example.test", {}, "Test provider"))

        self.assertEqual(result, {"daily": {"ok": True}})
        self.assertEqual(sleep.await_count, 1)
        sleep.assert_awaited_once_with(2.0)
        self.assertEqual(len(client_instances), 2)

    def test_http_429_retries_are_bounded(self):
        request = httpx.Request("GET", "https://example.test")
        response = httpx.Response(429, request=request)
        error = httpx.HTTPStatusError("rate limited", request=request, response=response)
        with (
            patch("app.historical.httpx.AsyncClient", side_effect=lambda **_kwargs: FakeAlways429(error)),
            patch("app.historical.asyncio.sleep", new=AsyncMock()),
        ):
            with self.assertRaisesRegex(HistoricalDataUnavailable, "after 3 attempt"):
                asyncio_run(_fetch_json("https://example.test", {}, "Test provider"))

    def test_successful_provider_payload_is_cached(self):
        payload = weather_payload([date(2026, 10, 1)])
        request = AsyncMock(return_value=payload)
        with patch("app.historical._fetch_json", new=request):
            first = asyncio_run(_fetch_cached_json(ARCHIVE_URL, {"latitude": 19.076}, "Archive"))
            second = asyncio_run(_fetch_cached_json(ARCHIVE_URL, {"latitude": 19.076}, "Archive"))

        self.assertIs(first, payload)
        self.assertIs(second, payload)
        request.assert_awaited_once()

    def test_failed_or_invalid_provider_response_is_not_cached(self):
        good_payload = weather_payload([date(2026, 10, 1)])
        request = AsyncMock(side_effect=[HistoricalDataUnavailable("HTTP 429"), good_payload])
        params = {"latitude": 19.076}
        with patch("app.historical._fetch_json", new=request):
            with self.assertRaisesRegex(HistoricalDataUnavailable, "429"):
                asyncio_run(_fetch_cached_json(ARCHIVE_URL, params, "Archive"))
            asyncio_run(_fetch_cached_json(ARCHIVE_URL, params, "Archive"))
        self.assertEqual(request.await_count, 2)

        _PROVIDER_CACHE.clear()
        invalid_request = AsyncMock(side_effect=[{}, good_payload])
        with patch("app.historical._fetch_json", new=invalid_request):
            with self.assertRaisesRegex(HistoricalDataUnavailable, "missing daily dates"):
                asyncio_run(_fetch_cached_json(ARCHIVE_URL, params, "Archive"))
            asyncio_run(_fetch_cached_json(ARCHIVE_URL, params, "Archive"))
        self.assertEqual(invalid_request.await_count, 2)

    def test_recent_forecast_fallback_supplies_archive_429_dates(self):
        start, end = date(2026, 10, 1), date(2026, 10, 3)
        archive_error = HistoricalDataUnavailable("Open-Meteo Historical Weather API returned HTTP 429")
        forecast = {
            "daily": {
                "time": [day.isoformat() for day in (start, start + timedelta(days=1), end)],
                "temperature_2m_max": [25.0, 26.0, 27.0],
                "temperature_2m_min": [15.0, 16.0, 17.0],
                "precipitation_sum": [1.0, 2.0, 3.0],
            },
            "hourly": {
                "time": [
                    datetime.combine(day, datetime.min.time(), timezone.utc)
                    .replace(hour=hour)
                    .isoformat()
                    for day in (start, start + timedelta(days=1), end)
                    for hour in range(24)
                ],
                "temperature_2m": [20.0 + hour / 100 for _day in (start, start + timedelta(days=1), end) for hour in range(24)],
            },
        }
        air = air_payload([start, start + timedelta(days=1), end])

        async def mock_cached(url, _params, _provider):
            if url == ARCHIVE_URL:
                raise archive_error
            if url == FORECAST_URL:
                return forecast
            if url == AIR_QUALITY_URL:
                return air
            raise AssertionError(url)

        with patch("app.historical._fetch_cached_json", side_effect=mock_cached):
            records = asyncio_run(_fetch_daily_observations(19.076, 72.8777, start, end))

        self.assertEqual([record.day for record in records], [start, start + timedelta(days=1), end])
        self.assertEqual([record.rainfall_mm for record in records], [1.0, 2.0, 3.0])
        self.assertAlmostEqual(records[0].avg_temp, mean([20.0 + hour / 100 for hour in range(24)]))

    def test_archive_and_forecast_failures_preserve_unavailable_response(self):
        start, end = date(2026, 10, 1), date(2026, 10, 2)
        async def failed_provider(url, _params, _provider):
            if url in (ARCHIVE_URL, FORECAST_URL):
                raise HistoricalDataUnavailable("Provider HTTP 429")
            return air_payload([start, end])

        with patch("app.historical._fetch_cached_json", side_effect=failed_provider):
            with self.assertRaisesRegex(HistoricalDataUnavailable, "429"):
                asyncio_run(_fetch_daily_observations(19.076, 72.8777, start, end))


class FakeAlways429:
    def __init__(self, error):
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False

    async def get(self, *_args, **_kwargs):
        raise self.error

    def test_provider_timeout_http_failure_and_invalid_json_are_distinguished(self):
        class FakeResponse:
            def __init__(self, *, error=None, invalid_json=False):
                self.error = error
                self.invalid_json = invalid_json

            def raise_for_status(self):
                if self.error:
                    raise self.error

            def json(self):
                if self.invalid_json:
                    raise ValueError("bad JSON")
                return {"ok": True}

        class FakeClient:
            def __init__(self, response=None, error=None, **_kwargs):
                self.response = response
                self.error = error

            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return False

            async def get(self, *_args, **_kwargs):
                if self.error:
                    raise self.error
                return self.response

        failures = (
            (FakeClient(error=httpx.ReadTimeout("timeout")), "timed out"),
            (
                FakeClient(response=FakeResponse(error=httpx.HTTPStatusError(
                    "bad gateway",
                    request=httpx.Request("GET", "https://example.test"),
                    response=httpx.Response(502),
                ))),
                "HTTP 502",
            ),
            (FakeClient(response=FakeResponse(invalid_json=True)), "invalid JSON"),
        )
        for fake_client, expected in failures:
            with self.subTest(expected=expected), patch(
                "app.historical.httpx.AsyncClient", side_effect=lambda **_kwargs: fake_client
            ):
                with self.assertRaisesRegex(HistoricalDataUnavailable, expected):
                    asyncio_run(_fetch_json("https://example.test", {}, "Test provider"))


def asyncio_run(awaitable):
    import asyncio
    return asyncio.run(awaitable)


if __name__ == "__main__":
    unittest.main()
