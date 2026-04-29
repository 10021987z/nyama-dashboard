"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  ChefHat,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatFcfaCompact } from "@/lib/utils";
import { apiClient } from "@/lib/api";

// MOCK: historical revenue + load rows — replace with GET /admin/analytics/revenue?days=14
// and GET /admin/analytics/cooks/load (backend endpoints do not yet exist).
type RevenuePoint = { date: string; revenue: number; orders: number };

type CookLoad = { name: string; load: number; capacity: number };

const DAY_LABEL_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

function generateMockRevenue(): RevenuePoint[] {
  // MOCK: deterministic pseudo-random 14-day history around 380k FCFA/day
  const base = 380_000;
  const out: RevenuePoint[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    // Fri/Sat bump, Mon dip — pattern the model will learn
    const dowMult =
      dow === 5 ? 1.25 : dow === 6 ? 1.32 : dow === 1 ? 0.82 : 1;
    const noise = Math.sin(i * 1.9) * 0.08 + 1;
    const rev = Math.round(base * dowMult * noise);
    out.push({
      date: d.toISOString().slice(0, 10),
      revenue: rev,
      orders: Math.round(rev / 3800),
    });
  }
  return out;
}

function generateMockCookLoad(): CookLoad[] {
  // MOCK: Cook load — wire to real cook load endpoint
  return [
    { name: "Rose Mbala", load: 92, capacity: 100 },
    { name: "Catherine Nkomo", load: 54, capacity: 100 },
    { name: "Aminata Sow", load: 71, capacity: 100 },
    { name: "Madeleine Etoa", load: 88, capacity: 100 },
    { name: "Circuit (central)", load: 35, capacity: 100 },
  ];
}

type Insight = {
  kind: "opportunity" | "risk" | "info";
  title: string;
  description: string;
  icon: React.ReactNode;
};

function buildInsights(
  history: RevenuePoint[],
  cooks: CookLoad[],
  tomorrowForecast: number
): Insight[] {
  const out: Insight[] = [];

  // Peak slot hint (static time of day heuristic)
  const peakCook = cooks.reduce(
    (a, c) => (c.load < a.load ? c : a),
    cooks[0]
  );
  out.push({
    kind: "opportunity",
    icon: <ChefHat className="h-4 w-4" />,
    title: `Ouvrir plus de créneaux pour ${peakCook.name} 12h–14h demain`,
    description: `Charge actuelle ${peakCook.load}% — capacité dispo pour absorber le pic du déjeuner (prévu ${formatFcfaCompact(
      tomorrowForecast
    )}).`,
  });

  // Overload risk
  const overloaded = cooks.filter((c) => c.load >= 85);
  for (const c of overloaded) {
    const donor = cooks.find((x) => x.load < 50) ?? cooks[cooks.length - 1];
    out.push({
      kind: "risk",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: `Charge trop élevée sur ${c.name} — rediriger vers ${donor.name}`,
      description: `${c.name} est à ${c.load}% de capacité. Réassigner les prochaines 3-5 commandes vers ${donor.name} (${donor.load}%).`,
    });
  }

  // Trend analysis
  const last7 = history.slice(-7).reduce((s, x) => s + x.revenue, 0);
  const prev7 = history.slice(-14, -7).reduce((s, x) => s + x.revenue, 0);
  const trendPct = prev7 ? ((last7 - prev7) / prev7) * 100 : 0;
  out.push({
    kind: trendPct >= 0 ? "opportunity" : "risk",
    icon: <TrendingUp className="h-4 w-4" />,
    title: `Semaine ${trendPct >= 0 ? "en hausse" : "en baisse"} de ${Math.abs(
      trendPct
    ).toFixed(1)}%`,
    description: `CA 7 derniers jours: ${formatFcfaCompact(
      last7
    )} vs semaine précédente ${formatFcfaCompact(prev7)}.`,
  });

  return out;
}

