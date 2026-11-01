"use client";

import React from "react";
import {
  Thermometer,
  Wind,
  Droplets,
  ShieldAlert,
  Zap,
  Info,
  Clock,
  Radio,
} from "lucide-react";
import { EnvironmentalInsight } from "@/types";

interface InsightCardProps {
  insight: EnvironmentalInsight;
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  className = "",
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "temperature":
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      case "air_quality":
        return <Wind className="w-4 h-4 text-emerald-600" />;
      case "rainfall":
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case "climate_risk":
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case "unusual_change":
        return <Zap className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          badge: "bg-red-100 text-red-800 border-red-300",
          border: "border-red-200/90",
          accent: "text-red-600",
          label: "Critical Condition",
        };
      case "high":
        return {
          badge: "bg-orange-100 text-orange-800 border-orange-300",
          border: "border-orange-200/80",
          accent: "text-orange-600",
          label: "High Significance",
        };
      case "moderate":
        return {
          badge: "bg-amber-100 text-amber-800 border-amber-300",
          border: "border-amber-200/80",
          accent: "text-amber-600",
          label: "Moderate Shift",
        };
      case "info":
      default:
        return {
          badge: "bg-slate-100 text-slate-700 border-slate-200",
          border: "border-slate-200/90",
          accent: "text-slate-600",
          label: "Baseline Observation",
        };
    }
  };

  const severityStyle = getSeverityStyle(insight.severity);

  return (
    <div
      className={`p-4 rounded-2xl bg-white/95 border backdrop-blur-md shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 ${severityStyle.border} ${className}`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            {getCategoryIcon(insight.category)}
          </div>
          <span
            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${severityStyle.badge}`}
          >
            {severityStyle.label}
          </span>
        </div>

        {insight.isUnusualChange && (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            Unusual Change
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <h4 className="text-[13.5px] font-bold text-[#0F172A] leading-tight">
          {insight.title}
        </h4>
        <p className="text-[11.5px] text-[#475569] leading-relaxed">
          {insight.explanation}
        </p>
      </div>

      {/* Related Metric Box */}
      <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-[#64748B]">
          {insight.relatedMetric.label}
        </span>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#0F172A] text-[13px]">
            {insight.relatedMetric.value}
            {insight.relatedMetric.unit ? ` ${insight.relatedMetric.unit}` : ""}
          </span>
          {insight.relatedMetric.status && (
            <span className="text-[10px] text-slate-500 font-medium">
              ({insight.relatedMetric.status})
            </span>
          )}
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#64748B] flex-wrap gap-1">
        <div className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-[#059669]" />
          <span>Source: {insight.dataSource}</span>
        </div>
        {insight.timestamp && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{new Date(insight.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

