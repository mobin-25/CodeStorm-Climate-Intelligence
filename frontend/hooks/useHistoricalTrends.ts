"use client";

import { useState, useEffect, useCallback } from "react";
import { CityHistoricalTrendsData, TimeRangeOption } from "@/types";
import { getHistoricalTrends, HistoricalQueryOptions } from "@/services";

export function useHistoricalTrends(
  query: string | HistoricalQueryOptions = "delhi",
  initialRange: TimeRangeOption = "6m"
) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(initialRange);
  const [historicalData, setHistoricalData] =
    useState<CityHistoricalTrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    typeof query === "string"
      ? `${query}-${timeRange}`
      : `${query.cityId}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}-${timeRange}`;

  const fetchData = useCallback(() => {
    let mounted = true;
    setLoading(true);

    getHistoricalTrends(query, timeRange)
      .then((data) => {
        if (mounted) {
          setHistoricalData(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load historical climate trends"
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

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, [fetchData]);

  return {
    historicalData,
    loading,
    error,
    timeRange,
    setTimeRange,
    refetch: fetchData,
  };
}
