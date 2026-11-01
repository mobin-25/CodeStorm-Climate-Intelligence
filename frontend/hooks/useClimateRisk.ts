"use client";

import { useState, useEffect } from "react";
import { CityClimateRiskOverview } from "@/types";
import { getClimateRisk, RiskQueryOptions } from "@/services";

export function useClimateRisk(query: string | RiskQueryOptions = "delhi") {
  const [riskData, setRiskData] = useState<CityClimateRiskOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    typeof query === "string"
      ? query
      : `${query.cityId}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getClimateRisk(query)
      .then((data) => {
        if (mounted) {
          setRiskData(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load climate risk evaluation"
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

  return { riskData, loading, error };
}
