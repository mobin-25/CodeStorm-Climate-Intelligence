import { CityHistoricalTrendsData, TimeRangeOption } from "@/types";
import { buildHistoricalDataset } from "@/data/mock";
import { apiClient } from "./api";

export interface HistoricalQueryOptions {
  cityId: string;
  cityName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const SUPPORTED_CORRIDORS = new Set([
  "delhi",
  "mumbai",
  "pune",
  "bengaluru",
  "hyderabad",
  "chennai",
  "kolkata",
  "ahmedabad",
  "jaipur",
  "lucknow",
]);

/**
 * Service to fetch historical climate trends (Temperature, Rainfall, Air Quality).
 * Integrates with real backend if enabled, serves labeled DEMO fixtures for supported
 * corridor baselines, or provides honest "Historical data unavailable" response
 * with API contract definition for unmonitored locations.
 */
export async function getHistoricalTrends(
  query: string | HistoricalQueryOptions,
  timeRange: TimeRangeOption = "6m"
): Promise<CityHistoricalTrendsData> {
  const options: HistoricalQueryOptions =
    typeof query === "string" ? { cityId: query } : query;

  const { cityId, cityName, coordinates } = options;
  const normalizedId = cityId.toLowerCase();

  // 1. If real backend integration is activated via environment variable
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    if (coordinates) {
      const coordRes = await apiClient<CityHistoricalTrendsData>(
        `/api/historical?lat=${coordinates.lat}&lng=${coordinates.lng}&range=${timeRange}`
      );
      if (coordRes.data) return coordRes.data;
    }

    const cityRes = await apiClient<CityHistoricalTrendsData>(
      `/api/historical/${normalizedId}?range=${timeRange}`
    );
    if (cityRes.data) return cityRes.data;
  }

  // 2. Check if the city matches one of the baseline demo corridors
  if (SUPPORTED_CORRIDORS.has(normalizedId)) {
    const dataset = buildHistoricalDataset(normalizedId, timeRange);
    return {
      ...dataset,
      cityName: cityName || dataset.cityName,
      coordinates: coordinates || undefined,
      isSampleData: true,
      sampleNote: "DEMO Baseline",
    };
  }

  // 3. For dynamically searched locations outside baseline demo corridors:
  // Never fabricate historical records. Return genuine "Historical data unavailable" state
  // with exact required backend API contract specification.
  return {
    cityId,
    cityName: cityName || "Selected Location",
    timestamp: new Date().toISOString(),
    dataSource: "Pending Station Integration",
    timeRange,
    points: [],
    summary: {
      avgTemp: 0,
      maxTemp: 0,
      minTemp: 0,
      tempChangePercent: 0,
      totalRainfallMm: 0,
      rainfallAnomalyPercent: 0,
      avgAqi: 0,
      aqiChangePercent: 0,
      trendDescription: "Historical climatological archive feed pending station integration.",
    },
    isDataUnavailable: true,
    apiContractNote: coordinates
      ? `GET /api/historical?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&range=${timeRange}`
      : `GET /api/historical/${cityId}?range=${timeRange}`,
    coordinates,
  };
}
