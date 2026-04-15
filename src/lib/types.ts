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
  name?: string;
  email?: string;
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
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'assigned'
  | 'picked_up'
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
  acceptedAt?: string;
  readyAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
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
  assignedAt?: string;
  pickedUpAt?: string;
  createdAt?: string;
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

// ── Analytics Revenue ─────────────────────────────────────────────────────────

export interface RevenueStats {
  totalRevenueXaf: number;
  netPlatformXaf: number;
  totalTransactions: number;
  conversionRate: number;
  avgBasketXaf: number;
  revenueTrend: number;
}

export interface WeeklyRevenue {
  week: string;
  grossXaf: number;
  commissionXaf: number;
}

export interface PaymentBreakdown {
  method: string;
  percentage: number;
  color?: string;
}

export interface TopRestaurant {
  id: string;
  displayName: string;
  quarterName: string;
  orders: number;
  revenueXaf: number;
  commissionXaf: number;
}

export interface RevenueAnalytics {
  stats: RevenueStats;
  weeklyRevenue: WeeklyRevenue[];
  paymentBreakdown: PaymentBreakdown[];
  topRestaurants: TopRestaurant[];
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface SystemSettings {
  general: {
    language: string;
    timezone: string;
    currency: string;
  };
  payment: {
    cashOnDelivery: boolean;
    platformCommission: number;
    minimumOrderXaf: number;
  };
  logistics: {
    maxDeliveryRadiusKm: number;
    defaultDeliveryFeeXaf: number;
    enforceOpeningHours: boolean;
  };
  security: {
    mfaEnabled: boolean;
    apiKeyMasked: string;
  };
}

// ── Dashboard (enriched) ─────────────────────────────────────────────────────

export interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalCooks: number;
  totalRiders: number;
  ordersToday: number;
  revenueToday: number;
  avgRating: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  avgBasketXaf: number;
  deliverySuccessRate: number;
  paymentSuccessRate: number;
  newUsersThisMonth: number;
  activeClientsLast30d: number;
  retentionRate: number;
  ordersTrend: number;
  revenueTrend: number;
  hourlyOrders: { hour: string; count: number }[];
  revenueByQuarter: { quarter: string; revenueM: number }[];
  ordersByStatus: { status: string; count: number }[];
  paymentMethodBreakdown: { method: string; count: number }[];
}

// ── Disputes ────────────────────────────────────────────────────────────────

export type DisputeType =
  | 'LATE_DELIVERY'
  | 'WRONG_ORDER'
  | 'MISSING_ITEM'
  | 'FOOD_QUALITY'
  | 'RIDER_BEHAVIOR'
  | 'COOK_BEHAVIOR'
  | 'PAYMENT_ISSUE'
  | 'OTHER';

export type DisputeSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisputeStatusType =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'WAITING_RESPONSE'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export interface DisputeMessage {
  id: string;
  disputeId: string;
  authorId: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  clientId: string;
  cookId?: string;
  riderId?: string;
  type: DisputeType;
  severity: DisputeSeverity;
  status: DisputeStatusType;
  description: string;
  evidence?: string;
  assignedTo?: string;
  resolution?: string;
  refundAmountXaf?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; phone: string; email?: string };
  order?: {
    id: string;
    totalXaf: number;
    status: string;
    paymentMethod?: string;
    cook?: { id: string; name: string };
    items?: { menuItem: { name: string; priceXaf: number }; quantity: number }[];
    payment?: { status: string; amountXaf: number };
  };
  messages?: DisputeMessage[];
  _count?: { messages: number };
}

export interface DisputeStats {
  open: number;
  underReview: number;
  resolved: number;
  escalated: number;
  critical: number;
  refundsXaf: number;
  avgResolutionHours: number;
}

export interface DisputeListResponse {
  items: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Partner Applications ────────────────────────────────────────────────────

export type PartnerType = 'COOK' | 'RIDER';

export type ApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface PartnerApplication {
  id: string;
  userId: string;
  type: PartnerType;
  status: ApplicationStatus;
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  specialties?: string;
  cookingExp?: string;
  kitchenPhotos?: string;
  healthCertUrl?: string;
  vehicleType?: string;
  plateNumber?: string;
  licenseUrl?: string;
  insuranceUrl?: string;
  vehiclePhotos?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; phone: string; email?: string; name?: string; role: string };
}

export interface PartnerStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  pendingCooks: number;
  pendingRiders: number;
}

export interface PartnerListResponse {
  items: PartnerApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Partnerships (public-submitted candidatures) ───────────────────────────

export type PartnershipType = 'COOK' | 'RIDER';

export type PartnershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type KycDocStatus = 'pending' | 'verified' | 'rejected';

export interface Partnership {
  id: string;
  type: PartnershipType;
  status: PartnershipStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  ville?: string;
  quartier?: string;
  // Rider-specific
  vehicleType?: string;
  cniNumber?: string;
  // Cook-specific
  businessName?: string;
  description?: string;
  adminNotes?: string;
  // KYC documents
  idDocumentUrl?: string | null;
  selfieUrl?: string | null;
  licenseUrl?: string | null;
  insuranceUrl?: string | null;
  idDocumentStatus?: KycDocStatus;
  selfieStatus?: KycDocStatus;
  licenseStatus?: KycDocStatus;
  insuranceStatus?: KycDocStatus;
  kycScore?: number;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
}

export interface PartnershipStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface PartnershipListResponse {
  items: Partnership[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Analytics (legacy) ───────────────────────────────────────────────────────

export interface AnalyticsOverview {
  revenueByCity: { city: string; revenue: number }[];
  topCooks: { name: string; orders: number; revenue: number }[];
  topItems: { name: string; count: number }[];
  ordersByHour: { hour: number; count: number }[];
  retentionRate: number;
  newUsersThisWeek: number;
}
