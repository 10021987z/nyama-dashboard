import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── FCFA formatter ────────────────────────────────────────────────────────────

const fcfaFormatter = new Intl.NumberFormat("fr-FR", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatFcfa(amount: number): string {
  return `${fcfaFormatter.format(amount)} FCFA`;
}

export function formatFcfaCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M FCFA`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k FCFA`;
  }
  return formatFcfa(amount);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy", { locale: fr });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy 'à' HH'h'mm", { locale: fr });
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

// ── Order status helpers ──────────────────────────────────────────────────────

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "En attente",
    preparing: "En préparation",
    ready: "Prête",
    delivering: "En livraison",
    delivered: "Livrée",
    cancelled: "Annulée",
  };
  return labels[status] ?? status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-purple-100 text-purple-800",
    delivering: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function trendLabel(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
