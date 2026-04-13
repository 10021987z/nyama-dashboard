"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type {
  PartnerApplication,
  PartnerStats,
  PartnerListResponse,
  PartnerType,
  ApplicationStatus,
} from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import {
  Users,
  Bike,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileText,
  User,
  Eye,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────

function statusStyle(s: string): { bg: string; color: string } {
  switch (s) {
    case "PENDING":
      return { bg: "#ffedd5", color: "#9a3412" };
    case "UNDER_REVIEW":
      return { bg: "#dbeafe", color: "#1e40af" };
    case "APPROVED":
      return { bg: "#dcfce7", color: "#166534" };
    case "REJECTED":
      return { bg: "#fee2e2", color: "#991b1b" };
    case "SUSPENDED":
      return { bg: "#f3f4f6", color: "#4b5563" };
    default:
      return { bg: "#f3f4f6", color: "#6B7280" };
  }
}

function safeParseJSON(str?: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

// ── ApplicationRow ───────────────────────────────────────────────────

function ApplicationRow({
  app,
  selected,
  onClick,
  t,
}: {
  app: PartnerApplication;
  selected: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const stat = statusStyle(app.status);

  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ backgroundColor: selected ? "#fdf3ee" : undefined }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = "#fbf9f5";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = "";
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: app.type === "COOK" ? "#F57C20" : "#2563eb" }}
          >
            {app.fullName?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
              {app.fullName}
            </p>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>
              {app.phone}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: app.type === "COOK" ? "#fdf3ee" : "#eff6ff",
            color: app.type === "COOK" ? "#F57C20" : "#2563eb",
          }}
        >
          {app.type === "COOK" ? (
            <Users className="h-3 w-3" />
          ) : (
            <Bike className="h-3 w-3" />
          )}
          {app.type === "COOK"
            ? t("partnerValidation.tabCooks")
            : t("partnerValidation.tabRiders")}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{ backgroundColor: stat.bg, color: stat.color }}
        >
          {t(`partnerValidation.${app.status}`)}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs" style={{ color: "#6B7280" }}>
          {app.score != null ? `${app.score}/100` : "—"}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs" style={{ color: "#6B7280" }}>
          {formatRelative(app.createdAt)}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
      </td>
    </tr>
  );
}

// ── ApplicationDetail ────────────────────────────────────────────────

