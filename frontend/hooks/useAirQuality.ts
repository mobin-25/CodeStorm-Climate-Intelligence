"use client";

import { useState, useEffect } from "react";
import { AirQualityData } from "@/types";
import { getAirQuality, AirQualityQueryOptions } from "@/services";

export function useAirQuality(query: string | AirQualityQueryOptions = "delhi") {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    typeof query === "string"
      ? query
      : `${query.cityId}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getAirQuality(query)
      .then((data) => {
        if (mounted) {
          setAirQuality(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load air quality intelligence"
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

  return { airQuality, loading, error };
}
