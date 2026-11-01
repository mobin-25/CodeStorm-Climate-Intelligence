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

interface HistoricalTempChartProps {
  points: HistoricalDataPoint[];
}

export const HistoricalTempChart: React.FC<HistoricalTempChartProps> = ({ points }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !points || points.length === 0) {
    return (
      <div className="w-full h-52 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center text-[12px] text-[#64748B]">
        Loading temperature trends...
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HistoricalDataPoint;
      const spread = (data.maxTemp - data.minTemp).toFixed(1);

      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5 min-w-[170px]">
          <div className="flex items-center justify-between gap-3 font-bold text-[#0F172A] border-b border-slate-100 pb-1">
            <span>{label}</span>
            <span className="text-[10px] text-[#64748B] font-normal">Spread: {spread}°C</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#EA580C] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              Max Temp:
            </span>
            <span className="font-bold text-[#0F172A]">{data.maxTemp}°C</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#059669] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              Avg Temp:
            </span>
            <span className="font-bold text-[#0F172A]">{data.avgTemp}°C</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#0284C7] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
              Min Temp:
            </span>
            <span className="font-bold text-[#0F172A]">{data.minTemp}°C</span>
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
            Temperature Trends (°C)
          </span>
          <span className="text-[10px] text-[#64748B]">
            Max, Average & Min Surface Climatology
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-[#EA580C] font-medium">
            <span className="w-2 h-0.5 bg-[#EA580C]" /> Max
          </span>
          <span className="flex items-center gap-1 text-[#059669] font-medium">
            <span className="w-2 h-0.5 bg-[#059669]" /> Avg
          </span>
          <span className="flex items-center gap-1 text-[#0284C7] font-medium">
            <span className="w-2 h-0.5 bg-[#0284C7]" /> Min
          </span>
        </div>
      </div>

      <div className="w-full h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
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
              unit="°"
              domain={["dataMin - 3", "dataMax + 3"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={0} content={() => null} />
            <Line
              type="monotone"
              dataKey="maxTemp"
              name="Max Temp"
              stroke="#EA580C"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#EA580C" }}
              activeDot={{ r: 5, fill: "#EA580C" }}
            />
            <Line
              type="monotone"
              dataKey="avgTemp"
              name="Avg Temp"
              stroke="#059669"
              strokeWidth={2.2}
              dot={{ r: 2.5, fill: "#059669" }}
              activeDot={{ r: 5, fill: "#059669" }}
            />
            <Line
              type="monotone"
              dataKey="minTemp"
              name="Min Temp"
              stroke="#0284C7"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#0284C7" }}
              activeDot={{ r: 5, fill: "#0284C7" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
