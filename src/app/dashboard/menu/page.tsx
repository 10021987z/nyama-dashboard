"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { formatFcfa } from "@/lib/utils";
import {
  Search, UtensilsCrossed, Star, Flame, TrendingUp, Eye, EyeOff,
  LayoutGrid, List,
} from "lucide-react";

// ── Mock data ────────────────────────────────────────────────────────────────

interface Dish {
  id: string;
  name: string;
  category: "Plats" | "Entrées" | "Boissons" | "Desserts" | "Snacks";
  restaurant: string;
  city: "Douala" | "Yaoundé";
  priceXaf: number;
  rating: number;
  orders30d: number;
  available: boolean;
  badge?: "trending" | "top" | null;
}

const DISHES: Dish[] = [
  { id: "d1", name: "Ndolè royal aux crevettes", category: "Plats", restaurant: "Chez Mama Africa", city: "Douala", priceXaf: 4500, rating: 4.8, orders30d: 312, available: true, badge: "top" },
  { id: "d2", name: "Poulet DG", category: "Plats", restaurant: "Le Saveurs du 237", city: "Yaoundé", priceXaf: 5500, rating: 4.7, orders30d: 287, available: true, badge: "top" },
  { id: "d3", name: "Eru aux escargots", category: "Plats", restaurant: "Bantu Kitchen", city: "Douala", priceXaf: 4000, rating: 4.5, orders30d: 198, available: true },
  { id: "d4", name: "Koki de maïs", category: "Entrées", restaurant: "Chez Mama Africa", city: "Douala", priceXaf: 1500, rating: 4.6, orders30d: 156, available: true },
  { id: "d5", name: "Bobolo + sauce arachide", category: "Plats", restaurant: "Mboa Délices", city: "Yaoundé", priceXaf: 3500, rating: 4.4, orders30d: 142, available: true, badge: "trending" },
  { id: "d6", name: "Folong au poisson fumé", category: "Plats", restaurant: "Bantu Kitchen", city: "Douala", priceXaf: 3800, rating: 4.3, orders30d: 121, available: true },
  { id: "d7", name: "Beignets haricots bouillie", category: "Snacks", restaurant: "Le Saveurs du 237", city: "Yaoundé", priceXaf: 1200, rating: 4.9, orders30d: 489, available: true, badge: "top" },
  { id: "d8", name: "Sanga maïs frais", category: "Plats", restaurant: "Mboa Délices", city: "Yaoundé", priceXaf: 3200, rating: 4.2, orders30d: 98, available: true },
  { id: "d9", name: "Jus de gingembre maison", category: "Boissons", restaurant: "Chez Mama Africa", city: "Douala", priceXaf: 1000, rating: 4.7, orders30d: 234, available: true, badge: "trending" },
  { id: "d10", name: "Bissap glacé", category: "Boissons", restaurant: "Bantu Kitchen", city: "Douala", priceXaf: 800, rating: 4.5, orders30d: 178, available: true },
  { id: "d11", name: "Achombo ananas", category: "Desserts", restaurant: "Mboa Délices", city: "Yaoundé", priceXaf: 1500, rating: 4.4, orders30d: 67, available: false },
  { id: "d12", name: "Mbongo tchobi poisson", category: "Plats", restaurant: "Le Saveurs du 237", city: "Yaoundé", priceXaf: 4800, rating: 4.6, orders30d: 145, available: true },
  { id: "d13", name: "Kondrè de bœuf", category: "Plats", restaurant: "Chez Mama Africa", city: "Douala", priceXaf: 5000, rating: 4.5, orders30d: 132, available: true },
  { id: "d14", name: "Kpwem au poulet", category: "Plats", restaurant: "Bantu Kitchen", city: "Douala", priceXaf: 4200, rating: 4.3, orders30d: 89, available: false },
  { id: "d15", name: "Plantain mûr braisé", category: "Snacks", restaurant: "Mboa Délices", city: "Yaoundé", priceXaf: 700, rating: 4.6, orders30d: 256, available: true },
];

const CATEGORIES = ["Toutes", "Plats", "Entrées", "Snacks", "Boissons", "Desserts"] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function categoryColor(c: Dish["category"]) {
  switch (c) {
    case "Plats": return { bg: "#fdf3ee", fg: "#F57C20" };
    case "Entrées": return { bg: "#dcfce7", fg: "#166534" };
    case "Boissons": return { bg: "#e0f2fe", fg: "#075985" };
    case "Desserts": return { bg: "#fef3c7", fg: "#b45309" };
    case "Snacks": return { bg: "#ffedd5", fg: "#c2410c" };
  }
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: "#fdf3ee" }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[1.6rem] font-bold leading-tight"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: accent ?? "#3D3D3D" }}
        >
          {value}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Dish card ────────────────────────────────────────────────────────────────

