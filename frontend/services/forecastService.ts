import { SevenDayForecastData } from "@/types";
import { MOCK_SEVEN_DAY_FORECASTS } from "@/data/mock";
import { apiClient } from "./api";

export interface ForecastQueryOptions {
  cityId: string;
  cityName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Service to fetch 7-day weather forecast and rainfall risk intelligence.
 * Queries backend when enabled, serves labeled DEMO fixtures for supported corridors,
 * or returns honest "Forecast data unavailable" state for unmonitored locations.
 */
export async function getSevenDayForecast(
  query: string | ForecastQueryOptions
): Promise<SevenDayForecastData> {
  const options: ForecastQueryOptions =
    typeof query === "string" ? { cityId: query } : query;

  const { cityId, cityName, coordinates } = options;
  const normalizedId = cityId.toLowerCase();

  // 1. If real backend integration is activated via environment variable
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    if (coordinates) {
      const coordRes = await apiClient<SevenDayForecastData>(
        `/api/forecast?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (coordRes.data) return coordRes.data;
    }

    const cityRes = await apiClient<SevenDayForecastData>(`/api/forecast/${normalizedId}`);
    if (cityRes.data) return cityRes.data;
  }

  // 2. Check if the city matches one of the baseline demo corridors
  const predefinedMock = MOCK_SEVEN_DAY_FORECASTS[normalizedId];
  if (predefinedMock) {
    return {
      ...predefinedMock,
      cityName: cityName || predefinedMock.cityName,
      coordinates: coordinates || undefined,
      isSampleData: true,
      sampleNote: "DEMO Baseline",
    };
  }

  // 3. For dynamically searched locations outside baseline demo corridors:
  // Never fabricate live forecast values. Return genuine "Forecast data unavailable" state
  // with exact required backend API contract specification.
  return {
    cityId,
    cityName: cityName || "Selected Location",
    timestamp: new Date().toISOString(),
    days: [],
    rainfallRisk: {
      level: "Low",
      score: 0,
      explanation: "Meteorological model forecast feed pending integration.",
      totalWeeklyRainfallMm: 0,
      peakDay: "None",
    },
    isDataUnavailable: true,
    apiContractNote: coordinates
      ? `GET /api/forecast?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}`
      : `GET /api/forecast/${cityId}`,
    coordinates,
  };
}
