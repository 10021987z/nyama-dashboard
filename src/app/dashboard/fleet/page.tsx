"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { FleetRider, FleetResponse, RiderStatus } from "@/lib/types";
import { formatFcfaCompact, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import { FleetTable } from "@/components/dashboard/fleet-table";
import { AddRiderDialog } from "@/components/dashboard/add-rider-dialog";
import { VerifyRiderDialog } from "@/components/dashboard/verify-rider-dialog";
import {
  Bike, Star, TrendingUp, Search, ChevronLeft, ChevronRight, MapPin,
  LayoutGrid, List, UserPlus,
} from "lucide-react";

const LIMIT = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────

function riderStatusConfig(
  rider: FleetRider,
  t: (key: string) => string,
): {
  label: string;
  dotColor: string;
  bg: string;
  textColor: string;
} {
  const status: RiderStatus = rider.status ?? (rider.isOnline ? "online" : "offline");
  switch (status) {
    case "online":
      return { label: t("fleet.statusOnline"), dotColor: "#16a34a", bg: "#dcfce7", textColor: "#166534" };
    case "delivering":
      return { label: t("fleet.statusDelivering"), dotColor: "#F57C20", bg: "#fdf3ee", textColor: "#F57C20" };
    case "offline":
    default:
      return { label: t("fleet.statusOffline"), dotColor: "#9ca3af", bg: "#f3f4f6", textColor: "#6b7280" };
  }
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_PALETTE = ["#F57C20", "#2c694e", "#8b4c11", "#E06A10", "#b45309", "#2563eb"];
function avatarBg(id?: string | null): string {
  if (!id) return AVATAR_PALETTE[0];
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

// ── RiderCard ──────────────────────────────────────────────────────────────────

function RiderCard({ rider }: { rider: FleetRider }) {
  const { t } = useLanguage();
  const cfg = riderStatusConfig(rider, t);
  const bg = avatarBg(rider.id);
  const ratingPct = Math.min(100, ((rider.avgRating ?? 0) / 5) * 100);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
      }}
    >
      {/* Header: avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: bg }}
          >
            {initials(rider.name)}
          </div>
          {/* Status dot */}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: cfg.dotColor }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-base font-semibold leading-tight truncate"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {rider.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#6B7280" }}>
            {rider.phone}
          </p>
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
          style={{ backgroundColor: cfg.bg, color: cfg.textColor }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Vehicle info */}
      {(rider.vehicleType || rider.plateNumber) && (
        <div className="flex items-center gap-2">
          <Bike className="h-3.5 w-3.5 shrink-0" style={{ color: "#F57C20" }} />
          <span className="text-xs" style={{ color: "#6B7280" }}>
            {[rider.vehicleType, rider.plateNumber].filter(Boolean).join(" · ")}
          </span>
        </div>
      )}

      {/* City/neighborhood */}
      {(rider.city || rider.neighborhood) && (
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#6B7280" }} />
          <span className="text-xs" style={{ color: "#6B7280" }}>
            {rider.neighborhood ? `${rider.neighborhood}, ${rider.city}` : rider.city}
          </span>
        </div>
      )}

      {/* Rating bar */}
      <div className="flex items-center gap-2">
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: "#b45309" }} strokeWidth={2} />
        <span className="text-sm font-bold" style={{ color: "#3D3D3D" }}>
          {(rider.avgRating ?? 0).toFixed(1)}
        </span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f5f3ef" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${ratingPct}%`, backgroundColor: "#b45309" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 gap-2 rounded-xl px-3 py-2.5"
        style={{ backgroundColor: "#fbf9f5" }}
      >
        <div>
          <p className="text-xs font-bold" style={{ color: "#3D3D3D" }}>
            {(rider.totalTrips ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="text-[10px]" style={{ color: "#6B7280" }}>{t("fleet.deliveries")}</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "#3D3D3D" }}>
            {formatFcfaCompact(rider.totalEarnings)}
          </p>
          <p className="text-[10px]" style={{ color: "#6B7280" }}>{t("fleet.earnings")}</p>
        </div>
      </div>

      {/* Inscrit le */}
      <p className="text-[10px]" style={{ color: "#b8b3ad" }}>
        {t("fleet.registeredAt")} {formatDate(rider.createdAt)}
      </p>
    </div>
  );
}

function RiderCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

// ── Summary banner ─────────────────────────────────────────────────────────────

