"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { HistoricalDataPoint } from "@/types";

interface HistoricalRainChartProps {
  points: HistoricalDataPoint[];
  totalRainfallMm: number;
}

export const HistoricalRainChart: React.FC<HistoricalRainChartProps> = ({
  points,
  totalRainfallMm,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !points || points.length === 0) {
    return (
      <div className="w-full h-52 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center text-[12px] text-[#64748B]">
        Loading rainfall trends...
      </div>
    );
  }

  const maxPeriodRain = Math.max(...points.map((p) => p.rainfallMm));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HistoricalDataPoint;
      const shareOfTotal =
        totalRainfallMm > 0
          ? ((data.rainfallMm / totalRainfallMm) * 100).toFixed(1)
          : "0";

      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5 min-w-[170px]">
          <div className="flex items-center justify-between gap-3 font-bold text-[#0F172A] border-b border-slate-100 pb-1">
            <span>{label}</span>
            <span className="text-[10px] text-[#0284C7] font-semibold">
              {shareOfTotal}% of total
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#0284C7] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
              Precipitation:
            </span>
            <span className="font-bold text-[#0F172A]">{data.rainfallMm} mm</span>
          </div>
          <div className="text-[10px] text-[#64748B]">
            {data.rainfallMm > 200
              ? "Heavy Monsoonal Peak"
              : data.rainfallMm > 80
              ? "Moderate Rainfall Period"
              : "Dry / Low Rainfall Period"}
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
            Rainfall Trends & Distribution
          </span>
          <span className="text-[10px] text-[#64748B]">
            Periodic Rainfall Accumulation (mm)
          </span>
        </div>
        <div className="text-right">
          <span className="text-[12px] font-bold text-[#0284C7]">
            {totalRainfallMm} mm
          </span>
          <span className="text-[10px] text-[#64748B] block">Cumulative Total</span>
        </div>
      </div>

      <div className="w-full h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rainBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284C7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="rainBarPeakGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0369A1" stopOpacity={1} />
                <stop offset="100%" stopColor="#0284C7" stopOpacity={0.85} />
              </linearGradient>
            </defs>
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
              unit="mm"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="rainfallMm"
              name="Rainfall (mm)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            >
              {points.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.rainfallMm === maxPeriodRain && maxPeriodRain > 0
                      ? "url(#rainBarPeakGrad)"
                      : "url(#rainBarGrad)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
