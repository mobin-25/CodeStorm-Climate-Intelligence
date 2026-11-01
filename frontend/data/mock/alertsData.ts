import { EnvironmentalAlert } from "@/types";

/**
 * Standardized DEMO fixtures for UI testing and notification simulation.
 * In strict compliance with data integrity policies, all demo items are
 * explicitly flagged with isDemo: true and simulated advisory notices.
 */
export const MOCK_ENVIRONMENTAL_ALERTS: EnvironmentalAlert[] = [
  // 1. Delhi - Poor Air Quality (Critical)
  {
    id: "alert-del-01",
    title: "Severe Winter Smog & Particulate Accumulation",
    category: "poor_air_quality",
    severity: "Critical",
    cityId: "delhi",
    cityName: "New Delhi",
    state: "Delhi NCR",
    description:
      "Severe atmospheric inversion with PM2.5 concentrations exceeding 380 µg/m³. GRAP Stage-IV emergency protocols simulated.",
    dateTime: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    source: "Central Pollution Control Board (CPCB)",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    isRead: false,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 2. Mumbai - Heavy Rainfall (High)
  {
    id: "alert-mum-01",
    title: "High-Intensity Coastal Downpour & High Tide Alert",
    category: "heavy_rainfall",
    severity: "High",
    cityId: "mumbai",
    cityName: "Mumbai",
    state: "Maharashtra",
    description:
      "Active offshore monsoon trough expected to deliver 120-160 mm localized precipitation co-occurring with 4.5m spring tide.",
    dateTime: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hrs ago
    source: "India Meteorological Department (IMD)",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: false,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 3. Ahmedabad - Heatwave (Critical)
  {
    id: "alert-ahm-01",
    title: "Extreme Surface Heatwave & Red Thermal Threshold",
    category: "heatwave",
    severity: "Critical",
    cityId: "ahmedabad",
    cityName: "Ahmedabad",
    state: "Gujarat",
    description:
      "Daytime maximum surface temperatures projected to breach 44.5°C across semi-arid plains. High risk of thermal stress.",
    dateTime: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    source: "National Disaster Management Authority (NDMA) & IMD",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 4. Kolkata - Flood Risk (High)
  {
    id: "alert-kol-01",
    title: "Hooghly Tidal Surge & Urban Waterlogging Advisory",
    category: "flood_risk",
    severity: "High",
    cityId: "kolkata",
    cityName: "Kolkata",
    state: "West Bengal",
    description:
      "Heavy runoff upstream combined with Bay of Bengal tidal surge increases drainage lock in low-lying municipal sectors.",
    dateTime: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    source: "Central Water Commission (CWC)",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isRead: false,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 5. Jaipur - Drought (Moderate)
  {
    id: "alert-jai-01",
    title: "Soil Moisture Deficit & Agro-Drought Watch",
    category: "drought",
    severity: "Moderate",
    cityId: "jaipur",
    cityName: "Jaipur",
    state: "Rajasthan",
    description:
      "Consecutive 6-week precipitation deficit causing shallow aquifer depletion and root-zone soil dryness.",
    dateTime: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    source: "National Drought Mitigation Center & IMD",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isRead: true,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 6. Chennai - Extreme Weather (High)
  {
    id: "alert-che-01",
    title: "Squall Line & Gale-Force Coastal Wind Warning",
    category: "extreme_weather",
    severity: "High",
    cityId: "chennai",
    cityName: "Chennai",
    state: "Tamil Nadu",
    description:
      "Deep atmospheric convective depression off the Coromandel coast triggering wind gusts up to 68 km/h.",
    dateTime: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    source: "Regional Meteorological Centre (RMC Chennai)",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: false,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 7. Bengaluru - Poor Air Quality (Low)
  {
    id: "alert-blr-01",
    title: "Minor Particulate Elevation in Commercial Corridors",
    category: "poor_air_quality",
    severity: "Low",
    cityId: "bengaluru",
    cityName: "Bengaluru",
    state: "Karnataka",
    description:
      "Localized vehicular stagnation causing moderate PM10 spikes along Outer Ring Road during peak transit hours.",
    dateTime: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    source: "Karnataka State Pollution Control Board (KSPCB)",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    isRead: true,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 8. Pune - Heatwave (Moderate)
  {
    id: "alert-pun-01",
    title: "Midday Thermal Index Surge in Urban Valley",
    category: "heatwave",
    severity: "Moderate",
    cityId: "pune",
    cityName: "Pune",
    state: "Maharashtra",
    description:
      "Afternoon temperatures reaching 38.5°C in urban core with elevated UV index. Hydration advisory active.",
    dateTime: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    source: "India Meteorological Department (IMD)",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    isRead: true,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 9. Hyderabad - Extreme Weather (Moderate)
  {
    id: "alert-hyd-01",
    title: "Isolated Thunderstorm & Lightning Hazard",
    category: "extreme_weather",
    severity: "Moderate",
    cityId: "hyderabad",
    cityName: "Hyderabad",
    state: "Telangana",
    description:
      "Localized convective cells developing with risk of frequent cloud-to-ground lightning in northern suburbs.",
    dateTime: new Date(Date.now() - 1000 * 60 * 750).toISOString(),
    source: "Telangana State Disaster Management Authority",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    isRead: false,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
  // 10. Lucknow - Heavy Rainfall (Moderate)
  {
    id: "alert-luc-01",
    title: "Monsoon Inundation Along Gomti Basin",
    category: "heavy_rainfall",
    severity: "Moderate",
    cityId: "lucknow",
    cityName: "Lucknow",
    state: "Uttar Pradesh",
    description:
      "Moderate to heavy continuous rains recorded over 12 hours. Gomti river embankments being continuously monitored.",
    dateTime: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    source: "Uttar Pradesh State Disaster Management Authority",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    isRead: true,
    isDemo: true,
    demoNotice: "SIMULATED TEST ADVISORY — Not an actual emergency warning",
  },
];
