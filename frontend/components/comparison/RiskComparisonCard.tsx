"use client";

import React from "react";
import {
  ShieldAlert,
  Flame,
  Waves,
  Sun,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { CityComparisonItem, MetricHighlightsMap } from "@/types";
import { GlassPanel } from "@/components/shared";

interface RiskComparisonCardProps {
  cities: CityComparisonItem[];
  highlights: MetricHighlightsMap;
}

export const RiskComparisonCard: React.FC<RiskComparisonCardProps> = ({
  cities,
  highlights,
}) => {
  const overallHighlight = highlights.overallRisk;
  const heatwaveHighlight = highlights.heatwaveRisk;
  const floodHighlight = highlights.floodRisk;
  const droughtHighlight = highlights.droughtRisk;

  const getRiskColor = (score: number) => {
    if (score < 40) return { label: "Low Risk", text: "text-emerald-700", bg: "bg-emerald-100", bar: "bg-emerald-500" };
    if (score < 60) return { label: "Moderate Risk", text: "text-amber-700", bg: "bg-amber-100", bar: "bg-amber-500" };
    if (score < 80) return { label: "High Risk", text: "text-orange-700", bg: "bg-orange-100", bar: "bg-orange-500" };
    return { label: "Critical Risk", text: "text-red-700", bg: "bg-red-100", bar: "bg-red-500" };
  };

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#0F172A] tracking-tight">
              Climate Risks &amp; Hazard Vulnerability
            </h3>
            <p className="text-[11px] text-[#475569] font-medium">
              Overall vulnerability index, Heatwave exposure, Flood runoff &amp; Drought risk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10.5px] font-semibold text-[#64748B]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            0–39: Low Vulnerability
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            80–100: Critical Vulnerability
          </span>
        </div>
      </div>

      {/* Cities Comparative Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cities.map((city) => {
          const r = city.riskOverview;
          const isUnavailable = !r || city.isDataUnavailable || r.isDataUnavailable;

          const overallScore = r?.overallScore;
          const heatScore = r?.categories?.heatwave?.score;
          const floodScore = r?.categories?.flood?.score;
          const droughtScore = r?.categories?.drought?.score;

          const isLowestOverall =
            !isUnavailable &&
            overallHighlight?.hasComparableData &&
            overallHighlight.bestCityId === city.cityId;
          const isHighestOverall =
            !isUnavailable &&
            overallHighlight?.hasComparableData &&
            overallHighlight.worstCityId === city.cityId;

          const isLowestHeat =
            !isUnavailable &&
            heatwaveHighlight?.hasComparableData &&
            heatwaveHighlight.bestCityId === city.cityId;
          const isHighestHeat =
            !isUnavailable &&
            heatwaveHighlight?.hasComparableData &&
            heatwaveHighlight.worstCityId === city.cityId;

          const isLowestFlood =
            !isUnavailable &&
            floodHighlight?.hasComparableData &&
            floodHighlight.bestCityId === city.cityId;
          const isHighestFlood =
            !isUnavailable &&
            floodHighlight?.hasComparableData &&
            floodHighlight.worstCityId === city.cityId;

          const isLowestDrought =
            !isUnavailable &&
            droughtHighlight?.hasComparableData &&
            droughtHighlight.bestCityId === city.cityId;
          const isHighestDrought =
            !isUnavailable &&
            droughtHighlight?.hasComparableData &&
            droughtHighlight.worstCityId === city.cityId;

          const riskTier =
            !isUnavailable && typeof overallScore === "number"
              ? getRiskColor(overallScore)
              : null;

          return (
            <div
              key={city.cityId}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isUnavailable
                  ? "bg-slate-50/80 border-slate-200/80"
                  : "bg-white/95 border-slate-200/90 shadow-2xs hover:shadow-md"
              }`}
            >
              {/* City Title */}
              <div className="flex items-start justify-between gap-1 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-[13.5px] font-bold text-[#0F172A] leading-tight">
                    {city.cityName}
                  </h4>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">
                    {city.state || "India"}
                  </span>
                </div>
                {city.isSampleData && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    DEMO
                  </span>
                )}
              </div>

              {/* Data Content */}
              {isUnavailable ? (
                <div className="py-6 px-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-center flex flex-col items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-[12px] font-bold text-amber-900">
                    Data unavailable
                  </span>
                  <span className="text-[10px] text-amber-700 leading-tight">
                    Hydrological &amp; thermal risk model awaiting calibration.
                  </span>
                  {city.apiContractNote && (
                    <span className="mt-1 text-[9px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200 break-all">
                      {city.apiContractNote}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Overall Risk Score */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                        Composite Risk Index
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[18px] font-black text-[#0F172A]">
                          {overallScore}
                          <span className="text-[11px] font-semibold text-slate-400">/100</span>
                        </span>
                        {riskTier && (
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${riskTier.bg} ${riskTier.text}`}
                          >
                            {riskTier.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isLowestOverall && (
                        <span
                          className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs"
                          title="Safest aggregate risk score among compared cities"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Lowest Risk
                        </span>
                      )}
                      {isHighestOverall && (
                        <span
                          className="px-2 py-1 rounded-lg text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs"
                          title="Highest aggregate hazard exposure among compared cities"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Highest Risk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hazard Sub-indices */}
                  <div className="space-y-2 text-[11px]">
                    {/* Heatwave */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[#475569]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Flame className="w-3 h-3 text-amber-500" />
                          Heatwave Risk
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[#0F172A]">{heatScore ?? "--"}</span>
                          {isLowestHeat && (
                            <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                              Lowest
                            </span>
                          )}
                          {isHighestHeat && (
                            <span className="text-[8.5px] font-bold px-1 rounded bg-red-100 text-red-800">
                              Highest
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, heatScore || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Flood */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[#475569]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Waves className="w-3 h-3 text-sky-500" />
                          Flood Risk
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[#0F172A]">{floodScore ?? "--"}</span>
                          {isLowestFlood && (
                            <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                              Lowest
                            </span>
                          )}
                          {isHighestFlood && (
                            <span className="text-[8.5px] font-bold px-1 rounded bg-red-100 text-red-800">
                              Highest
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, floodScore || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Drought */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[#475569]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Sun className="w-3 h-3 text-orange-500" />
                          Drought Risk
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[#0F172A]">{droughtScore ?? "--"}</span>
                          {isLowestDrought && (
                            <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                              Lowest
                            </span>
                          )}
                          {isHighestDrought && (
                            <span className="text-[8.5px] font-bold px-1 rounded bg-red-100 text-red-800">
                              Highest
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, droughtScore || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};
