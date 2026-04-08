"use client";

import { useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatFcfa } from "@/lib/utils";
import { AlertTriangle, Bike, Clock, Phone, User } from "lucide-react";

interface OrdersKanbanProps {
  orders: Order[];
  onSelect?: (order: Order) => void;
  /** Optional in-memory status override (drag/drop). */
  onMoveStatus?: (orderId: string, status: OrderStatus) => void;
}

const COLUMNS: { key: OrderStatus; title: string; accent: string; bg: string }[] = [
  { key: "pending", title: "Nouvelle", accent: "#F57C20", bg: "#fff7ed" },
  { key: "preparing", title: "Acceptée / En préparation", accent: "#D4A017", bg: "#fefce8" },
  { key: "ready", title: "Prête", accent: "#0891b2", bg: "#ecfeff" },
  { key: "delivering", title: "En livraison", accent: "#1B4332", bg: "#f0fdf4" },
];

function minutesSince(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 60000);
}

export function OrdersKanban({ orders, onSelect, onMoveStatus }: OrdersKanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Order[]> = {};
    COLUMNS.forEach((c) => (map[c.key] = []));
    orders.forEach((o) => {
      if (map[o.status]) map[o.status].push(o);
    });
    return map;
  }, [orders]);

  const handleDrop = (status: OrderStatus) => {
    if (dragId && onMoveStatus) onMoveStatus(dragId, status);
    setDragId(null);
  };

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
          className="rounded-2xl p-3 flex flex-col gap-2 min-h-[280px]"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: col.accent }}
              />
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#3D3D3D" }}
              >
                {col.title}
              </h3>
            </div>
            <span
              className="text-[10px] font-bold rounded-full px-2 py-0.5"
              style={{ backgroundColor: col.bg, color: col.accent }}
            >
              {grouped[col.key].length}
            </span>
          </div>

          {/* Cards */}
          {grouped[col.key].length === 0 && (
            <p className="text-[11px] text-center py-6" style={{ color: "#9ca3af" }}>
              Aucune commande
            </p>
          )}
          {grouped[col.key].map((o) => {
            const mins = minutesSince(o.createdAt);
            const overdue = mins > 20;
            return (
              <div
                key={o.id}
                draggable={!!onMoveStatus}
                onDragStart={() => setDragId(o.id)}
                onClick={() => onSelect?.(o)}
                className="rounded-xl border p-3 cursor-pointer transition-shadow hover:shadow-md"
                style={{
                  borderColor: overdue ? "#fecaca" : "#f5f3ef",
                  backgroundColor: overdue ? "#fff1f2" : "#ffffff",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[10px] font-bold"
                    style={{
                      color: "#6B7280",
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    #{(o.id ?? "").slice(-6).toUpperCase()}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold"
                    style={{ color: overdue ? "#ef4444" : "#9ca3af" }}
                  >
                    {overdue && <AlertTriangle className="h-3 w-3" />}
                    <Clock className="h-3 w-3" />
                    {mins} min
                  </span>
                </div>
                <p
                  className="text-sm font-semibold flex items-center gap-1.5"
                  style={{ color: "#3D3D3D" }}
                >
                  <User className="h-3 w-3" style={{ color: "#6B7280" }} />
                  {o.clientName}
                </p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "#6B7280" }}>
                  {o.cookName}
                </p>
                <div
                  className="flex items-center justify-between mt-2 pt-2 border-t"
                  style={{ borderColor: "#f5f3ef" }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: "#F57C20",
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    {formatFcfa(o.totalXaf)}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[10px]"
                    style={{ color: o.riderName ? "#16a34a" : "#ef4444" }}
                  >
                    <Bike className="h-3 w-3" />
                    {o.riderName ?? "Non assigné"}
                  </span>
                </div>
                {o.clientPhone && (
                  <p
                    className="flex items-center gap-1 text-[10px] mt-1"
                    style={{ color: "#9ca3af" }}
                  >
                    <Phone className="h-3 w-3" />
                    {o.clientPhone}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
