"use client";

import React from "react";
import Link from "next/link";
import { Wind, ArrowLeft, ShieldCheck, Layers } from "lucide-react";
import { GlassPanel } from "@/components/shared";
import { CityComparisonDashboard } from "@/components/comparison";

export default function ComparePage() {
  return (
    <main className="w-full h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#ECFDF5] p-3 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* Top Header Navigation */}
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
                City Comparison
              </span>
            </div>
            <p className="text-[12px] text-[#475569] font-medium leading-tight mt-0.5">
              Multi-City Environmental Intelligence &amp; Cross-Hazard Analysis
            </p>
          </div>
        </GlassPanel>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Active Compare Page Button (Only Compare button visible on this page) */}
          <span
            className="h-11 px-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-md shadow-emerald-600/20 backdrop-blur-xl text-[12px] font-bold flex items-center gap-2 shrink-0 cursor-default"
          >
            <Layers className="w-4 h-4 text-white" />
            <span>Compare</span>
          </span>

          {/* Back to Interactive Map Dashboard Button */}
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

      {/* Embedded City Comparison Dashboard */}
      <section className="w-full max-w-7xl mx-auto">
        <CityComparisonDashboard embedded={true} />
      </section>

      {/* Bottom Platform Status */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between text-[12px] text-[#64748B] pt-4 pb-8 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-2xs" />
          <span>
            Platform Active • <strong className="font-bold text-[#0F172A]">ClimateScope India</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>CPCB/CAAQMS Standards • Strict Data Integrity Enforced</span>
        </div>
      </footer>
    </main>
  );
}

