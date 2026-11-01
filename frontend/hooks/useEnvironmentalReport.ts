"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  EnvironmentalReportData,
  GeocodedLocation,
  ReportType,
  ReportDateRange,
  ReportSummaryMetrics,
} from "@/types";
import {
  fetchReportData,
  exportReportToCSV,
  printReportToPDF,
} from "@/services";
import { MOCK_INDIAN_CITIES } from "@/data/mock";

const DEFAULT_REPORT_LOCATION: GeocodedLocation = {
  id: "delhi",
  name: "New Delhi",
  state: "Delhi NCT",
  displayName: "New Delhi, Delhi NCT",
  coordinates: { lat: 28.6139, lng: 77.209 },
  type: "Tier 1 City",
  isPredefinedCity: true,
};

export interface UseEnvironmentalReportResult {
  selectedLocation: GeocodedLocation;
  reportType: ReportType;
  dateRange: ReportDateRange;
  reportData: EnvironmentalReportData | null;
  loading: boolean;
  error: string | null;
  summaryMetrics: ReportSummaryMetrics;
  setSelectedLocation: (loc: GeocodedLocation) => void;
  setReportType: (type: ReportType) => void;
  setDateRange: (range: ReportDateRange) => void;
  refetch: () => void;
  exportCSV: () => void;
  downloadPDF: () => void;
  availablePresets: GeocodedLocation[];
}

export function useEnvironmentalReport(
  initialLocation: GeocodedLocation = DEFAULT_REPORT_LOCATION,
  initialType: ReportType = "complete",
  initialRange: ReportDateRange = "30d"
): UseEnvironmentalReportResult {
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation>(initialLocation);
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [dateRange, setDateRange] = useState<ReportDateRange>(initialRange);
  const [reportData, setReportData] = useState<EnvironmentalReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  useEffect(() => {
    let ignore = false;

    async function loadReport() {
      try {
        const data = await fetchReportData(selectedLocation, reportType, dateRange);
        if (!ignore) {
          setReportData(data);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load report data");
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      ignore = true;
    };
  }, [selectedLocation, reportType, dateRange, refreshCounter]);

  const handleSetLocation = useCallback((loc: GeocodedLocation) => {
    setLoading(true);
    setSelectedLocation(loc);
  }, []);

  const handleSetReportType = useCallback((type: ReportType) => {
    setLoading(true);
    setReportType(type);
  }, []);

  const handleSetDateRange = useCallback((range: ReportDateRange) => {
    setLoading(true);
    setDateRange(range);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshCounter((prev) => prev + 1);
  }, []);

  const exportCSV = useCallback(() => {
    if (reportData) {
      exportReportToCSV(reportData);
    }
  }, [reportData]);

  const downloadPDF = useCallback(() => {
    printReportToPDF();
  }, []);

  // Summary indicators
  const summaryMetrics: ReportSummaryMetrics = useMemo(() => {
    return {
      compositeRiskScore:
        reportData?.riskData && !reportData.riskData.isDataUnavailable
          ? reportData.riskData.overallScore
          : null,
      riskCategory:
        reportData?.riskData && !reportData.riskData.isDataUnavailable
          ? reportData.riskData.overallCategory
          : null,
      temperatureCelsius:
        reportData?.weather && !reportData.weather.isDataUnavailable
          ? reportData.weather.temperatureCelsius
          : null,
      humidityPercent:
        reportData?.weather && !reportData.weather.isDataUnavailable
          ? reportData.weather.humidityPercent
          : null,
      windSpeedKmh:
        reportData?.weather && !reportData.weather.isDataUnavailable
          ? reportData.weather.windSpeedKmh
          : null,
      aqi:
        reportData?.airQuality && !reportData.airQuality.isDataUnavailable
          ? reportData.airQuality.aqi
          : null,
      aqiCategory:
        reportData?.airQuality && !reportData.airQuality.isDataUnavailable
          ? reportData.airQuality.category
          : null,
      pm25:
        reportData?.airQuality?.pollutants?.pm25 && !reportData.airQuality.isDataUnavailable
          ? reportData.airQuality.pollutants.pm25.value
          : null,
      pm10:
        reportData?.airQuality?.pollutants?.pm10 && !reportData.airQuality.isDataUnavailable
          ? reportData.airQuality.pollutants.pm10.value
          : null,
      activeAlertsCount: reportData?.alerts ? reportData.alerts.length : 0,
    };
  }, [reportData]);

  const availablePresets = useMemo(() => {
    return MOCK_INDIAN_CITIES.map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      displayName: `${c.name}, ${c.state}`,
      coordinates: c.coordinates,
      type: `Tier ${c.tier} City`,
      isPredefinedCity: true,
    }));
  }, []);

  return {
    selectedLocation,
    reportType,
    dateRange,
    reportData,
    loading,
    error,
    summaryMetrics,
    setSelectedLocation: handleSetLocation,
    setReportType: handleSetReportType,
    setDateRange: handleSetDateRange,
    refetch,
    exportCSV,
    downloadPDF,
    availablePresets,
  };
}

