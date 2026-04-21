"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiClient } from "@/lib/api";
import type { RevenueAnalytics } from "@/lib/types";
import { formatFcfa, formatFcfaCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  TrendingUp, Banknote, ShoppingCart, Target, Download,
  ArrowUpRight, ArrowDownRight, ShoppingBag, ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "year";

const PAYMENT_COLORS: Record<string, string> = {
  ORANGE_MONEY: "#FF6600",
  MTN_MOMO: "#FFCC00",
  CASH: "#6B7280",
};

function getPaymentColor(method: string, fallbackColor?: string): string {
  return PAYMENT_COLORS[method] ?? fallbackColor ?? "#F57C20";
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(27,28,26,0.1)",
  fontSize: 12,
};

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  trend,
  sub,
  loading,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  sub?: string;
  loading: boolean;
  progress?: number;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "#fdf3ee" }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-7 w-20 mb-1" />
          ) : (
            <p
              className="text-[1.5rem] font-bold leading-tight"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              {value}
            </p>
          )}
          {trend !== undefined && !loading && (
            <span
              className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: trend >= 0 ? "#dcfce7" : "#fee2e2",
                color: trend >= 0 ? "#166534" : "#991b1b",
              }}
            >
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
          {label}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: "#b8b3ad" }}>{sub}</p>
        )}
        {progress !== undefined && !loading && (
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f5f3ef" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, progress)}%`, backgroundColor: "#F57C20" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PERIOD_LABELS: { value: Period; label: string }[] = [
    { value: "7d", label: t("common.week") },
    { value: "30d", label: t("common.month") },
    { value: "year", label: t("common.year") },
  ];

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<RevenueAnalytics>("/admin/analytics/revenue", { period });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const stats = data?.stats;

  // Prepare pie data with colors
  const pieData = (data?.paymentBreakdown ?? []).map((p) => ({
    ...p,
    fill: getPaymentColor(p.method, p.color),
  })) ?? [];

  const exportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push("Section,Label,Value1,Value2");
    lines.push(`KPI,Revenus bruts,${stats?.totalRevenueXaf ?? 0},`);
    lines.push(`KPI,Net plateforme,${stats?.netPlatformXaf ?? 0},`);
    lines.push(`KPI,Transactions,${stats?.totalTransactions ?? 0},`);
    lines.push(`KPI,Taux conversion (%),${stats?.conversionRate ?? 0},`);
    lines.push(`KPI,Panier moyen,${stats?.avgBasketXaf ?? 0},`);
    (data.weeklyRevenue ?? []).forEach((w) => {
      lines.push(`Hebdo,${w.week},${w.grossXaf},${w.commissionXaf}`);
    });
    (data.paymentBreakdown ?? []).forEach((p) => {
      lines.push(`Paiement,${p.method},${p.percentage},`);
    });
    (data.topRestaurants ?? []).forEach((r) => {
      lines.push(`Restaurant,"${r.displayName}",${r.revenueXaf},${r.orders}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nyama-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const exportXlsx = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const kpis = [
      { label: "Revenus bruts (FCFA)", value: stats?.totalRevenueXaf ?? 0 },
      { label: "Net plateforme (FCFA)", value: stats?.netPlatformXaf ?? 0 },
      { label: "Transactions", value: stats?.totalTransactions ?? 0 },
      { label: "Taux de conversion (%)", value: stats?.conversionRate ?? 0 },
      { label: "Panier moyen (FCFA)", value: stats?.avgBasketXaf ?? 0 },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpis), "KPI");
    if (data.weeklyRevenue?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.weeklyRevenue), "Revenus hebdo");
    if (data.paymentBreakdown?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.paymentBreakdown), "Mix paiements");
    if (data.topRestaurants?.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.topRestaurants), "Top restaurants");
    XLSX.writeFile(wb, `nyama-analytics-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Export Excel téléchargé");
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("analytics.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            {t("analytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period pills */}
          <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: "#f5f3ef" }}>
            {PERIOD_LABELS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                style={
                  period === p.value
                    ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                    : { color: "#6B7280" }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            disabled={!data}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ border: "1.5px solid #e8e4de", color: "#6B7280" }}
          >
            <Download className="h-3.5 w-3.5" />
            {t("analytics.exportCsv")}
          </button>
          <button
            onClick={exportXlsx}
            disabled={!data}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchRevenue} />}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" style={{ color: "#F57C20" }} />}
          label={t("analytics.totalRevenue")}
          value={stats ? formatFcfa(stats.totalRevenueXaf) : "—"}
          trend={stats?.revenueTrend}
          loading={loading}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5" style={{ color: "#2c694e" }} />}
          label={t("analytics.netPlatform")}
          value={stats ? formatFcfa(stats.netPlatformXaf) : "—"}
          sub={t("analytics.avgCommission")}
          loading={loading}
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" style={{ color: "#b45309" }} />}
          label={t("analytics.transactions")}
          value={stats?.totalTransactions.toLocaleString("fr-FR") ?? "—"}
          sub={t("analytics.completedOrders")}
          loading={loading}
        />
        <StatCard
          icon={<Target className="h-5 w-5" style={{ color: "#2563eb" }} />}
          label={t("analytics.conversionRate")}
          value={stats ? `${stats.conversionRate}%` : "—"}
          progress={stats?.conversionRate}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Revenue BarChart */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              {t("analytics.revenueEvolution")}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#F57C20" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>{t("analytics.grossRevenue")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#e8c4b0" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>{t("analytics.commission")}</span>
              </div>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[260px] rounded-xl" />
          ) : data?.weeklyRevenue && data.weeklyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.weeklyRevenue} margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatFcfaCompact(Number(v)).replace(" FCFA", "")}
                />
                <Tooltip
                  cursor={{ fill: "rgba(160,60,0,0.04)" }}
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatFcfa(Number(value)),
                    name === "grossXaf" ? t("analytics.grossRevenue") : t("analytics.commission"),
                  ]}
                />
                <Bar dataKey="grossXaf" stackId="a" fill="#F57C20" radius={[0, 0, 0, 0]} />
                <Bar dataKey="commissionXaf" stackId="a" fill="#e8c4b0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-sm" style={{ color: "#6B7280" }}>{t("analytics.noRevenueData")}</p>
            </div>
          )}
        </div>

        {/* Payment PieChart */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
        >
          <h2
            className="text-lg font-semibold italic mb-4"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("analytics.paymentMethod")}
          </h2>
          {loading ? (
            <Skeleton className="h-[260px] rounded-xl" />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="percentage"
                  nameKey="method"
                  label={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                {/* Center label */}
                <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold" fill="#6B7280">
                  100%
                </text>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-[10px]" fill="#b8b3ad">
                  {t("analytics.total")}
                </text>
                <Tooltip
                  formatter={(value) => [`${value}%`, t("analytics.part")]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value, entry) => {
                    const pct = (entry.payload as { percentage?: number })?.percentage ?? 0;
                    const label = value.replace(/_/g, " ");
                    return `${label} (${pct}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-sm" style={{ color: "#6B7280" }}>{t("analytics.noPaymentData")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Restaurants + Weekly Insight */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Top Restaurants (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              {t("analytics.topRestaurants")}
            </h2>
            <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "#F57C20" }}>
              {t("common.seeAll")} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : data?.topRestaurants && data.topRestaurants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#fbf9f5" }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Restaurant</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#6B7280" }}>{t("analytics.quarterCol")}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{t("analytics.ordersCol")}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{t("analytics.revenueCol")}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#6B7280" }}>{t("analytics.commissionCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topRestaurants ?? []).map((r) => (
                      <tr key={r.id} className="hover:bg-[#fbf9f5] transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold" style={{ color: "#3D3D3D" }}>{r.displayName}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs" style={{ color: "#6B7280" }}>{r.quarterName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm" style={{ color: "#3D3D3D" }}>{r.orders.toLocaleString("fr-FR")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold" style={{ color: "#F57C20" }}>{formatFcfa(r.revenueXaf)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs" style={{ color: "#6B7280" }}>{formatFcfa(r.commissionXaf)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center">
                <ShoppingBag className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                <p className="text-sm" style={{ color: "#6B7280" }}>{t("analytics.noRestaurant")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: insight + basket */}
        <div className="lg:col-span-2 space-y-4">
          <h2
            className="text-lg font-semibold italic"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("analytics.weeklyAnalysis")}
          </h2>

          {/* Insight card */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <p className="text-sm leading-relaxed text-white/90">
              {t("analytics.insightText")}{" "}
              <span className="font-bold text-white">(+22%)</span> {t("analytics.insightMonth")}
            </p>
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <p className="text-xs text-white/80 leading-relaxed">
                <span className="font-bold text-white">{t("analytics.recommendation")}</span>{" "}
                {t("analytics.recommendationText")}
              </p>
            </div>
            <a
              href="#"
              className="inline-block text-xs font-semibold text-white underline underline-offset-2"
            >
              {t("analytics.insightDetailLink")} &rarr;
            </a>
          </div>

          {/* Avg basket card */}
          <div
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                {t("analytics.avgBasket")}
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mt-1" />
              ) : (
                <p
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
                >
                  {stats ? formatFcfa(stats.avgBasketXaf) : "—"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>
    </div>
  );
}
