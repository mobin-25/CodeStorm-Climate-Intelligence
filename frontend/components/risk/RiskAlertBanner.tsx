"use client";

import React from "react";
import { GlassPanel } from "@/components/shared";
import { ClimateRiskAlert } from "@/types";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface RiskAlertBannerProps {
  alerts: ClimateRiskAlert[];
}

export const RiskAlertBanner: React.FC<RiskAlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <GlassPanel
        variant="control"
        className="px-4 py-3 flex items-center gap-2.5 text-[13px] text-[#059669] pointer-events-auto shadow-sm"
      >
        <ShieldCheck className="w-4 h-4 text-[#059669]" />
        <span className="font-semibold">No critical environmental hazards active</span>
      </GlassPanel>
    );
  }

  const latestAlert = alerts[0];
  const isCritical = latestAlert.severity === "Critical" || latestAlert.severity === "High";

  return (
    <div
      className={`p-4 sm:p-4.5 w-full max-w-[340px] sm:max-w-[384px] rounded-[20px] backdrop-blur-[18px] pointer-events-auto transition-all shadow-md ${
        isCritical
          ? "bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-amber-100/70 border border-amber-300/80 shadow-amber-500/10"
          : "bg-white/88 border border-white/80 shadow-slate-200/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Amber / Hazard Icon Badge */}
        <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-300/90 flex items-center justify-center text-[#D97706] shrink-0 shadow-2xs">
          <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold text-[#0F172A] leading-tight">
              {latestAlert.title}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-[#B45309] font-bold border border-amber-300/80 uppercase tracking-wide shrink-0">
              {latestAlert.severity}
            </span>
          </div>
          <p className="text-[13px] text-[#475569] mt-1.5 leading-snug font-normal">
            {latestAlert.description}
          </p>
        </div>
      </div>
    </div>
  );
};
