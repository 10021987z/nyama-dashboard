/**
 * Catalog des permissions granulaires NYAMA dashboard.
 *
 * Format : `feature:action` — `read` (consulter) ou `write` (modifier).
 * Étendre ce catalog quand tu ajoutes une nouvelle feature au dashboard.
 *
 * Règles :
 *  - SUPER_ADMIN bypass tout (la fonction `hasPermission` retourne true).
 *  - Les autres rôles ont accès aux permissions explicitement listées dans
 *    leur AdminAccount.permissions.
 *  - Une UI ne devrait JAMAIS hardcoder un rôle — toujours passer par
 *    `hasPermission(user, 'feature:action')`.
 */

export const PERMISSION_CATALOG = {
  // Vue d'ensemble
  'dashboard:read': 'Voir le tableau de bord principal',
  'analytics:read': 'Voir les analytics et KPIs',
  'analytics:export': 'Exporter les rapports analytics',

  // Commandes
  'orders:read': 'Voir les commandes',
  'orders:write': 'Annuler ou forcer une commande (admin)',

  // Restaurants / Cuisinières
  'restaurants:read': 'Voir les restaurants',
  'restaurants:write': 'Vérifier, suspendre, modifier les restaurants',
  'menu:read': 'Voir les menus de toutes les cuisinières',
  'menu:write': 'Modifier les menus depuis le dashboard',

  // Flotte / Livreurs
  'fleet:read': 'Voir la flotte de livreurs',
  'fleet:write': 'Suspendre ou modifier les livreurs',

  // Clients
  'users:read': 'Voir les clients',
  'users:write': 'Modifier les comptes clients',
  'customers:read': 'Voir la fiche client détaillée',

  // Finances
  'finances:read': 'Voir les finances et revenus',
  'finances:write': 'Modifier les paramètres finances',
  'finances:export': 'Exporter les rapports finances (CSV/Excel/PDF)',

  // Support / Litiges
  'support:read': 'Voir les tickets support',
  'support:write': 'Répondre aux tickets',
  'disputes:read': 'Voir les litiges',
  'disputes:write': 'Résoudre, escalader, refund les litiges',

  // Marketing / Communications
  'marketing:read': 'Voir les campagnes marketing',
  'marketing:write': 'Lancer ou modifier des campagnes',
  'communications:read': 'Voir les notifications/messages envoyés',
  'communications:write': 'Envoyer des messages broadcast',

  // Partenariats / Onboarding
  'partnerships:read': 'Voir les candidatures partenaires',
  'partnerships:write': 'Approuver/rejeter les candidatures',
  'partners:read': 'Voir les partenaires actifs',
  'partners:write': 'Modifier les partenaires actifs',

  // Crisis / Field Ops / Heatmap
  'crisis:read': 'Voir le centre de crise',
  'crisis:write': 'Déclencher des actions de crise',
  'heatmap:read': 'Voir la heatmap',
  'field_ops:read': 'Voir les opérations terrain',
  'field_ops:write': 'Modifier les opérations terrain',

  // Reports
  'reports:read': 'Voir les rapports',
  'reports:write': 'Générer/exporter de nouveaux rapports',

  // AI / experiments
  'ai_insights:read': 'Voir les insights IA',
  'ab_testing:read': 'Voir les A/B tests',
  'ab_testing:write': 'Créer ou modifier les A/B tests',

  // Gamification
  'gamification:read': 'Voir gamification',
  'gamification:write': 'Modifier gamification',

  // Apps / distribution
  'apps:read': 'Voir le centre apps',
  'apps:write': 'Publier une nouvelle version d\'app',

  // Gestion des admins (méta — réservé SUPER_ADMIN dans le code)
  'admins:read': 'Voir la liste des admins',
  'admins:write': 'Créer, modifier, désactiver les admins',

  // Settings système
  'settings:read': 'Voir les paramètres système',
  'settings:write': 'Modifier les paramètres système',
} as const;

export type Permission = keyof typeof PERMISSION_CATALOG;

export const ALL_PERMISSIONS: Permission[] = Object.keys(
  PERMISSION_CATALOG,
) as Permission[];

