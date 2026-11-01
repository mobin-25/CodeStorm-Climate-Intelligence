import {
  CityComparisonItem,
  ComparisonMetricKey,
  MetricHighlightsMap,
  ComparisonQueryOptions,
} from "@/types";
import { getCurrentWeather } from "./weatherService";
import { getAirQuality } from "./airQualityService";
import { getClimateRisk } from "./riskService";
import { apiClient } from "./api";

/**
 * Fetch comparative environmental data for 2 to 4 Indian cities.
 * Prepared for real backend integration if NEXT_PUBLIC_USE_REAL_BACKEND is enabled,
 * otherwise aggregates from individual services while strictly maintaining data integrity.
 */
export async function getCityComparisonData(
  cities: ComparisonQueryOptions[]
): Promise<CityComparisonItem[]> {
  if (!cities || cities.length === 0) return [];

  // 1. Prepared for single consolidated backend endpoint in production
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    const cityIds = cities.map((c) => c.cityId).join(",");
    const res = await apiClient<CityComparisonItem[]>(`/api/comparison?cities=${encodeURIComponent(cityIds)}`);
    if (res.data) {
      return res.data;
    }
  }

  // 2. Concurrently fetch Weather, Air Quality, and Climate Risk per city
  const cityPromises = cities.map(async (city): Promise<CityComparisonItem> => {
    try {
      const [weatherRes, aqiRes, riskRes] = await Promise.allSettled([
        getCurrentWeather({
          cityId: city.cityId,
          cityName: city.cityName,
          coordinates: city.coordinates,
        }),
        getAirQuality({
          cityId: city.cityId,
          cityName: city.cityName,
          coordinates: city.coordinates,
        }),
        getClimateRisk({
          cityId: city.cityId,
          cityName: city.cityName,
          coordinates: city.coordinates,
        }),
      ]);

      const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;
      const airQuality = aqiRes.status === "fulfilled" ? aqiRes.value : null;
      const riskOverview = riskRes.status === "fulfilled" ? riskRes.value : null;

      // Determine overall data availability & sample status
      const isDataUnavailable =
        Boolean(weather?.isDataUnavailable) ||
        Boolean(airQuality?.isDataUnavailable) ||
        Boolean(riskOverview?.isDataUnavailable);

      const isSampleData =
        Boolean(weather?.isSampleData) ||
        Boolean(airQuality?.isSampleData) ||
        Boolean(riskOverview?.isSampleData);

      const sampleNote =
        weather?.sampleNote ||
        airQuality?.sampleNote ||
        riskOverview?.sampleNote ||
        (isSampleData ? "DEMO Baseline" : undefined);

      const apiContractNote =
        weather?.apiContractNote ||
        airQuality?.apiContractNote ||
        riskOverview?.apiContractNote;

      return {
        cityId: city.cityId,
        cityName: city.cityName || city.cityId,
        state: city.state,
        displayName: city.state ? `${city.cityName || city.cityId}, ${city.state}` : (city.cityName || city.cityId),
        coordinates: city.coordinates,
        isPredefinedCity: city.isPredefinedCity,
        weather,
        airQuality,
        riskOverview,
        loading: false,
        error: null,
        isDataUnavailable,
        isSampleData,
        sampleNote,
        apiContractNote,
      };
    } catch (err) {
      return {
        cityId: city.cityId,
        cityName: city.cityName || city.cityId,
        state: city.state,
        displayName: city.cityName || city.cityId,
        coordinates: city.coordinates,
        isPredefinedCity: city.isPredefinedCity,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load comparison data",
        isDataUnavailable: true,
      };
    }
  });

  return Promise.all(cityPromises);
}

/**
 * Helper extractor for a numeric metric value from a CityComparisonItem.
 * Returns null if data is missing, unavailable, or corrupted.
 * NEVER returns 0 for missing values to strictly respect Data Integrity Rule 5.
 */
