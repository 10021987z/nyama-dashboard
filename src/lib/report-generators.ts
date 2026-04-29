// Génération de rapports côté client — pas de lib externe lourde.
//
// CSV / JSON : natifs (Blob + download).
// XLSX       : table HTML avec MIME `application/vnd.ms-excel` (.xls), Excel l'ouvre.
// PDF        : ouvre une fenêtre HTML stylée et lance `print()` ; l'utilisateur
//              choisit "Enregistrer en PDF" dans le dialogue navigateur.

import { apiClient } from "./api";

export type ReportFormat = "PDF" | "CSV" | "XLSX" | "JSON";

export type ReportRow = Record<string, string | number | null | undefined>;

export interface ReportPayload {
  title: string;
  generatedAt: string;
  period?: { from: string; to: string };
  meta?: ReportRow;
  rows: ReportRow[];
}

// ─── Sources de données ─────────────────────────────────────────────

interface DailyReportApi {
  date: string;
  generatedAt: string;
  summary: {
    ordersTotal: number;
    ordersDelivered: number;
    ordersCancelled: number;
    successRate: number;
    grossXaf: number;
    deliveryFeesXaf: number;
    netPlatformXaf: number;
    newUsers: number;
  };
  topCooks: Array<{
    cookUserId: string;
    name: string;
    orders: number;
    grossXaf: number;
  }>;
}

interface FinancesTreasury {
  totalRevenueXaf?: number;
  netPlatformXaf?: number;
  totalTransactions?: number;
  avgBasketXaf?: number;
  payoutsXaf?: number;
}

interface CommissionEntry {
  cookProfileId?: string;
  cookUserId: string;
  name: string;
  orderCount: number;
  grossXaf: number;
  commissionXaf: number;
  rate?: number;
}

interface LeaderboardCook {
  cookProfileId?: string;
  name: string;
  orders: number;
  revenueXaf: number;
  avgRating?: number;
  prepTimeAvgMin?: number;
}

interface LeaderboardRider {
  riderProfileId?: string;
  riderUserId?: string;
  name: string;
  trips: number;
  earningsXaf: number;
  avgRating?: number;
  zoneCount?: number;
}

interface OrderEntry {
  id: string;
  status: string;
  totalXaf: number;
  deliveryFeeXaf: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  deliveredAt?: string | null;
  clientId?: string;
  cookId?: string;
  riderId?: string | null;
}

interface ReviewEntry {
  id: string;
  orderId: string;
  authorId: string;
  cookRating?: number;
  riderRating?: number;
  appRating?: number;
  cookComment?: string | null;
  riderComment?: string | null;
  comment?: string | null;
  createdAt: string;
}

const FCFA = (n: number) => `${(n ?? 0).toLocaleString("fr-FR")} XAF`;

