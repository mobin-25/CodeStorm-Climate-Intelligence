"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import {
  Search,
  X,
  Plus,
  MapPin,
  Building2,
  AlertTriangle,
  Loader2,
  Check,
  Sparkles,
  EyeOff,
  Eye,
} from "lucide-react";
import { GeocodedLocation } from "@/types";

interface CityComparisonSelectorProps {
  selectedCities: GeocodedLocation[];
  onAddCity: (city: GeocodedLocation) => boolean;
  onRemoveCity: (cityId: string) => boolean;
  availablePresets: GeocodedLocation[];
  canAddCity: boolean;
  canRemoveCity: boolean;
  simulatedUnavailableCityIds: string[];
  onToggleSimulateUnavailable: (cityId: string) => void;
  className?: string;
}

export const CityComparisonSelector: React.FC<CityComparisonSelectorProps> = ({
  selectedCities,
  onAddCity,
  onRemoveCity,
  availablePresets,
  canAddCity,
  canRemoveCity,
  simulatedUnavailableCityIds,
  onToggleSimulateUnavailable,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
      setIsLoading(false);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);
    setSearchError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Geocoding error`);
        const data = await res.json();
        startTransition(() => {
          setResults(data.locations || []);
          setIsLoading(false);
          setHasSearched(true);
        });
      } catch (err) {
        startTransition(() => {
          setSearchError(err instanceof Error ? err.message : "Failed to search location");
          setIsLoading(false);
          setHasSearched(true);
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

  const handleSelect = (city: GeocodedLocation) => {
    const added = onAddCity(city);
    if (added) {
      setQuery("");
      setIsOpen(false);
      setResults([]);
    }
  };

  // Distinct city color pills for matching with charts
  const cityColors = [
    { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", lightBg: "bg-emerald-50" },
    { bg: "bg-sky-500", text: "text-sky-700", border: "border-sky-300", lightBg: "bg-sky-50" },
    { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-300", lightBg: "bg-amber-50" },
    { bg: "bg-purple-500", text: "text-purple-700", border: "border-purple-300", lightBg: "bg-purple-50" },
  ];

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 1. Header & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#0F172A] tracking-tight">
            Selected Cities to Compare
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] border border-slate-200">
            {selectedCities.length} / 4 Selected (Min 2, Max 4)
          </span>
        </div>

        {/* Quick Presets for fast testing */}
        {availablePresets.length > 0 && canAddCity && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Quick Add:
            </span>
            {availablePresets.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelect(preset)}
                className="px-2 py-0.5 rounded-lg bg-white/90 hover:bg-emerald-50 text-[11px] font-semibold text-[#0F172A] hover:text-[#059669] border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-2.5 h-2.5 text-emerald-600" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Selected City Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {selectedCities.map((city, idx) => {
          const color = cityColors[idx % cityColors.length];
          const isSimulatedUnavailable = simulatedUnavailableCityIds.includes(city.id);

          return (
            <div
              key={city.id}
              className={`p-3 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between gap-2 shadow-2xs ${
                isSimulatedUnavailable
                  ? "bg-amber-50/80 border-amber-200"
                  : `${color.lightBg}/80 ${color.border}`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 shadow-2xs ${color.bg}`}
                    title={`Slot ${idx + 1}`}
                  />
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0F172A] leading-tight">
                      {city.name}
                    </h4>
                    <p className="text-[11px] text-[#475569] font-medium leading-tight mt-0.5">
                      {city.state || "India"}
                    </p>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveCity(city.id)}
                  disabled={!canRemoveCity}
                  title={
                    !canRemoveCity
                      ? "Minimum 2 cities required for comparative analysis"
                      : `Remove ${city.name} from comparison`
                  }
                  className={`p-1 rounded-lg transition-all ${
                    canRemoveCity
                      ? "text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      : "text-slate-300 cursor-not-allowed opacity-50"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Tags & Simulate Unavailable Toggle */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 text-[10px]">
                <div className="flex items-center gap-1">
                  {city.isPredefinedCity ? (
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100/80 text-emerald-800 font-bold border border-emerald-200">
                      DEMO FIXTURE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-md bg-sky-100/80 text-sky-800 font-bold border border-sky-200">
                      DYNAMIC
                    </span>
                  )}
                  {isSimulatedUnavailable && (
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-300">
                      UNAVAILABLE TEST
                    </span>
                  )}
                </div>

                {/* Test toggle button */}
                <button
                  type="button"
                  onClick={() => onToggleSimulateUnavailable(city.id)}
                  title={
                    isSimulatedUnavailable
                      ? "Restore normal baseline for testing"
                      : "Simulate missing telemetry data for testing data integrity"
                  }
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isSimulatedUnavailable ? (
                    <>
                      <Eye className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Restore</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-2.5 h-2.5 text-amber-600" />
                      <span>Test Missing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Search Bar for Adding More Indian Cities (if < 4) */}
      <div className="relative" ref={containerRef}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {isLoading ? (
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
              disabled={!canAddCity}
              placeholder={
                canAddCity
                  ? "Search & add another Indian city (e.g., Delhi, Pune, Mumbai, Bengaluru, Hyderabad)..."
                  : "Maximum of 4 cities reached. Remove a city above to add another."
              }
              className={`w-full h-11 pl-10 pr-10 rounded-2xl bg-white/95 text-[13px] text-[#0F172A] placeholder-slate-400 border border-slate-200/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                !canAddCity ? "bg-slate-50 opacity-70 cursor-not-allowed" : ""
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && query.trim().length >= 2 && canAddCity && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in duration-150">
            {isLoading ? (
              <div className="p-3 text-center text-[12px] text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Searching Indian locations...</span>
              </div>
            ) : searchError ? (
              <div className="p-3 text-[12px] text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{searchError}</span>
              </div>
            ) : results.length > 0 ? (
              <ul className="space-y-1">
                {results.map((loc) => {
                  const isAlreadySelected = selectedCities.some(
                    (c) => c.id.toLowerCase() === loc.id.toLowerCase()
                  );

                  return (
                    <li key={loc.id}>
                      <button
                        type="button"
                        disabled={isAlreadySelected}
                        onClick={() => handleSelect(loc)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[12px] flex items-center justify-between transition-all ${
                          isAlreadySelected
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "hover:bg-emerald-50 text-[#0F172A] hover:text-[#059669] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
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

                        {isAlreadySelected ? (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Added
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold px-2 py-0.5 rounded-md bg-emerald-100/60">
                            + Add
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : hasSearched ? (
              <div className="p-3 text-center text-[12px] text-slate-500">
                No matching Indian cities found for &quot;{query}&quot;
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
