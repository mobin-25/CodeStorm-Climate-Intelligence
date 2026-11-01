import React from "react";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "panel" | "control" | "heatwave";
}

/**
 * Premium frosted glass panel component with subtle blur, white borders, and soft shadows.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  variant = "panel",
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "control":
        return "glass-control rounded-[18px]";
      case "heatwave":
        return "glass-heatwave rounded-[20px]";
      case "panel":
      default:
        return "glass-panel rounded-[22px]";
    }
  };

  return (
    <div
      className={`transition-all duration-200 text-[#0F172A] ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
