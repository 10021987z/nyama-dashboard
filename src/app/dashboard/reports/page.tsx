"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  FileJson,
  FileType,
  Loader2,
} from "lucide-react";
import {
  type ReportFormat,
  type ReportHistoryEntry,
  buildReport,
  downloadReport,
  appendHistoryEntry,
  loadReportHistory,
} from "@/lib/report-generators";

interface Template {
  id: string;
  title: string;
  desc: string;
  icon: typeof Calendar;
  color: string;
  formats: ReportFormat[];
}

const TEMPLATES: Template[] = [
  {
    id: "rep1",
    title: "Rapport opérationnel quotidien",
    desc: "Commandes, livraisons, revenus, incidents — vue 24h",
    icon: Calendar,
    color: "#F57C20",
    formats: ["PDF", "CSV"],
  },
  {
    id: "rep2",
    title: "Reporting financier mensuel",
    desc: "GMV, commission, payouts restaurants, mix paiements",
    icon: FileText,
    color: "#1B4332",
    formats: ["PDF", "XLSX"],
  },
  {
    id: "rep3",
    title: "Performance restaurants",
    desc: "Top/Flop, note moyenne, taux d'annulation, temps prépa",
    icon: FileSpreadsheet,
    color: "#b45309",
    formats: ["XLSX", "CSV"],
  },
  {
    id: "rep4",
    title: "Performance flotte livreurs",
    desc: "Activité, gains, courses, zones, note moyenne",
    icon: FileSpreadsheet,
    color: "#2563eb",
    formats: ["XLSX", "CSV"],
  },
  {
    id: "rep5",
    title: "Comptabilité — export brut",
    desc: "Toutes transactions horodatées (compatible Sage / Excel)",
    icon: FileJson,
    color: "#7c3aed",
    formats: ["CSV", "JSON"],
  },
  {
    id: "rep6",
    title: "Audit qualité & avis",
    desc: "Tous les avis publiés / signalés sur la période",
    icon: FileType,
    color: "#db2777",
    formats: ["PDF", "CSV"],
  },
];

function formatSize(kb: number): string {
  if (kb === 0) return "—";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState<ReportHistoryEntry[]>([]);
  const [busy, setBusy] = useState<{ id: string; format: ReportFormat } | null>(
    null,
  );

  useEffect(() => {
    setHistory(loadReportHistory());
  }, []);

  const handleQuickPeriod = (q: "7j" | "30j" | "90j" | "1 an") => {
    const days = q === "7j" ? 7 : q === "30j" ? 30 : q === "90j" ? 90 : 365;
    const d = new Date();
    d.setDate(d.getDate() - days);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const handleDownload = async (
    template: Template,
    format: ReportFormat,
  ) => {
    setBusy({ id: template.id, format });
    try {
      const payload = await buildReport(template.id, { from, to });
      const result = downloadReport(payload, format);

      const entry: ReportHistoryEntry = {
        id: `h_${Date.now()}`,
        templateId: template.id,
        title: payload.title,
        format,
        filename: result.filename,
        sizeKb: result.sizeKb,
        generatedAt: payload.generatedAt,
        generatedBy: "Admin (manuel)",
        period: payload.period,
        payload,
      };
      appendHistoryEntry(entry);
      setHistory(loadReportHistory());

      toast.success(
        format === "PDF"
          ? "Rapport ouvert dans une nouvelle fenêtre — utilise le dialogue d'impression pour sauvegarder en PDF"
          : `${result.filename} téléchargé (${formatSize(result.sizeKb)})`,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Échec de la génération du rapport",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleRedownload = (entry: ReportHistoryEntry) => {
    try {
      const result = downloadReport(entry.payload, entry.format);
      toast.success(
        entry.format === "PDF"
          ? "Rapport rouvert pour impression"
          : `${result.filename} re-téléchargé`,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Re-téléchargement impossible",
      );
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1
          className="text-[1.8rem] font-semibold italic leading-tight"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Rapports & Exports
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Génération de rapports planifiés ou à la demande
        </p>
      </div>

      <div
        className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "#6B7280" }}
        >
          Période :
        </p>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-full px-4 py-2 text-sm outline-none"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        />
        <span className="text-xs" style={{ color: "#9ca3af" }}>
          →
        </span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-full px-4 py-2 text-sm outline-none"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        />
        <div
          className="flex gap-1 rounded-full p-1 ml-auto"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          {(["7j", "30j", "90j", "1 an"] as const).map((q) => (
            <button
              key={q}
              onClick={() => handleQuickPeriod(q)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white"
              style={{ color: "#6B7280" }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.id}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#fdf3ee" }}
                >
                  <Icon className="h-5 w-5" style={{ color: tpl.color }} />
                </div>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{
                      fontFamily:
                        "var(--font-montserrat), system-ui, sans-serif",
                      color: "#3D3D3D",
                    }}
                  >
                    {tpl.title}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: "#6B7280" }}
                  >
                    {tpl.desc}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                {tpl.formats.map((fmt) => {
                  const isBusy =
                    busy?.id === tpl.id && busy.format === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => handleDownload(tpl, fmt)}
                      disabled={isBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-semibold transition-opacity disabled:opacity-50"
                      style={{
                        background:
                          "linear-gradient(135deg, #F57C20, #E06A10)",
                        color: "#fff",
                      }}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid #f5f3ef" }}
        >
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>
            Derniers exports générés
          </h3>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>
            Conservés localement (50 derniers max). Cliquez sur le bouton{" "}
            <Download className="inline h-3 w-3" /> pour re-télécharger.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#fbf9f5" }}>
                {[
                  "Rapport",
                  "Format",
                  "Taille",
                  "Date",
                  "Généré par",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "#6B7280" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs"
                    style={{ color: "#9ca3af" }}
                  >
                    Aucun export généré pour le moment.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-[#fbf9f5] transition-colors"
                  >
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "#3D3D3D" }}
                    >
                      {h.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{
                          backgroundColor: "#fdf3ee",
                          color: "#F57C20",
                        }}
                      >
                        {h.format}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{
                        color: "#6B7280",
                        fontFamily: "var(--font-mono), monospace",
                      }}
                    >
                      {formatSize(h.sizeKb)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#6B7280" }}
                    >
                      {new Date(h.generatedAt).toLocaleString("fr-FR")}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#6B7280" }}
                    >
                      {h.generatedBy}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRedownload(h)}
                        title="Re-télécharger"
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef]"
                      >
                        <Download
                          className="h-3.5 w-3.5"
                          style={{ color: "#6B7280" }}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>
    </div>
  );
}
