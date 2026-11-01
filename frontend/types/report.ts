import {
  CurrentWeather,
  AirQualityData,
  CityClimateRiskOverview,
  CityHistoricalTrendsData,
  EnvironmentalAlert,
  GeocodedLocation,
} from "./index";

export type ReportType = "complete" | "weather" | "air_quality" | "climate_risk";

export type ReportDateRange = "7d" | "30d" | "6m" | "1y";

export interface EnvironmentalReportData {
  city: GeocodedLocation;
  generatedAt: string;
  reportType: ReportType;
  dateRange: ReportDateRange;

  // Domain payloads
  weather: CurrentWeather | null;
  airQuality: AirQualityData | null;
  riskData: CityClimateRiskOverview | null;
  historicalTrends: CityHistoricalTrendsData | null;
  alerts: EnvironmentalAlert[];

  // Status flags
  loading: boolean;
  error: string | null;
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
}

export interface ReportSummaryMetrics {
  compositeRiskScore: number | null;
  riskCategory: string | null;
  temperatureCelsius: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  aqi: number | null;
  aqiCategory: string | null;
  pm25: number | null;
  pm10: number | null;
  activeAlertsCount: number;
}

