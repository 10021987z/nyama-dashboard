"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Restaurant, RestaurantsResponse } from "@/lib/types";
import { formatFcfaCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import { Search, Star, Package, TrendingUp, ChefHat, RotateCcw, ChevronLeft, ChevronRight, Eye, Pencil, Ban, X, LayoutGrid, Table as TableIcon, UserPlus, Plus } from "lucide-react";
import { RestaurantsTable } from "@/components/dashboard/restaurants-table";
import { CreateUserDialog } from "@/components/dashboard/create-user-dialog";
import { AddRestaurantWizard } from "@/components/dashboard/add-restaurant-wizard";
import { patchRestaurant, setRestaurantOpen, sendMessage } from "@/lib/admin-mutations";
import { useAdminSocketEvent } from "@/lib/admin-socket";
import { toast as sonnerToast } from "sonner";
import { MessageSquare, Power } from "lucide-react";

const LIMIT = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseSpecialties(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string") return [String(raw)];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = [
  "#F57C20", "#2c694e", "#8b4c11", "#E06A10",
  "#b45309", "#2563eb", "#7c3aed", "#db2777",
];

function avatarColor(id?: string | null): string {
  if (!id) return AVATAR_COLORS[0];
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
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {value}
          </p>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
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

function displayName(r: Restaurant): string {
  return r.name || `Restaurant #${(r.id ?? "").slice(0, 4)}`;
}

function RestaurantCard({
  r,
  onView,
  onEdit,
}: {
  r: Restaurant;
  onView: (r: Restaurant) => void;
  onEdit: (r: Restaurant) => void;
}) {
  const { t } = useLanguage();
  const specs = parseSpecialties(r.specialty);
  const color = avatarColor(r.id);
  const pct = Math.min(100, ((r.avgRating ?? 0) / 5) * 100);
  const name = displayName(r);

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
          {initials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-base font-semibold leading-tight truncate"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {name}
          </p>
          <p className="text-xs truncate" style={{ color: "#6B7280" }}>
            {r.neighborhood ? `${r.neighborhood}, ` : ""}
            {r.city ?? "\u2014"}
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
              style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}
            >
              +{specs.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Rating bar */}
      <div className="flex items-center gap-2">
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: "#b45309" }} strokeWidth={2} />
        <span className="text-sm font-bold" style={{ color: "#3D3D3D" }}>
          {(r.avgRating ?? 0).toFixed(1)}
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
          <Package className="h-3.5 w-3.5" style={{ color: "#F57C20" }} strokeWidth={2} />
          <span className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
            {(r.totalOrders ?? 0).toLocaleString("fr-FR")}
          </span>
          <span className="text-[10px]" style={{ color: "#6B7280" }}>{t("restaurants.orders")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: "#2c694e" }} strokeWidth={2} />
          <span className="text-xs font-semibold" style={{ color: "#3D3D3D" }}>
            {formatFcfaCompact(r.totalRevenue)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onView(r)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-colors"
          style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}
          title="Voir"
        >
          <Eye className="h-3.5 w-3.5" />
          Voir
        </button>
        <button
          onClick={() => onEdit(r)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-colors"
          style={{ backgroundColor: "#fdf3ee", color: "#F57C20" }}
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </button>
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

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ backgroundColor: "#F57C20" }}
    >
      {message}
    </div>
  );
}

// ── View Dialog ───────────────────────────────────────────────────────────────

