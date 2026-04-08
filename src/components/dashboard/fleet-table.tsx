"use client";

import type { FleetRider } from "@/lib/types";
import { formatFcfaCompact, formatDate } from "@/lib/utils";
import { Star, Bike, MapPin, Eye, ShieldCheck, Check, Clock } from "lucide-react";

const PALETTE = ["#F57C20", "#2c694e", "#8b4c11", "#E06A10", "#b45309", "#2563eb"];

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
function avatarBg(id?: string | null) {
  if (!id) return PALETTE[0];
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[n % PALETTE.length];
}

function levelFor(trips: number): { label: string; bg: string; fg: string } {
  if (trips >= 500) return { label: "PREMIUM", bg: "#fef3c7", fg: "#b45309" };
  if (trips >= 100) return { label: "CONFIRMÉ", bg: "#dcfce7", fg: "#166534" };
  return { label: "NOUVEAU", bg: "#e0f2fe", fg: "#075985" };
}

function statusCfg(r: FleetRider) {
  const s = r.status ?? (r.isOnline ? "online" : "offline");
  if (s === "online") return { label: "EN LIGNE", bg: "#dcfce7", fg: "#166534", dot: "#16a34a" };
  if (s === "delivering") return { label: "EN COURSE", bg: "#fdf3ee", fg: "#F57C20", dot: "#F57C20" };
  return { label: "HORS LIGNE", bg: "#f3f4f6", fg: "#6b7280", dot: "#9ca3af" };
}

export function FleetTable({
  rows,
  verifiedSet,
  onView,
  onVerify,
}: {
  rows: FleetRider[];
  verifiedSet?: Set<string>;
  onView?: (r: FleetRider) => void;
  onVerify?: (r: FleetRider) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#fbf9f5" }}>
              {["Livreur", "Véhicule", "Zone", "Statut", "Niveau", "Vérifié", "Note", "Courses", "Gains", "Inscrit", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#6B7280" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cfg = statusCfg(r);
              const lvl = levelFor(r.totalTrips ?? 0);
              const bg = avatarBg(r.id);
              const isVerified = verifiedSet?.has(r.id) ?? false;
              return (
                <tr key={r.id} className="hover:bg-[#fbf9f5] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: bg }}
                      >
                        {initials(r.name)}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                          style={{ backgroundColor: cfg.dot }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#3D3D3D" }}>{r.name}</p>
                        <p className="text-xs" style={{ color: "#6B7280" }}>{r.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Bike className="h-3.5 w-3.5" style={{ color: "#F57C20" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        {[r.vehicleType, r.plateNumber].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        {r.neighborhood ? `${r.neighborhood}, ${r.city}` : r.city ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{ backgroundColor: lvl.bg, color: lvl.fg }}
                    >
                      {lvl.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={
                        isVerified
                          ? { backgroundColor: "#dcfce7", color: "#166534" }
                          : { backgroundColor: "#fef3c7", color: "#b45309" }
                      }
                    >
                      {isVerified ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : <Clock className="h-2.5 w-2.5" />}
                      {isVerified ? "VÉRIFIÉ" : "EN ATTENTE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" style={{ color: "#b45309" }} />
                      <span className="text-sm font-bold" style={{ color: "#3D3D3D", fontFamily: "var(--font-mono), monospace" }}>
                        {(r.avgRating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold" style={{ color: "#3D3D3D", fontFamily: "var(--font-mono), monospace" }}>
                      {(r.totalTrips ?? 0).toLocaleString("fr-FR")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: "#F57C20", fontFamily: "var(--font-mono), monospace" }}>
                      {formatFcfaCompact(r.totalEarnings)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: "#6B7280" }}>{formatDate(r.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onView?.(r)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#f5f3ef]"
                        title="Voir"
                      >
                        <Eye className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                      </button>
                      {!isVerified && onVerify && (
                        <button
                          onClick={() => onVerify(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#dcfce7]"
                          title="Vérifier"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" style={{ color: "#166534" }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
