"use client";

import React, { useState } from "react";
import { GlassPanel } from "@/components/shared";
import { EnvironmentalAlert } from "@/types";
import { AlertCard } from "./AlertCard";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: EnvironmentalAlert[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearHistory: () => void;
  onResetAlerts: () => void;
}

type DrawerTab = "all" | "unread" | "critical";

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearHistory,
  onResetAlerts,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  // Filter alerts by drawer tab
  const displayedAlerts = alerts.filter((a) => {
    if (activeTab === "unread") return !a.isRead;
    if (activeTab === "critical") return a.severity === "Critical" || a.severity === "High";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[420px] max-h-[90vh] flex flex-col pointer-events-auto">
        <GlassPanel
          variant="panel"
          className="flex flex-col h-full overflow-hidden shadow-2xl border border-white/90 p-0"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/70">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#059669] to-[#0891B2] text-white shadow-sm">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-black border-2 border-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-extrabold text-[15px] text-[#0F172A] tracking-tight">
                  Notification Centre
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  {unreadCount} unread environmental {unreadCount === 1 ? "advisory" : "advisories"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[11px] font-bold transition-all cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="hidden sm:inline">Mark All</span>
                </button>
              )}

              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear notification history"
                  className="p-2 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-rose-50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                title="Close notification panel"
                className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Inline Clear Confirmation */}
          {showClearConfirm && (
            <div className="m-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[12px]">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear all notification history?</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-tight">
                Are you sure you want to dismiss all alerts? You can reload test fixtures anytime.
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

          {/* Quick Drawer Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-[#059669] shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                activeTab === "unread"
                  ? "bg-white text-[#059669] shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("critical")}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                activeTab === "critical"
                  ? "bg-white text-[#EF4444] shadow-2xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Critical / High
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {displayedAlerts.length > 0 ? (
              displayedAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={onMarkAsRead}
                  compact
                />
              ))
            ) : (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto text-[#059669]">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-[13px] text-[#0F172A]">
                    No active notifications
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5 max-w-[220px] mx-auto">
                    {activeTab === "unread"
                      ? "All environmental alerts have been marked as read."
                      : "No current advisories in this view."}
                  </p>
                </div>
                {alerts.length === 0 && (
                  <button
                    type="button"
                    onClick={onResetAlerts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[11px] font-semibold transition-all cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Reload Demo Advisories</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-white/60 text-[10px] text-[#94A3B8] flex items-center justify-between">
            <span>ClimateScope Notification Engine</span>
            <span>Real-time Simulated Alerts</span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
