import React from "react";
import { RiskCategoryItem, ClimateRiskCategory } from "@/types";
import { Flame, CloudRain, SunDim, Wind } from "lucide-react";

interface RiskCategoryCardProps {
  item: RiskCategoryItem;
  isUnavailable?: boolean;
}

function getRiskCategoryBadge(category?: ClimateRiskCategory) {
  switch (category) {
    case "Low":
      return {
        badgeBg: "bg-emerald-50 text-[#059669] border-emerald-300/90",
        barColor: "bg-[#059669]",
        textColor: "text-[#059669]",
      };
    case "Moderate":
      return {
        badgeBg: "bg-yellow-50 text-[#CA8A04] border-yellow-300/90",
        barColor: "bg-[#EAB308]",
        textColor: "text-[#CA8A04]",
      };
    case "High":
      return {
        badgeBg: "bg-orange-50 text-[#EA580C] border-orange-300/90",
        barColor: "bg-[#EA580C]",
        textColor: "text-[#EA580C]",
      };
    case "Very High":
      return {
        badgeBg: "bg-red-50 text-[#DC2626] border-red-300/90",
        barColor: "bg-[#DC2626]",
        textColor: "text-[#DC2626]",
      };
    default:
      return {
        badgeBg: "bg-slate-50 text-[#64748B] border-slate-300/90",
        barColor: "bg-slate-400",
        textColor: "text-[#64748B]",
      };
  }
}

export const RiskCategoryCard: React.FC<RiskCategoryCardProps> = ({
  item,
  isUnavailable = false,
}) => {
  const { id, title, score, category, explanation } = item;
  const styling = getRiskCategoryBadge(category);

  // Icon mapping with safe fallback
  const renderIcon = () => {
    switch (id) {
      case "heatwave":
        return <Flame className="w-4 h-4 text-[#EA580C]" />;
      case "flood":
        return <CloudRain className="w-4 h-4 text-[#0284C7]" />;
      case "drought":
        return <SunDim className="w-4 h-4 text-[#D97706]" />;
      case "air_pollution":
        return <Wind className="w-4 h-4 text-[#7C3AED]" />;
      default:
        return <Flame className="w-4 h-4 text-[#EA580C]" />;
    }
  };

  return (
    <div className="bg-white/85 hover:bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-300/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full min-h-[190px]">
      {/* Top Details Container */}
      <div>
        {/* Row 1: Hazard Icon & Full Title together */}
        <div className="flex items-center gap-2 min-h-[32px]">
          <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            {renderIcon()}
          </div>
          <h5
            className="text-[12px] sm:text-[12.5px] font-bold text-[#0F172A] leading-snug line-clamp-2"
            title={title}
          >
            {title}
          </h5>
        </div>

        {/* Row 2: Severity Badge on a separate row */}
        <div className="mt-2 flex items-center">
          {!isUnavailable ? (
            <span
              className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap tracking-tight shadow-2xs ${styling.badgeBg}`}
            >
              {category}
            </span>
          ) : (
            <span className="text-[9px] sm:text-[9.5px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 text-[#94A3B8] bg-slate-50">
              No Data
            </span>
          )}
        </div>

        {/* Row 3: Prominent Score Display */}
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="text-[20px] sm:text-[22px] font-black tracking-tight text-[#0F172A] leading-none">
            {isUnavailable ? "--" : score}
          </span>
          <span className="text-[10px] font-bold text-[#64748B]">
            {isUnavailable ? "" : "/ 100"}
          </span>
        </div>

        {/* Row 4: Visual Progress Bar */}
        <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUnavailable ? "bg-slate-200" : styling.barColor
            }`}
            style={{ width: isUnavailable ? "0%" : `${Math.min(Math.max(score, 4), 100)}%` }}
          />
        </div>
      </div>

      {/* Row 5: Natural Wrapping Description (No awkward truncation) */}
      <div className="mt-2.5 pt-2 border-t border-slate-100/90 flex-1 flex items-start">
        <p
          className="text-[11px] text-[#475569] font-normal leading-relaxed"
          title={explanation}
        >
          {isUnavailable ? "Risk assessment pending sensor coverage." : explanation}
        </p>
      </div>
    </div>
  );
};
