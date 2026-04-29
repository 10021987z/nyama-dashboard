"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type {
  Dispute,
  DisputeStats,
  DisputeListResponse,
  DisputeStatusType,
  DisputeSeverity,
  DisputeType as DType,
} from "@/lib/types";
import { formatFcfa, formatRelative, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/hooks/use-language";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Send,
  MessageCircle,
  X,
  Scale,
  AlertOctagon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrisisPanel } from "@/components/disputes/crisis-panel";

// ── Helpers ──────────────────────────────────────────────────────────

function severityStyle(s: string): { bg: string; color: string } {
  switch (s) {
    case "CRITICAL":
      return { bg: "#fecaca", color: "#991b1b" };
    case "HIGH":
      return { bg: "#fee2e2", color: "#b91c1c" };
    case "MEDIUM":
      return { bg: "#ffedd5", color: "#9a3412" };
    case "LOW":
    default:
      return { bg: "#dcfce7", color: "#166534" };
  }
}

function statusStyle(s: string): { bg: string; color: string } {
  switch (s) {
    case "OPEN":
      return { bg: "#fee2e2", color: "#991b1b" };
    case "UNDER_REVIEW":
      return { bg: "#dbeafe", color: "#1e40af" };
    case "WAITING_RESPONSE":
      return { bg: "#ffedd5", color: "#9a3412" };
    case "RESOLVED":
      return { bg: "#dcfce7", color: "#166534" };
    case "CLOSED":
      return { bg: "#f3f4f6", color: "#4b5563" };
    case "ESCALATED":
      return { bg: "#fecaca", color: "#991b1b" };
    default:
      return { bg: "#f3f4f6", color: "#6B7280" };
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

// ── DisputeRow ───────────────────────────────────────────────────────

function DisputeRow({
  dispute,
  selected,
  onClick,
  t,
}: {
  dispute: Dispute;
  selected: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const sev = severityStyle(dispute.severity);
  const stat = statusStyle(dispute.status);

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
        <span
          className="font-mono text-xs font-bold"
          style={{ color: "#F57C20" }}
        >
          #{dispute.id.slice(-6).toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
          {dispute.client?.name ?? "—"}
        </p>
        <p className="text-[10px]" style={{ color: "#6B7280" }}>
          {dispute.client?.phone}
        </p>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs" style={{ color: "#3D3D3D" }}>
          {t(`disputes.${dispute.type}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{ backgroundColor: sev.bg, color: sev.color }}
        >
          {t(`disputes.${dispute.severity}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{ backgroundColor: stat.bg, color: stat.color }}
        >
          {t(`disputes.${dispute.status}`)}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs" style={{ color: "#6B7280" }}>
          {dispute._count?.messages ?? 0}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
      </td>
    </tr>
  );
}

// ── DisputeDetail ────────────────────────────────────────────────────

function DisputeDetail({
  dispute,
  t,
  onResolve,
  onSendMessage,
}: {
  dispute: Dispute | null;
  t: (key: string) => string;
  onResolve: (d: Dispute) => void;
  onSendMessage: (disputeId: string, message: string) => void;
}) {
  const [newMsg, setNewMsg] = useState("");

  if (!dispute) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 24px rgba(160,60,0,0.05)",
        }}
      >
        <MessageCircle className="h-10 w-10 mb-3" style={{ color: "#e8e4de" }} />
        <p className="text-sm" style={{ color: "#6B7280" }}>
          {t("disputes.selectDispute")}
        </p>
      </div>
    );
  }

  const stat = statusStyle(dispute.status);
  const sev = severityStyle(dispute.severity);

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
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{ backgroundColor: stat.bg, color: stat.color }}
          >
            {t(`disputes.${dispute.status}`)}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{ backgroundColor: sev.bg, color: sev.color }}
          >
            {t(`disputes.${dispute.severity}`)}
          </span>
          <span className="text-xs font-mono" style={{ color: "#6B7280" }}>
            #{dispute.id.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 space-y-3" style={{ borderBottom: "1px solid #f5f3ef" }}>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: "#6B7280" }}
          >
            {t("disputes.type")}
          </p>
          <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
            {t(`disputes.${dispute.type}`)}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: "#6B7280" }}
          >
            {t("disputes.client")}
          </p>
          <p className="text-sm" style={{ color: "#3D3D3D" }}>
            {dispute.client?.name} — {dispute.client?.phone}
          </p>
        </div>
        {dispute.order && (
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ backgroundColor: "#fbf9f5" }}
          >
            <div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {t("disputes.order")} #{dispute.orderId.slice(-6).toUpperCase()}
              </p>
              <p className="text-sm font-bold" style={{ color: "#3D3D3D" }}>
                {formatFcfa(dispute.order.totalXaf)}
              </p>
            </div>
            {dispute.order.cook && (
              <div className="text-right">
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Cuisinière
                </p>
                <p className="text-sm font-semibold" style={{ color: "#3D3D3D" }}>
                  {dispute.order.cook.name}
                </p>
              </div>
            )}
          </div>
        )}
        <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
          {dispute.description}
        </p>
        {dispute.resolution && (
          <div className="rounded-xl p-3" style={{ backgroundColor: "#dcfce7" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#166534" }}>
              {t("disputes.resolution")}
            </p>
            <p className="text-sm" style={{ color: "#166534" }}>{dispute.resolution}</p>
            {dispute.refundAmountXaf != null && dispute.refundAmountXaf > 0 && (
              <p className="text-sm font-bold mt-1" style={{ color: "#166534" }}>
                {t("disputes.refund")}: {formatFcfa(dispute.refundAmountXaf)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "#6B7280" }}
        >
          {t("disputes.messages")} ({dispute.messages?.length ?? 0})
        </p>
        {dispute.messages && dispute.messages.length > 0 ? (
          dispute.messages.map((msg) => {
            const isAdmin = msg.authorRole === "ADMIN";
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[10px] font-bold uppercase"
                      style={{ color: isAdmin ? "#F57C20" : "#6B7280" }}
                    >
                      {msg.authorRole}
                    </span>
                  </div>
                  <div
                    className="rounded-2xl px-4 py-2.5 text-sm"
                    style={
                      isAdmin
                        ? {
                            background:
                              "linear-gradient(135deg, #F57C20, #E06A10)",
                            color: "#ffffff",
                          }
                        : { backgroundColor: "#f5f3ef", color: "#3D3D3D" }
                    }
                  >
                    {msg.message}
                  </div>
                  <p
                    className={`text-[10px] mt-1 ${isAdmin ? "text-right" : "text-left"}`}
                    style={{ color: "#b8b3ad" }}
                  >
                    {formatRelative(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center py-4">
            <Send className="h-5 w-5 mb-1" style={{ color: "#e8e4de" }} />
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {t("disputes.noMessage")}
            </p>
          </div>
        )}
      </div>

      {/* Message input + actions */}
      {dispute.status !== "RESOLVED" && dispute.status !== "CLOSED" && (
        <>
          <div className="px-4 pb-2 flex gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder={t("disputes.addMessage")}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid #e8e4de", color: "#3D3D3D" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newMsg.trim()) {
                  onSendMessage(dispute.id, newMsg.trim());
                  setNewMsg("");
                }
              }}
            />
            <button
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #F57C20, #E06A10)",
              }}
              onClick={() => {
                if (newMsg.trim()) {
                  onSendMessage(dispute.id, newMsg.trim());
                  setNewMsg("");
                }
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div
            className="p-4 flex flex-wrap gap-2"
            style={{ borderTop: "1px solid #f5f3ef" }}
          >
            <button
              className="flex-1 rounded-full py-2.5 text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #F57C20, #E06A10)",
              }}
              onClick={() => onResolve(dispute)}
            >
              {t("disputes.resolve")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

function DisputesContent() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
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
      if (filterStatus) params.status = filterStatus;
      if (filterSeverity) params.severity = filterSeverity;

      const [statsRes, listRes] = await Promise.all([
        apiClient.get<DisputeStats>("/admin/disputes/stats"),
        apiClient.get<DisputeListResponse>("/admin/disputes", params),
      ]);
      setStats(statsRes);
      setDisputes(listRes.items);
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
  }, [page, filterStatus, filterSeverity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectDispute = async (dispute: Dispute) => {
    try {
      const detail = await apiClient.get<Dispute>(
        `/admin/disputes/${dispute.id}`
      );
      setSelected(detail);
    } catch {
      setSelected(dispute);
    }
  };

  const handleSendMessage = async (disputeId: string, message: string) => {
    try {
      await apiClient.post(`/admin/disputes/${disputeId}/messages`, { message });
      showToast("Message envoyé");
      // Refresh detail
      const detail = await apiClient.get<Dispute>(
        `/admin/disputes/${disputeId}`
      );
      setSelected(detail);
    } catch {
      showToast("Erreur lors de l'envoi du message");
    }
  };

  const handleResolve = async (dispute: Dispute) => {
    const resolution = window.prompt("Résolution du litige :");
    if (!resolution) return;
    const refundStr = window.prompt("Montant du remboursement (XAF) — 0 si aucun :", "0");
    const refundAmountXaf = parseInt(refundStr ?? "0", 10) || 0;
    try {
      await apiClient.patch(`/admin/disputes/${dispute.id}`, {
        status: "RESOLVED",
        resolution,
        refundAmountXaf,
      });
      showToast("Litige résolu");
      fetchData();
      setSelected(null);
    } catch {
      showToast("Erreur lors de la résolution");
    }
  };

  const STATUSES: DisputeStatusType[] = [
    "OPEN",
    "UNDER_REVIEW",
    "WAITING_RESPONSE",
    "RESOLVED",
    "CLOSED",
    "ESCALATED",
  ];
  const SEVERITIES: DisputeSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

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
          {t("disputes.title")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          {t("disputes.subtitle")}
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <AlertTriangle className="h-5 w-5" style={{ color: "#ef4444" }} />
          }
          label={t("disputes.open")}
          value={stats?.open ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" style={{ color: "#b45309" }} />}
          label={t("disputes.avgResolution")}
          value={
            stats
              ? `${stats.avgResolutionHours} ${t("disputes.hours")}`
              : "—"
          }
          loading={loading}
        />
        <StatCard
          icon={
            <CheckCircle2 className="h-5 w-5" style={{ color: "#2c694e" }} />
          }
          label={t("disputes.resolved")}
          value={stats?.resolved ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5" style={{ color: "#F57C20" }} />}
          label={t("disputes.refunds")}
          value={stats ? formatFcfa(stats.refundsXaf) : "—"}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
          <option value="">{t("disputes.status")}: {t("disputes.filterAll")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`disputes.${s}`)}
            </option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => {
            setFilterSeverity(e.target.value);
            setPage(1);
          }}
          className="rounded-full px-4 py-2 text-xs font-bold outline-none appearance-none"
          style={{
            border: "1.5px solid #e8e4de",
            color: "#3D3D3D",
            backgroundColor: "#ffffff",
          }}
        >
          <option value="">{t("disputes.severity")}: {t("disputes.filterAll")}</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {t(`disputes.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Table + Detail */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Disputes list (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h2
            className="text-lg font-semibold italic"
            style={{
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              color: "#3D3D3D",
            }}
          >
            {t("disputes.allDisputes")} ({total})
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
            ) : disputes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#fbf9f5" }}>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#6B7280" }}
                      >
                        ID
                      </th>
                      <th
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#6B7280" }}
                      >
                        {t("disputes.client")}
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
                        {t("disputes.severity")}
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
                        Msgs
                      </th>
                      <th className="px-4 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((d) => (
                      <DisputeRow
                        key={d.id}
                        dispute={d}
                        selected={selected?.id === d.id}
                        onClick={() => handleSelectDispute(d)}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center">
                <AlertTriangle
                  className="h-8 w-8 mb-2"
                  style={{ color: "#e8e4de" }}
                />
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  {t("disputes.noDispute")}
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
            {t("disputes.detail")}
          </h2>
          <DisputeDetail
            dispute={selected}
            t={t}
            onResolve={handleResolve}
            onSendMessage={handleSendMessage}
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

// ── Page wrapper avec Tabs (fusion Litiges + Mode crise) ──────────────

export default function DisputesPage() {
  return (
    <Tabs defaultValue="disputes" className="space-y-4 pb-8">
      <div>
        <h1
          className="text-[2rem] font-semibold italic leading-tight"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Centre Litiges &amp; Crise
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Gestion des litiges clients · Activation du mode crise
        </p>
      </div>
      <TabsList>
        <TabsTrigger value="disputes" className="gap-2">
          <Scale className="h-4 w-4" /> Litiges
        </TabsTrigger>
        <TabsTrigger value="crisis" className="gap-2">
          <AlertOctagon className="h-4 w-4" /> Mode crise
        </TabsTrigger>
      </TabsList>
      <TabsContent value="disputes">
        <DisputesContent />
      </TabsContent>
      <TabsContent value="crisis">
        <CrisisPanel />
      </TabsContent>
    </Tabs>
  );
}
