import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimateScope - Environmental Intelligence & Risk Analytics",
  description:
    "Environmental Intelligence & Risk Analytics: real-time weather observation, air quality index, environmental hazard forecasting, and climate analytics for Indian cities.",
  keywords: [
    "ClimateScope",
    "climate intelligence",
    "environmental risk",
    "air quality India",
    "weather forecast",
    "heatwave risk",
    "flood risk",
    "emissions",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full w-full">
      <body className="min-h-full w-full bg-[#FFFFFF] text-[#172033] antialiased">
        {children}
      </body>
    </html>
  );
}
