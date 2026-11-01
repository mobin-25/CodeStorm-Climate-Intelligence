import { CityClimateRiskOverview } from "@/types";
import { MOCK_CLIMATE_RISK_OVERVIEWS } from "@/data/mock";
import { apiClient } from "./api";

export interface RiskQueryOptions {
  cityId: string;
  cityName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Service to fetch climate and environmental risk assessment.
 * Communicates with backend if enabled, serves labeled DEMO fixtures for supported corridors,
 * or returns honest "Awaiting risk assessment" state for unmonitored locations.
 */
export async function getClimateRisk(
  query: string | RiskQueryOptions
): Promise<CityClimateRiskOverview> {
  const options: RiskQueryOptions =
    typeof query === "string" ? { cityId: query } : query;

  const { cityId, cityName, coordinates } = options;
  const normalizedId = cityId.toLowerCase();

  // 1. If real backend integration is activated via environment variable
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    if (coordinates) {
      const coordRes = await apiClient<CityClimateRiskOverview>(
        `/api/climate-risk?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (coordRes.data) return coordRes.data;
    }

    const cityRes = await apiClient<CityClimateRiskOverview>(`/api/climate-risk/${normalizedId}`);
    if (cityRes.data) return cityRes.data;
  }

  // 2. Check if the city matches one of the baseline demo corridors
  const predefinedMock = MOCK_CLIMATE_RISK_OVERVIEWS[normalizedId];
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
  // Never fabricate risk scores. Return genuine "Awaiting risk assessment" state
  // with exact required backend API contract specification.
  return {
    cityId,
    cityName: cityName || "Selected Location",
    timestamp: new Date().toISOString(),
    overallScore: 0,
    overallCategory: "Low",
    categories: {
      heatwave: {
        id: "heatwave",
        title: "Heatwave Risk",
        score: 0,
        category: "Low",
        explanation: "Thermal vulnerability modeling pending sensor feed calibration.",
      },
      flood: {
        id: "flood",
        title: "Flood Risk",
        score: 0,
        category: "Low",
        explanation: "Hydrological basin & drainage capacity data pending regional survey.",
      },
      drought: {
        id: "drought",
        title: "Drought Risk",
        score: 0,
        category: "Low",
        explanation: "Aquifer reserve & seasonal aridity assessment pending integration.",
      },
      airPollution: {
        id: "air_pollution",
        title: "Air Pollution Risk",
        score: 0,
        category: "Low",
        explanation: "Atmospheric particulate dispersion data awaiting ambient monitor deployment.",
      },
    },
    isDataUnavailable: true,
    apiContractNote: coordinates
      ? `GET /api/climate-risk?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}`
      : `GET /api/climate-risk/${cityId}`,
    coordinates,
  };
}
