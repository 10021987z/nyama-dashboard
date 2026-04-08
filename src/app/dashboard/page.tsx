"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  ChefHat,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import { formatFcfa, formatFcfaCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";

// ── Period selector ────────────────────────────────────────────────────────────

const PERIODS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 jours" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

function PeriodFilter({
  selected,
  onChange,
}: {
  selected: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{ backgroundColor: "#f5f3ef" }}
    >
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            selected === p.key
              ? {
                  background: "linear-gradient(135deg, #F57C20, #E06A10)",
                  color: "#fff",
                }
              : { color: "#6B7280" }
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ── KPI cards ──────────────────────────────────────────────────────────────────

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

function buildKpis(d: DashboardData): KpiDef[] {
  const ordersTrend = d.ordersTrend ?? 0;
  const revenueTrend = d.revenueTrend ?? 0;

  // Mock fields not yet in API
  const completionRate = 100 - Math.round((Array.isArray(d.ordersByStatus) ? (d.ordersByStatus.find((s: any) => s.status === "cancelled")?.count ?? 4) : 4));
  const cancellationRate = 100 - completionRate;
  const avgDeliveryMin = 28;
  const activeRiders = Math.max(1, Math.round((d.totalRiders ?? 18) * 0.6));
  const onlineCooks = Math.max(1, Math.round((d.totalCooks ?? 24) * 0.75));
  const recurring = d.retentionRate ?? 42;

  return [
    {
      title: "COMMANDES TOTALES",
      value: (d.totalOrders ?? d.ordersToday ?? 0).toLocaleString("fr-FR"),
      trend:
        ordersTrend !== 0
          ? { label: `${ordersTrend >= 0 ? "+" : ""}${ordersTrend}%`, positive: ordersTrend >= 0 }
          : "stable",
      subtext: "VS PÉRIODE PRÉCÉDENTE",
      icon: ShoppingBag,
      iconColor: "#f97316",
      iconBg: "#fff7ed",
    },
    {
      title: "CA BRUT",
      value: formatFcfaCompact(d.totalRevenue ?? 0),
      trend:
        revenueTrend !== 0
          ? { label: `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}%`, positive: revenueTrend >= 0 }
          : "stable",
      subtext: "MONTANT BRUT FCFA",
      icon: TrendingUp,
      iconColor: "#ffffff",
      iconBg: "rgba(255,255,255,0.15)",
      featured: true,
    },
    {
      title: "CA NET",
      value: formatFcfaCompact(Math.round((d.totalRevenue ?? 0) * 0.85)),
      subtext: "APRÈS COMMISSIONS 15%",
      icon: CreditCard,
      iconColor: "#16a34a",
      iconBg: "#f0fdf4",
    },
    {
      title: "PANIER MOYEN",
      value: formatFcfa(d.avgBasketXaf ?? 0),
      trend: "stable",
      subtext: "PAR COMMANDE",
      icon: ShoppingBag,
      iconColor: "#b45309",
      iconBg: "#fef3c7",
    },
    {
      title: "TEMPS LIVRAISON",
      value: `${avgDeliveryMin} min`,
      trend: { label: "-2 min", positive: true },
      subtext: "MOYENNE GLOBALE",
      icon: Clock,
      iconColor: "#2563eb",
      iconBg: "#eff6ff",
    },
    {
      title: "TAUX COMPLÉTION",
      value: `${completionRate}%`,
      subtext: "COMMANDES LIVRÉES",
      icon: CheckCircle,
      iconColor: "#16a34a",
      iconBg: "#f0fdf4",
    },
    {
      title: "TAUX D'ANNULATION",
      value: `${cancellationRate}%`,
      trend: { label: "-0.5%", positive: true },
      subtext: "OBJECTIF < 5%",
      icon: XCircle,
      iconColor: "#ef4444",
      iconBg: "#fff1f2",
    },
    {
      title: "NOUVEAUX CLIENTS",
      value: (d.newUsersThisMonth ?? 0).toLocaleString("fr-FR"),
      trend: { label: "+12%", positive: true },
      subtext: "CE MOIS",
      icon: UserPlus,
      iconColor: "#7c3aed",
      iconBg: "#f5f3ff",
    },
    {
      title: "TAUX RÉTENTION",
      value: `${recurring}%`,
      subtext: "CLIENTS RÉCURRENTS",
      icon: Users,
      iconColor: "#0891b2",
      iconBg: "#ecfeff",
    },
    {
      title: "RESTAURANTS",
      value: `${onlineCooks}/${d.totalCooks ?? 0}`,
      subtext: "EN LIGNE / TOTAL",
      icon: ChefHat,
      iconColor: "#2c694e",
      iconBg: "#f0fdf4",
    },
    {
      title: "LIVREURS ACTIFS",
      value: `${activeRiders}/${d.totalRiders ?? 0}`,
      subtext: "EN COURSE / TOTAL",
      icon: Bike,
      iconColor: "#F57C20",
      iconBg: "#fff7ed",
    },
    {
      title: "NOTE PLATEFORME",
      value: `${(d.avgRating ?? 4.6).toFixed(1)} ★`,
      trend: "stable",
      subtext: "MOYENNE GLOBALE",
      icon: Star,
      iconColor: "#D4A017",
      iconBg: "#fefce8",
    },
  ];
}

function KpiCard({ kpi }: { kpi: KpiDef }) {
  const { title, value, trend, subtext, icon: Icon, iconColor, iconBg, featured } = kpi;
  const cardBg = featured ? "#F57C20" : "#ffffff";
  const textColor = featured ? "#ffffff" : "#3D3D3D";
  const mutedColor = featured ? "rgba(255,255,255,0.7)" : "#6B7280";

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
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        {trend === "stable" ? (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ backgroundColor: featured ? "rgba(255,255,255,0.15)" : "#f5f3ef", color: featured ? "#fff" : "#6B7280" }}
          >
            STABLE
          </span>
        ) : trend ? (
          <span
            className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: featured
                ? "rgba(255,255,255,0.18)"
                : trend.positive
                ? "#f0fdf4"
                : "#fff1f2",
              color: featured ? "#ffffff" : trend.positive ? "#16a34a" : "#ef4444",
            }}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.label}
          </span>
        ) : null}
      </div>

      <div>
        <p
          className="text-[1.5rem] font-bold leading-none"
          style={{
            fontFamily: "var(--font-space-mono), monospace",
            color: textColor,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        <p
          className="mt-1.5 text-[9px] font-semibold tracking-wider uppercase"
          style={{ color: mutedColor, fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
        >
          {title}
        </p>
      </div>

      <p className="text-[10px]" style={{ color: mutedColor }}>
        {subtext}
      </p>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// ── Charts ─────────────────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(27,28,26,0.1)",
  fontSize: 12,
};

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="mb-4">
        <h2
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function HourlyAreaChart({ data }: { data: DashboardData["hourlyOrders"] }) {
  // Build prev day overlay (deterministic mock: ~85% of today)
  const enriched = (data ?? []).map((d) => ({
    ...d,
    prev: Math.round(d.count * 0.85),
  }));

  return (
    <Card title="Commandes par heure" subtitle="Aujourd'hui vs hier (24h)">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={enriched} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-today" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F57C20" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#F57C20" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="prev"
            stroke="#9ca3af"
            strokeDasharray="4 4"
            fill="none"
            name="Hier"
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#F57C20"
            strokeWidth={2}
            fill="url(#grad-today)"
            name="Aujourd'hui"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function DailyRevenueChart() {
  // Mock 30-day series with trend line
  const data = useMemo(() => {
    const pts: { day: string; revenue: number; trend: number }[] = [];
    let trend = 800000;
    for (let i = 29; i >= 0; i--) {
      trend += 12000;
      const noise = (Math.sin(i * 0.7) + Math.cos(i * 0.4)) * 80000;
      pts.push({
        day: `J-${i}`,
        revenue: Math.max(400000, Math.round(trend + noise)),
        trend: Math.round(trend),
      });
    }
    return pts;
  }, []);

  return (
    <Card title="Revenus 30 derniers jours" subtitle="CA quotidien (FCFA) + tendance">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
          <YAxis
            tick={{ fontSize: 10, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatFcfa(Number(v))} />
          <Bar dataKey="revenue" fill="#F57C20" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="trend" stroke="#1B4332" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

const CATEGORY_COLORS = ["#F57C20", "#1B4332", "#D4A017", "#7c3aed", "#0891b2"];

function CategoryDonut() {
  const data = [
    { name: "Plats traditionnels", value: 38 },
    { name: "Grillades", value: 24 },
    { name: "Snacks", value: 14 },
    { name: "Boissons", value: 13 },
    { name: "Desserts", value: 11 },
  ];
  return (
    <Card title="Répartition par catégorie" subtitle="% des commandes">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-3 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-xs" style={{ color: "#3D3D3D" }}>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[i] }}
            />
            <span className="flex-1">{d.name}</span>
            <span className="font-semibold">{d.value}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TopRestaurantsChart() {
  const data = [
    { name: "Chez Mama Ngono", revenue: 4200000 },
    { name: "Le Ndolé d'Or", revenue: 3650000 },
    { name: "Saveurs Akwa", revenue: 3120000 },
    { name: "Poulet DG Express", revenue: 2780000 },
    { name: "Bonapriso Bites", revenue: 2410000 },
  ];
  return (
    <Card title="Top 5 restaurants par CA" subtitle="30 derniers jours">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#3D3D3D" }}
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatFcfa(Number(v))} />
          <Bar dataKey="revenue" fill="#1B4332" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Alerts & AI insights ────────────────────────────────────────────────────────

interface AlertItem {
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  detail: string;
}

function AlertsPanel() {
  const alerts: AlertItem[] = [
    {
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "#fff1f2",
      title: "3 commandes en attente > 15 min",
      detail: "Risque d'annulation client",
    },
    {
      icon: ChefHat,
      color: "#f59e0b",
      bg: "#fef3c7",
      title: "Restaurant 'Saveurs Akwa' offline",
      detail: "Hors ligne depuis 25 min en heures d'ouverture",
    },
    {
      icon: Bike,
      color: "#0891b2",
      bg: "#ecfeff",
      title: "5 livreurs sans course depuis > 1h",
      detail: "Zone Bonapriso sur-staffée",
    },
    {
      icon: Star,
      color: "#7c3aed",
      bg: "#f5f3ff",
      title: "2 commandes notées < 3★",
      detail: "À traiter par le support",
    },
  ];

  return (
    <Card title="Alertes & actions requises" subtitle="Mises à jour temps réel">
      <ul className="space-y-2.5">
        {alerts.map((a, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[#fbf9f5]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: a.bg }}
            >
              <a.icon className="h-4 w-4" style={{ color: a.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
                {a.title}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                {a.detail}
              </p>
            </div>
            <button
              className="shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1"
              style={{ color: "#F57C20", backgroundColor: "#fff7ed" }}
            >
              Voir
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AIInsights() {
  const insights = [
    {
      icon: TrendingUp,
      text: "Le Ndolé complet est votre plat le plus commandé cette semaine (+23%)",
    },
    {
      icon: Sparkles,
      text: "Le quartier Akwa génère 45% de vos commandes sur la période",
    },
    {
      icon: Bike,
      text: "Recommandation : augmenter les livreurs à Bonapriso le vendredi soir",
    },
  ];
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "linear-gradient(135deg, #1B4332, #2c694e)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4" style={{ color: "#D4A017" }} />
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Insights IA
        </span>
      </div>
      <ul className="space-y-3">
        {insights.map((ins, i) => (
          <li key={i} className="flex items-start gap-3">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <ins.icon className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-xs leading-relaxed text-white/90">{ins.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Live feed ticker ───────────────────────────────────────────────────────────

function LiveFeed() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const events = useMemo(
    () => [
      { id: 1, label: "#CMD-8421 livrée à Akwa", amount: "8 500 FCFA" },
      { id: 2, label: "#CMD-8420 acceptée par Chez Mama", amount: "12 000 FCFA" },
      { id: 3, label: "Nouveau client inscrit — Marie K.", amount: "" },
      { id: 4, label: "#CMD-8419 en livraison vers Bonapriso", amount: "6 200 FCFA" },
      { id: 5, label: "Restaurant Le Ndolé d'Or en ligne", amount: "" },
      { id: 6, label: "#CMD-8418 livrée à Bonanjo", amount: "9 800 FCFA" },
    ],
    []
  );
  const items = [...events.slice(tick % events.length), ...events.slice(0, tick % events.length)];

  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-3 overflow-hidden"
      style={{ backgroundColor: "#3D3D3D" }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "#F57C20" }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: "#F57C20" }}
          />
        </span>
        <span
          className="text-[10px] font-bold tracking-wider"
          style={{ color: "#F57C20" }}
        >
          LIVE
        </span>
      </div>
      <div className="flex-1 flex items-center gap-8 overflow-hidden">
        {items.slice(0, 4).map((e) => (
          <div key={e.id} className="flex items-center gap-2 whitespace-nowrap">
            <Package className="h-3 w-3 text-white/40" />
            <span className="text-xs text-white/80">{e.label}</span>
            {e.amount && (
              <span
                className="text-[10px] font-bold"
                style={{ color: "#D4A017", fontFamily: "var(--font-space-mono), monospace" }}
              >
                {e.amount}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<PeriodKey>("today");
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
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            {t("dashboard.subtitle")}
          </p>
        </div>
        <PeriodFilter selected={period} onChange={setPeriod} />
      </div>

      {/* Live feed ticker */}
      <LiveFeed />

      {error && <ErrorState message={error} onRetry={fetchDashboard} />}

      {/* 12 KPI cards */}
      {loading ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Charts row 1 */}
      {!loading && data && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <HourlyAreaChart data={data.hourlyOrders ?? []} />
          <DailyRevenueChart />
        </div>
      )}
      {loading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      )}

      {/* Charts row 2 */}
      {!loading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <CategoryDonut />
          <div className="lg:col-span-2">
            <TopRestaurantsChart />
          </div>
        </div>
      )}

      {/* Alerts + AI insights */}
      {!loading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AlertsPanel />
          </div>
          <AIInsights />
        </div>
      )}

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
        <span className="ml-2 opacity-60">— Activity tracked via {<Activity className="inline h-3 w-3" />}</span>
      </p>
    </div>
  );
}
