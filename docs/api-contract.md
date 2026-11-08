# CodeStorm Climate Intelligence — API Contract Specification

Base URL: `http://localhost:8000` (Local) / Custom Deployed Domain (Production)

All API responses are formatted in JSON and conform to the data contracts expected by the ClimateScope Next.js frontend.

---

## 1. Health Check

### `GET /health`
Verifies backend service operational health.

#### Response `200 OK`:
```json
{
  "status": "ok",
  "project": "CodeStorm Climate Intelligence"
}
```

---

## 2. Weather API

### `GET /api/weather`
Fetch current weather conditions by geographic coordinates.
- **Query Parameters**:
  - `lat` (float, required): Latitude (-90 to 90)
  - `lng` (float, required): Longitude (-180 to 180)

### `GET /api/weather/{city_id}`
Fetch current weather for one of the 10 predefined urban corridors:
`delhi`, `mumbai`, `pune`, `bengaluru`, `hyderabad`, `chennai`, `kolkata`, `ahmedabad`, `jaipur`, `lucknow`.

#### Response `200 OK`:
```json
{
  "cityId": "mumbai",
  "cityName": "Mumbai",
  "timestamp": "2026-11-08T10:00:00Z",
  "temperatureCelsius": 29.4,
  "feelsLikeCelsius": 32.1,
  "humidityPercent": 68.0,
  "windSpeedKmh": 12.5,
  "windDirectionDeg": 260.0,
  "windDirectionLabel": "W",
  "pressureHpa": 1012.0,
  "uvIndex": 6.2,
  "visibilityKm": 10.0,
  "condition": {
    "code": "1",
    "label": "Mainly clear",
    "icon": "Sun"
  },
  "coordinates": {
    "lat": 19.0760,
    "lng": 72.8777
  }
}
```

---

## 3. Air Quality API

### `GET /api/air-quality`
Fetch live air quality index and detailed pollutant metrics by coordinates.
- **Query Parameters**: `lat`, `lng`

### `GET /api/air-quality/{city_id}`
Fetch live air quality index for a predefined corridor.

#### Response `200 OK`:
```json
{
  "cityId": "delhi",
  "cityName": "New Delhi",
  "timestamp": "2026-11-08T10:00:00Z",
  "aqi": 312,
  "category": "Hazardous",
  "dominantPollutant": "PM2.5",
  "pollutants": {
    "pm25": {
      "name": "Fine Particulate Matter",
      "chemicalFormula": "PM2.5",
      "value": 182.4,
      "unit": "µg/m³",
      "standardLimit": 60.0,
      "status": "Hazardous"
    },
    "pm10": {
      "name": "Coarse Particulate Matter",
      "chemicalFormula": "PM10",
      "value": 245.1,
      "unit": "µg/m³",
      "standardLimit": 100.0,
      "status": "Severe"
    },
    "no2": {
      "name": "Nitrogen Dioxide",
      "chemicalFormula": "NO₂",
      "value": 45.2,
      "unit": "µg/m³",
      "standardLimit": 80.0,
      "status": "Good"
    },
    "so2": {
      "name": "Sulfur Dioxide",
      "chemicalFormula": "SO₂",
      "value": 14.8,
      "unit": "µg/m³",
      "standardLimit": 80.0,
      "status": "Good"
    },
    "co": {
      "name": "Carbon Monoxide",
      "chemicalFormula": "CO",
      "value": 1.2,
      "unit": "mg/m³",
      "standardLimit": 4.0,
      "status": "Good"
    },
    "o3": {
      "name": "Ozone",
      "chemicalFormula": "O₃",
      "value": 38.0,
      "unit": "µg/m³",
      "standardLimit": 100.0,
      "status": "Good"
    }
  },
  "healthAdvisory": "Air quality is hazardous. Avoid prolonged outdoor exertion.",
  "coordinates": {
    "lat": 28.6139,
    "lng": 77.2090
  }
}
```

---

## 4. Climate Risk Assessment API

### `GET /api/climate-risk`
Compute compound hazard risk assessment based on 30-year historical baseline anomalies.
- **Query Parameters**: `lat`, `lng`

