"use client";

import React from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { CityComparisonItem, MetricHighlightsMap } from "@/types";
import { GlassPanel } from "@/components/shared";

interface WeatherComparisonCardProps {
  cities: CityComparisonItem[];
  highlights: MetricHighlightsMap;
}

export const WeatherComparisonCard: React.FC<WeatherComparisonCardProps> = ({
  cities,
  highlights,
}) => {
  const tempHighlight = highlights.temperature;
  const humidityHighlight = highlights.humidity;
  const windHighlight = highlights.windSpeed;

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#0F172A] tracking-tight">
              Weather Comparison
            </h3>
            <p className="text-[11px] text-[#475569] font-medium">
              Surface temperature, atmospheric humidity &amp; wind velocity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>Real-time atmospheric telemetry</span>
        </div>
      </div>

      {/* Cities Comparative Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cities.map((city) => {
          const w = city.weather;
          const isUnavailable = !w || city.isDataUnavailable || w.isDataUnavailable;

          // Check highlights
          const isLowestTemp =
            !isUnavailable &&
            tempHighlight?.hasComparableData &&
            tempHighlight.bestCityId === city.cityId;
          const isHighestTemp =
            !isUnavailable &&
            tempHighlight?.hasComparableData &&
            tempHighlight.worstCityId === city.cityId;

          const isLowestHumidity =
            !isUnavailable &&
            humidityHighlight?.hasComparableData &&
            humidityHighlight.worstCityId === city.cityId;
          const isHighestHumidity =
            !isUnavailable &&
            humidityHighlight?.hasComparableData &&
            humidityHighlight.bestCityId === city.cityId;

          const isHighestWind =
            !isUnavailable &&
            windHighlight?.hasComparableData &&
            windHighlight.bestCityId === city.cityId;

          return (
            <div
              key={city.cityId}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isUnavailable
                  ? "bg-slate-50/80 border-slate-200/80"
                  : "bg-white/95 border-slate-200/90 shadow-2xs hover:shadow-md"
              }`}
            >
              {/* City Name & Status */}
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
                    Sensor feed not integrated. Values are not estimated.
                  </span>
                  {city.apiContractNote && (
                    <span className="mt-1 text-[9px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200 break-all">
                      {city.apiContractNote}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Temperature */}
                  <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Temperature
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-black text-[#0F172A]">
                        {w.temperatureCelsius.toFixed(1)}°C
                      </span>
                      {isLowestTemp && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-0.5"
                          title="Lowest recorded temperature among comparable cities"
                        >
                          <TrendingDown className="w-2.5 h-2.5" />
                          Coolest
                        </span>
                      )}
                      {isHighestTemp && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-0.5"
                          title="Highest recorded temperature among comparable cities"
                        >
                          <TrendingUp className="w-2.5 h-2.5" />
                          Warmest
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Humidity
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-[#0F172A]">
                        {w.humidityPercent}%
                      </span>
                      {isHighestHumidity && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200"
                          title="Highest humidity level among comparable cities"
                        >
                          Highest
                        </span>
                      )}
                      {isLowestHumidity && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700"
                          title="Lowest humidity level among comparable cities"
                        >
                          Lowest
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Wind speed */}
                  <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Wind Speed
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-[#0F172A]">
                        {w.windSpeedKmh.toFixed(1)} km/h
                      </span>
                      {isHighestWind && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200"
                          title="Briskest wind speed among comparable cities"
                        >
                          Briskest
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Condition preview */}
                  {w.condition && (
                    <div className="text-[10.5px] text-[#64748B] flex items-center justify-between pt-1 font-medium">
                      <span>Condition:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {w.condition.label}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};
