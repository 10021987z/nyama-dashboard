// src/lib/admin-socket.ts
//
// Coordinated contract with Agent B:
//   - Singleton socket.io client connected to the NYAMA API root
//   - Auth token read from `localStorage.nyama_admin_token`
//   - Exported events (subset — backend may expose more):
//       order:new              → new order payload
//       order:status           → { orderId, status } status transition
//       rider:location         → { riderId, lat, lng }
//       rider:status           → { riderId, status }
//       payment:new            → new payment / finance event
//       chat:message           → { ticketId, sender, text, timestamp }
//
// If Agent B replaces this file with a richer implementation later,
// the public API (getAdminSocket, useAdminSocketEvent) stays stable.

"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./constants";

let socket: Socket | null = null;

function getSocketOrigin(): string {
  // API_BASE_URL is e.g. https://host/api/v1 — socket.io connects to the origin
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "https://nyama-api-production.up.railway.app";
  }
}

export function getAdminSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket && socket.connected) return socket;
  if (socket) return socket;

  const token = localStorage.getItem("nyama_admin_token");
  socket = io(getSocketOrigin(), {
    path: "/socket.io",
    auth: token ? { token } : undefined,
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  // Swallow connection errors so that pages don't crash when backend is down
  socket.on("connect_error", (err) => {
    // eslint-disable-next-line no-console
    console.warn("[admin-socket] connect_error:", err.message);
  });

  return socket;
}

export function disconnectAdminSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
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
