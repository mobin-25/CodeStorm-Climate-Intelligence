"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  EnvironmentalAlert,
  CityAlertsResponse,
  SeverityFilter,
  CategoryFilter,
  CityScopeFilter,
  ReadStatusFilter,
} from "@/types";
import { getEnvironmentalAlerts, AlertsQueryOptions } from "@/services";

export function useEnvironmentalAlerts(query: string | AlertsQueryOptions = "delhi") {
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDataUnavailable, setIsDataUnavailable] = useState<boolean>(false);
  const [apiContractNote, setApiContractNote] = useState<string | undefined>();
  const [activeCityId, setActiveCityId] = useState<string>("delhi");
  const [activeCityName, setActiveCityName] = useState<string>("New Delhi");

  // Filters
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [cityScope, setCityScope] = useState<CityScopeFilter>("current");
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("all");

  const queryKey =
    typeof query === "string"
      ? query
      : `${query.cityId}-${query.coordinates?.lat || ""}-${query.coordinates?.lng || ""}`;

  const fetchAlerts = useCallback(() => {
    let mounted = true;
    setLoading(true);

    getEnvironmentalAlerts(query)
      .then((res: CityAlertsResponse) => {
        if (mounted) {
          setAlerts(res.alerts);
          setIsDataUnavailable(!!res.isDataUnavailable);
          setApiContractNote(res.apiContractNote);
          setActiveCityId(res.cityId);
          setActiveCityName(res.cityName);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load environmental alert feeds"
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
    const cleanup = fetchAlerts();
    return cleanup;
  }, [fetchAlerts]);

  // Mark single alert as read
  const markAsRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  }, []);

  // Clear all alerts history
  const clearHistory = useCallback(() => {
    setAlerts([]);
  }, []);

  // Reset/reload demo fixtures
  const resetAlerts = useCallback(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Derived filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 1. Severity filter
      if (severityFilter !== "All" && alert.severity !== severityFilter) {
        return false;
      }
      // 2. Category filter
      if (categoryFilter !== "All" && alert.category !== categoryFilter) {
        return false;
      }
      // 3. City scope filter
      if (cityScope === "current" && alert.cityId.toLowerCase() !== activeCityId.toLowerCase()) {
        return false;
      }
      // 4. Read status filter
      if (readStatusFilter === "unread" && alert.isRead) {
        return false;
      }
      if (readStatusFilter === "read" && !alert.isRead) {
        return false;
      }
      return true;
    });
  }, [alerts, severityFilter, categoryFilter, cityScope, activeCityId, readStatusFilter]);

  // Calculate unread count (based on alerts relevant to active scope)
  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.isRead).length;
  }, [alerts]);

  const currentCityUnreadCount = useMemo(() => {
    return alerts.filter(
      (a) => !a.isRead && a.cityId.toLowerCase() === activeCityId.toLowerCase()
    ).length;
  }, [alerts, activeCityId]);

  return {
    alerts,
    filteredAlerts,
    loading,
    error,
    isDataUnavailable,
    apiContractNote,
    activeCityId,
    activeCityName,
    unreadCount,
    currentCityUnreadCount,
    // Filter states & setters
    severityFilter,
    setSeverityFilter,
    categoryFilter,
    setCategoryFilter,
    cityScope,
    setCityScope,
    readStatusFilter,
    setReadStatusFilter,
    // Actions
    markAsRead,
    markAllAsRead,
    clearHistory,
    resetAlerts,
    refetch: fetchAlerts,
  };
}
