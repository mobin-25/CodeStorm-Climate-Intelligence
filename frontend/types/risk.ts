/**
 * Environmental & Climate Risk Assessment types
 * Standardized across 4 core hazards: Heatwave, Flood, Drought, Air Pollution.
 */
export type ClimateRiskCategory = "Low" | "Moderate" | "High" | "Very High";
export type RiskSeverity = "Low" | "Moderate" | "High" | "Critical";

export interface ClimateRiskAlert {
  id: string;
  type: "heatwave" | "flood" | "drought" | "storm" | "air_pollution";
  title: string;
  severity: RiskSeverity;
  affectedCities: string[];
  issuedAt: string;
  validUntil: string;
  description: string;
  mitigationSteps: string[];
}

export interface RiskCategoryItem {
  id: "heatwave" | "flood" | "drought" | "air_pollution";
  title: string;
  score: number; // 0 - 100
  category: ClimateRiskCategory;
  explanation: string;
}

export interface CityClimateRiskOverview {
  cityId: string;
  cityName: string;
  timestamp: string;
  overallScore: number; // 0 - 100
  overallCategory: ClimateRiskCategory;
  categories: {
    heatwave: RiskCategoryItem;
    flood: RiskCategoryItem;
    drought: RiskCategoryItem;
    airPollution: RiskCategoryItem;
  };
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  coordinates?: { lat: number; lng: number };
}

export interface CityRiskIndex {
  cityId: string;
  heatwaveRiskScore: number; // 0 - 100
  floodRiskScore: number; // 0 - 100
  droughtRiskScore: number; // 0 - 100
  compositeRiskScore: number; // 0 - 100
  dominantThreat: string;
}
