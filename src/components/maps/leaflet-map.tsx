"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Webpack/Next don't bundle them)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function divIcon(color: string, label: string) {
  return L.divIcon({
    className: "nyama-marker",
    html: `<div style="
      background:${color};
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      border:2px solid #fff;
    "><span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:bold;">${label}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const RIDER_ICON = divIcon("#F57C20", "🛵");
const REST_ICON = divIcon("#1B4332", "🍴");
const CLIENT_ICON = divIcon("#D4A017", "📍");

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "rider" | "restaurant" | "client";
  title: string;
  subtitle?: string;
  routeTo?: { lat: number; lng: number };
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers: MapMarker[];
  height?: number | string;
  selectedId?: string | null;
}

function FlyTo({ markers, selectedId }: { markers: MapMarker[]; selectedId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const m = markers.find((x) => x.id === selectedId);
    if (!m) return;
    map.flyTo([m.lat, m.lng], 15, { duration: 0.8 });
  }, [selectedId, markers, map]);
  return null;
}

export default function LeafletMap({
  center,
  zoom = 12,
  markers,
  height = 500,
  selectedId,
}: LeafletMapProps) {
  return (
    <div style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => {
          const icon =
            m.type === "rider" ? RIDER_ICON : m.type === "restaurant" ? REST_ICON : CLIENT_ICON;
          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
              <Popup>
                <div style={{ fontFamily: "system-ui", minWidth: 140 }}>
                  <strong style={{ color: "#3D3D3D" }}>{m.title}</strong>
                  {m.subtitle && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>
                      {m.subtitle}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {markers
          .filter((m) => m.routeTo)
          .map((m) => (
            <Polyline
              key={`route-${m.id}`}
              positions={[
                [m.lat, m.lng],
                [m.routeTo!.lat, m.routeTo!.lng],
              ]}
              pathOptions={{ color: "#F57C20", weight: 3, opacity: 0.7, dashArray: "6 6" }}
            />
          ))}
        <FlyTo markers={markers} selectedId={selectedId} />
      </MapContainer>
    </div>
  );
}
