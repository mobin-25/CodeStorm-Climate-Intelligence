"use client";

import React from "react";
import {
  Users,
  User,
  Baby,
  HeartHandshake,
  Activity,
  HardHat,
} from "lucide-react";
import { ProfileFilter } from "@/types";

interface ProfileFilterSelectorProps {
  activeProfile: ProfileFilter;
  onSelectProfile: (profile: ProfileFilter) => void;
  className?: string;
}

export const ProfileFilterSelector: React.FC<ProfileFilterSelectorProps> = ({
  activeProfile,
  onSelectProfile,
  className = "",
}) => {
  const profiles: Array<{ id: ProfileFilter; label: string; icon: React.ReactNode; desc: string }> = [
    {
      id: "all",
      label: "All Profiles",
      icon: <Users className="w-3.5 h-3.5" />,
      desc: "Comprehensive view of all population safeguards",
    },
    {
      id: "general",
      label: "General Public",
      icon: <User className="w-3.5 h-3.5" />,
      desc: "Baseline environmental precautions",
    },
    {
      id: "children",
      label: "Children",
      icon: <Baby className="w-3.5 h-3.5" />,
      desc: "Heightened respiratory and thermal vulnerability",
    },
    {
      id: "elderly",
      label: "Elderly",
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      desc: "Cardiorespiratory and hydration management",
    },
    {
      id: "asthma",
      label: "Asthma-Sensitive",
      icon: <Activity className="w-3.5 h-3.5" />,
      desc: "Airway hyper-reactivity & particulate triggers",
    },
    {
      id: "outdoor_workers",
      label: "Outdoor Workers",
      icon: <HardHat className="w-3.5 h-3.5" />,
      desc: "Direct heat exposure & WBGT rest cycles",
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#059669]" />
          <span>Health &amp; Demographic Profile Filter</span>
        </label>
        <span className="text-[10px] text-slate-500 font-medium">
          Tailors actionable precautions
        </span>
      </div>

      {/* Profile Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {profiles.map((p) => {
          const isActive = activeProfile === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProfile(p.id)}
              title={p.desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r from-[#059669] to-[#0891B2] text-white shadow-xs"
                  : "bg-white/90 hover:bg-emerald-50 text-[#475569] hover:text-[#059669] border border-slate-200"
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

