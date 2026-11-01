"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MOCK_INDIAN_CITIES } from "@/data/mock";
import { ClimateLayer } from "@/hooks";
import { GeocodedLocation } from "@/types";
import { Radio, ShieldCheck } from "lucide-react";

// Defensively patch Leaflet's L.Map.prototype.remove to prevent
// "Error: Map container is being reused by another instance"
// during Next.js client-side route navigation and React component remounts.
if (
  typeof window !== "undefined" &&
  L &&
  L.Map &&
  !(L.Map.prototype as unknown as { _climatescope_safe_remove?: boolean })._climatescope_safe_remove
) {
  const originalRemove = L.Map.prototype.remove;
  L.Map.prototype.remove = function (this: L.Map) {
    try {
      const container = (this as unknown as { _container?: HTMLElement })._container;
      const containerId = (this as unknown as { _containerId?: number })._containerId;
      if (container && containerId !== undefined) {
        if ((container as unknown as { _leaflet_id?: number })._leaflet_id !== containerId) {
          (container as unknown as { _leaflet_id?: number })._leaflet_id = containerId;
        }
      }
      return originalRemove.call(this);
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.message?.includes("Map container is being reused by another instance")) {
        try {
          const container = (this as unknown as { _container?: HTMLElement })._container;
          if (container) {
            delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
          }
        } catch {
          // Ignore container cleanup errors
        }
        return this;
      }
      throw err;
    }
  };
  (L.Map.prototype as unknown as { _climatescope_safe_remove?: boolean })._climatescope_safe_remove = true;
}

let activeGlobalMap: L.Map | null = null;

interface LeafletMapViewProps {
  activeLayer: ClimateLayer;
  selectedCityId?: string;
  selectedLocation?: GeocodedLocation | null;
  resetKey?: number;
  onCitySelect?: (cityId: string) => void;
  onClearSelection?: () => void;
}

/**
 * High-precision geographical bounding box for India:
 * - South: Indira Point, Great Nicobar (~6.75° N) & Kanyakumari (~8.07° N)
 * - North: Northern Ladakh & Siachen (~37.10° N)
 * - West: Sir Creek, Gujarat (~68.16° E)
 * - East: Kibithu, Arunachal Pradesh (~97.40° E)
 */
export const INDIA_BOUNDS: L.LatLngBoundsLiteral = [
  [6.75, 68.16], // South-West corner
  [37.10, 97.40], // North-East corner
];

/**
 * Calculates adaptive padding so India is centered and prominently showcased
 * while preserving natural view of surrounding geographical context.
 */
function getAdaptivePadding() {
  if (typeof window === "undefined") {
    return {
      paddingTopLeft: [40, 40] as [number, number],
      paddingBottomRight: [40, 40] as [number, number],
    };
  }
  const width = window.innerWidth;
  if (width >= 1536) {
    return {
      paddingTopLeft: [220, 65] as [number, number],
      paddingBottomRight: [220, 40] as [number, number],
    };
  } else if (width >= 1280) {
    return {
      paddingTopLeft: [190, 55] as [number, number],
      paddingBottomRight: [190, 35] as [number, number],
    };
  } else if (width >= 1024) {
    return {
      paddingTopLeft: [140, 50] as [number, number],
      paddingBottomRight: [140, 30] as [number, number],
    };
  } else {
    return {
      paddingTopLeft: [15, 60] as [number, number],
      paddingBottomRight: [15, 30] as [number, number],
    };
  }
}

/**
 * Controller to smoothly pan and zoom the map when a user manually selects
 * a city or dynamic location.
 * Does NOT zoom into New Delhi on initial load.
 */
