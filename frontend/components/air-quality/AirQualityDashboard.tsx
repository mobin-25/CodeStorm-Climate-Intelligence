"use client";

import React from "react";
import { GlassPanel } from "@/components/shared";
import { AirQualityData, AQICategory } from "@/types";
import { AQIPollutantCard } from "./AQIPollutantCard";
import {
  Wind,
  Clock,
  AlertCircle,
  RefreshCw,
  Radio,
  MapPin,
  Sparkles,
  ShieldAlert,
  Info,
} from "lucide-react";

interface AirQualityDashboardProps {
  airQuality: AirQualityData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

// Helper to get standard CPCB Indian AQI category styling
function getAQICategoryDetails(category: AQICategory, aqi: number) {
  switch (category) {
    case "Good":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-300",
        text: "text-[#059669]",
        badgeBg: "bg-emerald-500 text-white",
        desc: "Minimal health impact. Air quality is clean.",
        range: "0 - 50",
      };
    case "Satisfactory":
      return {
        bg: "bg-teal-50",
        border: "border-teal-300",
        text: "text-[#0D9488]",
        badgeBg: "bg-teal-500 text-white",
        desc: "Minor breathing discomfort to sensitive people.",
        range: "51 - 100",
      };
    case "Moderate":
      return {
        bg: "bg-amber-50",
        border: "border-amber-300",
        text: "text-[#D97706]",
        badgeBg: "bg-amber-500 text-white",
        desc: "Breathing discomfort to people with lungs/heart disease.",
        range: "101 - 200",
      };
    case "Poor":
      return {
        bg: "bg-orange-50",
        border: "border-orange-300",
        text: "text-[#EA580C]",
        badgeBg: "bg-orange-500 text-white",
        desc: "Breathing discomfort to most people on prolonged exposure.",
        range: "201 - 300",
      };
    case "Very Poor":
      return {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-[#DC2626]",
        badgeBg: "bg-red-500 text-white",
        desc: "Respiratory illness on prolonged exposure.",
        range: "301 - 400",
      };
    case "Severe":
      return {
        bg: "bg-purple-50",
        border: "border-purple-300",
        text: "text-[#7C3AED]",
        badgeBg: "bg-purple-600 text-white",
        desc: "Affects healthy people and seriously impacts those with existing conditions.",
        range: "401 - 500+",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-300",
        text: "text-[#64748B]",
        badgeBg: "bg-slate-500 text-white",
        desc: "Awaiting air quality data.",
        range: "--",
      };
  }
}

export const AirQualityDashboard: React.FC<AirQualityDashboardProps> = ({
  airQuality,
  loading = false,
  error = null,
  onRetry,
  className = "",
}) => {
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
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  // 2. Error State
  if (error || !airQuality) {
    return (
      <GlassPanel
        variant="panel"
        className={`p-4 sm:p-5 w-80 sm:w-96 pointer-events-auto shadow-xl border border-red-200 ${className}`}
      >
        <div className="flex items-center gap-2 text-[#DC2626]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[14px] font-bold">Failed to load air quality</span>
        </div>
        <p className="text-[12px] text-[#64748B] mt-2">
          {error || "Unable to retrieve environmental observations for this location."}
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

  const isUnavailable = Boolean(airQuality.isDataUnavailable);
  const categoryDetails = getAQICategoryDetails(airQuality.category, airQuality.aqi);

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
              {airQuality.cityName}
            </h3>
            {/* DEMO / AWAITING DATA Badge */}
            {isUnavailable ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-amber-200 text-[10px] font-bold tracking-wide uppercase">
                Awaiting Data
              </span>
            ) : airQuality.isSampleData ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] border border-slate-200 text-[10px] font-bold tracking-wide uppercase">
                <Sparkles className="w-2.5 h-2.5 text-[#059669]" />
                DEMO
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-[10px] font-bold tracking-wide uppercase">
                Live Sensor
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
            {airQuality.coordinates ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0284C7]" />
                {airQuality.coordinates.lat.toFixed(2)}°N, {airQuality.coordinates.lng.toFixed(2)}°E
              </span>
            ) : (
              <span>CPCB Monitoring Grid</span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#64748B]" />
              {formatTimestamp(airQuality.timestamp)}
            </span>
          </div>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-center text-[#059669] shadow-2xs shrink-0">
          <Wind className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* Unavailable State Notice */}
      {isUnavailable && (
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[12px] text-[#78350F] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
            <Radio className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
            <span>Awaiting Environmental Data</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Real sensor integration for this location is pending. No fabricated AQI values are displayed.
          </p>
          {airQuality.apiContractNote && (
            <div className="mt-1 pt-1.5 border-t border-amber-200/60 font-mono text-[10px] text-[#92400E] break-all">
              Contract: {airQuality.apiContractNote}
            </div>
          )}
        </div>
      )}

      {/* Main Overall AQI Banner Card */}
      <div
        className={`p-3.5 rounded-2xl border transition-all duration-300 ${
          isUnavailable
            ? "bg-slate-50 border-slate-200"
            : `${categoryDetails.bg} ${categoryDetails.border}`
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B] block">
              Overall Air Quality Index
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-[32px] sm:text-[36px] font-black tracking-tight text-[#0F172A] leading-none">
                {isUnavailable ? "--" : airQuality.aqi}
              </span>
              {!isUnavailable && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${categoryDetails.badgeBg}`}
                >
                  {airQuality.category}
                </span>
              )}
            </div>
          </div>

          {!isUnavailable && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide block">
                Dominant
              </span>
              <span className="text-[13px] font-black text-[#0F172A]">
                {airQuality.dominantPollutant}
              </span>
            </div>
          )}
        </div>

