"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wind,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { GlassPanel } from "@/components/shared";
import { CitySearchBar } from "@/components/navigation/CitySearchBar";
import { ClimateInsightsDashboard } from "@/components/insights";
import { GeocodedLocation } from "@/types";

const PRESET_CITIES: GeocodedLocation[] = [
  {
    id: "delhi",
    name: "Delhi",
    state: "Delhi",
    displayName: "Delhi, Delhi, India",
    coordinates: { lat: 28.6139, lng: 77.209 },
    isPredefinedCity: true,
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    displayName: "Mumbai, Maharashtra, India",
    coordinates: { lat: 19.076, lng: 72.8777 },
    isPredefinedCity: true,
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    displayName: "Bengaluru, Karnataka, India",
    coordinates: { lat: 12.9716, lng: 77.5946 },
    isPredefinedCity: true,
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    displayName: "Pune, Maharashtra, India",
    coordinates: { lat: 18.5204, lng: 73.8567 },
    isPredefinedCity: true,
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    displayName: "Kolkata, West Bengal, India",
    coordinates: { lat: 22.5726, lng: 88.3639 },
    isPredefinedCity: true,
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    displayName: "Chennai, Tamil Nadu, India",
    coordinates: { lat: 13.0827, lng: 80.2707 },
    isPredefinedCity: true,
  },
];

export default function InsightsPage() {
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation>(
    PRESET_CITIES[0]
  );

  return (
    <main className="w-full h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#ECFDF5] p-3 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* 1. Top Header Navigation */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <GlassPanel
          variant="panel"
          className="px-5 py-3 flex items-center gap-3.5 shadow-md"
        >
          {/* Logo with Green -> Cyan Environmental Gradient */}
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#059669] to-[#0891B2] text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Wind className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[18px] tracking-tight text-[#0F172A]">
                ClimateScope
              </h1>
              <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200/80 shadow-2xs">
                Climate Insights &amp; Recommendations
              </span>
            </div>
            <p className="text-[12px] text-[#475569] font-medium leading-tight mt-0.5">
              Deterministic Environmental Heuristics &amp; Public Activity Guidance
            </p>
          </div>
        </GlassPanel>

        {/* Action Links */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Active Insights Page Button (Only Insights button visible on this page) */}
          <span
            className="h-11 px-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-md shadow-emerald-600/20 backdrop-blur-xl text-[12px] font-bold flex items-center gap-2 shrink-0 cursor-default"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Insights</span>
          </span>

          {/* Link to Interactive Map Dashboard */}
          <Link
            href="/"
            title="Return to the Interactive Map Dashboard"
            className="h-11 px-4 rounded-2xl bg-white/90 hover:bg-white text-[#0F172A] hover:text-[#059669] border border-white/90 shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-md backdrop-blur-xl text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer group active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#059669] group-hover:-translate-x-0.5 transition-transform" />
            <span>Interactive Map</span>
          </Link>
        </div>
      </header>

      {/* 2. City Selector & Presets Bar */}
      <section className="w-full max-w-7xl mx-auto">
        <GlassPanel
          variant="panel"
          className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm"
        >
          {/* Dynamic City Search Bar */}
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#059669]" />
              <span>Select Indian City</span>
            </label>
            <CitySearchBar
              selectedLocation={selectedLocation}
              selectedCityName={selectedLocation.name}
              onLocationSelect={(loc) => setSelectedLocation(loc)}
              onClearSelection={() => setSelectedLocation(PRESET_CITIES[0])}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>Quick Presets</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_CITIES.map((city) => {
                const isSelected =
                  selectedLocation.id === city.id ||
                  selectedLocation.name.toLowerCase() === city.name.toLowerCase();

                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => setSelectedLocation(city)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-sm scale-102"
                        : "bg-white/80 hover:bg-white text-[#475569] hover:text-[#0F172A] border border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    <span>{city.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* 3. Embedded Climate Insights Dashboard */}
      <section className="w-full max-w-7xl mx-auto flex-1">
        <ClimateInsightsDashboard
          query={{
            cityId: selectedLocation.id || selectedLocation.name.toLowerCase(),
            cityName: selectedLocation.name,
            state: selectedLocation.state,
            coordinates: selectedLocation.coordinates,
          }}
          isCompact={false}
        />
      </section>

      {/* 4. Bottom Platform Status & Data Integrity Footer */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between text-[12px] text-[#64748B] pt-4 pb-8 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-2xs" />
          <span>
            Platform Active • <strong className="font-bold text-[#0F172A]">ClimateScope India</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rule-Based Telemetry Analytics • Non-Medical General Guidance • Strict Integrity</span>
        </div>
      </footer>
    </main>
  );
}
