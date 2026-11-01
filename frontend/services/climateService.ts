import { ClimateRiskAlert, CityRiskIndex } from "@/types";
import { MOCK_RISK_ALERTS, MOCK_CITY_RISK_INDEX } from "@/data/mock";
import { apiClient } from "./api";

export async function getRiskAlerts(): Promise<ClimateRiskAlert[]> {
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    const res = await apiClient<ClimateRiskAlert[]>("/api/climate/alerts");
    if (res.data) return res.data;
  }
  return MOCK_RISK_ALERTS;
}

export async function getCityRiskIndex(cityId: string): Promise<CityRiskIndex | null> {
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    const res = await apiClient<CityRiskIndex>(`/api/climate/risk/${cityId}`);
    if (res.data) return res.data;
  }
  return MOCK_CITY_RISK_INDEX[cityId] || null;
}
