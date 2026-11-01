"use client";

import { useState, useEffect } from "react";
import { SevenDayForecastData } from "@/types";
import { getSevenDayForecast, ForecastQueryOptions } from "@/services";

export function useForecast(query: string | ForecastQueryOptions = "delhi") {
  const [forecast, setForecast] = useState<SevenDayForecastData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    typeof query === "string"
      ? query
      : `${query.cityId}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getSevenDayForecast(query)
      .then((data) => {
        if (mounted) {
          setForecast(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load 7-day weather forecast"
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

  return { forecast, loading, error };
}
