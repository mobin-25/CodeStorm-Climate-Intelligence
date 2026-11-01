"use client";

import React, { useState } from "react";
import { GlassPanel } from "@/components/shared";
import { SevenDayForecastData } from "@/types";
import { RainfallRiskCard } from "./RainfallRiskCard";
import { ForecastDayCard } from "./ForecastDayCard";
import { TemperatureTrendChart } from "./TemperatureTrendChart";
import { RainfallChart } from "./RainfallChart";
import {
  CalendarDays,
  Clock,
  AlertCircle,
  RefreshCw,
  Radio,
  MapPin,
  Sparkles,
  TrendingUp,
  CloudRain,
} from "lucide-react";

interface SevenDayForecastDashboardProps {
  forecast: SevenDayForecastData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const SevenDayForecastDashboard: React.FC<SevenDayForecastDashboardProps> = ({
  forecast,
  loading = false,
  error = null,
  onRetry,
  className = "",
}) => {
  const [activeChart, setActiveChart] = useState<"temperature" | "rainfall">("temperature");

  // 1. Loading State Skeleton
  if (loading) {
    return (
      <GlassPanel
        variant="panel"
        className={`p-4 sm:p-5 w-80 sm:w-96 pointer-events-auto shadow-xl animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-6 w-36 bg-slate-200 rounded" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-200" />
        </div>
        <div className="h-24 bg-slate-100 rounded-2xl mt-4" />
        <div className="h-44 bg-slate-100 rounded-2xl mt-3" />
        <div className="space-y-2 mt-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  // 2. Error State
  if (error || !forecast) {
    return (
      <GlassPanel
        variant="panel"
        className={`p-4 sm:p-5 w-80 sm:w-96 pointer-events-auto shadow-xl border border-red-200 ${className}`}
      >
        <div className="flex items-center gap-2 text-[#DC2626]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[14px] font-bold">Failed to load forecast</span>
        </div>
        <p className="text-[12px] text-[#64748B] mt-2">
          {error || "Unable to retrieve meteorological forecast for this location."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </GlassPanel>
    );
  }

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "--";
    }
  };

  const isUnavailable = Boolean(forecast.isDataUnavailable);

  return (
    <GlassPanel
      variant="panel"
      className={`p-4 sm:p-5 w-80 sm:w-96 pointer-events-auto shadow-xl border border-white/85 flex flex-col gap-3.5 ${className}`}
    >
      {/* Header with City & Data Provenance Status */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0F172A] leading-tight tracking-tight">
              {forecast.cityName}
            </h3>
            {/* DEMO / AWAITING DATA Badge */}
            {isUnavailable ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-amber-200 text-[10px] font-bold tracking-wide uppercase">
                Awaiting Data
              </span>
            ) : forecast.isSampleData ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] border border-slate-200 text-[10px] font-bold tracking-wide uppercase">
                <Sparkles className="w-2.5 h-2.5 text-[#059669]" />
                DEMO
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-[10px] font-bold tracking-wide uppercase">
                Live Model
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
            {forecast.coordinates ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0284C7]" />
                {forecast.coordinates.lat.toFixed(2)}°N, {forecast.coordinates.lng.toFixed(2)}°E
              </span>
            ) : (
              <span>7-Day Synoptic Model</span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#64748B]" />
              {formatTimestamp(forecast.timestamp)}
            </span>
          </div>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-center text-[#2563EB] shadow-2xs shrink-0">
          <CalendarDays className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* Unavailable State Notice */}
      {isUnavailable && (
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[12px] text-[#78350F] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
            <Radio className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
            <span>Forecast Data Unavailable</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Numerical weather prediction for this geographical coordinate is not yet configured. No fabricated forecast values are displayed.
          </p>
          {forecast.apiContractNote && (
            <div className="mt-1 pt-1.5 border-t border-amber-200/60 font-mono text-[10px] text-[#92400E] break-all">
              Contract: {forecast.apiContractNote}
            </div>
          )}
        </div>
      )}

      {/* 3. Rainfall Risk Indicator Banner */}
      <RainfallRiskCard
        rainfallRisk={forecast.rainfallRisk}
        isUnavailable={isUnavailable}
      />

      {/* 2. Forecast Visualizations (Temperature Trend & Rainfall Probability Charts) */}
      {!isUnavailable && forecast.days && forecast.days.length > 0 && (
        <div className="space-y-2">
          {/* Chart View Toggle Pill */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
              Forecast Charts
            </span>

            <div className="p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center gap-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveChart("temperature")}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activeChart === "temperature"
                    ? "bg-white text-[#EA580C] shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Temp</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChart("rainfall")}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activeChart === "rainfall"
                    ? "bg-white text-[#0284C7] shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <CloudRain className="w-3 h-3" />
                <span>Rain</span>
              </button>
            </div>
          </div>

          {/* Active Chart Component */}
          {activeChart === "temperature" ? (
            <TemperatureTrendChart days={forecast.days} />
          ) : (
            <RainfallChart days={forecast.days} />
          )}
        </div>
      )}

      {/* 1. 7-Day Weekly Breakdown List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
            7-Day Daily Breakdown
          </span>
          <span className="text-[10px] text-[#94A3B8]">
            {isUnavailable ? "0 days" : `${forecast.days.length} days`}
          </span>
        </div>

        {isUnavailable || !forecast.days || forecast.days.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-[12px] text-[#64748B]">
            Awaiting numerical weather prediction models for this location.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
            {forecast.days.map((day) => (
              <ForecastDayCard key={day.date} day={day} isUnavailable={isUnavailable} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Provenance Note */}
      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-[#64748B]">
        <span>
          {forecast.isSampleData ? "Demo fixtures for evaluation" : "Verified meteorological forecast"}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            title="Refresh forecast model"
            className="flex items-center gap-1 hover:text-[#059669] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync</span>
          </button>
        )}
      </div>
    </GlassPanel>
  );
};
