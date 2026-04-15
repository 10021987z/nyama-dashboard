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
  Copy,
  Check,
  KeyRound,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

// ── WhatsApp helpers ─────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

function whatsappLink(phone: string, message: string): string {
  return `https://api.whatsapp.com/send?phone=${normalizePhone(phone)}&text=${encodeURIComponent(message)}`;
}

function openWhatsapp(phone: string, message: string) {
  if (typeof window === "undefined") return;
  window.open(whatsappLink(phone, message), "_blank", "noopener,noreferrer");
}

// ── API ⇄ UI normalization ───────────────────────────────────────────
// Backend renvoie { status: "pending" | "approved" | "rejected", type: "cuisiniere" | "livreur" }
// L'UI travaille en majuscule (historique). On harmonise ici.

function normalizeStatus(raw: unknown): PartnershipStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "approved") return "APPROVED";
  if (s === "rejected") return "REJECTED";
  return "PENDING";
}

function normalizeType(raw: unknown): "COOK" | "RIDER" {
  const t = String(raw ?? "").toLowerCase();
  if (t === "livreur" || t === "rider") return "RIDER";
  return "COOK";
}

function normalizePartnership(raw: Record<string, unknown>): Partnership {
  return {
    ...(raw as unknown as Partnership),
    id: String(raw.id ?? ""),
    type: normalizeType(raw.type),
    status: normalizeStatus(raw.status),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    phone: String(raw.phone ?? ""),
    email: (raw.email as string | undefined) ?? undefined,
    ville: (raw.city ?? raw.ville) as string | undefined,
    quartier: (raw.quarter ?? raw.quartier) as string | undefined,
    vehicleType: raw.vehicleType as string | undefined,
    cniNumber: (raw.idNumber ?? raw.cniNumber) as string | undefined,
    businessName: (raw.companyName ?? raw.businessName) as string | undefined,
    description: raw.description as string | undefined,
    adminNotes: raw.adminNotes as string | undefined,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    reviewedAt: raw.reviewedAt as string | undefined,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function statusStyle(s: PartnershipStatus | string | undefined): {
  bg: string;
  color: string;
  label: string;
} {
  switch (s) {
    case "PENDING":
      return { bg: "#ffedd5", color: "#9a3412", label: "En attente" };
    case "APPROVED":
      return { bg: "#dcfce7", color: "#166534", label: "Approuvée" };
    case "REJECTED":
      return { bg: "#fee2e2", color: "#991b1b", label: "Rejetée" };
    default:
      return { bg: "#f3f4f6", color: "#4b5563", label: String(s ?? "—") };
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
  onReject: (a: Partnership) => void;
}) {
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setNotes(app?.adminNotes ?? "");
    setChecks({});
  }, [app]);

  if (!app) return null;

  const stat = statusStyle(app.status);
  const isCook = app.type === "COOK";
  const canDecide = app.status === "PENDING";

  const checklistItems: { key: string; label: string }[] = [
    { key: "identity", label: "Identité vérifiée" },
    { key: "phone", label: "Numéro de téléphone confirmé" },
    ...(isCook
      ? [{ key: "address", label: "Adresse vérifiée" }]
      : [
          { key: "vehicle", label: "Véhicule vérifié" },
          { key: "cni", label: "CNI vérifié" },
        ]),
  ];
  const checkedCount = checklistItems.filter((c) => checks[c.key]).length;
  const score = Math.round((checkedCount / checklistItems.length) * 100);
  const canApprove = canDecide && score >= 60;

  const contactMessage = `Bonjour ${app.firstName ?? ""}, nous examinons votre candidature NYAMA...`;

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

          {/* WhatsApp contact */}
          {app.phone && (
            <section>
              <button
                type="button"
                onClick={() => openWhatsapp(app.phone, contactMessage)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contacter par WhatsApp
              </button>
            </section>
          )}

          {/* Verification checklist */}
          {canDecide && (
            <section
              className="rounded-xl p-4"
              style={{ backgroundColor: "#fbf9f5", border: "1px solid #f5f3ef" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                  style={{ color: "#6B7280" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Vérification
                </p>
                <span
                  className="text-xs font-bold"
                  style={{
                    color:
                      score >= 60
                        ? "#1B4332"
                        : score >= 40
                          ? "#b45309"
                          : "#991b1b",
                  }}
                >
                  Score : {score}%
                </span>
              </div>
              <div className="space-y-1.5">
                {checklistItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                    style={{ color: "#3D3D3D" }}
                  >
                    <input
                      type="checkbox"
                      checked={!!checks[item.key]}
                      onChange={(e) =>
                        setChecks((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded"
                      style={{ accentColor: "#F57C20" }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              {score < 60 && (
                <p className="text-[10px] mt-2" style={{ color: "#991b1b" }}>
                  Un score minimum de 60% est requis pour approuver.
                </p>
              )}
            </section>
          )}

          {/* Notes admin */}
          <section>
            <label
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#6B7280" }}
            >
              Notes internes (admin uniquement)
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
              disabled={!canApprove}
              className="flex-1 rounded-full py-2.5 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1B4332" }}
              title={!canApprove ? "Complétez la vérification (score ≥ 60%)" : undefined}
            >
              <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
              Approuver
            </button>
            <button
              onClick={() => onReject(app)}
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
  const [stats, setStats] = useState<PartnershipStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [items, setItems] = useState<Partnership[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Partnership | null>(null);
  const [filterType, setFilterType] = useState<"" | "COOK" | "RIDER">("");
  const [filterStatus, setFilterStatus] = useState<"" | PartnershipStatus>("");
  const [toast, setToast] = useState<string | null>(null);
  const [approval, setApproval] = useState<{
    accessCode: string;
    email?: string;
    name: string;
    phone?: string;
    firstName?: string;
    type?: "COOK" | "RIDER";
  } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Partnership | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filterType) params.type = filterType === "COOK" ? "cuisiniere" : "livreur";
      if (filterStatus) params.status = filterStatus.toLowerCase();

      const [statsRes, listRes] = await Promise.all([
        apiClient
          .get<PartnershipStats>("/admin/partnerships/stats")
          .catch(() => null),
        apiClient
          .get<PartnershipListResponse | Partnership[]>(
            "/admin/partnerships",
            params
          )
          .catch(() => null),
      ]);

      // Tolerate either { items, total }, a raw array, null, or undefined
      let list: Partnership[] = [];
      let totalCount = 0;
      const rawList: Record<string, unknown>[] = Array.isArray(listRes)
        ? (listRes as unknown as Record<string, unknown>[])
        : listRes && typeof listRes === "object"
          ? Array.isArray((listRes as PartnershipListResponse).items)
            ? ((listRes as PartnershipListResponse).items as unknown as Record<string, unknown>[])
            : []
          : [];
      list = rawList.map(normalizePartnership);
      if (Array.isArray(listRes)) {
        totalCount = list.length;
      } else if (listRes && typeof listRes === "object") {
        totalCount =
          typeof (listRes as PartnershipListResponse).total === "number"
            ? (listRes as PartnershipListResponse).total
            : list.length;
      }

      setItems(list);
      setTotal(totalCount);

      // Fallback stats from list if endpoint missing or failed
      if (statsRes && typeof statsRes === "object") {
        setStats({
          total: statsRes.total ?? 0,
          pending: statsRes.pending ?? 0,
          approved: statsRes.approved ?? 0,
          rejected: statsRes.rejected ?? 0,
        });
      } else {
        setStats({
          total: list.length,
          pending: list.filter((p) => p?.status === "PENDING").length,
          approved: list.filter((p) => p?.status === "APPROVED").length,
          rejected: list.filter((p) => p?.status === "REJECTED").length,
        });
      }
    } catch (err) {
      console.error("[partnerships] fetch failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de contacter le serveur NYAMA"
      );
      setItems([]);
      setTotal(0);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (app: Partnership, adminNotes: string) => {
    try {
      const res = await apiClient.patch<{
        accessCode?: string;
        user?: { email?: string | null };
      }>(`/admin/partnerships/${app.id}`, {
        status: "approved",
        adminNotes,
      });
      setSelected(null);
      if (res?.accessCode) {
        setApproval({
          accessCode: res.accessCode,
          email: res.user?.email ?? app.email ?? undefined,
          name: fullName(app),
          phone: app.phone,
          firstName: app.firstName,
          type: app.type,
        });
      } else {
        showToast(`${fullName(app)} approuvé(e)`);
      }
      fetchData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erreur lors de l'approbation"
      );
    }
  };

  const handleRejectSubmit = async (app: Partnership, reason: string) => {
    try {
      await apiClient.patch(`/admin/partnerships/${app.id}`, {
        status: "rejected",
        adminNotes: reason,
      });
      showToast(`Candidature de ${fullName(app)} rejetée`);
      setRejectTarget(null);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors du rejet");
    }
  };

  const openReject = (app: Partnership) => {
    setRejectTarget(app);
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
          value={stats.total}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" style={{ color: "#b45309" }} />}
          label="En attente"
          value={stats.pending}
          loading={loading}
        />
        <StatCard
          icon={
            <CheckCircle2 className="h-5 w-5" style={{ color: "#1B4332" }} />
          }
          label="Approuvées"
          value={stats.approved}
          loading={loading}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" style={{ color: "#991b1b" }} />}
          label="Rejetées"
          value={stats.rejected}
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
        onReject={(a) => openReject(a)}
      />

      {/* Approval modal with access code */}
      <ApprovalModal
        data={approval}
        onClose={() => setApproval(null)}
      />

      {/* Rejection modal */}
      <RejectModal
        app={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleRejectSubmit}
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

function ApprovalModal({
  data,
  onClose,
}: {
  data: {
    accessCode: string;
    email?: string;
    name: string;
    phone?: string;
    firstName?: string;
    type?: "COOK" | "RIDER";
  } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [data]);

  if (!data) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const sendWhatsapp = () => {
    if (!data.phone) return;
    const app = data.type === "RIDER" ? "Benskin Express" : "Cuisine de Nyama";
    const first = data.firstName ?? data.name.split(" ")[0] ?? "";
    const msg = `Félicitations ${first} ! Votre candidature NYAMA est approuvée ! Votre code d'accès : ${data.accessCode}. Téléchargez l'app ${app} et connectez-vous avec votre numéro + ce code. Bienvenue dans la famille NYAMA !`;
    openWhatsapp(data.phone, msg);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: "#dcfce7" }}
          >
            <CheckCircle2 className="h-5 w-5" style={{ color: "#166534" }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "#3D3D3D" }}>
              Partenaire approuvé !
            </p>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {data.name}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: "#fdf3ee" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: "#6B7280" }}
          >
            Code d&apos;accès
          </p>
          <p
            className="text-3xl font-bold tracking-widest select-all"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#F57C20" }}
          >
            {data.accessCode}
          </p>
        </div>

        <p className="text-xs" style={{ color: "#6B7280" }}>
          {data.email
            ? `Ce code a été envoyé par email à ${data.email}.`
            : "Aucun email enregistré — transmettez ce code manuellement au partenaire."}
        </p>
        <p className="text-xs" style={{ color: "#6B7280" }}>
          Le partenaire peut maintenant se connecter à l&apos;application. Ce code ne
          fonctionne qu&apos;une seule fois.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex-1 rounded-full py-2.5 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#1B4332" }}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copié !
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copier le code
                </>
              )}
            </button>
            {data.phone && (
              <button
                onClick={sendWhatsapp}
                className="flex-1 rounded-full py-2.5 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Envoyer par WhatsApp
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-full py-2.5 text-xs font-bold"
            style={{ border: "1.5px solid #e8e4de", color: "#6B7280" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  app,
  onClose,
  onSubmit,
}: {
  app: Partnership | null;
  onClose: () => void;
  onSubmit: (app: Partnership, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReason("");
    setSubmitting(false);
  }, [app]);

  if (!app) return null;

  const submit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(app, reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: "#fee2e2" }}
          >
            <XCircle className="h-5 w-5" style={{ color: "#991b1b" }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "#3D3D3D" }}>
              Rejeter la candidature
            </p>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {`${app.firstName ?? ""} ${app.lastName ?? ""}`.trim()}
            </p>
          </div>
        </div>

        <div>
          <label
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#6B7280" }}
          >
            Raison du rejet (visible par le candidat)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Documents incomplets, zone non couverte, etc."
            className="mt-1 w-full rounded-xl p-3 text-sm outline-none"
            style={{
              border: "1.5px solid #e8e4de",
              color: "#3D3D3D",
              backgroundColor: "#fbf9f5",
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-2.5 text-xs font-bold"
            style={{ border: "1.5px solid #e8e4de", color: "#6B7280" }}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!reason.trim() || submitting}
            className="flex-1 rounded-full py-2.5 text-xs font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: "#ef4444" }}
          >
            {submitting ? "Envoi…" : "Confirmer le rejet"}
          </button>
        </div>
      </div>
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
