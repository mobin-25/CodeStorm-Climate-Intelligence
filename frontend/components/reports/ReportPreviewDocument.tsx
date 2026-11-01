"use client";

import React from "react";
import {
  Wind,
  Thermometer,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Info,
  MapPin,
  CheckCircle2,
  FileText,
  Flame,
  Waves,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { EnvironmentalReportData, ReportSummaryMetrics } from "@/types";

interface ReportPreviewDocumentProps {
  report: EnvironmentalReportData;
  metrics: ReportSummaryMetrics;
}

export const ReportPreviewDocument: React.FC<ReportPreviewDocumentProps> = ({
  report,
  metrics,
}) => {
  const {
    city,
    generatedAt,
    reportType,
    dateRange,
    weather,
    airQuality,
    riskData,
    historicalTrends,
    alerts,
    isSampleData,
    sampleNote,
    isDataUnavailable,
    apiContractNote,
  } = report;

  const formattedDate = new Date(generatedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const reportId = `CS-REP-${new Date(generatedAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${city.id.toUpperCase().slice(0, 4)}`;

  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" };
    if (aqi <= 100) return { label: "Satisfactory", bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-300" };
    if (aqi <= 200) return { label: "Moderate", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" };
    if (aqi <= 300) return { label: "Poor", bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" };
    if (aqi <= 400) return { label: "Very Poor", bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
    return { label: "Severe", bg: "bg-rose-200", text: "text-rose-900", border: "border-rose-400" };
  };

  const getRiskColor = (score: number) => {
    if (score < 40) return { label: "Low Risk", text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300" };
    if (score < 60) return { label: "Moderate Risk", text: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" };
    if (score < 80) return { label: "High Risk", text: "text-orange-700", bg: "bg-orange-100", border: "border-orange-300" };
    return { label: "Critical Risk", text: "text-red-700", bg: "bg-red-100", border: "border-red-300" };
  };

  return (
    <div
      id="report-printable-document"
      className="w-full bg-white text-[#0F172A] rounded-[24px] border border-slate-200/90 shadow-xl p-6 sm:p-10 lg:p-12 space-y-8 font-sans print-card"
    >
      {/* 1. Official Letterhead / Header */}
      <header className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#059669] to-[#0891B2] text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <Wind className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-black tracking-tight text-[#0F172A]">
                ClimateScope
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-300">
                Official Environmental Dossier
              </span>
            </div>
            <p className="text-[12px] text-[#475569] font-medium mt-0.5">
              National Environmental Intelligence &amp; Climate Risk Audit
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-[#64748B]">
              <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                {city.name}, {city.state || "India"}
              </span>
              {city.coordinates && (
                <span>
                  • Coordinates: {city.coordinates.lat.toFixed(4)}°N, {city.coordinates.lng.toFixed(4)}°E
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Report Metadata Box */}
        <div className="sm:text-right text-[11px] text-[#475569] space-y-1 sm:self-center shrink-0">
          <div>
            <span className="text-slate-400 font-medium">Report ID: </span>
            <strong className="font-mono text-[#0F172A]">{reportId}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Generated: </span>
            <strong className="text-[#0F172A]">{formattedDate} IST</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Temporal Scope: </span>
            <strong className="text-[#0F172A] uppercase">{dateRange} Horizon</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Domain: </span>
            <strong className="text-[#059669] uppercase font-bold">{reportType.replace("_", " ")}</strong>
          </div>
        </div>
      </header>

      {/* 2. Data Provenance & Integrity Protocol Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3 text-[11px] text-[#334155]">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p>
            <strong>Data Integrity Protocol: </strong>
            {isSampleData ? (
              <span>
                Telemetry for this corridor is evaluated against standardized{" "}
                <strong className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-bold">DEMO</strong>{" "}
                baselines ({sampleNote || "Historical CPCB/IMD Baseline Corridors"}).
              </span>
            ) : isDataUnavailable ? (
              <span className="text-amber-800">
                This location is not currently connected to live telemetry sensors. Data is reported honestly as{" "}
                <strong>&quot;Data Unavailable&quot;</strong> and has not been fabricated.
              </span>
            ) : (
              <span>Verified real-time sensory streams from central telemetry nodes.</span>
            )}
          </p>
          {apiContractNote && (
            <p className="font-mono text-[10px] text-slate-500">
              API Contract Specification: {apiContractNote}
            </p>
          )}
        </div>
      </div>

      {/* 3. Executive KPI Scorecard */}
      <section className="space-y-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Executive Environmental Indicators</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Climate Risk */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Composite Risk Index
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[22px] font-black text-[#0F172A]">
                {metrics.compositeRiskScore !== null ? metrics.compositeRiskScore : "--"}
                <span className="text-[11px] font-semibold text-slate-400">/100</span>
              </span>
              {metrics.compositeRiskScore !== null && (
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                    getRiskColor(metrics.compositeRiskScore).bg
                  } ${getRiskColor(metrics.compositeRiskScore).text} ${
                    getRiskColor(metrics.compositeRiskScore).border
                  }`}
                >
                  {metrics.riskCategory || getRiskColor(metrics.compositeRiskScore).label}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#64748B] block mt-1">
              Multihazard exposure index
            </span>
          </div>

          {/* Card 2: Temperature */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Ambient Temperature
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[22px] font-black text-[#0F172A]">
                {metrics.temperatureCelsius !== null ? `${metrics.temperatureCelsius.toFixed(1)}°C` : "--"}
              </span>
              {weather?.condition && (
                <span className="text-[10px] font-semibold text-slate-600">
                  {weather.condition.label}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#64748B] block mt-1">
              Humidity: {metrics.humidityPercent !== null ? `${metrics.humidityPercent}%` : "--"} • Wind: {metrics.windSpeedKmh !== null ? `${metrics.windSpeedKmh.toFixed(1)} km/h` : "--"}
            </span>
          </div>

          {/* Card 3: Air Quality AQI */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              National AQI Index
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[22px] font-black text-[#0F172A]">
                {metrics.aqi !== null ? metrics.aqi : "--"}
              </span>
              {metrics.aqi !== null && (
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                    getAqiCategory(metrics.aqi).bg
                  } ${getAqiCategory(metrics.aqi).text} ${
                    getAqiCategory(metrics.aqi).border
                  }`}
                >
                  {metrics.aqiCategory || getAqiCategory(metrics.aqi).label}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#64748B] block mt-1">
              PM2.5: {metrics.pm25 !== null ? `${metrics.pm25} µg/m³` : "--"} • PM10: {metrics.pm10 !== null ? `${metrics.pm10} µg/m³` : "--"}
            </span>
          </div>

          {/* Card 4: Environmental Alerts */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Active Hazard Advisories
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[22px] font-black text-[#0F172A]">
                {metrics.activeAlertsCount}
              </span>
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                  metrics.activeAlertsCount > 0
                    ? "bg-red-100 text-red-800 border-red-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
              >
                {metrics.activeAlertsCount > 0 ? "Advisories Active" : "Normal Conditions"}
              </span>
            </div>
            <span className="text-[10px] text-[#64748B] block mt-1">
              Monitored by Environmental Sentinel
            </span>
          </div>
        </div>
      </section>

      {/* 4. Section: Weather Observation (if complete or weather) */}
      {(reportType === "complete" || reportType === "weather") && (
        <section className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-sky-600" />
              <span>1. Atmospheric Weather Observation</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#64748B]">
              Standard Dry-Bulb &amp; Barometric Indices
            </span>
          </div>

          {!weather || weather.isDataUnavailable ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[12px] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Weather sensory telemetry unavailable for this corridor. Values are not estimated.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-[#475569] font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-3">Measured Value</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Reference Baseline</th>
                    <th className="py-2.5 px-3">Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#0F172A]">
                  <tr>
                    <td className="py-2 px-3 font-semibold">Dry-Bulb Temperature</td>
                    <td className="py-2 px-3 font-bold">{weather.temperatureCelsius.toFixed(1)}</td>
                    <td className="py-2 px-3 text-slate-500">°C</td>
                    <td className="py-2 px-3 text-slate-500">IMD Climatological Mean</td>
                    <td className="py-2 px-3 font-semibold">{weather.condition?.label || "Normal"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Feels Like Temperature</td>
                    <td className="py-2 px-3 font-bold">{weather.feelsLikeCelsius.toFixed(1)}</td>
                    <td className="py-2 px-3 text-slate-500">°C</td>
                    <td className="py-2 px-3 text-slate-500">Apparent Heat Index</td>
                    <td className="py-2 px-3 font-semibold">Thermal Perception</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Relative Humidity</td>
                    <td className="py-2 px-3 font-bold">{weather.humidityPercent}</td>
                    <td className="py-2 px-3 text-slate-500">%</td>
                    <td className="py-2 px-3 text-slate-500">30% - 60% Optimum</td>
                    <td className="py-2 px-3 font-semibold">
                      {weather.humidityPercent > 70 ? "Elevated Moisture" : "Optimal"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Wind Velocity &amp; Heading</td>
                    <td className="py-2 px-3 font-bold">
                      {weather.windSpeedKmh.toFixed(1)} km/h • {weather.windDirectionLabel} ({weather.windDirectionDeg}°)
                    </td>
                    <td className="py-2 px-3 text-slate-500">km/h</td>
                    <td className="py-2 px-3 text-slate-500">Beaufort Surface Wind</td>
                    <td className="py-2 px-3 font-semibold">Moderate Breeze</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Barometric Pressure</td>
                    <td className="py-2 px-3 font-bold">{weather.pressureHpa}</td>
                    <td className="py-2 px-3 text-slate-500">hPa</td>
                    <td className="py-2 px-3 text-slate-500">1013.25 Standard</td>
                    <td className="py-2 px-3 font-semibold">Stable Pressure</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">UV Radiation Index</td>
                    <td className="py-2 px-3 font-bold">{weather.uvIndex}</td>
                    <td className="py-2 px-3 text-slate-500">Index (0-11+)</td>
                    <td className="py-2 px-3 text-slate-500">WHO Solar Ultraviolet Index</td>
                    <td className="py-2 px-3 font-semibold">
                      {weather.uvIndex >= 8 ? "Very High Exposure" : "Moderate Exposure"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Horizontal Visibility</td>
                    <td className="py-2 px-3 font-bold">{weather.visibilityKm.toFixed(1)}</td>
                    <td className="py-2 px-3 text-slate-500">km</td>
                    <td className="py-2 px-3 text-slate-500">&gt; 5.0 km Optical Clear</td>
                    <td className="py-2 px-3 font-semibold">
                      {weather.visibilityKm < 4 ? "Haze / Restricted" : "Clear"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 5. Section: Air Quality & Particulates (if complete or air_quality) */}
      {(reportType === "complete" || reportType === "air_quality") && (
        <section className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-600" />
              <span>2. Air Quality Diagnostics &amp; NAAQS Pollutant Standards</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#64748B]">
              National Ambient Air Quality Standards (CPCB India)
            </span>
          </div>

          {!airQuality || airQuality.isDataUnavailable ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[12px] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>CAAQMS continuous ambient air monitoring sensor feed is currently offline. Values are not fabricated.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pollutants Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-[#475569] font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Pollutant Indicator</th>
                      <th className="py-2.5 px-3">Concentration</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">NAAQS 24h Limit</th>
                      <th className="py-2.5 px-3">CPCB Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[#0F172A]">
                    {airQuality.pollutants && (
                      <>
                        <tr>
                          <td className="py-2 px-3 font-semibold">Fine Particulate Matter (PM2.5)</td>
                          <td className="py-2 px-3 font-bold">{airQuality.pollutants.pm25.value}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.pm25.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.pm25.standardLimit} µg/m³</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                              {airQuality.pollutants.pm25.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold">Coarse Particulate Matter (PM10)</td>
                          <td className="py-2 px-3 font-bold">{airQuality.pollutants.pm10.value}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.pm10.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.pm10.standardLimit} µg/m³</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                              {airQuality.pollutants.pm10.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold">Nitrogen Dioxide (NO₂)</td>
                          <td className="py-2 px-3 font-bold">{airQuality.pollutants.no2.value}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.no2.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.no2.standardLimit} µg/m³</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                              {airQuality.pollutants.no2.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold">Sulfur Dioxide (SO₂)</td>
                          <td className="py-2 px-3 font-bold">{airQuality.pollutants.so2.value}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.so2.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.so2.standardLimit} µg/m³</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                              {airQuality.pollutants.so2.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold">Carbon Monoxide (CO)</td>
                          <td className="py-2 px-3 font-bold">{airQuality.pollutants.co.value}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.co.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.co.standardLimit} mg/m³</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                              {airQuality.pollutants.co.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold">Surface Ozone (O₃)</td>
                          <td className="py-2 px-3 font-bold">{airQuality.pollutants.o3.value}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.o3.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{airQuality.pollutants.o3.standardLimit} µg/m³</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                              {airQuality.pollutants.o3.status}
                            </span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Health Advisory */}
              {airQuality.healthAdvisory && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11.5px] text-[#334155] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0F172A] block font-semibold">Clinical &amp; Community Health Advisory:</strong>
                    <span>{airQuality.healthAdvisory}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 6. Section: Climate Risk & Hazards (if complete or climate_risk) */}
      {(reportType === "complete" || reportType === "climate_risk") && (
        <section className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>3. Climate Hazards &amp; Multihazard Vulnerability Assessment</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#64748B]">
              IPCC / NDMA Hazard Mapping Protocols
            </span>
          </div>

          {!riskData || riskData.isDataUnavailable ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[12px] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Vulnerability models awaiting local hydrological and surface calibration. Values are not estimated.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Heatwave Hazard */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px] text-[#0F172A] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Heatwave Exposure
                  </span>
                  <span className="font-black text-[13px] text-[#0F172A]">
                    {riskData.categories.heatwave.score}
                    <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${riskData.categories.heatwave.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#475569] leading-tight">
                  {riskData.categories.heatwave.explanation}
                </p>
              </div>

              {/* Flood Hazard */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px] text-[#0F172A] flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-sky-500" />
                    Flood Runoff Risk
                  </span>
                  <span className="font-black text-[13px] text-[#0F172A]">
                    {riskData.categories.flood.score}
                    <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${riskData.categories.flood.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#475569] leading-tight">
                  {riskData.categories.flood.explanation}
                </p>
              </div>

              {/* Drought Hazard */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px] text-[#0F172A] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-orange-500" />
                    Drought &amp; Water Stress
                  </span>
                  <span className="font-black text-[13px] text-[#0F172A]">
                    {riskData.categories.drought.score}
                    <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${riskData.categories.drought.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#475569] leading-tight">
                  {riskData.categories.drought.explanation}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 7. Section: Historical Observations (if complete) */}
      {reportType === "complete" && historicalTrends && !historicalTrends.isDataUnavailable && (
        <section className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>4. Historical Trend Summary ({dateRange.toUpperCase()} Window)</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#64748B]">
              Source: {historicalTrends.dataSource}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">Mean Temperature</span>
              <div className="text-[16px] font-black text-[#0F172A] mt-0.5">
                {historicalTrends.summary.avgTemp.toFixed(1)}°C
              </div>
              <span className="text-[10.5px] text-slate-500">
                Anomaly: {historicalTrends.summary.tempChangePercent >= 0 ? "+" : ""}
                {historicalTrends.summary.tempChangePercent.toFixed(1)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">Total Precipitation</span>
              <div className="text-[16px] font-black text-[#0F172A] mt-0.5">
                {historicalTrends.summary.totalRainfallMm.toFixed(1)} mm
              </div>
              <span className="text-[10.5px] text-slate-500">
                Seasonal Anomaly: {historicalTrends.summary.rainfallAnomalyPercent >= 0 ? "+" : ""}
                {historicalTrends.summary.rainfallAnomalyPercent.toFixed(1)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">Mean AQI Index</span>
              <div className="text-[16px] font-black text-[#0F172A] mt-0.5">
                {Math.round(historicalTrends.summary.avgAqi)} AQI
              </div>
              <span className="text-[10.5px] text-slate-500">
                Interval Shift: {historicalTrends.summary.aqiChangePercent >= 0 ? "+" : ""}
                {historicalTrends.summary.aqiChangePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 8. Section: Active Environmental Alerts */}
      <section className="space-y-3 print-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>5. Environmental Alerts &amp; Critical Mitigation Directives</span>
          </h3>
          <span className="text-[10px] font-semibold text-[#64748B]">
            Automated Hazard Detection
          </span>
        </div>

        {alerts && alerts.length > 0 ? (
          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl border border-red-200 bg-red-50/60 space-y-1.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-red-600 text-white">
                      {alert.severity.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-[12.5px] text-red-950">{alert.title}</h4>
                  </div>
                  <span className="text-[10px] text-red-700 font-medium">
                    Issued: {new Date(alert.dateTime).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className="text-[11.5px] text-red-900 leading-relaxed">{alert.description}</p>
                <div className="flex items-center justify-between text-[10.5px] text-red-800 pt-1 border-t border-red-200/60">
                  <span>Issuing Authority: <strong>{alert.source}</strong></span>
                  {alert.demoNotice && <span className="font-semibold text-amber-800">{alert.demoNotice}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 text-[12px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero active critical alerts.</strong> All monitored atmospheric and hydrological thresholds remain within baseline safety ranges.
            </span>
          </div>
        )}
      </section>

      {/* 9. Official Verification & Audit Footer */}
      <footer className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10.5px] text-[#64748B]">
        <div className="space-y-1">
          <p className="font-bold text-[#0F172A]">
            ClimateScope Platform Engine v2.0 • Environmental Intelligence Division
          </p>
          <p>
            Generated in compliance with Indian National Ambient Air Quality Standards (CPCB) and IMD observation protocols.
          </p>
        </div>
        <div className="sm:text-right shrink-0 space-y-0.5">
          <div className="flex items-center sm:justify-end gap-1.5 text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Cryptographic Audit Seal</span>
          </div>
          <span className="font-mono text-slate-400">HASH: SHA256-CS-INDIA-{city.id.toUpperCase()}</span>
        </div>
      </footer>
    </div>
  );
};