function ViewDialog({
  r,
  onClose,
  onToggleOpen,
  onSendMessage,
}: {
  r: Restaurant;
  onClose: () => void;
  onToggleOpen: (r: Restaurant) => void;
  onSendMessage: (r: Restaurant) => void;
}) {
  const specs = parseSpecialties(r.specialty);
  const name = displayName(r);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full max-w-md p-6 space-y-4 relative"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 40px rgba(160,60,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 transition-colors"
          style={{ color: "#6B7280" }}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{ backgroundColor: avatarColor(r.id) }}
          >
            {initials(name)}
          </div>
          <div>
            <p
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              {name}
            </p>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {r.neighborhood ? `${r.neighborhood}, ` : ""}{r.city ?? "\u2014"}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {specs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#6B7280" }}>
                Sp\u00e9cialit\u00e9s
              </p>
              <div className="flex flex-wrap gap-1">
                {specs.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: "#f0fdf4", color: "#2c694e" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Note moyenne" value={`${(r.avgRating ?? 0).toFixed(1)} / 5`} />
            <InfoRow label="Commandes" value={(r.totalOrders ?? 0).toLocaleString("fr-FR")} />
            <InfoRow label="Chiffre d\u2019affaires" value={formatFcfaCompact(r.totalRevenue)} />
            <InfoRow label="T\u00e9l\u00e9phone" value={r.phone || "\u2014"} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: r.isActive ? "#16a34a" : "#e5e7eb" }}
            />
            <span className="text-sm font-semibold" style={{ color: r.isActive ? "#16a34a" : "#6B7280" }}>
              {r.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "#f5f3ef" }}>
          <button
            onClick={() => onToggleOpen(r)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: r.isActive ? "#fef2f2" : "#f0fdf4",
              color: r.isActive ? "#dc2626" : "#16a34a",
            }}
          >
            <Power className="h-3.5 w-3.5" />
            {r.isActive ? "Fermer" : "Ouvrir"}
          </button>
          <button
            onClick={() => onSendMessage(r)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
            style={{ backgroundColor: "#fdf3ee", color: "#F57C20" }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "#3D3D3D" }}>{value}</p>
    </div>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

