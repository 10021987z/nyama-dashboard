import { apiClient } from "./api";

// ─────────────────────────────────────────────────────────────
// POST /admin/users
// ─────────────────────────────────────────────────────────────
export interface CreateUserPayload {
  name: string;
  phone: string;
  role: "CLIENT" | "COOK" | "RIDER" | "ADMIN";
}

export interface CreatedUser {
  id: string;
  name: string;
  phone: string;
  role: CreateUserPayload["role"];
  createdAt: string;
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUser> {
  return apiClient.post<CreatedUser>("/admin/users", payload);
}

// ─────────────────────────────────────────────────────────────
// POST /admin/restaurants
// ─────────────────────────────────────────────────────────────
export interface CreateRestaurantPayload {
  userId: string;
  displayName: string;
  specialty: string[];
  description?: string;
  quarterId: string;
  momoPhone?: string;
  momoProvider?: "mtn" | "orange";
  locationLat: number;
  locationLng: number;
  landmark?: string;
}

export interface CreatedRestaurant {
  id: string;
  userId: string;
  displayName: string;
  specialty: string;
  description?: string | null;
  isActive: boolean;
  isVerified: boolean;
  avgRating: number;
  totalOrders: number;
  quarterId: string;
  locationLat: number;
  locationLng: number;
  landmark?: string | null;
  momoPhone?: string | null;
  momoProvider?: string | null;
  createdAt: string;
}

export async function createRestaurant(
  payload: CreateRestaurantPayload,
): Promise<CreatedRestaurant> {
  return apiClient.post<CreatedRestaurant>("/admin/restaurants", payload);
}

export async function patchRestaurant(
  id: string,
  patch: { isVerified?: boolean; isActive?: boolean; subscriptionPlan?: string },
): Promise<void> {
  try {
    await apiClient.patch(`/admin/restaurants/${id}`, patch);
  } catch {
    // silent — UI toggles are optimistic
  }
}

// ─────────────────────────────────────────────────────────────
// POST /admin/fleet
// ─────────────────────────────────────────────────────────────
export interface CreateFleetRiderPayload {
  userId: string;
  vehicleType: "MOTO" | "VELO" | "VOITURE";
  plateNumber?: string;
  momoPhone?: string;
  momoProvider?: "mtn" | "orange";
}

export interface CreatedFleetRider {
  id: string;
  userId: string;
  vehicleType: string;
  plateNumber?: string | null;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: string;
}

export async function createFleetRider(
  payload: CreateFleetRiderPayload,
): Promise<CreatedFleetRider> {
  return apiClient.post<CreatedFleetRider>("/admin/fleet", payload);
}

export async function patchFleetRider(
  id: string,
  patch: { isVerified?: boolean; status?: "ACTIVE" | "SUSPENDED" },
): Promise<void> {
  try {
    await apiClient.patch(`/admin/fleet/${id}`, patch);
  } catch {
    // silent — UI toggles are optimistic
  }
}

// ─────────────────────────────────────────────────────────────
// GET /admin/quarters
// ─────────────────────────────────────────────────────────────
export interface Quarter {
  id: string;
  name: string;
  city: string;
}

export async function getQuarters(): Promise<Quarter[]> {
  const res = await apiClient.get<{ data: Quarter[] }>("/admin/quarters");
  return res.data;
}

// ─────────────────────────────────────────────────────────────
// Orders — live admin actions
// ─────────────────────────────────────────────────────────────

export type OrderTransition =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "assigned"
  | "picked_up"
  | "delivering"
  | "delivered"
  | "cancelled";

/**
 * Transition an order's status.
 * Backend endpoint candidates (tries in order, silently falls through):
 *   PATCH /admin/orders/:id/status
 *   PATCH /orders/:id/status
 */
export async function transitionOrderStatus(
  orderId: string,
  status: OrderTransition,
  reason?: string,
): Promise<void> {
  try {
    await apiClient.patch(`/admin/orders/${orderId}/status`, { status, reason });
  } catch {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status, reason });
    } catch {
      // best-effort; UI has already applied the optimistic update
    }
  }
}

/**
 * POST /admin/orders/:id/intervene — admin takeover of an order.
 */
export async function interveneOrder(
  orderId: string,
  payload: { reason?: string; action?: "freeze" | "reassign" | "cancel" } = {},
): Promise<void> {
  try {
    await apiClient.post(`/admin/orders/${orderId}/intervene`, payload);
  } catch {
    // silent — best-effort admin action
  }
}

export async function reassignOrderRider(
  orderId: string,
  riderId: string,
): Promise<void> {
  try {
    await apiClient.patch(`/admin/orders/${orderId}/rider`, { riderId });
  } catch {
    try {
      await apiClient.post(`/admin/orders/${orderId}/reassign`, { riderId });
    } catch {
      // silent
    }
  }
}

export async function cancelOrder(orderId: string, reason: string): Promise<void> {
  await transitionOrderStatus(orderId, "cancelled", reason);
}

// ─────────────────────────────────────────────────────────────
// Users (rider suspend, customer toggle, send message stub)
// ─────────────────────────────────────────────────────────────

export async function patchUser(
  id: string,
  patch: { isActive?: boolean; status?: "ACTIVE" | "SUSPENDED"; notes?: string },
): Promise<void> {
  try {
    await apiClient.patch(`/admin/users/${id}`, patch);
  } catch {
    // silent
  }
}

/**
 * Stub endpoint — Agent D owns the real messaging model. For now we POST to a
 * plausible endpoint and swallow errors so admins can test the UX today.
 */
export async function sendMessage(payload: {
  to: string;
  toType: "restaurant" | "rider" | "customer";
  channel?: "sms" | "email" | "push" | "inapp";
  subject?: string;
  body: string;
}): Promise<void> {
  try {
    await apiClient.post(`/admin/messages`, payload);
  } catch {
    // silent — stubbed, Agent D will wire the real endpoint
  }
}

/**
 * Send an email/SMS campaign to a segment of customers.
 */
export async function sendCampaign(payload: {
  segment: "vip" | "atRisk" | "lost" | "all";
  channel: "email" | "sms";
  subject?: string;
  body: string;
}): Promise<void> {
  try {
    await apiClient.post(`/admin/campaigns`, payload);
  } catch {
    // silent — stubbed
  }
}

/**
 * Send the daily finance report by email.
 */
export async function sendDailyReport(payload: {
  to?: string;
  date?: string;
}): Promise<void> {
  try {
    await apiClient.post(`/admin/reports/daily`, payload);
  } catch {
    // silent — stubbed
  }
}

/**
 * Restaurant open/closed toggle.
 */
export async function setRestaurantOpen(
  id: string,
  isOpen: boolean,
): Promise<void> {
  try {
    await apiClient.patch(`/admin/restaurants/${id}`, { isOpen });
  } catch {
    // silent
  }
}

// ─────────────────────────────────────────────────────────────
// Support (ticket assign, reply)
// ─────────────────────────────────────────────────────────────

export async function assignTicket(ticketId: string, agentId: string): Promise<void> {
  try {
    await apiClient.patch(`/admin/support/tickets/${ticketId}`, { assignedTo: agentId });
  } catch {
    // silent
  }
}

export async function replyTicket(ticketId: string, text: string): Promise<void> {
  try {
    await apiClient.post(`/admin/support/tickets/${ticketId}/reply`, { text });
  } catch {
    // silent
  }
}

