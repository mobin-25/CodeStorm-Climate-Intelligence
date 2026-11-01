import { EnvironmentalAlert, CityAlertsResponse } from "@/types";
import { MOCK_ENVIRONMENTAL_ALERTS } from "@/data/mock";
import { apiClient } from "./api";

export interface AlertsQueryOptions {
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
 * Service to fetch environmental hazard alerts and notifications.
 * Connects to future backend API when enabled, serves labeled DEMO fixtures
 * for monitored baseline corridors, or provides honest "Alert data unavailable" state
 * with exact required API contract for unmonitored dynamic locations.
 */
export async function getEnvironmentalAlerts(
  query: string | AlertsQueryOptions = "delhi"
): Promise<CityAlertsResponse> {
  const options: AlertsQueryOptions =
    typeof query === "string" ? { cityId: query } : query;

  const { cityId, cityName, coordinates } = options;
  const normalizedId = cityId.toLowerCase();

  // 1. If real backend integration is activated via environment variable
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    if (coordinates) {
      const coordRes = await apiClient<CityAlertsResponse>(
        `/api/alerts?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (coordRes.data) return coordRes.data;
    }

    const cityRes = await apiClient<CityAlertsResponse>(`/api/alerts/${normalizedId}`);
    if (cityRes.data) return cityRes.data;
  }

  // 2. Check if the city matches one of the baseline demo corridors
  if (SUPPORTED_CORRIDORS.has(normalizedId)) {
    // Return all alerts, marking unread count
    const alerts = [...MOCK_ENVIRONMENTAL_ALERTS];
    const unreadCount = alerts.filter((a) => !a.isRead).length;

    return {
      cityId: normalizedId,
      cityName: cityName || (normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1)),
      timestamp: new Date().toISOString(),
      alerts,
      totalCount: alerts.length,
      unreadCount,
      isSampleData: true,
      sampleNote: "DEMO Advisory Feed",
    };
  }

  // 3. For dynamically searched locations outside baseline demo corridors:
  // Never fabricate live emergency warnings. Return genuine "Alert data unavailable" state
  // with exact required backend API contract specification.
  return {
    cityId,
    cityName: cityName || "Selected Location",
    timestamp: new Date().toISOString(),
    alerts: [],
    totalCount: 0,
    unreadCount: 0,
    isDataUnavailable: true,
    apiContractNote: coordinates
      ? `GET /api/alerts?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}`
      : `GET /api/alerts/${cityId}`,
  };
}
