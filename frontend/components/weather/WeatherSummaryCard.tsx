"use client";

import React from "react";
import { GlassPanel } from "@/components/shared";
import { CurrentWeather } from "@/types";
import {
  Droplets,
  Wind,
  Gauge,
  SunMedium,
  AlertCircle,
  RefreshCw,
  Radio,
  FileCode,
  MapPin,
} from "lucide-react";

interface WeatherSummaryCardProps {
  weather: CurrentWeather | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const WeatherSummaryCard: React.FC<WeatherSummaryCardProps> = ({
  weather,
  loading = false,
  error = null,
  onRetry,
}) => {
  // Loading State Skeleton
  if (loading) {
    return (
      <GlassPanel variant="panel" className="p-5 w-84 pointer-events-auto shadow-xl animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="h-9 w-24 bg-slate-200 rounded-lg" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-4 w-44 bg-slate-200 rounded mt-3" />
        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-slate-200">
          <div className="h-14 bg-slate-100 rounded-xl" />
          <div className="h-14 bg-slate-100 rounded-xl" />
          <div className="h-14 bg-slate-100 rounded-xl" />
        </div>
      </GlassPanel>
    );
  }

  // Error State
  if (error || !weather) {
    return (
      <GlassPanel variant="panel" className="p-5 w-84 pointer-events-auto shadow-xl border border-red-200">
        <div className="flex items-center gap-2.5 text-[#DC2626]">
          <AlertCircle className="w-5 h-5" />
          <span className="text-[14px] font-bold">Failed to load weather</span>
        </div>
        <p className="text-[12px] text-[#64748B] mt-2">
          {error || "Unable to retrieve environmental observation for this city."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </GlassPanel>
    );
  }

  // 3. Dynamic Location With Unavailable Live Sensor Data (Never Fabricate Values)
  if (weather.isDataUnavailable) {
    return (
      <GlassPanel variant="panel" className="p-5 w-84 pointer-events-auto shadow-xl border border-slate-200/90">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[12px] uppercase font-bold tracking-wider text-[#475569] block">
              {weather.cityName}
            </span>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#64748B] font-medium">
              <MapPin className="w-3 h-3 text-[#0891B2]" />
              <span>
                {weather.coordinates
                  ? `${weather.coordinates.lat.toFixed(3)}°N, ${weather.coordinates.lng.toFixed(3)}°E`
                  : "Geocoded Coordinates"}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D97706] shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Sensor Notice */}
        <div className="mt-3.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#B45309]">
            <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Live Sensor Feed Pending</span>
          </div>
          <p className="text-[11px] text-[#78350F] mt-1 leading-relaxed">
            Physical environmental sensors have not yet been deployed for this coordinate. No fabricated values are displayed.
          </p>
        </div>

        {/* Backend API Contract Specification Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A]">
            <FileCode className="w-3.5 h-3.5 text-[#059669]" />
            <span>Required Backend API Contract</span>
          </div>
          <p className="text-[11px] font-mono text-[#059669] bg-white p-1.5 rounded-lg border border-slate-200 mt-1.5 break-all">
            {weather.apiContractNote || "GET /api/weather?lat={lat}&lng={lng}"}
          </p>
          <p className="text-[10px] text-[#64748B] mt-1">
            Expected response: JSON with temperature, humidity, wind &amp; pressure.
          </p>
        </div>
      </GlassPanel>
    );
  }

  // 4. Predefined City with Sample Baseline Data
  return (
    <GlassPanel variant="panel" className="p-5 w-84 pointer-events-auto shadow-xl">
      {/* City & Temperature Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] uppercase font-bold tracking-wider text-[#475569]">
              {weather.cityName}
            </span>
            {weather.isSampleData && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] font-semibold border border-slate-200">
                Sample Baseline Data
              </span>
            )}
          </div>
          <div className="text-[34px] font-black tracking-tight text-[#0F172A] mt-1 leading-none">
            {weather.temperatureCelsius.toFixed(1)}°C
          </div>
        </div>
        {/* Soft Blue / Cyan Gradient Weather Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200/80 flex items-center justify-center text-[#0284C7] shadow-xs shrink-0">
          <SunMedium className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* Environmental Status Tag */}
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0" />
        <span className="text-[14px] text-[#059669] font-semibold">
          {weather.condition.label}
        </span>
        <span className="text-[13px] text-[#64748B]">
          • Feels {weather.feelsLikeCelsius.toFixed(1)}°C
        </span>
      </div>

      {/* Humidity, Wind, Pressure in Individual Light-Coloured Mini Cards */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-slate-200/80">
        {/* Humidity Card */}
        <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs text-center flex flex-col items-center">
          <div className="flex items-center gap-1 text-[12px] text-[#475569] font-medium">
            <Droplets className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Humidity</span>
          </div>
          <span className="text-[15px] font-bold text-[#0F172A] mt-1">
            {weather.humidityPercent}%
          </span>
        </div>

        {/* Wind Card */}
        <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs text-center flex flex-col items-center">
          <div className="flex items-center gap-1 text-[12px] text-[#475569] font-medium">
            <Wind className="w-3.5 h-3.5 text-[#0891B2]" />
            <span>Wind</span>
          </div>
          <span className="text-[15px] font-bold text-[#0F172A] mt-1">
            {weather.windSpeedKmh} <span className="text-[11px] font-normal text-[#64748B]">km/h</span>
          </span>
        </div>

        {/* Pressure Card */}
        <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs text-center flex flex-col items-center">
          <div className="flex items-center gap-1 text-[12px] text-[#475569] font-medium">
            <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Pressure</span>
          </div>
          <span className="text-[15px] font-bold text-[#0F172A] mt-1">
            {weather.pressureHpa} <span className="text-[11px] font-normal text-[#64748B]">hPa</span>
          </span>
        </div>
      </div>
    </GlassPanel>
  );
};
