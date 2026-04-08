"use client";

import { useMemo, useState } from "react";
import { LeafletMap, type MapMarker } from "@/components/maps";
import { cityCenter, mockTrip } from "@/lib/geo";
import { Bike, MapPin, Package } from "lucide-react";
import type { Delivery } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

interface DeliveriesMapProps {
  deliveries: Delivery[];
}

export function DeliveriesMap({ deliveries }: DeliveriesMapProps) {
  const active = useMemo(
    () =>
      deliveries.filter((d) =>
        ["assigned", "picked_up", "delivering"].includes(d.status)
      ),
    [deliveries]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    active.forEach((d) => {
      const trip = mockTrip(d.id, d.city);
      list.push({
        id: `${d.id}-rider`,
        type: "rider",
        lat: trip.rider[0],
        lng: trip.rider[1],
        title: d.riderName ?? "Livreur",
        subtitle: `${d.clientName} — ${d.status}`,
        routeTo: { lat: trip.client[0], lng: trip.client[1] },
      });
      list.push({
        id: `${d.id}-rest`,
        type: "restaurant",
        lat: trip.restaurant[0],
        lng: trip.restaurant[1],
        title: d.pickupAddress ?? "Restaurant",
      });
      list.push({
        id: `${d.id}-client`,
        type: "client",
        lat: trip.client[0],
        lng: trip.client[1],
        title: d.clientName,
        subtitle: d.deliveryAddress ?? d.neighborhood,
      });
    });
    return list;
  }, [active]);

  const center = useMemo(() => {
    if (active.length === 0) return cityCenter("Douala");
    const t = mockTrip(active[0].id, active[0].city);
    return t.rider;
  }, [active]);

  return (
    <div
      className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_320px]"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="relative">
        <LeafletMap
          center={center}
          zoom={12}
          height={520}
          markers={markers}
          selectedId={selectedId ? `${selectedId}-rider` : null}
        />
        {/* Legend */}
        <div
          className="absolute bottom-3 left-3 rounded-xl px-3 py-2 text-[10px] font-semibold space-y-1"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        >
          <LegendDot color="#F57C20" label="Livreur" />
          <LegendDot color="#1B4332" label="Restaurant" />
          <LegendDot color="#D4A017" label="Client" />
        </div>
      </div>

      {/* Sidebar — active deliveries list */}
      <aside
        className="overflow-y-auto max-h-[520px] border-l"
        style={{ borderColor: "#f5f3ef" }}
      >
        <header
          className="sticky top-0 px-4 py-3 border-b z-10"
          style={{ backgroundColor: "#ffffff", borderColor: "#f5f3ef" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "#6B7280" }}
          >
            Livraisons actives ({active.length})
          </p>
        </header>
        {active.length === 0 ? (
          <p className="px-4 py-6 text-xs text-center" style={{ color: "#6B7280" }}>
            Aucune livraison en cours
          </p>
        ) : (
          <ul>
            {active.map((d) => (
              <li
                key={d.id}
                className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                  selectedId === d.id ? "bg-[#fff7ed]" : "hover:bg-[#fbf9f5]"
                }`}
                style={{ borderColor: "#f5f3ef" }}
                onClick={() => setSelectedId(d.id)}
              >
                <div className="flex items-start gap-2">
                  <Bike className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#F57C20" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
                      #{d.orderId.slice(-6).toUpperCase()} — {d.riderName ?? "Non assigné"}
                    </p>
                    <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#6B7280" }}>
                      <Package className="h-3 w-3" />
                      {d.clientName}
                    </p>
                    {(d.neighborhood || d.city) && (
                      <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "#6B7280" }}>
                        <MapPin className="h-3 w-3" />
                        {d.neighborhood ? `${d.neighborhood}, ${d.city}` : d.city}
                      </p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>
                      {formatRelative(d.assignedAt ?? d.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: "#3D3D3D" }}>
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