function CityFocusController({
  selectedLocation,
  selectedCityId,
  resetKey,
}: {
  selectedLocation?: GeocodedLocation | null;
  selectedCityId?: string;
  resetKey?: number;
}) {
  const map = useMap();
  const isInitialMountRef = useRef<boolean>(true);
  const prevCityIdRef = useRef<string | undefined>(selectedCityId);
  const prevLocationRef = useRef<GeocodedLocation | null | undefined>(selectedLocation);
  const prevResetKeyRef = useRef<number | undefined>(resetKey);

  useEffect(() => {
    // 1. On initial mount, do NOT auto-zoom to default city (e.g. New Delhi).
    // The map must always display the complete India overview by default.
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevCityIdRef.current = selectedCityId;
      prevLocationRef.current = selectedLocation;
      prevResetKeyRef.current = resetKey;
      return;
    }

    // 2. If reset was clicked, do not focus on any city.
    if (resetKey !== undefined && resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      prevLocationRef.current = null;
      prevCityIdRef.current = selectedCityId;
      return;
    }

    // 3. User selected a dynamic location or clicked a city marker (which provides selectedLocation)
    const locationChanged =
      selectedLocation &&
      (!prevLocationRef.current ||
        selectedLocation.id !== prevLocationRef.current.id ||
        selectedLocation.coordinates.lat !== prevLocationRef.current.coordinates.lat ||
        selectedLocation.coordinates.lng !== prevLocationRef.current.coordinates.lng);

    if (locationChanged && selectedLocation?.coordinates) {
      prevLocationRef.current = selectedLocation;
      prevCityIdRef.current = selectedCityId;
      map.flyTo(
        [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng],
        10.5,
        {
          duration: 1.4,
          easeLinearity: 0.25,
        }
      );
      return;
    }

    // 4. User explicitly switched selected city ID to a different city
    const cityChanged = selectedCityId && selectedCityId !== prevCityIdRef.current;
    if (cityChanged) {
      prevCityIdRef.current = selectedCityId;
      prevLocationRef.current = selectedLocation;
      const city = MOCK_INDIAN_CITIES.find((c) => c.id === selectedCityId);
      if (city) {
        map.flyTo([city.coordinates.lat, city.coordinates.lng], 10, {
          duration: 1.4,
          easeLinearity: 0.25,
        });
      }
      return;
    }

    // Keep refs in sync for subsequent renders
    prevCityIdRef.current = selectedCityId;
    prevLocationRef.current = selectedLocation;
    prevResetKeyRef.current = resetKey;
  }, [selectedLocation, selectedCityId, resetKey, map]);

  return null;
}

/**
 * Map controller component to ensure the entire map of India fits prominently
 * inside the visible central area on initial load and on reset.
 */
