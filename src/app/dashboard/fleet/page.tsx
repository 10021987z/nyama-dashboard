"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { FleetRider, FleetResponse, RiderStatus } from "@/lib/types";
import { formatFcfaCompact, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Bike, Star, TrendingUp, Search, ChevronLeft, ChevronRight, MapPin,
} from "lucide-react";

const LIMIT = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────

function riderStatusConfig(rider: FleetRider): {
  label: string;
  dotColor: string;
  bg: string;
  textColor: string;
} {
  const status: RiderStatus = rider.status ?? (rider.isOnline ? "online" : "offline");
  switch (status) {
    case "online":
      return { label: "En ligne", dotColor: "#16a34a", bg: "#dcfce7", textColor: "#166534" };
    case "delivering":
      return { label: "En livraison", dotColor: "#a03c00", bg: "#fdf3ee", textColor: "#a03c00" };
    case "offline":
    default:
      return { label: "Hors ligne", dotColor: "#9ca3af", bg: "#f3f4f6", textColor: "#6b7280" };
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_PALETTE = ["#a03c00", "#2c694e", "#8b4c11", "#c94d00", "#b45309", "#2563eb"];
function avatarBg(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

// ── RiderCard ──────────────────────────────────────────────────────────────────

function RiderCard({ rider }: { rider: FleetRider }) {
  const cfg = riderStatusConfig(rider);
  const bg = avatarBg(rider.id);
  const ratingPct = Math.min(100, (rider.avgRating / 5) * 100);

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
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {rider.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#7c7570" }}>
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
          <Bike className="h-3.5 w-3.5 shrink-0" style={{ color: "#a03c00" }} />
          <span className="text-xs" style={{ color: "#7c7570" }}>
            {[rider.vehicleType, rider.plateNumber].filter(Boolean).join(" · ")}
          </span>
        </div>
      )}

      {/* City/neighborhood */}
      {(rider.city || rider.neighborhood) && (
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#7c7570" }} />
          <span className="text-xs" style={{ color: "#7c7570" }}>
            {rider.neighborhood ? `${rider.neighborhood}, ${rider.city}` : rider.city}
          </span>
        </div>
      )}

      {/* Rating bar */}
      <div className="flex items-center gap-2">
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: "#b45309" }} strokeWidth={2} />
        <span className="text-sm font-bold" style={{ color: "#1b1c1a" }}>
          {rider.avgRating.toFixed(1)}
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
          <p className="text-xs font-bold" style={{ color: "#1b1c1a" }}>
            {rider.totalTrips.toLocaleString("fr-FR")}
          </p>
          <p className="text-[10px]" style={{ color: "#7c7570" }}>Courses</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "#1b1c1a" }}>
            {formatFcfaCompact(rider.totalEarnings)}
          </p>
          <p className="text-[10px]" style={{ color: "#7c7570" }}>Gains</p>
        </div>
      </div>

      {/* Inscrit le */}
      <p className="text-[10px]" style={{ color: "#b8b3ad" }}>
        Inscrit le {formatDate(rider.createdAt)}
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
    { label: "Total livreurs", value: total, dot: null },
    { label: "En ligne", value: online, dot: "#16a34a" },
    { label: "En livraison", value: delivering, dot: "#a03c00" },
    { label: "Hors ligne", value: offline, dot: "#9ca3af" },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, dot }) => (
        <div
          key={label}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
          }}
        >
          {dot && (
            <span className="relative flex h-3 w-3 shrink-0">
              {label === "En livraison" && (
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
            <Bike className="h-5 w-5 shrink-0" style={{ color: "#a03c00" }} />
          )}
          <div>
            {loading ? (
              <Skeleton className="h-6 w-10 mb-0.5" />
            ) : (
              <p
                className="text-xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-newsreader), Georgia, serif",
                  color: "#1b1c1a",
                }}
              >
                {value}
              </p>
            )}
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: "#7c7570" }}
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
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
      <div>
        <h1
          className="text-[1.8rem] font-semibold italic leading-tight"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          Gestion de la Flotte
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
          Livreurs actifs et tracking en temps réel
        </p>
      </div>

      {/* Summary stats */}
      <SummaryBanner data={data} loading={loading} />

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div
          className="flex flex-1 min-w-[200px] items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "#7c7570" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher un livreur..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#1b1c1a" }}
          />
        </div>

        {/* Status pills */}
        <div
          className="flex gap-1 rounded-full p-1"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          {[
            { value: "", label: "Tous" },
            { value: "online", label: "En ligne" },
            { value: "delivering", label: "En livraison" },
            { value: "offline", label: "Hors ligne" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                statusFilter === opt.value
                  ? { background: "linear-gradient(135deg, #a03c00, #c94d00)", color: "#fff" }
                  : { color: "#7c7570" }
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
          <p className="text-sm" style={{ color: "#7c7570" }}>
            Aucun livreur trouvé
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.data.map((rider) => (
              <RiderCard key={rider.id} rider={rider} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm" style={{ color: "#7c7570" }}>
                Page {page} sur {totalPages} &bull;{" "}
                <span className="font-medium" style={{ color: "#1b1c1a" }}>
                  {data?.total.toLocaleString("fr-FR")} livreurs
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40"
                  style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40"
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

      {/* Stats insight banner */}
      {!loading && !error && data && data.data.length > 0 && (
        <div
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{ background: "linear-gradient(135deg, #1b1c1a, #2d2e2b)" }}
        >
          <TrendingUp className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#e8c4b0" }} />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#ffffff" }}
            >
              Performance de la flotte
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Note moyenne de la flotte :{" "}
              <span className="font-bold text-white">
                {(data.data.reduce((a, r) => a + r.avgRating, 0) / data.data.length).toFixed(1)}/5
              </span>
              {" · "}Gains totaux cumulés :{" "}
              <span className="font-bold text-white">
                {formatFcfaCompact(data.data.reduce((a, r) => a + r.totalEarnings, 0))}
              </span>
              {" · "}Courses totales :{" "}
              <span className="font-bold text-white">
                {data.data.reduce((a, r) => a + r.totalTrips, 0).toLocaleString("fr-FR")}
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
        NYAMA TECH SYSTEMS &copy; 2026 &bull; PROPULSION DE L&apos;EXCELLENCE CULINAIRE CAMEROUNAISE
      </p>
    </div>
  );
}
