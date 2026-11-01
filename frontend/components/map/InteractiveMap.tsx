"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ClimateLayer } from "@/hooks";
import { GeocodedLocation } from "@/types";

interface InteractiveMapProps {
  activeLayer: ClimateLayer;
  selectedCityId?: string;
  selectedLocation?: GeocodedLocation | null;
  resetKey?: number;
  onCitySelect?: (cityId: string) => void;
  onClearSelection?: () => void;
}

// Dynamically import Leaflet with SSR disabled
const LeafletMapView = dynamic(() => import("./LeafletMapView"), {
  ssr: false,
});

export const InteractiveMap: React.FC<InteractiveMapProps> = (props) => {
  return (
    <div className="relative w-full h-full">
      <LeafletMapView {...props} />
    </div>
  );
};
