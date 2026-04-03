"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useApi } from "@/hooks/use-api";
import type { OrdersResponse } from "@/lib/types";
import { ErrorState } from "@/components/ui/error-state";
import { formatFcfaCompact, statusLabel, statusColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Static data ────────────────────────────────────────────────────────────────

const volumeData = [
  { date: "28 Mar", commandes: 12, revenue: 42_000 },
  { date: "29 Mar", commandes: 18, revenue: 63_000 },
  { date: "30 Mar", commandes: 15, revenue: 52_500 },
  { date: "31 Mar", commandes: 25, revenue: 87_500 },
  { date: "1 Avr", commandes: 22, revenue: 77_000 },
  { date: "2 Avr", commandes: 30, revenue: 105_000 },
  { date: "3 Avr", commandes: 28, revenue: 98_000 },
];

const paymentData = [
  { name: "Orange Money", value: 45, color: "#FF6600" },
  { name: "MTN MoMo", value: 35, color: "#FFCC00" },
  { name: "Cash", value: 20, color: "#6B7280" },
];

const quarterData = [
  { quartier: "Akwa", commandes: 45 },
  { quartier: "Bonapriso", commandes: 38 },
  { quartier: "Bonabéri", commandes: 32 },
  { quartier: "Deido", commandes: 28 },
  { quartier: "New Bell", commandes: 22 },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  preparing: "#3B82F6",
  ready: "#8B5CF6",
  delivering: "#F97316",
  delivered: "#16A34A",
  cancelled: "#DC2626",
};

const sharedTooltipStyle = {
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export default function AnalyticsPage() {
  const {
    data: ordersRes,
    error: ordersError,
    refetch: ordersRefetch,
  } = useApi<OrdersResponse>("/admin/orders", { limit: 100, page: 1 });

  const statusData = useMemo(() => {
    if (!ordersRes?.data) return [];
    const counts: Record<string, number> = {};
    for (const order of ordersRes.data) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([status, count]) => ({
        status: statusLabel(status),
        count,
        color: STATUS_COLORS[status] ?? "#6B7280",
      }))
      .sort((a, b) => b.count - a.count);
  }, [ordersRes]);

  if (ordersError)
    return <ErrorState message={ordersError} onRetry={ordersRefetch} />;

  return (
    <div className="space-y-6">
      {/* Section 1 — Volume + Revenue dual axis */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            📦 Volume de commandes (7 jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={volumeData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradCommandes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4332" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A017" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  formatFcfaCompact(v).replace(" FCFA", "")
                }
                width={56}
              />
              <Tooltip
                contentStyle={sharedTooltipStyle}
                formatter={(value, name) => {
                  if (name === "revenue")
                    return [formatFcfaCompact(Number(value)), "Revenus"];
                  return [Number(value), "Commandes"];
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) =>
                  value === "commandes" ? "Commandes" : "Revenus"
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="commandes"
                stroke="#1B4332"
                strokeWidth={2.5}
                fill="url(#gradCommandes)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#D4A017"
                strokeWidth={2.5}
                fill="url(#gradRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 2 + 3 side by side */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Payment distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              💳 Répartition des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value)}%`, "Part"]}
                  contentStyle={sharedTooltipStyle}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value, entry) => {
                    const d = paymentData.find((p) => p.name === value);
                    return `${value} (${d?.value ?? (entry as { payload?: { value?: number } }).payload?.value ?? 0}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by status — horizontal bar */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              📊 Commandes par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={statusData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 11, fill: "#374151" }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value), "Commandes"]}
                    contentStyle={sharedTooltipStyle}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 4 — Top 5 quartiers */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            📍 Top 5 quartiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={quarterData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="quartier"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                formatter={(value) => [Number(value), "Commandes"]}
                contentStyle={sharedTooltipStyle}
              />
              <Bar dataKey="commandes" fill="#1B4332" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        📊 Les analytics avancées (heatmap géospatiale, analyse par cohortes,
        funnel acquisition, intégration Facebook/TikTok Ads) seront disponibles
        dans la v2 avec les endpoints /analytics/* dédiés.
      </p>
    </div>
  );
}
