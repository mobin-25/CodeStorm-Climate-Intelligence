"use client";

import { useState, useEffect } from "react";
import { CurrentWeather } from "@/types";
import { getCurrentWeather, WeatherQueryOptions } from "@/services";

export function useWeather(query: string | WeatherQueryOptions = "delhi") {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    typeof query === "string"
      ? query
      : `${query.cityId}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getCurrentWeather(query)
      .then((data) => {
        if (mounted) {
          setWeather(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load environmental data"
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return { weather, loading, error };
}
