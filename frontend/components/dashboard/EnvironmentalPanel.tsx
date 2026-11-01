"use client";

import React, { useState } from "react";
import { GlassPanel } from "@/components/shared";
import {
  CurrentWeather,
  AirQualityData,
  SevenDayForecastData,
  CityClimateRiskOverview,
  ClimateRiskAlert,
  CityHistoricalTrendsData,
  TimeRangeOption,
  EnvironmentalAlert,
  SeverityFilter,
  CategoryFilter,
  CityScopeFilter,
  ReadStatusFilter,
} from "@/types";
import { WeatherDashboard } from "@/components/weather";
import { AirQualityDashboard } from "@/components/air-quality";
import { SevenDayForecastDashboard } from "@/components/forecast";
import { ClimateRiskDashboard, RiskAlertBanner } from "@/components/risk";
import { HistoricalTrendsDashboard } from "@/components/climate";
import { EnvironmentalAlertsDashboard } from "@/components/alerts";
import { ClimateLayer } from "@/hooks";
import {
  SunMedium,
  Wind,
  CalendarDays,
  ShieldAlert,
  TrendingUp,
  BellRing,
} from "lucide-react";

interface EnvironmentalPanelProps {
  weather: CurrentWeather | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
  onRetryWeather?: () => void;

  airQuality: AirQualityData | null;
  airQualityLoading?: boolean;
  airQualityError?: string | null;
  onRetryAirQuality?: () => void;

  forecast: SevenDayForecastData | null;
  forecastLoading?: boolean;
  forecastError?: string | null;
  onRetryForecast?: () => void;

  riskData: CityClimateRiskOverview | null;
  riskLoading?: boolean;
  riskError?: string | null;
  onRetryRisk?: () => void;

  historicalData?: CityHistoricalTrendsData | null;
  historicalLoading?: boolean;
  historicalError?: string | null;
  timeRange?: TimeRangeOption;
  onTimeRangeChange?: (range: TimeRangeOption) => void;
  onRetryHistorical?: () => void;

  // Environmental Alerts & Notification props
  environmentalAlerts?: EnvironmentalAlert[];
  filteredAlerts?: EnvironmentalAlert[];
  alertsLoading?: boolean;
  alertsError?: string | null;
  alertsUnavailable?: boolean;
  alertsContractNote?: string;
  activeCityName?: string;
  unreadAlertCount?: number;
  severityFilter?: SeverityFilter;
  onSeverityChange?: (sev: SeverityFilter) => void;
  categoryFilter?: CategoryFilter;
  onCategoryChange?: (cat: CategoryFilter) => void;
  cityScope?: CityScopeFilter;
  onCityScopeChange?: (scope: CityScopeFilter) => void;
  readStatus?: ReadStatusFilter;
  onReadStatusChange?: (st: ReadStatusFilter) => void;
  onMarkAlertAsRead?: (id: string) => void;
  onMarkAllAlertsAsRead?: () => void;
  onClearAlertsHistory?: () => void;
  onResetAlerts?: () => void;
  onRetryAlerts?: () => void;

  alerts?: ClimateRiskAlert[];
  activeLayer?: ClimateLayer;
}

