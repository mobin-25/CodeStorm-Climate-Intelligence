/**
 * Climate Insights & Smart Recommendations Types
 */

export type InsightCategory =
  | "temperature"
  | "air_quality"
  | "rainfall"
  | "climate_risk"
  | "unusual_change";

export type InsightSeverity = "info" | "moderate" | "high" | "critical";

export type ProfileFilter =
  | "all"
  | "general"
  | "children"
  | "elderly"
  | "asthma"
  | "outdoor_workers";

export interface EnvironmentalInsight {
  id: string;
  category: InsightCategory;
  title: string;
  explanation: string;
  relatedMetric: {
    label: string;
    value: string | number;
    unit?: string;
    status?: string;
  };
  severity: InsightSeverity;
  dataSource: string;
  timestamp?: string;
  isUnusualChange?: boolean;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  category: "air_quality" | "temperature" | "rainfall" | "risk" | "general";
  urgency: "routine" | "advisory" | "urgent";
  targetProfiles: ProfileFilter[];
  triggerCondition: string;
  icon: "wind" | "thermometer" | "droplets" | "shield-alert" | "activity";
}

export interface CityInsightsData {
  cityId: string;
  cityName: string;
  state?: string;
  generatedAt: string;
  insights: EnvironmentalInsight[];
  recommendations: SmartRecommendation[];
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
}

export interface InsightsQueryOptions {
  cityId: string;
  cityName?: string;
  state?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
