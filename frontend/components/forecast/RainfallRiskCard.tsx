import React from "react";
import { RainfallRiskOverview, RainfallRiskCategory } from "@/types";
import { CloudRain, AlertTriangle, ShieldCheck } from "lucide-react";

interface RainfallRiskCardProps {
  rainfallRisk: RainfallRiskOverview;
  isUnavailable?: boolean;
}

function getRainfallRiskBadge(level: RainfallRiskCategory) {
  switch (level) {
    case "Low":
      return {
        badgeBg: "bg-emerald-50 text-[#059669] border-emerald-300",
        barColor: "bg-[#059669]",
        label: "Low Risk",
      };
    case "Moderate":
      return {
        badgeBg: "bg-yellow-50 text-[#CA8A04] border-yellow-300",
        barColor: "bg-[#EAB308]",
        label: "Moderate Risk",
      };
    case "High":
      return {
        badgeBg: "bg-orange-50 text-[#EA580C] border-orange-300",
        barColor: "bg-[#EA580C]",
        label: "High Risk",
      };
    case "Very High":
      return {
        badgeBg: "bg-red-50 text-[#DC2626] border-red-300",
        barColor: "bg-[#DC2626]",
        label: "Very High Risk",
      };
  }
}

export const RainfallRiskCard: React.FC<RainfallRiskCardProps> = ({
  rainfallRisk,
  isUnavailable = false,
}) => {
  const { level, score, explanation, totalWeeklyRainfallMm, peakDay } = rainfallRisk;
  const styling = getRainfallRiskBadge(level);

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/95 to-slate-50/90 border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#64748B] block leading-none">
              7-Day Precipitation Outlook
            </span>
            <span className="text-[13px] font-bold text-[#0F172A] leading-tight mt-0.5 block">
              Rainfall Risk Indicator
            </span>
          </div>
        </div>

        {!isUnavailable ? (
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${styling.badgeBg}`}
          >
            {styling.label}
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-[#64748B] border-slate-200 shrink-0">
            Awaiting Data
          </span>
        )}
      </div>

      {/* Metric comparison strip */}
      {!isUnavailable && (
        <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200/60 text-[11px]">
          <div>
            <span className="text-[#64748B] block text-[10px] font-medium">Expected Total</span>
            <span className="font-black text-[#0F172A] text-[13px]">
              {totalWeeklyRainfallMm.toFixed(1)} <span className="text-[10px] font-normal text-[#64748B]">mm</span>
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px] font-medium">Peak Activity</span>
            <span className="font-bold text-[#0F172A] text-[13px]">
              {peakDay}
            </span>
          </div>
        </div>
      )}

      {/* Short explanation */}
      <div className="flex items-start gap-1.5 text-[11px] text-[#475569] leading-snug">
        {level === "High" || level === "Very High" ? (
          <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
        )}
        <span>
          {isUnavailable ? "Precipitation modeling pending sensor feed." : explanation}
        </span>
      </div>
    </div>
  );
};
