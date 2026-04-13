"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bike,
  Megaphone,
  MessageSquare,
  Package,
  Scale,
  Search,
  Settings,
  Truck,
  UserCheck,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type {
  Order,
  OrdersResponse,
  Restaurant,
  RestaurantsResponse,
  User,
  UsersResponse,
} from "@/lib/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_COMMANDS = [
  { href: "/dashboard", icon: BarChart3, label: "Vue Executive" },
  { href: "/dashboard/restaurants", icon: UtensilsCrossed, label: "Restaurants" },
  { href: "/dashboard/orders", icon: Package, label: "Commandes" },
  { href: "/dashboard/deliveries", icon: Truck, label: "Livraisons" },
  { href: "/dashboard/fleet", icon: Bike, label: "Flotte (Livreurs)" },
  { href: "/dashboard/customers", icon: Users, label: "Clients" },
  { href: "/dashboard/marketing", icon: Megaphone, label: "Marketing" },
  { href: "/dashboard/disputes", icon: Scale, label: "Litiges" },
  { href: "/dashboard/partners", icon: UserCheck, label: "Validation Partenaires" },
  { href: "/dashboard/support", icon: MessageSquare, label: "Support" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    orders: Order[];
    restaurants: Restaurant[];
    users: User[];
  }>({ orders: [], restaurants: [], users: [] });
  const [loading, setLoading] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ orders: [], restaurants: [], users: [] });
    }
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ orders: [], restaurants: [], users: [] });
      return;
    }
    setLoading(true);
    try {
      const empty = { data: [], total: 0, page: 1, limit: 5 };
      const [o, r, u] = await Promise.all([
        apiClient.get<OrdersResponse>("/admin/orders", { search: q, limit: 5 }).catch(() => empty as OrdersResponse),
        apiClient.get<RestaurantsResponse>("/admin/restaurants", { search: q, limit: 5 }).catch(() => empty as unknown as RestaurantsResponse),
        apiClient.get<UsersResponse>("/admin/users", { search: q, limit: 5 }).catch(() => empty as unknown as UsersResponse),
      ]);
      setResults({
        orders: o.data ?? [],
        restaurants: r.data ?? [],
        users: u.data ?? [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 250);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const navMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_COMMANDS;
    return NAV_COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  const go = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "#f5f3ef" }}
        >
          <Search className="h-4 w-4" style={{ color: "#6B7280" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Rechercher commandes, restaurants, clients, pages…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#3D3D3D" }}
          />
          <kbd
            className="hidden sm:inline-block text-[10px] font-semibold rounded border px-1.5 py-0.5"
            style={{ color: "#6B7280", borderColor: "#f5f3ef" }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {/* Pages */}
          {navMatches.length > 0 && (
            <Section title="Pages">
              {navMatches.map((c) => (
                <Row
                  key={c.href}
                  icon={<c.icon className="h-4 w-4" style={{ color: "#F57C20" }} />}
                  label={c.label}
                  onClick={() => go(c.href)}
                />
              ))}
            </Section>
          )}

          {loading && (
            <p className="px-4 py-2 text-xs" style={{ color: "#6B7280" }}>
              Recherche…
            </p>
          )}

          {results.orders.length > 0 && (
            <Section title="Commandes">
              {results.orders.map((o) => (
                <Row
                  key={o.id}
                  icon={<Package className="h-4 w-4" style={{ color: "#6B7280" }} />}
                  label={`#${o.id} — ${o.clientName}`}
                  meta={o.status}
                  onClick={() => go("/dashboard/orders")}
                />
              ))}
            </Section>
          )}

          {results.restaurants.length > 0 && (
            <Section title="Restaurants">
              {results.restaurants.map((r) => (
                <Row
                  key={r.id}
                  icon={<UtensilsCrossed className="h-4 w-4" style={{ color: "#6B7280" }} />}
                  label={r.name}
                  onClick={() => go("/dashboard/restaurants")}
                />
              ))}
            </Section>
          )}

          {results.users.length > 0 && (
            <Section title="Clients">
              {results.users.map((u) => (
                <Row
                  key={u.id}
                  icon={<Users className="h-4 w-4" style={{ color: "#6B7280" }} />}
                  label={u.name}
                  meta={u.phone}
                  onClick={() => go("/dashboard/customers")}
                />
              ))}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-[10px]"
          style={{ borderColor: "#f5f3ef", color: "#6B7280" }}
        >
          <span>Recherche globale NYAMA</span>
          <span>
            <kbd className="font-semibold">⌘K</kbd> pour ouvrir / fermer
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p
        className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "#6B7280" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  icon,
  label,
  meta,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[#f5f3ef] transition-colors"
      style={{ color: "#3D3D3D" }}
    >
      {icon}
      <span className="flex-1 text-left truncate">{label}</span>
      {meta && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#f5f3ef", color: "#6B7280" }}
        >
          {meta}
        </span>
      )}
    </button>
  );
}
