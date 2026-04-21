"use client";

import type { Customer } from "@/lib/types";
import { Crown, AlertTriangle, UserPlus, UserX, Send } from "lucide-react";

export interface SegmentCounts {
  vip: number;
  atRisk: number;
  newcomers: number;
  lost: number;
}

export type SegmentKey = keyof SegmentCounts;

export function computeSegments(customers: Customer[]): SegmentCounts {
  const now = Date.now();
  const DAY = 86_400_000;
  let vip = 0, atRisk = 0, newcomers = 0, lost = 0;

  for (const c of customers) {
    const lastOrderTs = c.lastOrderAt ? new Date(c.lastOrderAt).getTime() : 0;
    const createdTs = c.createdAt ? new Date(c.createdAt).getTime() : 0;
    const daysSinceOrder = lastOrderTs ? (now - lastOrderTs) / DAY : Infinity;
    const daysSinceJoin = createdTs ? (now - createdTs) / DAY : Infinity;

    if ((c.totalSpentXaf ?? 0) >= 100_000 || (c.totalOrders ?? 0) >= 20) vip++;
    if (daysSinceJoin <= 30) newcomers++;
    if (daysSinceOrder >= 30 && daysSinceOrder < 90) atRisk++;
    if (daysSinceOrder >= 90) lost++;
  }
  return { vip, atRisk, newcomers, lost };
}

const SEGMENTS = [
  {
    key: "vip" as const,
    label: "Clients VIP",
    hint: "≥ 100 000 FCFA dépensés ou ≥ 20 commandes",
    icon: Crown,
    color: "#b45309",
    bg: "#fef3c7",
  },
  {
    key: "newcomers" as const,
    label: "Nouveaux",
    hint: "Inscrits dans les 30 derniers jours",
    icon: UserPlus,
    color: "#166534",
    bg: "#dcfce7",
  },
  {
    key: "atRisk" as const,
    label: "À risque",
    hint: "Pas de commande depuis 30 à 90 jours",
    icon: AlertTriangle,
    color: "#c2410c",
    bg: "#ffedd5",
  },
  {
    key: "lost" as const,
    label: "Perdus",
    hint: "Pas de commande depuis 90+ jours",
    icon: UserX,
    color: "#991b1b",
    bg: "#fee2e2",
  },
];

export function CustomerSegments({
  counts,
  total,
  onCampaign,
}: {
  counts: SegmentCounts;
  total: number;
  onCampaign?: (segment: SegmentKey) => void;
}) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {SEGMENTS.map((s) => {
        const Icon = s.icon;
        const value = counts[s.key];
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div
            key={s.key}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: s.bg }}
              >
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                {pct}%
              </span>
            </div>
            <p
              className="text-2xl font-bold leading-none"
              style={{
                fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                color: "#3D3D3D",
              }}
            >
              {value.toLocaleString("fr-FR")}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#3D3D3D" }}>
              {s.label}
            </p>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>{s.hint}</p>
            {onCampaign && value > 0 && (
              <button
                onClick={() => onCampaign(s.key)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-colors"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                <Send className="h-3 w-3" />
                Campagne
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