        {/* Understandable AQI 6-Stage Visual Indicator Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[9px] font-bold text-[#64748B] mb-1">
            <span>Good (0)</span>
            <span>Mod (100)</span>
            <span>Poor (200)</span>
            <span>Severe (400+)</span>
          </div>
          <div className="w-full h-2 rounded-full flex overflow-hidden gap-0.5 bg-slate-200/60 p-0.5">
            <div className="flex-1 rounded-l-full bg-emerald-500" title="Good (0-50)" />
            <div className="flex-1 bg-teal-500" title="Satisfactory (51-100)" />
            <div className="flex-1 bg-amber-500" title="Moderate (101-200)" />
            <div className="flex-1 bg-orange-500" title="Poor (201-300)" />
            <div className="flex-1 bg-red-500" title="Very Poor (301-400)" />
            <div className="flex-1 rounded-r-full bg-purple-600" title="Severe (401-500)" />
          </div>
        </div>

        {/* Health Impact Note */}
        {!isUnavailable && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] text-[#475569]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
            <span className="leading-snug">{airQuality.healthAdvisory}</span>
          </div>
        )}
      </div>

      {/* Grid of 6 Dedicated Pollutant Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
            Key Pollutants (CPCB India)
          </span>
          <span className="text-[10px] text-[#94A3B8] flex items-center gap-1">
            <Info className="w-3 h-3" />
            24-hr standard
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <AQIPollutantCard
            pollutant={airQuality.pollutants.pm25}
            isUnavailable={isUnavailable}
          />
          <AQIPollutantCard
            pollutant={airQuality.pollutants.pm10}
            isUnavailable={isUnavailable}
          />
          <AQIPollutantCard
            pollutant={airQuality.pollutants.no2}
            isUnavailable={isUnavailable}
          />
          <AQIPollutantCard
            pollutant={airQuality.pollutants.so2}
            isUnavailable={isUnavailable}
          />
          <AQIPollutantCard
            pollutant={airQuality.pollutants.co}
            isUnavailable={isUnavailable}
          />
          <AQIPollutantCard
            pollutant={airQuality.pollutants.o3}
            isUnavailable={isUnavailable}
          />
        </div>
      </div>

      {/* Footer Provenance Note */}
      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-[#64748B]">
        <span>
          {airQuality.isSampleData ? "Demo values for prototype testing" : "Verified environmental reading"}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            title="Refresh air quality data"
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
