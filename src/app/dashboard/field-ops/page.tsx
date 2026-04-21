"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Smartphone, AlertTriangle, CheckCircle, Hand, Wifi, WifiOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSocket } from "@/lib/admin-socket";

// MOCK: The socket connection uses the real admin-socket (stubbed locally
// until Agent B lands it). If no alerts come through within 4s, we seed the
// UI with example payloads so the page is usable for demo.
// PWA manifest: not included yet — add /public/manifest.json + link in
// app/layout.tsx metadata in a follow-up to make this installable on mobile.

type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  at: string;
  claimedBy?: string;
};

const SEED_ALERTS: Alert[] = [
  {
    id: "a1",
    severity: "critical",
    title: "Livraison en retard > 45 min",
    detail: "Commande ORD-4821 — rider Ibrahim, zone Akwa",
    at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "a2",
    severity: "warning",
    title: "Cuisinière en surcharge",
    detail: "Rose Mbala — 12 commandes en file, temps d'attente ~35min",
    at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: "a3",
    severity: "info",
    title: "Nouveau rider disponible",
    detail: "Francis Mbida s'est connecté (zone Bonanjo)",
    at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
  },
];

export default function FieldOpsPage() {
  const { user, loading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [online, setOnline] = useState<boolean>(true);
  const operator = user?.name ?? user?.phone ?? "Superviseur";

  useEffect(() => {
    if (loading) return;
    let seeded = false;
    let socket: ReturnType<typeof getAdminSocket> | null = null;
    try {
      socket = getAdminSocket();
      const onConnect = () => setOnline(true);
      const onDisconnect = () => setOnline(false);
      const onAlert = (payload: Alert) => {
        setAlerts((prev) => [payload, ...prev].slice(0, 50));
      };
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("alert:new", onAlert);
    } catch {
      setOnline(false);
    }

    // Fallback: if no live alerts come in shortly, seed UI so the page is usable
    const t = setTimeout(() => {
      if (!seeded) {
        setAlerts((prev) => (prev.length ? prev : SEED_ALERTS));
        seeded = true;
      }
    }, 2500);

    return () => {
      clearTimeout(t);
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("alert:new");
      }
    };
  }, [loading]);

  const claim = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, claimedBy: operator } : a))
    );
    toast.success("Incident pris en charge.");
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5" style={{ color: "#F57C20" }} />
        <h1
          className="text-xl font-bold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Field Ops
        </h1>
        <div className="ml-auto">
          {online ? (
            <Badge variant="secondary" className="gap-1">
              <Wifi className="h-3 w-3" /> Live
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" /> Hors ligne
            </Badge>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Supervision mobile — connectez-vous en Wi-Fi 4G et claimez les
        incidents depuis le terrain.
      </p>

      <Alert variant="info">
        <AlertTitle>PWA à venir</AlertTitle>
        <AlertDescription>
          Pour rendre cette page installable (icône écran d&apos;accueil),
          ajouter <code>/public/manifest.json</code> + lien manifest dans{" "}
          <code>app/layout.tsx</code>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Flux d&apos;alertes ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas d&apos;alerte pour le moment.
            </p>
          ) : (
            alerts.map((a) => {
              const icon =
                a.severity === "critical" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : a.severity === "warning" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                );
              const bg =
                a.severity === "critical"
                  ? "#fef2f2"
                  : a.severity === "warning"
                    ? "#fffbeb"
                    : "#eff6ff";
              const color =
                a.severity === "critical"
                  ? "#991b1b"
                  : a.severity === "warning"
                    ? "#9a3412"
                    : "#1e40af";
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 rounded-xl p-4"
                  style={{ backgroundColor: bg, color }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">{icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-tight">
                        {a.title}
                      </p>
                      <p className="mt-1 text-sm opacity-80">{a.detail}</p>
                      <p className="mt-1 text-xs opacity-60">
                        {new Date(a.at).toLocaleTimeString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {a.claimedBy ? (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Pris par {a.claimedBy}
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => claim(a.id)}
                      className="w-full h-12 text-base"
                    >
                      <Hand className="h-4 w-4" /> Prendre en charge
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
