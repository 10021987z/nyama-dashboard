import { apiClient } from "./api";

/**
 * Admin mutation helpers — try real API, fall back to local mock if endpoint absent.
 * Each function resolves with a synthetic record so the UI stays functional even
 * when the backend is not yet wired.
 */

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
  _mocked?: boolean;
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUser> {
  try {
    const res = await apiClient.post<CreatedUser>("/admin/users", payload);
    return res;
  } catch {
    return {
      id: genId("usr"),
      ...payload,
      createdAt: new Date().toISOString(),
      _mocked: true,
    };
  }
}

export interface CreateRestaurantPayload {
  ownerId: string;
  name: string;
  phone: string;
  city: string;
  neighborhood: string;
  specialty: string;
  hours?: string;
}

export interface CreatedRestaurant {
  id: string;
  name: string;
  phone: string;
  city: string;
  neighborhood: string;
  specialty: string;
  isActive: boolean;
  isVerified: boolean;
  avgRating: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  _mocked?: boolean;
}

export async function createRestaurant(payload: CreateRestaurantPayload): Promise<CreatedRestaurant> {
  try {
    const res = await apiClient.post<CreatedRestaurant>("/admin/restaurants", payload);
    return res;
  } catch {
    return {
      id: genId("rst"),
      name: payload.name,
      phone: payload.phone,
      city: payload.city,
      neighborhood: payload.neighborhood,
      specialty: payload.specialty,
      isActive: true,
      isVerified: false,
      avgRating: 0,
      totalOrders: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
      _mocked: true,
    };
  }
}

export async function patchRestaurant(id: string, patch: Record<string, unknown>): Promise<void> {
  try {
    await apiClient.patch(`/admin/restaurants/${id}`, patch);
  } catch {
    // silent fallback — UI handles state locally
  }
}

export async function patchFleetRider(id: string, patch: Record<string, unknown>): Promise<void> {
  try {
    await apiClient.patch(`/admin/fleet/${id}`, patch);
  } catch {
    // silent fallback
  }
}