function IndiaMapController({
  bounds,
  resetKey,
}: {
  bounds: L.LatLngBoundsLiteral;
  resetKey?: number;
}) {
  const map = useMap();

  const fitIndiaBounds = useCallback(
    (animate: boolean = false) => {
      const padding = getAdaptivePadding();
      map.fitBounds(bounds, {
        paddingTopLeft: padding.paddingTopLeft,
        paddingBottomRight: padding.paddingBottomRight,
        maxZoom: 6.0,
        animate,
        duration: animate ? 1.2 : undefined,
      });
    },
    [map, bounds]
  );

  useEffect(() => {
    fitIndiaBounds(false);

    const handleResize = () => {
      fitIndiaBounds(false);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [fitIndiaBounds]);

  // Smoothly return to the default India overview when reset is clicked
  useEffect(() => {
    if (resetKey && resetKey > 0) {
      fitIndiaBounds(true);
    }
  }, [resetKey, fitIndiaBounds]);

  return null;
}

/**
 * Creates custom styled HTML markers for Indian Cities & dynamic search locations.
 * Features an active glowing ring and floating name label when selected.
 */
function createCityMarkerIcon(city: { name: string }, isSelected: boolean) {
  return L.divIcon({
    className: "custom-city-marker",
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group" style="width: 44px; height: 44px;">
        ${
          isSelected
            ? `<span class="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping"></span>
               <span class="absolute inset-1.5 rounded-full bg-emerald-400/30 animate-pulse"></span>
               <div class="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#059669] to-[#0891B2] border-2 border-white shadow-xl flex items-center justify-center text-white ring-4 ring-emerald-500/30">
                 <span class="w-3 h-3 rounded-full bg-white shadow-xs"></span>
               </div>
               <div class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-[#0F172A] text-white text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none">
                 ${city.name}
               </div>`
            : `<span class="absolute inset-2 rounded-full bg-emerald-400/20 group-hover:scale-125 transition-transform"></span>
               <div class="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#059669] to-[#0891B2] border-2 border-white shadow-md flex items-center justify-center text-white">
                 <span class="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></span>
               </div>`
        }
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

/**
 * Native Leaflet Zoom Control positioned at bottom-right with safe context initialization.
 * Prevents "Cannot read properties of undefined (reading 'bottomright')" by ensuring
 * map control corners exist before mounting, and prevents duplicate controls.
 */
function NativeZoomControl() {
  const map = useMap();
  const controlRef = useRef<L.Control.Zoom | null>(null);

  useEffect(() => {
    if (!map) return;

    const mapInstance = map as unknown as {
      _controlCorners?: Record<string, HTMLElement>;
      _initControlPos?: () => void;
    };

    // Ensure Leaflet control corners are initialized on map container
    if (!mapInstance._controlCorners && typeof mapInstance._initControlPos === "function") {
      mapInstance._initControlPos();
    }

    if (!mapInstance._controlCorners) {
      return;
    }

    // Prevent duplicate zoom controls
    if (controlRef.current) {
      return;
    }

    const zoom = L.control.zoom({ position: "bottomright" });
    try {
      zoom.addTo(map);
      controlRef.current = zoom;
    } catch (e) {
      console.warn("Could not mount Leaflet ZoomControl:", e);
    }

    return () => {
      try {
        if (controlRef.current) {
          controlRef.current.remove();
          controlRef.current = null;
        }
      } catch {
        // Safe unmount
      }
    };
  }, [map]);

  return null;
}

/**
 * Safe TileLayer implementation preventing "Cannot read properties of undefined (reading 'appendChild')"
 * during cross-route navigation and React lifecycle remounts.
 * Verifies tilePane existence on map container and ensures clean single-instance lifecycle.
 */
function SafeTileLayer({
  url,
  attribution,
  maxZoom = 19,
  minZoom = 3,
}: {
  url: string;
  attribution?: string;
  maxZoom?: number;
  minZoom?: number;
}) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    const mapInstance = map as unknown as {
      _panes?: Record<string, HTMLElement>;
      _initPanes?: () => void;
      _container?: HTMLElement;
    };

    if (!mapInstance._container) return;

    // Ensure Leaflet panes are initialized
    let pane = map.getPane("tilePane");
    if (!pane && typeof mapInstance._initPanes === "function") {
      try {
        mapInstance._initPanes();
        pane = map.getPane("tilePane");
      } catch {
        // ignore
      }
    }

    if (!pane) {
      return;
    }

    // Prevent duplicate layer mounting
    if (layerRef.current) {
      return;
    }

    const layer = L.tileLayer(url, {
      attribution,
      maxZoom,
      minZoom,
    });

    try {
      layer.addTo(map);
      layerRef.current = layer;
    } catch (e) {
      console.warn("Could not mount Leaflet TileLayer:", e);
    }

    return () => {
      try {
        if (layerRef.current) {
          layerRef.current.remove();
          layerRef.current = null;
        }
      } catch {
        // Safe unmount
      }
    };
  }, [map, url, attribution, maxZoom, minZoom]);

  return null;
}

/**
 * Safely manages the Leaflet Map instance lifecycle.
 * Ensures that only ONE active map instance exists at any time and guarantees
 * clean unmount without container reuse collisions.
 */
function MapLifecycleManager() {
  const map = useMap();

  useEffect(() => {
    // If a previous map instance was still active, clean it up first
    if (activeGlobalMap && activeGlobalMap !== map) {
      try {
        const prevContainer = (activeGlobalMap as unknown as { _container?: HTMLElement })._container;
        const prevId = (activeGlobalMap as unknown as { _containerId?: number })._containerId;
        if (prevContainer && prevId !== undefined) {
          (prevContainer as unknown as { _leaflet_id?: number })._leaflet_id = prevId;
        }
        activeGlobalMap.remove();
      } catch {
        // Safe disposal
      }
    }
    activeGlobalMap = map;

    return () => {
      if (activeGlobalMap === map) {
        activeGlobalMap = null;
      }
    };
  }, [map]);

  return null;
}

export default function LeafletMapView({
  selectedCityId,
  selectedLocation,
  resetKey,
  onCitySelect,
}: LeafletMapViewProps) {
  // Unique container ID per mount to guarantee a fresh DOM element on each route visit
  const [mapContainerKey] = useState(
    () => `climatescope-map-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );
  const cities = useMemo(() => MOCK_INDIAN_CITIES, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [maskGeoJSON, setMaskGeoJSON] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [outlineGeoJSON, setOutlineGeoJSON] = useState<any>(null);

  const boundsOptions = useMemo(() => {
    const padding = getAdaptivePadding();
    return {
      paddingTopLeft: padding.paddingTopLeft,
      paddingBottomRight: padding.paddingBottomRight,
      maxZoom: 6.0,
    };
  }, []);

  // Check if selectedLocation is a dynamic location outside the 10 predefined cities
  const isDynamicSelected = useMemo(() => {
    if (!selectedLocation) return false;
    return !cities.some(
      (c) =>
        c.id === selectedLocation.id ||
        c.name.toLowerCase() === selectedLocation.name.toLowerCase()
    );
  }, [selectedLocation, cities]);

  // Load inverted polygon mask and national boundary outline
  useEffect(() => {
    let mounted = true;

    // Load inverted mask for contextual geographical muting
    fetch("/india_mask.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load India mask");
        return res.json();
      })
      .then((data) => {
        if (mounted) setMaskGeoJSON(data);
      })
      .catch((err) => {
        console.warn("Could not load India mask GeoJSON:", err);
      });

    // Load boundary outline for crisp emerald border & subtle green highlight
    fetch("/india_outline.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load India outline");
        return res.json();
      })
      .then((data) => {
        if (mounted) setOutlineGeoJSON(data);
      })
      .catch((err) => {
        console.warn("Could not load India outline GeoJSON:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key={mapContainerKey}
        id={mapContainerKey}
        bounds={INDIA_BOUNDS}
        boundsOptions={boundsOptions}
        zoomSnap={0.25}
        zoomDelta={0.5}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
      >
        {/* Single-instance lifecycle manager */}
        <MapLifecycleManager />

        {/* Zoom Control at bottom-right */}
        <NativeZoomControl />

        {/* OpenStreetMap Raster Tile Layer (100% Free, No API Key Required) */}
        <SafeTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
        />

        {/* Contextual Regional Mask: Soft light wash over neighbouring regions */}
        {maskGeoJSON && (
          <GeoJSON
            key="india-context-mask"
            data={maskGeoJSON}
            style={() => ({
              color: "#CBD5E1",
              weight: 1,
              opacity: 0.35,
              fillColor: "#F8FAFC",
              fillOpacity: 0.52,
              fillRule: "evenodd",
            })}
            interactive={false}
          />
        )}

        {/* India Sovereign Highlight: Crisp emerald outline & subtle 3.5% green tint */}
        {outlineGeoJSON && (
          <GeoJSON
            key="india-national-outline"
            data={outlineGeoJSON}
            style={() => ({
              color: "#059669",
              weight: 2.2,
              opacity: 0.95,
              fillColor: "#059669",
              fillOpacity: 0.035,
            })}
            interactive={false}
          />
        )}

        {/* Automated View Controller fitting complete India prominently with balanced padding */}
        <IndiaMapController
          bounds={INDIA_BOUNDS}
          resetKey={resetKey}
        />

        {/* Smooth Pan and Zoom Controller for any dynamic location or city */}
        <CityFocusController
          selectedLocation={selectedLocation}
          selectedCityId={selectedCityId}
          resetKey={resetKey}
        />

        {/* 10 Baseline Predefined City Markers */}
        {cities.map((city) => {
          const isSelected =
            (!selectedLocation && selectedCityId === city.id) ||
            selectedLocation?.id === city.id ||
            selectedLocation?.name.toLowerCase() === city.name.toLowerCase();

          const markerIcon = createCityMarkerIcon(city, isSelected);

          return (
            <Marker
              key={city.id}
              position={[city.coordinates.lat, city.coordinates.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  if (onCitySelect) onCitySelect(city.id);
                },
              }}
            >
              <Popup className="climatescope-popup" closeButton={true}>
                <div className="p-4 w-72 text-[#0F172A]">
                  {/* Popup Brand Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                      <Radio className="w-3.5 h-3.5 text-[#059669]" />
                      <span>ClimateScope Node</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] border border-slate-200">
                      Tier {city.tier}
                    </span>
                  </div>

                  {/* City Title & State */}
                  <div className="mt-2.5">
                    <h3 className="text-[18px] font-bold text-[#0F172A] leading-tight">
                      {city.name}
                    </h3>
                    <p className="text-[13px] text-[#475569] font-medium">
                      {city.state}, India
                    </p>
                  </div>

                  {/* Geographic Coordinates */}
                  <div className="mt-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 text-[12px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-medium">Latitude:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {city.coordinates.lat.toFixed(4)}° N
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-medium">Longitude:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {city.coordinates.lng.toFixed(4)}° E
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-medium">Elevation:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {city.elevationMeters} m ASL
                      </span>
                    </div>
                  </div>

                  {/* Demonstration Status Disclaimer */}
                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[#64748B] bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                    <span>
                      Demonstration station location. Real-time sensor feed connection pending.
                    </span>
                  </div>

                  {/* Action Button */}
                  {onCitySelect && (
                    <button
                      onClick={() => onCitySelect(city.id)}
                      type="button"
                      className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#0891B2] hover:opacity-95 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer"
                    >
                      Focus Atmospheric Feed
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Dynamic Marker for Any Searched City or Town in India */}
        {isDynamicSelected && selectedLocation && (
          <Marker
            key={selectedLocation.id}
            position={[
              selectedLocation.coordinates.lat,
              selectedLocation.coordinates.lng,
            ]}
            icon={createCityMarkerIcon(selectedLocation, true)}
          >
            <Popup className="climatescope-popup" closeButton={true}>
              <div className="p-4 w-72 text-[#0F172A]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Selected Location</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200">
                    Dynamic Search
                  </span>
                </div>

                <div className="mt-2.5">
                  <h3 className="text-[18px] font-bold text-[#0F172A] leading-tight">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-[13px] text-[#475569] font-medium">
                    {selectedLocation.state}, India
                  </p>
                </div>

                <div className="mt-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 text-[12px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] font-medium">Latitude:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {selectedLocation.coordinates.lat.toFixed(4)}° N
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] font-medium">Longitude:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {selectedLocation.coordinates.lng.toFixed(4)}° E
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[#B45309] bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                  <span>
                    Location selected via geocoding. Backend coordinate sensor integration pending.
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
