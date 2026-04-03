"use client";

import { useMemo } from "react";
import {
  ShoppingBag,
  Users,
  TrendingUp,
  ChefHat,
  Bike,
  Star,
  DollarSign,
  Package,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OrdersChart } from "@/components/charts/orders-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import type {
  DashboardKpis,
  OrdersResponse,
  OrderStatusDistribution,
} from "@/lib/types";
import {
  formatFcfa,
  formatFcfaCompact,
  formatRelative,
  statusLabel,
  statusColor,
} from "@/lib/utils";

// Static 7-day bar chart data (simulated)
const weekData = [
  { date: "Lun", orders: 32, revenue: 128_000 },
  { date: "Mar", orders: 28, revenue: 112_000 },
  { date: "Mer", orders: 41, revenue: 164_000 },
  { date: "Jeu", orders: 35, revenue: 140_000 },
  { date: "Ven", orders: 53, revenue: 212_000 },
  { date: "Sam", orders: 67, revenue: 268_000 },
  { date: "Dim", orders: 45, revenue: 180_000 },
];

function KpiSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const {
    data: kpis,
    loading: kpisLoading,
    error: kpisError,
    refetch: kpisRefetch,
  } = useApi<DashboardKpis>("/admin/dashboard");
  const {
    data: ordersRes,
    loading: ordersLoading,
    error: ordersError,
    refetch: ordersRefetch,
  } = useApi<OrdersResponse>("/admin/orders", { limit: 10, page: 1 });

  const statusDistribution = useMemo<OrderStatusDistribution[]>(() => {
    if (!ordersRes?.data) return [];
    const counts: Record<string, number> = {};
    for (const order of ordersRes.data) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }
    const total = ordersRes.data.length;
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }, [ordersRes]);

  if (kpisError)
    return (
      <ErrorState
        message={kpisError}
        onRetry={kpisRefetch}
      />
    );

  return (
    <div className="space-y-6">
      {/* Hero KPIs — 4 col desktop, 2 tablet, 1 mobile */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpisLoading ? (
          Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Commandes aujourd'hui"
              value={`${kpis?.ordersToday ?? 0}`}
              subtitle="Commandes en cours"
              icon={ShoppingBag}
              colorClass="text-blue-700"
              iconBgClass="bg-blue-100"
            />
            <KpiCard
              title="Revenus aujourd'hui"
              value={formatFcfaCompact(kpis?.revenueToday ?? 0)}
              subtitle="Revenus de la journée"
              icon={DollarSign}
              colorClass="text-green-700"
              iconBgClass="bg-green-100"
            />
            <KpiCard
              title="Total commandes"
              value={`${(kpis?.totalOrders ?? 0).toLocaleString("fr-FR")}`}
              subtitle="Toutes périodes confondues"
              icon={Package}
              colorClass="text-purple-700"
              iconBgClass="bg-purple-100"
            />
            <KpiCard
              title="Revenus totaux"
              value={formatFcfaCompact(kpis?.totalRevenue ?? 0)}
              subtitle="Toutes périodes confondues"
              icon={TrendingUp}
              colorClass="text-amber-700"
              iconBgClass="bg-amber-100"
            />
            <KpiCard
              title="Utilisateurs"
              value={`${(kpis?.totalUsers ?? 0).toLocaleString("fr-FR")}`}
              subtitle="Clients inscrits"
              icon={Users}
              iconBgClass="bg-sky-100"
            />
            <KpiCard
              title="Cuisinières"
              value={`${kpis?.totalCooks ?? 0}`}
              subtitle="Partenaires actives"
              icon={ChefHat}
              colorClass="text-orange-700"
              iconBgClass="bg-orange-100"
            />
            <KpiCard
              title="Livreurs"
              value={`${kpis?.totalRiders ?? 0}`}
              subtitle="Riders inscrits"
              icon={Bike}
              colorClass="text-cyan-700"
              iconBgClass="bg-cyan-100"
            />
            <KpiCard
              title="Note moyenne"
              value={`${(kpis?.avgRating ?? 0).toFixed(1)} / 5`}
              subtitle="Satisfaction clients"
              icon={Star}
              colorClass="text-yellow-700"
              iconBgClass="bg-yellow-100"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Commandes — 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart data={weekData} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Répartition des statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center h-[280px]">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : (
              <StatusPieChart data={statusDistribution} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last 10 orders */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            10 dernières commandes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : ordersError ? (
            <ErrorState message={ordersError} onRetry={ordersRefetch} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Cuisinière</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersRes?.data.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        Aucune commande
                      </TableCell>
                    </TableRow>
                  )}
                  {ordersRes?.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                        #{order.id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.clientName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {order.cookName}
                      </TableCell>
                      <TableCell>{formatFcfa(order.totalXaf)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {formatRelative(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
