"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Bike,
  ChefHat,
  Clock,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLiveData } from "./live-data-provider";
import { formatFcfaCompact } from "@/lib/utils";
import { statusLabel } from "@/lib/utils";

const REVENUE_GOAL_XAF = 100_000;

function RevenueGauge({ value, goal }: { value: number; goal: number }) {
  const pct = Math.max(0, Math.min(1, value / goal));
  const size = 152;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#f5f3ef"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#nyamaGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
        />
        <defs>
          <linearGradient id="nyamaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F57C20" />
            <stop offset="100%" stopColor="#D4A017" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            color: "#3D3D3D",
            letterSpacing: "-0.02em",
          }}
        >
          {formatFcfaCompact(value)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#6B7280" }}>
          sur {formatFcfaCompact(goal)}
        </span>
        <span
          className="mt-1 text-[11px] font-bold"
          style={{ color: pct >= 1 ? "#16a34a" : "#F57C20" }}
        >
          {Math.round(pct * 100)}%
        </span>
      </div>
    </div>
  );
}

function RidersBadge({ count }: { count: number }) {
  // Generate 5 initial-avatars as overlap circles (mock). When Agent A
  // provides avatarUrl, switch this to render real photos.
  const avatars = ["KM", "AT", "PB", "DN", "FK"];
  const colors = ["#F57C20", "#1B4332", "#D4A017", "#7c3aed", "#0891b2"];

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="flex -space-x-2">
        {avatars.slice(0, Math.min(5, Math.max(1, count))).map((a, i) => (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
            style={{ backgroundColor: colors[i] }}
          >
            {a}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-bold"
          style={{ color: "#3D3D3D", fontFamily: "var(--font-space-mono), monospace" }}
        >
          {count}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
          Riders en ligne
        </p>
      </div>
      <Bike className="h-5 w-5" style={{ color: "#F57C20" }} />
    </div>
  );
}

function CooksBadge({ count }: { count: number }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: "#f0fdf4" }}
      >
        <ChefHat className="h-4 w-4" style={{ color: "#1B4332" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-bold"
          style={{ color: "#3D3D3D", fontFamily: "var(--font-space-mono), monospace" }}
        >
          {count}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
          Restos ouverts
        </p>
      </div>
    </div>
  );
}

export interface Alert {
  id: string;
  severity: "red" | "orange";
  icon: React.ElementType;
  title: string;
  detail: string;
}

export function MetricsColumn() {
  const { overview, map } = useLiveData();

  // Break down in-progress orders
  const { inPrep, delivering, waiting, total } = useMemo(() => {
    const o = overview.ordersInProgress ?? {};
    const inPrep = (o.preparing ?? 0) + (o.confirmed ?? 0) + (o.ready ?? 0);
    const delivering = (o.delivering ?? 0) + (o.picked_up ?? 0) + (o.assigned ?? 0);
    const waiting = o.pending ?? 0;
    const total = Object.values(o).reduce((a, b) => a + (b ?? 0), 0);
    return { inPrep, delivering, waiting, total };
  }, [overview.ordersInProgress]);

  // Compute alerts locally from live state
  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    const now = Date.now();

    // Stuck orders (>20min in the same status)
    const stuck = map.activeOrders.filter((o) => {
      const ts = o.statusChangedAt ?? o.createdAt;
      if (!ts) return false;
      return now - new Date(ts).getTime() > 20 * 60_000;
    });
    if (stuck.length > 0) {
      list.push({
        id: "stuck",
        severity: "red",
        icon: AlertTriangle,
        title: `${stuck.length} commande${stuck.length > 1 ? "s" : ""} bloquée${stuck.length > 1 ? "s" : ""} > 20 min`,
        detail: stuck
          .slice(0, 2)
          .map((o) => `${o.id} (${statusLabel(o.status)})`)
          .join(" · "),
      });
    }

    // Demand spike — if more than 8 orders pending+confirmed, flag it
    if (inPrep + waiting >= 8) {
      list.push({
        id: "spike",
        severity: "orange",
        icon: TrendingUp,
        title: "Pic de demande détecté",
        detail: `${inPrep + waiting} commandes en attente/prep · envisagez d'alerter + de riders`,
      });
    }

    // Offline riders mid-delivery: riders assigned to an order but with status "offline"
    const dropOffs = map.riders.filter(
      (r) =>
        r.status === "offline" &&
        map.activeOrders.some((o) => o.riderId === r.id && o.status !== "delivered"),
    );
    if (dropOffs.length > 0) {
      list.push({
        id: "dropoff",
        severity: "red",
        icon: Bike,
        title: `${dropOffs.length} rider${dropOffs.length > 1 ? "s" : ""} disparu${dropOffs.length > 1 ? "s" : ""} en cours de livraison`,
        detail: dropOffs.map((r) => r.name).join(", "),
      });
    }

    // Idle riders — available with 0 orders
    const idle = map.riders.filter(
      (r) => r.status === "available" && !map.activeOrders.some((o) => o.riderId === r.id),
    );
    if (idle.length >= 5) {
      list.push({
        id: "idle",
        severity: "orange",
        icon: Users,
        title: `${idle.length} riders inactifs`,
        detail: "Zone possiblement sur-staffée",
      });
    }

    return list;
  }, [map, inPrep, waiting]);

  return (
    <div className="flex flex-col gap-4">
      {/* Giant headline */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #F57C20, #E06A10)",
          boxShadow: "0 8px 32px rgba(160,60,0,0.25)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Commandes en cours
          </span>
        </div>
        <p
          className="leading-none font-bold text-white"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "clamp(3rem, 8vw, 4.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          {total}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-white">
          <div className="rounded-lg bg-white/15 px-2 py-2">
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
              {inPrep}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-white/80">
              En préparation
            </p>
          </div>
          <div className="rounded-lg bg-white/15 px-2 py-2">
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
              {delivering}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-white/80">
              En livraison
            </p>
          </div>
          <div className="rounded-lg bg-white/15 px-2 py-2">
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
              {waiting}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-white/80">
              En attente
            </p>
          </div>
        </div>
      </div>

      {/* CA gauge */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#6B7280" }}
            >
              CA du jour
            </p>
            <p className="text-sm mt-0.5" style={{ color: "#3D3D3D" }}>
              Objectif journalier
            </p>
          </div>
          <Clock className="h-4 w-4" style={{ color: "#6B7280" }} />
        </div>
        <div className="flex items-center justify-center py-1">
          <RevenueGauge value={overview.todayRevenue} goal={REVENUE_GOAL_XAF} />
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px]" style={{ color: "#6B7280" }}>
          <span>{overview.todayOrdersCount} commandes</span>
          <span>Livraison moy. {overview.avgDeliveryTime} min</span>
        </div>
      </div>

      {/* Riders + cooks */}
      <RidersBadge count={overview.activeRiders} />
      <CooksBadge count={overview.activeCooks} />

      {/* Alerts */}
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4" style={{ color: "#ef4444" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#3D3D3D" }}
          >
            Alertes ({alerts.length})
          </span>
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "#9ca3af" }}>
            Tout roule. RAS.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const color = a.severity === "red" ? "#ef4444" : "#f59e0b";
              const bg = a.severity === "red" ? "#fff1f2" : "#fef3c7";
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{ backgroundColor: bg }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white"
                  >
                    <a.icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
                      {a.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                      {a.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
