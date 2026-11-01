"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CityComparisonItem } from "@/types";
import { GlassPanel } from "@/components/shared";
import { BarChart3, Wind, Thermometer, ShieldAlert } from "lucide-react";
import { getMetricValue } from "@/services";

interface ComparisonBarChartProps {
  cities: CityComparisonItem[];
}

type ChartCategory = "airQuality" | "weather" | "climateRisk";

const CITY_PALETTE = ["#059669", "#0284C7", "#F59E0B", "#8B5CF6"];

function subscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

// Custom Recharts Tooltip Component outside of render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomChartTooltip: React.FC<any> = ({ active, payload, label, cities, cityPalette }) => {
  if (active && payload && payload.length) {
    const currentUnit = payload[0]?.payload?.unit || "";

    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-3 rounded-2xl shadow-xl text-[12px] space-y-2 min-w-[200px]">
        <div className="font-bold text-[#0F172A] border-b border-slate-100 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-medium">({currentUnit})</span>
        </div>

        <div className="space-y-1.5">
          {cities.map((city: CityComparisonItem, idx: number) => {
            const color = cityPalette[idx % cityPalette.length];
            const cityPayload = payload.find((p: { dataKey: string }) => p.dataKey === city.cityId);
            const val = cityPayload?.value;

            return (
              <div key={city.cityId} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-[#475569]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {city.cityName}:
                </span>
                {val !== null && val !== undefined ? (
                  <span className="font-black text-[#0F172A]">
                    {typeof val === "number" ? val.toFixed(1) : val} {currentUnit}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Unavailable
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({ cities }) => {
  const isClient = useIsClient();
  const [activeCategory, setActiveCategory] = useState<ChartCategory>("airQuality");

  if (!isClient || !cities || cities.length === 0) {
    return (
      <GlassPanel variant="panel" className="p-5 flex items-center justify-center h-80">
        <div className="text-[12px] text-slate-400">Loading comparative charts...</div>
      </GlassPanel>
    );
  }

  // Construct dataset according to activeCategory
  let chartData: Array<Record<string, string | number | null>> = [];
  let unitSuffix = "";

  if (activeCategory === "airQuality") {
    unitSuffix = "µg/m³ or AQI";
    const metrics: Array<{ key: "aqi" | "pm25" | "pm10" | "no2"; label: string; unit: string }> = [
      { key: "aqi", label: "Index AQI", unit: "AQI" },
      { key: "pm25", label: "PM2.5", unit: "µg/m³" },
      { key: "pm10", label: "PM10", unit: "µg/m³" },
      { key: "no2", label: "NO₂", unit: "µg/m³" },
    ];

    chartData = metrics.map((m) => {
      const row: Record<string, string | number | null> = {
        metric: m.label,
        unit: m.unit,
      };
      cities.forEach((city) => {
        const val = getMetricValue(city, m.key);
        row[city.cityId] = val;
      });
      return row;
    });
  } else if (activeCategory === "weather") {
    unitSuffix = "Weather Units";
    const metrics: Array<{ key: "temperature" | "humidity" | "windSpeed"; label: string; unit: string }> = [
      { key: "temperature", label: "Temperature", unit: "°C" },
      { key: "humidity", label: "Humidity", unit: "%" },
      { key: "windSpeed", label: "Wind Speed", unit: "km/h" },
    ];

    chartData = metrics.map((m) => {
      const row: Record<string, string | number | null> = {
        metric: m.label,
        unit: m.unit,
      };
      cities.forEach((city) => {
        const val = getMetricValue(city, m.key);
        row[city.cityId] = val;
      });
      return row;
    });
  } else {
    // climateRisk
    unitSuffix = "/ 100 Index";
    const metrics: Array<{ key: "overallRisk" | "heatwaveRisk" | "floodRisk" | "droughtRisk"; label: string; unit: string }> = [
      { key: "overallRisk", label: "Overall Risk", unit: "/100" },
      { key: "heatwaveRisk", label: "Heatwave", unit: "/100" },
      { key: "floodRisk", label: "Flood Risk", unit: "/100" },
      { key: "droughtRisk", label: "Drought Risk", unit: "/100" },
    ];

    chartData = metrics.map((m) => {
      const row: Record<string, string | number | null> = {
        metric: m.label,
        unit: m.unit,
      };
      cities.forEach((city) => {
        const val = getMetricValue(city, m.key);
        row[city.cityId] = val;
      });
      return row;
    });
  }

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 flex flex-col gap-4">
      {/* Chart Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#0F172A] tracking-tight">
              Comparative Multi-City Bar Visualizations
            </h3>
            <p className="text-[11px] text-[#475569] font-medium">
              Side-by-side grouped parameter analytics with normalized units
            </p>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveCategory("airQuality")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeCategory === "airQuality"
                ? "bg-white text-[#059669] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Air Quality</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("weather")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeCategory === "weather"
                ? "bg-white text-[#0284C7] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Thermometer className="w-3 h-3" />
            <span>Weather</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("climateRisk")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeCategory === "climateRisk"
                ? "bg-white text-[#D97706] shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Climate Risk</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 bg-white/50 rounded-2xl p-2 border border-slate-100">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="metric"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 11.5, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 10 }}
            />
            <Tooltip
              content={(props) => (
                <CustomChartTooltip
                  {...props}
                  cities={cities}
                  cityPalette={CITY_PALETTE}
                />
              )}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 10, fontSize: "11px", fontWeight: 600 }}
              formatter={(value) => {
                const matchedCity = cities.find((c) => c.cityId === value);
                return matchedCity ? matchedCity.cityName : value;
              }}
            />
            {cities.map((city, idx) => (
              <Bar
                key={city.cityId}
                dataKey={city.cityId}
                name={city.cityId}
                fill={CITY_PALETTE[idx % CITY_PALETTE.length]}
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Note Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#64748B] pt-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0F172A]">Active Units:</span>
          <span>{unitSuffix}</span>
        </div>
        <div className="text-[10px] text-slate-500 italic">
          * Missing telemetry bars are deliberately omitted to avoid rendering false 0 values.
        </div>
      </div>
    </GlassPanel>
  );
};
