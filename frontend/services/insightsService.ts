import {
  CityInsightsData,
  EnvironmentalInsight,
  SmartRecommendation,
  InsightsQueryOptions,
} from "@/types";
import { getCurrentWeather } from "./weatherService";
import { getAirQuality } from "./airQualityService";
import { getClimateRisk } from "./riskService";
import { getSevenDayForecast } from "./forecastService";
import { getHistoricalTrends } from "./historicalService";
import { apiClient } from "./api";

/**
 * Service to derive deterministic, rule-based environmental insights & smart recommendations
 * from verifiable atmospheric and multihazard telemetry.
 * Prepared for future dedicated backend endpoint `/api/insights/${cityId}`.
 */
export async function getClimateInsights(
  query: string | InsightsQueryOptions
): Promise<CityInsightsData> {
  const options: InsightsQueryOptions =
    typeof query === "string" ? { cityId: query } : query;
  const { cityId, cityName, coordinates } = options;
  const normalizedId = cityId.toLowerCase();

  // 1. Prepared for real backend integration if activated
  if (process.env.NEXT_PUBLIC_USE_REAL_BACKEND === "true") {
    const res = await apiClient<CityInsightsData>(`/api/insights/${normalizedId}`);
    if (res.data) return res.data;
  }

  // 2. Concurrently fetch domain telemetry
  const [weatherRes, aqiRes, riskRes, forecastRes, histRes] = await Promise.allSettled([
    getCurrentWeather(options),
    getAirQuality(options),
    getClimateRisk(options),
    getSevenDayForecast(options),
    getHistoricalTrends(options, "30d"),
  ]);

  const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;
  const airQuality = aqiRes.status === "fulfilled" ? aqiRes.value : null;
  const riskData = riskRes.status === "fulfilled" ? riskRes.value : null;
  const forecast = forecastRes.status === "fulfilled" ? forecastRes.value : null;
  const historicalTrends = histRes.status === "fulfilled" ? histRes.value : null;

  // 3. Check data availability
  const isDataUnavailable =
    Boolean(weather?.isDataUnavailable) &&
    Boolean(airQuality?.isDataUnavailable) &&
    Boolean(riskData?.isDataUnavailable);

  if (isDataUnavailable) {
    return {
      cityId,
      cityName: cityName || "Selected Location",
      generatedAt: new Date().toISOString(),
      insights: [],
      recommendations: [],
      isDataUnavailable: true,
      apiContractNote: coordinates
        ? `GET /api/insights?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}`
        : `GET /api/insights/${cityId}`,
    };
  }

  const isSampleData =
    Boolean(weather?.isSampleData) ||
    Boolean(airQuality?.isSampleData) ||
    Boolean(riskData?.isSampleData);

  const sampleNote =
    weather?.sampleNote ||
    airQuality?.sampleNote ||
    riskData?.sampleNote ||
    (isSampleData ? "DEMO Baseline Corridors" : undefined);

  const insights: EnvironmentalInsight[] = [];
  const recommendations: SmartRecommendation[] = [];

  // ==========================================
  // A. Environmental Insights Generation (5 domains)
  // ==========================================

  // 1. Temperature Changes Insight
  if (weather && !weather.isDataUnavailable) {
    const temp = weather.temperatureCelsius;
    const feelsLike = weather.feelsLikeCelsius;
    const humidity = weather.humidityPercent;
    const delta = feelsLike - temp;

    if (temp >= 38) {
      insights.push({
        id: "ins-temp-extreme",
        category: "temperature",
        title: "Extreme Surface Heat & Thermal Stress",
        explanation: `Surface temperature has reached ${temp.toFixed(1)}°C with high solar insolation. Urban heat island effects significantly amplify radiant heat in built corridors.`,
        relatedMetric: { label: "Current Temperature", value: `${temp.toFixed(1)}°C`, status: "High Thermal Load" },
        severity: "critical",
        dataSource: weather.isSampleData ? "IMD Baseline Corridors (DEMO)" : "Central Telemetry Node",
        timestamp: weather.timestamp,
      });
    } else if (delta >= 3) {
      insights.push({
        id: "ins-temp-humidity",
        category: "temperature",
        title: "Moisture-Driven Thermal Amplification",
        explanation: `Atmospheric humidity at ${humidity}% is suppressing natural evaporative cooling, elevating apparent temperature by +${delta.toFixed(1)}°C above the measured ambient reading.`,
        relatedMetric: { label: "Apparent Feels Like", value: `${feelsLike.toFixed(1)}°C`, status: `+${delta.toFixed(1)}°C Index Shift` },
        severity: "moderate",
        dataSource: weather.isSampleData ? "Atmospheric Baseline (DEMO)" : "Automated Weather Station",
        timestamp: weather.timestamp,
      });
    } else {
      insights.push({
        id: "ins-temp-moderate",
        category: "temperature",
        title: "Moderate Climatological Temperature",
        explanation: `Surface temperature of ${temp.toFixed(1)}°C remains within standard seasonal comfort bands for this sub-region.`,
        relatedMetric: { label: "Ambient Temperature", value: `${temp.toFixed(1)}°C`, status: "Normal Range" },
        severity: "info",
        dataSource: weather.isSampleData ? "IMD Climatological Mean (DEMO)" : "Regional Telemetry",
        timestamp: weather.timestamp,
      });
    }
  }

  // 2. Air Quality Conditions Insight
  if (airQuality && !airQuality.isDataUnavailable) {
    const aqi = airQuality.aqi;
    const pm25 = airQuality.pollutants?.pm25?.value;
    const dominant = airQuality.dominantPollutant || "PM2.5";

    if (aqi >= 201) {
      insights.push({
        id: "ins-aqi-poor",
        category: "air_quality",
        title: "Elevated Particulate Matter & Smog Burden",
        explanation: `Air Quality Index is currently ${aqi} (${airQuality.category}). ${dominant} concentrations are exceeding National Ambient Air Quality Standards (NAAQS) thresholds, reducing atmospheric clearance.`,
        relatedMetric: { label: "Index AQI", value: aqi, unit: "AQI", status: airQuality.category },
        severity: aqi >= 300 ? "critical" : "high",
        dataSource: airQuality.isSampleData ? "CPCB CAAQMS Baseline (DEMO)" : "Continuous Air Station",
        timestamp: airQuality.timestamp,
      });
    } else if (aqi >= 101) {
      insights.push({
        id: "ins-aqi-moderate",
        category: "air_quality",
        title: "Moderate Particulate Loading",
        explanation: `Current AQI of ${aqi} reflects moderate ambient particulates. Sensitive cardiopulmonary demographics may experience mild discomfort during prolonged exertion.`,
        relatedMetric: { label: "Index AQI", value: aqi, unit: "AQI", status: "Moderate" },
        severity: "moderate",
        dataSource: airQuality.isSampleData ? "CPCB CAAQMS Baseline (DEMO)" : "Continuous Air Station",
        timestamp: airQuality.timestamp,
      });
    } else {
      insights.push({
        id: "ins-aqi-satisfactory",
        category: "air_quality",
        title: "Clean Atmospheric Ventilation",
        explanation: `Air quality is satisfactory (AQI ${aqi}) with PM2.5 concentrations (${pm25 ?? "--"} µg/m³) well within NAAQS 24-hour limits.`,
        relatedMetric: { label: "Index AQI", value: aqi, unit: "AQI", status: "Satisfactory" },
        severity: "info",
        dataSource: airQuality.isSampleData ? "CPCB CAAQMS Baseline (DEMO)" : "Continuous Air Station",
        timestamp: airQuality.timestamp,
      });
    }
  }

  // 3. Rainfall Patterns Insight
  if (forecast && !forecast.isDataUnavailable && forecast.rainfallRisk) {
    const rfRisk = forecast.rainfallRisk;
    const maxProb =
      forecast.days && forecast.days.length > 0
        ? Math.max(...forecast.days.map((d) => d.rainfallProbability))
        : rfRisk.score;
    const level = rfRisk.level;

    if (level === "High" || level === "Very High") {
      insights.push({
        id: "ins-rain-high",
        category: "rainfall",
        title: "Monsoon Surge & Urban Inundation Potential",
        explanation: `Precipitation risk is elevated (${maxProb}% probability). High-density storm runoff may overwhelm natural drainage channels in low-lying corridors.`,
        relatedMetric: { label: "Rainfall Risk Level", value: level, status: `${maxProb}% Precipitation Probability` },
        severity: "high",
        dataSource: forecast.isSampleData ? "Hydrological Model Baseline (DEMO)" : "IMD Radar Network",
        timestamp: forecast.timestamp,
      });
    } else if (maxProb >= 30) {
      insights.push({
        id: "ins-rain-moderate",
        category: "rainfall",
        title: "Scattered Precipitation Expected",
        explanation: `Convective cloud cover indicates a ${maxProb}% chance of intermittent showers over the forecast cycle. Runoff risk remains localized.`,
        relatedMetric: { label: "Rainfall Probability", value: `${maxProb}%`, status: "Scattered Showers" },
        severity: "info",
        dataSource: forecast.isSampleData ? "Forecast Engine (DEMO)" : "Doppler Radar",
        timestamp: forecast.timestamp,
      });
    } else {
      insights.push({
        id: "ins-rain-dry",
        category: "rainfall",
        title: "Stable Dry Hydrological Conditions",
        explanation: `Low precipitation probability (<20%) across the active window. Normal dry-weather municipal drainage operations prevail.`,
        relatedMetric: { label: "Precipitation Probability", value: `${maxProb}%`, status: "Dry Weather" },
        severity: "info",
        dataSource: forecast.isSampleData ? "Forecast Engine (DEMO)" : "Doppler Radar",
        timestamp: forecast.timestamp,
      });
    }
  } else if (historicalTrends && !historicalTrends.isDataUnavailable && historicalTrends.summary) {
    const rfAnomaly = historicalTrends.summary.rainfallAnomalyPercent;
    insights.push({
      id: "ins-rain-hist",
      category: "rainfall",
      title: "Cumulative Precipitation Pattern",
      explanation: `Historical 30-day precipitation shows a ${rfAnomaly >= 0 ? "+" : ""}${rfAnomaly.toFixed(1)}% departure from the seasonal climatological normal.`,
      relatedMetric: { label: "30-Day Total Rainfall", value: `${historicalTrends.summary.totalRainfallMm.toFixed(1)} mm`, status: `${rfAnomaly >= 0 ? "+" : ""}${rfAnomaly.toFixed(1)}% Anomaly` },
      severity: Math.abs(rfAnomaly) > 20 ? "moderate" : "info",
      dataSource: historicalTrends.dataSource,
      timestamp: historicalTrends.timestamp,
    });
  }

  // 4. Climate Risk Levels Insight
  if (riskData && !riskData.isDataUnavailable) {
    const overall = riskData.overallScore;
    const cat = riskData.overallCategory;
    const heatwaveScore = riskData.categories?.heatwave?.score || 0;
    const floodScore = riskData.categories?.flood?.score || 0;
    const droughtScore = riskData.categories?.drought?.score || 0;

    // Find highest individual threat
    let dominantHazard = "General Hazard";
    let dominantScore = heatwaveScore;
    if (floodScore > dominantScore) { dominantHazard = "Flood Runoff"; dominantScore = floodScore; }
    if (droughtScore > dominantScore) { dominantHazard = "Water Deficit"; dominantScore = droughtScore; }
    if (heatwaveScore >= floodScore && heatwaveScore >= droughtScore) { dominantHazard = "Thermal Heatwave"; dominantScore = heatwaveScore; }

    insights.push({
      id: "ins-risk-composite",
      category: "climate_risk",
      title: `Composite Vulnerability: ${cat} Exposure`,
      explanation: `Municipal multihazard composite index stands at ${overall}/100. Primary hazard driver is ${dominantHazard} (Risk Index: ${dominantScore}/100).`,
      relatedMetric: { label: "Composite Risk Index", value: `${overall}/100`, status: cat },
      severity: overall >= 70 ? "high" : overall >= 40 ? "moderate" : "info",
      dataSource: riskData.isSampleData ? "IPCC Vulnerability Matrix (DEMO)" : "National Disaster Risk Registry",
      timestamp: riskData.timestamp,
    });
  }

  // 5. Unusual Environmental Changes Insight
  if (weather && !weather.isDataUnavailable && airQuality && !airQuality.isDataUnavailable) {
    const windSpeed = weather.windSpeedKmh;
    const aqi = airQuality.aqi;
    const humidity = weather.humidityPercent;

    if (windSpeed < 10 && aqi > 180) {
      insights.push({
        id: "ins-unusual-inversion",
        category: "unusual_change",
        title: "Boundary-Layer Stagnation & Particulate Trapping",
        explanation: `Surface wind velocity has dropped to ${windSpeed.toFixed(1)} km/h under stable atmospheric boundary conditions. Stagnant airflow is preventing vertical dispersion, trapping vehicular and industrial particulates close to ground level.`,
        relatedMetric: { label: "Wind Dispersion Rate", value: `${windSpeed.toFixed(1)} km/h`, status: "Atmospheric Trapping Active" },
        severity: "high",
        dataSource: "Meteorological Sentinel",
        timestamp: weather.timestamp,
        isUnusualChange: true,
      });
    } else if (humidity > 75 && weather.temperatureCelsius > 31) {
      insights.push({
        id: "ins-unusual-wetbulb",
        category: "unusual_change",
        title: "Co-occurring High Moisture & Thermal Spike",
        explanation: `Rare co-occurrence of high relative humidity (${humidity}%) alongside elevated temperature (${weather.temperatureCelsius.toFixed(1)}°C) creates elevated Wet-Bulb Globe Temperature (WBGT) stress.`,
        relatedMetric: { label: "Heat & Humidity Coupling", value: `${weather.temperatureCelsius.toFixed(1)}°C / ${humidity}%`, status: "High Thermal Index" },
        severity: "moderate",
        dataSource: "Climatological Sensor Matrix",
        timestamp: weather.timestamp,
        isUnusualChange: true,
      });
    } else {
      insights.push({
        id: "ins-unusual-equilibrium",
        category: "unusual_change",
        title: "Atmospheric Equilibrium Maintained",
        explanation: `No sudden anomalous pressure drops, temperature inversions, or wind shear events detected over the active 24-hour monitoring cycle.`,
        relatedMetric: { label: "Barometric Stability", value: `${weather.pressureHpa} hPa`, status: "Equilibrium" },
        severity: "info",
        dataSource: "Telemetry Sentinel",
        timestamp: weather.timestamp,
        isUnusualChange: true,
      });
    }
  }

  // ==========================================
  // B. Smart Recommendations Generation (Profile-Mapped)
  // ==========================================

  const aqi = airQuality?.aqi ?? 0;
  const temp = weather?.temperatureCelsius ?? 25;
  const rainLevel = forecast?.rainfallRisk?.level || "Low";

  // Recommendation 1: Air Quality Action
  if (aqi >= 201) {
    recommendations.push({
      id: "rec-aqi-high",
      title: "Reduce Prolonged Outdoor Strenuous Activities",
      description: "Ambient particulate matter is significantly elevated. Minimize prolonged cardiovascular exertion outdoors. Keep residential and workspace windows closed during morning thermal inversion peaks.",
      category: "air_quality",
      urgency: aqi >= 300 ? "urgent" : "advisory",
      targetProfiles: ["all", "general", "children", "elderly", "asthma", "outdoor_workers"],
      triggerCondition: `AQI exceeds 200 (Current: ${aqi})`,
      icon: "wind",
    });

    recommendations.push({
      id: "rec-aqi-asthma",
      title: "Prescribed Respiratory Protection & HEPA Filtration",
      description: "Asthma-sensitive individuals and young children should ensure quick-relief inhalers are accessible. Run certified HEPA indoor air filtration where feasible and consider well-fitted particulate masks (N95/FFP2) when commuting.",
      category: "air_quality",
      urgency: "urgent",
      targetProfiles: ["children", "asthma", "elderly"],
      triggerCondition: "High fine particulate matter PM2.5 loading",
      icon: "activity",
    });

    recommendations.push({
      id: "rec-aqi-workers",
      title: "Work-Rest Rotation & Dust Suppression",
      description: "For outdoor site personnel, implement scheduled indoor rest rotations every 60–90 minutes. Mandate particulate protective masks and avoid active dry-sweeping on construction corridors.",
      category: "air_quality",
      urgency: "advisory",
      targetProfiles: ["outdoor_workers"],
      triggerCondition: "Sustained high ambient particulate density",
      icon: "shield-alert",
    });
  } else if (aqi >= 101) {
    recommendations.push({
      id: "rec-aqi-moderate",
      title: "Moderate Outdoor Exertion for Sensitive Demographics",
      description: "Air quality is acceptable for the general public, but unusually sensitive individuals (especially children with asthma) should take frequent indoor breaks during athletic training.",
      category: "air_quality",
      urgency: "advisory",
      targetProfiles: ["children", "asthma", "elderly"],
      triggerCondition: `AQI in Moderate category (Current: ${aqi})`,
      icon: "wind",
    });
  } else {
    recommendations.push({
      id: "rec-aqi-good",
      title: "Optimal Ventilation & Outdoor Conditioning",
      description: "Air quality is within healthy NAAQS guidelines. Ideal window for residential cross-ventilation, school sports activities, and outdoor athletic conditioning.",
      category: "air_quality",
      urgency: "routine",
      targetProfiles: ["all", "general", "children", "outdoor_workers"],
      triggerCondition: "AQI within Good/Satisfactory boundary (<100)",
      icon: "wind",
    });
  }

  // Recommendation 2: Thermal Management Action
  if (temp >= 35) {
    recommendations.push({
      id: "rec-temp-heat",
      title: "Active Hydration & Afternoon Direct Sun Avoidance",
      description: "Surface temperatures are high. Ensure continuous hydration (water, electrolyte replenishment) and avoid direct unprotected solar exposure between 11:30 AM and 3:30 PM.",
      category: "temperature",
      urgency: temp >= 40 ? "urgent" : "advisory",
      targetProfiles: ["all", "general", "children", "elderly", "outdoor_workers"],
      triggerCondition: `Temperature exceeds 35°C (Current: ${temp.toFixed(1)}°C)`,
      icon: "thermometer",
    });

    recommendations.push({
      id: "rec-temp-workers",
      title: "Mandatory Wet-Bulb Rest Cycles & Electrolyte Access",
      description: "Ensure shaded rest canopies with active airflow are provided on-site. Schedule strenuous manual lifting during early morning shifts prior to solar noon.",
      category: "temperature",
      urgency: "urgent",
      targetProfiles: ["outdoor_workers"],
      triggerCondition: "High radiant heat & WBGT threshold",
      icon: "shield-alert",
    });

    recommendations.push({
      id: "rec-temp-elderly",
      title: "Thermal Regulation & Caregiver Check-ins",
      description: "Seniors and individuals with cardiovascular histories should remain in air-cooled or shaded environments. Check in on elderly family members twice daily during heat spikes.",
      category: "temperature",
      urgency: "advisory",
      targetProfiles: ["elderly"],
      triggerCondition: "Elevated apparent temperature",
      icon: "activity",
    });
  } else if (temp < 15) {
    recommendations.push({
      id: "rec-temp-cool",
      title: "Thermal Layering for Morning Commutes",
      description: "Early morning surface temperatures are low. Layer clothing to prevent sudden bronchospasms in sensitive populations during pre-dawn hours.",
      category: "temperature",
      urgency: "routine",
      targetProfiles: ["children", "elderly", "asthma"],
      triggerCondition: "Sub-15°C temperature threshold",
      icon: "thermometer",
    });
  }

  // Recommendation 3: Rainfall / Storm Advisory
  if (rainLevel === "High" || rainLevel === "Very High") {
    recommendations.push({
      id: "rec-rain-warning",
      title: "Monitor Official Weather Directives & Route Low-Lying Underpasses",
      description: "Substantial precipitation and runoff surge predicted. Avoid parking or transit through known urban flood underpasses and keep emergency lighting accessible.",
      category: "rainfall",
      urgency: "urgent",
      targetProfiles: ["all", "general", "outdoor_workers"],
      triggerCondition: `Rainfall hazard level: ${rainLevel}`,
      icon: "droplets",
    });
  }

  // Recommendation 4: General Environmental Stewardship
  recommendations.push({
    id: "rec-general-stewardship",
    title: "Eco-Conscious Commuting & Energy Conservation",
    description: "Support municipal clean-air initiatives by consolidating motorized trips, utilizing metro corridors where accessible, and minimizing non-essential combustion.",
    category: "general",
    urgency: "routine",
    targetProfiles: ["general", "all"],
    triggerCondition: "Standard Environmental Baseline",
    icon: "activity",
  });

  return {
    cityId,
    cityName: cityName || (weather?.cityName || "Selected City"),
    state: weather?.cityId,
    generatedAt: new Date().toISOString(),
    insights,
    recommendations,
    isSampleData,
    sampleNote,
    isDataUnavailable: false,
  };
}
