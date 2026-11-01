"use client";

import React from "react";
import { GlassPanel } from "@/components/shared";
import { CityClimateRiskOverview, ClimateRiskCategory } from "@/types";
import { RiskCircularMeter } from "./RiskCircularMeter";
import { RiskCategoryCard } from "./RiskCategoryCard";
import {
  ShieldAlert,
  Clock,
  AlertCircle,
  RefreshCw,
  Radio,
  MapPin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface ClimateRiskDashboardProps {
  riskData: CityClimateRiskOverview | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

function getOverallBadgeColor(category: ClimateRiskCategory) {
  switch (category) {
    case "Low":
      return "bg-emerald-50 text-[#059669] border-emerald-300";
    case "Moderate":
      return "bg-yellow-50 text-[#CA8A04] border-yellow-300";
    case "High":
      return "bg-orange-50 text-[#EA580C] border-orange-300";
    case "Very High":
      return "bg-red-50 text-[#DC2626] border-red-300";
  }
}

export const ClimateRiskDashboard: React.FC<ClimateRiskDashboardProps> = ({
  riskData,
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
        <div className="h-28 bg-slate-100 rounded-2xl mt-4" />
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  // 2. Error State
  if (error || !riskData) {
    return (
      <GlassPanel
        variant="panel"
        className={`p-4 sm:p-5 w-80 sm:w-96 pointer-events-auto shadow-xl border border-red-200 ${className}`}
      >
        <div className="flex items-center gap-2 text-[#DC2626]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[14px] font-bold">Failed to load risk analysis</span>
        </div>
        <p className="text-[12px] text-[#64748B] mt-2">
          {error || "Unable to retrieve environmental hazard evaluations for this location."}
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

  const isUnavailable = Boolean(riskData.isDataUnavailable);
  const badgeStyling = getOverallBadgeColor(riskData.overallCategory);

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
              {riskData.cityName}
            </h3>
            {/* DEMO / AWAITING DATA Badge */}
            {isUnavailable ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-amber-200 text-[10px] font-bold tracking-wide uppercase">
                Awaiting Data
              </span>
            ) : riskData.isSampleData ? (
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
            {riskData.coordinates ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0284C7]" />
                {riskData.coordinates.lat.toFixed(2)}°N, {riskData.coordinates.lng.toFixed(2)}°E
              </span>
            ) : (
              <span>Climate Hazard Grid</span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#64748B]" />
              {formatTimestamp(riskData.timestamp)}
            </span>
          </div>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-center text-[#D97706] shadow-2xs shrink-0">
          <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* Unavailable State Notice */}
      {isUnavailable && (
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[12px] text-[#78350F] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
            <Radio className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
            <span>Awaiting Risk Assessment</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Multi-hazard environmental model calculation for this coordinate is pending. No fabricated risk scores are displayed.
          </p>
          {riskData.apiContractNote && (
            <div className="mt-1 pt-1.5 border-t border-amber-200/60 font-mono text-[10px] text-[#92400E] break-all">
              Contract: {riskData.apiContractNote}
            </div>
          )}
        </div>
      )}

      {/* 1. Overall Environmental Risk Score Card with Circular Progress Meter */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-white/95 to-slate-50/90 border border-slate-200/90 shadow-sm flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B] block">
            Overall Environmental Risk
          </span>
          <div className="mt-1 flex items-center gap-2">
            <h4 className="text-[18px] sm:text-[20px] font-black tracking-tight text-[#0F172A] leading-tight truncate">
              {riskData.cityName}
            </h4>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {!isUnavailable ? (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyling}`}
              >
                {riskData.overallCategory} Risk
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-100 text-[#64748B] border-slate-200">
                Awaiting Data
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 leading-relaxed">
            {isUnavailable
              ? "Comprehensive multi-hazard rating pending calibration."
              : "Composite score evaluating extreme temperature, water, and air conditions."}
          </p>
        </div>

        {/* Circular Progress Indicator */}
        <RiskCircularMeter
          score={riskData.overallScore}
          category={riskData.overallCategory}
          isUnavailable={isUnavailable}
          size={84}
        />
      </div>

      {/* 2. Four Individual Risk Category Cards in a 2x2 Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
            Individual Hazard Categories
          </span>
          <span className="text-[10px] text-[#94A3B8]">
            Scale: 0–100
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Heatwave Risk */}
          <RiskCategoryCard
            item={riskData.categories.heatwave}
            isUnavailable={isUnavailable}
          />

          {/* 2. Flood Risk */}
          <RiskCategoryCard
            item={riskData.categories.flood}
            isUnavailable={isUnavailable}
          />

          {/* 3. Drought Risk */}
          <RiskCategoryCard
            item={riskData.categories.drought}
            isUnavailable={isUnavailable}
          />

          {/* 4. Air Pollution Risk */}
          <RiskCategoryCard
            item={riskData.categories.airPollution}
            isUnavailable={isUnavailable}
          />
        </div>
      </div>

      {/* Footer Provenance Note */}
      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-[#64748B]">
        <span>
          {riskData.isSampleData ? "Demo fixtures for evaluation" : "Verified hazard assessment"}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            title="Refresh risk assessment"
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
