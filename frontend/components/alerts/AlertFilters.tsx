"use client";

import React from "react";
import {
  SeverityFilter,
  CategoryFilter,
  CityScopeFilter,
  ReadStatusFilter,
  AlertSeverity,
  AlertCategory,
} from "@/types";
import { Filter, Building2, Globe2 } from "lucide-react";

interface AlertFiltersProps {
  severity: SeverityFilter;
  onSeverityChange: (sev: SeverityFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  cityScope: CityScopeFilter;
  onCityScopeChange: (scope: CityScopeFilter) => void;
  readStatus: ReadStatusFilter;
  onReadStatusChange: (status: ReadStatusFilter) => void;
  selectedCityName: string;
}

const SEVERITY_OPTIONS: { id: SeverityFilter; label: string; color?: string }[] = [
  { id: "All", label: "All Severities" },
  { id: "Critical", label: "Critical", color: "text-[#EF4444]" },
  { id: "High", label: "High", color: "text-[#EA580C]" },
  { id: "Moderate", label: "Moderate", color: "text-[#D97706]" },
  { id: "Low", label: "Low", color: "text-[#059669]" },
];

const CATEGORY_OPTIONS: { id: CategoryFilter; label: string }[] = [
  { id: "All", label: "All Categories" },
  { id: "heatwave", label: "Heatwave" },
  { id: "heavy_rainfall", label: "Heavy Rainfall" },
  { id: "flood_risk", label: "Flood Risk" },
  { id: "poor_air_quality", label: "Air Quality" },
  { id: "drought", label: "Drought" },
  { id: "extreme_weather", label: "Extreme Weather" },
];

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  severity,
  onSeverityChange,
  category,
  onCategoryChange,
  cityScope,
  onCityScopeChange,
  readStatus,
  onReadStatusChange,
  selectedCityName,
}) => {
  return (
    <div className="space-y-2.5 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
      {/* 1. City Scope & Read Status Row */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        {/* City Scope Pill */}
        <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => onCityScopeChange("current")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              cityScope === "current"
                ? "bg-[#059669] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{selectedCityName}</span>
          </button>
          <button
            type="button"
            onClick={() => onCityScopeChange("all")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              cityScope === "all"
                ? "bg-[#059669] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Globe2 className="w-3 h-3" />
            <span>All Corridors</span>
          </button>
        </div>

        {/* Read / Unread Status Filter */}
        <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
          {(["all", "unread", "read"] as ReadStatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onReadStatusChange(st)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                readStatus === st
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Severity Filter Tabs */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-0.5">
          <Filter className="w-2.5 h-2.5" />
          <span>Severity</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSeverityChange(opt.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                severity === opt.id
                  ? "bg-white text-[#0F172A] shadow-2xs ring-1 ring-slate-200"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60"
              }`}
            >
              <span className={opt.color}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-0.5">
          <span>Hazard Category</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onCategoryChange(opt.id)}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer shrink-0 ${
                category === opt.id
                  ? "bg-[#0891B2] text-white shadow-2xs"
                  : "bg-white text-[#475569] hover:text-[#0F172A] border border-slate-200/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
