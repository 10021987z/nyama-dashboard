"use client";

/**
 * Singleton socket.io-client connection to the nyama-api admin namespace.
 *
 * Usage:
 *   const socket = getAdminSocket();
 *   socket.on("order:new", handler);
 *
 * React hook:
 *   useAdminSocketEvent("order:new", (payload) => { ... });
 *
 * Auth: admin JWT read from localStorage (key `nyama_admin_token`). The
 * backend auto-joins admin tokens to the `admin` room. If the socket cannot
 * connect, consumers should fall back to HTTP polling.
 */

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./constants";

function getSocketUrl(): string {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

let socketInstance: Socket | null = null;

export function getAdminSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socketInstance) return socketInstance;

  const token = localStorage.getItem("nyama_admin_token") ?? "";
  socketInstance = io(getSocketUrl(), {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 8000,
    autoConnect: true,
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("[admin-socket] connect_error:", err.message);
  });

  return socketInstance;
}

export function disconnectAdminSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Subscribe to an admin socket event for the lifetime of a component.
 * Automatically unsubscribes on unmount. Safe on SSR.
 */
export function useAdminSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getAdminSocket();
    if (!s) return;
    const fn = (payload: T) => handlerRef.current(payload);
    s.on(event, fn);
    return () => {
      s.off(event, fn);
    };
  }, [event]);
}

// ── Event payload types ─────────────────────────────────────────────────────

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

export const ADMIN_EVENTS = {
  ORDER_NEW: "order:new",
  ORDER_STATUS: "order:status",
  DELIVERY_STATUS: "delivery:status",
  RIDER_LOCATION: "rider:location",
  RIDER_STATUS: "rider:status",
  MENU_UPDATED: "menu:updated",
  PAYMENT_NEW: "payment:new",
  CHAT_MESSAGE: "chat:message",
  RESTAURANT_UPDATE: "restaurant:update",
  ALERT_NEW: "alert:new",
} as const;