function EditDialog({
  r,
  onClose,
  onSave,
  onToggleActive,
}: {
  r: Restaurant;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Restaurant>) => void;
  onToggleActive: (id: string, currentlyActive: boolean) => void;
}) {
  const [editName, setEditName] = useState(r.name || "");
  const [editSpecialty, setEditSpecialty] = useState(
    (() => {
      const specs = parseSpecialties(r.specialty);
      return specs.join(", ");
    })()
  );

  const handleSave = () => {
    const patch: Partial<Restaurant> = {};
    if (editName !== (r.name || "")) patch.name = editName;
    if (editSpecialty !== parseSpecialties(r.specialty).join(", ")) patch.specialty = editSpecialty;
    onSave(r.id, patch);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full max-w-md p-6 space-y-5 relative"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 40px rgba(160,60,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 transition-colors"
          style={{ color: "#6B7280" }}
        >
          <X className="h-5 w-5" />
        </button>

        <p
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
        >
          Modifier le restaurant
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "#6B7280" }}>
              Nom
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "#6B7280" }}>
              Sp\u00e9cialit\u00e9s (s\u00e9par\u00e9es par des virgules)
            </label>
            <input
              type="text"
              value={editSpecialty}
              onChange={(e) => setEditSpecialty(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "#6B7280" }}>
              Statut
            </label>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: r.isActive ? "#16a34a" : "#e5e7eb" }}
              />
              <span className="text-sm font-semibold" style={{ color: r.isActive ? "#16a34a" : "#6B7280" }}>
                {r.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            Sauvegarder
          </button>
          <button
            onClick={() => onToggleActive(r.id, r.isActive)}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: r.isActive ? "#fef2f2" : "#f0fdf4",
              color: r.isActive ? "#dc2626" : "#16a34a",
            }}
          >
            <Ban className="h-3.5 w-3.5" />
            {r.isActive ? "Suspendre" : "R\u00e9activer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RestaurantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"cards" | "table">("cards");

  // Dialog state
  const [viewRestaurant, setViewRestaurant] = useState<Restaurant | null>(null);
  const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);

  // Local overrides for edited restaurants
  const [localOverrides, setLocalOverrides] = useState<Map<string, Partial<Restaurant>>>(new Map());
  const [verifiedSet, setVerifiedSet] = useState<Set<string>>(new Set());
  const [extraRestaurants, setExtraRestaurants] = useState<Restaurant[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);
  const toastCb = useCallback(() => setToast(null), []);

  // Merge a restaurant with its local overrides
  const mergeOverrides = useCallback(
    (r: Restaurant): Restaurant => {
      const overrides = localOverrides.get(r.id);
      if (!overrides) return r;
      return { ...r, ...overrides };
    },
    [localOverrides],
  );

  const handleSave = useCallback(
    (id: string, patch: Partial<Restaurant>) => {
      setLocalOverrides((prev) => {
        const next = new Map(prev);
        next.set(id, { ...(prev.get(id) ?? {}), ...patch });
        return next;
      });
      setEditRestaurant(null);
      setToast("Profil mis \u00e0 jour \u2705");
    },
    [],
  );

  const handleToggleActive = useCallback(
    (id: string, currentlyActive: boolean) => {
      const newActive = !currentlyActive;
      setLocalOverrides((prev) => {
        const next = new Map(prev);
        next.set(id, { ...(prev.get(id) ?? {}), isActive: newActive });
        return next;
      });
      void patchRestaurant(id, { isActive: newActive });
      setEditRestaurant(null);
      setToast(newActive ? "Restaurant r\u00e9activ\u00e9" : "Restaurant suspendu");
    },
    [],
  );

  const handleValidate = useCallback((r: Restaurant) => {
    setVerifiedSet((prev) => {
      const next = new Set(prev);
      next.add(r.id);
      return next;
    });
    void patchRestaurant(r.id, { isVerified: true });
    setToast("Restaurant validé ✓");
  }, []);

  const handleSuspendQuick = useCallback((r: Restaurant) => {
    setLocalOverrides((prev) => {
      const next = new Map(prev);
      next.set(r.id, { ...(prev.get(r.id) ?? {}), isActive: false });
      return next;
    });
    void patchRestaurant(r.id, { isActive: false });
    setToast("Restaurant suspendu");
  }, []);

  const handleToggleOpen = useCallback((r: Restaurant) => {
    const newOpen = !r.isActive;
    setLocalOverrides((prev) => {
      const next = new Map(prev);
      next.set(r.id, { ...(prev.get(r.id) ?? {}), isActive: newOpen });
      return next;
    });
    void setRestaurantOpen(r.id, newOpen);
    sonnerToast.success(newOpen ? "Restaurant ouvert" : "Restaurant fermé");
  }, []);

  const handleSendMessage = useCallback((r: Restaurant) => {
    const body = typeof window !== "undefined" ? window.prompt(`Message à ${r.name || "ce restaurant"}`) : null;
    if (!body) return;
    void sendMessage({ to: r.id, toType: "restaurant", channel: "push", body });
    sonnerToast.success("Message envoyé");
  }, []);

  // Live restaurant stats via socket (best effort)
  useAdminSocketEvent<{ restaurantId: string; patch: Partial<Restaurant> }>(
    "restaurant:update",
    (evt) => {
      if (!evt?.restaurantId) return;
      setLocalOverrides((prev) => {
        const next = new Map(prev);
        next.set(evt.restaurantId, { ...(prev.get(evt.restaurantId) ?? {}), ...(evt.patch ?? {}) });
        return next;
      });
    },
  );

  const handleToggleVerified = useCallback((r: Restaurant) => {
    setVerifiedSet((prev) => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id); else next.add(r.id);
      void patchRestaurant(r.id, { isVerified: next.has(r.id) });
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
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
      ? (data.data.reduce((acc, r) => acc + (r.avgRating ?? 0), 0) / data.data.length).toFixed(1)
      : "—";
  const totalRevenue = data?.data.reduce((acc, r) => acc + (r.totalRevenue ?? 0), 0) ?? 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[1.8rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("restaurants.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            {t("restaurants.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ border: "1.5px solid #F57C20", color: "#F57C20", backgroundColor: "transparent" }}
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un utilisateur
          </button>
          <button
            onClick={() => setShowAddRestaurant(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <Plus className="h-4 w-4" />
            Ajouter un restaurant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ChefHat className="h-5 w-5" style={{ color: "#F57C20" }} />}
          label={t("restaurants.total")}
          value={data?.total ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#16a34a" }} />}
          label={t("restaurants.active")}
          value={totalActive}
          sub={t("restaurants.thisLoad")}
          loading={loading}
        />
        <StatCard
          icon={<Star className="h-5 w-5" style={{ color: "#b45309" }} />}
          label={t("restaurants.avgRating")}
          value={`${avgRating} / 5`}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" style={{ color: "#2c694e" }} />}
          label={t("restaurants.revenue")}
          value={formatFcfaCompact(totalRevenue)}
          loading={loading}
        />
      </div>

      {/* View switcher */}
      <div
        className="inline-flex items-center gap-1 rounded-full p-1 self-start"
        style={{ backgroundColor: "#f5f3ef" }}
      >
        <button
          onClick={() => setView("cards")}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            view === "cards"
              ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
              : { color: "#6B7280" }
          }
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Cartes
        </button>
        <button
          onClick={() => setView("table")}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            view === "table"
              ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
              : { color: "#6B7280" }
          }
        >
          <TableIcon className="h-3.5 w-3.5" />
          Tableau
        </button>
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
          <Search className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("restaurants.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#3D3D3D" }}
          />
        </div>

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        >
          <option value="">{t("restaurants.allQuarters")}</option>
          <option value="Douala">Douala</option>
          <option value="Yaoundé">Yaoundé</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        >
          <option value="">{t("restaurants.allStatus")}</option>
          <option value="active">{t("restaurants.activeFilter")}</option>
          <option value="inactive">{t("restaurants.inactiveFilter")}</option>
        </select>

        {/* Reset */}
        <button
          onClick={() => { setSearch(""); setCityFilter(""); setStatusFilter(""); setPage(1); }}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("common.reset")}
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
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {t("restaurants.noRestaurant")}
          </p>
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...extraRestaurants, ...(data?.data ?? [])].map((r) => {
                const merged = mergeOverrides(r);
                return (
                  <RestaurantCard
                    key={r.id}
                    r={merged}
                    onView={setViewRestaurant}
                    onEdit={setEditRestaurant}
                  />
                );
              })}
            </div>
          ) : (
            <RestaurantsTable
              rows={[...extraRestaurants, ...(data?.data ?? [])].map(mergeOverrides)}
              verifiedSet={verifiedSet}
              onView={setViewRestaurant}
              onEdit={setEditRestaurant}
              onValidate={handleValidate}
              onSuspend={handleSuspendQuick}
              onToggleVerified={handleToggleVerified}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {t("common.page")} {page} {t("common.of")} {totalPages} &bull;{" "}
                <span className="font-medium" style={{ color: "#3D3D3D" }}>
                  {data?.total.toLocaleString("fr-FR")} restaurants
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("common.previous")}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-40 text-white"
                  style={{
                    background: page >= totalPages
                      ? "#e8e4de"
                      : "linear-gradient(135deg, #F57C20, #E06A10)",
                    color: page >= totalPages ? "#6B7280" : "#fff",
                  }}
                >
                  {t("common.next")}
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
        {t("footer")}
      </p>

      {/* View Dialog */}
      {viewRestaurant && (
        <ViewDialog
          r={mergeOverrides(viewRestaurant)}
          onClose={() => setViewRestaurant(null)}
          onToggleOpen={handleToggleOpen}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* Edit Dialog */}
      {editRestaurant && (
        <EditDialog
          r={editRestaurant}
          onClose={() => setEditRestaurant(null)}
          onSave={handleSave}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={toastCb} />}

      <CreateUserDialog
        open={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onCreated={(u) => setToast(`Utilisateur ${u.name} créé ✓`)}
      />

      <AddRestaurantWizard
        open={showAddRestaurant}
        onClose={() => setShowAddRestaurant(false)}
        onCreated={(r) => {
          setToast(`Restaurant ${r.displayName} ajouté ✓`);
          fetchRestaurants();
        }}
      />
    </div>
  );
}
