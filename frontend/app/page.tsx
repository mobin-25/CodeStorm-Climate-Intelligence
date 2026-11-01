"use client";

import React, { useState, useMemo } from "react";
import { TopFloatingNav } from "@/components/navigation";
import {
  InteractiveMap,
  LayerControlPill,
} from "@/components/map";
import { EnvironmentalPanel } from "@/components/dashboard";
import {
  useWeather,
  useAirQuality,
  useClimateRisk,
  useForecast,
  useHistoricalTrends,
  useEnvironmentalAlerts,
  useMapState,
} from "@/hooks";
import { NotificationCenterDrawer } from "@/components/alerts";
import { MOCK_RISK_ALERTS, MOCK_INDIAN_CITIES } from "@/data/mock";
import { GeocodedLocation } from "@/types";

export default function Home() {
  const { activeLayer, setActiveLayer, selectedCityId, setSelectedCityId } = useMapState();
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation | null>(null);
  const [resetKey, setResetKey] = useState<number>(0);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);

  const environmentalQuery = useMemo(() => {
    if (selectedLocation) {
      return {
        cityId: selectedLocation.id,
        cityName: selectedLocation.name,
        coordinates: selectedLocation.coordinates,
      };
    }
    return { cityId: selectedCityId || "delhi" };
  }, [selectedLocation, selectedCityId]);

  const { weather, loading: weatherLoading, error: weatherError } = useWeather(environmentalQuery);
  const { airQuality, loading: aqiLoading, error: aqiError } = useAirQuality(environmentalQuery);
  const { riskData, loading: riskLoading, error: riskError } = useClimateRisk(environmentalQuery);
  const { forecast, loading: forecastLoading, error: forecastError } = useForecast(environmentalQuery);
  const {
    historicalData,
    loading: histLoading,
    error: histError,
    timeRange,
    setTimeRange,
    refetch: refetchHistorical,
  } = useHistoricalTrends(environmentalQuery);
  const alertsHook = useEnvironmentalAlerts(environmentalQuery);

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
    const preset = MOCK_INDIAN_CITIES.find((c) => c.id === cityId);
    if (preset) {
      setSelectedLocation({
        id: preset.id,
        name: preset.name,
        displayName: `${preset.name}, ${preset.state}, India`,
        state: preset.state,
        coordinates: preset.coordinates,
        type: "city",
      });
    }
  };

  const handleLocationSelect = (location: GeocodedLocation) => {
    setSelectedLocation(location);
    setSelectedCityId(location.id);
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setSelectedCityId(undefined);
    setResetKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    refetchHistorical();
    alertsHook.refetch();
    if (selectedLocation) {
      setSelectedLocation({ ...selectedLocation });
    } else {
      setSelectedCityId(selectedCityId || "delhi");
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#ECFDF5]">
      {/* 1. Full-Screen Interactive Leaflet Map occupying central dashboard behind floating panels */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap
          activeLayer={activeLayer}
          selectedCityId={selectedCityId}
          selectedLocation={selectedLocation}
          resetKey={resetKey}
          onCitySelect={handleCitySelect}
          onClearSelection={handleClearSelection}
        />
      </div>

      {/* 2. Top Floating Navigation Bar with ClimateScope Branding, City Search & Notification Bell */}
      <TopFloatingNav
        currentCityName={selectedLocation ? selectedLocation.name : "India"}
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        onClearSelection={handleClearSelection}
        unreadAlertCount={alertsHook.unreadCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
      />

      {/* 3. Right-hand Floating Climate Layers Control */}
      <LayerControlPill
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
      />

      {/* 4. Left-hand Floating Weather, Air Quality, 7-Day Forecast, Climate Risk, Historical Trends & Alerts Panel */}
      <EnvironmentalPanel
        weather={weather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        onRetryWeather={handleRefresh}
        airQuality={airQuality}
        airQualityLoading={aqiLoading}
        airQualityError={aqiError}
        onRetryAirQuality={handleRefresh}
        forecast={forecast}
        forecastLoading={forecastLoading}
        forecastError={forecastError}
        onRetryForecast={handleRefresh}
        riskData={riskData}
        riskLoading={riskLoading}
        riskError={riskError}
        onRetryRisk={handleRefresh}
        historicalData={historicalData}
        historicalLoading={histLoading}
        historicalError={histError}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRetryHistorical={handleRefresh}
        environmentalAlerts={alertsHook.alerts}
        filteredAlerts={alertsHook.filteredAlerts}
        alertsLoading={alertsHook.loading}
        alertsError={alertsHook.error}
        alertsUnavailable={alertsHook.isDataUnavailable}
        alertsContractNote={alertsHook.apiContractNote}
        activeCityName={alertsHook.activeCityName}
        unreadAlertCount={alertsHook.unreadCount}
        severityFilter={alertsHook.severityFilter}
        onSeverityChange={alertsHook.setSeverityFilter}
        categoryFilter={alertsHook.categoryFilter}
        onCategoryChange={alertsHook.setCategoryFilter}
        cityScope={alertsHook.cityScope}
        onCityScopeChange={alertsHook.setCityScope}
        readStatus={alertsHook.readStatusFilter}
        onReadStatusChange={alertsHook.setReadStatusFilter}
        onMarkAlertAsRead={alertsHook.markAsRead}
        onMarkAllAlertsAsRead={alertsHook.markAllAsRead}
        onClearAlertsHistory={alertsHook.clearHistory}
        onResetAlerts={alertsHook.resetAlerts}
        onRetryAlerts={handleRefresh}
        alerts={MOCK_RISK_ALERTS}
        activeLayer={activeLayer}
      />

      {/* 5. Floating Notification Centre Modal / Drawer */}
      <NotificationCenterDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        alerts={alertsHook.alerts}
        unreadCount={alertsHook.unreadCount}
        onMarkAsRead={alertsHook.markAsRead}
        onMarkAllAsRead={alertsHook.markAllAsRead}
        onClearHistory={alertsHook.clearHistory}
        onResetAlerts={alertsHook.resetAlerts}
      />

      {/* 6. Bottom Platform Active Status Pill (Bottom-Left) */}
      <footer className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 z-40 pointer-events-none">
        <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-[14px] sm:rounded-[16px] bg-white/90 backdrop-blur-[16px] border border-white/85 shadow-sm text-[12px] sm:text-[13px] text-[#475569] flex items-center gap-2 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-2xs animate-pulse" />
          <span>Platform Active • <strong className="font-bold text-[#0F172A]">ClimateScope</strong></span>
        </div>
      </footer>
    </main>
  );
}
