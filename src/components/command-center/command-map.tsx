"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveMap } from "@/lib/admin-socket";
import { formatFcfa } from "@/lib/utils";

// Fix default marker icons (Next/Webpack don't bundle them)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function pinIcon(color: string, label: string, pulse = false) {
  const pulseRing = pulse
    ? `<span style="
        position:absolute;top:-4px;left:-4px;width:36px;height:36px;
        border-radius:50%;background:${color}33;
        animation:nyama-ping 1.6s ease-out infinite;
      "></span>`
    : "";
  return L.divIcon({
    className: "nyama-cc-marker",
    html: `
      <div style="position:relative;width:28px;height:28px;">
        ${pulseRing}
        <div style="
          position:relative;z-index:1;
          background:${color};
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
          border:2px solid #fff;
        "><span style="transform:rotate(45deg);font-size:13px;">${label}</span></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

// Cook icon with small pending-orders badge
function cookIcon(pending: number, open: boolean) {
  const base = open ? "#1B4332" : "#9ca3af";
  const badge =
    pending > 0
      ? `<div style="
          position:absolute;top:-6px;right:-8px;z-index:2;
          min-width:18px;height:18px;padding:0 4px;
          background:#F57C20;color:#fff;border-radius:9px;
          font-size:10px;font-weight:700;line-height:18px;
          text-align:center;border:2px solid #fff;
        ">${pending}</div>`
      : "";
  return L.divIcon({
    className: "nyama-cc-marker",
    html: `
      <div style="position:relative;width:28px;height:28px;">
        ${badge}
        <div style="
          background:${base};
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
          border:2px solid #fff;
        "><span style="transform:rotate(45deg);font-size:13px;">🏪</span></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function riderColor(status: string) {
  if (status === "delivering") return "#F57C20";
  if (status === "available") return "#1B4332";
  return "#9ca3af";
}

export interface FilterState {
  clients: boolean;
  cooks: boolean;
  riders: boolean;
  routes: boolean;
}

interface AutoFitProps {
  points: Array<[number, number]>;
}

function AutoFit({ points }: AutoFitProps) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

interface CommandMapProps {
  data: LiveMap;
  filters: FilterState;
  onIntervene: (orderId: string) => void;
  center?: [number, number];
}

export default function CommandMap({
  data,
  filters,
  onIntervene,
  center = [4.048, 9.7085], // Douala
}: CommandMapProps) {
  const allPoints = useMemo(() => {
    const pts: Array<[number, number]> = [];
    if (filters.riders) data.riders.forEach((r) => pts.push([r.lat, r.lng]));
    if (filters.cooks) data.cooks.forEach((c) => pts.push([c.lat, c.lng]));
    if (filters.clients) {
      data.activeOrders.forEach((o) => {
        if (o.clientLat != null && o.clientLng != null) pts.push([o.clientLat, o.clientLng]);
      });
    }
    return pts;
  }, [data, filters]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes nyama-ping {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Cook markers */}
        {filters.cooks &&
          data.cooks.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={cookIcon(c.pendingOrders, c.isOpen)}
            >
              <Popup>
                <div style={{ fontFamily: "system-ui", minWidth: 160 }}>
                  <strong style={{ color: "#3D3D3D" }}>{c.name}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>
                    {c.isOpen ? "🟢 Ouvert" : "🔴 Fermé"} ·{" "}
                    {c.pendingOrders} commande{c.pendingOrders > 1 ? "s" : ""}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Rider markers */}
        {filters.riders &&
          data.riders.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={pinIcon(riderColor(r.status), "🛵", r.status === "delivering")}
            >
              <Popup>
                <div style={{ fontFamily: "system-ui", minWidth: 160 }}>
                  <strong style={{ color: "#3D3D3D" }}>{r.name}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>
                    Statut : {r.status}
                  </p>
                  {r.currentOrderId && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#F57C20" }}>
                      Course #{r.currentOrderId}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Client / order markers */}
        {filters.clients &&
          data.activeOrders
            .filter((o) => o.clientLat != null && o.clientLng != null)
            .map((o) => (
              <Marker
                key={`client-${o.id}`}
                position={[o.clientLat!, o.clientLng!]}
                icon={pinIcon("#D4A017", "🏠", o.status !== "delivered")}
              >
                <Popup>
                  <div style={{ fontFamily: "system-ui", minWidth: 200 }}>
                    <strong style={{ color: "#3D3D3D" }}>
                      {o.clientName} · {o.id}
                    </strong>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>
                      {o.itemSummary ?? "Commande"}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#F57C20",
                        fontWeight: 700,
                      }}
                    >
                      {formatFcfa(o.totalXaf)} · {o.status}
                    </p>
                    <button
                      onClick={() => onIntervene(o.id)}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        background: "#F57C20",
                        color: "white",
                        border: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                      }}
                    >
                      Intervenir
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

        {/* Active delivery polylines: cook → rider → client */}
        {filters.routes &&
          data.activeOrders
            .filter(
              (o) =>
                o.cookLat != null &&
                o.cookLng != null &&
                o.clientLat != null &&
                o.clientLng != null,
            )
            .map((o) => {
              const positions: Array<[number, number]> = [];
              if (o.cookLat != null && o.cookLng != null)
                positions.push([o.cookLat, o.cookLng]);
              if (o.riderLat != null && o.riderLng != null)
                positions.push([o.riderLat, o.riderLng]);
              if (o.clientLat != null && o.clientLng != null)
                positions.push([o.clientLat, o.clientLng]);
              if (positions.length < 2) return null;
              return (
                <Polyline
                  key={`route-${o.id}`}
                  positions={positions}
                  pathOptions={{
                    color: "#F57C20",
                    weight: 3,
                    opacity: 0.65,
                    dashArray: "6 6",
                  }}
                />
              );
            })}

        <AutoFit points={allPoints} />
      </MapContainer>
    </div>
  );
}
