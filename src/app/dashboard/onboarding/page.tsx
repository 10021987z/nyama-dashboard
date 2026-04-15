"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCheck2,
  Users,
  UserX,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";

const COLORS = {
  orange: "#F57C20",
  green: "#1B4332",
  gold: "#D4A017",
  red: "#E8413C",
  charcoal: "#3D3D3D",
  creme: "#F5F5F0",
};

type Status = "all" | "pre_approved" | "pending" | "approved" | "rejected";

interface Application {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  dateOfBirth: string;
  city: string;
  quarter: string;
  vehicleType: string;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  plateNumber: string | null;
  orangeMoney: string | null;
  mtnMomo: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  selfiePhotoUrl: string | null;
  cniPhotoUrl: string | null;
  permisPhotoUrl: string | null;
  vehiclePhotoUrl: string | null;
  kycScore: number;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  preApproved: number;
  approved: number;
  rejected: number;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OnboardingPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Status>("all");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await apiClient.get<Stats>("/admin/onboarding/stats");
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur stats");
    }
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: "1", limit: "20" };
      if (filter !== "all") params.status = filter;
      const data = await apiClient.get<Paginated<Application>>(
        "/admin/onboarding/applications",
        params,
      );
      setApps(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await apiClient.patch(`/admin/onboarding/applications/${id}/status`, {
        status,
      });
      await Promise.all([loadStats(), loadApps()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur mise à jour");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: COLORS.green,
          }}
        >
          {t("onboarding.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("onboarding.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiTile
          label={t("onboarding.total")}
          value={stats?.total ?? "—"}
          color={COLORS.charcoal}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiTile
          label={t("onboarding.preApproved")}
          value={stats?.preApproved ?? "—"}
          color={COLORS.green}
          icon={<FileCheck2 className="h-4 w-4" />}
        />
        <KpiTile
          label={t("onboarding.pending")}
          value={stats?.pending ?? "—"}
          color={COLORS.gold}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiTile
          label={t("onboarding.approved")}
          value={stats?.approved ?? "—"}
          color={COLORS.green}
          icon={<Check className="h-4 w-4" />}
        />
        <KpiTile
          label={t("onboarding.rejected")}
          value={stats?.rejected ?? "—"}
          color={COLORS.red}
          icon={<UserX className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { v: "all", l: t("onboarding.filterAll") },
            { v: "pre_approved", l: t("onboarding.preApproved") },
            { v: "pending", l: t("onboarding.pending") },
            { v: "approved", l: t("onboarding.approved") },
            { v: "rejected", l: t("onboarding.rejected") },
          ] as Array<{ v: Status; l: string }>
        ).map(({ v, l }) => {
          const active = filter === v;
          return (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? COLORS.orange : "#fff",
                color: active ? "#fff" : COLORS.charcoal,
                borderColor: active ? COLORS.orange : "#e5e5e0",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: "#FEECEC",
            borderColor: COLORS.red,
            color: COLORS.red,
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground">
            {t("onboarding.empty")}
          </div>
        ) : (
          apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              expanded={expanded === app.id}
              onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
              onPhotoClick={setLightbox}
              onApprove={() => updateStatus(app.id, "approved")}
              onReject={() => updateStatus(app.id, "rejected")}
              onHold={() => updateStatus(app.id, "pending")}
              busy={updating === app.id}
              t={t}
            />
          ))
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="photo"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ backgroundColor: "#fff", borderColor: "#e5e5e0" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="rounded-full p-1.5" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
      </div>
      <p
        className="mt-2 text-3xl font-black"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? COLORS.green : score >= 50 ? COLORS.gold : COLORS.red;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {score}/100
    </span>
  );
}

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, { label: string; color: string }> = {
    pre_approved: { label: t("onboarding.preApproved"), color: COLORS.green },
    pending: { label: t("onboarding.pending"), color: COLORS.gold },
    approved: { label: t("onboarding.approved"), color: COLORS.green },
    rejected: { label: t("onboarding.rejected"), color: COLORS.red },
  };
  const s = map[status] ?? { label: status, color: COLORS.charcoal };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${s.color}15`, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function ApplicationCard({
  app,
  expanded,
  onToggle,
  onPhotoClick,
  onApprove,
  onReject,
  onHold,
  busy,
  t,
}: {
  app: Application;
  expanded: boolean;
  onToggle: () => void;
  onPhotoClick: (url: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onHold: () => void;
  busy: boolean;
  t: (k: string) => string;
}) {
  const initials = app.fullName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const photos: Array<{ label: string; url: string | null }> = [
    { label: "Selfie", url: app.selfiePhotoUrl },
    { label: "CNI", url: app.cniPhotoUrl },
    { label: t("onboarding.license"), url: app.permisPhotoUrl },
    { label: t("onboarding.vehicle"), url: app.vehiclePhotoUrl },
  ];

  return (
    <div
      className="rounded-2xl border bg-white transition-shadow hover:shadow-sm"
      style={{ borderColor: "#e5e5e0" }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: COLORS.orange }}
        >
          {app.selfiePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.selfiePhotoUrl}
              alt={app.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold" style={{ color: COLORS.charcoal }}>
              {app.fullName}
            </p>
            <StatusPill status={app.status} t={t} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {app.phone} · {app.city} — {app.quarter} · {app.vehicleType}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {new Date(app.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScoreBadge score={app.kycScore} />
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4" style={{ borderColor: "#e5e5e0" }}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <Detail label={t("onboarding.email")} value={app.email ?? "—"} />
              <Detail label={t("onboarding.dob")} value={app.dateOfBirth} />
              <Detail
                label={t("onboarding.vehicle")}
                value={[app.vehicleType, app.vehicleBrand, app.vehicleColor, app.plateNumber]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              />
              <Detail
                label="Mobile money"
                value={
                  [
                    app.orangeMoney && `Orange ${app.orangeMoney}`,
                    app.mtnMomo && `MTN ${app.mtnMomo}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Detail
                label={t("onboarding.emergency")}
                value={
                  app.emergencyContact
                    ? `${app.emergencyContact}${app.emergencyPhone ? ` · ${app.emergencyPhone}` : ""}`
                    : "—"
                }
              />
              {app.reviewedAt && (
                <Detail
                  label={t("onboarding.reviewedAt")}
                  value={`${new Date(app.reviewedAt).toLocaleString("fr-FR")}${
                    app.reviewedBy ? ` · ${app.reviewedBy}` : ""
                  }`}
                />
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4">
              {photos.map((p) => (
                <button
                  key={p.label}
                  onClick={() => p.url && onPhotoClick(p.url)}
                  disabled={!p.url}
                  className="overflow-hidden rounded-lg border"
                  style={{
                    aspectRatio: "1",
                    borderColor: "#e5e5e0",
                    backgroundColor: COLORS.creme,
                  }}
                >
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      {p.label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onApprove}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: COLORS.green }}
            >
              <Check className="h-4 w-4" />
              {t("onboarding.approve")}
            </button>
            <button
              onClick={onHold}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: COLORS.gold }}
            >
              <Clock className="h-4 w-4" />
              {t("onboarding.hold")}
            </button>
            <button
              onClick={onReject}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: COLORS.red }}
            >
              <X className="h-4 w-4" />
              {t("onboarding.reject")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right font-medium" style={{ color: COLORS.charcoal }}>
        {value}
      </span>
    </div>
  );
}
