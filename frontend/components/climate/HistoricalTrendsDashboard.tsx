"use client";

import React, { useState } from "react";
import { GlassPanel } from "@/components/shared";
import {
  CityHistoricalTrendsData,
  TimeRangeOption,
  HistoricalTrendsCategory,
} from "@/types";
import { HistoricalTempChart } from "./HistoricalTempChart";
import { HistoricalRainChart } from "./HistoricalRainChart";
import { HistoricalAqiChart } from "./HistoricalAqiChart";
import {
  Thermometer,
  CloudRain,
  Wind,
  Calendar,
  Database,
  Info,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface HistoricalTrendsDashboardProps {
  data: CityHistoricalTrendsData | null;
  loading?: boolean;
  error?: string | null;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (range: TimeRangeOption) => void;
  onRetry?: () => void;
}

const TIME_RANGE_OPTIONS: { id: TimeRangeOption; label: string }[] = [
  { id: "30d", label: "30 Days" },
  { id: "6m", label: "6 Months" },
  { id: "1y", label: "1 Year" },
  { id: "2y", label: "2 Years" },
];

export const HistoricalTrendsDashboard: React.FC<HistoricalTrendsDashboardProps> = ({
  data,
  loading = false,
  error = null,
  timeRange,
  onTimeRangeChange,
  onRetry,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<HistoricalTrendsCategory>("temperature");

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-8 w-full bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </GlassPanel>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#EF4444] font-semibold text-[13px]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Historical Trends Unavailable</span>
        </div>
        <p className="text-[12px] text-[#64748B]">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-[12px] font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Climatology Feed</span>
          </button>
        )}
      </GlassPanel>
    );
  }

  // 3. Unavailable Data State for Unmonitored Dynamic Locations
  if (!data || data.isDataUnavailable || data.points.length === 0) {
    return (
      <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#0F172A]">
                Historical Climate Trends
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Data Notice
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {data?.cityName || "Selected Location"}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-[12px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Historical data unavailable</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Verified long-term observational records (IMD & CPCB) are not yet linked to
            these coordinates. In compliance with strict data integrity standards, historical
            climatological values are not fabricated.
          </p>
        </div>

        {data?.apiContractNote && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Required Backend Contract:
            </span>
            <code className="text-[11px] text-[#059669] font-mono break-all font-semibold">
              {data.apiContractNote}
            </code>
          </div>
        )}

        {/* Time Range Selector still available for user discovery */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-[#475569] block">
            Select Observation Horizon:
          </span>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onTimeRangeChange(opt.id)}
                className={`py-1 text-[11px] font-semibold rounded-lg transition-all text-center cursor-pointer ${
                  timeRange === opt.id
                    ? "bg-white text-[#059669] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>
    );
  }

  // 4. Populated Historical Trends Dashboard
  const { summary } = data;
  const isTempWarming = summary.tempChangePercent >= 0;
  const isAqiImproving = summary.aqiChangePercent <= 0;

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-3.5 max-w-full">
      {/* Header: Title, City, DEMO tag & Last Updated */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-extrabold text-[#0F172A] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#059669]" />
              Historical Climate Trends
            </span>
            {data.isSampleData && (
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {data.sampleNote || "DEMO"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5 flex-wrap">
            <span className="font-semibold text-[#0F172A]">{data.cityName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-[#059669]" />
              {data.dataSource}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-[#94A3B8] block">Observation Range</span>
          <span className="text-[11px] font-bold text-[#059669] uppercase">
            {timeRange === "30d"
              ? "Past 30 Days"
              : timeRange === "6m"
              ? "Past 6 Months"
              : timeRange === "1y"
              ? "Past 1 Year"
              : "Past 2 Years"}
          </span>
        </div>
      </div>

      {/* Time Range Filter Pill (Section 2) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100/90 rounded-xl">
        {TIME_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onTimeRangeChange(opt.id)}
            className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
              timeRange === opt.id
                ? "bg-white text-[#059669] shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category Tabs: Temperature, Rainfall, Air Quality (Section 1) */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-100/70 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveCategory("temperature")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeCategory === "temperature"
              ? "bg-white text-[#EA580C] shadow-2xs"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>Temperature</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("rainfall")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeCategory === "rainfall"
              ? "bg-white text-[#0284C7] shadow-2xs"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Rainfall</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("air_quality")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeCategory === "air_quality"
              ? "bg-white text-[#8B5CF6] shadow-2xs"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Air Quality</span>
        </button>
      </div>

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metric 1: Temperature */}
        <div
          onClick={() => setActiveCategory("temperature")}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            activeCategory === "temperature"
              ? "bg-orange-50/60 border-orange-200"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
          }`}
        >
          <span className="text-[10px] font-semibold text-[#64748B] block truncate">
            Avg Temp
          </span>
          <div className="text-[15px] font-extrabold text-[#0F172A] mt-0.5">
            {summary.avgTemp}°C
          </div>
          <div className="flex items-center gap-0.5 text-[10px] font-bold mt-0.5 text-[#EA580C]">
            {isTempWarming ? (
              <ArrowUpRight className="w-3 h-3 text-[#EA580C]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-[#0284C7]" />
            )}
            <span>{isTempWarming ? `+${summary.tempChangePercent}%` : `${summary.tempChangePercent}%`}</span>
          </div>
        </div>

        {/* Metric 2: Rainfall */}
        <div
          onClick={() => setActiveCategory("rainfall")}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            activeCategory === "rainfall"
              ? "bg-sky-50/60 border-sky-200"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
          }`}
        >
          <span className="text-[10px] font-semibold text-[#64748B] block truncate">
            Total Rain
          </span>
          <div className="text-[15px] font-extrabold text-[#0284C7] mt-0.5">
            {summary.totalRainfallMm} mm
          </div>
          <span className="text-[10px] text-[#64748B] font-medium block truncate">
            Anomaly: {summary.rainfallAnomalyPercent}%
          </span>
        </div>

        {/* Metric 3: Air Quality */}
        <div
          onClick={() => setActiveCategory("air_quality")}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            activeCategory === "air_quality"
              ? "bg-purple-50/60 border-purple-200"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
          }`}
        >
          <span className="text-[10px] font-semibold text-[#64748B] block truncate">
            Mean AQI
          </span>
          <div className="text-[15px] font-extrabold text-[#8B5CF6] mt-0.5">
            {summary.avgAqi}
          </div>
          <div className="flex items-center gap-0.5 text-[10px] font-bold mt-0.5">
            {isAqiImproving ? (
              <ArrowDownRight className="w-3 h-3 text-[#10B981]" />
            ) : (
              <ArrowUpRight className="w-3 h-3 text-[#EF4444]" />
            )}
            <span className={isAqiImproving ? "text-[#10B981]" : "text-[#EF4444]"}>
              {summary.aqiChangePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Active Chart Visualization (Section 3) */}
      <div className="transition-all">
        {activeCategory === "temperature" && (
          <HistoricalTempChart points={data.points} />
        )}
        {activeCategory === "rainfall" && (
          <HistoricalRainChart
            points={data.points}
            totalRainfallMm={summary.totalRainfallMm}
          />
        )}
        {activeCategory === "air_quality" && (
          <HistoricalAqiChart points={data.points} />
        )}
      </div>

      {/* Climatological Analysis Summary Narrative */}
      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-[11px] text-[#475569] leading-relaxed flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#0F172A] mr-1">Observational Climatology:</span>
          {summary.trendDescription}
        </div>
      </div>

      {/* Footer Meta: Source & Last Updated */}
      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Last Synchronized: {new Date(data.timestamp).toLocaleDateString()}
        </span>
        <span>Recharts v3 • Responsive</span>
      </div>
    </GlassPanel>
  );
};
