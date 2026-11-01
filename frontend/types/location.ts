/**
 * Dynamic Geocoded Location types for Pan-India search
 */
export interface GeocodedLocation {
  id: string;
  name: string;
  state: string;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type?: string;
  isPredefinedCity?: boolean;
}

export interface LocationSearchResult {
  locations: GeocodedLocation[];
  total: number;
}