export function getMetricValue(
  item: CityComparisonItem,
  metric: ComparisonMetricKey
): number | null {
  switch (metric) {
    case "temperature":
      if (!item.weather || item.weather.isDataUnavailable) return null;
      return typeof item.weather.temperatureCelsius === "number"
        ? item.weather.temperatureCelsius
        : null;

    case "humidity":
      if (!item.weather || item.weather.isDataUnavailable) return null;
      return typeof item.weather.humidityPercent === "number"
        ? item.weather.humidityPercent
        : null;

    case "windSpeed":
      if (!item.weather || item.weather.isDataUnavailable) return null;
      return typeof item.weather.windSpeedKmh === "number"
        ? item.weather.windSpeedKmh
        : null;

    case "aqi":
      if (!item.airQuality || item.airQuality.isDataUnavailable) return null;
      return typeof item.airQuality.aqi === "number" && item.airQuality.aqi > 0
        ? item.airQuality.aqi
        : null;

    case "pm25":
      if (!item.airQuality || item.airQuality.isDataUnavailable) return null;
      return typeof item.airQuality.pollutants?.pm25?.value === "number"
        ? item.airQuality.pollutants.pm25.value
        : null;

    case "pm10":
      if (!item.airQuality || item.airQuality.isDataUnavailable) return null;
      return typeof item.airQuality.pollutants?.pm10?.value === "number"
        ? item.airQuality.pollutants.pm10.value
        : null;

    case "no2":
      if (!item.airQuality || item.airQuality.isDataUnavailable) return null;
      return typeof item.airQuality.pollutants?.no2?.value === "number"
        ? item.airQuality.pollutants.no2.value
        : null;

    case "overallRisk":
      if (!item.riskOverview || item.riskOverview.isDataUnavailable) return null;
      return typeof item.riskOverview.overallScore === "number"
        ? item.riskOverview.overallScore
        : null;

    case "heatwaveRisk":
      if (!item.riskOverview || item.riskOverview.isDataUnavailable) return null;
      return typeof item.riskOverview.categories?.heatwave?.score === "number"
        ? item.riskOverview.categories.heatwave.score
        : null;

    case "floodRisk":
      if (!item.riskOverview || item.riskOverview.isDataUnavailable) return null;
      return typeof item.riskOverview.categories?.flood?.score === "number"
        ? item.riskOverview.categories.flood.score
        : null;

    case "droughtRisk":
      if (!item.riskOverview || item.riskOverview.isDataUnavailable) return null;
      return typeof item.riskOverview.categories?.drought?.score === "number"
        ? item.riskOverview.categories.drought.score
        : null;

    default:
      return null;
  }
}

/**
 * Metric units metadata for presentation
 */
export const METRIC_METADATA: Record<
  ComparisonMetricKey,
  { label: string; unit: string; domain: "weather" | "air" | "risk"; lowerIsBetter: boolean }
> = {
  temperature: { label: "Temperature", unit: "°C", domain: "weather", lowerIsBetter: true }, // lower/cooler or neutral
  humidity: { label: "Humidity", unit: "%", domain: "weather", lowerIsBetter: false },
  windSpeed: { label: "Wind Speed", unit: "km/h", domain: "weather", lowerIsBetter: false },
  aqi: { label: "Air Quality Index (AQI)", unit: "AQI", domain: "air", lowerIsBetter: true },
  pm25: { label: "PM2.5 Particulate", unit: "µg/m³", domain: "air", lowerIsBetter: true },
  pm10: { label: "PM10 Particulate", unit: "µg/m³", domain: "air", lowerIsBetter: true },
  no2: { label: "Nitrogen Dioxide (NO₂)", unit: "µg/m³", domain: "air", lowerIsBetter: true },
  overallRisk: { label: "Overall Climate Risk", unit: "/100", domain: "risk", lowerIsBetter: true },
  heatwaveRisk: { label: "Heatwave Risk Score", unit: "/100", domain: "risk", lowerIsBetter: true },
  floodRisk: { label: "Flood Risk Score", unit: "/100", domain: "risk", lowerIsBetter: true },
  droughtRisk: { label: "Drought Risk Score", unit: "/100", domain: "risk", lowerIsBetter: true },
};

/**
 * Safely computes Best and Worst cities for each metric.
 * Strict rules:
 * 1. Excludes missing or data-unavailable values entirely.
 * 2. Only highlights best/worst when at least 2 comparable cities have valid real/baseline data.
 * 3. Never compares unavailable data as zero.
 */
export function calculateMetricHighlights(
  items: CityComparisonItem[]
): MetricHighlightsMap {
  const keys: ComparisonMetricKey[] = [
    "temperature",
    "humidity",
    "windSpeed",
    "aqi",
    "pm25",
    "pm10",
    "no2",
    "overallRisk",
    "heatwaveRisk",
    "floodRisk",
    "droughtRisk",
  ];

  const result: Partial<MetricHighlightsMap> = {};

  for (const key of keys) {
    const meta = METRIC_METADATA[key];
    const validPairs: { cityId: string; value: number }[] = [];

    for (const item of items) {
      const val = getMetricValue(item, key);
      if (val !== null && !isNaN(val)) {
        validPairs.push({ cityId: item.cityId, value: val });
      }
    }

    if (validPairs.length < 2) {
      result[key] = {
        hasComparableData: false,
        unit: meta.unit,
      };
      continue;
    }

    // Sort ascending
    validPairs.sort((a, b) => a.value - b.value);

    const lowest = validPairs[0];
    const highest = validPairs[validPairs.length - 1];

    if (meta.lowerIsBetter) {
      // Lower is better (cleaner air, lower risk)
      result[key] = {
        bestCityId: lowest.cityId,
        bestValue: lowest.value,
        worstCityId: highest.cityId,
        worstValue: highest.value,
        unit: meta.unit,
        hasComparableData: true,
      };
    } else {
      // Higher is better or higher/lower relative highlight
      result[key] = {
        bestCityId: highest.cityId,
        bestValue: highest.value,
        worstCityId: lowest.cityId,
        worstValue: lowest.value,
        unit: meta.unit,
        hasComparableData: true,
      };
    }
  }

  return result as MetricHighlightsMap;
}
