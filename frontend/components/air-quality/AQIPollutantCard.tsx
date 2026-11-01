import React from "react";
import { AirPollutant } from "@/types";

interface AQIPollutantCardProps {
  pollutant: AirPollutant;
  isUnavailable?: boolean;
}

export const AQIPollutantCard: React.FC<AQIPollutantCardProps> = ({
  pollutant,
  isUnavailable = false,
}) => {
  const { name, chemicalFormula, value, unit, standardLimit } = pollutant;

  // Calculate ratio vs Indian national ambient standard limit (CPCB)
  const ratio = standardLimit > 0 ? (value / standardLimit) * 100 : 0;
  const clampedRatio = Math.min(Math.max(ratio, 5), 100);

  // Status visual colors & labels (Normal, Moderate, High, Very High, Severe)
  let statusBadgeColor = "bg-emerald-50 text-[#059669] border-emerald-200/80";
  let barColor = "bg-[#059669]";
  let statusLabel = "Normal";

  if (ratio > 250 || pollutant.status === "hazardous") {
    statusBadgeColor = "bg-purple-50 text-[#7E22CE] border-purple-200/80";
    barColor = "bg-[#7E22CE]";
    statusLabel = "Severe";
  } else if (ratio > 175) {
    statusBadgeColor = "bg-red-50 text-[#DC2626] border-red-200/80";
    barColor = "bg-[#DC2626]";
    statusLabel = "Very High";
  } else if (ratio > 100 || pollutant.status === "poor") {
    statusBadgeColor = "bg-amber-50 text-[#D97706] border-amber-200/80";
    barColor = "bg-[#D97706]";
    statusLabel = "High";
  } else if (ratio > 50 || pollutant.status === "moderate") {
    statusBadgeColor = "bg-sky-50 text-[#0284C7] border-sky-200/80";
    barColor = "bg-[#0284C7]";
    statusLabel = "Moderate";
  }

  return (
    <div className="bg-white/85 hover:bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-300/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group min-h-[155px]">
      {/* Top Section: Formula Code Badge & Severity Badge, followed by Full Name */}
      <div>
        {/* Row 1: Code Badge on Left, Severity Badge on Right */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/90 text-[11px] font-black text-[#0F172A] tracking-tight shrink-0 shadow-2xs">
            {chemicalFormula}
          </span>

          {!isUnavailable ? (
            <span
              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 tracking-tight ${statusBadgeColor}`}
            >
              {statusLabel}
            </span>
          ) : (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-slate-200 text-[#94A3B8] bg-slate-50">
              No Data
            </span>
          )}
        </div>

        {/* Row 2: Full Pollutant Name (Allows wrapping onto second line, fixed min-h for card symmetry) */}
        <div className="mt-1.5 min-h-[28px] flex items-center">
          <span
            className="text-[11px] font-semibold text-[#475569] leading-snug line-clamp-2"
            title={name}
          >
            {name}
          </span>
        </div>
      </div>

      {/* Bottom Section: Numerical Reading & Progress Bar */}
      <div className="mt-2.5">
        {/* Value & Unit */}
        <div className="flex items-baseline gap-1">
          <span className="text-[18px] sm:text-[20px] font-black tracking-tight text-[#0F172A] leading-tight">
            {isUnavailable ? "--" : value.toFixed(1)}
          </span>
          <span className="text-[10px] font-semibold text-[#64748B]">
            {unit}
          </span>
        </div>

        {/* Standard Limit & Progress Bar */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[#64748B]">
            <span>Standard limit</span>
            <span className="font-semibold text-[#0F172A]">
              {standardLimit} {unit}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isUnavailable ? "bg-slate-200" : barColor}`}
              style={{ width: isUnavailable ? "0%" : `${clampedRatio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
