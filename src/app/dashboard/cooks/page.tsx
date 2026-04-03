"use client";

import { useState, useMemo } from "react";
import { useApi } from "@/hooks/use-api";
import type { CooksResponse, Cook } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

function parseSpecialties(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string") return [String(raw)];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
}

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold tabular-nums w-6">
        {(value ?? 0).toFixed(1)}
      </span>
      <div className="h-1.5 w-20 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function medalLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}.`;
}

function TopCookCard({ cook, rank }: { cook: Cook; rank: number }) {
  const isFirst = rank === 1;
  return (
    <div
      className={`flex-shrink-0 w-52 rounded-xl border p-4 space-y-2 ${
        isFirst ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none mt-0.5">{medalLabel(rank)}</span>
        <span className="font-bold text-[15px] leading-snug line-clamp-2">
          {cook.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span>⭐</span>
        <span className="font-semibold">{(cook.avgRating ?? 0).toFixed(1)}</span>
        <div className="ml-1 h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${((cook.avgRating ?? 0) / 5) * 100}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {(cook.totalOrders ?? 0).toLocaleString("fr-FR")} commandes
      </p>
      {(cook.neighborhood || cook.city) && (
        <p className="text-xs text-muted-foreground">
          {cook.neighborhood
            ? `${cook.neighborhood}, ${cook.city}`
            : cook.city}
        </p>
      )}
    </div>
  );
}

export default function CooksPage() {
  const [search, setSearch] = useState("");

  const { data, loading, error, refetch } = useApi<CooksResponse>("/cooks", {
    sort: "rating",
    limit: 50,
  });

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const sorted = useMemo<Cook[]>(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => b.avgRating - a.avgRating);
  }, [data]);

  const top5 = sorted.slice(0, 5);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [sorted, search]);

  return (
    <div className="space-y-6">
      {/* Top 5 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            🏆 Top 5 Cuisinières
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-shrink-0 h-32 w-52 rounded-xl"
                />
              ))}
            </div>
          ) : top5.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune cuisinière disponible.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {top5.map((cook, i) => (
                <TopCookCard key={cook.id} cook={cook} rank={i + 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base font-bold">
              Toutes les cuisinières
            </CardTitle>
            <div className="relative ml-auto w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 hidden sm:table-cell">#</TableHead>
                    <TableHead>Nom commercial</TableHead>
                    <TableHead className="hidden lg:table-cell">Spécialités</TableHead>
                    <TableHead className="hidden md:table-cell">Quartier</TableHead>
                    <TableHead>Note ⭐</TableHead>
                    <TableHead className="hidden sm:table-cell">Commandes</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-12"
                      >
                        Aucune cuisinière trouvée
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((cook, i) => {
                    const specs = parseSpecialties(cook.specialty);
                    return (
                      <TableRow key={cook.id}>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {cook.name}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {specs.length > 0 ? (
                              specs.map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700 font-medium"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm whitespace-nowrap">
                          {cook.neighborhood
                            ? `${cook.neighborhood}, ${cook.city}`
                            : cook.city || "—"}
                        </TableCell>
                        <TableCell>
                          <RatingBar value={cook.avgRating} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {(cook.totalOrders ?? 0).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                cook.isActive ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                            <span
                              className={`text-xs font-medium ${
                                cook.isActive
                                  ? "text-green-700"
                                  : "text-red-600"
                              }`}
                            >
                              {cook.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
