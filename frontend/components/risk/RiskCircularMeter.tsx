import React from "react";
import { ClimateRiskCategory } from "@/types";

interface RiskCircularMeterProps {
  score: number;
  category: ClimateRiskCategory;
  isUnavailable?: boolean;
  size?: number;
}

export const RiskCircularMeter: React.FC<RiskCircularMeterProps> = ({
  score,
  category,
  isUnavailable = false,
  size = 96,
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = isUnavailable
    ? circumference
    : circumference - (clampedScore / 100) * circumference;

  let strokeColor = "#059669"; // Low (Green)
  if (category === "Moderate") strokeColor = "#EAB308"; // Moderate (Yellow)
  else if (category === "High") strokeColor = "#EA580C"; // High (Orange)
  else if (category === "Very High") strokeColor = "#DC2626"; // Very High (Red)

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={isUnavailable ? "4 4" : undefined}
        />
        {/* Progress Value Stroke */}
        {!isUnavailable && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      {/* Center Score & Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[22px] sm:text-[24px] font-black tracking-tight text-[#0F172A] leading-none">
          {isUnavailable ? "--" : clampedScore}
        </span>
        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
          {isUnavailable ? "Score" : "/ 100"}
        </span>
      </div>
    </div>
  );
};