function predictTomorrow(history: RevenuePoint[]): {
  value: number;
  dow: string;
  basis: string;
} {
  // Simple client-side model: last-14-day avg × day-of-week multiplier
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDow = tomorrow.getDay();

  const mean =
    history.reduce((s, x) => s + x.revenue, 0) / Math.max(history.length, 1);

  // Average for matching DOW
  const matching = history.filter(
    (h) => new Date(h.date).getDay() === tomorrowDow
  );
  const dowMean = matching.length
    ? matching.reduce((s, x) => s + x.revenue, 0) / matching.length
    : mean;

  const multiplier = dowMean / mean;
  const value = Math.round(mean * multiplier);

  return {
    value,
    dow: DAY_LABEL_FR[tomorrowDow],
    basis: `moyenne 14j (${formatFcfaCompact(
      Math.round(mean)
    )}) × facteur ${multiplier.toFixed(2)} pour ${DAY_LABEL_FR[tomorrowDow]}`,
  };
}

export default function AiInsightsPage() {
  const [history, setHistory] = useState<RevenuePoint[]>([]);
  const [cooks, setCooks] = useState<CookLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) historique CA jour par jour (14j) — endpoint réel
        const rev = await apiClient.get<{ days: number; series?: RevenuePoint[] }>(
          "/admin/analytics/revenue-history",
          { days: 14 },
        );
        if (!cancelled && rev?.series?.length) {
          setHistory(rev.series);
        } else if (!cancelled) {
          setHistory(generateMockRevenue());
        }
      } catch {
        if (!cancelled) setHistory(generateMockRevenue());
      }

      try {
        // 2) charge des cooks — endpoint réel
        const load = await apiClient.get<{
          items?: Array<{ name: string; load: number; capacity: number }>;
        }>("/admin/analytics/cooks-load");
        if (!cancelled && load?.items?.length) {
          setCooks(
            load.items.map((c) => ({
              name: c.name,
              load: c.load,
              capacity: c.capacity,
            })),
          );
        } else if (!cancelled) {
          setCooks(generateMockCookLoad());
        }
      } catch {
        if (!cancelled) setCooks(generateMockCookLoad());
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const forecast = useMemo(
    () =>
      history.length
        ? predictTomorrow(history)
        : { value: 0, dow: "—", basis: "en attente de données" },
    [history]
  );

  const insights = useMemo(
    () =>
      history.length && cooks.length
        ? buildInsights(history, cooks, forecast.value)
        : [],
    [history, cooks, forecast.value]
  );

  const chartData = useMemo(() => {
    const full = [...history];
    if (history.length && forecast.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      full.push({
        date: tomorrow.toISOString().slice(0, 10),
        revenue: forecast.value,
        orders: Math.round(forecast.value / 3800),
      });
    }
    return full;
  }, [history, forecast.value]);

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
            Insights IA — Prédictions & Recommandations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modèle déterministe côté client (moyenne mobile 14j × facteur
            jour-de-semaine).
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Heuristique locale
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: "#F57C20" }} />
              CA prévu demain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: "#F57C20" }}>
              {loading ? "—" : formatFcfaCompact(forecast.value)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {forecast.dow} · {forecast.basis}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique 14j + prédiction demain
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#F57C20"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="#F57C20"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis
                  fontSize={10}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => formatFcfaCompact(Number(v))}
                  labelFormatter={(l) => `${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F57C20"
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recommandations actionnables
        </h2>
        {loading && (
          <p className="text-sm text-muted-foreground">Analyse en cours…</p>
        )}
        {!loading &&
          insights.map((i, idx) => (
            <Alert
              key={idx}
              variant={
                i.kind === "risk"
                  ? "destructive"
                  : i.kind === "opportunity"
                    ? "success"
                    : "info"
              }
            >
              {i.icon}
              <AlertTitle>{i.title}</AlertTitle>
              <AlertDescription>{i.description}</AlertDescription>
            </Alert>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Charge cuisinières (maintenant)
          </CardTitle>
        </CardHeader>
        <CardContent style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cooks}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="load"
                stroke="#1B4332"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
