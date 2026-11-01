"use client";

import React from "react";
import { EnvironmentalAlert, AlertSeverity, AlertCategory } from "@/types";
import {
  Flame,
  CloudRain,
  Waves,
  Wind,
  Sun,
  Zap,
  Check,
  Building2,
  Calendar,
  ShieldAlert,
  Clock,
  Radio,
} from "lucide-react";

interface AlertCardProps {
  alert: EnvironmentalAlert;
  onMarkAsRead?: (id: string) => void;
  compact?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onMarkAsRead,
  compact = false,
}) => {
  // Category Icon & Label mapping
  const getCategoryDetails = (cat: AlertCategory) => {
    switch (cat) {
      case "heatwave":
        return {
          label: "Heatwave Alert",
          icon: <Flame className="w-4 h-4 text-[#DC2626]" />,
          bg: "bg-red-50 text-red-700 border-red-200",
        };
      case "heavy_rainfall":
        return {
          label: "Heavy Rainfall Alert",
          icon: <CloudRain className="w-4 h-4 text-[#0284C7]" />,
          bg: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "flood_risk":
        return {
          label: "Flood Risk Alert",
          icon: <Waves className="w-4 h-4 text-[#0369A1]" />,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "poor_air_quality":
        return {
          label: "Poor Air Quality Alert",
          icon: <Wind className="w-4 h-4 text-[#8B5CF6]" />,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "drought":
        return {
          label: "Drought Alert",
          icon: <Sun className="w-4 h-4 text-[#D97706]" />,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "extreme_weather":
      default:
        return {
          label: "Extreme Weather Alert",
          icon: <Zap className="w-4 h-4 text-[#EA580C]" />,
          bg: "bg-orange-50 text-orange-700 border-orange-200",
        };
    }
  };

  // Severity Color Scheme per Section 7:
  // Red for Critical, Orange for High, Amber for Moderate, Green for Low
  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case "Critical":
        return {
          badge: "bg-red-50 text-red-600 border-red-200 font-extrabold",
          accentBorder: "border-l-4 border-l-red-500",
          dot: "bg-red-500",
        };
      case "High":
        return {
          badge: "bg-orange-50 text-orange-600 border-orange-200 font-bold",
          accentBorder: "border-l-4 border-l-orange-500",
          dot: "bg-orange-500",
        };
      case "Moderate":
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
          accentBorder: "border-l-4 border-l-amber-500",
          dot: "bg-amber-500",
        };
      case "Low":
      default:
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
          accentBorder: "border-l-4 border-l-emerald-500",
          dot: "bg-emerald-500",
        };
    }
  };

  const catDetails = getCategoryDetails(alert.category);
  const sevStyle = getSeverityStyle(alert.severity);

  const formattedDate = new Date(alert.dateTime).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedUpdated = new Date(alert.lastUpdated).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 relative overflow-hidden ${
        sevStyle.accentBorder
      } ${
        alert.isRead
          ? "bg-white/80 border-slate-200/70 shadow-2xs opacity-90"
          : "bg-white/95 border-slate-200/90 shadow-xs ring-1 ring-slate-100"
      } ${compact ? "p-3 space-y-2" : "p-3.5 sm:p-4 space-y-2.5"}`}
    >
      {/* Top Row: Unread Status, Category, Severity & Mark as Read */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {!alert.isRead && (
            <span
              title="Unread advisory"
              className="w-2 h-2 rounded-full bg-[#059669] shrink-0 animate-pulse"
            />
          )}

          {/* Category Pill */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catDetails.bg}`}
          >
            {catDetails.icon}
            <span>{catDetails.label}</span>
          </span>

          {/* Severity Badge */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border ${sevStyle.badge}`}
          >
            {alert.severity}
          </span>
        </div>

        {/* Action: Mark as Read */}
        {!alert.isRead && onMarkAsRead && (
          <button
            type="button"
            onClick={() => onMarkAsRead(alert.id)}
            className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] hover:text-[#059669] hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-all cursor-pointer shrink-0"
            title="Mark as read"
          >
            <Check className="w-3 h-3 text-[#059669]" />
            <span>Mark Read</span>
          </button>
        )}
      </div>

      {/* Alert Title */}
      <h3
        className={`font-bold text-[#0F172A] leading-snug ${
          compact ? "text-[12px]" : "text-[13px]"
        }`}
      >
        {alert.title}
      </h3>

      {/* Description */}
      <p
        className={`text-[#475569] leading-relaxed ${
          compact ? "text-[11px] line-clamp-2" : "text-[11.5px]"
        }`}
      >
        {alert.description}
      </p>

      {/* Location & Metadata Row */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-[#64748B] flex-wrap">
        {/* City & State */}
        <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
          <Building2 className="w-3 h-3 text-[#059669]" />
          <span>{alert.cityName}, {alert.state}</span>
        </span>

        {/* Issuance Date & Time */}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-[#94A3B8]" />
          <span>{formattedDate}</span>
        </span>
      </div>

      {/* Authority Source & Last Updated */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-[#64748B] flex-wrap pt-0.5">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-[#059669]" />
          <span>Source: <strong className="font-medium text-[#334155]">{alert.source}</strong></span>
        </span>
        <span className="flex items-center gap-1 text-[#94A3B8]">
          <Clock className="w-3 h-3" />
          <span>Updated {formattedUpdated}</span>
        </span>
      </div>

      {/* DEMO Integrity Banner per Section 6 */}
      {alert.isDemo && (
        <div className="mt-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[9.5px] text-[#64748B] flex items-center justify-between">
          <span className="font-semibold text-amber-700 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            DEMO SIMULATION
          </span>
          <span className="text-[9px] text-[#94A3B8] italic">
            For UI Testing Only
          </span>
        </div>
      )}
    </div>
  );
};
