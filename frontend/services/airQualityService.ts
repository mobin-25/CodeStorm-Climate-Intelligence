import { AirQualityData } from "@/types";
import { MOCK_AIR_QUALITY } from "@/data/mock";
import { apiClient } from "./api";

export interface AirQualityQueryOptions {
  cityId: string;
  cityName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Service to fetch air quality data.
 * Checks backend if enabled; otherwise serves explicitly labeled DEMO data for preset corridors,
 * or returns honest "Awaiting environmental data" state with required API contract for dynamic locations.
 */
export async function getAirQuality(
  query: string | AirQualityQueryOptions
): Promise<AirQualityData> {
  const options: AirQualityQueryOptions =
    typeof query === "string" ? { cityId: query } : query;

  const { cityId, cityName, coordinates } = options;
  const normalizedId = cityId.toLowerCase();

  // 1. If real backend integration is activated via environment variable
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    if (coordinates) {
      const coordRes = await apiClient<AirQualityData>(
        `/api/air-quality?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (coordRes.data) return coordRes.data;
    }

    const cityRes = await apiClient<AirQualityData>(`/api/air-quality/${normalizedId}`);
    if (cityRes.data) return cityRes.data;
  }

  // 2. Check if the city matches one of the baseline demo corridors
  const predefinedMock = MOCK_AIR_QUALITY[normalizedId];
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
  // Never fabricate live AQI or pollutant values. Return genuine "Awaiting environmental data" state
  // with exact required backend API contract specification.
  return {
    cityId,
    cityName: cityName || "Selected Location",
    timestamp: new Date().toISOString(),
    aqi: 0,
    category: "Moderate",
    dominantPollutant: "--",
    pollutants: {
      pm25: { code: "pm25", name: "Fine Particulate Matter", chemicalFormula: "PM2.5", value: 0, unit: "µg/m³", standardLimit: 60, status: "good" },
      pm10: { code: "pm10", name: "Coarse Particulate Matter", chemicalFormula: "PM10", value: 0, unit: "µg/m³", standardLimit: 100, status: "good" },
      no2: { code: "no2", name: "Nitrogen Dioxide", chemicalFormula: "NO₂", value: 0, unit: "µg/m³", standardLimit: 80, status: "good" },
      so2: { code: "so2", name: "Sulfur Dioxide", chemicalFormula: "SO₂", value: 0, unit: "µg/m³", standardLimit: 80, status: "good" },
      co: { code: "co", name: "Carbon Monoxide", chemicalFormula: "CO", value: 0, unit: "mg/m³", standardLimit: 2, status: "good" },
      o3: { code: "o3", name: "Surface Ozone", chemicalFormula: "O₃", value: 0, unit: "µg/m³", standardLimit: 100, status: "good" },
    },
    healthAdvisory: "Awaiting environmental sensor feed for this geographical coordinate.",
    isDataUnavailable: true,
    apiContractNote: coordinates
      ? `GET /api/air-quality?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}`
      : `GET /api/air-quality/${cityId}`,
    coordinates,
  };
}
