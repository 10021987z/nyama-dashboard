"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertOctagon, Power, History, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api";

// MOCK: Incident timeline is persisted in localStorage until the backend
// exposes GET/POST /admin/crisis/incidents.
// Contract that Agent A should implement:
//   POST /admin/maintenance { minutes: number, reason: string } → { id, startedAt, endsAt }
//   GET  /admin/crisis/incidents → CrisisIncident[]
type CrisisIncident = {
  id: string;
  reason: string;
  durationMinutes: number;
  startedAt: string;
  endsAt: string;
  triggeredBy?: string;
};

const STORAGE_KEY = "nyama_crisis_incidents";

function loadIncidents(): CrisisIncident[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CrisisIncident[]) : [];
  } catch {
    return [];
  }
}

function saveIncidents(incidents: CrisisIncident[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
}

export default function CrisisPage() {
  const [duration, setDuration] = useState<number>(30);
  const [reason, setReason] = useState<string>("");
  const [activating, setActivating] = useState(false);
  const [incidents, setIncidents] = useState<CrisisIncident[]>([]);
  const [activeIncident, setActiveIncident] = useState<CrisisIncident | null>(
    null
  );

  useEffect(() => {
    const list = loadIncidents();
    setIncidents(list);
    const now = Date.now();
    const active = list.find((i) => new Date(i.endsAt).getTime() > now);
    if (active) setActiveIncident(active);
  }, []);

  const activate = async () => {
    if (!reason.trim()) {
      toast.error("Veuillez indiquer la raison de l'activation.");
      return;
    }
    if (duration < 1) {
      toast.error("Durée invalide.");
      return;
    }
    setActivating(true);
    try {
      // MOCK: Try real endpoint; if missing, we persist locally only.
      try {
        await apiClient.post("/admin/maintenance", {
          minutes: duration,
          reason,
        });
      } catch {
        // ignore — fall through to local-only mode
      }

      const now = new Date();
      const endsAt = new Date(now.getTime() + duration * 60_000);
      const inc: CrisisIncident = {
        id: `inc_${Date.now()}`,
        reason,
        durationMinutes: duration,
        startedAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
      };
      const next = [inc, ...incidents].slice(0, 50);
      setIncidents(next);
      setActiveIncident(inc);
      saveIncidents(next);
      setReason("");
      toast.success(`Mode crise activé pour ${duration} min.`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de l'activation."
      );
    } finally {
      setActivating(false);
    }
  };

  const endEarly = () => {
    if (!activeIncident) return;
    const now = new Date().toISOString();
    const updated = incidents.map((i) =>
      i.id === activeIncident.id ? { ...i, endsAt: now } : i
    );
    setIncidents(updated);
    saveIncidents(updated);
    setActiveIncident(null);
    toast.success("Mode crise désactivé.");
  };

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
          Mode Crise
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suspension temporaire de l&apos;activité — notifiez toutes les apps
          partenaires (clients, cuisinières, livreurs).
        </p>
      </div>

      {activeIncident && (
        <Alert variant="destructive">
          <AlertOctagon className="h-4 w-4" />
          <AlertTitle>Mode crise ACTIF</AlertTitle>
          <AlertDescription className="flex items-center gap-4">
            <span>
              <strong>Raison:</strong> {activeIncident.reason} ·{" "}
              <strong>Fin prévue:</strong>{" "}
              {new Date(activeIncident.endsAt).toLocaleString("fr-FR")}
            </span>
            <Button variant="outline" size="sm" onClick={endEarly}>
              <Power className="h-3 w-3" /> Désactiver maintenant
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5" style={{ color: "#E8413C" }} />
            Activation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Durée (minutes)
              </label>
              <Input
                type="number"
                min={1}
                max={1440}
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value || "0", 10))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Raison (visible en interne)
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex. orage violent à Douala"
                className="mt-1"
              />
            </div>
          </div>

          <button
            onClick={activate}
            disabled={activating || !!activeIncident}
            className="flex w-full items-center justify-center gap-3 rounded-xl py-6 text-lg font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              background:
                "linear-gradient(135deg, #E8413C, #991b1b)",
              boxShadow: "0 4px 24px rgba(232, 65, 60, 0.4)",
            }}
          >
            <span style={{ fontSize: 24 }}>🚨</span>
            {activating
              ? "Activation en cours..."
              : activeIncident
                ? "Mode crise déjà actif"
                : "ACTIVER MODE CRISE"}
          </button>

          <p className="text-xs text-muted-foreground">
            Cela envoie <code>POST /admin/maintenance</code> au backend
            (l&apos;incident est aussi enregistré localement pour l&apos;historique
            tant que l&apos;endpoint dédié n&apos;existe pas).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique des incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun incident enregistré.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Début</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((i) => {
                  const active =
                    new Date(i.endsAt).getTime() > Date.now();
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs">
                        {new Date(i.startedAt).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {i.durationMinutes} min
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{i.reason}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(i.endsAt).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={active ? "destructive" : "secondary"}
                        >
                          {active ? "Actif" : "Terminé"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
