/**
 * Climate Trends, Emissions & Historical Environmental Intelligence
 */
export type TimeRangeOption = "30d" | "6m" | "1y" | "2y";
export type HistoricalTrendsCategory = "temperature" | "rainfall" | "air_quality";

export interface HistoricalDataPoint {
  timestamp: string;
  label: string; // e.g. "1 Oct", "May '26", "2025 Q1"
  // A. Temperature Trends
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  // B. Rainfall Trends
  rainfallMm: number;
  // C. Air Quality Trends
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface HistoricalSummary {
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  tempChangePercent: number; // e.g. +1.4%
  totalRainfallMm: number;
  rainfallAnomalyPercent: number; // e.g. -4.2%
  avgAqi: number;
  aqiChangePercent: number; // e.g. -6.8%
  trendDescription: string;
}

export interface CityHistoricalTrendsData {
  cityId: string;
  cityName: string;
  timestamp: string;
  dataSource: string; // e.g. "IMD & CPCB Historical Observation Archives"
  timeRange: TimeRangeOption;
  points: HistoricalDataPoint[];
  summary: HistoricalSummary;
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  coordinates?: { lat: number; lng: number };
}

export interface EmissionDataPoint {
  sector: string;
  co2EquivalentMetricTons: number;
  percentageContribution: number;
  yearOverYearChangePercent: number;
}

export interface ClimateTrendPoint {
  year: number;
  avgTemperatureCelsius: number;
  anomalyCelsius: number;
  annualRainfallMm: number;
}

export interface CityClimateProfile {
  cityId: string;
  cityName: string;
  annualMeanTemp: number;
  warmingRatePerDecadeCelsius: number;
  emissionsBreakdown: EmissionDataPoint[];
  historicalTrends: ClimateTrendPoint[];
}
