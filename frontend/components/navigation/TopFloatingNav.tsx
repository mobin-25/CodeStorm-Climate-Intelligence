"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlassPanel } from "@/components/shared";
import { Wind, MapPin, RotateCcw, Bell, Layers, FileText, Sparkles } from "lucide-react";
import { CitySearchBar } from "./CitySearchBar";
import { GeocodedLocation } from "@/types";

interface TopFloatingNavProps {
  currentCityName?: string;
  selectedLocation?: GeocodedLocation | null;
  onLocationSelect?: (location: GeocodedLocation) => void;
  onClearSelection?: () => void;
  unreadAlertCount?: number;
  onOpenNotifications?: () => void;
}

export const TopFloatingNav: React.FC<TopFloatingNavProps> = ({
  currentCityName = "India",
  selectedLocation,
  onLocationSelect,
  onClearSelection,
  unreadAlertCount = 0,
  onOpenNotifications,
}) => {
  const pathname = usePathname() || "/";
  const isComparePage = pathname === "/compare" || pathname.startsWith("/compare/");
  const isInsightsPage = pathname === "/insights" || pathname.startsWith("/insights/");
  const isReportsPage = pathname === "/reports" || pathname.startsWith("/reports/");
  const isDashboard = !isComparePage && !isInsightsPage && !isReportsPage;

  // Context-aware button visibility rules:
  // 1. When the user opens the Compare page, show only the Compare button.
  // 2. When the user opens the Insights page, show only the Insights button.
  // 3. When the user opens the Reports page, show only the Reports button.
  // 4. When the user returns to the Interactive Map dashboard, show all three buttons: Compare, Insights and Reports.
  const showCompare = isDashboard || isComparePage;
  const showInsights = isDashboard || isInsightsPage;
  const showReports = isDashboard || isReportsPage;

  return (
    <header className="absolute top-5 left-5 right-5 z-50 pointer-events-none flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
      {/* Brand & Subtitle Floating Frosted Pill */}
      <GlassPanel
        variant="panel"
        className="pointer-events-auto px-5 py-3 flex items-center gap-3.5 shrink-0"
      >
        <Link
          href="/"
          title="Return to Interactive Map Dashboard"
          className="flex items-center gap-3.5 group"
        >
          {/* Logo with Green -> Cyan Environmental Gradient */}
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#059669] to-[#0891B2] text-white shadow-md shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
            <Wind className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[17px] tracking-tight text-[#0F172A] group-hover:text-[#059669] transition-colors">
                ClimateScope
              </h1>
              <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200/80 shadow-2xs">
                India
              </span>
            </div>
            <p className="text-[12px] text-[#475569] font-medium leading-tight mt-0.5">
              Environmental Intelligence &amp; Risk Analytics
            </p>
          </div>
        </Link>
      </GlassPanel>

      {/* Central City Search Bar, Reset Button & Context-Aware Nav Buttons */}
      <div className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-center gap-2">
        {onLocationSelect && (
          <>
            <CitySearchBar
              selectedLocation={selectedLocation}
              selectedCityName={currentCityName}
              onLocationSelect={onLocationSelect}
              onClearSelection={onClearSelection}
            />
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                title="Reset view to all-India overview"
                className="pointer-events-auto h-11 px-3.5 rounded-2xl bg-white/90 hover:bg-white text-[#475569] hover:text-[#059669] border border-white/90 shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-md backdrop-blur-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 group active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#059669] group-hover:-rotate-90 transition-transform duration-300" />
                <span>Reset</span>
              </button>
            )}
          </>
        )}

        {/* 1. Compare Button */}
        {showCompare && (
          <Link
            href="/compare"
            title="City Environmental Comparison"
            className={`pointer-events-auto h-11 px-3.5 rounded-2xl border shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-md backdrop-blur-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 group active:scale-95 ${
              isComparePage
                ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white border-emerald-500/20 shadow-emerald-600/20"
                : "bg-white/90 hover:bg-white text-[#475569] hover:text-[#059669] border-white/90"
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${isComparePage ? "text-white" : "text-[#059669] group-hover:scale-110"} transition-transform duration-300`} />
            <span>Compare</span>
          </Link>
        )}

        {/* 2. Insights Button */}
        {showInsights && (
          <Link
            href="/insights"
            title="Climate Insights & Smart Recommendations"
            className={`pointer-events-auto h-11 px-3.5 rounded-2xl border shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-md backdrop-blur-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 group active:scale-95 ${
              isInsightsPage
                ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white border-emerald-500/20 shadow-emerald-600/20"
                : "bg-white/90 hover:bg-white text-[#475569] hover:text-[#059669] border-white/90"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isInsightsPage ? "text-white" : "text-[#059669] group-hover:scale-110"} transition-transform duration-300`} />
            <span>Insights</span>
          </Link>
        )}

        {/* 3. Reports Button */}
        {showReports && (
          <Link
            href="/reports"
            title="Generate & Export Environmental Reports"
            className={`pointer-events-auto h-11 px-3.5 rounded-2xl border shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-md backdrop-blur-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 group active:scale-95 ${
              isReportsPage
                ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white border-emerald-500/20 shadow-emerald-600/20"
                : "bg-white/90 hover:bg-white text-[#475569] hover:text-[#059669] border-white/90"
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${isReportsPage ? "text-white" : "text-[#059669] group-hover:scale-110"} transition-transform duration-300`} />
            <span>Reports</span>
          </Link>
        )}
      </div>

      {/* Location & Live Feed Status Frosted Pill */}
      <GlassPanel
        variant="control"
        className="order-2 lg:order-3 pointer-events-auto px-4 py-2 flex items-center gap-3.5 shrink-0"
      >
        <div className="flex items-center gap-2 text-[13px]">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-[#0284C7] shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] block font-medium leading-none">
              Region
            </span>
            <span
              className="font-semibold text-[#0F172A] leading-tight line-clamp-1 max-w-[180px]"
              title={selectedLocation ? selectedLocation.name : "India"}
            >
              {selectedLocation ? selectedLocation.name : "India"}
            </span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-[11px] text-[#059669] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
          </span>
          <span>Live Feed</span>
        </div>

        {/* Notification Centre Bell Trigger */}
        {onOpenNotifications && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <button
              type="button"
              onClick={onOpenNotifications}
              title="Open Environmental Notification Centre"
              className="relative p-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-[#475569] hover:text-[#059669] transition-all cursor-pointer flex items-center justify-center group active:scale-95"
            >
              <Bell className="w-4 h-4 text-[#475569] group-hover:text-[#059669] transition-colors" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-black border-2 border-white shadow-xs">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          </>
        )}
      </GlassPanel>
    </header>
  );
};
