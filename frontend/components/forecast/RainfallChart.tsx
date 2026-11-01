"use client";

import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ForecastDay } from "@/types";

interface RainfallChartProps {
  days: ForecastDay[];
}

export const RainfallChart: React.FC<RainfallChartProps> = ({ days }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !days || days.length === 0) {
    return (
      <div className="w-full h-44 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center text-[12px] text-[#64748B]">
        Loading rainfall forecast chart...
      </div>
    );
  }

  const chartData = days.map((d) => ({
    name: d.dayLabel,
    fullDate: d.fullDateLabel,
    rainMm: d.expectedRainfallMm,
    probPercent: d.rainfallProbability,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-xl shadow-lg text-[11px] space-y-1">
          <div className="font-bold text-[#0F172A] border-b border-slate-100 pb-1">
            {label} ({data.fullDate})
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#0284C7] font-semibold">Precipitation:</span>
            <span className="font-bold text-[#0F172A]">{data.rainMm.toFixed(1)} mm</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#0D9488] font-semibold">Probability:</span>
            <span className="font-bold text-[#0F172A]">{data.probPercent}%</span>
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
          Precipitation Probability &amp; Volume
        </span>
        <span className="text-[10px] text-[#94A3B8]">mm &amp; %</span>
      </div>

      <div className="w-full h-38">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: -10, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            {/* Left Y-Axis for Rainfall mm */}
            <YAxis
              yAxisId="left"
              stroke="#0284C7"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              domain={[0, "auto"]}
            />
            {/* Right Y-Axis for Probability % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#0D9488"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: "10px", paddingBottom: "4px" }}
            />
            <Bar
              yAxisId="left"
              dataKey="rainMm"
              name="Rain (mm)"
              fill="#0284C7"
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="probPercent"
              name="Rain Prob (%)"
              stroke="#0D9488"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#0D9488" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