/**
 * Préset de permissions par rôle hérité (utile pour bootstraper un admin
 * sans tout cliquer manuellement).
 *
 * - SUPER_ADMIN : toutes (mais bypass complet via `hasPermission`)
 * - ADMIN : tout sauf gestion d'autres admins
 * - MODERATOR : lecture + write sur opérations terrain (orders, support,
 *   disputes, fleet, partnerships) — pas de finances/admins/settings.
 * - VIEWER : tout en read-only.
 */
export const PERMISSION_PRESETS: Record<string, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS, // ignoré côté guard (bypass)
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== 'admins:write'),
  MODERATOR: [
    'dashboard:read',
    'analytics:read',
    'orders:read',
    'orders:write',
    'restaurants:read',
    'fleet:read',
    'fleet:write',
    'users:read',
    'customers:read',
    'support:read',
    'support:write',
    'disputes:read',
    'disputes:write',
    'partnerships:read',
    'partnerships:write',
    'partners:read',
    'crisis:read',
    'heatmap:read',
    'field_ops:read',
    'field_ops:write',
    'reports:read',
    'communications:read',
  ],
  VIEWER: ALL_PERMISSIONS.filter((p) => p.endsWith(':read')),
};

/**
 * Permission groupée par "section" pour l'UI checkbox tree.
 */
export const PERMISSION_GROUPS: Array<{
  label: string;
  permissions: Permission[];
}> = [
  {
    label: 'Vue d\'ensemble',
    permissions: ['dashboard:read', 'analytics:read', 'analytics:export'],
  },
  { label: 'Commandes', permissions: ['orders:read', 'orders:write'] },
  {
    label: 'Restaurants & Menu',
    permissions: ['restaurants:read', 'restaurants:write', 'menu:read', 'menu:write'],
  },
  { label: 'Flotte', permissions: ['fleet:read', 'fleet:write'] },
  {
    label: 'Clients',
    permissions: ['users:read', 'users:write', 'customers:read'],
  },
  {
    label: 'Finances',
    permissions: ['finances:read', 'finances:write', 'finances:export'],
  },
  {
    label: 'Support & Litiges',
    permissions: [
      'support:read',
      'support:write',
      'disputes:read',
      'disputes:write',
    ],
  },
  {
    label: 'Marketing & Communications',
    permissions: [
      'marketing:read',
      'marketing:write',
      'communications:read',
      'communications:write',
    ],
  },
  {
    label: 'Partenariats',
    permissions: [
      'partnerships:read',
      'partnerships:write',
      'partners:read',
      'partners:write',
    ],
  },
  {
    label: 'Opérations terrain',
    permissions: [
      'crisis:read',
      'crisis:write',
      'heatmap:read',
      'field_ops:read',
      'field_ops:write',
    ],
  },
  { label: 'Reports', permissions: ['reports:read', 'reports:write'] },
  {
    label: 'AI & A/B testing',
    permissions: [
      'ai_insights:read',
      'ab_testing:read',
      'ab_testing:write',
      'gamification:read',
      'gamification:write',
    ],
  },
  { label: 'Apps', permissions: ['apps:read', 'apps:write'] },
  {
    label: 'Admin (réservé SUPER_ADMIN)',
    permissions: ['admins:read', 'admins:write', 'settings:read', 'settings:write'],
  },
];

/**
 * Retourne true si l'admin a la permission demandée.
 * SUPER_ADMIN bypass tout.
 */
export function hasPermission(
  user: { adminRole?: string; permissions?: string[] } | null | undefined,
  perm: Permission,
): boolean {
  if (!user) return false;
  if (user.adminRole === 'SUPER_ADMIN') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(perm);
}

export function hasAnyPermission(
  user: { adminRole?: string; permissions?: string[] } | null | undefined,
  perms: Permission[],
): boolean {
  if (!user) return false;
  if (user.adminRole === 'SUPER_ADMIN') return true;
  if (!Array.isArray(user.permissions)) return false;
  return perms.some((p) => user.permissions!.includes(p));
}

/** Validation : rejette tout string non présent dans le catalog. */
export function sanitizePermissions(input: unknown): Permission[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set<string>(ALL_PERMISSIONS);
  return input.filter(
    (p): p is Permission => typeof p === 'string' && valid.has(p),
  );
}
