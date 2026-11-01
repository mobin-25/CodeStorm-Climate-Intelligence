"use client";

import React from "react";
import Link from "next/link";
import {
  Wind,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import { GlassPanel } from "@/components/shared";
import { useEnvironmentalReport } from "@/hooks";
import { ReportConfigBar, ReportPreviewDocument } from "@/components/reports";

export default function ReportsPage() {
  const {
    selectedLocation,
    reportType,
    dateRange,
    reportData,
    loading,
    error,
    summaryMetrics,
    setSelectedLocation,
    setReportType,
    setDateRange,
    refetch,
    exportCSV,
    downloadPDF,
    availablePresets,
  } = useEnvironmentalReport();

  return (
    <main className="w-full h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#ECFDF5] p-3 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* 1. Top Header Navigation (Hidden during print) */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap no-print">
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
                Reports &amp; Export
              </span>
            </div>
            <p className="text-[12px] text-[#475569] font-medium leading-tight mt-0.5">
              Official Environmental Dossier Generator &amp; Telemetry Exports
            </p>
          </div>
        </GlassPanel>

        {/* Navigation Action Links */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Active Reports Page Button (Only Reports button visible on this page) */}
          <span
            className="h-11 px-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-md shadow-emerald-600/20 backdrop-blur-xl text-[12px] font-bold flex items-center gap-2 shrink-0 cursor-default"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Reports</span>
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

      {/* 2. Report Configuration Controls (Hidden during print) */}
      <section className="w-full max-w-7xl mx-auto no-print">
        <ReportConfigBar
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          reportType={reportType}
          onSelectReportType={setReportType}
          dateRange={dateRange}
          onSelectDateRange={setDateRange}
          onDownloadPDF={downloadPDF}
          onExportCSV={exportCSV}
          loading={loading}
          availablePresets={availablePresets}
        />
      </section>

      {/* 3. Report Live Document Preview Canvas */}
      <section className="w-full max-w-7xl mx-auto flex flex-col gap-4">
        {/* Error Notice if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={refetch}
              className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton Indicator */}
        {loading && (
          <GlassPanel
            variant="panel"
            className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 shadow-md no-print"
          >
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-[14px] font-bold text-[#0F172A]">
              Compiling Environmental Intelligence Dossier for {selectedLocation.name}...
            </span>
            <span className="text-[12px] text-[#64748B]">
              Aggregating Weather, AQI, Multihazard Risk, and Historical Archives
            </span>
          </GlassPanel>
        )}

        {/* Live Document Preview */}
        {!loading && reportData && (
          <div className="animate-in fade-in duration-200">
            <ReportPreviewDocument
              report={reportData}
              metrics={summaryMetrics}
            />
          </div>
        )}
      </section>

      {/* 4. Bottom Platform Status (Hidden during print) */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between text-[12px] text-[#64748B] pt-4 pb-8 flex-wrap gap-2 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-2xs" />
          <span>
            Platform Active • <strong className="font-bold text-[#0F172A]">ClimateScope Reports Hub</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#475569] font-medium">
            Strict Data Integrity Enforced • Zero Live Measurements Fabricated
          </span>
        </div>
      </footer>
    </main>
  );
}
