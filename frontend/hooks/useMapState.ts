"use client";

import { useState } from "react";
import { Coordinates } from "@/types";

export type ClimateLayer = "temperature" | "wind" | "aqi" | "heatwave" | "precipitation";

export interface MapViewport {
  center: Coordinates;
  zoom: number;
}

const DEFAULT_INDIA_VIEWPORT: MapViewport = {
  center: { lat: 21.7679, lng: 78.8718 }, // Geographic center of India
  zoom: 5,
};

export function useMapState() {
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_INDIA_VIEWPORT);
  const [activeLayer, setActiveLayer] = useState<ClimateLayer>("temperature");
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>("delhi");

  return {
    viewport,
    setViewport,
    activeLayer,
    setActiveLayer,
    selectedCityId,
    setSelectedCityId,
  };
}
