import {
  EnvironmentalReportData,
  GeocodedLocation,
  ReportType,
  ReportDateRange,
  TimeRangeOption,
} from "@/types";
import { getCurrentWeather } from "./weatherService";
import { getAirQuality } from "./airQualityService";
import { getClimateRisk } from "./riskService";
import { getHistoricalTrends } from "./historicalService";
import { getEnvironmentalAlerts } from "./alertsService";

/**
 * Fetch and assemble all domain telemetry required for an official environmental report.
 */
export async function fetchReportData(
  city: GeocodedLocation,
  reportType: ReportType,
  dateRange: ReportDateRange
): Promise<EnvironmentalReportData> {
  const query = {
    cityId: city.id,
    cityName: city.name,
    coordinates: city.coordinates,
  };

  // Map report date range to historical service time range option
  const historicalRangeMap: Record<ReportDateRange, TimeRangeOption> = {
    "7d": "30d",
    "30d": "30d",
    "6m": "6m",
    "1y": "1y",
  };
  const mappedRange = historicalRangeMap[dateRange];

  try {
    const [weatherRes, aqiRes, riskRes, histRes, alertsRes] = await Promise.allSettled([
      getCurrentWeather(query),
      getAirQuality(query),
      getClimateRisk(query),
      getHistoricalTrends(query, mappedRange),
      getEnvironmentalAlerts(query),
    ]);

    const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;
    const airQuality = aqiRes.status === "fulfilled" ? aqiRes.value : null;
    const riskData = riskRes.status === "fulfilled" ? riskRes.value : null;
    const historicalTrends = histRes.status === "fulfilled" ? histRes.value : null;
    const alerts = alertsRes.status === "fulfilled" ? alertsRes.value.alerts || [] : [];

    const isDataUnavailable =
      Boolean(weather?.isDataUnavailable) &&
      Boolean(airQuality?.isDataUnavailable) &&
      Boolean(riskData?.isDataUnavailable);

    const isSampleData =
      Boolean(weather?.isSampleData) ||
      Boolean(airQuality?.isSampleData) ||
      Boolean(riskData?.isSampleData);

    const sampleNote =
      weather?.sampleNote ||
      airQuality?.sampleNote ||
      riskData?.sampleNote ||
      (isSampleData ? "DEMO Baseline Corridors" : undefined);

    const apiContractNote =
      weather?.apiContractNote ||
      airQuality?.apiContractNote ||
      riskData?.apiContractNote;

    return {
      city,
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange,
      weather,
      airQuality,
      riskData,
      historicalTrends,
      alerts,
      loading: false,
      error: null,
      isSampleData,
      isDataUnavailable,
      sampleNote,
      apiContractNote,
    };
  } catch (err) {
    return {
      city,
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange,
      weather: null,
      airQuality: null,
      riskData: null,
      historicalTrends: null,
      alerts: [],
      loading: false,
      error: err instanceof Error ? err.message : "Failed to generate report",
      isDataUnavailable: true,
    };
  }
}

/**
 * Helper to safely escape CSV cell contents per RFC 4180
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Export report data as a structured, audit-ready CSV file.
 * Strictly adheres to data integrity rules:
 * - Never exports unavailable values as zero.
 * - Clearly labels DEMO data.
 * - Includes units, timestamps and data sources.
 */
