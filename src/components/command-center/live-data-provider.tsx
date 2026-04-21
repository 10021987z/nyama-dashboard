"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ADMIN_EVENTS,
  getAdminSocket,
  type ConnectionState,
  type LiveMap,
  type LiveOverview,
} from "@/lib/admin-socket";
import { apiClient } from "@/lib/api";
import {
  mockFeedSeed,
  mockMap,
  mockOverview,
  type FeedEvent,
} from "@/lib/command-center-mock";

interface LiveDataContext {
  overview: LiveOverview;
  map: LiveMap;
  feed: FeedEvent[];
  connection: ConnectionState;
  refresh: () => Promise<void>;
}

const Ctx = createContext<LiveDataContext | null>(null);

/**
 * Central provider that hydrates the command center.
 *
 * Strategy:
 *   1. Seed with mock data so the UI renders immediately.
 *   2. Try to fetch `/admin/live/overview` + `/admin/live/map` — if those
 *      succeed, replace the mock. If they fail (404 while Agent A is still
 *      shipping), stay on mock but keep polling softly.
 *   3. Open the admin socket; if it connects, switch connection state to
 *      "connected" and apply updates via events. Otherwise fall back to
 *      polling every 5s.
 */
export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [overview, setOverview] = useState<LiveOverview>(() => mockOverview());
  const [map, setMap] = useState<LiveMap>(() => mockMap());
  const [feed, setFeed] = useState<FeedEvent[]>(() => mockFeedSeed());
  const [connection, setConnection] = useState<ConnectionState>("offline");

  // keep latest setters in refs to avoid tearing down the socket on every render
  const feedRef = useRef(feed);
  feedRef.current = feed;

  const fetchLive = useCallback(async () => {
    try {
      const [o, m] = await Promise.all([
        apiClient.get<LiveOverview>("/admin/live/overview").catch(() => null),
        apiClient.get<LiveMap>("/admin/live/map").catch(() => null),
      ]);
      if (o) setOverview(o);
      if (m) setMap(m);
      return { ok: Boolean(o || m) };
    } catch {
      return { ok: false };
    }
  }, []);

  // ── Polling fallback (always on; throttles down if socket is connected) ──
  useEffect(() => {
    let stopped = false;
    let handle: ReturnType<typeof setTimeout> | null = null;

    async function loop() {
      if (stopped) return;
      const { ok } = await fetchLive();
      if (!stopped) {
        setConnection((prev) => {
          if (prev === "connected") return prev;
          return ok ? "polling" : "offline";
        });
      }
      if (!stopped) {
        // poll every 5s when socket inactive, every 30s when socket live
        const delay = connection === "connected" ? 30_000 : 5_000;
        handle = setTimeout(loop, delay);
      }
    }
    loop();
    return () => {
      stopped = true;
      if (handle) clearTimeout(handle);
    };
  }, [fetchLive, connection]);

  // ── Socket wiring ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("nyama_admin_token");
    if (!token) {
      // no token → no socket — stick to polling
      return;
    }

    let socket: ReturnType<typeof getAdminSocket> | null = null;
    try {
      socket = getAdminSocket();
    } catch {
      return;
    }

    const onConnect = () => setConnection("connected");
    const onDisconnect = () =>
      setConnection((prev) => (prev === "connected" ? "polling" : prev));

    const pushEvent = (evt: FeedEvent) => {
      setFeed((prev) => [evt, ...prev].slice(0, 200));
    };

    const onOrderNew = (payload: {
      id: string;
      clientName?: string;
      cookName?: string;
      totalXaf?: number;
      itemSummary?: string;
    }) => {
      pushEvent({
        id: `on-${payload.id}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: "order",
        icon: "🍱",
        actor: payload.clientName ?? "Client",
        action: `a commandé ${payload.itemSummary ?? "une commande"} chez ${payload.cookName ?? "un resto"}`,
        amountXaf: payload.totalXaf,
        orderId: payload.id,
      });
      // trigger a refetch of the map to capture the new order marker
      fetchLive();
    };

    const onOrderStatus = (payload: {
      id: string;
      status: string;
      clientName?: string;
    }) => {
      pushEvent({
        id: `os-${payload.id}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: "order",
        icon: "🔁",
        actor: payload.clientName ?? payload.id,
        action: `→ ${payload.status}`,
        orderId: payload.id,
      });
      setMap((prev) => ({
        ...prev,
        activeOrders: prev.activeOrders.map((o) =>
          o.id === payload.id
            ? { ...o, status: payload.status, statusChangedAt: new Date().toISOString() }
            : o,
        ),
      }));
    };

    const onDeliveryStatus = (payload: {
      orderId: string;
      status: string;
      riderName?: string;
    }) => {
      pushEvent({
        id: `ds-${payload.orderId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: "order",
        icon: "🛵",
        actor: payload.riderName ?? "Livreur",
        action: `${payload.status} ${payload.orderId}`,
        orderId: payload.orderId,
      });
    };

    const onRiderLocation = (payload: {
      id: string;
      lat: number;
      lng: number;
    }) => {
      setMap((prev) => ({
        ...prev,
        riders: prev.riders.map((r) =>
          r.id === payload.id ? { ...r, lat: payload.lat, lng: payload.lng } : r,
        ),
      }));
    };

    const onMenuUpdated = (payload: { cookId: string; cookName?: string }) => {
      pushEvent({
        id: `mu-${payload.cookId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: "order",
        icon: "📝",
        actor: payload.cookName ?? payload.cookId,
        action: "a mis à jour son menu",
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(ADMIN_EVENTS.ORDER_NEW, onOrderNew);
    socket.on(ADMIN_EVENTS.ORDER_STATUS, onOrderStatus);
    socket.on(ADMIN_EVENTS.DELIVERY_STATUS, onDeliveryStatus);
    socket.on(ADMIN_EVENTS.RIDER_LOCATION, onRiderLocation);
    socket.on(ADMIN_EVENTS.MENU_UPDATED, onMenuUpdated);

    return () => {
      if (!socket) return;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(ADMIN_EVENTS.ORDER_NEW, onOrderNew);
      socket.off(ADMIN_EVENTS.ORDER_STATUS, onOrderStatus);
      socket.off(ADMIN_EVENTS.DELIVERY_STATUS, onDeliveryStatus);
      socket.off(ADMIN_EVENTS.RIDER_LOCATION, onRiderLocation);
      socket.off(ADMIN_EVENTS.MENU_UPDATED, onMenuUpdated);
    };
  }, [fetchLive]);

  const value = useMemo<LiveDataContext>(
    () => ({
      overview,
      map,
      feed,
      connection,
      refresh: async () => {
        await fetchLive();
      },
    }),
    [overview, map, feed, connection, fetchLive],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLiveData(): LiveDataContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLiveData must be used inside LiveDataProvider");
  return ctx;
}
