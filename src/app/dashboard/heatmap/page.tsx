"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Flame, TrendingUp, Bike, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api";
import type { HeatPoint, GrowthZone } from "@/components/maps/heatmap";

// Leaflet can only render on the client
const Heatmap = dynamic(() => import("@/components/maps/heatmap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 560,
        backgroundColor: "#f5f3ef",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6B7280",
      }}
    >
      Chargement de la carte…
    </div>
  ),
});

type OrderCoord = {
  lat: number;
  lng: number;
  cookLat?: number;
  cookLng?: number;
  weight?: number;
};

// Fallback: cluster Douala/Yaoundé pour avoir une démo visuelle quand
// /admin/analytics/heatmap renvoie 0 points (DB vide). Le `isMock` flag
// signale à l'UI qu'on est en mode démo.
function generateMockOrders(): OrderCoord[] {
  const clusters = [
    { lat: 4.0511, lng: 9.7679, r: 0.02 }, // Douala centre
    { lat: 4.0722, lng: 9.7214, r: 0.015 }, // Akwa
    { lat: 4.0329, lng: 9.7579, r: 0.02 }, // Bonanjo
    { lat: 3.848, lng: 11.5021, r: 0.03 }, // Yaoundé centre
    { lat: 3.8661, lng: 11.5174, r: 0.02 }, // Bastos
  ];
  const out: OrderCoord[] = [];
  clusters.forEach((c, idx) => {
    const count = 30 + idx * 8;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * c.r;
      out.push({
        lat: c.lat + Math.cos(angle) * dist,
        lng: c.lng + Math.sin(angle) * dist,
        cookLat: c.lat + (Math.random() - 0.5) * c.r * 0.5,
        cookLng: c.lng + (Math.random() - 0.5) * c.r * 0.5,
        weight: Math.random(),
      });
    }
  });
  return out;
}

function bucketizeGrowthZones(orders: OrderCoord[]): GrowthZone[] {
  // Grid bucketing — cells with high demand / low supply become growth zones
  const GRID = 0.015;
  type Cell = {
    lat: number;
    lng: number;
    demand: number;
    supply: Set<string>;
  };
  const cells = new Map<string, Cell>();
  for (const o of orders) {
    const gx = Math.round(o.lat / GRID) * GRID;
    const gy = Math.round(o.lng / GRID) * GRID;
    const k = `${gx.toFixed(4)}:${gy.toFixed(4)}`;
    const c = cells.get(k) ?? { lat: gx, lng: gy, demand: 0, supply: new Set() };
    c.demand += 1;
    if (o.cookLat && o.cookLng) {
      c.supply.add(`${o.cookLat.toFixed(3)}:${o.cookLng.toFixed(3)}`);
    }
    cells.set(k, c);
  }
  const all = [...cells.values()];
  // Growth = demand >= p75 and supply <= p25
  const demands = all.map((c) => c.demand).sort((a, b) => a - b);
  const supplies = all.map((c) => c.supply.size).sort((a, b) => a - b);
  const p75 = demands[Math.floor(demands.length * 0.75)] ?? 0;
  const p25supply = supplies[Math.floor(supplies.length * 0.25)] ?? 0;
  return all
    .filter((c) => c.demand >= p75 && c.supply.size <= p25supply)
    .slice(0, 5)
    .map((c) => ({
      lat: c.lat,
      lng: c.lng,
      demand: c.demand,
      supply: c.supply.size,
      label: `Forte demande, peu d'offre`,
    }));
}

function computeCentroid(
  orders: OrderCoord[]
): { lat: number; lng: number; label: string } | null {
  if (!orders.length) return null;
  const lat = orders.reduce((s, o) => s + o.lat, 0) / orders.length;
  const lng = orders.reduce((s, o) => s + o.lng, 0) / orders.length;
  return { lat, lng, label: "Centre de gravité des enlèvements en attente" };
}

export default function HeatmapPage() {
  const [orders, setOrders] = useState<OrderCoord[]>([]);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await apiClient.get<{ points?: OrderCoord[]; count?: number }>(
          "/admin/analytics/heatmap",
          { period: "24h" },
        );
        if (!cancelled && d?.points?.length) {
          setOrders(d.points);
          setIsMock(false);
          return;
        }
        // Si la heatmap est vide, on garde les mocks pour avoir une démo visuelle
        if (!cancelled) {
          setOrders(generateMockOrders());
          setIsMock(true);
        }
      } catch {
        if (!cancelled) {
          setOrders(generateMockOrders());
          setIsMock(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const points: HeatPoint[] = useMemo(
    () => orders.map((o) => [o.lat, o.lng, o.weight ?? 0.8]),
    [orders]
  );
  const growthZones = useMemo(() => bucketizeGrowthZones(orders), [orders]);
  const centroid = useMemo(() => computeCentroid(orders), [orders]);

  const center: [number, number] = useMemo(() => {
    if (orders.length) {
      const lat = orders.reduce((s, o) => s + o.lat, 0) / orders.length;
      const lng = orders.reduce((s, o) => s + o.lng, 0) / orders.length;
      return [lat, lng];
    }
    return [4.05, 9.76];
  }, [orders]);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            Carte de chaleur — Demande sur 24h
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Concentration des commandes, zones de croissance suggérées et
            position optimale livreur.
          </p>
        </div>
      </div>

      {isMock && (
        <Alert variant="warning">
          <Flame className="h-4 w-4" />
          <AlertTitle>Données simulées</AlertTitle>
          <AlertDescription>
            Aucune commande sur les dernières 24h dans <code>/admin/analytics/heatmap</code> —
            affichage d&apos;un jeu de données client-side pour la démo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4" style={{ color: "#E8413C" }} />
              Commandes 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: "#D4A017" }} />
              Zones de croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{growthZones.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Forte demande, offre cuisinière faible
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="h-4 w-4" style={{ color: "#2563eb" }} />
              Position optimale livreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {centroid ? (
              <p className="text-sm font-mono">
                {centroid.lat.toFixed(4)}, {centroid.lng.toFixed(4)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Vue carte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Heatmap
            center={center}
            zoom={12}
            points={points}
            growthZones={growthZones}
            riderCentroid={centroid}
            height={560}
          />
        </CardContent>
      </Card>
    </div>
  );
}
