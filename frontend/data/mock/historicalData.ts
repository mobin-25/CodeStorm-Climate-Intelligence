import {
  CityHistoricalTrendsData,
  TimeRangeOption,
  HistoricalDataPoint,
} from "@/types";

// Generates realistic labels for the 4 time ranges
function getLabelsForRange(range: TimeRangeOption): string[] {
  switch (range) {
    case "30d":
      return [
        "1 Oct", "4 Oct", "7 Oct", "10 Oct", "13 Oct",
        "16 Oct", "19 Oct", "22 Oct", "25 Oct", "28 Oct", "31 Oct"
      ];
    case "6m":
      return ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    case "1y":
      return [
        "Nov '25", "Dec", "Jan '26", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug", "Sep", "Oct"
      ];
    case "2y":
      return [
        "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25",
        "Q1 '26", "Q2 '26", "Q3 '26", "Q4 '26"
      ];
  }
}

interface CityBaseProfile {
  name: string;
  baseTemp: number; // Avg annual temp
  tempRange: number; // Seasonal variation
  baseRain: number; // Annual rain mm
  baseAqi: number; // Mean AQI
}

const CITY_PROFILES: Record<string, CityBaseProfile> = {
  delhi: { name: "New Delhi", baseTemp: 25.2, tempRange: 14.0, baseRain: 780, baseAqi: 245 },
  mumbai: { name: "Mumbai", baseTemp: 27.5, tempRange: 5.5, baseRain: 2400, baseAqi: 125 },
  pune: { name: "Pune", baseTemp: 24.8, tempRange: 8.0, baseRain: 840, baseAqi: 95 },
  bengaluru: { name: "Bengaluru", baseTemp: 23.8, tempRange: 4.5, baseRain: 970, baseAqi: 72 },
  hyderabad: { name: "Hyderabad", baseTemp: 26.5, tempRange: 9.0, baseRain: 890, baseAqi: 115 },
  chennai: { name: "Chennai", baseTemp: 28.5, tempRange: 5.0, baseRain: 1400, baseAqi: 88 },
  kolkata: { name: "Kolkata", baseTemp: 26.8, tempRange: 9.5, baseRain: 1750, baseAqi: 185 },
  ahmedabad: { name: "Ahmedabad", baseTemp: 27.2, tempRange: 12.0, baseRain: 820, baseAqi: 165 },
  jaipur: { name: "Jaipur", baseTemp: 25.8, tempRange: 13.5, baseRain: 650, baseAqi: 155 },
  lucknow: { name: "Lucknow", baseTemp: 25.4, tempRange: 13.0, baseRain: 990, baseAqi: 230 },
};

function generatePoints(cityId: string, range: TimeRangeOption): HistoricalDataPoint[] {
  const profile = CITY_PROFILES[cityId.toLowerCase()] || CITY_PROFILES.delhi;
  const labels = getLabelsForRange(range);
  const count = labels.length;

  return labels.map((label, idx) => {
    // Generate cyclical curve
    const cycle = Math.sin((idx / (count - 1)) * Math.PI * 2);
    const monsoonFactor = Math.sin((idx / (count - 1)) * Math.PI);

    const avgTemp = +(profile.baseTemp + cycle * (profile.tempRange / 2)).toFixed(1);
    const maxTemp = +(avgTemp + 5.5 + Math.random() * 1.5).toFixed(1);
    const minTemp = +(avgTemp - 5.5 - Math.random() * 1.5).toFixed(1);

    // Rainfall distribution
    const maxRainfallMonth = profile.baseRain / 4;
    const rainfallMm = +(
      Math.max(0, monsoonFactor * maxRainfallMonth * (0.6 + Math.random() * 0.8)) /
      (range === "30d" ? 8 : range === "6m" ? 1.5 : 1)
    ).toFixed(1);

    // AQI has inverse correlation with monsoon rainfall
    const aqiMultiplier = 1.2 - monsoonFactor * 0.5 + Math.random() * 0.15;
    const aqi = Math.round(profile.baseAqi * aqiMultiplier);
    const pm25 = +(aqi * 0.52).toFixed(1);
    const pm10 = +(aqi * 0.94).toFixed(1);

    return {
      timestamp: new Date(Date.now() - (count - 1 - idx) * 86400000 * (range === "30d" ? 3 : 30)).toISOString(),
      label,
      avgTemp,
      maxTemp,
      minTemp,
      rainfallMm,
      aqi,
      pm25,
      pm10,
    };
  });
}

export function buildHistoricalDataset(cityId: string, range: TimeRangeOption): CityHistoricalTrendsData {
  const profile = CITY_PROFILES[cityId.toLowerCase()] || CITY_PROFILES.delhi;
  const points = generatePoints(cityId, range);

  const totalRainfallMm = +points.reduce((acc, p) => acc + p.rainfallMm, 0).toFixed(1);
  const avgTemp = +(points.reduce((acc, p) => acc + p.avgTemp, 0) / points.length).toFixed(1);
  const maxTemp = Math.max(...points.map((p) => p.maxTemp));
  const minTemp = Math.min(...points.map((p) => p.minTemp));
  const avgAqi = Math.round(points.reduce((acc, p) => acc + p.aqi, 0) / points.length);

  return {
    cityId,
    cityName: profile.name,
    timestamp: new Date().toISOString(),
    dataSource: "India Meteorological Dept (IMD) & CPCB Historical Observation Network",
    timeRange: range,
    points,
    summary: {
      avgTemp,
      maxTemp,
      minTemp,
      tempChangePercent: range === "2y" ? 1.2 : range === "1y" ? 0.8 : -0.4,
      totalRainfallMm,
      rainfallAnomalyPercent: -3.8,
      avgAqi,
      aqiChangePercent: -5.4,
      trendDescription: `Observed historical climatology shows typical seasonal transitions with ${
        totalRainfallMm > 500 ? "heavy monsoonal accumulation" : "moderate cumulative precipitation"
      } and winter particulate concentration cycles.`,
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  };
}
