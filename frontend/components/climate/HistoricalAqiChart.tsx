"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { HistoricalDataPoint } from "@/types";

interface HistoricalAqiChartProps {
  points: HistoricalDataPoint[];
}

export const HistoricalAqiChart: React.FC<HistoricalAqiChartProps> = ({ points }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !points || points.length === 0) {
    return (
      <div className="w-full h-52 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center text-[12px] text-[#64748B]">
        Loading air quality trends...
      </div>
    );
  }

  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "#10B981" };
    if (aqi <= 100) return { label: "Satisfactory", color: "#84CC16" };
    if (aqi <= 200) return { label: "Moderate", color: "#F59E0B" };
    if (aqi <= 300) return { label: "Poor", color: "#F97316" };
    if (aqi <= 400) return { label: "Very Poor", color: "#EF4444" };
    return { label: "Severe", color: "#7F1D1D" };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HistoricalDataPoint;
      const cat = getAqiCategory(data.aqi);

      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5 min-w-[170px]">
          <div className="flex items-center justify-between gap-3 font-bold text-[#0F172A] border-b border-slate-100 pb-1">
            <span>{label}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#8B5CF6] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              Index AQI:
            </span>
            <span className="font-bold text-[#0F172A]">{data.aqi}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#EF4444] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              PM2.5:
            </span>
            <span className="font-bold text-[#0F172A]">{data.pm25} µg/m³</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#F59E0B] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              PM10:
            </span>
            <span className="font-bold text-[#0F172A]">{data.pm10} µg/m³</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#0F172A] block">
            Air Quality & Particulate Trends
          </span>
          <span className="text-[10px] text-[#64748B]">
            Historical AQI, PM2.5 & PM10 Pollution Levels
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-[#8B5CF6] font-medium">
            <span className="w-2 h-0.5 bg-[#8B5CF6]" /> AQI
          </span>
          <span className="flex items-center gap-1 text-[#EF4444] font-medium">
            <span className="w-2 h-0.5 bg-[#EF4444]" /> PM2.5
          </span>
          <span className="flex items-center gap-1 text-[#F59E0B] font-medium">
            <span className="w-2 h-0.5 bg-[#F59E0B]" /> PM10
          </span>
        </div>
      </div>

      <div className="w-full h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={0} content={() => null} />
            <Line
              type="monotone"
              dataKey="aqi"
              name="AQI"
              stroke="#8B5CF6"
              strokeWidth={2.2}
              dot={{ r: 2.5, fill: "#8B5CF6" }}
              activeDot={{ r: 5, fill: "#8B5CF6" }}
            />
            <Line
              type="monotone"
              dataKey="pm25"
              name="PM2.5"
              stroke="#EF4444"
              strokeWidth={1.8}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: "#EF4444" }}
              activeDot={{ r: 4, fill: "#EF4444" }}
            />
            <Line
              type="monotone"
              dataKey="pm10"
              name="PM10"
              stroke="#F59E0B"
              strokeWidth={1.8}
              dot={{ r: 2, fill: "#F59E0B" }}
              activeDot={{ r: 4, fill: "#F59E0B" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
