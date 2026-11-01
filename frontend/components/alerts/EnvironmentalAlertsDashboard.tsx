"use client";

import React, { useState } from "react";
import { GlassPanel } from "@/components/shared";
import {
  EnvironmentalAlert,
  SeverityFilter,
  CategoryFilter,
  CityScopeFilter,
  ReadStatusFilter,
} from "@/types";
import { AlertCard } from "./AlertCard";
import { AlertFilters } from "./AlertFilters";
import {
  BellRing,
  CheckCheck,
  Trash2,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";

interface EnvironmentalAlertsDashboardProps {
  alerts: EnvironmentalAlert[];
  filteredAlerts: EnvironmentalAlert[];
  loading?: boolean;
  error?: string | null;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  activeCityName: string;
  unreadCount: number;
  severityFilter: SeverityFilter;
  onSeverityChange: (sev: SeverityFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  cityScope: CityScopeFilter;
  onCityScopeChange: (scope: CityScopeFilter) => void;
  readStatus: ReadStatusFilter;
  onReadStatusChange: (status: ReadStatusFilter) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearHistory: () => void;
  onResetAlerts: () => void;
  onRetry?: () => void;
}

export const EnvironmentalAlertsDashboard: React.FC<EnvironmentalAlertsDashboardProps> = ({
  alerts,
  filteredAlerts,
  loading = false,
  error = null,
  isDataUnavailable = false,
  apiContractNote,
  activeCityName,
  unreadCount,
  severityFilter,
  onSeverityChange,
  categoryFilter,
  onCategoryChange,
  cityScope,
  onCityScopeChange,
  readStatus,
  onReadStatusChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearHistory,
  onResetAlerts,
  onRetry,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-16 bg-slate-200 rounded-full" />
        </div>
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="space-y-3">
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
        </div>
      </GlassPanel>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#EF4444] font-semibold text-[13px]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Alert Feed Unavailable</span>
        </div>
        <p className="text-[12px] text-[#64748B]">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-[12px] font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </GlassPanel>
    );
  }

  // 3. Unavailable Data State for Unmonitored Dynamic Locations (Section 6)
  if (isDataUnavailable) {
    return (
      <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-[#059669]" />
                Environmental Alerts
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Notice
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">{activeCityName}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-[12px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Alert data unavailable</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Real-time hazard warning feeds (IMD, CPCB, NDMA) are not yet integrated for
            these coordinates. In strict adherence to safety and data integrity policies,
            simulated alerts are never presented as real-world emergency warnings.
          </p>
        </div>

        {apiContractNote && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Required Backend Contract:
            </span>
            <code className="text-[11px] text-[#059669] font-mono break-all font-semibold">
              {apiContractNote}
            </code>
          </div>
        )}
      </GlassPanel>
    );
  }

  return (
    <GlassPanel variant="panel" className="p-4 sm:p-5 space-y-3.5 max-w-full">
      {/* Header: Title, Unread Count & DEMO Badge */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-extrabold text-[#0F172A] flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-[#059669]" />
              Environmental Alerts
            </span>
            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
              DEMO Feed
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
            <span>Focus:</span>
            <strong className="text-[#0F172A]">{activeCityName}</strong>
            <span>•</span>
            <span className="text-[#059669] font-semibold">
              {unreadCount} unread
            </span>
          </div>
        </div>

        {/* Action Buttons: Mark All Read & Clear History */}
        <div className="flex items-center gap-1.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[11px] font-bold transition-all cursor-pointer"
              title="Mark all alerts as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span className="hidden sm:inline">Mark All</span>
            </button>
          )}

          {alerts.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-[#64748B] hover:text-[#EF4444] transition-all cursor-pointer"
              title="Clear notification history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetAlerts}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[11px] font-bold transition-all cursor-pointer"
              title="Reload demo alerts"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#059669]" />
              <span>Reload</span>
            </button>
          )}
        </div>
      </div>

      {/* Clear History Confirmation Modal / Banner */}
      {showClearConfirm && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[12px]">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear notification history?</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-tight">
            This will dismiss all current advisory items. You can reload demo fixtures anytime.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#475569] hover:bg-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClearHistory();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-xs transition-all cursor-pointer"
            >
              Confirm Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <AlertFilters
        severity={severityFilter}
        onSeverityChange={onSeverityChange}
        category={categoryFilter}
        onCategoryChange={onCategoryChange}
        cityScope={cityScope}
        onCityScopeChange={onCityScopeChange}
        readStatus={readStatus}
        onReadStatusChange={onReadStatusChange}
        selectedCityName={activeCityName}
      />

      {/* Active Alerts List */}
      <div className="space-y-2.5 pt-1">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        ) : (
          /* Empty State: Section 6 "No active alerts" */
          <div className="p-6 rounded-2xl bg-white/60 border border-slate-200/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto text-[#059669]">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-[13px] text-[#0F172A] block">
                No active alerts
              </span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                No environmental hazard advisories match the current filter criteria for {cityScope === "current" ? activeCityName : "monitored corridors"}.
              </p>
            </div>
            {alerts.length === 0 && (
              <button
                type="button"
                onClick={onResetAlerts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[11px] font-semibold transition-all cursor-pointer mt-1"
              >
                <RotateCcw className="w-3 h-3 text-[#059669]" />
                <span>Reload Demo Advisories</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer per Section 6 */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[10px] text-[#64748B] flex items-start gap-1.5">
        <Info className="w-3 h-3 text-[#059669] shrink-0 mt-0.5" />
        <span>
          <strong>Data Integrity Notice:</strong> Advisory cards shown here are simulated demo
          fixtures for interface validation. Official emergency alerts are issued directly by IMD and state disaster authorities.
        </span>
      </div>
    </GlassPanel>
  );
};
