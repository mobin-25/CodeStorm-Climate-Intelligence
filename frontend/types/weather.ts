/**
 * Weather & atmospheric observation types
 */
export interface WeatherCondition {
  code: string;
  label: string;
  icon: string;
}

export interface CurrentWeather {
  cityId: string;
  cityName: string;
  timestamp: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  pressureHpa: number;
  uvIndex: number;
  visibilityKm: number;
  condition: WeatherCondition;
  isSampleData?: boolean;
  sampleNote?: string;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  coordinates?: { lat: number; lng: number };
}

export interface HourlyForecastItem {
  time: string;
  temperatureCelsius: number;
  precipitationProbability: number;
  condition: WeatherCondition;
  windSpeedKmh: number;
}

export interface DailyForecastItem {
  date: string;
  minTempCelsius: number;
  maxTempCelsius: number;
  condition: WeatherCondition;
  precipitationMm: number;
}
