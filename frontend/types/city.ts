/**
 * City & Geographic coordinates types for Indian cities
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface IndianCity {
  id: string;
  name: string;
  state: string;
  coordinates: Coordinates;
  elevationMeters: number;
  tier: 1 | 2 | 3;
}
