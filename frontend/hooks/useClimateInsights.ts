"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CityInsightsData,
  EnvironmentalInsight,
  SmartRecommendation,
  ProfileFilter,
  InsightCategory,
  InsightsQueryOptions,
} from "@/types";
import { getClimateInsights } from "@/services";

export interface UseClimateInsightsResult {
  data: CityInsightsData | null;
  loading: boolean;
  error: string | null;
  activeProfile: ProfileFilter;
  setActiveProfile: (profile: ProfileFilter) => void;
  activeCategory: InsightCategory | "all";
  setActiveCategory: (cat: InsightCategory | "all") => void;
  filteredInsights: EnvironmentalInsight[];
  filteredRecommendations: SmartRecommendation[];
  refetch: () => void;
  isDataUnavailable: boolean;
  apiContractNote?: string;
}

export function useClimateInsights(
  query: InsightsQueryOptions = { cityId: "delhi" }
): UseClimateInsightsResult {
  const [data, setData] = useState<CityInsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<ProfileFilter>("all");
  const [activeCategory, setActiveCategory] = useState<InsightCategory | "all">("all");
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const queryKey = `${query.cityId}-${query.cityName || ""}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}`;

  useEffect(() => {
    let ignore = false;

    async function loadInsights() {
      try {
        const insightsData = await getClimateInsights(query);
        if (!ignore) {
          setData(insightsData);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load climate insights");
          setLoading(false);
        }
      }
    }

    loadInsights();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, refreshCounter]);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshCounter((prev) => prev + 1);
  }, []);

  const handleSetProfile = useCallback((profile: ProfileFilter) => {
    setActiveProfile(profile);
  }, []);

  const handleSetCategory = useCallback((cat: InsightCategory | "all") => {
    setActiveCategory(cat);
  }, []);

  // Filter insights by category
  const filteredInsights = useMemo(() => {
    if (!data?.insights) return [];
    if (activeCategory === "all") return data.insights;
    return data.insights.filter((ins) => ins.category === activeCategory);
  }, [data, activeCategory]);

  // Filter recommendations by active profile
  const filteredRecommendations = useMemo(() => {
    if (!data?.recommendations) return [];
    if (activeProfile === "all") return data.recommendations;
    return data.recommendations.filter(
      (rec) =>
        rec.targetProfiles.includes(activeProfile) ||
        rec.targetProfiles.includes("all") ||
        rec.targetProfiles.includes("general")
    );
  }, [data, activeProfile]);

  return {
    data,
    loading,
    error,
    activeProfile,
    setActiveProfile: handleSetProfile,
    activeCategory,
    setActiveCategory: handleSetCategory,
    filteredInsights,
    filteredRecommendations,
    refetch,
    isDataUnavailable: Boolean(data?.isDataUnavailable),
    apiContractNote: data?.apiContractNote,
  };
}
