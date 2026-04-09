"use client";

import { useLanguage } from "@/hooks/use-language";
import { useApi } from "@/hooks/use-api";
import type { DashboardData } from "@/lib/types";
import { formatFcfa, formatFcfaCompact } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, TrendingUp, CreditCard, Wallet, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

const PAYMENT_COLORS = ["#F57C20", "#1B4332", "#D4A017", "#8b4c11", "#2563eb"];

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
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
      </div>
    </div>
  );
}

export default function FinancesPage() {
  const { t } = useLanguage();
  const { data, loading, error, refetch } = useApi<DashboardData>("/admin/dashboard");

  const totalRevenue = data?.totalRevenue ?? 0;
  const commission = Math.round(totalRevenue * 0.15);
  const revenueByQuarter = Array.isArray(data?.revenueByQuarter) ? data!.revenueByQuarter : [];
  const paymentBreakdown = Array.isArray(data?.paymentMethodBreakdown) ? data!.paymentMethodBreakdown : [];
  const totalPayments = paymentBreakdown.reduce((a, p) => a + (p.count ?? 0), 0) || 1;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
            Paiements & Finances
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Revenus par quartier · mix paiements · commission NYAMA</p>
        </div>
        <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ border: "1.5px solid #F57C20", color: "#F57C20" }}>
          <Download className="h-4 w-4" />
          Export comptable
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {loading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<DollarSign className="h-5 w-5" style={{ color: "#F57C20" }} />} label="CA brut total" value={formatFcfaCompact(totalRevenue)} />
          <KpiCard icon={<Wallet className="h-5 w-5" style={{ color: "#166534" }} />} label="Commission NYAMA" value={formatFcfaCompact(commission)} sub="≈ 15% du CA" />
          <KpiCard icon={<TrendingUp className="h-5 w-5" style={{ color: "#b45309" }} />} label="Panier moyen" value={formatFcfa(data?.avgBasketXaf ?? 0)} />
          <KpiCard icon={<CreditCard className="h-5 w-5" style={{ color: "#2563eb" }} />} label="Commandes" value={(data?.totalOrders ?? 0).toLocaleString("fr-FR")} />
        </div>
      )}

      {!loading && data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#3D3D3D" }}>Revenus par quartier</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByQuarter}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                <XAxis dataKey="quarter" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `${v}M`} />
                <Tooltip formatter={(v) => `${v} M FCFA`} contentStyle={{ borderRadius: 12, border: "1px solid #f5f3ef" }} />
                <Bar dataKey="revenueM" fill="#F57C20" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#3D3D3D" }}>Mix moyens de paiement</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="count" nameKey="method" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {paymentBreakdown.map((_, i) => <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${Math.round((Number(v) / totalPayments) * 100)}%`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2" style={{ color: "#b8b3ad" }}>
        {t("footer")}
      </p>
    </div>
  );
}
