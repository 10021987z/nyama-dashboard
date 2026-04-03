"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Delivery, DeliveriesResponse, DeliveryStatus } from "@/lib/types";
import { formatFcfa, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Truck, Clock, CheckCircle2, XCircle, Package, ChevronLeft, ChevronRight,
  MapPin, User, Bike, Activity,
} from "lucide-react";

const LIMIT = 20;

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "assigned", label: "Assignées" },
  { value: "picked_up", label: "Collectées" },
  { value: "delivering", label: "En cours" },
  { value: "delivered", label: "Livrées" },
  { value: "failed", label: "Échouées" },
];

function deliveryStatusConfig(status: DeliveryStatus): {
  label: string;
  bg: string;
  color: string;
  icon: React.ElementType;
} {
  switch (status) {
    case "pending":
      return { label: "En attente", bg: "#fef9c3", color: "#854d0e", icon: Clock };
    case "assigned":
      return { label: "Assignée", bg: "#dbeafe", color: "#1e40af", icon: User };
    case "picked_up":
      return { label: "Collectée", bg: "#ffedd5", color: "#9a3412", icon: Package };
    case "delivering":
      return { label: "En cours", bg: "#fdf3ee", color: "#a03c00", icon: Bike };
    case "delivered":
      return { label: "Livrée", bg: "#dcfce7", color: "#166534", icon: CheckCircle2 };
    case "failed":
      return { label: "Échouée", bg: "#fee2e2", color: "#991b1b", icon: XCircle };
    default:
      return { label: status, bg: "#f5f3ef", color: "#7c7570", icon: Clock };
  }
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-6 w-12 mb-0.5" />
        ) : (
          <p
            className="text-xl font-bold leading-none"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {value}
          </p>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#7c7570" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Delivery row ───────────────────────────────────────────────────────────────

function DeliveryRow({ d }: { d: Delivery }) {
  const cfg = deliveryStatusConfig(d.status);
  const StatusIcon = cfg.icon;

  return (
    <tr className="hover:bg-[#fbf9f5] transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-xs" style={{ color: "#7c7570" }}>
          #{d.orderId.slice(-6).toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#1b1c1a" }}>
            {d.clientName}
          </p>
          <p className="text-xs" style={{ color: "#7c7570" }}>
            {d.clientPhone}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {d.riderName ? (
          <div className="flex items-center gap-1.5">
            <Bike className="h-3.5 w-3.5 shrink-0" style={{ color: "#a03c00" }} />
            <span className="text-sm" style={{ color: "#1b1c1a" }}>
              {d.riderName}
            </span>
          </div>
        ) : (
          <span className="text-xs italic" style={{ color: "#b8b3ad" }}>Non assigné</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {(d.neighborhood || d.city) && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" style={{ color: "#a03c00" }} />
            <span className="text-xs" style={{ color: "#7c7570" }}>
              {d.neighborhood ? `${d.neighborhood}, ${d.city}` : d.city}
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>
          {formatFcfa(d.totalXaf)}
        </p>
        <p className="text-[10px]" style={{ color: "#7c7570" }}>
          Livr. {formatFcfa(d.deliveryFeeXaf)}
        </p>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
        <span className="text-xs" style={{ color: "#7c7570" }}>
          {formatRelative(d.createdAt)}
        </span>
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const [statusTab, setStatusTab] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DeliveriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusTab) params.status = statusTab;
      const result = await apiClient.get<DeliveriesResponse>("/admin/deliveries", params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, [statusTab, page]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  const countByStatus = (s: DeliveryStatus) =>
    data?.data.filter((d) => d.status === s).length ?? 0;

  const inProgress = countByStatus("delivering") + countByStatus("picked_up") + countByStatus("assigned");
  const delivered = countByStatus("delivered");
  const failed = countByStatus("failed");
  const pending = countByStatus("pending");

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[1.8rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Suivi des Livraisons
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
            Tracking en temps réel des commandes en transit
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5" style={{ backgroundColor: "#dcfce7" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#16a34a" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#16a34a" }} />
          </span>
          <span className="text-xs font-bold" style={{ color: "#166534" }}>
            {inProgress} en transit
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Activity className="h-5 w-5" />} label="En cours" value={loading ? "—" : inProgress} color="#a03c00" loading={loading} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="En attente" value={loading ? "—" : pending} color="#b45309" loading={loading} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Livrées" value={loading ? "—" : delivered} color="#16a34a" loading={loading} />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Échouées" value={loading ? "—" : failed} color="#ef4444" loading={loading} />
      </div>

      {/* Status tabs */}
      <div
        className="rounded-2xl p-1 flex gap-0.5 overflow-x-auto"
        style={{ backgroundColor: "#f5f3ef" }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusTab(tab.value); setPage(1); }}
            className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap"
            style={
              statusTab === tab.value
                ? { background: "linear-gradient(135deg, #a03c00, #c94d00)", color: "#ffffff" }
                : { color: "#7c7570" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDeliveries} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#fbf9f5" }}>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      ID Commande
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#7c7570" }}>
                      Livreur
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#7c7570" }}>
                      Zone
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#7c7570" }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Truck className="h-8 w-8 mx-auto mb-2" style={{ color: "#e8e4de" }} />
                        <p className="text-sm" style={{ color: "#7c7570" }}>
                          Aucune livraison trouvée
                        </p>
                      </td>
                    </tr>
                  ) : (
                    data?.data.map((d) => <DeliveryRow key={d.id} d={d} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid #f5f3ef" }}
              >
                <p className="text-sm" style={{ color: "#7c7570" }}>
                  Page {page} / {totalPages} &bull;{" "}
                  <span className="font-medium" style={{ color: "#1b1c1a" }}>
                    {data?.total.toLocaleString("fr-FR")} livraisons
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium disabled:opacity-40"
                    style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                    style={{
                      background: page >= totalPages ? "#e8e4de" : "linear-gradient(135deg, #a03c00, #c94d00)",
                      color: page >= totalPages ? "#7c7570" : "#fff",
                    }}
                  >
                    Suivant
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        NYAMA TECH SYSTEMS &copy; 2026 &bull; PROPULSION DE L&apos;EXCELLENCE CULINAIRE CAMEROUNAISE
      </p>
    </div>
  );
}
