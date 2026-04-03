"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Delivery, DeliveriesResponse, DeliveryStatus } from "@/lib/types";
import { formatFcfa, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import {
  Truck, Clock, CheckCircle2, XCircle, Package, ChevronLeft, ChevronRight,
  MapPin, User, Bike, Activity,
} from "lucide-react";

const LIMIT = 20;

function getStatusTabs(t: (key: string) => string) {
  return [
    { value: "", label: t("deliveries.all") },
    { value: "pending", label: t("deliveries.pendingTab") },
    { value: "assigned", label: t("deliveries.assigned") },
    { value: "picked_up", label: t("deliveries.collected") },
    { value: "delivering", label: t("deliveries.inCourse") },
    { value: "delivered", label: t("deliveries.deliveredTab") },
    { value: "failed", label: t("deliveries.failed") },
  ];
}

function deliveryStatusConfig(
  status: DeliveryStatus,
  t: (key: string) => string,
): {
  label: string;
  bg: string;
  color: string;
  icon: React.ElementType;
} {
  switch (status) {
    case "pending":
      return { label: t("deliveries.statusPending"), bg: "#fef9c3", color: "#854d0e", icon: Clock };
    case "assigned":
      return { label: t("deliveries.statusAssigned"), bg: "#dbeafe", color: "#1e40af", icon: User };
    case "picked_up":
      return { label: t("deliveries.statusPickedUp"), bg: "#ffedd5", color: "#9a3412", icon: Package };
    case "delivering":
      return { label: t("deliveries.statusDelivering"), bg: "#fdf3ee", color: "#a03c00", icon: Bike };
    case "delivered":
      return { label: t("deliveries.statusDelivered"), bg: "#dcfce7", color: "#166534", icon: CheckCircle2 };
    case "failed":
      return { label: t("deliveries.statusFailed"), bg: "#fee2e2", color: "#991b1b", icon: XCircle };
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
  const { t } = useLanguage();
  const cfg = deliveryStatusConfig(d.status, t);
  const StatusIcon = cfg.icon;

  return (
    <tr className="hover:bg-[#fbf9f5] transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-xs" style={{ color: "#7c7570" }}>
          #{(d.orderId ?? "").slice(-6).toUpperCase()}
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
          <span className="text-xs italic" style={{ color: "#b8b3ad" }}>{t("deliveries.notAssigned")}</span>
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
          {t("deliveries.deliveryFeeShort")} {formatFcfa(d.deliveryFeeXaf)}
        </p>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
        <span className="text-xs" style={{ color: "#7c7570" }}>
          {formatRelative(d.assignedAt ?? d.createdAt)}
        </span>
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const { t } = useLanguage();
  const [statusTab, setStatusTab] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DeliveriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusTabs = getStatusTabs(t);

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
            {t("deliveries.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
            {t("deliveries.subtitle")}
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5" style={{ backgroundColor: "#dcfce7" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#16a34a" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#16a34a" }} />
          </span>
          <span className="text-xs font-bold" style={{ color: "#166534" }}>
            {inProgress} {t("deliveries.inProgress")}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Activity className="h-5 w-5" />} label={t("deliveries.activeDeliveries")} value={loading ? "—" : inProgress} color="#a03c00" loading={loading} />
        <StatCard icon={<Clock className="h-5 w-5" />} label={t("deliveries.avgTime")} value={loading ? "—" : pending} color="#b45309" loading={loading} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label={t("deliveries.successRate")} value={loading ? "—" : delivered} color="#16a34a" loading={loading} />
        <StatCard icon={<XCircle className="h-5 w-5" />} label={t("deliveries.availableRiders")} value={loading ? "—" : failed} color="#ef4444" loading={loading} />
      </div>

      {/* Status tabs */}
      <div
        className="rounded-2xl p-1 flex gap-0.5 overflow-x-auto"
        style={{ backgroundColor: "#f5f3ef" }}
      >
        {statusTabs.map((tab) => (
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
                      {t("deliveries.orderId")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      {t("deliveries.client")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#7c7570" }}>
                      {t("deliveries.rider")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      {t("deliveries.status")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#7c7570" }}>
                      {t("deliveries.zone")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>
                      {t("deliveries.amount")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#7c7570" }}>
                      {t("deliveries.date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Truck className="h-8 w-8 mx-auto mb-2" style={{ color: "#e8e4de" }} />
                        <p className="text-sm" style={{ color: "#7c7570" }}>
                          {t("deliveries.noDelivery")}
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
                  {t("common.page")} {page} / {totalPages} &bull;{" "}
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
                    {t("common.previous")}
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
                    {t("common.next")}
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
        {t("footer")}
      </p>
    </div>
  );
}
