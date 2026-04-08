"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { FileText, Download, Calendar, FileSpreadsheet, FileJson, FileType } from "lucide-react";

const TEMPLATES = [
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

const HISTORY = [
  { id: "h1", title: "Reporting financier mars 2026", format: "PDF", size: "1.4 MB", date: "2026-04-01 09:00", by: "Système (cron)" },
  { id: "h2", title: "Performance restaurants S13", format: "XLSX", size: "320 KB", date: "2026-03-31 18:12", by: "admin@nyama.cm" },
  { id: "h3", title: "Rapport opérationnel 2026-03-30", format: "PDF", size: "780 KB", date: "2026-03-31 06:00", by: "Système (cron)" },
  { id: "h4", title: "Comptabilité Q1 2026 — brut", format: "CSV", size: "2.8 MB", date: "2026-04-02 14:22", by: "compta@nyama.cm" },
];

export default function ReportsPage() {
  const { t } = useLanguage();
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState("2026-04-08");

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
          Rapports & Exports
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Génération de rapports planifiés ou à la demande</p>
      </div>

      {/* Period selector */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Période :</p>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-full px-4 py-2 text-sm outline-none"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        />
        <span className="text-xs" style={{ color: "#9ca3af" }}>→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-full px-4 py-2 text-sm outline-none"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        />
        <div className="flex gap-1 rounded-full p-1 ml-auto" style={{ backgroundColor: "#f5f3ef" }}>
          {["7j", "30j", "90j", "1 an"].map((q) => (
            <button key={q} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ color: "#6B7280" }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div key={tpl.id} className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: "#fdf3ee" }}>
                  <Icon className="h-5 w-5" style={{ color: tpl.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>{tpl.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>{tpl.desc}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                {tpl.formats.map((fmt) => (
                  <button
                    key={fmt}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-semibold transition-colors"
                    style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }}
                  >
                    <Download className="h-3 w-3" />
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>Derniers exports générés</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#fbf9f5" }}>
                {["Rapport", "Format", "Taille", "Date", "Généré par", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#3D3D3D" }}>{h.title}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: "#fdf3ee", color: "#F57C20" }}>{h.format}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280", fontFamily: "var(--font-mono), monospace" }}>{h.size}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{h.date}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{h.by}</td>
                  <td className="px-4 py-3">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef]">
                      <Download className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2" style={{ color: "#b8b3ad" }}>
        {t("footer")}
      </p>
    </div>
  );
}
