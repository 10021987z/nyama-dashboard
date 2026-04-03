"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { apiClient } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import { formatFcfa, formatFcfaCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import {
  ShoppingBag,
  Package,
  TrendingUp,
  CreditCard,
  Users,
  ChefHat,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
} from "lucide-react";

// ── Sub-components ─────────────────────────────────────────────────────────────

const PERIOD_KEYS = ["today", "week", "month"] as const;

function PeriodFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (v: string) => void;
}) {
  const { t } = useLanguage();

  const periodLabels: Record<string, string> = {
    today: t("common.today"),
    week: t("common.week"),
    month: t("common.month"),
  };

  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{ backgroundColor: "#f5f3ef" }}
    >
      {PERIOD_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            selected === key
              ? {
                  background: "linear-gradient(135deg, #a03c00, #c94d00)",
                  color: "#fff",
                }
              : { color: "#7c7570" }
          }
        >
          {periodLabels[key]}
        </button>
      ))}
    </div>
  );
}

function AlertBanner({ data }: { data: DashboardData | null }) {
  const { t } = useLanguage();
  const rate = data?.paymentSuccessRate ?? 0;
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-3"
      style={{ backgroundColor: "#e8f5e9" }}
    >
      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#2c694e" }} />
      <p className="flex-1 text-sm font-medium" style={{ color: "#1b4d38" }}>
        {t("dashboard.alertOps")} {t("dashboard.alertMessage")}{" "}
        {rate > 0 ? `${rate}%` : t("dashboard.atRecordLevel")}.
      </p>
      <span
        className="shrink-0 rounded-full px-3 py-0.5 text-xs font-bold text-white"
        style={{ backgroundColor: "#2c694e" }}
      >
        {t("dashboard.alertNormal")}
      </span>
    </div>
  );
}

interface KpiDef {
  title: string;
  value: string;
  trend?: { label: string; positive: boolean } | "stable";
  subtext: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  featured?: boolean;
}

function buildKpis(d: DashboardData, t: (key: string) => string): KpiDef[] {
  const ordersTrend = d.ordersTrend ?? 0;
  const revenueTrend = d.revenueTrend ?? 0;

  return [
    {
      title: t("dashboard.ordersToday").toUpperCase(),
      value: (d.ordersToday ?? 0).toLocaleString("fr-FR"),
      trend: ordersTrend !== 0
        ? { label: `${ordersTrend >= 0 ? "+" : ""}${ordersTrend}%`, positive: ordersTrend >= 0 }
        : "stable",
      subtext: t("dashboard.vsWeek"),
      icon: ShoppingBag,
      iconColor: "#f97316",
      iconBg: "#fff7ed",
    },
    {
      title: t("dashboard.ordersWeek").toUpperCase(),
      value: (d.ordersThisWeek ?? 0).toLocaleString("fr-FR"),
      subtext: t("dashboard.thisWeek"),
      icon: Package,
      iconColor: "#2c694e",
      iconBg: "#f0fdf4",
    },
    {
      title: t("dashboard.revenueToday").toUpperCase(),
      value: formatFcfa(d.revenueToday ?? 0),
      trend: revenueTrend !== 0
        ? { label: `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}%`, positive: revenueTrend >= 0 }
        : "stable",
      subtext: t("dashboard.vsYesterday"),
      icon: TrendingUp,
      iconColor: revenueTrend >= 0 ? "#16a34a" : "#ef4444",
      iconBg: revenueTrend >= 0 ? "#f0fdf4" : "#fff1f2",
    },
    {
      title: t("dashboard.revenueMonth").toUpperCase(),
      value: formatFcfaCompact(d.revenueThisMonth ?? 0),
      subtext: t("dashboard.monthProjection"),
      icon: CreditCard,
      iconColor: "#ffffff",
      iconBg: "rgba(255,255,255,0.15)",
      featured: true,
    },
    {
      title: t("dashboard.users").toUpperCase(),
      value: (d.totalUsers ?? 0).toLocaleString("fr-FR"),
      subtext: t("dashboard.totalRegistered"),
      icon: Users,
      iconColor: "#2563eb",
      iconBg: "#eff6ff",
    },
    {
      title: t("dashboard.activeCooks").toUpperCase(),
      value: String(d.totalCooks ?? 0),
      subtext: t("dashboard.partners"),
      icon: ChefHat,
      iconColor: "#2c694e",
      iconBg: "#f0fdf4",
    },
    {
      title: t("dashboard.avgBasket").toUpperCase(),
      value: formatFcfa(d.avgBasketXaf ?? 0),
      trend: "stable",
      subtext: t("dashboard.vsLastWeek"),
      icon: ShoppingBag,
      iconColor: "#b45309",
      iconBg: "#fef3c7",
    },
    {
      title: t("dashboard.paymentSuccess").toUpperCase(),
      value: `${d.paymentSuccessRate ?? 0}%`,
      subtext: t("dashboard.mobileMoney"),
      icon: CheckCircle,
      iconColor: "#16a34a",
      iconBg: "#f0fdf4",
    },
  ];
}

