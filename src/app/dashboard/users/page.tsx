"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";
import type { User, UsersResponse, DashboardKpis } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { ErrorState } from "@/components/ui/error-state";
import { ChevronLeft, ChevronRight, Search, Users, UtensilsCrossed, Bike, ShoppingCart } from "lucide-react";

const LIMIT = 20;

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: "CLIENT", label: "Client" },
  { value: "COOK", label: "Cuisinière" },
  { value: "RIDER", label: "Livreur" },
  { value: "ADMIN", label: "Admin" },
];

function roleClass(role: string): string {
  const map: Record<string, string> = {
    CLIENT: "bg-slate-100 text-slate-700",
    COOK: "bg-green-100 text-green-700",
    RIDER: "bg-blue-100 text-blue-700",
    ADMIN: "bg-purple-100 text-purple-700",
  };
  return map[role] ?? "bg-gray-100 text-gray-700";
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    CLIENT: "Client",
    COOK: "Cuisinière",
    RIDER: "Livreur",
    ADMIN: "Admin",
  };
  return map[role] ?? role;
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-black">
              {value?.toLocaleString("fr-FR") ?? "—"}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: kpis, loading: kpisLoading } = useApi<DashboardKpis>(
    "/admin/dashboard"
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (role) params.role = role;
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await apiClient.get<UsersResponse>("/admin/users", params);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA"
      );
    } finally {
      setLoading(false);
    }
  }, [role, debouncedSearch, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-6 w-6 text-slate-600" />}
          label="Total utilisateurs"
          value={data?.total}
          loading={loading}
        />
        <StatCard
          icon={<ShoppingCart className="h-6 w-6 text-sky-600" />}
          label="Clients"
          value={data?.total}
          loading={loading}
        />
        <StatCard
          icon={<UtensilsCrossed className="h-6 w-6 text-green-700" />}
          label="Cuisinières"
          value={kpis?.totalCooks}
          loading={kpisLoading}
        />
        <StatCard
          icon={<Bike className="h-6 w-6 text-blue-600" />}
          label="Livreurs"
          value={kpis?.totalRiders}
          loading={kpisLoading}
        />
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">
                Rôle
              </label>
              <Select
                value={role}
                onValueChange={(val: string | null) => {
                  setRole(val ?? "");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-muted-foreground">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Rechercher par nom ou téléphone..."
                  className="h-9 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center">
            Utilisateurs
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
            <ErrorState message={error} onRetry={fetchUsers} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Quartier</TableHead>
                    <TableHead className="hidden sm:table-cell">Inscrit le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-12"
                      >
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone}
                      </TableCell>
                      <TableCell>
                        <Badge className={roleClass(user.role)}>
                          {roleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {user.neighborhood && user.city
                          ? `${user.neighborhood}, ${user.city}`
                          : user.city || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
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
    </div>
  );
}
