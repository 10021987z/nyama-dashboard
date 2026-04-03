// ── Auth ──────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  role: string;
  phone: string;
  exp: number;
  iat: number;
}

export interface AuthUser {
  sub: string;
  role: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
}

// ── Analytics / KPIs ──────────────────────────────────────────────────────────

export interface DashboardKpis {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalCooks: number;
  totalRiders: number;
  ordersToday: number;
  revenueToday: number;
  avgRating: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  cookName: string;
  riderName?: string;
  status: OrderStatus;
  totalXaf: number;
  deliveryFeeXaf: number;
  items: OrderItem[];
  city: 'Douala' | 'Yaoundé';
  createdAt: string;
  deliveredAt?: string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserRole = 'CLIENT' | 'COOK' | 'RIDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  city?: string;
  neighborhood?: string;
  isActive: boolean;
  totalOrders?: number;
  createdAt: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

// ── Cooks ─────────────────────────────────────────────────────────────────────

export interface Cook {
  id: string;
  name: string;
  phone: string;
  city: string;
  neighborhood?: string;
  specialty?: string;
  avgRating: number;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: string;
}

export interface CooksResponse {
  data: Cook[];
  total: number;
}

// ── Riders ────────────────────────────────────────────────────────────────────

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType?: string;
  plateNumber?: string;
  avgRating: number;
  totalTrips: number;
  totalEarnings: number;
  isOnline: boolean;
  createdAt: string;
}

export interface RidersResponse {
  data: Rider[];
  total: number;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  revenueByCity: { city: string; revenue: number }[];
  topCooks: { name: string; orders: number; revenue: number }[];
  topItems: { name: string; count: number }[];
  ordersByHour: { hour: number; count: number }[];
  retentionRate: number;
  newUsersThisWeek: number;
}