export type EnvironmentalTab =
  | "weather"
  | "air-quality"
  | "forecast"
  | "climate-risk"
  | "trends"
  | "alerts";

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({
  weather,
  weatherLoading,
  weatherError,
  onRetryWeather,
  airQuality,
  airQualityLoading,
  airQualityError,
  onRetryAirQuality,
  forecast,
  forecastLoading,
  forecastError,
  onRetryForecast,
  riskData,
  riskLoading,
  riskError,
  onRetryRisk,
  historicalData,
  historicalLoading,
  historicalError,
  timeRange = "6m",
  onTimeRangeChange,
  onRetryHistorical,
  // Alerts props
  environmentalAlerts = [],
  filteredAlerts = [],
  alertsLoading = false,
  alertsError = null,
  alertsUnavailable = false,
  alertsContractNote,
  activeCityName = "New Delhi",
  unreadAlertCount = 0,
  severityFilter = "All",
  onSeverityChange,
  categoryFilter = "All",
  onCategoryChange,
  cityScope = "current",
  onCityScopeChange,
  readStatus = "all",
  onReadStatusChange,
  onMarkAlertAsRead,
  onMarkAllAlertsAsRead,
  onClearAlertsHistory,
  onResetAlerts,
  onRetryAlerts,
  alerts = [],
  activeLayer,
}) => {
  const [activeTab, setActiveTab] = useState<EnvironmentalTab>("weather");
  const [prevLayer, setPrevLayer] = useState<ClimateLayer | undefined>(activeLayer);

  // Sync tab with active map layer selection without cascading effect renders
  if (activeLayer !== prevLayer) {
    setPrevLayer(activeLayer);
    if (activeLayer === "aqi") {
      setActiveTab("air-quality");
    } else if (activeLayer === "precipitation") {
      setActiveTab("forecast");
    } else if (activeLayer === "heatwave") {
      setActiveTab("climate-risk");
    } else if (activeLayer === "temperature" || activeLayer === "wind") {
      setActiveTab("weather");
    }
  }

  return (
    <section className="absolute left-4 sm:left-5 top-24 md:top-24 bottom-[72px] sm:bottom-[78px] z-40 flex flex-col gap-3 pointer-events-none max-w-[350px] sm:max-w-[440px]">
      {/* Sleek Glassmorphic Mode Toggle Pill */}
      <GlassPanel
        variant="control"
        className="p-1 pointer-events-auto flex items-center gap-1 shadow-md self-start shrink-0 overflow-x-auto max-w-full custom-scrollbar"
      >
        {/* Tab 1: Weather */}
        <button
          type="button"
          onClick={() => setActiveTab("weather")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "weather"
              ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
          }`}
        >
          <SunMedium className="w-3.5 h-3.5" />
          <span>Weather</span>
          {weather?.temperatureCelsius !== undefined && !weather.isDataUnavailable && (
            <span
              className={`text-[10px] px-1 py-0.2 rounded-md ${
                activeTab === "weather"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-[#475569]"
              }`}
            >
              {weather.temperatureCelsius.toFixed(0)}°
            </span>
          )}
        </button>

        {/* Tab 2: Air Quality */}
        <button
          type="button"
          onClick={() => setActiveTab("air-quality")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "air-quality"
              ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Air</span>
          {airQuality?.aqi !== undefined && !airQuality.isDataUnavailable && (
            <span
              className={`text-[10px] px-1 py-0.2 rounded-md ${
                activeTab === "air-quality"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-[#475569]"
              }`}
            >
              AQI {airQuality.aqi}
            </span>
          )}
        </button>

        {/* Tab 3: 7-Day Forecast */}
        <button
          type="button"
          onClick={() => setActiveTab("forecast")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "forecast"
              ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>7-Day</span>
        </button>

        {/* Tab 4: Climate Risk */}
        <button
          type="button"
          onClick={() => setActiveTab("climate-risk")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "climate-risk"
              ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Risk</span>
        </button>

        {/* Tab 5: Historical Trends */}
        <button
          type="button"
          onClick={() => setActiveTab("trends")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "trends"
              ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Trends</span>
        </button>

        {/* Tab 6: Environmental Alerts */}
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "alerts"
              ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Alerts</span>
          {unreadAlertCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "alerts"
                  ? "bg-red-500 text-white"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {unreadAlertCount}
            </span>
          )}
        </button>

      </GlassPanel>

      {/* Scrollable Container for Dashboard Card and Risk Alerts */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pointer-events-none custom-scrollbar">
        {/* Render Weather, Air Quality, 7-Day Forecast, Climate Risk, Historical Trends, or Alerts Dashboard */}
        <div className="pointer-events-auto shrink-0">
          {activeTab === "weather" ? (
            <WeatherDashboard
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              onRetry={onRetryWeather}
            />
          ) : activeTab === "air-quality" ? (
            <AirQualityDashboard
              airQuality={airQuality}
              loading={airQualityLoading}
              error={airQualityError}
              onRetry={onRetryAirQuality}
            />
          ) : activeTab === "forecast" ? (
            <SevenDayForecastDashboard
              forecast={forecast}
              loading={forecastLoading}
              error={forecastError}
              onRetry={onRetryForecast}
            />
          ) : activeTab === "climate-risk" ? (
            <ClimateRiskDashboard
              riskData={riskData}
              loading={riskLoading}
              error={riskError}
              onRetry={onRetryRisk}
            />
          ) : activeTab === "trends" ? (
            <HistoricalTrendsDashboard
              data={historicalData ?? null}
              loading={historicalLoading}
              error={historicalError}
              timeRange={timeRange}
              onTimeRangeChange={onTimeRangeChange ?? (() => {})}
              onRetry={onRetryHistorical}
            />
          ) : (
            <EnvironmentalAlertsDashboard
              alerts={environmentalAlerts}
              filteredAlerts={filteredAlerts}
              loading={alertsLoading}
              error={alertsError}
              isDataUnavailable={alertsUnavailable}
              apiContractNote={alertsContractNote}
              activeCityName={activeCityName}
              unreadCount={unreadAlertCount}
              severityFilter={severityFilter}
              onSeverityChange={onSeverityChange ?? (() => {})}
              categoryFilter={categoryFilter}
              onCategoryChange={onCategoryChange ?? (() => {})}
              cityScope={cityScope}
              onCityScopeChange={onCityScopeChange ?? (() => {})}
              readStatus={readStatus}
              onReadStatusChange={onReadStatusChange ?? (() => {})}
              onMarkAsRead={onMarkAlertAsRead ?? (() => {})}
              onMarkAllAsRead={onMarkAllAlertsAsRead ?? (() => {})}
              onClearHistory={onClearAlertsHistory ?? (() => {})}
              onResetAlerts={onResetAlerts ?? (() => {})}
              onRetry={onRetryAlerts}
            />
          )}
        </div>

        {/* Hazard Risk Alert Banner */}
        {alerts && alerts.length > 0 && activeTab !== "alerts" && (
          <div
            onClick={() => setActiveTab("alerts")}
            className="pointer-events-auto shrink-0 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
            title="Click to view full environmental alerts"
          >
            <RiskAlertBanner alerts={alerts} />
          </div>
        )}
      </div>
    </section>
  );
};
