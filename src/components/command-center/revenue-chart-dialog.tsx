"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLiveData } from "./live-data-provider";
import { formatFcfa, formatFcfaCompact } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

interface Point {
  t: string;
  revenue: number;
}

export function RevenueChartDialog({ open, onOpenChange }: Props) {
  const { overview } = useLiveData();
  const [series, setSeries] = useState<Point[]>(() => seed());

  // Tick every 10s while open — append the live "todayRevenue" to the series
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setSeries((prev) => {
        const t = new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const next = [...prev, { t, revenue: overview.todayRevenue }];
        return next.slice(-30);
      });
    }, 10_000);
    return () => clearInterval(id);
  }, [open, overview.todayRevenue]);

  const total = overview.todayRevenue;
  const delta = useMemo(() => {
    if (series.length < 2) return 0;
    return series[series.length - 1].revenue - series[0].revenue;
  }, [series]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>CA du jour — en direct</DialogTitle>
          <DialogDescription>
            Mise à jour toutes les 10 secondes
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-baseline gap-3 px-1">
          <p
            className="text-3xl font-bold"
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              color: "#3D3D3D",
              letterSpacing: "-0.02em",
            }}
          >
            {formatFcfa(total)}
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{
              color: delta >= 0 ? "#16a34a" : "#ef4444",
              backgroundColor: delta >= 0 ? "#f0fdf4" : "#fff1f2",
            }}
          >
            {delta >= 0 ? "+" : ""}
            {formatFcfaCompact(delta)} sur la fenêtre
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F57C20" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#F57C20" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(27,28,26,0.1)",
                  fontSize: 12,
                }}
                formatter={(v) => formatFcfa(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F57C20"
                strokeWidth={2}
                fill="url(#revLive)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function seed(): Point[] {
  const now = Date.now();
  const pts: Point[] = [];
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now - i * 60_000);
    const t = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    pts.push({
      t,
      revenue: 40_000 + (15 - i) * 1800 + Math.random() * 2000,
    });
  }
  return pts;
}
