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
import {
  ShoppingBag,
  Package,
  TrendingUp,
  CreditCard,
  Smartphone,
  ChefHat,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
} from "lucide-react";

// ── Sub-components ─────────────────────────────────────────────────────────────

const PERIODS = ["Aujourd'hui", "7 jours", "30 jours"] as const;

function PeriodFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{ backgroundColor: "#f5f3ef" }}
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            selected === p
              ? {
                  background: "linear-gradient(135deg, #a03c00, #c94d00)",
                  color: "#fff",
                }
              : { color: "#7c7570" }
          }
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function AlertBanner({ data }: { data: DashboardData | null }) {
  const rate = data?.paymentSuccessRate ?? 0;
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-3"
      style={{ backgroundColor: "#e8f5e9" }}
    >
      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#2c694e" }} />
      <p className="flex-1 text-sm font-medium" style={{ color: "#1b4d38" }}>
        Alertes Opérations : Le taux de succès des paiements est actuellement
        à {rate > 0 ? `${rate}%` : "un niveau record"}.
      </p>
      <span
        className="shrink-0 rounded-full px-3 py-0.5 text-xs font-bold text-white"
        style={{ backgroundColor: "#2c694e" }}
      >
        NORMAL
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
  extra?: "progress" | "avatars";
  progressValue?: number;
}

function buildKpis(d: DashboardData): KpiDef[] {
  return [
    {
      title: "COMMANDES AUJOURD'HUI",
      value: d.ordersToday.toLocaleString("fr-FR"),
      trend: d.ordersTrend !== 0
        ? { label: `${d.ordersTrend >= 0 ? "+" : ""}${d.ordersTrend}%`, positive: d.ordersTrend >= 0 }
        : "stable",
      subtext: "VS WEEK-1",
      icon: ShoppingBag,
      iconColor: "#f97316",
      iconBg: "#fff7ed",
    },
    {
      title: "COMMANDES SEMAINE",
      value: d.ordersThisWeek.toLocaleString("fr-FR"),
      subtext: "Taux de complétion",
      icon: Package,
      iconColor: "#2c694e",
      iconBg: "#f0fdf4",
      extra: "progress",
      progressValue: d.completionRate,
    },
    {
      title: "CA DU JOUR",
      value: formatFcfa(d.revenueToday),
      trend: d.revenueTrend !== 0
        ? { label: `${d.revenueTrend >= 0 ? "+" : ""}${d.revenueTrend}%`, positive: d.revenueTrend >= 0 }
        : "stable",
      subtext: "VS VEILLE",
      icon: TrendingUp,
      iconColor: d.revenueTrend >= 0 ? "#16a34a" : "#ef4444",
      iconBg: d.revenueTrend >= 0 ? "#f0fdf4" : "#fff1f2",
    },
    {
      title: "CA CUMULÉ DU MOIS",
      value: formatFcfaCompact(d.revenueThisMonth),
      subtext: "PROJECTION MENSUELLE",
      icon: CreditCard,
      iconColor: "#ffffff",
      iconBg: "rgba(255,255,255,0.15)",
      featured: true,
    },
    {
      title: "TÉLÉCHARGEMENTS APP",
      value: d.appDownloads.toLocaleString("fr-FR"),
      subtext: "CE MOIS",
      icon: Smartphone,
      iconColor: "#2563eb",
      iconBg: "#eff6ff",
    },
    {
      title: "CUISINIÈRES ACTIVES",
      value: String(d.activeCooks),
      trend: d.newCooksThisMonth > 0
        ? { label: `+${d.newCooksThisMonth}`, positive: true }
        : undefined,
      subtext: "NOUVEAUX PARTENAIRES",
      icon: ChefHat,
      iconColor: "#2c694e",
      iconBg: "#f0fdf4",
      extra: "avatars",
    },
    {
      title: "PANIER MOYEN",
      value: formatFcfa(d.avgBasketXaf),
      trend: "stable",
      subtext: "VS SEMAINE DERNIÈRE",
      icon: ShoppingBag,
      iconColor: "#b45309",
      iconBg: "#fef3c7",
    },
    {
      title: "SUCCÈS PAIEMENT MOMO",
      value: `${d.paymentSuccessRate}%`,
      subtext: "MOBILE MONEY CAMEROON",
      icon: CheckCircle,
      iconColor: "#16a34a",
      iconBg: "#f0fdf4",
    },
  ];
}

function KpiCard({ kpi }: { kpi: KpiDef }) {
  const { title, value, trend, subtext, icon: Icon, iconColor, iconBg, featured, extra, progressValue } = kpi;

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

      {extra === "progress" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: mutedColor }}>{subtext}</span>
            <span className="text-[10px] font-bold" style={{ color: textColor }}>
              {progressValue ?? 0}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: "#f0fdf4" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progressValue ?? 0}%`, backgroundColor: "#2c694e" }}
            />
          </div>
        </div>
      )}
      {extra === "avatars" && (
        <div className="flex items-center gap-1.5">
          {["#a03c00", "#2c694e", "#8b4c11", "#c94d00"].map((c, i) => (
            <div
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white -ml-1.5 first:ml-0 ring-2 ring-white"
              style={{ backgroundColor: c, zIndex: 4 - i }}
            />
          ))}
          <span className="ml-1 text-[10px]" style={{ color: mutedColor }}>
            +{kpi.trend && kpi.trend !== "stable" ? kpi.trend.label : "0"} ce mois
          </span>
        </div>
      )}
      {!extra && (
        <p className="text-[10px]" style={{ color: mutedColor }}>{subtext}</p>
      )}
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
          Volume des Commandes
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#2c694e" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#2c694e" }} />
          </span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "#2c694e" }}>
            LIVE UPDATES
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
            formatter={(value) => [Number(value), "Commandes"]}
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
  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
      >
        Revenus par Quartier
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
            formatter={(v) => [`${v}M FCFA`, "Revenus"]}
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
              INSIGHT IA
            </p>
            <p className="text-xs text-white leading-relaxed">
              {data.length > 0
                ? `${data[0].quarter} génère le plus de CA. Augmenter la flotte dans cette zone pourrait booster les revenus de 15%.`
                : "Analyse en cours..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryDensity() {
  return (
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
            Temps réel
          </span>
        </div>
        <h2
          className="text-2xl font-semibold text-white mb-2"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
        >
          Densité des Livraisons
        </h2>
        <p className="text-sm max-w-lg mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
          Cartographie des zones de livraison actives à Douala et Yaoundé.
          Les hotspots terracotta indiquent les quartiers à forte demande.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "#e8c4b0" }}
        >
          Voir la carte détaillée →
        </a>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>("Aujourd'hui");
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

  const kpis = data ? buildKpis(data) : [];

  return (
    <div className="space-y-5 pb-8">
      {/* Title + period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Tableau de Bord Exécutif
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
            Vue d&apos;ensemble des opérations Nyama &bull; Savor Cameroon
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
          <VolumeChart data={data.hourlyOrders} />
          <QuartierChart data={data.revenueByQuarter} />
        </div>
      )}
      {loading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[280px] rounded-2xl" />
          <Skeleton className="h-[280px] rounded-2xl" />
        </div>
      )}

      {/* Delivery density map */}
      <DeliveryDensity />

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        NYAMA TECH SYSTEMS &copy; 2026 &bull; PROPULSION DE L&apos;EXCELLENCE CULINAIRE CAMEROUNAISE
      </p>
    </div>
  );
}
