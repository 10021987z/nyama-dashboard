"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { SupportOverview, SupportTicket, CriticalReview } from "@/lib/types";
import { formatFcfa, formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  AlertTriangle, Clock, ThumbsUp, Banknote, Plus, Star,
  MessageCircle, ChevronRight, Send,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = ["#a03c00", "#2c694e", "#8b4c11", "#c94d00", "#b45309", "#2563eb", "#7c3aed", "#db2777"];
function avatarColor(name?: string | null): string {
  if (!name) return AVATAR_COLORS[0];
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function severityConfig(s: string): { bg: string; color: string; label: string } {
  switch (s) {
    case "HAUT":
      return { bg: "#fee2e2", color: "#991b1b", label: "HAUT" };
    case "MOYEN":
      return { bg: "#ffedd5", color: "#9a3412", label: "MOYEN" };
    case "FAIBLE":
    default:
      return { bg: "#dcfce7", color: "#166534", label: "FAIBLE" };
  }
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  badge,
  badgeColor,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: { bg: string; text: string };
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
              style={{
                backgroundColor: badgeColor?.bg ?? "#dcfce7",
                color: badgeColor?.text ?? "#166534",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7c7570" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── TicketRow ────────────────────────────────────────────────────────────────

function TicketRow({
  ticket,
  selected,
  onClick,
}: {
  ticket: SupportTicket;
  selected: boolean;
  onClick: () => void;
}) {
  const sev = severityConfig(ticket.severity);
  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ backgroundColor: selected ? "#fdf3ee" : undefined }}
      onClick={onClick}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "#fbf9f5"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = ""; }}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-bold" style={{ color: "#a03c00" }}>
          #{(ticket.id ?? "").slice(-6).toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#1b1c1a" }}>{ticket.clientName}</p>
          <p className="text-[10px]" style={{ color: "#7c7570" }}>{ticket.clientCity}</p>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs" style={{ color: "#7c7570" }}>{ticket.restaurant}</span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs" style={{ color: "#1b1c1a" }}>{ticket.motif}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{ backgroundColor: sev.bg, color: sev.color }}
        >
          {sev.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="h-4 w-4" style={{ color: "#b8b3ad" }} />
      </td>
    </tr>
  );
}

// ── TicketDetail ─────────────────────────────────────────────────────────────

function TicketDetail({ ticket }: { ticket: SupportTicket | null }) {
  if (!ticket) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <MessageCircle className="h-10 w-10 mb-3" style={{ color: "#e8e4de" }} />
        <p className="text-sm" style={{ color: "#7c7570" }}>
          Sélectionnez un litige pour voir les détails
        </p>
      </div>
    );
  }

  const sev = severityConfig(ticket.severity);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f5f3ef" }}>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{ backgroundColor: sev.bg, color: sev.color }}
          >
            {sev.label}
          </span>
          <span className="text-xs font-mono" style={{ color: "#7c7570" }}>
            ID: {(ticket.id ?? "").slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Order info */}
      {ticket.orderId && (
        <div className="px-4 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c7570" }}>
            COMMANDE #{(ticket.orderId ?? "").slice(-6).toUpperCase()}
          </p>
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ backgroundColor: "#fbf9f5" }}
          >
            <div>
              <p className="text-xs" style={{ color: "#7c7570" }}>Total commande</p>
              <p className="text-sm font-bold" style={{ color: "#1b1c1a" }}>
                {ticket.totalXaf ? formatFcfa(ticket.totalXaf) : "—"}
              </p>
            </div>
            {ticket.paymentMethod && (
              <div className="text-right">
                <p className="text-xs" style={{ color: "#7c7570" }}>Paiement</p>
                <p className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>{ticket.paymentMethod}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
        {ticket.messages && ticket.messages.length > 0 ? (
          ticket.messages.map((msg, i) => {
            const isClient = msg.sender === "client";
            return (
              <div key={i} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[85%]">
                  <div
                    className="rounded-2xl px-4 py-2.5 text-sm"
                    style={
                      isClient
                        ? { backgroundColor: "#f5f3ef", color: "#1b1c1a" }
                        : { background: "linear-gradient(135deg, #a03c00, #c94d00)", color: "#ffffff" }
                    }
                  >
                    {msg.text}
                  </div>
                  <p
                    className={`text-[10px] mt-1 ${isClient ? "text-left" : "text-right"}`}
                    style={{ color: "#b8b3ad" }}
                  >
                    {formatRelative(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center py-8">
            <Send className="h-6 w-6 mb-2" style={{ color: "#e8e4de" }} />
            <p className="text-xs" style={{ color: "#7c7570" }}>Aucun message dans ce litige</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 flex flex-wrap gap-2" style={{ borderTop: "1px solid #f5f3ef" }}>
        <button
          className="flex-1 rounded-full py-2.5 text-xs font-bold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
        >
          Rembourser Client (Full)
        </button>
        <button
          className="rounded-full px-4 py-2.5 text-xs font-bold transition-colors"
          style={{ border: "1.5px solid #e8e4de", color: "#7c7570" }}
        >
          Restaurateur
        </button>
        <button
          className="rounded-full px-4 py-2.5 text-xs font-bold transition-colors"
          style={{ border: "1.5px solid #e8e4de", color: "#7c7570" }}
        >
          Fermer Litige
        </button>
      </div>
    </div>
  );
}

// ── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: CriticalReview }) {
  const color = avatarColor(review.clientName);
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials(review.clientName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#1b1c1a" }}>{review.clientName}</p>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3"
                style={{ color: i < review.cookRating ? "#b45309" : "#e8e4de" }}
                fill={i < review.cookRating ? "#b45309" : "none"}
              />
            ))}
          </div>
        </div>
      </div>
      <p
        className="text-sm italic leading-relaxed"
        style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#7c7570" }}
      >
        &ldquo;{review.comment}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: "#b8b3ad" }}>{review.restaurant}</span>
        <div className="flex gap-2">
          <button
            className="rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors"
            style={{ border: "1.5px solid #a03c00", color: "#a03c00" }}
          >
            Ouvrir Ticket
          </button>
          <button
            className="rounded-full px-3 py-1.5 text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
          >
            Répondre
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [data, setData] = useState<SupportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchSupport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<SupportOverview>("/admin/support/overview");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupport();
  }, [fetchSupport]);

  const stats = data?.stats;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Centre de Litiges
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7c7570" }}>
            Gestion et résolution des réclamations clients — Yaoundé & Douala
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ border: "1.5px solid #e8e4de", color: "#7c7570" }}
          >
            Filtrer
          </button>
          <button
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
          >
            <Plus className="h-4 w-4" />
            Nouveau Ticket
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchSupport} />}

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" style={{ color: "#ef4444" }} />}
          label="Réclamations Ouvertes"
          value={stats?.openTickets ?? "—"}
          badge="+12% vs hier"
          badgeColor={{ bg: "#fee2e2", text: "#991b1b" }}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" style={{ color: "#b45309" }} />}
          label="Résolution Moyenne"
          value={stats ? `${stats.avgResolutionHours} heures` : "—"}
          badge="-15 min"
          badgeColor={{ bg: "#dcfce7", text: "#166534" }}
          loading={loading}
        />
        <StatCard
          icon={<ThumbsUp className="h-5 w-5" style={{ color: "#2c694e" }} />}
          label="Satisfaction Support"
          value={stats ? `${stats.satisfactionRate}%` : "—"}
          badge="Stable"
          badgeColor={{ bg: "#f5f3ef", text: "#7c7570" }}
          loading={loading}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5" style={{ color: "#a03c00" }} />}
          label="Remboursements"
          value={stats ? formatFcfa(stats.refundsXaf) : "—"}
          badge="Mois en cours"
          badgeColor={{ bg: "#fdf3ee", text: "#a03c00" }}
          loading={loading}
        />
      </div>

      {/* Tickets Table + Detail Panel */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Tickets list (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-semibold italic"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
            >
              Litiges en cours
            </h2>
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: "#dcfce7" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#16a34a" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#16a34a" }} />
              </span>
              <span className="text-[10px] font-bold" style={{ color: "#166534" }}>
                Mise à jour: Il y a 2 min
              </span>
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : data?.tickets && data.tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#fbf9f5" }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>ID Litige</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Client</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "#7c7570" }}>Restaurant</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#7c7570" }}>Motif</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7c7570" }}>Gravité</th>
                      <th className="px-4 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tickets.map((t) => (
                      <TicketRow
                        key={t.id}
                        ticket={t}
                        selected={selectedTicket?.id === t.id}
                        onClick={() => setSelectedTicket(t)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center">
                <AlertTriangle className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
                <p className="text-sm" style={{ color: "#7c7570" }}>Aucun litige en cours</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel (2 cols) */}
        <div className="lg:col-span-2">
          <h2
            className="text-lg font-semibold italic mb-3"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
          >
            Détails du Litige
          </h2>
          <TicketDetail ticket={selectedTicket} />
        </div>
      </div>

      {/* Critical Reviews */}
      <div className="space-y-4">
        <h2
          className="text-lg font-semibold italic"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          Avis Récents Critiques
        </h2>
        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : data?.criticalReviews && data.criticalReviews.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.criticalReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 flex flex-col items-center"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          >
            <Star className="h-8 w-8 mb-2" style={{ color: "#e8e4de" }} />
            <p className="text-sm" style={{ color: "#7c7570" }}>Aucun avis critique récent</p>
          </div>
        )}
      </div>

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