function SummaryBanner({
  data,
  loading,
}: {
  data: FleetResponse | null;
  loading: boolean;
}) {
  const { t } = useLanguage();
  const total = data?.total ?? 0;
  const online = data?.online ?? data?.data.filter((r) => r.isOnline).length ?? 0;
  const delivering =
    data?.delivering ??
    data?.data.filter((r) => r.status === "delivering").length ??
    0;
  const offline =
    data?.offline ??
    data?.data.filter((r) => !r.isOnline).length ??
    0;

  const stats = [
    { key: "total", label: t("fleet.totalRiders"), value: total, dot: null },
    { key: "online", label: t("fleet.onlineRiders"), value: online, dot: "#16a34a" },
    { key: "delivering", label: t("fleet.occupancy"), value: delivering, dot: "#F57C20" },
    { key: "offline", label: t("fleet.avgRevenue"), value: offline, dot: "#9ca3af" },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {stats.map(({ key, label, value, dot }) => (
        <div
          key={key}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
          }}
        >
          {dot && (
            <span className="relative flex h-3 w-3 shrink-0">
              {key === "delivering" && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ backgroundColor: dot }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-3 w-3"
                style={{ backgroundColor: dot }}
              />
            </span>
          )}
          {!dot && (
            <Bike className="h-5 w-5 shrink-0" style={{ color: "#F57C20" }} />
          )}
          <div>
            {loading ? (
              <Skeleton className="h-6 w-10 mb-0.5" />
            ) : (
              <p
                className="text-xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-montserrat), system-ui, sans-serif",
                  color: "#3D3D3D",
                }}
              >
                {value}
              </p>
            )}
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: "#6B7280" }}
            >
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FleetPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [verifiedSet, setVerifiedSet] = useState<Set<string>>(new Set());
  const [suspendedSet, setSuspendedSet] = useState<Set<string>>(new Set());
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [verifyRider, setVerifyRider] = useState<FleetRider | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [data, setData] = useState<FleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const result = await apiClient.get<FleetResponse>("/admin/fleet", params);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA"
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[1.8rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("fleet.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            {t("fleet.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateUser(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un livreur
        </button>
      </div>

      {/* Summary stats */}
      <SummaryBanner data={data} loading={loading} />

      {/* View switcher */}
      <div className="flex justify-end">
        <div className="inline-flex gap-1 rounded-full p-1" style={{ backgroundColor: "#f5f3ef" }}>
          {[
            { v: "cards" as const, label: "Cartes", Icon: LayoutGrid },
            { v: "table" as const, label: "Tableau", Icon: List },
          ].map(({ v, label, Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
              style={
                view === v
                  ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                  : { color: "#6B7280" }
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div
          className="flex flex-1 min-w-[200px] items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("fleet.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#3D3D3D" }}
          />
        </div>

        {/* Status pills */}
        <div
          className="flex gap-1 rounded-full p-1"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          {[
            { value: "", label: t("fleet.all") },
            { value: "online", label: t("fleet.available") },
            { value: "delivering", label: t("fleet.delivering") },
            { value: "offline", label: t("fleet.offline") },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                statusFilter === opt.value
                  ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                  : { color: "#6B7280" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {error ? (
        <ErrorState message={error} onRetry={fetchFleet} />
      ) : loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RiderCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bike className="h-10 w-10" style={{ color: "#e8e4de" }} />
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {t("fleet.noRider")}
          </p>
        </div>
      ) : (
        <>
          {(() => {
            const visible = (data?.data ?? []).filter((r) => !suspendedSet.has(r.id));
            return view === "cards" ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((rider) => (
                  <RiderCard key={rider.id} rider={rider} />
                ))}
              </div>
            ) : (
              <FleetTable
                rows={visible}
                verifiedSet={verifiedSet}
                onVerify={(r) => setVerifyRider(r)}
              />
            );
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {t("common.page")} {page} {t("common.of")} {totalPages} &bull;{" "}
                <span className="font-medium" style={{ color: "#3D3D3D" }}>
                  {data?.total.toLocaleString("fr-FR")} livreurs
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {t("common.previous")}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40"
                  style={{
                    background: page >= totalPages ? "#e8e4de" : "linear-gradient(135deg, #F57C20, #E06A10)",
                    color: page >= totalPages ? "#6B7280" : "#fff",
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

      {/* Stats insight banner */}
      {!loading && !error && data && data.data.length > 0 && (
        <div
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{ background: "linear-gradient(135deg, #3D3D3D, #2d2e2b)" }}
        >
          <TrendingUp className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#e8c4b0" }} />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#ffffff" }}
            >
              {t("fleet.fleetPerformance")}
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              {t("fleet.avgFleetRating")}{" "}
              <span className="font-bold text-white">
                {(data.data.reduce((a, r) => a + (r.avgRating ?? 0), 0) / data.data.length).toFixed(1)}/5
              </span>
              {" · "}{t("fleet.totalEarnings")}{" "}
              <span className="font-bold text-white">
                {formatFcfaCompact(data.data.reduce((a, r) => a + (r.totalEarnings ?? 0), 0))}
              </span>
              {" · "}{t("fleet.totalTrips")}{" "}
              <span className="font-bold text-white">
                {data.data.reduce((a, r) => a + (r.totalTrips ?? 0), 0).toLocaleString("fr-FR")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>

      <AddRiderDialog
        open={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onCreated={(_r, name) => {
          setToast(`Livreur ${name} créé ✓`);
          fetchFleet();
        }}
      />

      <VerifyRiderDialog
        rider={verifyRider}
        onClose={() => setVerifyRider(null)}
        onApprove={(id) => {
          setVerifiedSet((prev) => new Set(prev).add(id));
          setToast("Livreur approuvé ✓");
        }}
        onReject={(id) => {
          setSuspendedSet((prev) => new Set(prev).add(id));
          setToast("Livreur rejeté");
        }}
      />

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: "#F57C20" }}
          onAnimationEnd={() => setToast(null)}
        >
          {toast}
          <button onClick={() => setToast(null)} className="ml-3 opacity-70 hover:opacity-100">×</button>
        </div>
      )}
    </div>
  );
}
