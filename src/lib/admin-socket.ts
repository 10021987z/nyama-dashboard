"use client";

// MOCK: This is a local stub of admin-socket. Agent B is creating the real
// socket.io client wrapper. Once merged, the exports here should be replaced
// by the shared implementation or this file deleted.
// Contract:
//  - `getAdminSocket()` returns a socket.io-client compatible object with
//    `.on(event, handler)` and `.off(event, handler)`.
//  - The real implementation will connect to the backend real-time layer.
//  - Events of interest for Agent D: "alert:new", "order:new",
//    "incident:new", "message:new".

import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./constants";

let socket: Socket | null = null;

function deriveSocketUrl(): string {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

export function getAdminSocket(): Socket {
  if (socket) return socket;
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("nyama_admin_token");
  socket = io(deriveSocketUrl(), {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    auth: token ? { token } : undefined,
    reconnection: true,
  });
  return socket;
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
