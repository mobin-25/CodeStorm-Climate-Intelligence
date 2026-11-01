"use client";

import React from "react";
import {
  Sparkles,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Info,
  Thermometer,
  Wind,
  Droplets,
  ShieldAlert,
  Zap,
  Layers,
} from "lucide-react";
import { GlassPanel } from "@/components/shared";
import { useClimateInsights } from "@/hooks";
import { InsightCard } from "./InsightCard";
import { ProfileFilterSelector } from "./ProfileFilterSelector";
import { SmartRecommendationsPanel } from "./SmartRecommendationsPanel";
import { InsightsQueryOptions, InsightCategory } from "@/types";

interface ClimateInsightsDashboardProps {
  query?: InsightsQueryOptions;
  className?: string;
  isCompact?: boolean;
}

export const ClimateInsightsDashboard: React.FC<ClimateInsightsDashboardProps> = ({
  query = { cityId: "delhi", cityName: "New Delhi" },
  className = "",
  isCompact = false,
}) => {
  const {
    data,
    loading,
    error,
    activeProfile,
    setActiveProfile,
    activeCategory,
    setActiveCategory,
    filteredInsights,
    filteredRecommendations,
    refetch,
    isDataUnavailable,
    apiContractNote,
  } = useClimateInsights(query);

  const categories: Array<{ id: InsightCategory | "all"; label: string; icon: React.ReactNode }> = [
    { id: "all", label: "All Insights", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "temperature", label: "Temperature", icon: <Thermometer className="w-3.5 h-3.5" /> },
    { id: "air_quality", label: "Air Quality", icon: <Wind className="w-3.5 h-3.5" /> },
    { id: "rainfall", label: "Rainfall", icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: "climate_risk", label: "Climate Risk", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: "unusual_change", label: "Unusual Shifts", icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <GlassPanel
      variant="panel"
      className={`p-4 sm:p-5 flex flex-col gap-4 shadow-lg border border-white/90 bg-white/95 ${className}`}
    >
      {/* 1. Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[15px] sm:text-[16px] text-[#0F172A] tracking-tight">
                Climate Insights &amp; Smart Actions
              </h3>
              {data?.isSampleData ? (
                <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DEMO FIXTURE
                </span>
              ) : (
                <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  VERIFIED TELEMETRY
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[#475569] font-medium mt-0.5">
              Automated atmospheric diagnostics for <strong className="text-[#0F172A]">{data?.cityName || query.cityName || "Selected City"}</strong>
            </p>
          </div>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          title="Refresh insights and smart recommendations"
          className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
        </button>
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
          <span className="text-[13px] font-semibold text-[#0F172A]">
            Evaluating environmental patterns and deriving smart safeguards...
          </span>
        </div>
      )}

      {/* 3. Error State */}
      {!loading && error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Unavailable Data State (Strict Data Integrity) */}
      {!loading && !error && isDataUnavailable && (
        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h4 className="font-bold text-[14px] text-amber-950">
            Environmental Insights Unavailable
          </h4>
          <p className="text-[12px] text-amber-800 max-w-md mx-auto leading-relaxed">
            Telemetry sensor streaming is not yet active for {query.cityName || "this location"}. Under ClimateScope data integrity rules, insights and recommendations are never fabricated.
          </p>
          {apiContractNote && (
            <div className="pt-2">
              <span className="font-mono text-[10.5px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200 break-all">
                Backend API Contract: {apiContractNote}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 5. Main Content: Insights & Smart Recommendations */}
      {!loading && !error && !isDataUnavailable && (
        <div className="space-y-6">
          {/* A. Insight Category Filters */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#059669]" />
                <span>Atmospheric Diagnostics</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Showing {filteredInsights.length} of {data?.insights.length || 0} Insights
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-[#475569] hover:text-[#0F172A]"
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Insights Cards Grid */}
          <div
            className={`grid gap-3 ${
              isCompact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>

          {/* C. Health & Activity Profiles Selector */}
          <ProfileFilterSelector
            activeProfile={activeProfile}
            onSelectProfile={setActiveProfile}
          />

          {/* D. Smart Recommendations Panel */}
          <SmartRecommendationsPanel
            recommendations={filteredRecommendations}
            activeProfile={activeProfile}
          />
        </div>
      )}
    </GlassPanel>
  );
};