function DishCard({ d, onToggle }: { d: Dish; onToggle: (id: string) => void }) {
  const cat = categoryColor(d.category);
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)",
        opacity: d.available ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: cat.bg, color: cat.fg }}
        >
          {d.category}
        </span>
        {d.badge === "top" && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
            <Star className="h-2.5 w-2.5" /> TOP
          </span>
        )}
        {d.badge === "trending" && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#fdf3ee", color: "#F57C20" }}>
            <Flame className="h-2.5 w-2.5" /> TENDANCE
          </span>
        )}
      </div>

      <div>
        <p
          className="text-base font-semibold leading-snug"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
        >
          {d.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
          {d.restaurant} · {d.city}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-lg font-bold" style={{ color: "#F57C20", fontFamily: "var(--font-mono), monospace" }}>
          {formatFcfa(d.priceXaf)}
        </p>
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" style={{ color: "#b45309" }} />
          <span className="text-sm font-bold" style={{ color: "#3D3D3D" }}>{d.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #f5f3ef" }}>
        <p className="text-[11px]" style={{ color: "#6B7280" }}>
          <span className="font-bold" style={{ color: "#3D3D3D" }}>{d.orders30d}</span> cmd · 30j
        </p>
        <button
          onClick={() => onToggle(d.id)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
          style={
            d.available
              ? { backgroundColor: "#dcfce7", color: "#166534" }
              : { backgroundColor: "#f3f4f6", color: "#6b7280" }
          }
        >
          {d.available ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {d.available ? "DISPONIBLE" : "MASQUÉ"}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Toutes");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const dishes = useMemo(
    () => DISHES.map((d) => (overrides[d.id] !== undefined ? { ...d, available: overrides[d.id] } : d)),
    [overrides]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((d) => {
      if (category !== "Toutes" && d.category !== category) return false;
      if (q && !d.name.toLowerCase().includes(q) && !d.restaurant.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [dishes, search, category]);

  const stats = useMemo(() => {
    const total = dishes.length;
    const available = dishes.filter((d) => d.available).length;
    const top = dishes.filter((d) => d.badge === "top").length;
    const avgPrice = Math.round(dishes.reduce((a, d) => a + d.priceXaf, 0) / total);
    return { total, available, top, avgPrice };
  }, [dishes]);

  const toggle = (id: string) => {
    setOverrides((prev) => {
      const cur = prev[id] !== undefined ? prev[id] : DISHES.find((x) => x.id === id)?.available ?? true;
      return { ...prev, [id]: !cur };
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div>
        <h1
          className="text-[1.8rem] font-semibold italic leading-tight"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
        >
          {t("menu.title") || "Menu global"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Catalogue plats agrégés · {dishes.length} plats actifs sur la plateforme NYAMA
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<UtensilsCrossed className="h-5 w-5" style={{ color: "#F57C20" }} />} label="Plats catalogués" value={stats.total.toString()} />
        <StatCard icon={<Eye className="h-5 w-5" style={{ color: "#166534" }} />} label="Disponibles" value={stats.available.toString()} accent="#166534" />
        <StatCard icon={<Star className="h-5 w-5" style={{ color: "#b45309" }} />} label="Plats Top" value={stats.top.toString()} accent="#b45309" />
        <StatCard icon={<TrendingUp className="h-5 w-5" style={{ color: "#F57C20" }} />} label="Prix moyen" value={formatFcfa(stats.avgPrice)} />
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}
      >
        <div
          className="flex flex-1 min-w-[200px] items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un plat ou un restaurant…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#3D3D3D" }}
          />
        </div>

        <div className="flex gap-1 rounded-full p-1" style={{ backgroundColor: "#f5f3ef" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                category === c
                  ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                  : { color: "#6B7280" }
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="inline-flex gap-1 rounded-full p-1" style={{ backgroundColor: "#f5f3ef" }}>
          {[
            { v: "cards" as const, Icon: LayoutGrid },
            { v: "table" as const, Icon: List },
          ].map(({ v, Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex items-center justify-center rounded-full h-7 w-8 transition-all"
              style={
                view === v
                  ? { background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }
                  : { color: "#6B7280" }
              }
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <UtensilsCrossed className="h-10 w-10" style={{ color: "#e8e4de" }} />
          <p className="text-sm" style={{ color: "#6B7280" }}>Aucun plat ne correspond à ces filtres</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => (
            <DishCard key={d.id} d={d} onToggle={toggle} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 24px rgba(160,60,0,0.05)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fbf9f5" }}>
                  {["Plat", "Catégorie", "Restaurant", "Ville", "Prix", "Note", "Cmd 30j", "Statut"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const cat = categoryColor(d.category);
                  return (
                    <tr key={d.id} className="hover:bg-[#fbf9f5] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold" style={{ color: "#3D3D3D" }}>{d.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                          {d.category}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color: "#6B7280" }}>{d.restaurant}</span></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color: "#6B7280" }}>{d.city}</span></td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold" style={{ color: "#F57C20", fontFamily: "var(--font-mono), monospace" }}>
                          {formatFcfa(d.priceXaf)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" style={{ color: "#b45309" }} />
                          <span className="text-xs font-bold" style={{ color: "#3D3D3D" }}>{d.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: "#3D3D3D", fontFamily: "var(--font-mono), monospace" }}>{d.orders30d}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggle(d.id)}
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                          style={
                            d.available
                              ? { backgroundColor: "#dcfce7", color: "#166534" }
                              : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                          }
                        >
                          {d.available ? "Disponible" : "Masqué"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
