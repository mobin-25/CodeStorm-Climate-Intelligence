import React from "react";
import { ForecastDay } from "@/types";
import {
  SunMedium,
  Sun,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
} from "lucide-react";

interface ForecastDayCardProps {
  day: ForecastDay;
  isUnavailable?: boolean;
}

export const ForecastDayCard: React.FC<ForecastDayCardProps> = ({
  day,
  isUnavailable = false,
}) => {
  const {
    dayLabel,
    fullDateLabel,
    maxTempCelsius,
    minTempCelsius,
    condition,
    rainfallProbability,
    expectedRainfallMm,
  } = day;

  // Map condition icon string to Lucide icon
  const renderConditionIcon = (iconName: string) => {
    switch (iconName) {
      case "Sun":
        return <Sun className="w-4 h-4 text-[#D97706]" />;
      case "SunMedium":
        return <SunMedium className="w-4 h-4 text-[#D97706]" />;
      case "CloudSun":
        return <CloudSun className="w-4 h-4 text-[#0284C7]" />;
      case "CloudRain":
        return <CloudRain className="w-4 h-4 text-[#0891B2]" />;
      case "CloudDrizzle":
        return <CloudDrizzle className="w-4 h-4 text-[#0284C7]" />;
      case "CloudFog":
        return <CloudFog className="w-4 h-4 text-[#64748B]" />;
      case "Wind":
        return <Wind className="w-4 h-4 text-[#059669]" />;
      default:
        return <SunMedium className="w-4 h-4 text-[#D97706]" />;
    }
  };

  return (
    <div className="bg-white/85 hover:bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300/60 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 group">
      {/* 1. Date & Day Name */}
      <div className="w-20 shrink-0">
        <span className="text-[13px] font-bold text-[#0F172A] block leading-tight">
          {dayLabel}
        </span>
        <span className="text-[11px] font-medium text-[#64748B] block mt-0.5">
          {fullDateLabel}
        </span>
      </div>

      {/* 2. Condition Icon & Label */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {renderConditionIcon(condition.icon)}
        </div>
        <span className="text-[11px] font-semibold text-[#0F172A] truncate" title={condition.label}>
          {isUnavailable ? "--" : condition.label}
        </span>
      </div>

      {/* 3. Rainfall Probability & Expected Volume */}
      <div className="w-20 shrink-0 text-right">
        <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-[#0284C7]">
          <Droplets className="w-3 h-3 text-[#0284C7] shrink-0" />
          <span>{isUnavailable ? "--" : `${rainfallProbability}%`}</span>
        </div>
        <span className="text-[10px] text-[#64748B] font-medium block mt-0.5">
          {isUnavailable ? "--" : `${expectedRainfallMm.toFixed(1)} mm`}
        </span>
      </div>

      {/* 4. Temperature Hi / Lo */}
      <div className="w-20 shrink-0 text-right">
        <div className="flex items-baseline justify-end gap-1.5">
          <span className="text-[14px] font-black text-[#EA580C]">
            {isUnavailable ? "--" : `${maxTempCelsius.toFixed(0)}°`}
          </span>
          <span className="text-[12px] font-semibold text-[#64748B]">
            {isUnavailable ? "--" : `${minTempCelsius.toFixed(0)}°`}
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold text-[#94A3B8] block mt-0.5">
          Hi / Lo
        </span>
      </div>
    </div>
  );
};
