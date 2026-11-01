import { WeatherCondition } from "./weather";

export type RainfallRiskCategory = "Low" | "Moderate" | "High" | "Very High";

export interface ForecastDay {
  date: string; // ISO format e.g. "2026-11-01"
  dayLabel: string; // Short day e.g. "Mon"
  fullDateLabel: string; // Day & month e.g. "1 Nov"
  maxTempCelsius: number;
  minTempCelsius: number;
  condition: WeatherCondition;
  rainfallProbability: number; // 0 - 100 %
  expectedRainfallMm: number; // mm
}

export interface RainfallRiskOverview {
  level: RainfallRiskCategory;
  score: number; // 0 - 100
  explanation: string;
  totalWeeklyRainfallMm: number;
  peakDay: string;
}

export interface SevenDayForecastData {
  cityId: string;
  cityName: string;
  timestamp: string;
  days: ForecastDay[];
  rainfallRisk: RainfallRiskOverview;
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  coordinates?: { lat: number; lng: number };
}