### `GET /api/climate-risk/{city_id}`
Compute hazard risk assessment for a predefined corridor.

#### Response `200 OK`:
```json
{
  "cityId": "bengaluru",
  "cityName": "Bengaluru",
  "timestamp": "2026-11-08T10:00:00Z",
  "overallScore": 42.5,
  "overallCategory": "Moderate",
  "categories": {
    "heatwave": {
      "id": "heatwave",
      "title": "Heatwave Risk",
      "score": 35.0,
      "category": "Low",
      "explanation": "Summer temperatures remain near historical 30-year mean."
    },
    "flood": {
      "id": "flood",
      "title": "Urban Flood Vulnerability",
      "score": 58.0,
      "category": "Moderate",
      "explanation": "Moderate precipitation intensity risk across urban catchment basins."
    },
    "drought": {
      "id": "drought",
      "title": "Agricultural & Meteorological Drought",
      "score": 44.0,
      "category": "Moderate",
      "explanation": "Soil moisture index within acceptable seasonal variance."
    },
    "airPollution": {
      "id": "air_pollution",
      "title": "Air Quality Risk",
      "score": 33.0,
      "category": "Low",
      "explanation": "AQI levels remain moderate without severe prolonged stagnation."
    }
  },
  "coordinates": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "isSampleData": false,
  "sampleNote": null,
  "isDataUnavailable": false
}
```

---

## 5. Historical Climate Trends API

### `GET /api/historical` / `GET /api/historical/{city_id}`
Fetch aggregated multi-year historical weather and air-quality trends.
- **Query Parameters**:
  - `range` (optional, default `"6m"`): `"30d"` | `"6m"` | `"1y"` | `"2y"`
  - `lat`, `lng` (when using coordinate endpoint)

#### Response `200 OK`:
```json
{
  "cityId": "pune",
  "cityName": "Pune",
  "timestamp": "2026-11-08T10:00:00Z",
  "dataSource": "Open-Meteo ERA5 reanalysis/Forecast API and CAMS Global air-quality model",
  "timeRange": "6m",
  "points": [
    {
      "timestamp": "2026-05-01T00:00:00Z",
      "label": "May 2026",
      "meanTempCelsius": 29.8,
      "maxTempCelsius": 36.2,
      "minTempCelsius": 23.4,
      "totalRainfallMm": 18.2,
      "averageAqi": 85.0
    }
  ],
  "summary": {
    "averageTemperatureCelsius": 26.4,
    "totalRainfallMm": 420.5,
    "extremeHeatDays": 14,
    "heavyRainDays": 8,
    "averageAqi": 92.3
  },
  "isSampleData": false,
  "isDataUnavailable": false,
  "coordinates": {
    "lat": 18.5204,
    "lng": 73.8567
  }
}
```

---

## 6. Seven-Day Weather & Climate Forecast API

### `GET /api/forecast` / `GET /api/forecast/{city_id}`
Fetch 7-day weather predictions with precipitation risk classification.
- **Query Parameters**: `lat`, `lng` (or `city_id` path param)

#### Response `200 OK`:
```json
{
  "cityId": "chennai",
  "cityName": "Chennai",
  "timestamp": "2026-11-08T10:00:00Z",
  "days": [
    {
      "date": "2026-11-08",
      "dayLabel": "Sun",
      "fullDateLabel": "Nov 8, 2026",
      "maxTempCelsius": 31.0,
      "minTempCelsius": 24.5,
      "rainProbabilityPercent": 20,
      "precipitationMm": 0.5,
      "condition": {
        "code": "2",
        "label": "Partly cloudy",
        "icon": "CloudSun"
      }
    }
  ],
  "rainfallRisk": {
    "score": 25.0,
    "category": "Low",
    "summary": "Minimal accumulated precipitation forecasted over next 7 days."
  },
  "isSampleData": false,
  "isDataUnavailable": false,
  "coordinates": {
    "lat": 13.0827,
    "lng": 80.2707
  }
}
```

