"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  Layers,
  BarChart3,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import { GlassPanel } from "@/components/shared";
import { useCityComparison } from "@/hooks";
import { CityComparisonSelector } from "./CityComparisonSelector";
import { WeatherComparisonCard } from "./WeatherComparisonCard";
import { AirQualityComparisonCard } from "./AirQualityComparisonCard";
import { RiskComparisonCard } from "./RiskComparisonCard";
import { ComparisonBarChart } from "./ComparisonBarChart";
import { ComparisonTable } from "./ComparisonTable";
import { GeocodedLocation } from "@/types";

interface CityComparisonDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCities?: GeocodedLocation[];
  embedded?: boolean;
}

type ViewMode = "all" | "charts" | "cards" | "table";

export const CityComparisonDashboard: React.FC<CityComparisonDashboardProps> = ({
  isOpen = true,
  onClose,
  initialCities,
  embedded = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const {
    selectedCities,
    comparisonData,
    loading,
    error,
    highlights,
    addCity,
    removeCity,
    setCities,
    refetch,
    canAddCity,
    canRemoveCity,
    availablePresets,
    simulatedUnavailableCityIds,
    toggleSimulateUnavailable,
  } = useCityComparison(initialCities);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && onClose && !embedded) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, embedded]);

  if (!isOpen && !embedded) return null;

  // Quick reset to the 4 prompt target test cities: Mumbai, Pune, Delhi, Bengaluru
  const handleLoadPromptTestCorridors = () => {
    const testCorridors: GeocodedLocation[] = [
      {
        id: "mumbai",
        name: "Mumbai",
        state: "Maharashtra",
        displayName: "Mumbai, Maharashtra",
        coordinates: { lat: 19.076, lng: 72.8777 },
        type: "Tier 1 City",
        isPredefinedCity: true,
      },
      {
        id: "pune",
        name: "Pune",
        state: "Maharashtra",
        displayName: "Pune, Maharashtra",
        coordinates: { lat: 18.5204, lng: 73.8567 },
        type: "Tier 2 City",
        isPredefinedCity: true,
      },
      {
        id: "delhi",
        name: "New Delhi",
        state: "Delhi NCT",
        displayName: "New Delhi, Delhi NCT",
        coordinates: { lat: 28.6139, lng: 77.209 },
        type: "Tier 1 City",
        isPredefinedCity: true,
      },
      {
        id: "bengaluru",
        name: "Bengaluru",
        state: "Karnataka",
        displayName: "Bengaluru, Karnataka",
        coordinates: { lat: 12.9716, lng: 77.5946 },
        type: "Tier 1 City",
        isPredefinedCity: true,
      },
    ];
    setCities(testCorridors);
  };

  const dashboardContent = (
    <GlassPanel
      variant="panel"
      className={`flex flex-col overflow-hidden border border-white/90 p-0 rounded-[26px] bg-white/95 ${
        embedded ? "shadow-md" : "shadow-2xl"
      }`}
    >
      {/* 1. Dashboard Top Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#059669] to-[#0891B2] flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] sm:text-[20px] font-black text-[#0F172A] tracking-tight">
                City Environmental Comparison
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200">
                2–4 Cities
              </span>
            </div>
            <p className="text-[12px] text-[#475569] font-medium mt-0.5">
              Multi-city cross-analysis of Weather, Air Quality, and Climate Hazard exposure
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Load Test Corridors Button */}
          <button
            type="button"
            onClick={handleLoadPromptTestCorridors}
            title="Load Mumbai, Pune, Delhi & Bengaluru test corridors"
            className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Load Mumbai, Pune, Delhi &amp; Bengaluru</span>
            <span className="sm:hidden">4 Test Cities</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            title="Refresh comparative indicators"
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          {/* Close Button (if in modal mode) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close City Comparison (Esc)"
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-[#475569] flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Data Integrity Banner */}
      <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-50/70 via-sky-50/70 to-teal-50/70 border-b border-emerald-100/80 flex items-center justify-between text-[11px] text-[#334155] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong>Data Integrity Protocol:</strong> Predefined Indian corridors utilize labeled DEMO baselines. Dynamically searched unmonitored locations report honest <em>&quot;Data unavailable&quot;</em> states and are never compared as zero.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified Engine
          </span>
        </div>
      </div>

      {/* 3. Main Dashboard Body */}
      <div
        className={`p-4 sm:p-6 space-y-6 ${
          embedded
            ? "overflow-visible"
            : "max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar"
        }`}
      >
        {/* City Selection Controls */}
        <CityComparisonSelector
          selectedCities={selectedCities}
          onAddCity={addCity}
          onRemoveCity={removeCity}
          availablePresets={availablePresets}
          canAddCity={canAddCity}
          canRemoveCity={canRemoveCity}
          simulatedUnavailableCityIds={simulatedUnavailableCityIds}
          onToggleSimulateUnavailable={toggleSimulateUnavailable}
        />

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                viewMode === "all"
                  ? "bg-white text-[#059669] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All-in-One Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("charts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                viewMode === "charts"
                  ? "bg-white text-[#0284C7] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Visual Charts</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-[#059669] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Domain Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#8B5CF6] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Comparison Table</span>
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] font-medium">
            Comparing <strong className="text-[#0F172A]">{selectedCities.length} Indian Cities</strong>
          </div>
        </div>

        {/* Error Message if any */}
        {error && (
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

        {/* Loading Indicator */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            <span className="text-[13px] font-semibold text-[#0F172A]">
              Fetching comparative environmental telemetry across selected corridors...
            </span>
          </div>
        )}

        {/* Dashboard Sections according to viewMode */}
        {!loading && comparisonData.length > 0 && (
          <div className="space-y-6">
            {/* 1. Bar Chart Visualizations (Visible in 'all' and 'charts') */}
            {(viewMode === "all" || viewMode === "charts") && (
              <ComparisonBarChart cities={comparisonData} />
            )}

            {/* 2. Three Environmental Cards (Visible in 'all' and 'cards') */}
            {(viewMode === "all" || viewMode === "cards") && (
              <div className="space-y-4">
                {/* Weather Comparison Card */}
                <WeatherComparisonCard
                  cities={comparisonData}
                  highlights={highlights}
                />

                {/* Air Quality Comparison Card */}
                <AirQualityComparisonCard
                  cities={comparisonData}
                  highlights={highlights}
                />

                {/* Climate Risks Comparison Card */}
                <RiskComparisonCard
                  cities={comparisonData}
                  highlights={highlights}
                />
              </div>
            )}

            {/* 3. Detailed Metric Table (Visible in 'all' and 'table') */}
            {(viewMode === "all" || viewMode === "table") && (
              <ComparisonTable
                cities={comparisonData}
                highlights={highlights}
              />
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );

  if (embedded) {
    return <div className="w-full max-w-7xl mx-auto flex flex-col">{dashboardContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md p-3 sm:p-5 lg:p-7 flex items-start justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl flex flex-col pointer-events-auto my-auto">
        {dashboardContent}
      </div>
    </div>
  );
};
