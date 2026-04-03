export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const NYAMA_GREEN = '#1B4332';
export const NYAMA_GOLD = '#D4A017';
export const NYAMA_RED = '#DC2626';
export const NYAMA_SUCCESS = '#16A34A';

export const CHART_COLORS = {
  green: NYAMA_GREEN,
  gold: NYAMA_GOLD,
  red: NYAMA_RED,
  success: NYAMA_SUCCESS,
  blue: '#1565C0',
  orange: '#F97316',
  purple: '#7C3AED',
};

export const NAV_ITEMS = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: 'BarChart3' },
  { href: '/dashboard/orders', label: 'Commandes', icon: 'Package' },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: 'Users' },
  { href: '/dashboard/cooks', label: 'Cuisinières', icon: 'ChefHat' },
  { href: '/dashboard/riders', label: 'Livreurs', icon: 'Bike' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'TrendingUp' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: 'Settings' },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/dashboard/orders': 'Commandes & Revenus',
  '/dashboard/users': 'Gestion utilisateurs',
  '/dashboard/cooks': 'Performance cuisinières',
  '/dashboard/riders': 'Performance livreurs',
  '/dashboard/analytics': 'Analytics détaillées',
  '/dashboard/settings': 'Paramètres',
};
