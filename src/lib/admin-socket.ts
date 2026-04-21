"use client";

/**
 * Singleton socket.io-client connection to the nyama-api admin namespace.
 *
 * Usage:
 *   const socket = getAdminSocket();
 *   socket.on("order:new", handler);
 *
 * Auth: the admin JWT is read from localStorage (key `nyama_admin_token`).
 * The backend auto-joins admin tokens to the `admin` room.
 *
 * Agent A is wiring the emitter side on the API. If the socket can't connect
 * (404, auth failure, etc.) the consumer should fall back to HTTP polling —
 * see `useConnectionStatus` in the dashboard page.
 */

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./constants";

// Strip `/api/v1` suffix to get the socket.io server origin.
function getSocketUrl(): string {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

let socketInstance: Socket | null = null;

export function getAdminSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("admin-socket must only be initialised on the client");
  }
  if (socketInstance) return socketInstance;

  const token = localStorage.getItem("nyama_admin_token") ?? "";
  socketInstance = io(getSocketUrl(), {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 8000,
    autoConnect: true,
  });

  return socketInstance;
}

export function disconnectAdminSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

// ── Event payload types (match contract from Agent A) ────────────────────────

export type ConnectionState = "connected" | "polling" | "offline";

export interface LiveOverview {
  activeClients: number;
  activeRiders: number;
  activeCooks: number;
  ordersInProgress: Record<string, number>;
  todayRevenue: number;
  todayOrdersCount: number;
  avgDeliveryTime: number;
  peakHourPrediction?: string;
}

export interface LiveRider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "available" | "delivering" | "offline";
  currentOrderId?: string;
  avatarUrl?: string;
}

export interface LiveCook {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pendingOrders: number;
  isOpen: boolean;
  avatarUrl?: string;
}

export interface LiveActiveOrder {
  id: string;
  status: string;
  clientName: string;
  clientLat?: number;
  clientLng?: number;
  cookId?: string;
  cookLat?: number;
  cookLng?: number;
  riderId?: string;
  riderLat?: number;
  riderLng?: number;
  totalXaf: number;
  createdAt: string;
  statusChangedAt?: string;
  itemSummary?: string;
}

export interface LiveMap {
  riders: LiveRider[];
  cooks: LiveCook[];
  activeOrders: LiveActiveOrder[];
}

// Event names emitted by the backend (per brief)
export const ADMIN_EVENTS = {
  ORDER_NEW: "order:new",
  ORDER_STATUS: "order:status",
  DELIVERY_STATUS: "delivery:status",
  RIDER_LOCATION: "rider:location",
  MENU_UPDATED: "menu:updated",
} as const;
