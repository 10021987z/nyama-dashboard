"use client";

import { useLanguage } from "@/hooks/use-language";
import { formatFcfa, formatFcfaCompact } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, TrendingUp, CreditCard, Wallet, Download, ArrowDownRight, ArrowUpRight } from "lucide-react";

const REVENUE_30D = Array.from({ length: 30 }).map((_, i) => {
  const base = 850_000 + Math.sin(i / 3) * 180_000 + (i * 12_000);
  return { day: `J${i + 1}`, revenue: Math.round(base + Math.random() * 80_000), commission: Math.round((base + Math.random() * 80_000) * 0.18) };
});

const PAYMENT_MIX = [
  { name: "Mobile Money", value: 62, color: "#F57C20" },
  { name: "Cash à la livraison", value: 28, color: "#1B4332" },
  { name: "Carte bancaire", value: 8, color: "#D4A017" },
  { name: "Wallet NYAMA", value: 2, color: "#8b4c11" },
];

const PAYOUTS = [
  { id: "p1", restaurant: "Chez Mama Africa", period: "01-07 Avr", grossXaf: 1_240_000, commission: 223_200, netXaf: 1_016_800, status: "PAYÉ", date: "2026-04-08" },
  { id: "p2", restaurant: "Le Saveurs du 237", period: "01-07 Avr", grossXaf: 1_580_000, commission: 284_400, netXaf: 1_295_600, status: "PAYÉ", date: "2026-04-08" },
  { id: "p3", restaurant: "Bantu Kitchen", period: "01-07 Avr", grossXaf: 890_000, commission: 160_200, netXaf: 729_800, status: "EN COURS", date: "2026-04-09" },
  { id: "p4", restaurant: "Mboa Délices", period: "01-07 Avr", grossXaf: 720_000, commission: 129_600, netXaf: 590_400, status: "EN ATTENTE", date: "2026-04-10" },
];

function KpiCard({ icon, label, value, delta, positive, sub }: { icon: React.ReactNode; label: string; value: string; delta?: string; positive?: boolean; sub?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: "#fdf3ee" }}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[1.6rem] font-bold leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{label}</p>
          {sub && <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{sub}</p>}
        </div>
        {delta && (
          <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: positive ? "#dcfce7" : "#fee2e2", color: positive ? "#166534" : "#991b1b" }}>
            {positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FinancesPage() {
  const { t } = useLanguage();
  const totalGross = REVENUE_30D.reduce((a, d) => a + d.revenue, 0);
  const totalCommission = REVENUE_30D.reduce((a, d) => a + d.commission, 0);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
            Paiements & Finances
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Vue financière 30 jours · payouts restaurants · mix paiements</p>
        </div>
        <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ border: "1.5px solid #F57C20", color: "#F57C20" }}>
          <Download className="h-4 w-4" />
          Export comptable
        </button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<DollarSign className="h-5 w-5" style={{ color: "#F57C20" }} />} label="GMV brut 30j" value={formatFcfaCompact(totalGross)} delta="+12%" positive />
        <KpiCard icon={<Wallet className="h-5 w-5" style={{ color: "#166534" }} />} label="Commission NYAMA" value={formatFcfaCompact(totalCommission)} delta="+14%" positive sub="≈ 18% du GMV" />
        <KpiCard icon={<TrendingUp className="h-5 w-5" style={{ color: "#b45309" }} />} label="Panier moyen" value={formatFcfa(4250)} delta="+3%" positive />
        <KpiCard icon={<CreditCard className="h-5 w-5" style={{ color: "#2563eb" }} />} label="Taux échec paiement" value="2.4%" delta="-0.6pt" positive />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#3D3D3D" }}>GMV vs Commission · 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_30D}>
              <defs>
                <linearGradient id="gmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F57C20" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#F57C20" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="com" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B4332" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1B4332" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => formatFcfaCompact(Number(v))} />
              <Tooltip formatter={(v) => formatFcfa(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #f5f3ef" }} />
              <Area type="monotone" dataKey="revenue" stroke="#F57C20" strokeWidth={2} fill="url(#gmv)" name="GMV" />
              <Area type="monotone" dataKey="commission" stroke="#1B4332" strokeWidth={2} fill="url(#com)" name="Commission" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#3D3D3D" }}>Mix moyens de paiement</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={PAYMENT_MIX} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {PAYMENT_MIX.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <h3 className="text-sm font-bold" style={{ color: "#3D3D3D" }}>Payouts restaurants en cours</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#fbf9f5" }}>
                {["Restaurant", "Période", "GMV brut", "Commission", "Net à payer", "Statut", "Date virement"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYOUTS.map((p) => (
                <tr key={p.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#3D3D3D" }}>{p.restaurant}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{p.period}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#3D3D3D", fontFamily: "var(--font-mono), monospace" }}>{formatFcfa(p.grossXaf)}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#6B7280", fontFamily: "var(--font-mono), monospace" }}>−{formatFcfa(p.commission)}</td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: "#F57C20", fontFamily: "var(--font-mono), monospace" }}>{formatFcfa(p.netXaf)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                      style={
                        p.status === "PAYÉ" ? { backgroundColor: "#dcfce7", color: "#166534" }
                        : p.status === "EN COURS" ? { backgroundColor: "#fef3c7", color: "#b45309" }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                      }>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{p.date}</td>
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
