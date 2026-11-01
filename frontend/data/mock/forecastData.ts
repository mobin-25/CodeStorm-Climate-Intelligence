import { SevenDayForecastData, ForecastDay, RainfallRiskCategory } from "@/types";

function generateDates(count: number = 7) {
  const days: { date: string; dayLabel: string; fullDateLabel: string }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = i === 0 ? "Today" : dayNames[d.getDay()];
    const fullDateLabel = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    days.push({ date: dateStr, dayLabel, fullDateLabel });
  }
  return days;
}

const DATES = generateDates(7);

function makeDays(
  profiles: {
    max: number;
    min: number;
    cond: { code: string; label: string; icon: string };
    pop: number;
    rain: number;
  }[]
): ForecastDay[] {
  return profiles.map((p, idx) => ({
    date: DATES[idx].date,
    dayLabel: DATES[idx].dayLabel,
    fullDateLabel: DATES[idx].fullDateLabel,
    maxTempCelsius: p.max,
    minTempCelsius: p.min,
    condition: p.cond,
    rainfallProbability: p.pop,
    expectedRainfallMm: p.rain,
  }));
}

export const MOCK_SEVEN_DAY_FORECASTS: Record<string, SevenDayForecastData> = {
  delhi: {
    cityId: "delhi",
    cityName: "New Delhi",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 31.0, min: 18.5, cond: { code: "hazy", label: "Hazy Sunshine", icon: "SunMedium" }, pop: 10, rain: 0 },
      { max: 30.5, min: 17.8, cond: { code: "clear", label: "Clear & Mild", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 29.8, min: 17.2, cond: { code: "partly_cloudy", label: "Partly Cloudy", icon: "CloudSun" }, pop: 15, rain: 0.2 },
      { max: 29.0, min: 16.5, cond: { code: "mild_breeze", label: "Dry Breeze", icon: "Wind" }, pop: 10, rain: 0 },
      { max: 28.5, min: 16.0, cond: { code: "shallow_fog", label: "Morning Mist", icon: "CloudFog" }, pop: 20, rain: 0.5 },
      { max: 28.0, min: 15.8, cond: { code: "clear", label: "Sunny", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 27.8, min: 15.2, cond: { code: "clear", label: "Crisp Sun", icon: "Sun" }, pop: 5, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 12,
      explanation: "Stable post-monsoon dry air masses dominate the northern plains. Minimal precipitation expected.",
      totalWeeklyRainfallMm: 0.7,
      peakDay: "Day 5",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  mumbai: {
    cityId: "mumbai",
    cityName: "Mumbai",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 33.5, min: 25.2, cond: { code: "humid_sun", label: "Humid & Bright", icon: "SunMedium" }, pop: 25, rain: 1.2 },
      { max: 34.0, min: 25.8, cond: { code: "coastal_breeze", label: "Sea Breeze", icon: "CloudSun" }, pop: 30, rain: 2.0 },
      { max: 33.2, min: 24.9, cond: { code: "isolated_shower", label: "Coastal Shower", icon: "CloudDrizzle" }, pop: 45, rain: 5.4 },
      { max: 32.8, min: 24.5, cond: { code: "passing_clouds", label: "Passing Clouds", icon: "CloudSun" }, pop: 35, rain: 3.1 },
      { max: 33.0, min: 24.8, cond: { code: "humid", label: "Humid Warmth", icon: "SunMedium" }, pop: 20, rain: 0.8 },
      { max: 33.6, min: 25.0, cond: { code: "clear", label: "Sunny Skies", icon: "Sun" }, pop: 15, rain: 0.2 },
      { max: 34.2, min: 25.5, cond: { code: "sunny", label: "Hot & Humid", icon: "SunMedium" }, pop: 10, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Moderate",
      score: 38,
      explanation: "Isolated Arabian Sea convective showers possible along coastal corridors with moderate humidity.",
      totalWeeklyRainfallMm: 12.7,
      peakDay: "Day 3",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  pune: {
    cityId: "pune",
    cityName: "Pune",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 30.2, min: 17.5, cond: { code: "pleasant", label: "Pleasant Sunshine", icon: "SunMedium" }, pop: 15, rain: 0.4 },
      { max: 30.8, min: 18.0, cond: { code: "partly_cloudy", label: "Passing Clouds", icon: "CloudSun" }, pop: 20, rain: 0.8 },
      { max: 29.5, min: 17.2, cond: { code: "light_drizzle", label: "Brief Afternoon Drizzle", icon: "CloudDrizzle" }, pop: 40, rain: 3.2 },
      { max: 29.0, min: 16.8, cond: { code: "clear", label: "Cool Evening", icon: "Sun" }, pop: 20, rain: 0.5 },
      { max: 29.8, min: 16.5, cond: { code: "clear", label: "Sunny & Mild", icon: "Sun" }, pop: 10, rain: 0 },
      { max: 30.5, min: 17.0, cond: { code: "clear", label: "Clear Sky", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 31.0, min: 17.2, cond: { code: "sunny", label: "Dry & Warm", icon: "SunMedium" }, pop: 5, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 22,
      explanation: "Mild afternoon convective clouds over Deccan hills with light, non-hazardous showers.",
      totalWeeklyRainfallMm: 4.9,
      peakDay: "Day 3",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  bengaluru: {
    cityId: "bengaluru",
    cityName: "Bengaluru",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 27.2, min: 18.8, cond: { code: "scattered_showers", label: "Scattered Showers", icon: "CloudRain" }, pop: 65, rain: 14.5 },
      { max: 26.5, min: 18.2, cond: { code: "thundershower", label: "Evening Thundershower", icon: "CloudRain" }, pop: 75, rain: 22.0 },
      { max: 27.0, min: 18.5, cond: { code: "light_rain", label: "Passing Rain", icon: "CloudDrizzle" }, pop: 55, rain: 8.4 },
      { max: 27.8, min: 18.9, cond: { code: "cloudy", label: "Overcast Breeze", icon: "CloudSun" }, pop: 40, rain: 4.2 },
      { max: 28.2, min: 19.0, cond: { code: "partly_cloudy", label: "Mild & Sunny", icon: "SunMedium" }, pop: 30, rain: 2.1 },
      { max: 28.5, min: 19.2, cond: { code: "clear", label: "Pleasant", icon: "Sun" }, pop: 20, rain: 0.8 },
      { max: 29.0, min: 19.5, cond: { code: "clear", label: "Clear Sunshine", icon: "Sun" }, pop: 15, rain: 0.2 },
    ]),
    rainfallRisk: {
      level: "High",
      score: 72,
      explanation: "Northeast monsoon easterly trough bringing moderate-to-heavy convective evening rain across Bengaluru urban basin.",
      totalWeeklyRainfallMm: 52.2,
      peakDay: "Day 2",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  hyderabad: {
    cityId: "hyderabad",
    cityName: "Hyderabad",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 32.2, min: 20.5, cond: { code: "clear", label: "Warm & Dry", icon: "SunMedium" }, pop: 15, rain: 0.5 },
      { max: 32.8, min: 21.0, cond: { code: "sunny", label: "Clear Sky", icon: "Sun" }, pop: 10, rain: 0 },
      { max: 31.5, min: 20.2, cond: { code: "passing_clouds", label: "Passing Clouds", icon: "CloudSun" }, pop: 25, rain: 1.8 },
      { max: 31.0, min: 19.8, cond: { code: "partly_cloudy", label: "Mild Breeze", icon: "CloudSun" }, pop: 20, rain: 1.2 },
      { max: 31.8, min: 20.0, cond: { code: "sunny", label: "Sunny", icon: "Sun" }, pop: 10, rain: 0 },
      { max: 32.5, min: 20.4, cond: { code: "clear", label: "Warm Afternoon", icon: "SunMedium" }, pop: 5, rain: 0 },
      { max: 33.0, min: 21.0, cond: { code: "clear", label: "Dry Sunshine", icon: "Sun" }, pop: 5, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 18,
      explanation: "Dry continental air maintains mostly sunny conditions with negligible precipitation probability.",
      totalWeeklyRainfallMm: 3.5,
      peakDay: "Day 3",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  chennai: {
    cityId: "chennai",
    cityName: "Chennai",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 30.5, min: 24.8, cond: { code: "heavy_rain", label: "Monsoon Downpours", icon: "CloudRain" }, pop: 85, rain: 38.0 },
      { max: 29.8, min: 24.2, cond: { code: "continuous_rain", label: "Heavy Coastal Rain", icon: "CloudRain" }, pop: 90, rain: 45.5 },
      { max: 30.0, min: 24.5, cond: { code: "showers", label: "Frequent Showers", icon: "CloudRain" }, pop: 75, rain: 26.2 },
      { max: 30.8, min: 25.0, cond: { code: "passing_showers", label: "Scattered Rain", icon: "CloudDrizzle" }, pop: 60, rain: 14.0 },
      { max: 31.2, min: 25.2, cond: { code: "humid_breeze", label: "Cloudy & Humid", icon: "CloudSun" }, pop: 45, rain: 6.8 },
      { max: 31.8, min: 25.5, cond: { code: "partly_cloudy", label: "Breaks of Sun", icon: "SunMedium" }, pop: 35, rain: 3.5 },
      { max: 32.0, min: 25.8, cond: { code: "sunny", label: "Coastal Warmth", icon: "SunMedium" }, pop: 25, rain: 1.5 },
    ]),
    rainfallRisk: {
      level: "Very High",
      score: 88,
      explanation: "Active Northeast Monsoon vortex over southwest Bay of Bengal producing heavy rainfall spells and urban drainage strain.",
      totalWeeklyRainfallMm: 135.5,
      peakDay: "Day 2",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  kolkata: {
    cityId: "kolkata",
    cityName: "Kolkata",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 31.5, min: 22.0, cond: { code: "pleasant", label: "Autumn Sunshine", icon: "SunMedium" }, pop: 20, rain: 1.0 },
      { max: 31.0, min: 21.5, cond: { code: "clear", label: "Clear & Hazy", icon: "Sun" }, pop: 15, rain: 0.5 },
      { max: 30.5, min: 21.0, cond: { code: "partly_cloudy", label: "Delta Breeze", icon: "CloudSun" }, pop: 25, rain: 2.2 },
      { max: 30.2, min: 20.8, cond: { code: "clear", label: "Pleasant", icon: "Sun" }, pop: 15, rain: 0.4 },
      { max: 30.8, min: 20.5, cond: { code: "clear", label: "Sunny", icon: "Sun" }, pop: 10, rain: 0 },
      { max: 31.2, min: 21.0, cond: { code: "sunny", label: "Warm Sun", icon: "SunMedium" }, pop: 5, rain: 0 },
      { max: 31.5, min: 21.2, cond: { code: "clear", label: "Clear Day", icon: "Sun" }, pop: 5, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 16,
      explanation: "Post-monsoon retreat complete. Clear skies with negligible moisture influx from northern Bay.",
      totalWeeklyRainfallMm: 4.1,
      peakDay: "Day 3",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  ahmedabad: {
    cityId: "ahmedabad",
    cityName: "Ahmedabad",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 35.0, min: 21.5, cond: { code: "sunny", label: "Bright & Hot", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 35.5, min: 21.8, cond: { code: "sunny", label: "Dry Heat", icon: "SunMedium" }, pop: 5, rain: 0 },
      { max: 34.8, min: 21.2, cond: { code: "clear", label: "Clear Sky", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 34.2, min: 20.8, cond: { code: "clear", label: "Sunny", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 34.5, min: 20.5, cond: { code: "sunny", label: "Warm Afternoon", icon: "SunMedium" }, pop: 5, rain: 0 },
      { max: 35.0, min: 21.0, cond: { code: "clear", label: "Dry", icon: "Sun" }, pop: 0, rain: 0 },
      { max: 35.2, min: 21.4, cond: { code: "clear", label: "Clear", icon: "Sun" }, pop: 0, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 5,
      explanation: "Arid anticyclonic weather pattern ensures completely dry days across Gujarat plains.",
      totalWeeklyRainfallMm: 0,
      peakDay: "None",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  jaipur: {
    cityId: "jaipur",
    cityName: "Jaipur",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 32.5, min: 17.8, cond: { code: "sunny", label: "Desert Sun", icon: "SunMedium" }, pop: 5, rain: 0 },
      { max: 32.0, min: 17.2, cond: { code: "clear", label: "Clear & Dry", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 31.8, min: 16.9, cond: { code: "clear", label: "Sunny Skies", icon: "Sun" }, pop: 0, rain: 0 },
      { max: 31.2, min: 16.5, cond: { code: "clear", label: "Mild Evening", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 31.0, min: 16.0, cond: { code: "clear", label: "Pleasant", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 31.5, min: 16.4, cond: { code: "clear", label: "Sunny", icon: "Sun" }, pop: 0, rain: 0 },
      { max: 32.0, min: 17.0, cond: { code: "clear", label: "Dry Sunshine", icon: "Sun" }, pop: 0, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 6,
      explanation: "Dry northwesterly desert wind flow ensures clear blue skies with zero rainfall expected.",
      totalWeeklyRainfallMm: 0,
      peakDay: "None",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
  lucknow: {
    cityId: "lucknow",
    cityName: "Lucknow",
    timestamp: new Date().toISOString(),
    days: makeDays([
      { max: 30.8, min: 18.2, cond: { code: "hazy", label: "Morning Haze", icon: "CloudFog" }, pop: 10, rain: 0 },
      { max: 30.2, min: 17.8, cond: { code: "clear", label: "Sunny Afternoon", icon: "SunMedium" }, pop: 10, rain: 0.2 },
      { max: 29.8, min: 17.0, cond: { code: "partly_cloudy", label: "Passing Clouds", icon: "CloudSun" }, pop: 20, rain: 1.0 },
      { max: 29.2, min: 16.5, cond: { code: "clear", label: "Dry & Mild", icon: "Sun" }, pop: 15, rain: 0.5 },
      { max: 28.8, min: 16.0, cond: { code: "clear", label: "Pleasant", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 28.5, min: 15.6, cond: { code: "clear", label: "Cool Nights", icon: "Sun" }, pop: 5, rain: 0 },
      { max: 28.2, min: 15.2, cond: { code: "clear", label: "Sunny Day", icon: "Sun" }, pop: 5, rain: 0 },
    ]),
    rainfallRisk: {
      level: "Low",
      score: 14,
      explanation: "Gangetic plains entering dry winter transition. Negligible rain with early morning fog patches.",
      totalWeeklyRainfallMm: 1.7,
      peakDay: "Day 3",
    },
    isSampleData: true,
    sampleNote: "DEMO Baseline",
  },
};
