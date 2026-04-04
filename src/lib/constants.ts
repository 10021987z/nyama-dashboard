export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// ── Brand colors ──────────────────────────────────────────────────────────────
export const NYAMA_TERRACOTTA = "#a03c00";
export const NYAMA_TERRACOTTA_CONTAINER = "#c94d00";
export const NYAMA_LEAF = "#2c694e";
export const NYAMA_EARTHY = "#8b4c11";
export const NYAMA_SURFACE = "#fbf9f5";
export const NYAMA_SURFACE_LOW = "#f5f3ef";
export const NYAMA_ON_SURFACE = "#1b1c1a";

export const CHART_COLORS = {
  terracotta: NYAMA_TERRACOTTA,
  terracottaLight: "#e8c4b0",
  leaf: NYAMA_LEAF,
  earthy: NYAMA_EARTHY,
  blue: "#2563eb",
  amber: "#b45309",
};

// ── Navigation ────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/dashboard/restaurants", label: "Restaurants", emoji: "🍽️" },
  { href: "/dashboard/orders", label: "Commandes", emoji: "📦" },
  { href: "/dashboard/deliveries", label: "Deliveries", emoji: "🚚" },
  { href: "/dashboard/fleet", label: "Fleet", emoji: "🏍️" },
  { href: "/dashboard/customers", label: "Customers", emoji: "👥" },
  { href: "/dashboard/marketing", label: "Marketing", emoji: "📢" },
  { href: "/dashboard/support", label: "Support", emoji: "💬" },
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙️" },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Vue Exécutive",
  "/dashboard/restaurants": "Restaurants",
  "/dashboard/orders": "Commandes",
  "/dashboard/deliveries": "Deliveries",
  "/dashboard/fleet": "Fleet",
  "/dashboard/customers": "Customers",
  "/dashboard/users": "Utilisateurs",
  "/dashboard/cooks": "Cuisinières",
  "/dashboard/riders": "Livreurs",
  "/dashboard/analytics": "Analytics",
  "/dashboard/marketing": "Marketing",
  "/dashboard/support": "Support",
  "/dashboard/settings": "Settings",
};
