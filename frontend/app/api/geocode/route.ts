import { NextRequest, NextResponse } from "next/server";
import { MOCK_INDIAN_CITIES } from "@/data/mock";
import { GeocodedLocation } from "@/types";

interface NominatimAddress {
  city?: string;
  town?: string;
  municipality?: string;
  subdistrict?: string;
  village?: string;
  county?: string;
  district?: string;
  state_district?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  place_id: number;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  address?: NominatimAddress;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    // Return empty results if query is under 2 characters
    return NextResponse.json({ locations: [] });
  }

  const queryLower = q.toLowerCase();
  const results: GeocodedLocation[] = [];
  const seenKeys = new Set<string>();

  // 1. First check local predefined cities for instant matches
  const localMatches = MOCK_INDIAN_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(queryLower) ||
      c.state.toLowerCase().includes(queryLower)
  );

  for (const city of localMatches) {
    const key = `${city.name.toLowerCase()}-${city.state.toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push({
        id: city.id,
        name: city.name,
        state: city.state,
        displayName: `${city.name}, ${city.state}`,
        coordinates: city.coordinates,
        type: `Tier ${city.tier} City`,
        isPredefinedCity: true,
      });
    }
  }

  // 2. Query Nominatim for all-India coverage (cities, towns, districts, tehsils)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&countrycodes=in&format=json&addressdetails=1&limit=10`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "ClimateScope-Environmental-Platform/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache geocode requests for 1 hour
    });

    if (response.ok) {
      const items = (await response.json()) as NominatimResult[];

      for (const item of items) {
        const addr = item.address || {};
        const name =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.subdistrict ||
          addr.village ||
          addr.county ||
          item.display_name.split(",")[0].trim();

        const state =
          addr.state || addr.state_district || addr.district || "India";

        // Form unique key to prevent near-duplicate rows
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const coordKey = `${lat.toFixed(2)}-${lng.toFixed(2)}`;
        const nameStateKey = `${name.toLowerCase()}-${state.toLowerCase()}`;

        if (!seenKeys.has(coordKey) && !seenKeys.has(nameStateKey)) {
          seenKeys.add(coordKey);
          seenKeys.add(nameStateKey);

          results.push({
            id: `osm-${item.osm_id || item.place_id}`,
            name,
            state,
            displayName: `${name}, ${state}`,
            coordinates: { lat, lng },
            type: item.type || item.class || "Location",
            isPredefinedCity: false,
          });
        }
      }
    }
  } catch (error) {
    console.warn("Geocoding fetch error:", error);
    // If Nominatim fails or is throttled, local matches are still returned cleanly
  }

  return NextResponse.json({ locations: results.slice(0, 8) });
}
