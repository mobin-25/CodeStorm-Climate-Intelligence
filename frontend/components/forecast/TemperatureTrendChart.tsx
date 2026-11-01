"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ForecastDay } from "@/types";

interface TemperatureTrendChartProps {
  days: ForecastDay[];
}

export const TemperatureTrendChart: React.FC<TemperatureTrendChartProps> = ({ days }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !days || days.length === 0) {
    return (
      <div className="w-full h-44 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center text-[12px] text-[#64748B]">
        Loading temperature trend chart...
      </div>
    );
  }

  const chartData = days.map((d) => ({
    name: d.dayLabel,
    fullDate: d.fullDateLabel,
    condition: d.condition.label,
    maxTemp: d.maxTempCelsius,
    minTemp: d.minTempCelsius,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-xl shadow-lg text-[11px] space-y-1">
          <div className="flex items-center justify-between gap-3 font-bold text-[#0F172A] border-b border-slate-100 pb-1">
            <span>{label} ({data.fullDate})</span>
            <span className="text-[#64748B] font-medium">{data.condition}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#EA580C] font-semibold">Max Temp:</span>
            <span className="font-bold text-[#0F172A]">{data.maxTemp}°C</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#0284C7] font-semibold">Min Temp:</span>
            <span className="font-bold text-[#0F172A]">{data.minTemp}°C</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-48 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between px-2 pt-0.5 pb-1">
        <span className="text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
          Daily Temperature Trend (°C)
        </span>
        <span className="text-[10px] text-[#94A3B8]">7-Day Range</span>
      </div>

      <div className="w-full h-38">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="maxTempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="minTempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="name"
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
              domain={["dataMin - 3", "dataMax + 3"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: "10px", paddingBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="maxTemp"
              name="Max Temp"
              stroke="#EA580C"
              strokeWidth={2}
              fill="url(#maxTempGrad)"
            />
            <Area
              type="monotone"
              dataKey="minTemp"
              name="Min Temp"
              stroke="#0284C7"
              strokeWidth={2}
              fill="url(#minTempGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
