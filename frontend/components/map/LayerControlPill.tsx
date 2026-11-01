"use client";

import React from "react";
import { GlassPanel } from "@/components/shared";
import { Thermometer, Wind, CloudRain, Flame, Activity, Check } from "lucide-react";
import { ClimateLayer } from "@/hooks";

interface LayerControlPillProps {
  activeLayer: ClimateLayer;
  onLayerChange: (layer: ClimateLayer) => void;
}

interface LayerItem {
  id: ClimateLayer;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}

export const LayerControlPill: React.FC<LayerControlPillProps> = ({
  activeLayer,
  onLayerChange,
}) => {
  const layers: LayerItem[] = [
    {
      id: "temperature",
      label: "Temperature Surface",
      description: "Thermal distribution & heat gradients",
      icon: <Thermometer className="w-[24px] h-[24px]" />,
      iconColor: "#D97706",
    },
    {
      id: "wind",
      label: "Wind Flow Particles",
      description: "Atmospheric currents & vector speeds",
      icon: <Wind className="w-[24px] h-[24px]" />,
      iconColor: "#0891B2",
    },
    {
      id: "aqi",
      label: "Air Quality (AQI)",
      description: "PM2.5, PM10 & particulate smog",
      icon: <Activity className="w-[24px] h-[24px]" />,
      iconColor: "#059669",
    },
    {
      id: "heatwave",
      label: "Heatwave Risk Thresholds",
      description: "Extreme surface thermal hazards",
      icon: <Flame className="w-[24px] h-[24px]" />,
      iconColor: "#DC2626",
    },
    {
      id: "precipitation",
      label: "Precipitation & Rain Radar",
      description: "Live Doppler cloud & rain coverage",
      icon: <CloudRain className="w-[24px] h-[24px]" />,
      iconColor: "#0284C7",
    },
  ];

  return (
    <aside className="absolute right-4 sm:right-5 top-24 bottom-28 z-40 w-[350px] max-w-[calc(100vw-2.5rem)] pointer-events-none flex flex-col">
      <GlassPanel variant="panel" className="p-4 sm:p-5 flex flex-col gap-3.5 shadow-xl max-h-full overflow-hidden pointer-events-auto">
        {/* Panel Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 shrink-0">
          <div>
            <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
              Climate Layers
            </h2>
            <p className="text-[15px] text-[#64748B] font-normal mt-0.5">
              Select environmental overlay visualization
            </p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200/80">
            Interactive
          </span>
        </div>

        {/* Layer Selection Items */}
        <div className="flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1">
          {layers.map((layer) => {
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => onLayerChange(layer.id)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-[16px] text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-emerald-50/80 border-2 border-[#059669] shadow-sm"
                    : "bg-white/85 hover:bg-emerald-50/30 border border-slate-200/80 hover:border-emerald-300/70"
                }`}
              >
                {/* 22-24px Icon Container */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                    isActive
                      ? "bg-emerald-100/90 text-[#059669] border border-emerald-300/80"
                      : "bg-slate-50 text-[#475569] border border-slate-200/70"
                  }`}
                  style={{ color: isActive ? layer.iconColor : undefined }}
                >
                  {layer.icon}
                </div>

                {/* Layer Name & Supporting Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[16px] font-semibold text-[#0F172A] leading-snug">
                      {layer.label}
                    </span>
                    {isActive && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#059669] text-white shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-[#475569] font-normal leading-normal mt-0.5">
                    {layer.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </GlassPanel>
    </aside>
  );
};