export function exportReportToCSV(report: EnvironmentalReportData): void {
  const { city, generatedAt, reportType, dateRange, weather, airQuality, riskData, historicalTrends, alerts } = report;

  const rows: string[][] = [];

  // 1. Metadata Block
  rows.push(["ClimateScope Environmental Intelligence & Risk Analytics Report"]);
  rows.push(["Report Type", reportType.toUpperCase()]);
  rows.push(["Target Location", `${city.name}, ${city.state || "India"}`]);
  rows.push(["Geographical Coordinates", city.coordinates ? `Lat: ${city.coordinates.lat}, Lng: ${city.coordinates.lng}` : "N/A"]);
  rows.push(["Report Generated At", new Date(generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"]);
  rows.push(["Time Range Scope", dateRange]);
  rows.push(["Data Classification", report.isSampleData ? "DEMO Baseline Corridors" : "Live / Verified Sensors"]);
  if (report.sampleNote) {
    rows.push(["Classification Note", report.sampleNote]);
  }
  rows.push([]); // blank line separator

  // 2. CSV Table Column Header
  rows.push([
    "Domain",
    "Parameter / Indicator",
    "Value",
    "Unit",
    "Classification / Severity",
    "Standard Limit / Benchmark",
    "Timestamp / Interval",
    "Data Source / Integrity Note",
  ]);

  // A. Weather Section (if complete or weather)
  if (reportType === "complete" || reportType === "weather") {
    const isWUnavailable = !weather || weather.isDataUnavailable;
    const wSource = isWUnavailable ? "Sensor Unavailable" : (weather.isSampleData ? "DEMO Atmospheric Baseline" : "Live AWS Telemetry");

    rows.push([
      "Weather",
      "Temperature",
      isWUnavailable ? "Data Unavailable" : String(weather.temperatureCelsius.toFixed(1)),
      "°C",
      isWUnavailable ? "N/A" : (weather.condition?.label || "Normal"),
      "IMD Ambient Comfort Range",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
    rows.push([
      "Weather",
      "Feels Like Temperature",
      isWUnavailable ? "Data Unavailable" : String(weather.feelsLikeCelsius.toFixed(1)),
      "°C",
      "Thermal Perception",
      "Apparent Temperature",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
    rows.push([
      "Weather",
      "Relative Humidity",
      isWUnavailable ? "Data Unavailable" : String(weather.humidityPercent),
      "%",
      isWUnavailable ? "N/A" : (weather.humidityPercent > 70 ? "Humid" : "Normal"),
      "30% - 60% Optimum",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
    rows.push([
      "Weather",
      "Wind Speed",
      isWUnavailable ? "Data Unavailable" : String(weather.windSpeedKmh.toFixed(1)),
      "km/h",
      isWUnavailable ? "N/A" : `Direction: ${weather.windDirectionLabel} (${weather.windDirectionDeg}°)`,
      "Beaufort Scale",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
    rows.push([
      "Weather",
      "Atmospheric Pressure",
      isWUnavailable ? "Data Unavailable" : String(weather.pressureHpa),
      "hPa",
      "Sea-level Normalized",
      "1013.25 hPa Standard",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
    rows.push([
      "Weather",
      "UV Radiation Index",
      isWUnavailable ? "Data Unavailable" : String(weather.uvIndex),
      "Index (0-11+)",
      isWUnavailable ? "N/A" : (weather.uvIndex >= 8 ? "Very High" : "Moderate"),
      "WHO UV Index",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
    rows.push([
      "Weather",
      "Horizontal Visibility",
      isWUnavailable ? "Data Unavailable" : String(weather.visibilityKm.toFixed(1)),
      "km",
      "Optical Clearance",
      "> 5 km Good Visibility",
      weather?.timestamp || generatedAt,
      wSource,
    ]);
  }

  // B. Air Quality Section (if complete or air_quality)
  if (reportType === "complete" || reportType === "air_quality") {
    const isAUnavailable = !airQuality || airQuality.isDataUnavailable;
    const aSource = isAUnavailable ? "Sensor Unavailable" : (airQuality.isSampleData ? "DEMO CPCB Baseline" : "Live CAAQMS Network");

    rows.push([
      "Air Quality",
      "National AQI Index",
      isAUnavailable ? "Data Unavailable" : String(airQuality.aqi),
      "Index (0-500)",
      isAUnavailable ? "N/A" : airQuality.category,
      "CPCB / NAAQS Standard (0-50 Good)",
      airQuality?.timestamp || generatedAt,
      aSource,
    ]);

    const p = airQuality?.pollutants;
    if (p) {
      if (p.pm25) {
        rows.push([
          "Air Quality",
          "PM2.5 (Fine Particulate)",
          isAUnavailable ? "Data Unavailable" : String(p.pm25.value.toFixed(1)),
          p.pm25.unit,
          p.pm25.status.toUpperCase(),
          `Standard Limit: ${p.pm25.standardLimit} ${p.pm25.unit}`,
          airQuality.timestamp,
          aSource,
        ]);
      }
      if (p.pm10) {
        rows.push([
          "Air Quality",
          "PM10 (Coarse Particulate)",
          isAUnavailable ? "Data Unavailable" : String(p.pm10.value.toFixed(1)),
          p.pm10.unit,
          p.pm10.status.toUpperCase(),
          `Standard Limit: ${p.pm10.standardLimit} ${p.pm10.unit}`,
          airQuality.timestamp,
          aSource,
        ]);
      }
      if (p.no2) {
        rows.push([
          "Air Quality",
          "NO2 (Nitrogen Dioxide)",
          isAUnavailable ? "Data Unavailable" : String(p.no2.value.toFixed(1)),
          p.no2.unit,
          p.no2.status.toUpperCase(),
          `Standard Limit: ${p.no2.standardLimit} ${p.no2.unit}`,
          airQuality.timestamp,
          aSource,
        ]);
      }
      if (p.so2) {
        rows.push([
          "Air Quality",
          "SO2 (Sulfur Dioxide)",
          isAUnavailable ? "Data Unavailable" : String(p.so2.value.toFixed(1)),
          p.so2.unit,
          p.so2.status.toUpperCase(),
          `Standard Limit: ${p.so2.standardLimit} ${p.so2.unit}`,
          airQuality.timestamp,
          aSource,
        ]);
      }
      if (p.co) {
        rows.push([
          "Air Quality",
          "CO (Carbon Monoxide)",
          isAUnavailable ? "Data Unavailable" : String(p.co.value.toFixed(1)),
          p.co.unit,
          p.co.status.toUpperCase(),
          `Standard Limit: ${p.co.standardLimit} ${p.co.unit}`,
          airQuality.timestamp,
          aSource,
        ]);
      }
      if (p.o3) {
        rows.push([
          "Air Quality",
          "O3 (Surface Ozone)",
          isAUnavailable ? "Data Unavailable" : String(p.o3.value.toFixed(1)),
          p.o3.unit,
          p.o3.status.toUpperCase(),
          `Standard Limit: ${p.o3.standardLimit} ${p.o3.unit}`,
          airQuality.timestamp,
          aSource,
        ]);
      }
    }
    if (airQuality?.healthAdvisory) {
      rows.push([
        "Air Quality",
        "Official Health Advisory",
        airQuality.healthAdvisory,
        "Text",
        "Advisory",
        "MoHFW / CPCB Guidelines",
        airQuality.timestamp,
        aSource,
      ]);
    }
  }

  // C. Climate Risk Section (if complete or climate_risk)
  if (reportType === "complete" || reportType === "climate_risk") {
    const isRUnavailable = !riskData || riskData.isDataUnavailable;
    const rSource = isRUnavailable ? "Model Awaiting Calibration" : (riskData.isSampleData ? "DEMO Risk Analytics Baseline" : "Calibrated Risk Model");

    rows.push([
      "Climate Risk",
      "Composite Risk Score",
      isRUnavailable ? "Data Unavailable" : String(riskData.overallScore),
      "/100",
      isRUnavailable ? "N/A" : riskData.overallCategory,
      "NDMA / IPCC Vulnerability Index",
      riskData?.timestamp || generatedAt,
      rSource,
    ]);

    if (riskData?.categories) {
      const c = riskData.categories;
      rows.push([
        "Climate Risk",
        "Heatwave Hazard Vulnerability",
        isRUnavailable ? "Data Unavailable" : String(c.heatwave.score),
        "/100",
        isRUnavailable ? "N/A" : c.heatwave.category,
        "Urban Heat Island & Surface Temp Thresholds",
        riskData.timestamp,
        rSource,
      ]);
      rows.push([
        "Climate Risk",
        "Flood Inundation Vulnerability",
        isRUnavailable ? "Data Unavailable" : String(c.flood.score),
        "/100",
        isRUnavailable ? "N/A" : c.flood.category,
        "Hydrological Runoff Surge Thresholds",
        riskData.timestamp,
        rSource,
      ]);
      rows.push([
        "Climate Risk",
        "Drought & Water Stress Vulnerability",
        isRUnavailable ? "Data Unavailable" : String(c.drought.score),
        "/100",
        isRUnavailable ? "N/A" : c.drought.category,
        "Groundwater Depletion & Basin Deficit",
        riskData.timestamp,
        rSource,
      ]);
    }
  }

  // D. Historical Observations Summary (if complete)
  if (historicalTrends && !historicalTrends.isDataUnavailable && historicalTrends.summary) {
    const s = historicalTrends.summary;
    rows.push([
      "Historical Trends",
      `Average Temperature (${dateRange})`,
      String(s.avgTemp.toFixed(1)),
      "°C",
      `Trend: ${s.tempChangePercent >= 0 ? "+" : ""}${s.tempChangePercent.toFixed(1)}%`,
      "Climate Normal Anomaly Baseline",
      historicalTrends.timestamp,
      historicalTrends.dataSource,
    ]);
    rows.push([
      "Historical Trends",
      `Cumulative Rainfall (${dateRange})`,
      String(s.totalRainfallMm.toFixed(1)),
      "mm",
      `Anomaly: ${s.rainfallAnomalyPercent >= 0 ? "+" : ""}${s.rainfallAnomalyPercent.toFixed(1)}%`,
      "Monsoon / Seasonal Normal",
      historicalTrends.timestamp,
      historicalTrends.dataSource,
    ]);
    rows.push([
      "Historical Trends",
      `Mean AQI (${dateRange})`,
      String(Math.round(s.avgAqi)),
      "Index",
      `Change: ${s.aqiChangePercent >= 0 ? "+" : ""}${s.aqiChangePercent.toFixed(1)}%`,
      "Historical Ambient Mean",
      historicalTrends.timestamp,
      historicalTrends.dataSource,
    ]);
  }

  // E. Environmental Alerts Section
  if (alerts && alerts.length > 0) {
    alerts.forEach((alert, idx) => {
      rows.push([
        "Environmental Alerts",
        `Active Alert #${idx + 1}: ${alert.title}`,
        alert.description,
        "Advisory",
        alert.severity,
        `Category: ${alert.category}`,
        alert.dateTime || generatedAt,
        alert.source || (alert.isDemo ? "DEMO Baseline Alert" : "Official Hazard Authority"),
      ]);
    });
  } else {
    rows.push([
      "Environmental Alerts",
      "Active Hazards",
      "0 active alerts",
      "Count",
      "Normal",
      "No critical advisories in effect",
      generatedAt,
      "Official Alert Monitor",
    ]);
  }

  // Convert array of rows to CSV string
  const csvContent = rows
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  // Create downloadable Blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `ClimateScope_Report_${city.name.replace(/\s+/g, "_")}_${reportType}_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers the browser's native print engine with professional A4 print styling.
 */
export function printReportToPDF(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
