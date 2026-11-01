/**
 * Environmental Alerts & Notification Centre Types
 */

export type AlertCategory =
  | "heatwave"
  | "heavy_rainfall"
  | "flood_risk"
  | "poor_air_quality"
  | "drought"
  | "extreme_weather";

export type AlertSeverity = "Critical" | "High" | "Moderate" | "Low";

export interface EnvironmentalAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  cityId: string;
  cityName: string;
  state: string;
  description: string;
  dateTime: string; // Alert issued timestamp
  source: string; // Alert issuance authority (e.g., IMD, CPCB, NDMA, CWC)
  lastUpdated: string; // Last updated timestamp
  isRead: boolean;
  isDemo: boolean;
  demoNotice?: string;
}

export type SeverityFilter = "All" | AlertSeverity;
export type CategoryFilter = "All" | AlertCategory;
export type CityScopeFilter = "current" | "all";
export type ReadStatusFilter = "all" | "unread" | "read";

export interface AlertFilterOptions {
  severity: SeverityFilter;
  category: CategoryFilter;
  cityScope: CityScopeFilter;
  readStatus: ReadStatusFilter;
}

export interface CityAlertsResponse {
  cityId: string;
  cityName: string;
  timestamp: string;
  alerts: EnvironmentalAlert[];
  totalCount: number;
  unreadCount: number;
  isDataUnavailable?: boolean;
  apiContractNote?: string;
  isSampleData?: boolean;
  sampleNote?: string;
}
