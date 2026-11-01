/**
 * ClimateScope - Premium Environmental Intelligence Design System
 * Light glassmorphism, soft ambient environmental gradients & high-contrast typography.
 */

export const climateTheme = {
  brand: {
    name: "ClimateScope",
    subtitle: "Environmental Intelligence & Risk Analytics",
  },
  colors: {
    // Canvas & Surface
    canvasBase: "#F8FAFC",
    canvasBlueTint: "#EFF6FF",
    canvasMintTint: "#ECFDF5",

    // Panel & Card Surfaces
    panelBg: "rgba(255, 255, 255, 0.85)",
    panelBorder: "rgba(255, 255, 255, 0.8)",
    cardBg: "rgba(255, 255, 255, 0.9)",
    cardBorder: "rgba(226, 232, 240, 0.8)",

    // Typography (Dark, ultra-crisp slate)
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",

    // Environmental Color System
    emerald: "#059669", // Healthy conditions & primary accents
    skyBlue: "#0284C7", // Weather & water
    cyan: "#0891B2",    // Wind & atmospheric data
    amber: "#D97706",   // Warnings & heatwave alerts
    red: "#DC2626",     // Severe hazards & critical risks
    violet: "#7C3AED",  // Advanced analytics & models
  },
  gradients: {
    primaryAccent: "linear-gradient(135deg, #059669 0%, #0891B2 100%)",
    weather: "linear-gradient(135deg, #0284C7 0%, #0891B2 100%)",
    heatwave: "linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(255, 237, 213, 0.85) 100%)",
    selectedLayer: "linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(204, 251, 241, 0.8) 100%)",
  },
  glassmorphism: {
    panel: "backdrop-blur-[18px] bg-white/85 border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.08)] rounded-[22px]",
    control: "backdrop-blur-[16px] bg-white/85 border border-white/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)] rounded-[18px]",
    card: "backdrop-blur-[12px] bg-white/75 border border-slate-200/70 shadow-sm rounded-xl",
  },
} as const;

export type ClimateTheme = typeof climateTheme;
