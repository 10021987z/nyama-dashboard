/**
 * Mock data for the command-center dashboard. Used as a fallback when
 * Agent A's `/admin/live/*` endpoints aren't deployed yet.
 *
 * Swapping to real data is a one-line change in the hook:
 *   `useLiveOverview()` / `useLiveMap()`.
 */

import type { LiveMap, LiveOverview, LiveActiveOrder } from "./admin-socket";

// Douala approx bounding box
const DOUALA = { lat: 4.048, lng: 9.7085 };

function jitter(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

export function mockOverview(): LiveOverview {
  return {
    activeClients: 142,
    activeRiders: 18,
    activeCooks: 21,
    ordersInProgress: {
      pending: 4,
      confirmed: 3,
      preparing: 7,
      ready: 2,
      assigned: 3,
      picked_up: 2,
      delivering: 5,
    },
    todayRevenue: 68_500,
    todayOrdersCount: 54,
    avgDeliveryTime: 28,
    peakHourPrediction: "19h–21h",
  };
}

const COOK_NAMES = [
  "Chez Mama Ngono",
  "Le Ndolé d'Or",
  "Saveurs Akwa",
  "Poulet DG Express",
  "Bonapriso Bites",
  "Yaoundé Maggi",
  "Grill Bonanjo",
];

const RIDER_NAMES = [
  "Kouassi M.",
  "Amina T.",
  "Patrick B.",
  "Désiré N.",
  "Fabrice K.",
  "Yolande E.",
  "Serge D.",
  "Rose M.",
];

const CLIENT_NAMES = [
  "Fabrice",
  "Catherine",
  "Aïcha",
  "Didier",
  "Brigitte",
  "Emmanuel",
  "Nadège",
];

const ITEMS = [
  "Ndolé complet",
  "Poulet DG",
  "Poisson braisé",
  "Eru",
  "Koki",
  "Achu",
  "Mbongo tchobi",
];

export function mockMap(): LiveMap {
  const cooks = COOK_NAMES.map((name, i) => ({
    id: `cook-${i}`,
    name,
    lat: jitter(DOUALA.lat, 0.05),
    lng: jitter(DOUALA.lng, 0.08),
    pendingOrders: Math.floor(Math.random() * 5),
    isOpen: Math.random() > 0.15,
  }));

  const riders = RIDER_NAMES.map((name, i) => {
    const statuses: Array<"available" | "delivering" | "offline"> = [
      "available",
      "delivering",
      "delivering",
      "available",
      "offline",
    ];
    return {
      id: `rider-${i}`,
      name,
      lat: jitter(DOUALA.lat, 0.05),
      lng: jitter(DOUALA.lng, 0.08),
      status: statuses[i % statuses.length],
    };
  });

  const orders: LiveActiveOrder[] = Array.from({ length: 9 }, (_, i) => {
    const cook = cooks[i % cooks.length];
    const rider = i % 2 === 0 ? riders[i % riders.length] : undefined;
    const status = (
      ["pending", "preparing", "ready", "delivering", "picked_up"] as const
    )[i % 5];
    const createdMinAgo = 2 + i * 3;
    const statusChangedAgo = createdMinAgo - Math.floor(Math.random() * 5);
    return {
      id: `ORD-${8400 + i}`,
      status,
      clientName: CLIENT_NAMES[i % CLIENT_NAMES.length],
      clientLat: jitter(DOUALA.lat, 0.06),
      clientLng: jitter(DOUALA.lng, 0.09),
      cookId: cook.id,
      cookLat: cook.lat,
      cookLng: cook.lng,
      riderId: rider?.id,
      riderLat: rider?.lat,
      riderLng: rider?.lng,
      totalXaf: 2500 + Math.floor(Math.random() * 15_000),
      createdAt: new Date(Date.now() - createdMinAgo * 60_000).toISOString(),
      statusChangedAt: new Date(
        Date.now() - Math.max(1, statusChangedAgo) * 60_000,
      ).toISOString(),
      itemSummary: ITEMS[i % ITEMS.length],
    };
  });

  return { riders, cooks, activeOrders: orders };
}

// Seed event feed with some plausible recent history
export interface FeedEvent {
  id: string;
  timestamp: string;
  category: "order" | "transaction" | "signup" | "error";
  icon: string;
  actor: string;
  action: string;
  amountXaf?: number;
  orderId?: string;
}

export function mockFeedSeed(): FeedEvent[] {
  const now = Date.now();
  return [
    {
      id: "e1",
      timestamp: new Date(now - 2 * 60_000).toISOString(),
      category: "order",
      icon: "🍱",
      actor: "Fabrice",
      action: "a commandé Ndolé chez Catherine",
      amountXaf: 2500,
      orderId: "ORD-8401",
    },
    {
      id: "e2",
      timestamp: new Date(now - 4 * 60_000).toISOString(),
      category: "transaction",
      icon: "💳",
      actor: "Orange Money",
      action: "a validé le paiement ORD-8399",
      amountXaf: 8500,
      orderId: "ORD-8399",
    },
    {
      id: "e3",
      timestamp: new Date(now - 7 * 60_000).toISOString(),
      category: "signup",
      icon: "👋",
      actor: "Marie K.",
      action: "vient de créer son compte",
    },
    {
      id: "e4",
      timestamp: new Date(now - 10 * 60_000).toISOString(),
      category: "order",
      icon: "🛵",
      actor: "Kouassi M.",
      action: "a pris en charge ORD-8395",
      orderId: "ORD-8395",
    },
    {
      id: "e5",
      timestamp: new Date(now - 14 * 60_000).toISOString(),
      category: "error",
      icon: "⚠️",
      actor: "Saveurs Akwa",
      action: "est hors ligne depuis 25 min",
    },
    {
      id: "e6",
      timestamp: new Date(now - 22 * 60_000).toISOString(),
      category: "order",
      icon: "✅",
      actor: "Amina T.",
      action: "a livré ORD-8391 à Bonapriso",
      amountXaf: 12_000,
      orderId: "ORD-8391",
    },
  ];
}
