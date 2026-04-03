"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Order, OrdersResponse } from "@/lib/types";
import { formatFcfa, formatDateTime, formatRelative, statusLabel, statusColor } from "@/lib/utils";
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
import { ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "preparing", label: "En préparation" },
  { value: "ready", label: "Prête" },
  { value: "delivering", label: "En livraison" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

const LIMIT = 20;

// ── Order Detail Dialog ────────────────────────────────────────────────────────

function OrderDetailDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
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
                Commande #{(order.id ?? "").slice(-8).toUpperCase()}
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
                Client
              </h3>
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Nom : </span>
                  <span className="font-medium">{order.clientName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Téléphone : </span>
                  {order.clientPhone}
                </p>
                <p>
                  <span className="text-muted-foreground">Ville : </span>
                  {order.city}
                </p>
              </div>
            </section>

            {/* Cook / Rider */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
                Partenaires
              </h3>
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Cuisinière : </span>
                  <span className="font-medium">{order.cookName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Livreur : </span>
                  {order.riderName ? (
                    <span className="font-medium">{order.riderName}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Non assigné
                    </span>
                  )}
                </p>
              </div>
            </section>

            {/* Articles */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
                Articles
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                        Article
                      </th>
                      <th className="text-center px-2 py-2 font-medium text-muted-foreground">
                        Qté
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                        P.U.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, i) => (
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
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatFcfa(order.totalXaf - order.deliveryFeeXaf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span>{formatFcfa(order.deliveryFeeXaf)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total</span>
                <span>{formatFcfa(order.totalXaf)}</span>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-3">
                Timeline
              </h3>
              <div className="relative pl-5 space-y-4">
                {/* vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />

                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                  <div>
                    <p className="text-sm font-medium">Commande passée</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.deliveredAt && (
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-0.5 h-3 w-3 rounded-full bg-green-700 ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-medium">Livrée</p>
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
                        Annulée
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (status) params.status = status;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const result = await apiClient.get<OrdersResponse>("/admin/orders", params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [status, fromDate, toDate, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  function handleReset() {
    setStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">
                Statut
              </label>
              <Select value={status} onValueChange={(val: string | null) => { setStatus(val ?? ""); setPage(1); }}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Du
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Au
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleReset} className="h-9 gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Commandes
            {data && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {data.total.toLocaleString("fr-FR")} résultat
                {data.total > 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchOrders} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden md:table-cell">Cuisinière</TableHead>
                    <TableHead className="hidden lg:table-cell">Livreur</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="hidden lg:table-cell">Frais liv.</TableHead>
                    <TableHead className="hidden md:table-cell">Ville</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-muted-foreground py-12"
                      >
                        Aucune commande trouvée
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.data.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                        #{(order.id ?? "").slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {order.clientName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {order.clientPhone}
                      </TableCell>
                      <TableCell className="hidden md:table-cell whitespace-nowrap">
                        {order.cookName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                        {order.riderName ?? <span className="italic">—</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatFcfa(order.totalXaf)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                        {formatFcfa(order.deliveryFeeXaf)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{order.city}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusColor(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs whitespace-nowrap">
                        {formatRelative(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && data && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="gap-1"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

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
