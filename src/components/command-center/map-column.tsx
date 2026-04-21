"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Bike, ChefHat, Home, Route } from "lucide-react";
import { useLiveData } from "./live-data-provider";
import { InterveneDialog } from "./intervene-dialog";
import type { FilterState } from "./command-map";

// Leaflet runs client-only
const CommandMap = dynamic(() => import("./command-map"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        width: "100%",
        borderRadius: 16,
        backgroundColor: "#f5f3ef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6B7280",
        fontSize: 13,
      }}
    >
      Chargement de la carte…
    </div>
  ),
});

function FilterChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
      style={
        active
          ? {
              background: "linear-gradient(135deg, #F57C20, #E06A10)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(245,124,32,0.3)",
            }
          : {
              backgroundColor: "#f5f3ef",
              color: "#6B7280",
            }
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function MapColumn() {
  const { map } = useLiveData();
  const [filters, setFilters] = useState<FilterState>({
    clients: true,
    cooks: true,
    riders: true,
    routes: true,
  });
  const [interveningOrder, setInterveningOrder] = useState<string | null>(null);

  const toggle = (k: keyof FilterState) =>
    setFilters((f) => ({ ...f, [k]: !f[k] }));

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        minHeight: 560,
      }}
    >
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b" style={{ borderColor: "#f0ece5" }}>
        <div>
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            Carte opérationnelle
          </h2>
          <p className="text-[11px]" style={{ color: "#6B7280" }}>
            {map.riders.length} riders · {map.cooks.length} cooks ·{" "}
            {map.activeOrders.length} courses actives
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={filters.riders}
            onClick={() => toggle("riders")}
            icon={Bike}
            label="Riders"
          />
          <FilterChip
            active={filters.cooks}
            onClick={() => toggle("cooks")}
            icon={ChefHat}
            label="Cooks"
          />
          <FilterChip
            active={filters.clients}
            onClick={() => toggle("clients")}
            icon={Home}
            label="Clients"
          />
          <FilterChip
            active={filters.routes}
            onClick={() => toggle("routes")}
            icon={Route}
            label="Routes"
          />
        </div>
      </div>

      <div className="flex-1" style={{ minHeight: 480 }}>
        <CommandMap data={map} filters={filters} onIntervene={setInterveningOrder} />
      </div>

      <InterveneDialog
        orderId={interveningOrder}
        onClose={() => setInterveningOrder(null)}
      />
    </div>
  );
}
