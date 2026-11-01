"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CityComparisonItem,
  MetricHighlightsMap,
  GeocodedLocation,
} from "@/types";
import {
  getCityComparisonData,
  calculateMetricHighlights,
} from "@/services";
import { MOCK_INDIAN_CITIES } from "@/data/mock";

// Default test corridors: Mumbai, Pune, and Delhi
const DEFAULT_LOCATIONS: GeocodedLocation[] = [
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    displayName: "Mumbai, Maharashtra",
    coordinates: { lat: 19.076, lng: 72.8777 },
    type: "Tier 1 City",
    isPredefinedCity: true,
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    displayName: "Pune, Maharashtra",
    coordinates: { lat: 18.5204, lng: 73.8567 },
    type: "Tier 2 City",
    isPredefinedCity: true,
  },
  {
    id: "delhi",
    name: "New Delhi",
    state: "Delhi NCT",
    displayName: "New Delhi, Delhi NCT",
    coordinates: { lat: 28.6139, lng: 77.209 },
    type: "Tier 1 City",
    isPredefinedCity: true,
  },
];

export interface UseCityComparisonResult {
  selectedCities: GeocodedLocation[];
  comparisonData: CityComparisonItem[];
  loading: boolean;
  error: string | null;
  highlights: MetricHighlightsMap;
  addCity: (city: GeocodedLocation) => boolean;
  removeCity: (cityId: string) => boolean;
  setCities: (cities: GeocodedLocation[]) => void;
  refetch: () => void;
  canAddCity: boolean;
  canRemoveCity: boolean;
  minCitiesReached: boolean;
  maxCitiesReached: boolean;
  availablePresets: GeocodedLocation[];
  simulatedUnavailableCityIds: string[];
  toggleSimulateUnavailable: (cityId: string) => void;
}

export function useCityComparison(
  initialCities: GeocodedLocation[] = DEFAULT_LOCATIONS
): UseCityComparisonResult {
  const [selectedCities, setSelectedCities] = useState<GeocodedLocation[]>(() => {
    if (initialCities.length < 2) return DEFAULT_LOCATIONS.slice(0, 2);
    if (initialCities.length > 4) return initialCities.slice(0, 4);
    return initialCities;
  });

  const [comparisonData, setComparisonData] = useState<CityComparisonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Testing feature: allow simulating unavailable data for testing integrity
  const [simulatedUnavailableCityIds, setSimulatedUnavailableCityIds] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (selectedCities.length === 0) {
        setComparisonData([]);
        setLoading(false);
        return;
      }

      try {
        const queryList = selectedCities.map((c) => ({
          cityId: c.id,
          cityName: c.name,
          state: c.state,
          coordinates: c.coordinates,
          isPredefinedCity: c.isPredefinedCity,
        }));

        const rawItems = await getCityComparisonData(queryList);

        if (!ignore) {
          const finalItems = rawItems.map((item) => {
            if (simulatedUnavailableCityIds.includes(item.cityId)) {
              return {
                ...item,
                isDataUnavailable: true,
                isSampleData: false,
                weather: item.weather
                  ? {
                      ...item.weather,
                      isDataUnavailable: true,
                      temperatureCelsius: 0,
                      humidityPercent: 0,
                      windSpeedKmh: 0,
                      apiContractNote: `GET /api/weather/${item.cityId} (Simulated Missing Sensor)`,
                    }
                  : null,
                airQuality: item.airQuality
                  ? {
                      ...item.airQuality,
                      isDataUnavailable: true,
                      aqi: 0,
                      apiContractNote: `GET /api/air-quality/${item.cityId} (Simulated Sensor Inactive)`,
                    }
                  : null,
                riskOverview: item.riskOverview
                  ? {
                      ...item.riskOverview,
                      isDataUnavailable: true,
                      overallScore: 0,
                      apiContractNote: `GET /api/climate-risk/${item.cityId} (Simulated Offline)`,
                    }
                  : null,
                apiContractNote: `Environmental sensory feed for ${item.cityName} is currently offline. API: GET /api/v1/cities/${item.cityId}/telemetry`,
              };
            }
            return item;
          });

          setComparisonData(finalItems);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error fetching comparative analytics");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [selectedCities, simulatedUnavailableCityIds, refreshCounter]);

  const addCity = useCallback(
    (city: GeocodedLocation): boolean => {
      if (selectedCities.length >= 4) return false;
      const exists = selectedCities.some(
        (c) => c.id.toLowerCase() === city.id.toLowerCase()
      );
      if (exists) return false;

      setLoading(true);
      setSelectedCities((prev) => [...prev, city]);
      return true;
    },
    [selectedCities]
  );

  const removeCity = useCallback(
    (cityId: string): boolean => {
      if (selectedCities.length <= 2) return false;
      setLoading(true);
      setSelectedCities((prev) =>
        prev.filter((c) => c.id.toLowerCase() !== cityId.toLowerCase())
      );
      return true;
    },
    [selectedCities]
  );

  const setCities = useCallback((cities: GeocodedLocation[]) => {
    const bounded = cities.slice(0, 4);
    if (bounded.length >= 2) {
      setLoading(true);
      setSelectedCities(bounded);
    }
  }, []);

  const toggleSimulateUnavailable = useCallback((cityId: string) => {
    setLoading(true);
    setSimulatedUnavailableCityIds((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshCounter((prev) => prev + 1);
  }, []);

  // Compute best and worst highlights safely ignoring unavailable data
  const highlights = useMemo(() => {
    return calculateMetricHighlights(comparisonData);
  }, [comparisonData]);

  // List of available mock presets not currently selected
  const availablePresets = useMemo(() => {
    return MOCK_INDIAN_CITIES.map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      displayName: `${c.name}, ${c.state}`,
      coordinates: c.coordinates,
      type: `Tier ${c.tier} City`,
      isPredefinedCity: true,
    })).filter(
      (preset) =>
        !selectedCities.some(
          (sel) => sel.id.toLowerCase() === preset.id.toLowerCase()
        )
    );
  }, [selectedCities]);

  return {
    selectedCities,
    comparisonData,
    loading,
    error,
    highlights,
    addCity,
    removeCity,
    setCities,
    refetch,
    canAddCity: selectedCities.length < 4,
    canRemoveCity: selectedCities.length > 2,
    minCitiesReached: selectedCities.length <= 2,
    maxCitiesReached: selectedCities.length >= 4,
    availablePresets,
    simulatedUnavailableCityIds,
    toggleSimulateUnavailable,
  };
}
