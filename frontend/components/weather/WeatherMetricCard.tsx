import React from "react";
import { LucideIcon } from "lucide-react";

interface WeatherMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  isUnavailable?: boolean;
}

export const WeatherMetricCard: React.FC<WeatherMetricCardProps> = ({
  label,
  value,
  unit,
  subValue,
  icon: Icon,
  iconColor,
  iconBg,
  isUnavailable = false,
}) => {
  return (
    <div className="bg-white/85 hover:bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
          {label}
        </span>
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${iconBg}`}
        >
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[18px] sm:text-[20px] font-black tracking-tight text-[#0F172A] leading-tight">
          {isUnavailable ? "--" : value}
        </span>
        {unit && !isUnavailable && (
          <span className="text-[11px] font-semibold text-[#64748B]">
            {unit}
          </span>
        )}
      </div>

      {subValue && (
        <span className="text-[10px] text-[#64748B] font-medium mt-1 truncate">
          {isUnavailable ? "Awaiting sensor" : subValue}
        </span>
      )}
    </div>
  );
};
