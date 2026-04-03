"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

// ── Static data ────────────────────────────────────────────────────────────────

const PERIODS = ["Aujourd'hui", "7 jours", "30 jours"] as const;

const hourlyData = [
  { time: "06h", v: 45 },
  { time: "08h", v: 82 },
  { time: "10h", v: 125 },
  { time: "12h", v: 180 },
  { time: "14h", v: 165 },
  { time: "16h", v: 142 },
  { time: "18h", v: 220 },
  { time: "20h", v: 195 },
  { time: "NOW", v: 85 },
];

const quartierData = [
  { q: "Akwa", r: 12.5 },
  { q: "Bastos", r: 9.1 },
  { q: "Bonanjo", r: 8.2 },
  { q: "Deido", r: 5.8 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function AlertBanner() {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-5 py-3"
      style={{ backgroundColor: "#e8f5e9" }}
    >
      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#2c694e" }} />
      <p className="flex-1 text-sm font-medium" style={{ color: "#1b4d38" }}>
        Alertes Opérations : Le taux de succès des paiements est actuellement
        à un niveau record.
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
}

const kpis: KpiDef[] = [
  {
    title: "COMMANDES AUJOURD'HUI",
    value: "1 248",
    trend: { label: "+12%", positive: true },
    subtext: "VS WEEK-1",
    icon: ShoppingBag,
    iconColor: "#f97316",
    iconBg: "#fff7ed",
  },
  {
    title: "COMMANDES SEMAINE",
    value: "8 450",
    subtext: "Taux de complétion",
    icon: Package,
    iconColor: "#2c694e",
    iconBg: "#f0fdf4",
    extra: "progress",
  },
  {
    title: "CA DU JOUR",
    value: "2 496 000 FCFA",
    trend: { label: "-5%", positive: false },
    subtext: "VS VEILLE",
    icon: TrendingUp,
    iconColor: "#ef4444",
    iconBg: "#fff1f2",
  },
  {
    title: "CA CUMULÉ DU MOIS",
    value: "42,5M FCFA",
    subtext: "PROJECTION : 60M",
    icon: CreditCard,
    iconColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.15)",
    featured: true,
  },
  {
    title: "TÉLÉCHARGEMENTS APP",
    value: "15 200",
    trend: { label: "+120", positive: true },
    subtext: "CE MOIS",
    icon: Smartphone,
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
  },
  {
    title: "CUISINIÈRES ACTIVES",
    value: "184",
    trend: { label: "+62", positive: true },
    subtext: "NOUVEAUX PARTENAIRES",
    icon: ChefHat,
    iconColor: "#2c694e",
    iconBg: "#f0fdf4",
    extra: "avatars",
  },
  {
    title: "PANIER MOYEN",
    value: "2 850 FCFA",
    trend: "stable",
    subtext: "VS SEMAINE DERNIÈRE",
    icon: ShoppingBag,
    iconColor: "#b45309",
    iconBg: "#fef3c7",
  },
  {
    title: "SUCCÈS PAIEMENT MOMO",
    value: "92%",
    trend: { label: "+2%", positive: true },
    subtext: "MOBILE MONEY CAMEROON",
    icon: CheckCircle,
    iconColor: "#16a34a",
    iconBg: "#f0fdf4",
  },
];

function KpiCard({ kpi }: { kpi: KpiDef }) {
  const { title, value, trend, subtext, icon: Icon, iconColor, iconBg, featured, extra } = kpi;

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
      {/* Top row */}
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} strokeWidth={2} />
        </div>

        {/* Trend badge */}
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
                : trend.positive
                ? "#f0fdf4"
                : "#fff1f2",
              color: featured
                ? "#ffffff"
                : trend.positive
                ? "#16a34a"
                : "#ef4444",
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

      {/* Value */}
      <div>
        <p
          className="text-[1.6rem] font-bold leading-none"
          style={{
            fontFamily: "var(--font-newsreader), Georgia, serif",
            color: textColor,
          }}
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

      {/* Extra */}
      {extra === "progress" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: mutedColor }}>
              {subtext}
            </span>
            <span className="text-[10px] font-bold" style={{ color: textColor }}>
              80%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: "#f0fdf4" }}>
            <div
              className="h-full rounded-full"
              style={{ width: "80%", backgroundColor: "#2c694e" }}
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
            +62 ce mois
          </span>
        </div>
      )}
      {!extra && (
        <p className="text-[10px]" style={{ color: mutedColor }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

function VolumeChart() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--font-newsreader), Georgia, serif",
            color: "#1b1c1a",
          }}
        >
          Volume des Commandes
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#2c694e" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#2c694e" }} />
          </span>
          <span
            className="text-[10px] font-bold tracking-wider"
            style={{ color: "#2c694e" }}
          >
            LIVE UPDATES
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={hourlyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="time"
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
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "none",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(27,28,26,0.1)",
              fontSize: 12,
            }}
            formatter={(value) => [Number(value), "Commandes"]}
          />
          <Bar dataKey="v" radius={[6, 6, 0, 0]}>
            {hourlyData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.time === "NOW"
                    ? "#c94d00"
                    : entry.v >= 170
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

function QuartierChart() {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-newsreader), Georgia, serif",
          color: "#1b1c1a",
        }}
      >
        Revenus par Quartier
      </h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          layout="vertical"
          data={quartierData}
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
            dataKey="q"
            tick={{ fontSize: 11, fill: "#1b1c1a" }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            cursor={{ fill: "rgba(160,60,0,0.04)" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "none",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(27,28,26,0.1)",
              fontSize: 12,
            }}
            formatter={(v) => [`${Number(v)}M FCFA`, "Revenus"]}
          />
          <Bar dataKey="r" fill="#a03c00" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Insight card */}
      <div
        className="mt-4 rounded-xl p-3.5"
        style={{
          background: "linear-gradient(135deg, #a03c00, #c94d00)",
        }}
      >
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
              INSIGHT IA
            </p>
            <p className="text-xs text-white leading-relaxed">
              Akwa génère 30% du CA total. Augmenter la flotte de 3 riders sur cette zone pourrait booster le CA de 15%.
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
      {/* Dot-grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #a03c00 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Density heat bubbles */}
      <div
        className="absolute right-24 top-8 h-28 w-28 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: "#a03c00" }}
      />
      <div
        className="absolute right-40 bottom-8 h-20 w-20 rounded-full blur-xl opacity-20"
        style={{ backgroundColor: "#c94d00" }}
      />
      <div
        className="absolute right-12 bottom-12 h-16 w-16 rounded-full blur-xl opacity-25"
        style={{ backgroundColor: "#a03c00" }}
      />
      <div
        className="absolute right-64 top-12 h-12 w-12 rounded-full blur-lg opacity-15"
        style={{ backgroundColor: "#8b4c11" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4" style={{ color: "#a03c00" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
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

  return (
    <div className="space-y-5 pb-8">
      {/* Title + period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              color: "#1b1c1a",
            }}
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
      <AlertBanner />

      {/* 8 KPI cards — 4 cols desktop */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} kpi={kpi} />
        ))}
      </div>

      {/* Charts — 2 cols */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <VolumeChart />
        <QuartierChart />
      </div>

      {/* Delivery density map */}
      <DeliveryDensity />

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        NYAMA TECH SYSTEMS © 2026 &bull; PROPULSION DE L&apos;EXCELLENCE CULINAIRE CAMEROUNAISE
      </p>
    </div>
  );
}
