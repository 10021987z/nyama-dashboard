"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Bell, Send, Mail, MessageCircle, Users, Smartphone } from "lucide-react";

const HISTORY = [
  { id: "n1", title: "🔥 Promo Ndolè -20% ce weekend", channel: "PUSH", audience: "Tous clients", sent: 4250, opened: 1632, date: "2026-04-07 18:30" },
  { id: "n2", title: "Votre commande est en route 🏍", channel: "SMS", audience: "Transactionnel", sent: 1240, opened: 1240, date: "2026-04-07 12:14" },
  { id: "n3", title: "Nouveaux restaurants à Yaoundé !", channel: "PUSH", audience: "Yaoundé · 30j", sent: 1820, opened: 612, date: "2026-04-05 10:00" },
  { id: "n4", title: "On vous a manqué ? -15% sur votre prochaine commande", channel: "EMAIL", audience: "Inactifs 60j+", sent: 980, opened: 287, date: "2026-04-03 09:00" },
];

const CHANNELS = [
  { v: "PUSH", label: "Push mobile", Icon: Smartphone, color: "#F57C20" },
  { v: "SMS", label: "SMS", Icon: MessageCircle, color: "#1B4332" },
  { v: "EMAIL", label: "Email", Icon: Mail, color: "#2563eb" },
] as const;

export default function CommunicationsPage() {
  const { t } = useLanguage();
  const [channel, setChannel] = useState<"PUSH" | "SMS" | "EMAIL">("PUSH");
  const [audience, setAudience] = useState("Tous clients actifs");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
          Notifications & Communications
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Push · SMS · Email · ciblage par segment</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { Icon: Bell, label: "Push 7j", value: "12 240", c: "#F57C20" },
          { Icon: MessageCircle, label: "SMS 7j", value: "3 480", c: "#1B4332" },
          { Icon: Mail, label: "Email 7j", value: "1 820", c: "#2563eb" },
          { Icon: Users, label: "Audience max", value: "8 940", c: "#b45309" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: "#fdf3ee" }}>
              <s.Icon className="h-5 w-5" style={{ color: s.c }} />
            </div>
            <div>
              <p className="text-[1.6rem] font-bold leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Composer */}
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>Nouvelle campagne</h3>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>Canal</label>
            <div className="flex gap-2">
              {CHANNELS.map(({ v, label, Icon, color }) => (
                <button
                  key={v}
                  onClick={() => setChannel(v)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all"
                  style={
                    channel === v
                      ? { backgroundColor: color, color: "#fff" }
                      : { backgroundColor: "#f5f3ef", color: "#6B7280" }
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            >
              <option>Tous clients actifs</option>
              <option>Clients VIP</option>
              <option>Nouveaux clients (30j)</option>
              <option>Clients à risque (30-90j)</option>
              <option>Clients perdus (90j+)</option>
              <option>Douala uniquement</option>
              <option>Yaoundé uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : 🔥 -20% sur le ndolè ce weekend"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Tapez votre message…"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <Send className="h-4 w-4" />
            Envoyer la campagne
          </button>
        </div>

        {/* Preview */}
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "#fbf9f5", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>Aperçu mobile</h3>
          <div className="mx-auto max-w-[280px] rounded-3xl p-3" style={{ backgroundColor: "#3D3D3D" }}>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "#fff" }}>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#F57C20" }}>N</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold" style={{ color: "#3D3D3D" }}>NYAMA</p>
                    <p className="text-[9px]" style={{ color: "#9ca3af" }}>maintenant</p>
                  </div>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "#3D3D3D" }}>
                    {title || "Titre de votre notification"}
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>
                    {body || "Le contenu du message apparaîtra ici…"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center" style={{ color: "#9ca3af" }}>
            Audience estimée : <span className="font-bold" style={{ color: "#3D3D3D" }}>~ 4 250 utilisateurs</span>
          </p>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>Historique des envois</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#fbf9f5" }}>
                {["Titre", "Canal", "Audience", "Envoyés", "Ouverts", "CTR", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((n) => {
                const ctr = Math.round((n.opened / n.sent) * 100);
                return (
                  <tr key={n.id} className="hover:bg-[#fbf9f5] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#3D3D3D" }}>{n.title}</td>
                    <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: "#fdf3ee", color: "#F57C20" }}>{n.channel}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{n.audience}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#3D3D3D", fontFamily: "var(--font-mono), monospace" }}>{n.sent.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#6B7280", fontFamily: "var(--font-mono), monospace" }}>{n.opened.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3"><span className="text-sm font-bold" style={{ color: ctr >= 30 ? "#166534" : "#b45309" }}>{ctr}%</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9ca3af" }}>{n.date}</td>
                  </tr>
                );
              })}
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
