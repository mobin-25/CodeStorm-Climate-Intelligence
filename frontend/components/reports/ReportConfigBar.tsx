"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import {
  Search,
  X,
  MapPin,
  Building2,
  Calendar,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Loader2,
  Layers,
  SunMedium,
  Wind,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { GlassPanel } from "@/components/shared";
import { GeocodedLocation, ReportType, ReportDateRange } from "@/types";

interface ReportConfigBarProps {
  selectedLocation: GeocodedLocation;
  onSelectLocation: (loc: GeocodedLocation) => void;
  reportType: ReportType;
  onSelectReportType: (type: ReportType) => void;
  dateRange: ReportDateRange;
  onSelectDateRange: (range: ReportDateRange) => void;
  onDownloadPDF: () => void;
  onExportCSV: () => void;
  loading?: boolean;
  availablePresets: GeocodedLocation[];
  className?: string;
}

export const ReportConfigBar: React.FC<ReportConfigBarProps> = ({
  selectedLocation,
  onSelectLocation,
  reportType,
  onSelectReportType,
  dateRange,
  onSelectDateRange,
  onDownloadPDF,
  onExportCSV,
  loading = false,
  availablePresets,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  // Dynamic geocoding search for Indian cities
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);
    setSearchError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Geocoding error`);
        const data = await res.json();
        startTransition(() => {
          setResults(data.locations || []);
          setIsSearching(false);
        });
      } catch (err) {
        startTransition(() => {
          setSearchError(err instanceof Error ? err.message : "Failed to search location");
          setIsSearching(false);
        });
      }
    }, 320);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (loc: GeocodedLocation) => {
    onSelectLocation(loc);
    setQuery("");
    setIsOpen(false);
    setResults([]);
  };

  const reportTypes: Array<{ id: ReportType; label: string; icon: React.ReactNode }> = [
    { id: "complete", label: "Complete Dossier", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "weather", label: "Weather Observation", icon: <SunMedium className="w-3.5 h-3.5" /> },
    { id: "air_quality", label: "Air Quality (NAAQS)", icon: <Wind className="w-3.5 h-3.5" /> },
    { id: "climate_risk", label: "Climate Hazard Risk", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  ];

  const dateRanges: Array<{ id: ReportDateRange; label: string }> = [
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "6m", label: "6 Months" },
    { id: "1y", label: "1 Year" },
  ];

  return (
    <GlassPanel
      variant="panel"
      className={`p-4 sm:p-5 flex flex-col gap-4 shadow-lg border border-white/90 bg-white/90 no-print ${className}`}
    >
      {/* 1. City Search and Quick Presets Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
        {/* Dynamic Location Search Input */}
        <div className="relative flex-1 max-w-md" ref={containerRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search Indian city for environmental report (e.g., Delhi, Mumbai, Pune)..."
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-50/80 hover:bg-white text-[13px] text-[#0F172A] placeholder-slate-400 border border-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in duration-150">
              {isSearching ? (
                <div className="p-3 text-center text-[12px] text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Searching locations...</span>
                </div>
              ) : searchError ? (
                <div className="p-3 text-[12px] text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{searchError}</span>
                </div>
              ) : results.length > 0 ? (
                <ul className="space-y-0.5">
                  {results.map((loc) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCity(loc)}
                        className="w-full text-left px-3 py-2 rounded-xl text-[12px] flex items-center justify-between hover:bg-emerald-50 text-[#0F172A] hover:text-[#059669] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            {loc.isPredefinedCity ? (
                              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-sky-600" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold block leading-tight">{loc.name}</span>
                            <span className="text-[11px] text-slate-500">
                              {loc.state ? `${loc.state}, India` : "India"}
                            </span>
                          </div>
                        </div>
                        {loc.isPredefinedCity ? (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            DEMO
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                            DYNAMIC
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center text-[12px] text-slate-500">
                  No matching Indian cities found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Presets for Instant Switching */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Quick Select:
          </span>
          {availablePresets.slice(0, 5).map((preset) => {
            const isSelected = selectedLocation.id.toLowerCase() === preset.id.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectLocation(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1 ${
                  isSelected
                    ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white"
                    : "bg-white/90 hover:bg-emerald-50 text-[#0F172A] hover:text-[#059669] border border-slate-200"
                }`}
              >
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Report Type Selector, Date Range & Action Buttons Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 flex-wrap">
        {/* Report Scope Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
            Report Domain Scope
          </label>
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex-wrap">
            {reportTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectReportType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                  reportType === t.id
                    ? "bg-white text-[#059669] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-sky-600" />
            <span>Temporal Window</span>
          </label>
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            {dateRanges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectDateRange(r.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                  dateRange === r.id
                    ? "bg-white text-[#0284C7] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export / Download Buttons */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0 self-end lg:self-center">
          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            disabled={loading}
            title="Export environmental report as a structured CSV dataset"
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] hover:text-[#0284C7] border border-slate-200/90 shadow-sm text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Download / Print PDF */}
          <button
            type="button"
            onClick={onDownloadPDF}
            disabled={loading}
            title="Download report as an official PDF dossier (A4 formatted)"
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#059669] to-[#0891B2] hover:opacity-95 text-white shadow-md shadow-emerald-600/20 text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </GlassPanel>
  );
};

