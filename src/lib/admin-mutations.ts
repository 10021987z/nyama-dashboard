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
