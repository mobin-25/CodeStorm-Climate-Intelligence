"use client";

import React from "react";
import {
  Wind,
  AlertCircle,
  Award,
  Flame,
} from "lucide-react";
import { CityComparisonItem, MetricHighlightsMap } from "@/types";
import { GlassPanel } from "@/components/shared";

interface AirQualityComparisonCardProps {
  cities: CityComparisonItem[];
  highlights: MetricHighlightsMap;
}

export const AirQualityComparisonCard: React.FC<AirQualityComparisonCardProps> = ({
  cities,
  highlights,
}) => {
  const aqiHighlight = highlights.aqi;
  const pm25Highlight = highlights.pm25;
  const pm10Highlight = highlights.pm10;
  const no2Highlight = highlights.no2;

  const getAqiBadge = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" };
    if (aqi <= 100) return { label: "Satisfactory", bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-300" };
    if (aqi <= 200) return { label: "Moderate", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" };
    if (aqi <= 300) return { label: "Poor", bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" };
    if (aqi <= 400) return { label: "Very Poor", bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
    return { label: "Severe", bg: "bg-rose-200", text: "text-rose-900", border: "border-rose-400" };
  };

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#0F172A] tracking-tight">
              Air Quality &amp; Particulate Comparison
            </h3>
            <p className="text-[11px] text-[#475569] font-medium">
              National AQI Index, PM2.5, PM10 &amp; Nitrogen Dioxide concentrations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10.5px] font-semibold text-[#64748B]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Lower value is cleaner
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Higher value is hazardous
          </span>
        </div>
      </div>

      {/* Cities Comparative Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cities.map((city) => {
          const a = city.airQuality;
          const isUnavailable = !a || city.isDataUnavailable || a.isDataUnavailable;

          const isBestAqi =
            !isUnavailable &&
            aqiHighlight?.hasComparableData &&
            aqiHighlight.bestCityId === city.cityId;
          const isWorstAqi =
            !isUnavailable &&
            aqiHighlight?.hasComparableData &&
            aqiHighlight.worstCityId === city.cityId;

          const pm25Val = a?.pollutants?.pm25?.value;
          const pm10Val = a?.pollutants?.pm10?.value;
          const no2Val = a?.pollutants?.no2?.value;

          const isBestPm25 =
            !isUnavailable &&
            pm25Highlight?.hasComparableData &&
            pm25Highlight.bestCityId === city.cityId;
          const isWorstPm25 =
            !isUnavailable &&
            pm25Highlight?.hasComparableData &&
            pm25Highlight.worstCityId === city.cityId;

          const isBestPm10 =
            !isUnavailable &&
            pm10Highlight?.hasComparableData &&
            pm10Highlight.bestCityId === city.cityId;

          const isBestNo2 =
            !isUnavailable &&
            no2Highlight?.hasComparableData &&
            no2Highlight.bestCityId === city.cityId;

          const aqiBadge = !isUnavailable && typeof a?.aqi === "number" ? getAqiBadge(a.aqi) : null;

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
                    CPCB/CAAQMS sensor offline. No synthetic estimate applied.
                  </span>
                  {city.apiContractNote && (
                    <span className="mt-1 text-[9px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200 break-all">
                      {city.apiContractNote}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* AQI Score */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                        Index AQI
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[18px] font-black text-[#0F172A]">
                          {a.aqi}
                        </span>
                        {aqiBadge && (
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${aqiBadge.bg} ${aqiBadge.text} ${aqiBadge.border}`}
                          >
                            {aqiBadge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isBestAqi && (
                        <span
                          className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs"
                          title="Cleanest ambient air among compared cities"
                        >
                          <Award className="w-3 h-3 text-emerald-600" />
                          Best Air
                        </span>
                      )}
                      {isWorstAqi && (
                        <span
                          className="px-2 py-1 rounded-lg text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs"
                          title="Most degraded ambient air among compared cities"
                        >
                          <Flame className="w-3 h-3 text-rose-600" />
                          Worst Air
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pollutant Metrics: PM2.5, PM10, NO2 */}
                  <div className="space-y-1.5 text-[11px]">
                    {/* PM2.5 */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/60 border border-slate-100">
                      <span className="font-semibold text-[#475569]">
                        PM2.5 (Limit 60)
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#0F172A]">
                          {typeof pm25Val === "number" ? `${pm25Val} µg/m³` : "--"}
                        </span>
                        {isBestPm25 && (
                          <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                            Lowest
                          </span>
                        )}
                        {isWorstPm25 && (
                          <span className="text-[8.5px] font-bold px-1 rounded bg-red-100 text-red-800">
                            Highest
                          </span>
                        )}
                      </div>
                    </div>

                    {/* PM10 */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/60 border border-slate-100">
                      <span className="font-semibold text-[#475569]">
                        PM10 (Limit 100)
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#0F172A]">
                          {typeof pm10Val === "number" ? `${pm10Val} µg/m³` : "--"}
                        </span>
                        {isBestPm10 && (
                          <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                            Lowest
                          </span>
                        )}
                      </div>
                    </div>

                    {/* NO2 */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/60 border border-slate-100">
                      <span className="font-semibold text-[#475569]">
                        NO₂ (Limit 80)
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#0F172A]">
                          {typeof no2Val === "number" ? `${no2Val} µg/m³` : "--"}
                        </span>
                        {isBestNo2 && (
                          <span className="text-[8.5px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                            Lowest
                          </span>
                        )}
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
