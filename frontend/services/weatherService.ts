import { CurrentWeather } from "@/types";
import { MOCK_CURRENT_WEATHER } from "@/data/mock";
import { apiClient } from "./api";

export interface WeatherQueryOptions {
  cityId: string;
  cityName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export async function getCurrentWeather(
  query: string | WeatherQueryOptions
): Promise<CurrentWeather> {
  const options: WeatherQueryOptions =
    typeof query === "string" ? { cityId: query } : query;

  const { cityId, cityName, coordinates } = options;

  // 1. If real backend integration is activated via environment variable
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    // Attempt coordinate endpoint if coordinates are present
    if (coordinates) {
      const coordRes = await apiClient<CurrentWeather>(
        `/api/weather?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (coordRes.data) return coordRes.data;
    }

    // Fallback to city slug endpoint
    const cityRes = await apiClient<CurrentWeather>(`/api/weather/${cityId}`);
    if (cityRes.data) return cityRes.data;
  }

  // 2. Check if the city matches one of the 10 baseline demo corridors
  const predefinedMock = MOCK_CURRENT_WEATHER[cityId.toLowerCase()];
  if (predefinedMock) {
    return {
      ...predefinedMock,
      cityName: cityName || predefinedMock.cityName,
      coordinates: coordinates || undefined,
    };
  }

  // 3. For any dynamically searched city/town outside the 10 predefined corridors:
  // Never fabricate live weather or AQI values. Return genuine "Data Unavailable"
  // state with the required backend API contract specification.
  return {
    cityId,
    cityName: cityName || "Selected Location",
    timestamp: new Date().toISOString(),
    temperatureCelsius: 0,
    feelsLikeCelsius: 0,
    humidityPercent: 0,
    windSpeedKmh: 0,
    windDirectionDeg: 0,
    windDirectionLabel: "--",
    pressureHpa: 0,
    uvIndex: 0,
    visibilityKm: 0,
    condition: {
      code: "pending_sensor",
      label: "Sensor Integration Pending",
      icon: "Radio",
    },
    isDataUnavailable: true,
    apiContractNote: coordinates
      ? `GET /api/weather?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}`
      : `GET /api/weather/${cityId}`,
    coordinates,
  };
}
