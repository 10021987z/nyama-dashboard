"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type {
  Partnership,
  PartnershipStats,
  PartnershipListResponse,
  PartnershipStatus,
} from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import {
  Users,
  Bike,
  ChefHat,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Layers,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────

function statusStyle(s: PartnershipStatus): { bg: string; color: string; label: string } {
  switch (s) {
    case "PENDING":
      return { bg: "#ffedd5", color: "#9a3412", label: "En attente" };
    case "APPROVED":
      return { bg: "#dcfce7", color: "#166534", label: "Approuvée" };
    case "REJECTED":
      return { bg: "#fee2e2", color: "#991b1b", label: "Rejetée" };
  }
}

function fullName(p: Partnership): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";
}

// ── StatCard ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        backgroundColor: "#ffffff",
        boxShadow:
          "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "#fdf3ee" }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <Skeleton className="h-7 w-16 mb-1" />
        ) : (
          <p
            className="text-[1.6rem] font-bold leading-tight"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            {value}
          </p>
        )}
        <p
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "#6B7280" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────

function DetailModal({
  app,
  onClose,
  onApprove,
  onReject,
}: {
  app: Partnership | null;
  onClose: () => void;
  onApprove: (a: Partnership, notes: string) => void;
  onReject: (a: Partnership, notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(app?.adminNotes ?? "");
  }, [app]);

  if (!app) return null;

  const stat = statusStyle(app.status);
  const isCook = app.type === "COOK";
  const canDecide = app.status === "PENDING";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-4"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #f5f3ef",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: isCook ? "#fdf3ee" : "#eff6ff" }}
            >
              {isCook ? (
                <ChefHat className="h-4 w-4" style={{ color: "#F57C20" }} />
              ) : (
                <Bike className="h-4 w-4" style={{ color: "#2563eb" }} />
              )}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#3D3D3D" }}>
                {fullName(app)}
              </p>
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase mt-0.5"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                {stat.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-[#fbf9f5]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Personal */}
          <section>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#6B7280" }}
            >
              Informations personnelles
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" value={app.phone} />
              <Field label="Email" value={app.email} />
              <Field label="Ville" value={app.ville} />
              <Field label="Quartier" value={app.quartier} />
            </div>
          </section>

          {/* Type-specific */}
          {isCook ? (
            <section>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#6B7280" }}
              >
                Informations cuisinière
              </p>
              <div className="space-y-3">
                <Field label="Nom de l'établissement" value={app.businessName} />
                {app.description && (
                  <div>
                    <p className="text-[10px]" style={{ color: "#6B7280" }}>
                      Description
                    </p>
                    <p
                      className="text-sm whitespace-pre-line"
                      style={{ color: "#3D3D3D" }}
                    >
                      {app.description}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#6B7280" }}
              >
                Informations livreur
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type de véhicule" value={app.vehicleType} />
                <Field label="Numéro CNI" value={app.cniNumber} />
              </div>
            </section>
          )}

          {/* Notes admin */}
          <section>
            <label
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#6B7280" }}
            >
              Notes admin
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ajouter une note interne…"
              className="mt-1 w-full rounded-xl p-3 text-sm outline-none"
              style={{
                border: "1.5px solid #e8e4de",
                color: "#3D3D3D",
                backgroundColor: "#fbf9f5",
              }}
              disabled={!canDecide}
            />
          </section>

          {/* Date */}
          <p className="text-[10px]" style={{ color: "#b8b3ad" }}>
            Candidature soumise le {formatDate(app.createdAt)}
            {app.reviewedAt && ` — revue le ${formatDate(app.reviewedAt)}`}
          </p>
        </div>

        {/* Actions */}
        {canDecide && (
          <div
            className="sticky bottom-0 flex gap-2 p-4"
            style={{
              backgroundColor: "#ffffff",
              borderTop: "1px solid #f5f3ef",
            }}
          >
            <button
              onClick={() => onApprove(app, notes)}
              className="flex-1 rounded-full py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: "#1B4332" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
              Approuver
            </button>
            <button
              onClick={() => onReject(app, notes)}
              className="flex-1 rounded-full py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: "#ef4444" }}
            >
              <XCircle className="h-3.5 w-3.5 inline mr-1" />
              Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px]" style={{ color: "#6B7280" }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function PartnershipsPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PartnershipStats | null>(null);
  const [items, setItems] = useState<Partnership[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Partnership | null>(null);
  const [filterType, setFilterType] = useState<"" | "COOK" | "RIDER">("");
  const [filterStatus, setFilterStatus] = useState<"" | PartnershipStatus>("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;

      const [statsRes, listRes] = await Promise.all([
        apiClient
          .get<PartnershipStats>("/admin/partnerships/stats")
          .catch(() => null),
        apiClient.get<PartnershipListResponse | Partnership[]>(
          "/admin/partnerships",
          params
        ),
      ]);

      // Tolerate either { items, total } or a raw array
      const list: Partnership[] = Array.isArray(listRes)
        ? listRes
        : listRes.items ?? [];
      const totalCount = Array.isArray(listRes)
        ? listRes.length
        : listRes.total ?? list.length;

      setItems(list);
      setTotal(totalCount);

      // Fallback stats from list if endpoint missing
      if (statsRes) {
        setStats(statsRes);
      } else {
        setStats({
          total: list.length,
          pending: list.filter((p) => p.status === "PENDING").length,
          approved: list.filter((p) => p.status === "APPROVED").length,
          rejected: list.filter((p) => p.status === "REJECTED").length,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de contacter le serveur NYAMA"
      );
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (app: Partnership, adminNotes: string) => {
    try {
      await apiClient.patch(`/admin/partnerships/${app.id}`, {
        status: "APPROVED",
        adminNotes,
      });
      showToast(`${fullName(app)} approuvé(e)`);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erreur lors de l'approbation"
      );
    }
  };

  const handleReject = async (app: Partnership, adminNotes: string) => {
    if (!window.confirm(`Rejeter la candidature de ${fullName(app)} ?`)) return;
    try {
      await apiClient.patch(`/admin/partnerships/${app.id}`, {
        status: "REJECTED",
        adminNotes,
      });
      showToast(`Candidature de ${fullName(app)} rejetée`);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors du rejet");
    }
  };

  const STATUS_TABS: { value: "" | PartnershipStatus; label: string }[] = [
    { value: "", label: "Toutes" },
    { value: "PENDING", label: "En attente" },
    { value: "APPROVED", label: "Approuvées" },
    { value: "REJECTED", label: "Rejetées" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1
          className="text-[1.5rem] font-bold leading-tight"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Candidatures Partenaires
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Cuisinières et livreurs ayant soumis une candidature publique
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Layers className="h-5 w-5" style={{ color: "#3D3D3D" }} />}
          label="Total"
          value={stats?.total ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" style={{ color: "#b45309" }} />}
          label="En attente"
          value={stats?.pending ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={
            <CheckCircle2 className="h-5 w-5" style={{ color: "#1B4332" }} />
          }
          label="Approuvées"
          value={stats?.approved ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" style={{ color: "#991b1b" }} />}
          label="Rejetées"
          value={stats?.rejected ?? "—"}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status tabs */}
        <div
          className="flex rounded-full overflow-hidden"
          style={{ border: "1.5px solid #e8e4de" }}
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              className="px-4 py-2 text-xs font-bold"
              style={{
                backgroundColor:
                  filterStatus === tab.value ? "#F57C20" : "#ffffff",
                color: filterStatus === tab.value ? "#ffffff" : "#6B7280",
              }}
              onClick={() => {
                setFilterStatus(tab.value);
                setPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div
          className="flex rounded-full overflow-hidden"
          style={{ border: "1.5px solid #e8e4de" }}
        >
          <button
            className="px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: filterType === "" ? "#3D3D3D" : "#ffffff",
              color: filterType === "" ? "#ffffff" : "#6B7280",
            }}
            onClick={() => {
              setFilterType("");
              setPage(1);
            }}
          >
            Tous
          </button>
          <button
            className="px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
            style={{
              backgroundColor: filterType === "COOK" ? "#F57C20" : "#ffffff",
              color: filterType === "COOK" ? "#ffffff" : "#6B7280",
            }}
            onClick={() => {
              setFilterType("COOK");
              setPage(1);
            }}
          >
            <ChefHat className="h-3 w-3" />
            Cuisinières
          </button>
          <button
            className="px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
            style={{
              backgroundColor: filterType === "RIDER" ? "#2563eb" : "#ffffff",
              color: filterType === "RIDER" ? "#ffffff" : "#6B7280",
            }}
            onClick={() => {
              setFilterType("RIDER");
              setPage(1);
            }}
          >
            <Bike className="h-3 w-3" />
            Livreurs
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        }}
      >
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fbf9f5" }}>
                  <Th>Type</Th>
                  <Th>Nom</Th>
                  <Th className="hidden md:table-cell">Téléphone</Th>
                  <Th className="hidden lg:table-cell">Email</Th>
                  <Th className="hidden md:table-cell">Localisation</Th>
                  <Th className="hidden lg:table-cell">Date</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((app) => {
                  const stat = statusStyle(app.status);
                  const isCook = app.type === "COOK";
                  return (
                    <tr
                      key={app.id}
                      className="cursor-pointer transition-colors hover:bg-[#fbf9f5]"
                      onClick={() => setSelected(app)}
                      style={{ borderTop: "1px solid #f5f3ef" }}
                    >
                      <td className="px-4 py-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: isCook ? "#fdf3ee" : "#eff6ff",
                          }}
                          title={isCook ? "Cuisinière" : "Livreur"}
                        >
                          {isCook ? (
                            <ChefHat
                              className="h-4 w-4"
                              style={{ color: "#F57C20" }}
                            />
                          ) : (
                            <Bike
                              className="h-4 w-4"
                              style={{ color: "#2563eb" }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="text-sm font-medium"
                          style={{ color: "#3D3D3D" }}
                        >
                          {fullName(app)}
                        </p>
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {app.phone || "—"}
                      </td>
                      <td
                        className="px-4 py-3 hidden lg:table-cell text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {app.email || "—"}
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {[app.ville, app.quartier].filter(Boolean).join(" • ") ||
                          "—"}
                      </td>
                      <td
                        className="px-4 py-3 hidden lg:table-cell text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {formatRelative(app.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: stat.bg,
                            color: stat.color,
                          }}
                        >
                          {stat.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center">
            <Users className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Aucune candidature
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            style={{ border: "1.5px solid #e8e4de", color: "#6B7280" }}
          >
            {t("common.previous")}
          </button>
          <span className="text-xs" style={{ color: "#6B7280" }}>
            {t("common.page")} {page} {t("common.of")}{" "}
            {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            style={{ border: "1.5px solid #e8e4de", color: "#6B7280" }}
          >
            {t("common.next")}
          </button>
        </div>
      )}

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>

      {/* Modal */}
      <DetailModal
        app={selected}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[60] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #F57C20, #E06A10)",
            boxShadow: "0 4px 20px rgba(160,60,0,0.3)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${className ?? ""}`}
      style={{ color: "#6B7280" }}
    >
      {children}
    </th>
  );
}
