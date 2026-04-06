export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// ── Brand colors — Palette officielle NYAMA ──────────────────────────────────
export const NYAMA_ORANGE = "#F57C20";
export const NYAMA_CHARCOAL = "#3D3D3D";
export const NYAMA_CTA_GREEN = "#1B4332";
export const NYAMA_GOLD = "#D4A017";
export const NYAMA_ACCENT_RED = "#E8413C";
export const NYAMA_CREME = "#F5F5F0";
export const NYAMA_SURFACE = "#F5F5F0";
export const NYAMA_SURFACE_LOW = "#EFEFEF";
export const NYAMA_ON_SURFACE = "#3D3D3D";

// Compat aliases
export const NYAMA_TERRACOTTA = NYAMA_ORANGE;
export const NYAMA_TERRACOTTA_CONTAINER = "#E06A10";
export const NYAMA_LEAF = NYAMA_CTA_GREEN;
export const NYAMA_EARTHY = NYAMA_GOLD;

export const CHART_COLORS = {
  orange: NYAMA_ORANGE,
  green: NYAMA_CTA_GREEN,
  gold: NYAMA_GOLD,
  red: NYAMA_ACCENT_RED,
  charcoal: NYAMA_CHARCOAL,
  // Compat
  terracotta: NYAMA_ORANGE,
  terracottaLight: "#F5C49B",
  leaf: NYAMA_CTA_GREEN,
  earthy: NYAMA_GOLD,
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
