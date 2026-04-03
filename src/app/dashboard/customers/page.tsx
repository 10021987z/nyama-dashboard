"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Customer, CustomersResponse } from "@/lib/types";
import { formatFcfa, formatDate, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Users, Zap, UserPlus, ShieldCheck, Search, RotateCcw,
  ChevronLeft, ChevronRight, Eye, Pencil, Download,
} from "lucide-react";

const LIMIT = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function quarterDisplay(quarter: Customer["quarter"]): string {
  if (!quarter) return "—";
  if (typeof quarter === "string") return quarter;
  return `${quarter.name}, ${quarter.city}`;
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  badge,
  badgeColor,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
  sub?: React.ReactNode;
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
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
          {badge && !loading && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: badgeColor ?? "#dcfce7", color: badgeColor === "#fee2e2" ? "#991b1b" : "#166534" }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7c7570" }}>
          {label}
        </p>
        {sub && <div className="mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quarterFilter, setQuarterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { role: "CLIENT", page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (quarterFilter) params.quarter = quarterFilter;
      if (statusFilter) params.status = statusFilter;
      const result = await apiClient.get<CustomersResponse>("/admin/users", params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, quarterFilter, statusFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = data?.totalPages ?? (data ? Math.ceil(data.total / LIMIT) : 1);
  const stats = data?.stats;

  // Collect unique quarters for filter dropdown
  const quarters = data?.data
    ? [...new Set(data.data.map((c) => (typeof c.quarter === "object" && c.quarter ? c.quarter.name : typeof c.quarter === "string" ? c.quarter : "")).filter(Boolean))]
    : [];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Gestion des Clients
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
            {stats ? `${stats.totalClients.toLocaleString("fr-FR")} clients enregistrés dans l'écosystème Savor Cameroon` : "Chargement..."}
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ border: "1.5px solid #a03c00", color: "#a03c00", backgroundColor: "transparent" }}
        >
          <Download className="h-4 w-4" />
          Exporter la liste
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" style={{ color: "#a03c00" }} />}
          label="Total Clients"
          value={stats?.totalClients.toLocaleString("fr-FR") ?? "—"}
          badge="+8%"
          badgeColor="#dcfce7"
          loading={loading}
        />
        <StatCard
          icon={<Zap className="h-5 w-5" style={{ color: "#b45309" }} />}
          label="Clients Actifs (30j)"
          value={stats?.activeClients30d.toLocaleString("fr-FR") ?? "—"}
          loading={loading}
          sub={
            stats ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f5f3ef" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, stats.totalClients > 0 ? (stats.activeClients30d / stats.totalClients) * 100 : 0)}%`,
                      backgroundColor: "#b45309",
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold" style={{ color: "#b45309" }}>
                  {stats.totalClients > 0 ? Math.round((stats.activeClients30d / stats.totalClients) * 100) : 0}%
                </span>
              </div>
            ) : undefined
          }
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5" style={{ color: "#2c694e" }} />}
          label="Nouveaux ce Mois"
          value={stats?.newClientsThisMonth.toLocaleString("fr-FR") ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" style={{ color: "#2563eb" }} />}
          label="Taux de Rétention"
          value={stats ? `${stats.retentionRate}%` : "—"}
          badge={stats ? (stats.retentionRate > 70 ? "Performant" : "À améliorer") : undefined}
          badgeColor={stats && stats.retentionRate > 70 ? "#dcfce7" : "#ffedd5"}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-end gap-3"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div
          className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "#7c7570" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom ou téléphone..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#1b1c1a" }}
          />
        </div>

        <select
          value={quarterFilter}
          onChange={(e) => { setQuarterFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
        >
          <option value="">Tous les Quartiers</option>
          {quarters.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
        >
          <option value="">Statut: Tous</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>

        <button
          onClick={() => { setSearch(""); setQuarterFilter(""); setStatusFilter(""); setPage(1); }}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: "#f5f3ef", color: "#7c7570" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCustomers} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#fbf9f5" }}>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Client</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#7c7570" }}>Quartier</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#7c7570" }}>Inscrit le</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Commandes</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Total dépensé</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#7c7570" }}>Dernière commande</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Statut</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "#e8e4de" }} />
                        <p className="text-sm" style={{ color: "#7c7570" }}>Aucun client trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    data?.data.map((c) => {
                      const color = avatarColor(c.id);
                      return (
                        <tr key={c.id} className="hover:bg-[#fbf9f5] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {initials(c.name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium" style={{ color: "#1b1c1a" }}>{c.name}</p>
                                <p className="text-xs" style={{ color: "#7c7570" }}>{c.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs" style={{ color: "#7c7570" }}>{quarterDisplay(c.quarter)}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs" style={{ color: "#7c7570" }}>{formatDate(c.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>{c.totalOrders}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold" style={{ color: "#a03c00" }}>{formatFcfa(c.totalSpentXaf)}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs" style={{ color: "#7c7570" }}>
                              {c.lastOrderAt ? formatRelative(c.lastOrderAt) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                              style={
                                c.status === "ACTIF"
                                  ? { backgroundColor: "#dcfce7", color: "#166534" }
                                  : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                              }
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#f5f3ef]"
                                title="Voir"
                              >
                                <Eye className="h-3.5 w-3.5" style={{ color: "#7c7570" }} />
                              </button>
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#f5f3ef]"
                                title="Éditer"
                              >
                                <Pencil className="h-3.5 w-3.5" style={{ color: "#7c7570" }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
                  Page {page} / {totalPages} &bull;{" "}
                  <span className="font-medium" style={{ color: "#1b1c1a" }}>
                    {data?.total.toLocaleString("fr-FR")} clients
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-all"
                        style={
                          page === pageNum
                            ? { background: "linear-gradient(135deg, #a03c00, #c94d00)", color: "#fff" }
                            : { color: "#7c7570" }
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ backgroundColor: "#f5f3ef", color: "#1b1c1a" }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <p
        className="text-center text-xs italic pt-4"
        style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "rgba(160,60,0,0.5)" }}
      >
        Le goût de l&apos;héritage &bull; Douala &bull; Yaoundé &bull; Bafoussam
      </p>
    </div>
  );
}
