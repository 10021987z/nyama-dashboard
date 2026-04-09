"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useApi } from "@/hooks/use-api";
import { formatFcfa } from "@/lib/utils";
import { Search, UtensilsCrossed, Flame, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceXaf: number;
  category: string;
  isAvailable: boolean;
  isDailySpecial: boolean;
  prepTimeMin?: number;
  cook?: {
    id: string;
    displayName: string;
    avgRating?: number;
    quarter?: { name: string; city: string };
  };
}

interface MenuResponse {
  data: MenuItem[];
  total: number;
}

export default function MenuPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const { data, loading, error, refetch } = useApi<MenuResponse>("/menu");

  const items = data?.data ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || (i.cook?.displayName ?? "").toLowerCase().includes(q);
    const matchC = category === "all" || i.category === category;
    return matchQ && matchC;
  });

  const availableCount = items.filter((i) => i.isAvailable).length;
  const specialCount = items.filter((i) => i.isDailySpecial).length;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[1.8rem] font-semibold italic leading-tight" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}>
          Menu global
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Catalogue agrégé · {items.length} plats · {availableCount} disponibles · {specialCount} spéciaux du jour
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#6B7280" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un plat ou une cuisinière…"
            className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full px-4 py-2.5 text-sm font-semibold outline-none"
          style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)", color: "#3D3D3D" }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "Toutes catégories" : c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl p-5" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" style={{ color: "#F57C20" }} />
                    <h3 className="text-sm font-bold truncate" style={{ color: "#3D3D3D" }}>{item.name}</h3>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs line-clamp-2" style={{ color: "#6B7280" }}>{item.description}</p>
                  )}
                </div>
                {item.isDailySpecial && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
                    <Flame className="h-3 w-3" /> SPÉCIAL
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "#F57C20", fontFamily: "var(--font-mono), monospace" }}>{formatFcfa(item.priceXaf)}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase" style={{ color: item.isAvailable ? "#166534" : "#991b1b" }}>
                  {item.isAvailable ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {item.isAvailable ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid #f5f3ef", color: "#6B7280" }}>
                <span className="font-semibold" style={{ color: "#3D3D3D" }}>{item.cook?.displayName ?? "—"}</span>
                {item.cook?.quarter && <> · {item.cook.quarter.name}, {item.cook.quarter.city}</>}
                <> · {item.category}</>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-sm py-8" style={{ color: "#6B7280" }}>Aucun plat trouvé.</p>
          )}
        </div>
      )}

      <p className="text-center text-[10px] font-medium tracking-[0.12em] uppercase pt-2" style={{ color: "#b8b3ad" }}>
        {t("footer")}
      </p>
    </div>
  );
}
