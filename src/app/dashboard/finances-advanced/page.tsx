"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator,
  FileDown,
  Wallet,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFcfa } from "@/lib/utils";

// MOCK: Restaurant commission overrides and treasury balance. Replace with:
//   GET  /admin/finances/commissions
//   PATCH /admin/finances/commissions/:restaurantId { rate }
//   GET  /admin/finances/treasury
//   GET  /admin/finances/payslip/:riderId?week=yyyy-Www
//   GET  /admin/finances/export?format=ohada
// None exist yet.

type Restaurant = { id: string; name: string; commission: number };

const DEFAULT_RATE = 0.15;

const RESTAURANTS: Restaurant[] = [
  { id: "r1", name: "Chez Rose", commission: 0.15 },
  { id: "r2", name: "Catherine Cuisine", commission: 0.12 },
  { id: "r3", name: "Aminata's Kitchen", commission: 0.17 },
  { id: "r4", name: "Madeleine Etoa", commission: 0.15 },
];

type Rider = { id: string; name: string };
const RIDERS: Rider[] = [
  { id: "rd1", name: "Ibrahim Ngono" },
  { id: "rd2", name: "Paul Tchoupo" },
  { id: "rd3", name: "Samuel Atangana" },
];

// MOCK: Treasury balance is static
const TREASURY_BALANCE = 2_450_000;

