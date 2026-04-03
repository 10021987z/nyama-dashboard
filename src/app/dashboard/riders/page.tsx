"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api";
import type { UsersResponse, User } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bike, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

const LIMIT = 20;

export default function RidersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<UsersResponse>("/admin/users", {
        role: "RIDER",
        page,
        limit: LIMIT,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de contacter le serveur NYAMA"
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-100 p-3">
              <Bike className="h-6 w-6 text-cyan-700" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-black">
                  {data?.total.toLocaleString("fr-FR") ?? "—"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Livreurs inscrits</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100 bg-blue-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Les statistiques détaillées par livreur (courses, gains, note)
              seront disponibles dans la{" "}
              <span className="font-semibold">v2</span>.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center">
            Livreurs
            {data && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {data.total.toLocaleString("fr-FR")} livreur
                {data.total > 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchRiders} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="hidden md:table-cell">Quartier</TableHead>
                    <TableHead className="hidden sm:table-cell">Inscrit le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-12"
                      >
                        Aucun livreur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.data.map((rider: User) => (
                    <TableRow key={rider.id}>
                      <TableCell className="font-medium">
                        {rider.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rider.phone}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {rider.neighborhood && rider.city
                          ? `${rider.neighborhood}, ${rider.city}`
                          : rider.city || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {formatDate(rider.createdAt)}
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
    </div>
  );
}
