"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// leaflet.heat extends L with L.heatLayer
import "leaflet.heat";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type HeatPoint = [number, number, number?]; // lat, lng, weight

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = (L as any).heatLayer(points, {
      radius: 30,
      blur: 25,
      maxZoom: 14,
      gradient: {
        0.2: "#1B4332",
        0.4: "#D4A017",
        0.6: "#F57C20",
        0.8: "#E8413C",
        1.0: "#991b1b",
      },
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [points, map]);
  return null;
}

export interface GrowthZone {
  lat: number;
  lng: number;
  demand: number;
  supply: number;
  label: string;
}

interface HeatmapProps {
  center: [number, number];
  zoom?: number;
  points: HeatPoint[];
  growthZones?: GrowthZone[];
  riderCentroid?: { lat: number; lng: number; label: string } | null;
  height?: number;
}

const GROWTH_ICON = L.divIcon({
  className: "nyama-growth-marker",
  html: `<div style="background:#D4A017;width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">⚡</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const CENTROID_ICON = L.divIcon({
  className: "nyama-centroid-marker",
  html: `<div style="background:#2563eb;width:34px;height:34px;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;">🛵</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function Heatmap({
  center,
  zoom = 12,
  points,
  growthZones = [],
  riderCentroid = null,
  height = 560,
}: HeatmapProps) {
  return (
    <div style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
        {growthZones.map((g, i) => (
          <Marker
            key={`growth-${i}`}
            position={[g.lat, g.lng]}
            icon={GROWTH_ICON}
          >
            <Popup>
              <strong>Zone de croissance</strong>
              <div>{g.label}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>
                Demande: {g.demand} cmd / Cuisinières: {g.supply}
              </div>
            </Popup>
          </Marker>
        ))}
        {riderCentroid && (
          <Marker
            position={[riderCentroid.lat, riderCentroid.lng]}
            icon={CENTROID_ICON}
          >
            <Popup>
              <strong>Position optimale livreur</strong>
              <div>{riderCentroid.label}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
