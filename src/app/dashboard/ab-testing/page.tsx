"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Plus, Play, Pause, Flag } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// MOCK: Experiments + feature flags persist to localStorage.
// Wire to:
//   GET/POST /admin/experiments
//   PATCH /admin/flags/:key { enabled, rollout }
// (not in backend yet)
type Experiment = {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  trafficPct: number;
  metric: string;
  startedAt: string;
  status: "running" | "paused";
  conversionA: number;
  conversionB: number;
  impressionsA: number;
  impressionsB: number;
};

type FeatureFlag = {
  key: string;
  enabled: boolean;
  rollout: number;
};

const EXP_KEY = "nyama_experiments";
const FLAG_KEY = "nyama_flags";

const DEFAULT_EXPERIMENTS: Experiment[] = [
  {
    id: "exp1",
    name: "Checkout one-page vs multi-step",
    variantA: "Multi-step (control)",
    variantB: "Single page",
    trafficPct: 50,
    metric: "conversion checkout",
    startedAt: "2026-04-12",
    status: "running",
    conversionA: 0.183,
    conversionB: 0.217,
    impressionsA: 2480,
    impressionsB: 2471,
  },
  {
    id: "exp2",
    name: "Free delivery badge on card",
    variantA: "Pas de badge",
    variantB: "Badge vert",
    trafficPct: 30,
    metric: "taux d'ajout au panier",
    startedAt: "2026-04-15",
    status: "running",
    conversionA: 0.312,
    conversionB: 0.329,
    impressionsA: 1120,
    impressionsB: 1089,
  },
];

const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: "new_onboarding_flow", enabled: true, rollout: 100 },
  { key: "rider_bonus_card", enabled: false, rollout: 0 },
  { key: "cook_profile_v2", enabled: true, rollout: 25 },
];

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export default function AbTestingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [newExp, setNewExp] = useState({
    name: "",
    variantA: "A",
    variantB: "B",
    trafficPct: 50,
    metric: "conversion",
  });

  useEffect(() => {
    setExperiments(loadJson(EXP_KEY, DEFAULT_EXPERIMENTS));
    setFlags(loadJson(FLAG_KEY, DEFAULT_FLAGS));
  }, []);

  const persistExp = (next: Experiment[]) => {
    setExperiments(next);
    saveJson(EXP_KEY, next);
  };
  const persistFlags = (next: FeatureFlag[]) => {
    setFlags(next);
    saveJson(FLAG_KEY, next);
  };

  const createExperiment = () => {
    if (!newExp.name.trim()) {
      toast.error("Nom requis.");
      return;
    }
    const exp: Experiment = {
      id: `exp_${Date.now()}`,
      name: newExp.name,
      variantA: newExp.variantA || "A",
      variantB: newExp.variantB || "B",
      trafficPct: newExp.trafficPct,
      metric: newExp.metric,
      startedAt: new Date().toISOString().slice(0, 10),
      status: "running",
      conversionA: 0,
      conversionB: 0,
      impressionsA: 0,
      impressionsB: 0,
    };
    persistExp([exp, ...experiments]);
    setNewExp({
      name: "",
      variantA: "A",
      variantB: "B",
      trafficPct: 50,
      metric: "conversion",
    });
    toast.success("Expérience créée.");
  };

  const toggleStatus = (id: string) => {
    persistExp(
      experiments.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "running" ? "paused" : "running" }
          : e
      )
    );
  };

  const toggleFlag = (key: string) => {
    persistFlags(
      flags.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };
  const setRollout = (key: string, rollout: number) => {
    persistFlags(flags.map((f) => (f.key === key ? { ...f, rollout } : f)));
  };

  const chartData = useMemo(
    () =>
      experiments.map((e) => ({
        name: e.name.slice(0, 20),
        A: Number((e.conversionA * 100).toFixed(1)),
        B: Number((e.conversionB * 100).toFixed(1)),
      })),
    [experiments]
  );

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          A/B Testing & Feature Flags
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créer et superviser vos expériences, gérer les feature flags.
        </p>
      </div>

      <Alert variant="warning">
        <FlaskConical className="h-4 w-4" />
        <AlertTitle>Données simulées</AlertTitle>
        <AlertDescription>
          Les conversions affichées sont mockées. L&apos;intégration réelle
          demande <code>POST /admin/experiments</code> (non encore disponible).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Créer une expérience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nom</label>
              <Input
                value={newExp.name}
                onChange={(e) =>
                  setNewExp({ ...newExp, name: e.target.value })
                }
                placeholder="ex. Nouveau flow signup"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Variante A</label>
              <Input
                value={newExp.variantA}
                onChange={(e) =>
                  setNewExp({ ...newExp, variantA: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Variante B</label>
              <Input
                value={newExp.variantB}
                onChange={(e) =>
                  setNewExp({ ...newExp, variantB: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Trafic (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newExp.trafficPct}
                onChange={(e) =>
                  setNewExp({
                    ...newExp,
                    trafficPct: parseInt(e.target.value || "0", 10),
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Métrique cible
              </label>
              <Input
                value={newExp.metric}
                onChange={(e) =>
                  setNewExp({ ...newExp, metric: e.target.value })
                }
              />
            </div>
          </div>
          <Button onClick={createExperiment}>
            <Plus className="h-3 w-3" /> Lancer l&apos;expérience
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expériences en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Trafic</TableHead>
                <TableHead>Métrique</TableHead>
                <TableHead>Conversion A / B</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((e) => {
                const uplift =
                  e.conversionA > 0
                    ? ((e.conversionB - e.conversionA) / e.conversionA) * 100
                    : 0;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-xs">
                      {e.variantA} → {e.variantB}
                    </TableCell>
                    <TableCell>{e.trafficPct}%</TableCell>
                    <TableCell className="text-xs">{e.metric}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span>{(e.conversionA * 100).toFixed(1)}%</span>
                        <span>→</span>
                        <span
                          style={{
                            color: uplift >= 0 ? "#1B4332" : "#E8413C",
                            fontWeight: 600,
                          }}
                        >
                          {(e.conversionB * 100).toFixed(1)}% (
                          {uplift >= 0 ? "+" : ""}
                          {uplift.toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.status === "running" ? "default" : "secondary"
                        }
                      >
                        {e.status === "running" ? "Actif" : "Pause"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => toggleStatus(e.id)}
                      >
                        {e.status === "running" ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {experiments.length > 0 && (
            <div style={{ height: 200 }} className="mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="A" fill="#3D3D3D" />
                  <Bar dataKey="B" fill="#F57C20" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Feature flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {flags.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <code className="flex-1 text-sm font-mono">{f.key}</code>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={() => toggleFlag(f.key)}
                  className="h-4 w-4"
                />
                Activé
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={f.rollout}
                  onChange={(e) =>
                    setRollout(f.key, parseInt(e.target.value, 10))
                  }
                  className="w-32"
                />
                <span className="w-10 text-xs tabular-nums">
                  {f.rollout}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
