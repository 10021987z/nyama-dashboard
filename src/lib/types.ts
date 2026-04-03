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

// ── Restaurants ───────────────────────────────────────────────────────────────

export interface Restaurant {
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

export interface RestaurantsResponse {
  data: Restaurant[];
  total: number;
  page?: number;
  limit?: number;
}

// ── Deliveries ────────────────────────────────────────────────────────────────

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'failed';

export interface Delivery {
  id: string;
  orderId: string;
  clientName: string;
  clientPhone: string;
  riderName?: string;
  riderPhone?: string;
  status: DeliveryStatus;
  totalXaf: number;
  deliveryFeeXaf: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  city: string;
  neighborhood?: string;
  createdAt: string;
  deliveredAt?: string;
  estimatedMinutes?: number;
}

export interface DeliveriesResponse {
  data: Delivery[];
  total: number;
  page?: number;
  limit?: number;
}

// ── Fleet ─────────────────────────────────────────────────────────────────────

export type RiderStatus = 'online' | 'delivering' | 'offline';

export interface FleetRider {
  id: string;
  name: string;
  phone: string;
  vehicleType?: string;
  plateNumber?: string;
  status?: RiderStatus;
  isOnline: boolean;
  currentDeliveryId?: string;
  avgRating: number;
  totalTrips: number;
  totalEarnings: number;
  city?: string;
  neighborhood?: string;
  createdAt: string;
}

export interface FleetResponse {
  data: FleetRider[];
  total: number;
  online?: number;
  delivering?: number;
  offline?: number;
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  role: string;
  quarter?: { name: string; city: string } | string;
  createdAt: string;
  totalOrders: number;
  totalSpentXaf: number;
  lastOrderAt?: string;
  status: 'ACTIF' | 'INACTIF';
}

export interface CustomerStats {
  totalClients: number;
  activeClients30d: number;
  newClientsThisMonth: number;
  retentionRate: number;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: CustomerStats;
}

// ── Marketing ────────────────────────────────────────────────────────────────

export interface MarketingStats {
  conversionRate: number;
  activeCoupons: number;
  pushReach: number;
  marketingRevenue: number;
}

export interface Influencer {
  id: string;
  name: string;
  type: string;
  code: string;
  uses: number;
  revenue: number;
  trend: number;
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  icon?: string;
  expiresAt: string;
  uses: number;
}

export interface Campaign {
  id: string;
  date: string;
  message: string;
  audience: number;
  openRate: number;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  code?: string;
  action?: string;
}

export interface MarketingOverview {
  stats: MarketingStats;
  influencers: Influencer[];
  promotions: Promotion[];
  campaigns: Campaign[];
  calendarEvents: CalendarEvent[];
}

// ── Support ──────────────────────────────────────────────────────────────────

export interface SupportStats {
  openTickets: number;
  avgResolutionHours: number;
  satisfactionRate: number;
  refundsXaf: number;
}

export interface TicketMessage {
  sender: 'client' | 'support';
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  clientName: string;
  clientCity: string;
  restaurant: string;
  motif: string;
  severity: 'HAUT' | 'MOYEN' | 'FAIBLE';
  status: string;
  orderId?: string;
  totalXaf?: number;
  paymentMethod?: string;
  messages: TicketMessage[];
  createdAt: string;
}

export interface CriticalReview {
  id: string;
  clientName: string;
  cookRating: number;
  comment: string;
  restaurant: string;
  createdAt: string;
}

export interface SupportOverview {
  stats: SupportStats;
  tickets: SupportTicket[];
  criticalReviews: CriticalReview[];
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