function isoWeek(d: Date): string {
  const year = d.getUTCFullYear();
  const day = new Date(Date.UTC(year, d.getUTCMonth(), d.getUTCDate()));
  const dayNum = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function buildPayslipHtml(params: {
  rider: string;
  week: string;
  deliveries: { date: string; orderId: string; amount: number }[];
}): string {
  const total = params.deliveries.reduce((s, d) => s + d.amount, 0);
  const rows = params.deliveries
    .map(
      (d) =>
        `<tr><td>${d.date}</td><td>${d.orderId}</td><td style="text-align:right">${formatFcfa(
          d.amount
        )}</td></tr>`
    )
    .join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><title>Bulletin — ${params.rider}</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;padding:40px;color:#3D3D3D;}
  h1{color:#F57C20;margin:0 0 4px;}
  .meta{color:#6B7280;font-size:14px;margin-bottom:32px;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;}
  th{background:#fafaf7;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#6B7280;}
  tfoot td{font-weight:bold;background:#fdf3ee;}
  .total{margin-top:24px;padding:16px;background:#fdf3ee;border-radius:8px;font-size:18px;font-weight:bold;color:#F57C20;text-align:right;}
  @media print{button{display:none}}
</style></head>
<body>
<h1>Bulletin de livreur NYAMA</h1>
<p class="meta">Livreur : <strong>${params.rider}</strong> · Semaine : <strong>${params.week}</strong></p>
<table>
  <thead><tr><th>Date</th><th>Commande</th><th style="text-align:right">Gain</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="3" style="color:#6B7280">Aucune livraison</td></tr>'}</tbody>
</table>
<div class="total">Total net: ${formatFcfa(total)}</div>
<div style="margin-top:32px;color:#6B7280;font-size:12px">Document généré par NYAMA Admin — valeur comptable indicative.</div>
</body></html>`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FinancesAdvancedPage() {
  const [overrides, setOverrides] = useState<Restaurant[]>(RESTAURANTS);
  const [globalRate, setGlobalRate] = useState(DEFAULT_RATE);
  const [riderId, setRiderId] = useState(RIDERS[0].id);
  const [week, setWeek] = useState(isoWeek(new Date()));
  const [treasuryThreshold, setTreasuryThreshold] = useState(1_000_000);

  const commissionByRestaurant = useMemo(
    () =>
      overrides.reduce(
        (acc, r) => ({ ...acc, [r.id]: r.commission }),
        {} as Record<string, number>
      ),
    [overrides]
  );

  const lowTreasury = TREASURY_BALANCE < treasuryThreshold;

  const updateCommission = (id: string, rate: number) => {
    setOverrides((prev) =>
      prev.map((r) => (r.id === id ? { ...r, commission: rate } : r))
    );
  };

  const generatePayslip = () => {
    const rider = RIDERS.find((r) => r.id === riderId)?.name ?? "—";
    // MOCK: fabricate 8-15 deliveries for the selected week
    const count = 8 + Math.floor(Math.random() * 8);
    const deliveries = Array.from({ length: count }, (_, i) => ({
      date: `2026-04-${String(15 + (i % 7)).padStart(2, "0")}`,
      orderId: `ORD-${Math.floor(Math.random() * 99999)}`,
      amount: 1500 + Math.floor(Math.random() * 2000),
    }));
    const html = buildPayslipHtml({ rider, week, deliveries });
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) {
      toast.error("Popup bloquée — autorisez les fenêtres popup.");
      return;
    }
    w.document.write(html);
    w.document.write(
      `<script>setTimeout(function(){window.print();},400);<\/script>`
    );
    w.document.close();
    toast.success("Bulletin prêt à imprimer.");
  };

  const exportOhada = () => {
    // Simplified OHADA-compatible ledger layout. Real export requires the
    // chart of accounts (SYSCOHADA plan comptable) — this uses the main
    // columns: Date | Journal | Compte | Libellé | Débit | Crédit.
    const rows: (string | number)[][] = [
      ["Date", "Journal", "Compte", "Libellé", "Débit (FCFA)", "Crédit (FCFA)"],
    ];
    const today = new Date().toISOString().slice(0, 10);
    overrides.forEach((r) => {
      const gross = 500_000; // MOCK: gross revenue per restaurant
      const commission = gross * r.commission;
      rows.push([
        today,
        "VE",
        "701000",
        `Ventes — ${r.name}`,
        0,
        gross - commission,
      ]);
      rows.push([
        today,
        "VE",
        "706000",
        `Commission NYAMA — ${r.name}`,
        0,
        commission,
      ]);
    });
    downloadCsv(`nyama-ohada-${today}.csv`, rows);
    toast.success(
      "Export OHADA CSV téléchargé (placeholder — colonnes principales uniquement)."
    );
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
          Finance avancée
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calcul commissions, bulletins livreurs, export OHADA, alerte trésorerie.
        </p>
      </div>

      {lowTreasury && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trésorerie basse</AlertTitle>
          <AlertDescription>
            Solde {formatFcfa(TREASURY_BALANCE)} &lt; seuil{" "}
            {formatFcfa(treasuryThreshold)} — prévoir un réapprovisionnement.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" style={{ color: "#1B4332" }} />
              Trésorerie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatFcfa(TREASURY_BALANCE)}</p>
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">
                Seuil d&apos;alerte
              </label>
              <Input
                type="number"
                value={treasuryThreshold}
                onChange={(e) =>
                  setTreasuryThreshold(
                    parseInt(e.target.value || "0", 10)
                  )
                }
              />
            </div>
            {lowTreasury && (
              <Badge variant="destructive" className="mt-2">
                Sous seuil
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" style={{ color: "#F57C20" }} />
              Commission globale NYAMA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Taux par défaut (%)
            </label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={globalRate}
              onChange={(e) =>
                setGlobalRate(parseFloat(e.target.value || "0"))
              }
            />
            <p className="text-xs text-muted-foreground">
              Ce taux s&apos;applique aux restaurants sans override.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Export comptable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Schéma OHADA simplifié : <code>Date</code>, <code>Journal</code>,{" "}
              <code>Compte</code>, <code>Libellé</code>, <code>Débit</code>,{" "}
              <code>Crédit</code>.
            </p>
            <Button onClick={exportOhada} className="w-full">
              <FileDown className="h-3 w-3" /> Export OHADA CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commissions par restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Taux actuel</TableHead>
                <TableHead>Écart vs défaut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((r) => {
                const diff = r.commission - globalRate;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={1}
                          value={r.commission}
                          onChange={(e) =>
                            updateCommission(
                              r.id,
                              parseFloat(e.target.value || "0")
                            )
                          }
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {(r.commission * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Math.abs(diff) < 0.005
                            ? "secondary"
                            : diff > 0
                              ? "destructive"
                              : "default"
                        }
                      >
                        {diff >= 0 ? "+" : ""}
                        {(diff * 100).toFixed(1)} pt
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            Example de calcul: si un restaurant génère 500 000 FCFA avec un
            taux de {Math.round(commissionByRestaurant[overrides[0].id] * 100)}
            %, la commission NYAMA est de{" "}
            {formatFcfa(
              500_000 * commissionByRestaurant[overrides[0].id]
            )}
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Bulletin livreur hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Livreur</label>
              <Select
                value={riderId}
                onValueChange={(v) => setRiderId(v ?? RIDERS[0].id)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RIDERS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Semaine (YYYY-Www)
              </label>
              <Input
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                placeholder="2026-W17"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generatePayslip} className="w-full">
                <Printer className="h-3 w-3" /> Générer & imprimer
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ouvre une fenêtre HTML imprimable (Ctrl+P → &quot;Enregistrer en
            PDF&quot;). Génération côté client — pas de dépendance jsPDF
            externe requise.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