function KpiCard({ kpi }: { kpi: KpiDef }) {
  const { title, value, trend, subtext, icon: Icon, iconColor, iconBg, featured } = kpi;

  const cardBg = featured ? "#a03c00" : "#ffffff";
  const textColor = featured ? "#ffffff" : "#1b1c1a";
  const mutedColor = featured ? "rgba(255,255,255,0.7)" : "#7c7570";

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-shadow duration-200"
      style={{
        backgroundColor: cardBg,
        boxShadow: featured
          ? "0 8px 32px rgba(160,60,0,0.25)"
          : "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        {trend === "stable" ? (
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ backgroundColor: "#f5f3ef", color: "#7c7570" }}
          >
            STABLE
          </span>
        ) : trend ? (
          <span
            className="flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold"
            style={{
              backgroundColor: featured
                ? "rgba(255,255,255,0.15)"
                : trend.positive ? "#f0fdf4" : "#fff1f2",
              color: featured ? "#ffffff" : trend.positive ? "#16a34a" : "#ef4444",
            }}
          >
            {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.label}
          </span>
        ) : null}
      </div>

      <div>
        <p
          className="text-[1.6rem] font-bold leading-none"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: textColor }}
        >
          {value}
        </p>
        <p
          className="mt-1.5 text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: mutedColor }}
        >
          {title}
        </p>
      </div>

      <p className="text-[10px]" style={{ color: mutedColor }}>{subtext}</p>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <Skeleton className="h-11 w-11 rounded-full" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(27,28,26,0.1)",
  fontSize: 12,
};

