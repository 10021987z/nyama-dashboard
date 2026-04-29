"use client";

import { useState, useMemo, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useApi } from "@/hooks/use-api";
import { apiClient } from "@/lib/api";
import { formatFcfa } from "@/lib/utils";
import {
  Search,
  UtensilsCrossed,
  Flame,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  TrendingUp,
  PackageCheck,
  PackageX,
  Coins,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useAdminSocketEvent } from "@/lib/admin-socket";
import { toast } from "sonner";

interface AdminMenuItem {
  id: string;
  cookId: string;
  name: string;
  description?: string;
  priceXaf: number;
  category: string;
  isAvailable: boolean;
  isDailySpecial: boolean;
  prepTimeMin?: number;
  cook?: {
    id: string;
    userId: string;
    displayName: string;
    avgRating?: number;
    totalOrders?: number;
    isActive?: boolean;
    quarter?: { id: string; name: string; city: string };
  };
}

interface AdminMenuStats {
  totalDishes: number;
  dishesAvailable: number;
  dishesUnavailable: number;
  avgPrice: number;
  categories: string[];
}

interface AdminMenuResponse {
  stats: AdminMenuStats;
  items: AdminMenuItem[];
}

interface MenuUpdatedPayload {
  cookId: string;
  action: "created" | "updated" | "deleted" | "availability";
  menuItem: Partial<AdminMenuItem> & {
    id?: string;
    name?: string;
    adminAction?: { type: "admin_modified" | "admin_deleted"; reason?: string | null };
  };
}

type RowState = "new" | "updated" | "deleting";
type AvailFilter = "all" | "available" | "unavailable";

const NYAMA_ORANGE = "#F57C20";
const NYAMA_GREEN = "#1B4332";
const NYAMA_GOLD = "#D4A017";
const TEXT_DARK = "#3D3D3D";
const TEXT_MUTED = "#6B7280";
const SHADOW = "0 2px 24px rgba(160,60,0,0.05)";

