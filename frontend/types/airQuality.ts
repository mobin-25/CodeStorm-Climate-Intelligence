/**
 * Air Quality & Environmental Pollution types (CPCB India AQI standards)
 */
export type AQICategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export interface AirPollutant {
  code: "pm25" | "pm10" | "no2" | "so2" | "co" | "o3";
  name: string;
  chemicalFormula: string;
  value: number;
  unit: string;
  standardLimit: number; // 24-hr standard limit in India (CPCB)
  status: "good" | "moderate" | "poor" | "hazardous";
}

export interface AirQualityData {
  cityId: string;
  cityName: string;
  timestamp: string;
  aqi: number;
  category: AQICategory;
  dominantPollutant: string;
  pollutants: {
    pm25: AirPollutant;
    pm10: AirPollutant;
    no2: AirPollutant;
    so2: AirPollutant;
    co: AirPollutant;
    o3: AirPollutant;
  };
  healthAdvisory: string;
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  coordinates?: { lat: number; lng: number };
}
