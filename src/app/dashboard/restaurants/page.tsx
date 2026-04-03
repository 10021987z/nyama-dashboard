"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Restaurant, RestaurantsResponse } from "@/lib/types";
import { formatFcfaCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Search, Star, Package, TrendingUp, ChefHat, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseSpecialties(raw?: string): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.map(String);
    return [String(p)];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
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

const AVATAR_COLORS = [
  "#a03c00", "#2c694e", "#8b4c11", "#c94d00",
  "#b45309", "#2563eb", "#7c3aed", "#db2777",
];

function avatarColor(id: string): string {
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "#fdf3ee" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-7 w-16 mb-1" />
        ) : (
          <p
            className="text-[1.6rem] font-bold leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {value}
          </p>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7c7570" }}>
          {label}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: "#b8b3ad" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── RestaurantCard ─────────────────────────────────────────────────────────────

function RestaurantCard({ r }: { r: Restaurant }) {
  const specs = parseSpecialties(r.specialty);
  const color = avatarColor(r.id);
  const pct = Math.min(100, (r.avgRating / 5) * 100);

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
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials(r.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-base font-semibold leading-tight truncate"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            {r.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#7c7570" }}>
            {r.neighborhood ? `${r.neighborhood}, ` : ""}
            {r.city}
          </p>
        </div>
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          title={r.isActive ? "Active" : "Inactive"}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: r.isActive ? "#16a34a" : "#e5e7eb" }}
          />
        </div>
      </div>

      {/* Specialties */}
      {specs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {specs.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: "#f0fdf4", color: "#2c694e" }}
            >
              {s}
            </span>
          ))}
          {specs.length > 3 && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: "#f5f3ef", color: "#7c7570" }}
            >
              +{specs.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Rating bar */}
      <div className="flex items-center gap-2">
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: "#b45309" }} strokeWidth={2} />
        <span className="text-sm font-bold" style={{ color: "#1b1c1a" }}>
          {r.avgRating.toFixed(1)}
        </span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f5f3ef" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: "#b45309" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div
        className="flex items-center justify-between rounded-xl px-3 py-2"
        style={{ backgroundColor: "#fbf9f5" }}
      >
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" style={{ color: "#a03c00" }} strokeWidth={2} />
          <span className="text-xs font-semibold" style={{ color: "#1b1c1a" }}>
            {r.totalOrders.toLocaleString("fr-FR")}
          </span>
          <span className="text-[10px]" style={{ color: "#7c7570" }}>cmd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: "#2c694e" }} strokeWidth={2} />
          <span className="text-xs font-semibold" style={{ color: "#1b1c1a" }}>
            {formatFcfaCompact(r.totalRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RestaurantCardSkeleton() {
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
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RestaurantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (cityFilter) params.city = cityFilter;
      if (statusFilter) params.isActive = statusFilter === "active" ? 1 : 0;
      const result = await apiClient.get<RestaurantsResponse>("/admin/restaurants", params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, cityFilter, statusFilter, page]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  const totalActive = data?.data.filter((r) => r.isActive).length ?? 0;
  const avgRating =
    data?.data.length
      ? (data.data.reduce((acc, r) => acc + r.avgRating, 0) / data.data.length).toFixed(1)
      : "—";
  const totalRevenue = data?.data.reduce((acc, r) => acc + r.totalRevenue, 0) ?? 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div>
        <h1
          className="text-[1.8rem] font-semibold italic leading-tight"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          Restaurants & Cuisinières
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
          Partenaires culinaires de la marketplace NYAMA
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ChefHat className="h-5 w-5" style={{ color: "#a03c00" }} />}
          label="Total"
          value={data?.total ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#16a34a" }} />}
          label="Actives"
          value={totalActive}
          sub="ce chargement"
          loading={loading}
        />
        <StatCard
          icon={<Star className="h-5 w-5" style={{ color: "#b45309" }} />}
          label="Note moy."
          value={`${avgRating} / 5`}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" style={{ color: "#2c694e" }} />}
          label="Revenus"
          value={formatFcfaCompact(totalRevenue)}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-end gap-3"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        {/* Search */}
        <div
          className="flex flex-1 min-w-[200px] items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "#7c7570" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#1b1c1a" }}
          />
        </div>

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
        >
          <option value="">Toutes les villes</option>
          <option value="Douala">Douala</option>
          <option value="Yaoundé">Yaoundé</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>

        {/* Reset */}
        <button
          onClick={() => { setSearch(""); setCityFilter(""); setStatusFilter(""); setPage(1); }}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: "#f5f3ef", color: "#7c7570" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={fetchRestaurants} />
      ) : loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ChefHat className="h-10 w-10" style={{ color: "#e8e4de" }} />
          <p className="text-sm" style={{ color: "#7c7570" }}>
            Aucun restaurant trouvé
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.data.map((r) => (
              <RestaurantCard key={r.id} r={r} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm" style={{ color: "#7c7570" }}>
                Page {page} sur {totalPages} &bull;{" "}
                <span className="font-medium" style={{ color: "#1b1c1a" }}>
                  {data?.total.toLocaleString("fr-FR")} restaurants
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-40 text-white"
                  style={{
                    background: page >= totalPages
                      ? "#e8e4de"
                      : "linear-gradient(135deg, #a03c00, #c94d00)",
                    color: page >= totalPages ? "#7c7570" : "#fff",
                  }}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
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
