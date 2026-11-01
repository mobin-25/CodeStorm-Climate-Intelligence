"use client";

import React from "react";
import {
  CityComparisonItem,
  MetricHighlightsMap,
  ComparisonMetricKey,
} from "@/types";
import { GlassPanel } from "@/components/shared";
import {
  Table,
  Award,
  Flame,
  Thermometer,
  Wind,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { getMetricValue } from "@/services";

interface ComparisonTableProps {
  cities: CityComparisonItem[];
  highlights: MetricHighlightsMap;
}

interface MetricRowDef {
  key: ComparisonMetricKey;
  label: string;
  unit: string;
  category: "weather" | "air" | "risk";
  info?: string;
}

const TABLE_METRICS: MetricRowDef[] = [
  // Weather
  { key: "temperature", label: "Temperature", unit: "°C", category: "weather", info: "Ambient dry-bulb temperature" },
  { key: "humidity", label: "Relative Humidity", unit: "%", category: "weather", info: "Moisture saturation" },
  { key: "windSpeed", label: "Wind Velocity", unit: "km/h", category: "weather", info: "Surface wind speed" },

  // Air Quality
  { key: "aqi", label: "Index AQI", unit: "Index", category: "air", info: "National Air Quality Index" },
  { key: "pm25", label: "PM2.5 (Fine)", unit: "µg/m³", category: "air", info: "NAAQS 24h standard: 60 µg/m³" },
  { key: "pm10", label: "PM10 (Coarse)", unit: "µg/m³", category: "air", info: "NAAQS 24h standard: 100 µg/m³" },
  { key: "no2", label: "Nitrogen Dioxide (NO₂)", unit: "µg/m³", category: "air", info: "NAAQS standard: 80 µg/m³" },

  // Climate Risk
  { key: "overallRisk", label: "Composite Risk Index", unit: "/100", category: "risk", info: "Weighted multihazard score" },
  { key: "heatwaveRisk", label: "Heatwave Risk Score", unit: "/100", category: "risk", info: "Thermal extremes & UHI exposure" },
  { key: "floodRisk", label: "Flood Inundation Risk", unit: "/100", category: "risk", info: "Urban runoff & drainage surge" },
  { key: "droughtRisk", label: "Drought & Water Stress", unit: "/100", category: "risk", info: "Groundwater & reservoir vulnerability" },
];

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  cities,
  highlights,
}) => {
  const getCategoryIcon = (cat: "weather" | "air" | "risk") => {
    switch (cat) {
      case "weather":
        return <Thermometer className="w-3.5 h-3.5 text-sky-500" />;
      case "air":
        return <Wind className="w-3.5 h-3.5 text-emerald-500" />;
      case "risk":
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getCategoryTitle = (cat: "weather" | "air" | "risk") => {
    switch (cat) {
      case "weather":
        return "Atmospheric Weather Parameters";
      case "air":
        return "Air Pollution & Particulate Matter (NAAQS)";
      case "risk":
        return "Multihazard Climate Vulnerability Indices";
    }
  };

  const categories: Array<"weather" | "air" | "risk"> = ["weather", "air", "risk"];

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 flex flex-col gap-4">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#0F172A] tracking-tight">
              Detailed Metric Matrix Table
            </h3>
            <p className="text-[11px] text-[#475569] font-medium">
              Granular side-by-side indicator comparison across all selected corridors
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Award className="w-3 h-3 text-emerald-600" />
            Best in Dataset
          </span>
          <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            Worst in Dataset
          </span>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs custom-scrollbar">
        <table className="w-full text-left border-collapse text-[12px]">
          {/* Table Header Row */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200">
              <th className="py-3 px-4 font-bold text-[#0F172A] min-w-[200px]">
                Environmental Indicator
              </th>
              {cities.map((city) => (
                <th
                  key={city.cityId}
                  className="py-3 px-4 font-bold text-[#0F172A] min-w-[150px] border-l border-slate-200/80"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-black">{city.cityName}</span>
                    {city.isSampleData ? (
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        DEMO
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        DYNAMIC
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                    {city.state || "India"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body by Category */}
          <tbody className="divide-y divide-slate-100 bg-white/70">
            {categories.map((cat) => {
              const rows = TABLE_METRICS.filter((m) => m.category === cat);

              return (
                <React.Fragment key={cat}>
                  {/* Category Section Header Row */}
                  <tr className="bg-slate-100/70 border-y border-slate-200/80">
                    <td
                      colSpan={cities.length + 1}
                      className="py-2 px-4 font-bold text-[11px] uppercase tracking-wider text-[#334155]"
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat)}
                        <span>{getCategoryTitle(cat)}</span>
                      </div>
                    </td>
                  </tr>

                  {/* Individual Metric Rows */}
                  {rows.map((rowDef) => {
                    const highlight = highlights[rowDef.key];

                    return (
                      <tr
                        key={rowDef.key}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Metric Label & Unit */}
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-[#0F172A] leading-tight">
                            {rowDef.label}
                          </div>
                          <div className="text-[10px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              Unit: {rowDef.unit}
                            </span>
                            {rowDef.info && <span>• {rowDef.info}</span>}
                          </div>
                        </td>

                        {/* City Value Cells */}
                        {cities.map((city) => {
                          const val = getMetricValue(city, rowDef.key);
                          const isUnavailable = val === null || isNaN(val);

                          const isBest =
                            !isUnavailable &&
                            highlight?.hasComparableData &&
                            highlight.bestCityId === city.cityId;

                          const isWorst =
                            !isUnavailable &&
                            highlight?.hasComparableData &&
                            highlight.worstCityId === city.cityId;

                          return (
                            <td
                              key={city.cityId}
                              className={`py-2.5 px-4 border-l border-slate-100 font-semibold ${
                                isBest
                                  ? "bg-emerald-50/40"
                                  : isWorst
                                  ? "bg-rose-50/40"
                                  : ""
                              }`}
                            >
                              {isUnavailable ? (
                                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/90 px-2 py-1 rounded-lg border border-amber-200/80 text-[10.5px] w-fit">
                                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Data unavailable</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-black text-[#0F172A] text-[13px]">
                                    {typeof val === "number"
                                      ? val.toFixed(1)
                                      : val}{" "}
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      {rowDef.unit}
                                    </span>
                                  </span>

                                  {/* Best / Worst Badges */}
                                  {isBest && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5"
                                      title="Optimal value in this dataset"
                                    >
                                      <Award className="w-2.5 h-2.5" />
                                      Best
                                    </span>
                                  )}
                                  {isWorst && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5"
                                      title="Most adverse value in this dataset"
                                    >
                                      <Flame className="w-2.5 h-2.5" />
                                      Worst
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Note */}
      <div className="flex items-center justify-between text-[10.5px] text-[#64748B] pt-1">
        <span>
          * Comparative evaluations are calculated strictly from verifiable baseline sensors and exclude unmonitored locations.
        </span>
        <span className="font-medium text-slate-500">
          ClimateScope Platform Engine v2.0
        </span>
      </div>
    </GlassPanel>
  );
};