export async function buildReport(
  templateId: string,
  period: { from: string; to: string },
): Promise<ReportPayload> {
  const generatedAt = new Date().toISOString();

  if (templateId === "rep1") {
    // Rapport opérationnel quotidien : POST /admin/reports/daily
    const data = await apiClient.post<DailyReportApi>("/admin/reports/daily", {
      date: period.to,
    });
    const rows: ReportRow[] = [
      { Indicateur: "Commandes totales", Valeur: data.summary.ordersTotal },
      {
        Indicateur: "Commandes livrées",
        Valeur: data.summary.ordersDelivered,
      },
      {
        Indicateur: "Commandes annulées",
        Valeur: data.summary.ordersCancelled,
      },
      {
        Indicateur: "Taux succès",
        Valeur: `${data.summary.successRate}%`,
      },
      { Indicateur: "GMV (brut)", Valeur: FCFA(data.summary.grossXaf) },
      {
        Indicateur: "Frais de livraison",
        Valeur: FCFA(data.summary.deliveryFeesXaf),
      },
      {
        Indicateur: "Net plateforme",
        Valeur: FCFA(data.summary.netPlatformXaf),
      },
      { Indicateur: "Nouveaux utilisateurs", Valeur: data.summary.newUsers },
    ];
    data.topCooks.forEach((c, i) => {
      rows.push({
        Indicateur: `Top cook #${i + 1}`,
        Valeur: `${c.name} — ${c.orders} cmd, ${FCFA(c.grossXaf)}`,
      });
    });
    return {
      title: `Rapport opérationnel — ${data.date}`,
      generatedAt,
      period,
      meta: { date: data.date },
      rows,
    };
  }

  if (templateId === "rep2") {
    // Reporting financier mensuel
    const [treasury, commissions] = await Promise.all([
      apiClient.get<FinancesTreasury>("/admin/finances/treasury"),
      apiClient.get<{ items?: CommissionEntry[] }>(
        "/admin/finances/commissions",
        { period: "30d" },
      ),
    ]);
    const rows: ReportRow[] = [
      {
        Section: "Treasury",
        Indicateur: "Total revenue",
        Valeur: FCFA(treasury.totalRevenueXaf ?? 0),
      },
      {
        Section: "Treasury",
        Indicateur: "Net plateforme",
        Valeur: FCFA(treasury.netPlatformXaf ?? 0),
      },
      {
        Section: "Treasury",
        Indicateur: "Transactions",
        Valeur: treasury.totalTransactions ?? 0,
      },
      {
        Section: "Treasury",
        Indicateur: "Panier moyen",
        Valeur: FCFA(treasury.avgBasketXaf ?? 0),
      },
    ];
    (commissions.items ?? []).forEach((c) => {
      rows.push({
        Section: "Commissions par cook",
        Restaurant: c.name,
        Commandes: c.orderCount,
        Brut: FCFA(c.grossXaf),
        Commission: FCFA(c.commissionXaf),
      });
    });
    return {
      title: "Reporting financier — 30 derniers jours",
      generatedAt,
      period,
      rows,
    };
  }

  if (templateId === "rep3") {
    // Performance restaurants
    const lb = await apiClient.get<{ items?: LeaderboardCook[] }>(
      "/admin/leaderboard/cooks",
      { period: "month" },
    );
    const rows = (lb.items ?? []).map((c) => ({
      Restaurant: c.name,
      Commandes: c.orders,
      "Revenus XAF": c.revenueXaf,
      "Note moy.": c.avgRating ?? "—",
      "Temps prépa moy. (min)": c.prepTimeAvgMin ?? "—",
    }));
    return {
      title: "Performance restaurants — leaderboard mensuel",
      generatedAt,
      period,
      rows,
    };
  }

  if (templateId === "rep4") {
    // Performance flotte livreurs
    const lb = await apiClient.get<{ items?: LeaderboardRider[] }>(
      "/admin/leaderboard/riders",
      { period: "month" },
    );
    const rows = (lb.items ?? []).map((r) => ({
      Livreur: r.name,
      Courses: r.trips,
      "Gains XAF": r.earningsXaf,
      "Note moy.": r.avgRating ?? "—",
      Zones: r.zoneCount ?? "—",
    }));
    return {
      title: "Performance flotte livreurs — leaderboard mensuel",
      generatedAt,
      period,
      rows,
    };
  }

  if (templateId === "rep5") {
    // Comptabilité brut — toutes les transactions
    const orders = await apiClient.get<{ data?: OrderEntry[] }>(
      "/admin/orders",
      { limit: 1000 },
    );
    const rows = (orders.data ?? []).map((o) => ({
      "Order ID": o.id,
      "Date création": o.createdAt,
      "Date livraison": o.deliveredAt ?? "",
      Statut: o.status,
      "Total XAF": o.totalXaf,
      "Frais livraison XAF": o.deliveryFeeXaf,
      "Méthode paiement": o.paymentMethod,
      "Statut paiement": o.paymentStatus,
      "Client ID": o.clientId ?? "",
      "Cook ID": o.cookId ?? "",
      "Rider ID": o.riderId ?? "",
    }));
    return {
      title: "Comptabilité — export brut transactions",
      generatedAt,
      period,
      rows,
    };
  }

  if (templateId === "rep6") {
    // Audit qualité & avis
    const reviews = await apiClient.get<{ data?: ReviewEntry[] } | ReviewEntry[]>(
      "/reviews",
    );
    const list = Array.isArray(reviews)
      ? reviews
      : (reviews?.data ?? []);
    const rows = list.map((r) => ({
      "Review ID": r.id,
      "Order ID": r.orderId,
      "Client ID": r.authorId,
      "Note cook": r.cookRating ?? "",
      "Note rider": r.riderRating ?? "",
      "Note app": r.appRating ?? "",
      "Commentaire cook": r.cookComment ?? r.comment ?? "",
      "Commentaire rider": r.riderComment ?? "",
      "Date": r.createdAt,
    }));
    return {
      title: "Audit qualité & avis",
      generatedAt,
      period,
      rows,
    };
  }

  throw new Error(`Template inconnu: ${templateId}`);
}

// ─── Formatters ─────────────────────────────────────────────────────

function escapeCsvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(payload: ReportPayload): string {
  if (payload.rows.length === 0) return "";
  const headers = Array.from(
    new Set(payload.rows.flatMap((r) => Object.keys(r))),
  );
  const lines = [headers.join(",")];
  for (const row of payload.rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  }
  return lines.join("\n");
}

export function toJson(payload: ReportPayload): string {
  return JSON.stringify(
    {
      title: payload.title,
      generatedAt: payload.generatedAt,
      period: payload.period,
      meta: payload.meta,
      data: payload.rows,
    },
    null,
    2,
  );
}

function escapeHtml(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtmlTable(payload: ReportPayload): string {
  const headers = Array.from(
    new Set(payload.rows.flatMap((r) => Object.keys(r))),
  );
  const thead = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
  const tbody = payload.rows
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

// HTML-Excel: Excel ouvre proprement les .xls qui contiennent une table HTML
// avec le bon MIME. C'est moins riche qu'un vrai XLSX mais zéro lib externe.
export function toXlsHtml(payload: ReportPayload): string {
  const table = toHtmlTable(payload);
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><title>${escapeHtml(payload.title)}</title></head><body><h2>${escapeHtml(payload.title)}</h2><p style="font-size:11px;color:#666">Généré le ${escapeHtml(payload.generatedAt)}${payload.period ? ` · Période ${escapeHtml(payload.period.from)} → ${escapeHtml(payload.period.to)}` : ""}</p>${table}</body></html>`;
}

// PDF : ouvrir une fenêtre, écrire le HTML stylé, déclencher print().
// L'utilisateur sauvegarde en PDF via le dialogue d'impression du navigateur.
export function printAsPdf(payload: ReportPayload): void {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    throw new Error(
      "Le navigateur a bloqué la nouvelle fenêtre — autorise les popups pour ce site",
    );
  }
  const html = `<!doctype html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(payload.title)}</title>
<style>
body{font-family:Arial,sans-serif;color:#1B4332;padding:24px;}
h1{font-size:20px;margin:0 0 4px;color:#3D3D3D}
.meta{font-size:11px;color:#6B7280;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:11px}
th{background:#f5f3ef;text-align:left;padding:6px;border:1px solid #ddd;color:#3D3D3D}
td{padding:6px;border:1px solid #eee}
tr:nth-child(even) td{background:#fbf9f5}
@media print{ button{display:none} }
</style></head><body>
<h1>${escapeHtml(payload.title)}</h1>
<p class="meta">Généré le ${new Date(payload.generatedAt).toLocaleString("fr-FR")}${payload.period ? ` · Période ${escapeHtml(payload.period.from)} → ${escapeHtml(payload.period.to)}` : ""}</p>
${toHtmlTable(payload)}
<script>setTimeout(()=>window.print(),300);</script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ─── Téléchargement ──────────────────────────────────────────────────

function downloadBlob(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadReport(
  payload: ReportPayload,
  format: ReportFormat,
): { filename: string; sizeKb: number } {
  const slug = payload.title
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${slug}-${stamp}`;

  let content = "";
  let mime = "";
  let filename = "";

  switch (format) {
    case "CSV":
      content = toCsv(payload);
      mime = "text/csv;charset=utf-8";
      filename = `${base}.csv`;
      break;
    case "JSON":
      content = toJson(payload);
      mime = "application/json";
      filename = `${base}.json`;
      break;
    case "XLSX":
      content = toXlsHtml(payload);
      mime = "application/vnd.ms-excel";
      filename = `${base}.xls`;
      break;
    case "PDF":
      printAsPdf(payload);
      return { filename: `${base}.pdf`, sizeKb: 0 };
  }

  downloadBlob(content, mime, filename);
  return {
    filename,
    sizeKb: Math.round((new Blob([content]).size / 1024) * 10) / 10,
  };
}

// ─── Historique localStorage ─────────────────────────────────────────

const HISTORY_KEY = "nyama_reports_history";

export interface ReportHistoryEntry {
  id: string;
  templateId: string;
  title: string;
  format: ReportFormat;
  filename: string;
  sizeKb: number;
  generatedAt: string;
  generatedBy: string;
  period?: { from: string; to: string };
  // Le payload est sauvegardé pour permettre le re-download depuis l'historique.
  payload: ReportPayload;
}

export function loadReportHistory(): ReportHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ReportHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveReportHistory(history: ReportHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  // Garder les 50 derniers — au-delà la storage devient lourde (payload inclus).
  const trimmed = history.slice(0, 50);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota dépassé — on ignore silencieusement
  }
}

export function appendHistoryEntry(entry: ReportHistoryEntry): void {
  const list = loadReportHistory();
  saveReportHistory([entry, ...list]);
}
