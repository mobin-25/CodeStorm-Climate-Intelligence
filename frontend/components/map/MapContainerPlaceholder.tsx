"use client";

import React from "react";
import { Compass, Layers, Globe2 } from "lucide-react";
import { ClimateLayer } from "@/hooks";

interface MapContainerPlaceholderProps {
  activeLayer: ClimateLayer;
}

export const MapContainerPlaceholder: React.FC<MapContainerPlaceholderProps> = ({
  activeLayer,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#ECFDF5]">
      {/* Subtle Ambient Blurred Gradient Orbs (Cyan, Emerald, Sky Blue) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-200/35 blur-[90px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-emerald-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-sky-200/35 blur-[110px] pointer-events-none" />

      {/* Cartographic Vector Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(203, 213, 225, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }}
      />

      {/* Center Geographical Canvas Status Card */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full px-8 py-9 rounded-[24px] bg-white/85 border border-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-[20px]">
          {/* Logo Badge with Green -> Cyan Gradient */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#059669]/15 to-[#0891B2]/15 border border-[#059669]/30 flex items-center justify-center text-[#059669] shadow-xs">
            <Globe2 className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
            Geographical Canvas Initialized
          </h2>
          <p className="text-[14px] text-[#475569] mt-2 leading-relaxed font-normal">
            Prepared for interactive Leaflet &amp; React-Leaflet tile rendering across Indian metropolitan corridors.
          </p>
          <div className="mt-5 inline-flex items-center justify-center gap-2 text-[13px] text-[#059669] font-semibold bg-emerald-50/90 py-2.5 px-4 rounded-xl border border-emerald-200/80 shadow-2xs">
            <Layers className="w-4 h-4 text-[#059669]" />
            <span>Active Environmental Layer: <strong className="uppercase tracking-wide">{activeLayer}</strong></span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Scale / Geographic Coordinates Info */}
      <div className="absolute bottom-5 left-5 z-40 pointer-events-none flex items-center gap-2.5 text-[13px] text-[#475569] bg-white/90 backdrop-blur-[16px] px-4 py-2 rounded-[16px] border border-white/85 shadow-sm">
        <Compass className="w-4 h-4 text-[#059669]" />
        <span className="font-semibold text-[#0F172A]">India Subcontinent</span>
        <span className="text-[#94A3B8]">•</span>
        <span>21.76°N, 78.87°E</span>
      </div>
    </div>
  );
};
