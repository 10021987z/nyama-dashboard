"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api";
import type { Order, OrdersResponse } from "@/lib/types";
import { formatFcfa, formatDateTime, formatRelative, statusLabel, statusColor } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ChevronLeft, ChevronRight, Filter, RotateCcw, LayoutGrid, List as ListIcon } from "lucide-react";
import { OrdersKanban, OrdersKanbanSkeleton } from "@/components/dashboard/orders-kanban";
import type { OrderStatus } from "@/lib/types";

const LIMIT = 20;

// ── Order Detail Dialog ────────────────────────────────────────────────────────

function OrderDetailDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        showCloseButton
      >
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>
                {t("orders.orderDetail")} #{(order.id ?? "").slice(-8).toUpperCase()}
              </DialogTitle>
            </DialogHeader>

            {/* Status badge */}
            <div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}
              >
                {statusLabel(order.status)}
              </span>
            </div>

            {/* Client */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
                {t("orders.client")}
              </h3>
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("orders.name")}</span>
                  <span className="font-medium">{order.clientName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("orders.phone")}</span>
                  {order.clientPhone}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("orders.city")}</span>
                  {order.city}
                </p>
              </div>
            </section>

            {/* Cook / Rider */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
                {t("orders.partners")}
              </h3>
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("orders.cook")}</span>
                  <span className="font-medium">{order.cookName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("orders.rider")}</span>
                  {order.riderName ? (
                    <span className="font-medium">{order.riderName}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      {t("orders.notAssigned")}
                    </span>
                  )}
                </p>
              </div>
            </section>

            {/* Articles */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
                {t("orders.articles")}
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                        {t("orders.article")}
                      </th>
                      <th className="text-center px-2 py-2 font-medium text-muted-foreground">
                        {t("orders.qty")}
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                        {t("orders.unitPrice")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{item.menuItemName}</td>
                        <td className="px-2 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {formatFcfa(item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Totals */}
            <section className="rounded-lg border p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("orders.subtotal")}</span>
                <span>{formatFcfa(order.totalXaf - order.deliveryFeeXaf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("orders.deliveryFees")}</span>
                <span>{formatFcfa(order.deliveryFeeXaf)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>{t("orders.total")}</span>
                <span>{formatFcfa(order.totalXaf)}</span>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-3">
                {t("orders.timeline")}
              </h3>
              <div className="relative pl-5 space-y-4">
                {/* vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />

                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                  <div>
                    <p className="text-sm font-medium">{t("orders.orderPlaced")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.acceptedAt && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium">Acceptée par la cuisinière</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.acceptedAt)}</p>
                    </div>
                  </div>
                )}

                {order.readyAt && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-purple-500 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium">Prête</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.readyAt)}</p>
                    </div>
                  </div>
                )}

                {order.assignedAt && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-indigo-500 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium">Livreur assigné</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.assignedAt)}</p>
                    </div>
                  </div>
                )}

                {order.pickedUpAt && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-orange-500 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium">Récupérée par le livreur</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.pickedUpAt)}</p>
                    </div>
                  </div>
                )}

                {order.deliveredAt && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-green-700 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium">{t("orders.delivered")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.deliveredAt)}
                      </p>
                    </div>
                  </div>
                )}

                {order.status === "cancelled" && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        {t("orders.cancelled")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── History Table (simple, standalone) ─────────────────────────────────────────

function HistoryTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [delivered, cancelledRes] = await Promise.all([
          apiClient.get<OrdersResponse>("/admin/orders", {
            status: "DELIVERED",
            limit: 50,
          }),
          apiClient.get<OrdersResponse>("/admin/orders", {
            status: "CANCELLED",
            limit: 50,
          }),
        ]);
        if (cancelled) return;
        const all = [
          ...(delivered.data ?? []),
          ...(cancelledRes.data ?? []),
        ];
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(all);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  if (error) return <div className="p-8 text-sm text-red-600">Erreur : {error}</div>;
  if (orders.length === 0)
    return <div className="p-8 text-sm text-muted-foreground">Aucune commande dans l&apos;historique</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">
        Historique des commandes ({orders.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left">
              <th className="py-2 font-semibold">#</th>
              <th className="py-2 font-semibold">Client</th>
              <th className="py-2 font-semibold">Cuisinière</th>
              <th className="py-2 font-semibold text-right">Montant</th>
              <th className="py-2 font-semibold">Paiement</th>
              <th className="py-2 font-semibold">Date</th>
              <th className="py-2 font-semibold text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const status = (o.status ?? "").toString().toUpperCase();
              const badgeClass =
                status === "DELIVERED"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800";
              return (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs">
                    {(o.id ?? "").slice(0, 8)}
                  </td>
                  <td className="py-2">{o.clientName ?? "—"}</td>
                  <td className="py-2">{o.cookName ?? "—"}</td>
                  <td className="py-2 text-right font-mono">
                    {(o.totalXaf ?? 0).toLocaleString("fr-FR")} FCFA
                  </td>
                  <td className="py-2">
                    {o.paymentMethod ? o.paymentMethod.replace(/_/g, " ") : "—"}
                  </td>
                  <td className="py-2 text-xs text-gray-500" suppressHydrationWarning>
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={
                        "px-2 py-1 rounded-full text-xs font-semibold " +
                        badgeClass
                      }
                    >
                      {status}
                    </span>
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

// ── Main Page ──────────────────────────────────────────────────────────────────

function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56 rounded-full" />
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div
            key={col}
            className="rounded-2xl p-3 flex flex-col gap-2 min-h-[280px] bg-white border"
          >
            <div className="flex items-center justify-between px-1 mb-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center justify-between pt-2 border-t">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusOptions = useMemo(
    () =>
      view === "list"
        ? [
            { value: "", label: t("orders.allStatuses") },
            { value: "delivered", label: t("orders.delivered") },
            { value: "cancelled", label: t("orders.cancelled") },
          ]
        : [
            { value: "", label: t("orders.allStatuses") },
            { value: "pending", label: t("orders.pending") },
            { value: "confirmed", label: t("orders.preparing") },
            { value: "preparing", label: t("orders.preparing") },
            { value: "ready", label: t("orders.ready") },
            { value: "delivering", label: t("orders.pickedUp") },
            { value: "delivered", label: t("orders.delivered") },
            { value: "cancelled", label: t("orders.cancelled") },
          ],
    [t, view]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const normalizeOrder = (o: Order): Order => ({
        ...o,
        status: ((o.status ?? "") as string).toLowerCase() as OrderStatus,
      });

      // Historique sans filtre statut : 2 appels parallèles (l'API n'accepte qu'un statut à la fois)
      if (view === "list" && !status) {
        const baseParams: Record<string, string | number> = { page: 1, limit: 50 };
        if (fromDate) baseParams.from = fromDate;
        if (toDate) baseParams.to = toDate;
        const [delivered, cancelled] = await Promise.all([
          apiClient.get<OrdersResponse>("/admin/orders", {
            ...baseParams,
            status: "DELIVERED",
          }),
          apiClient.get<OrdersResponse>("/admin/orders", {
            ...baseParams,
            status: "CANCELLED",
          }),
        ]);
        const merged = [
          ...(delivered.data ?? []),
          ...(cancelled.data ?? []),
        ].map(normalizeOrder);
        setData({
          data: merged,
          total: (delivered.total ?? 0) + (cancelled.total ?? 0),
          page: 1,
          limit: merged.length,
        });
        return;
      }

      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (status) params.status = status.toUpperCase();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const result = await apiClient.get<OrdersResponse>("/admin/orders", params);
      setData({
        ...result,
        data: (result.data ?? []).map(normalizeOrder),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [status, fromDate, toDate, page, view]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 10s for real-time status updates
  useEffect(() => {
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  function handleReset() {
    setStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  const liveOrders = (data?.data ?? []).map((o) =>
    statusOverrides[o.id] ? { ...o, status: statusOverrides[o.id] } : o
  );

  const historyOrders = useMemo(() => {
    const rows = (data?.data ?? []).filter(
      (o) => o.status === "delivered" || o.status === "cancelled"
    );
    return [...rows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [data?.data]);

  if (!mounted) return <OrdersPageSkeleton />;

  return (
    <div className="space-y-6">
      {/* View switcher */}
      <div
        className="inline-flex items-center gap-1 rounded-full p-1 self-start"
        style={{ backgroundColor: "#f5f3ef" }}
      >
        <button
          onClick={() => setView("kanban")}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            view === "kanban"
              ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
              : { color: "#6B7280" }
          }
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Kanban temps réel
        </button>
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
          style={
            view === "list"
              ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
              : { color: "#6B7280" }
          }
        >
          <ListIcon className="h-3.5 w-3.5" />
          Historique
        </button>
      </div>

      {view === "kanban" && (
        error ? (
          <ErrorState message={error} onRetry={fetchOrders} />
        ) : loading && !data ? (
          <OrdersKanbanSkeleton />
        ) : (
          <OrdersKanban
            orders={liveOrders}
            onSelect={(o) => setSelectedOrder(o)}
            onMoveStatus={(id, s) =>
              setStatusOverrides((prev) => ({ ...prev, [id]: s }))
            }
          />
        )
      )}

      {view === "list" && <HistoryTable />}

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Footer */}
      <p
        className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2"
        style={{ color: "#b8b3ad" }}
      >
        {t("footer")}
      </p>
    </div>
  );
}
