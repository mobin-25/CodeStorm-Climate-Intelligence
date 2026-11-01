import React from "react";
import { AQICategory } from "@/types";

interface AQIBadgeProps {
  aqi: number;
  category: AQICategory;
}

export const AQIBadge: React.FC<AQIBadgeProps> = ({ aqi, category }) => {
  const getColors = () => {
    switch (category) {
      case "Good":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "Satisfactory":
        return "bg-teal-50 text-teal-800 border-teal-300";
      case "Moderate":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "Poor":
        return "bg-orange-50 text-orange-800 border-orange-300";
      case "Very Poor":
        return "bg-red-50 text-red-800 border-red-300";
      case "Severe":
        return "bg-purple-50 text-purple-900 border-purple-300";
      default:
        return "bg-slate-50 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold border ${getColors()}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      <span>AQI {aqi}</span>
      <span className="opacity-80 font-normal">({category})</span>
    </div>
  );
};
