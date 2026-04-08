"use client";

import type { Restaurant } from "@/lib/types";
import { formatFcfaCompact } from "@/lib/utils";
import { Eye, Pencil, Star } from "lucide-react";

interface RestaurantsTableProps {
  rows: Restaurant[];
  onView: (r: Restaurant) => void;
  onEdit: (r: Restaurant) => void;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "#F57C20",
  "#2c694e",
  "#8b4c11",
  "#E06A10",
  "#b45309",
  "#2563eb",
  "#7c3aed",
  "#db2777",
];

function avatarColor(id?: string | null): string {
  if (!id) return AVATAR_COLORS[0];
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function StarRow({ value }: { value: number }) {
  const v = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3 w-3"
          fill={i <= v ? "#D4A017" : "none"}
          stroke={i <= v ? "#D4A017" : "#e8e4de"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export function RestaurantsTable({ rows, onView, onEdit }: RestaurantsTableProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#fbf9f5" }}>
              <Th>Restaurant</Th>
              <Th>Quartier</Th>
              <Th>Note</Th>
              <Th>Commandes</Th>
              <Th>CA total</Th>
              <Th>Statut</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-[#fbf9f5] transition-colors border-t"
                style={{ borderColor: "#f5f3ef" }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: avatarColor(r.id) }}
                    >
                      {initials(r.name)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "#3D3D3D" }}
                      >
                        {r.name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>
                        {r.phone}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>
                  {r.neighborhood ? `${r.neighborhood}, ${r.city}` : r.city}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <StarRow value={r.avgRating ?? 0} />
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>
                      ({(r.avgRating ?? 0).toFixed(1)})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "#3D3D3D",
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    {(r.totalOrders ?? 0).toLocaleString("fr-FR")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "#1B4332",
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    {formatFcfaCompact(r.totalRevenue ?? 0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: r.isActive ? "#dcfce7" : "#fee2e2",
                      color: r.isActive ? "#166534" : "#991b1b",
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: r.isActive ? "#16a34a" : "#dc2626" }}
                    />
                    {r.isActive ? "EN LIGNE" : "HORS LIGNE"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(r)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-[#f5f3ef]"
                      title="Voir"
                    >
                      <Eye className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                    </button>
                    <button
                      onClick={() => onEdit(r)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-[#fdf3ee]"
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" style={{ color: "#F57C20" }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-4 py-3 text-${align} text-[10px] font-bold uppercase tracking-wider`}
      style={{ color: "#6B7280" }}
    >
      {children}
    </th>
  );
}