function VolumeChart({ data }: { data: DashboardData["hourlyOrders"] }) {
  const { t } = useLanguage();

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          {t("dashboard.volumeTitle")}
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#2c694e" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#2c694e" }} />
          </span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "#2c694e" }}>
            {t("dashboard.liveUpdates")}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "#7c7570" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#7c7570" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(160,60,0,0.04)" }}
            contentStyle={tooltipStyle}
            formatter={(value) => [Number(value), t("dashboard.ordersLabel")]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.hour === "NOW"
                    ? "#c94d00"
                    : entry.count >= 170
                    ? "#a03c00"
                    : "#e8c4b0"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuartierChart({ data }: { data: DashboardData["revenueByQuarter"] }) {
  const { t } = useLanguage();

  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
      >
        {t("dashboard.revenueByQuarter")}
      </h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#7c7570" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}M`}
          />
          <YAxis
            type="category"
            dataKey="quarter"
            tick={{ fontSize: 11, fill: "#1b1c1a" }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            cursor={{ fill: "rgba(160,60,0,0.04)" }}
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v}M FCFA`, t("dashboard.revenueLabel")]}
          />
          <Bar dataKey="revenueM" fill="#a03c00" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Insight card */}
      <div
        className="mt-4 rounded-xl p-3.5"
        style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
      >
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
              {t("dashboard.insightAI")}
            </p>
            <p className="text-xs text-white leading-relaxed">
              {data.length > 0
                ? t("dashboard.insightText").replace("{quarter}", data[0].quarter)
                : t("dashboard.analysisInProgress")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryDensity({
  revenueByQuarter,
}: {
  revenueByQuarter?: DashboardData["revenueByQuarter"];
}) {
  const { t } = useLanguage();
  const [showMap, setShowMap] = useState(false);

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden p-8 min-h-[200px]"
        style={{ backgroundColor: "#1b1c1a" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #a03c00 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute right-24 top-8 h-28 w-28 rounded-full blur-2xl opacity-30" style={{ backgroundColor: "#a03c00" }} />
        <div className="absolute right-40 bottom-8 h-20 w-20 rounded-full blur-xl opacity-20" style={{ backgroundColor: "#c94d00" }} />
        <div className="absolute right-12 bottom-12 h-16 w-16 rounded-full blur-xl opacity-25" style={{ backgroundColor: "#a03c00" }} />
        <div className="absolute right-64 top-12 h-12 w-12 rounded-full blur-lg opacity-15" style={{ backgroundColor: "#8b4c11" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" style={{ color: "#a03c00" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
              {t("dashboard.realtime")}
            </span>
          </div>
          <h2
            className="text-2xl font-semibold text-white mb-2"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
          >
            {t("dashboard.deliveryDensity")}
          </h2>
          <p className="text-sm max-w-lg mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
            {t("dashboard.deliveryDensityDesc")}
          </p>
          <button
            onClick={() => setShowMap(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: "#e8c4b0" }}
          >
            {t("dashboard.seeDetailedMap")}
          </button>
        </div>
      </div>

      {/* Full-screen delivery density map dialog */}
      {showMap && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "#1b1c1a" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5">
            <h2
              className="text-2xl font-semibold text-white"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
            >
              Carte de Densit&eacute; des Livraisons
            </h2>
            <button
              onClick={() => setShowMap(false)}
              className="rounded-full border border-white/30 px-5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            >
              Fermer
            </button>
          </div>

          {/* Simulated map area */}
          <div className="flex-1 relative mx-8 mb-8 rounded-2xl overflow-hidden" style={{ backgroundColor: "#141513" }}>
            {/* Dot pattern background */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: "radial-gradient(circle, #a03c00 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Density blobs */}
            {(revenueByQuarter ?? []).map((q, i) => {
              const positions = [
                { top: "20%", left: "25%" },
                { top: "35%", left: "60%" },
                { top: "55%", left: "40%" },
                { top: "70%", left: "70%" },
                { top: "30%", left: "80%" },
              ];
              const pos = positions[i % positions.length];
              const size = Math.max(60, Math.min(160, q.revenueM * 20));
              return (
                <div key={q.quarter} className="absolute flex flex-col items-center" style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -50%)" }}>
                  <div
                    className="rounded-full blur-xl"
                    style={{
                      width: size,
                      height: size,
                      background: `radial-gradient(circle, rgba(201,77,0,0.6), rgba(160,60,0,0.2))`,
                    }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div
                      className="h-3 w-3 rounded-full mb-1"
                      style={{ background: "linear-gradient(135deg, #c94d00, #a03c00)" }}
                    />
                    <span className="text-white text-xs font-semibold whitespace-nowrap">{q.quarter}</span>
                    <span className="text-white/60 text-[10px]">{q.revenueM}M FCFA</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<string>("today");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<DashboardData>("/admin/dashboard");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const kpis = data ? buildKpis(data, t) : [];

  return (
    <div className="space-y-5 pb-8">
      {/* Title + period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
            {t("dashboard.subtitle")}
          </p>
        </div>
        <PeriodFilter selected={period} onChange={setPeriod} />
      </div>

      {/* Alert banner */}
      <AlertBanner data={data} />

      {error && <ErrorState message={error} onRetry={fetchDashboard} />}

      {/* 8 KPI cards */}
      {loading ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Charts */}
      {!loading && data && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <VolumeChart data={data.hourlyOrders ?? []} />
          <QuartierChart data={data.revenueByQuarter ?? []} />
        </div>
      )}
      {loading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[280px] rounded-2xl" />
          <Skeleton className="h-[280px] rounded-2xl" />
        </div>
      )}

      {/* Delivery density map */}
      <DeliveryDensity revenueByQuarter={data?.revenueByQuarter} />

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
