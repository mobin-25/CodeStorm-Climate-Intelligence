"use client";

import React from "react";
import {
  Lightbulb,
  ShieldCheck,
  Thermometer,
  Wind,
  Droplets,
  ShieldAlert,
  Activity,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { SmartRecommendation, ProfileFilter } from "@/types";

interface SmartRecommendationsPanelProps {
  recommendations: SmartRecommendation[];
  activeProfile: ProfileFilter;
  className?: string;
}

export const SmartRecommendationsPanel: React.FC<SmartRecommendationsPanelProps> = ({
  recommendations,
  activeProfile,
  className = "",
}) => {
  const getRecIcon = (iconName: string) => {
    switch (iconName) {
      case "thermometer":
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      case "wind":
        return <Wind className="w-4 h-4 text-emerald-600" />;
      case "droplets":
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case "shield-alert":
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case "activity":
      default:
        return <Activity className="w-4 h-4 text-purple-600" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return {
          label: "Urgent Action",
          style: "bg-red-100 text-red-800 border-red-300",
        };
      case "advisory":
        return {
          label: "Recommended Advisory",
          style: "bg-amber-100 text-amber-800 border-amber-300",
        };
      case "routine":
      default:
        return {
          label: "Routine Guidance",
          style: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header with Distinction from Alerts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[14px] text-[#0F172A] leading-tight">
              Smart Environmental Recommendations
            </h3>
            <span className="text-[10px] text-[#64748B] font-medium block">
              Automated telemetry guidance • Distinct from official regulatory alerts
            </span>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#475569] self-start sm:self-auto border border-slate-200">
          {recommendations.length} {recommendations.length === 1 ? "Action" : "Actions"} Available
        </span>
      </div>

      {/* Non-Medical Disclaimer Banner */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-2.5 text-[11px] text-[#475569]">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0F172A]">Public Health Disclaimer: </strong>
          These practical precautions are derived algorithmically from ambient telemetry thresholds for general guidance. They do not constitute personalized medical advice. Individuals with chronic cardiorespiratory conditions should consult qualified physicians.
        </p>
      </div>

      {/* Recommendation Cards Grid */}
      {recommendations.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/80 border border-slate-200 text-center space-y-1">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-[13px] text-[#0F172A]">
            No Special Actions Required
          </h4>
          <p className="text-[11.5px] text-[#64748B]">
            All ambient indicators for the selected profile ({activeProfile}) are within nominal baseline safety levels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.map((rec) => {
            const urgency = getUrgencyBadge(rec.urgency);

            return (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {getRecIcon(rec.icon)}
                    </div>
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${urgency.style}`}
                    >
                      {urgency.label}
                    </span>
                  </div>

                  <span className="text-[9.5px] font-mono text-slate-400 font-semibold">
                    {rec.category.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-[#0F172A] leading-tight">
                    {rec.title}
                  </h4>
                  <p className="text-[11.5px] text-[#475569] leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                {/* Trigger Condition Pill */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10.5px] flex items-center justify-between text-[#64748B]">
                  <span className="flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span>Basis: {rec.triggerCondition}</span>
                  </span>
                </div>

                {/* Profile Relevance Tags */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap text-[9.5px]">
                  <span className="text-[#64748B] font-semibold">Profiles:</span>
                  {rec.targetProfiles.map((tp) => (
                    <span
                      key={tp}
                      className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize"
                    >
                      {tp.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