export default function MenuPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [availFilter, setAvailFilter] = useState<AvailFilter>("all");
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());

  const { data, loading, error, refetch } = useApi<AdminMenuResponse>(
    "/admin/menu/all",
  );

  const [rowStates, setRowStates] = useState<Map<string, RowState>>(
    () => new Map(),
  );
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const markRow = (id: string, state: RowState, ttlMs: number) => {
    setRowStates((prev) => {
      const next = new Map(prev);
      next.set(id, state);
      return next;
    });
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setRowStates((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      timersRef.current.delete(id);
    }, ttlMs);
    timersRef.current.set(id, timer);
  };

  useAdminSocketEvent<MenuUpdatedPayload>("menu:updated", (payload) => {
    if (!payload || !payload.menuItem) return;
    const { action, menuItem } = payload;
    const id = menuItem.id;
    const name = menuItem.name ?? "Plat";
    const cookName =
      (menuItem as { cook?: { displayName?: string } })?.cook?.displayName;
    const isAdminAction = !!menuItem.adminAction;

    switch (action) {
      case "created": {
        if (id) markRow(id, "new", 2000);
        toast.success(
          cookName
            ? `Nouveau plat ajouté par ${cookName} : ${name}`
            : `Nouveau plat : ${name}`,
          { duration: 4000 },
        );
        refetch();
        break;
      }
      case "updated":
      case "availability": {
        if (id) markRow(id, "updated", 2000);
        if (isAdminAction) {
          toast(`Modifié par admin : ${name}`, { duration: 2500 });
        }
        refetch();
        break;
      }
      case "deleted": {
        if (id) {
          markRow(id, "deleting", 500);
          setTimeout(() => refetch(), 520);
        } else {
          refetch();
        }
        toast(
          isAdminAction ? `Retiré par admin : ${name}` : `Plat retiré : ${name}`,
          { duration: 3000 },
        );
        break;
      }
    }
  });

  const items = data?.items ?? [];
  const stats = data?.stats ?? {
    totalDishes: 0,
    dishesAvailable: 0,
    dishesUnavailable: 0,
    avgPrice: 0,
    categories: [],
  };

  const categories = useMemo(() => {
    return ["all", ...stats.categories];
  }, [stats.categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.cook?.displayName ?? "").toLowerCase().includes(q);
      const matchC = category === "all" || i.category === category;
      const matchA =
        availFilter === "all" ||
        (availFilter === "available" && i.isAvailable) ||
        (availFilter === "unavailable" && !i.isAvailable);
      return matchQ && matchC && matchA;
    });
  }, [items, query, category, availFilter]);

  // Override admin : bascule disponibilité
  const toggleAvailability = async (item: AdminMenuItem) => {
    const target = !item.isAvailable;
    setBusyIds((prev) => new Set(prev).add(item.id));
    try {
      await apiClient.patch(`/admin/menu-items/${item.id}`, {
        isAvailable: target,
        reason: `Override admin via dashboard`,
      });
      toast.success(
        target
          ? `${item.name} → réactivé`
          : `${item.name} → désactivé`,
      );
    } catch (err) {
      toast.error(
        `Échec : ${err instanceof Error ? err.message : "erreur inconnue"}`,
      );
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // Override admin : suppression (soft delete)
  const adminDelete = async (item: AdminMenuItem) => {
    if (
      !confirm(
        `Retirer "${item.name}" du catalogue ? Le plat sera marqué indisponible (soft-delete).`,
      )
    ) {
      return;
    }
    setBusyIds((prev) => new Set(prev).add(item.id));
    try {
      await apiClient.delete(`/admin/menu-items/${item.id}`);
      toast.success(`${item.name} retiré`);
    } catch (err) {
      toast.error(
        `Échec : ${err instanceof Error ? err.message : "erreur inconnue"}`,
      );
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <style>{`
        @keyframes nyama-flash-orange {
          0%   { box-shadow: 0 0 0 0 rgba(245,124,32,0.55), ${SHADOW}; background-color: #fff7ed; }
          50%  { box-shadow: 0 0 0 6px rgba(245,124,32,0.15), ${SHADOW}; background-color: #fff2e0; }
          100% { box-shadow: ${SHADOW}; background-color: #ffffff; }
        }
        @keyframes nyama-flash-yellow {
          0%   { box-shadow: 0 0 0 0 rgba(234,179,8,0.5), ${SHADOW}; background-color: #fefce8; }
          100% { box-shadow: ${SHADOW}; background-color: #ffffff; }
        }
        @keyframes nyama-fade-out {
          0%   { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(12px) scale(0.97); }
        }
        .nyama-row-new      { animation: nyama-flash-orange 2s ease-out; }
        .nyama-row-updated  { animation: nyama-flash-yellow 2s ease-out; }
        .nyama-row-deleting { animation: nyama-fade-out 500ms ease-out forwards; pointer-events: none; }
      `}</style>

      <div>
        <h1
          className="text-[1.8rem] font-semibold italic leading-tight"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: TEXT_DARK,
          }}
        >
          Menu global
        </h1>
        <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>
          Catalogue agrégé de toutes les cuisinières · live · admin override
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* Stats header — 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label="Plats au catalogue"
          value={stats.totalDishes.toString()}
          accent={NYAMA_ORANGE}
        />
        <StatCard
          icon={<PackageCheck className="h-4 w-4" />}
          label="Disponibles"
          value={stats.dishesAvailable.toString()}
          accent={NYAMA_GREEN}
        />
        <StatCard
          icon={<PackageX className="h-4 w-4" />}
          label="Indisponibles"
          value={stats.dishesUnavailable.toString()}
          accent="#991b1b"
        />
        <StatCard
          icon={<Coins className="h-4 w-4" />}
          label="Prix moyen"
          value={formatFcfa(stats.avgPrice)}
          accent={NYAMA_GOLD}
        />
      </div>

      {/* Toolbar : search + category + availability toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: TEXT_MUTED }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un plat ou une cuisinière…"
            className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "#ffffff", boxShadow: SHADOW }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full px-4 py-2.5 text-sm font-semibold outline-none"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: SHADOW,
            color: TEXT_DARK,
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Toutes catégories" : c}
            </option>
          ))}
        </select>
        <div
          className="inline-flex rounded-full p-1"
          style={{ backgroundColor: "#ffffff", boxShadow: SHADOW }}
        >
          {(["all", "available", "unavailable"] as AvailFilter[]).map((f) => {
            const active = availFilter === f;
            const label =
              f === "all" ? "Tout" : f === "available" ? "Dispos" : "Indispos";
            return (
              <button
                key={f}
                onClick={() => setAvailFilter(f)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: active ? NYAMA_ORANGE : "transparent",
                  color: active ? "#ffffff" : TEXT_DARK,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des plats */}
      {loading ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const rowState = rowStates.get(item.id);
            const animClass =
              rowState === "new"
                ? "nyama-row-new"
                : rowState === "updated"
                ? "nyama-row-updated"
                : rowState === "deleting"
                ? "nyama-row-deleting"
                : "";
            const isBusy = busyIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-2xl p-5 transition-all flex flex-col ${animClass}`}
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: SHADOW,
                  opacity: item.isAvailable ? 1 : 0.65,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed
                        className="h-4 w-4 shrink-0"
                        style={{ color: NYAMA_ORANGE }}
                      />
                      <h3
                        className="text-sm font-bold truncate"
                        style={{ color: TEXT_DARK }}
                      >
                        {item.name}
                      </h3>
                      {rowState === "new" && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide"
                          style={{ backgroundColor: NYAMA_ORANGE, color: "#fff" }}
                        >
                          <Sparkles className="h-2.5 w-2.5" /> NOUVEAU
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p
                        className="mt-1 text-xs line-clamp-2"
                        style={{ color: TEXT_MUTED }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.isDailySpecial && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
                    >
                      <Flame className="h-3 w-3" /> SPÉCIAL
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: NYAMA_ORANGE,
                      fontFamily: "var(--font-mono), monospace",
                    }}
                  >
                    {formatFcfa(item.priceXaf)}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase"
                    style={{ color: item.isAvailable ? "#166534" : "#991b1b" }}
                  >
                    {item.isAvailable ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {item.isAvailable ? "Disponible" : "Indisponible"}
                  </span>
                </div>

                <div
                  className="mt-3 pt-3 text-xs flex items-center justify-between gap-2"
                  style={{ borderTop: "1px solid #f5f3ef", color: TEXT_MUTED }}
                >
                  <div className="min-w-0 flex-1">
                    <span
                      className="font-semibold truncate block"
                      style={{ color: TEXT_DARK }}
                    >
                      {item.cook?.displayName ?? "—"}
                    </span>
                    <span className="text-[10px]">
                      {item.cook?.quarter
                        ? `${item.cook.quarter.name}, ${item.cook.quarter.city} · `
                        : ""}
                      {item.category}
                      {item.cook?.avgRating
                        ? ` · ⭐ ${item.cook.avgRating.toFixed(1)}`
                        : ""}
                    </span>
                  </div>
                </div>

                {/* Admin actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toggleAvailability(item)}
                    disabled={isBusy}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: item.isAvailable ? "#fef2f2" : "#ecfdf5",
                      color: item.isAvailable ? "#991b1b" : "#166534",
                      border: `1px solid ${item.isAvailable ? "#fecaca" : "#bbf7d0"}`,
                    }}
                    title={
                      item.isAvailable
                        ? "Désactiver (admin override)"
                        : "Réactiver (admin override)"
                    }
                  >
                    {item.isAvailable ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Désactiver
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Réactiver
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => adminDelete(item)}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#991b1b",
                      border: "1px solid #fecaca",
                    }}
                    title="Retirer du catalogue (soft-delete admin)"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p
              className="col-span-full text-center text-sm py-8"
              style={{ color: TEXT_MUTED }}
            >
              Aucun plat ne correspond aux filtres.
            </p>
          )}
        </div>
      )}

      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ backgroundColor: "#ffffff", boxShadow: SHADOW }}
    >
      <div
        className="h-9 w-9 rounded-full inline-flex items-center justify-center"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="text-[10px] uppercase font-semibold tracking-wide"
          style={{ color: TEXT_MUTED }}
        >
          {label}
        </p>
        <p className="text-lg font-bold truncate" style={{ color: TEXT_DARK }}>
          {value}
        </p>
      </div>
    </div>
  );
}