function ApplicationDetail({
  app,
  t,
  onApprove,
  onReject,
  onMarkReview,
}: {
  app: PartnerApplication | null;
  t: (key: string) => string;
  onApprove: (a: PartnerApplication) => void;
  onReject: (a: PartnerApplication) => void;
  onMarkReview: (a: PartnerApplication) => void;
}) {
  if (!app) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        }}
      >
        <FileText className="h-10 w-10 mb-3" style={{ color: "#e8e4de" }} />
        <p className="text-sm" style={{ color: "#6B7280" }}>
          {t("partnerValidation.selectApplication")}
        </p>
      </div>
    );
  }

  const stat = statusStyle(app.status);
  const specialties = safeParseJSON(app.specialties);
  const kitchenPhotos = safeParseJSON(app.kitchenPhotos);
  const vehiclePhotos = safeParseJSON(app.vehiclePhotos);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid #f5f3ef" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              backgroundColor: app.type === "COOK" ? "#fdf3ee" : "#eff6ff",
              color: app.type === "COOK" ? "#F57C20" : "#2563eb",
            }}
          >
            {app.type === "COOK"
              ? t("partnerValidation.tabCooks")
              : t("partnerValidation.tabRiders")}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{ backgroundColor: stat.bg, color: stat.color }}
          >
            {t(`partnerValidation.${app.status}`)}
          </span>
        </div>
        {app.score != null && (
          <div className="flex items-center gap-1">
            <span
              className="text-lg font-bold"
              style={{
                color:
                  app.score >= 70
                    ? "#166534"
                    : app.score >= 40
                      ? "#9a3412"
                      : "#991b1b",
              }}
            >
              {app.score}
            </span>
            <span className="text-xs" style={{ color: "#6B7280" }}>
              /100
            </span>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="p-4 space-y-3" style={{ borderBottom: "1px solid #f5f3ef" }}>
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "#6B7280" }}
        >
          {t("partnerValidation.personalInfo")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>
              {t("partnerValidation.name")}
            </p>
            <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
              {app.fullName}
            </p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>
              {t("partnerValidation.phone")}
            </p>
            <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
              {app.phone}
            </p>
          </div>
          {app.email && (
            <div>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>
                {t("partnerValidation.email")}
              </p>
              <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
                {app.email}
              </p>
            </div>
          )}
          {app.idNumber && (
            <div>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>
                {t("partnerValidation.idNumber")}
              </p>
              <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
                {app.idNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cook / Rider specific */}
      {app.type === "COOK" && (
        <div className="p-4 space-y-3" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#6B7280" }}
          >
            {t("partnerValidation.cookInfo")}
          </p>
          {specialties.length > 0 && (
            <div>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>
                {t("partnerValidation.specialties")}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {specialties.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: "#fdf3ee", color: "#F57C20" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {app.cookingExp && (
            <div>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>
                {t("partnerValidation.experience")}
              </p>
              <p className="text-sm" style={{ color: "#3D3D3D" }}>
                {app.cookingExp}
              </p>
            </div>
          )}
        </div>
      )}

      {app.type === "RIDER" && (
        <div className="p-4 space-y-3" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "#6B7280" }}
          >
            {t("partnerValidation.riderInfo")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {app.vehicleType && (
              <div>
                <p className="text-[10px]" style={{ color: "#6B7280" }}>
                  {t("partnerValidation.vehicleType")}
                </p>
                <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
                  {app.vehicleType}
                </p>
              </div>
            )}
            {app.plateNumber && (
              <div>
                <p className="text-[10px]" style={{ color: "#6B7280" }}>
                  {t("partnerValidation.plateNumber")}
                </p>
                <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
                  {app.plateNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="p-4 space-y-2" style={{ borderBottom: "1px solid #f5f3ef" }}>
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "#6B7280" }}
        >
          {t("partnerValidation.documents")}
        </p>
        <div className="flex flex-wrap gap-2">
          {app.idDocumentUrl && (
            <a
              href={app.idDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: "#fbf9f5", color: "#F57C20" }}
            >
              <Eye className="h-3 w-3" /> Pièce d&apos;identité
            </a>
          )}
          {app.selfieUrl && (
            <a
              href={app.selfieUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: "#fbf9f5", color: "#F57C20" }}
            >
              <Eye className="h-3 w-3" /> Selfie
            </a>
          )}
          {app.healthCertUrl && (
            <a
              href={app.healthCertUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: "#fbf9f5", color: "#F57C20" }}
            >
              <Eye className="h-3 w-3" /> Certificat sanitaire
            </a>
          )}
          {app.licenseUrl && (
            <a
              href={app.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: "#fbf9f5", color: "#F57C20" }}
            >
              <Eye className="h-3 w-3" /> Permis
            </a>
          )}
          {app.insuranceUrl && (
            <a
              href={app.insuranceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: "#fbf9f5", color: "#F57C20" }}
            >
              <Eye className="h-3 w-3" /> Assurance
            </a>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {app.rejectionReason && (
        <div className="p-4" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <div className="rounded-xl p-3" style={{ backgroundColor: "#fee2e2" }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: "#991b1b" }}>
              {t("partnerValidation.rejectionReason")}
            </p>
            <p className="text-sm mt-1" style={{ color: "#991b1b" }}>
              {app.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {app.notes && (
        <div className="p-4" style={{ borderBottom: "1px solid #f5f3ef" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>
            {t("partnerValidation.notes")}
          </p>
          <p className="text-sm mt-1" style={{ color: "#3D3D3D" }}>{app.notes}</p>
        </div>
      )}

      {/* Actions */}
      {(app.status === "PENDING" || app.status === "UNDER_REVIEW") && (
        <div className="p-4 flex flex-wrap gap-2">
          <button
            className="flex-1 rounded-full py-2.5 text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #16a34a, #15803d)",
            }}
            onClick={() => onApprove(app)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
            {t("partnerValidation.approve")}
          </button>
          <button
            className="flex-1 rounded-full py-2.5 text-xs font-bold text-white"
            style={{ backgroundColor: "#ef4444" }}
            onClick={() => onReject(app)}
          >
            <XCircle className="h-3.5 w-3.5 inline mr-1" />
            {t("partnerValidation.reject")}
          </button>
          {app.status === "PENDING" && (
            <button
              className="rounded-full px-4 py-2.5 text-xs font-bold"
              style={{ border: "1.5px solid #e8e4de", color: "#6B7280" }}
              onClick={() => onMarkReview(app)}
            >
              {t("partnerValidation.markReview")}
            </button>
          )}
        </div>
      )}

      {/* Date */}
      <div className="px-4 pb-4">
        <p className="text-[10px]" style={{ color: "#b8b3ad" }}>
          Candidature soumise le {formatDate(app.createdAt)}
          {app.reviewedAt && ` — revue le ${formatDate(app.reviewedAt)}`}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function PartnersPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PartnerApplication | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;

      const [statsRes, listRes] = await Promise.all([
        apiClient.get<PartnerStats>("/admin/partner-applications/stats"),
        apiClient.get<PartnerListResponse>(
          "/admin/partner-applications",
          params
        ),
      ]);
      setStats(statsRes);
      setApplications(listRes.items);
      setTotal(listRes.total);
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

  const handleSelect = async (app: PartnerApplication) => {
    try {
      const detail = await apiClient.get<PartnerApplication>(
        `/admin/partner-applications/${app.id}`
      );
      setSelected(detail);
    } catch {
      setSelected(app);
    }
  };

  const handleApprove = async (app: PartnerApplication) => {
    if (
      !window.confirm(
        `Approuver la candidature de ${app.fullName} ?`
      )
    )
      return;
    try {
      await apiClient.post(`/admin/partner-applications/${app.id}/approve`, {});
      showToast(`${app.fullName} approuvé(e)`);
      fetchData();
      setSelected(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors de l'approbation");
    }
  };

  const handleReject = async (app: PartnerApplication) => {
    const reason = window.prompt("Raison du rejet :");
    if (!reason) return;
    try {
      await apiClient.post(`/admin/partner-applications/${app.id}/reject`, {
        rejectionReason: reason,
      });
      showToast(`Candidature de ${app.fullName} rejetée`);
      fetchData();
      setSelected(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur lors du rejet");
    }
  };

  const handleMarkReview = async (app: PartnerApplication) => {
    try {
      await apiClient.post(
        `/admin/partner-applications/${app.id}/under-review`
      );
      showToast("Candidature marquée en revue");
      fetchData();
      setSelected(null);
    } catch {
      showToast("Erreur");
    }
  };

  const STATUSES: ApplicationStatus[] = [
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1
          className="text-[2rem] font-semibold italic leading-tight"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          {t("partnerValidation.title")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          {t("partnerValidation.subtitle")}
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5" style={{ color: "#b45309" }} />}
          label={t("partnerValidation.pending")}
          value={stats?.pending ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={
            <CheckCircle2 className="h-5 w-5" style={{ color: "#2c694e" }} />
          }
          label={t("partnerValidation.approved")}
          value={stats?.approved ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<Users className="h-5 w-5" style={{ color: "#F57C20" }} />}
          label={t("partnerValidation.pendingCooks")}
          value={stats?.pendingCooks ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<Bike className="h-5 w-5" style={{ color: "#2563eb" }} />}
          label={t("partnerValidation.pendingRiders")}
          value={stats?.pendingRiders ?? "—"}
          loading={loading}
        />
      </div>

      {/* Filters — tabs + status */}
      <div className="flex flex-wrap gap-2">
        {/* Type tabs */}
        <div
          className="flex rounded-full overflow-hidden"
          style={{ border: "1.5px solid #e8e4de" }}
        >
          <button
            className="px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: filterType === "" ? "#F57C20" : "#ffffff",
              color: filterType === "" ? "#ffffff" : "#6B7280",
            }}
            onClick={() => {
              setFilterType("");
              setPage(1);
            }}
          >
            {t("disputes.filterAll")}
          </button>
          <button
            className="px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: filterType === "COOK" ? "#F57C20" : "#ffffff",
              color: filterType === "COOK" ? "#ffffff" : "#6B7280",
            }}
            onClick={() => {
              setFilterType("COOK");
              setPage(1);
            }}
          >
            {t("partnerValidation.tabCooks")}
          </button>
          <button
            className="px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: filterType === "RIDER" ? "#F57C20" : "#ffffff",
              color: filterType === "RIDER" ? "#ffffff" : "#6B7280",
            }}
            onClick={() => {
              setFilterType("RIDER");
              setPage(1);
            }}
          >
            {t("partnerValidation.tabRiders")}
          </button>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-full px-4 py-2 text-xs font-bold outline-none appearance-none"
          style={{
            border: "1.5px solid #e8e4de",
            color: "#3D3D3D",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">
            {t("disputes.status")}: {t("disputes.filterAll")}
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`partnerValidation.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Table + Detail */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* List (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h2
            className="text-lg font-semibold italic"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            {t("partnerValidation.allApplications")} ({total})
          </h2>

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
            ) : applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#fbf9f5" }}>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#6B7280" }}
                      >
                        {t("partnerValidation.name")}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell"
                        style={{ color: "#6B7280" }}
                      >
                        {t("disputes.type")}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#6B7280" }}
                      >
                        {t("disputes.status")}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell"
                        style={{ color: "#6B7280" }}
                      >
                        {t("partnerValidation.score")}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell"
                        style={{ color: "#6B7280" }}
                      >
                        Date
                      </th>
                      <th className="px-4 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <ApplicationRow
                        key={app.id}
                        app={app}
                        selected={selected?.id === app.id}
                        onClick={() => handleSelect(app)}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center">
                <Users className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  {t("partnerValidation.noApplication")}
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
        </div>

        {/* Detail panel (2 cols) */}
        <div className="lg:col-span-2">
          <h2
            className="text-lg font-semibold italic mb-3"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            {t("partnerValidation.detail")}
          </h2>
          <ApplicationDetail
            app={selected}
            t={t}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkReview={handleMarkReview}
          />
        </div>
      </div>

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>

      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #F57C20, #E06A10)",
            boxShadow: "0 4px 20px rgba(160,60,0,0.3)",
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
