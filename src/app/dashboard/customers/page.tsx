"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Customer, CustomersResponse } from "@/lib/types";
import { formatFcfa, formatDate, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import { CustomerSegments, computeSegments, type SegmentKey } from "@/components/dashboard/customer-segments";
import { sendCampaign, patchUser } from "@/lib/admin-mutations";
import { toast as sonnerToast } from "sonner";
import {
  Users, Zap, UserPlus, ShieldCheck, Search, RotateCcw,
  ChevronLeft, ChevronRight, Eye, Pencil, Download, X, Send,
} from "lucide-react";

const LIMIT = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function quarterDisplay(quarter: Customer["quarter"]): string {
  if (!quarter) return "—";
  if (typeof quarter === "string") return quarter;
  return `${quarter.name}, ${quarter.city}`;
}

function quarterDisplayCsv(quarter: Customer["quarter"]): string {
  if (!quarter) return "";
  if (typeof quarter === "string") return quarter;
  return `${quarter.name} ${quarter.city}`;
}

function downloadCsv(customers: Customer[]) {
  const header = "Nom,Téléphone,Quartier,Commandes,Total Dépensé (FCFA),Statut\n";
  const rows = customers.map(c => {
    const q = quarterDisplayCsv(c.quarter);
    return `"${c.name}","${c.phone}","${q}",${c.totalOrders},${c.totalSpentXaf},"${c.status}"`;
  }).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nyama-clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
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
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
          {label}
        </p>
        {sub && <div className="mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
      style={{ backgroundColor: "#3D3D3D" }}
    >
      {message}
    </div>
  );
}

// ── View Client Dialog ──────────────────────────────────────────────────────

function ViewClientDialog({ client, onClose }: { client: Customer; onClose: () => void }) {
  const color = avatarColor(client.id);

  const rows: { label: string; value: string }[] = [
    { label: "Nom", value: client.name },
    { label: "Téléphone", value: client.phone },
    { label: "Quartier", value: quarterDisplay(client.quarter) },
    { label: "Inscrit le", value: formatDate(client.createdAt) },
    { label: "Commandes", value: String(client.totalOrders) },
    { label: "Total dépensé", value: formatFcfa(client.totalSpentXaf) },
    { label: "Dernière commande", value: client.lastOrderAt ? formatRelative(client.lastOrderAt) : "—" },
    { label: "Statut", value: client.status },
  ];

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef] transition-colors"
        >
          <X className="h-4 w-4" style={{ color: "#6B7280" }} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initials(client.name)}
          </div>
          <div>
            <h2
              className="text-xl font-semibold italic"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              {client.name}
            </h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>Fiche client</p>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #f5f3ef" }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{r.label}</span>
              <span className="text-sm font-medium" style={{ color: "#3D3D3D" }}>{r.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// ── Edit Client Dialog ──────────────────────────────────────────────────────

function EditClientDialog({
  client,
  onClose,
  onSave,
  onToggleStatus,
}: {
  client: Customer;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Customer>) => void;
  onToggleStatus: (id: string, newStatus: Customer["status"]) => void;
}) {
  const [name, setName] = useState(client.name);
  const [quarter, setQuarter] = useState(
    typeof client.quarter === "object" && client.quarter
      ? `${client.quarter.name}, ${client.quarter.city}`
      : typeof client.quarter === "string"
        ? client.quarter
        : ""
  );
  const color = avatarColor(client.id);

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef] transition-colors"
        >
          <X className="h-4 w-4" style={{ color: "#6B7280" }} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initials(client.name)}
          </div>
          <div>
            <h2
              className="text-xl font-semibold italic"
              style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
            >
              Modifier le client
            </h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>{client.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D", border: "1.5px solid transparent" }}
              onFocus={(e) => (e.target.style.borderColor = "#F57C20")}
              onBlur={(e) => (e.target.style.borderColor = "transparent")}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
              Quartier
            </label>
            <input
              type="text"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D", border: "1.5px solid transparent" }}
              onFocus={(e) => (e.target.style.borderColor = "#F57C20")}
              onBlur={(e) => (e.target.style.borderColor = "transparent")}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onSave(client.id, { name, quarter: quarter || undefined });
              onClose();
            }}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            Sauvegarder
          </button>
          <button
            onClick={() => {
              const newStatus = client.status === "ACTIF" ? "INACTIF" : "ACTIF";
              onToggleStatus(client.id, newStatus);
              onClose();
            }}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
            style={
              client.status === "ACTIF"
                ? { backgroundColor: "#fee2e2", color: "#991b1b" }
                : { backgroundColor: "#dcfce7", color: "#166534" }
            }
          >
            {client.status === "ACTIF" ? "Suspendre" : "Réactiver"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Modal ───────────────────────────────────────────────────────────

const SEGMENT_LABEL: Record<SegmentKey, string> = {
  vip: "Clients VIP",
  atRisk: "Clients à risque",
  newcomers: "Nouveaux clients",
  lost: "Clients perdus",
};

const SEGMENT_API: Record<SegmentKey, "vip" | "atRisk" | "lost" | "all"> = {
  vip: "vip",
  atRisk: "atRisk",
  newcomers: "all",
  lost: "lost",
};

function CampaignModal({
  segment,
  onClose,
  onSent,
}: {
  segment: SegmentKey;
  onClose: () => void;
  onSent: () => void;
}) {
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await sendCampaign({
        segment: SEGMENT_API[segment],
        channel,
        subject: subject || undefined,
        body,
      });
      onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f5f3ef] transition-colors"
        >
          <X className="h-4 w-4" style={{ color: "#6B7280" }} />
        </button>

        <div>
          <h2
            className="text-xl font-semibold italic"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            Campagne — {SEGMENT_LABEL[segment]}
          </h2>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Envoi ciblé aux clients de ce segment
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
            Canal
          </label>
          <div className="flex gap-2">
            {(["email", "sms"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
                style={
                  channel === c
                    ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                    : { backgroundColor: "#f5f3ef", color: "#6B7280" }
                }
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {channel === "email" && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
              Objet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Offre spéciale NYAMA"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7280" }}>
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Votre message..."
            rows={5}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
            style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quarterFilter, setQuarterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature states
  const [viewClient, setViewClient] = useState<Customer | null>(null);
  const [editClient, setEditClient] = useState<Customer | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<Customer>>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [campaignSegment, setCampaignSegment] = useState<SegmentKey | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
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
    ? [...new Set((data.data ?? []).map((c) => (typeof c.quarter === "object" && c.quarter ? c.quarter.name : typeof c.quarter === "string" ? c.quarter : "")).filter(Boolean))]
    : [];

  // Merge local overrides into customer data for rendering
  const getCustomer = (c: Customer): Customer => {
    const overrides = localOverrides[c.id];
    return overrides ? { ...c, ...overrides } : c;
  };

  const handleSave = (id: string, updates: Partial<Customer>) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
    setToast("Client mis à jour ✅");
  };

  const handleToggleStatus = (id: string, newStatus: Customer["status"]) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: newStatus },
    }));
    void patchUser(id, { status: newStatus === "ACTIF" ? "ACTIVE" : "SUSPENDED" });
    setToast(newStatus === "ACTIF" ? "Client réactivé ✅" : "Client suspendu ✅");
  };

  const handleOpenCampaign = useCallback((segment: SegmentKey) => {
    setCampaignSegment(segment);
  }, []);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            {t("customers.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            {stats ? `${stats.totalClients.toLocaleString("fr-FR")} ${t("customers.subtitle")}` : "Chargement..."}
          </p>
        </div>
        <button
          onClick={() => {
            if (data?.data) downloadCsv(data.data.map(getCustomer));
          }}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ border: "1.5px solid #F57C20", color: "#F57C20", backgroundColor: "transparent" }}
        >
          <Download className="h-4 w-4" />
          {t("customers.exportList")}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" style={{ color: "#F57C20" }} />}
          label={t("customers.totalClients")}
          value={stats?.totalClients.toLocaleString("fr-FR") ?? "—"}
          badge="+8%"
          badgeColor="#dcfce7"
          loading={loading}
        />
        <StatCard
          icon={<Zap className="h-5 w-5" style={{ color: "#b45309" }} />}
          label={t("customers.activeClients")}
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
          label={t("customers.newThisMonth")}
          value={stats?.newClientsThisMonth.toLocaleString("fr-FR") ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" style={{ color: "#2563eb" }} />}
          label={t("customers.retention")}
          value={stats ? `${stats.retentionRate}%` : "—"}
          badge={stats ? (stats.retentionRate > 70 ? t("customers.performing") : t("customers.toImprove")) : undefined}
          badgeColor={stats && stats.retentionRate > 70 ? "#dcfce7" : "#ffedd5"}
          loading={loading}
        />
      </div>

      {/* Segments automatiques */}
      {!loading && data?.data && data.data.length > 0 && (
        <CustomerSegments
          counts={computeSegments(data.data.map(getCustomer))}
          total={data.data.length}
          onCampaign={handleOpenCampaign}
        />
      )}

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-end gap-3"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div
          className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("customers.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#3D3D3D" }}
          />
        </div>

        <select
          value={quarterFilter}
          onChange={(e) => { setQuarterFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        >
          <option value="">{t("customers.allQuarters")}</option>
          {quarters.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-full px-4 py-2 text-sm outline-none cursor-pointer"
          style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
        >
          <option value="">{t("customers.allStatus")}</option>
          <option value="ACTIF">{t("customers.activeFilter")}</option>
          <option value="INACTIF">{t("customers.inactiveFilter")}</option>
        </select>

        <button
          onClick={() => { setSearch(""); setQuarterFilter(""); setStatusFilter(""); setPage(1); }}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("common.reset")}
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
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{t("customers.name")}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#6B7280" }}>{t("customers.quarter")}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#6B7280" }}>{t("customers.registeredAt")}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{t("customers.totalOrders")}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{t("customers.totalSpent")}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#6B7280" }}>{t("customers.lastOrder")}</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Statut</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{t("customers.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "#e8e4de" }} />
                        <p className="text-sm" style={{ color: "#6B7280" }}>{t("customers.noClient")}</p>
                      </td>
                    </tr>
                  ) : (
                    data?.data.map((raw) => {
                      const c = getCustomer(raw);
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
                                <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>{c.name}</p>
                                <p className="text-xs" style={{ color: "#6B7280" }}>{c.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs" style={{ color: "#6B7280" }}>{quarterDisplay(c.quarter)}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs" style={{ color: "#6B7280" }}>{formatDate(c.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold" style={{ color: "#3D3D3D" }}>{c.totalOrders}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold" style={{ color: "#F57C20" }}>{formatFcfa(c.totalSpentXaf)}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs" style={{ color: "#6B7280" }}>
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
                                onClick={() => setViewClient(c)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#f5f3ef]"
                                title="Voir"
                              >
                                <Eye className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                              </button>
                              <button
                                onClick={() => setEditClient(c)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#f5f3ef]"
                                title="Éditer"
                              >
                                <Pencil className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
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
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  {t("common.page")} {page} / {totalPages} &bull;{" "}
                  <span className="font-medium" style={{ color: "#3D3D3D" }}>
                    {data?.total.toLocaleString("fr-FR")} clients
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
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
                            ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                            : { color: "#6B7280" }
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
                    style={{ backgroundColor: "#f5f3ef", color: "#3D3D3D" }}
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
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>

      {/* View Client Dialog */}
      {viewClient && (
        <ViewClientDialog client={viewClient} onClose={() => setViewClient(null)} />
      )}

      {/* Edit Client Dialog */}
      {editClient && (
        <EditClientDialog
          client={editClient}
          onClose={() => setEditClient(null)}
          onSave={handleSave}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Campaign Modal */}
      {campaignSegment && (
        <CampaignModal
          segment={campaignSegment}
          onClose={() => setCampaignSegment(null)}
          onSent={() => {
            setCampaignSegment(null);
            sonnerToast.success("Campagne envoyée");
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
