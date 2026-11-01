import { CurrentWeather, AirQualityData, CityClimateRiskOverview } from "./index";

export interface CityComparisonItem {
  cityId: string;
  cityName: string;
  state?: string;
  displayName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  tier?: number;
  isPredefinedCity?: boolean;

  // Environmental Domain Payloads
  weather?: CurrentWeather | null;
  airQuality?: AirQualityData | null;
  riskOverview?: CityClimateRiskOverview | null;

  // Loading & Error states
  loading?: boolean;
  error?: string | null;

  // Data Integrity Flags
  isDataUnavailable?: boolean;
  isSampleData?: boolean;
  sampleNote?: string;
  apiContractNote?: string;
}

export type ComparisonMetricKey =
  // Weather
  | "temperature"
  | "humidity"
  | "windSpeed"
  // Air Quality
  | "aqi"
  | "pm25"
  | "pm10"
  | "no2"
  // Climate Risks
  | "overallRisk"
  | "heatwaveRisk"
  | "floodRisk"
  | "droughtRisk";

export interface MetricHighlight {
  bestCityId?: string;
  worstCityId?: string;
  bestValue?: number;
  worstValue?: number;
  unit?: string;
  hasComparableData: boolean;
}

export type MetricHighlightsMap = Record<ComparisonMetricKey, MetricHighlight>;

export interface ComparisonQueryOptions {
  cityId: string;
  cityName?: string;
  state?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isPredefinedCity?: boolean;
}
