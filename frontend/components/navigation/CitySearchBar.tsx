"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { Search, X, MapPin, Building2, Check, Loader2, AlertCircle } from "lucide-react";
import { GeocodedLocation } from "@/types";

interface CitySearchBarProps {
  selectedLocation?: GeocodedLocation | null;
  selectedCityName?: string;
  onLocationSelect: (location: GeocodedLocation) => void;
  onClearSelection?: () => void;
  className?: string;
}

export const CitySearchBar: React.FC<CitySearchBarProps> = ({
  selectedLocation,
  selectedCityName = "New Delhi",
  onLocationSelect,
  onClearSelection,
  className = "",
}) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  // Debounced dynamic search to /api/geocode
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
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Geocoding error`);
        }
        const data = await res.json();
        startTransition(() => {
          setResults(data.locations || []);
          setIsLoading(false);
          setHasSearched(true);
          setActiveIndex(-1);
        });
      } catch (err) {
        startTransition(() => {
          setSearchError(
            err instanceof Error ? err.message : "Failed to search location"
          );
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (location: GeocodedLocation) => {
    onLocationSelect(location);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    setHasSearched(false);
    if (onClearSelection) {
      onClearSelection();
    }
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-72 sm:w-80 md:w-96 pointer-events-auto ${className}`}
    >
      {/* Search Input Container with Frosted Glass */}
      <div className="relative flex items-center bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:border-emerald-300/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200">
        <label htmlFor="city-search-input" className="sr-only">
          Search Indian cities
        </label>
        <div className="pl-3.5 pr-2 flex items-center justify-center text-[#059669]">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          id="city-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Indian cities (e.g. Thane, Kalyan, Mumbai)..."
          className="w-full py-2.5 pr-8 bg-transparent text-[13px] font-medium text-[#0F172A] placeholder:text-[#64748B] focus:outline-none"
          autoComplete="off"
        />

        {/* Clear Button */}
        {(query || selectedLocation) && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear search and reset view"
            className="absolute right-2.5 p-1 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Suggestions */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.12)] p-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-2.5 py-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
            <span>SEARCH LOCATIONS</span>
            <span className="text-[10px] font-normal lowercase text-[#94A3B8]">
              ↑↓ keys to navigate
            </span>
          </div>

          {/* Loading State */}
          {isLoading && results.length === 0 && (
            <div className="p-4 text-center flex items-center justify-center gap-2 text-[13px] text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
              <span>Searching across India...</span>
            </div>
          )}

          {/* Error State */}
          {searchError && (
            <div className="p-3 text-center text-[#DC2626] flex items-center justify-center gap-2 text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-[13px] font-semibold text-[#0F172A]">
                No matching location found
              </p>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Try searching by city, town, or district name (e.g. Kalyan, Thane, Navi Mumbai).
              </p>
            </div>
          )}

          {/* Location Results List */}
          {results.length > 0 && (
            <ul className="flex flex-col gap-1">
              {results.map((location, index) => {
                const isSelected =
                  selectedLocation?.id === location.id ||
                  selectedLocation?.name.toLowerCase() ===
                    location.name.toLowerCase();

                const isActive = activeIndex === index;

                return (
                  <li key={location.id || index}>
                    <button
                      type="button"
                      onClick={() => handleSelect(location)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/90 text-[#0F172A] border border-emerald-300/80 font-semibold"
                          : isActive
                          ? "bg-slate-100/80 text-[#0F172A]"
                          : "text-[#0F172A] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-emerald-100 text-[#059669]"
                              : "bg-slate-100 text-[#64748B]"
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-semibold leading-tight text-[#0F172A]">
                              {location.name}
                            </span>
                            <span className="text-[11px] font-medium text-[#059669] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                              {location.state}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                            {location.coordinates.lat.toFixed(3)}°N, {location.coordinates.lng.toFixed(3)}°E • {location.type || "India"}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#059669] text-white shrink-0 ml-2">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
