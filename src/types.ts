export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  subscriptionId?: string; // If subscribed to a club plan
  subscriptionStartDate?: string;
  subscriptionOrderNsu?: string;
  order_nsu?: string; // InfinitePay order_nsu identifier
  subscriptionPaymentNsu?: string;
  status?: 'PROCESSED' | 'PENDING' | 'CANCELLED' | string; // User/Subscription status (PROCESSED gives access)
  subscriptionStatus?: 'PROCESSED' | 'PENDING' | 'CANCELLED' | string;
  pendingPlanId?: string;
  pendingOrderNsu?: string;
  lastCheckoutAt?: string;
  createdAt: string;
}

export interface BarberService {
  id: string;
  name: string;
  category: 'Cabelo' | 'Barba' | 'Combo' | 'Tratamento' | 'Outros';
  price: number;
  durationMinutes: number; // e.g. 30, 45, 60
  description: string;
  isActive: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  includedServicesDescription: string;
  maxBookingsPerMonth: number; // -1 for unlimited
  discountPercentageOnOthers: number; // e.g. 15% discount on products/extras
  popular?: boolean;
  infinitePayUrl?: string; // Link de pagamento da carteira digital InfinitePay
  isActive?: boolean; // Se está visível/ativo para contratação
}

export interface InfinitePayConfig {
  merchantName: string;
  defaultUrl: string; // URL padrão ou carteira digital InfinitePay
  enabled: boolean;
  notes?: string;
  serverWebhookUrl?: string; // URL do servidor backend para receber POST da InfinitePay
}

export interface InfinitePayWebhookEvent {
  id: string;
  userId?: string;
  invoice_slug?: string;
  order_nsu: string;
  paid_amount?: number;
  capture_method?: string;
  transaction_nsu?: string;
  receipt_url?: string;
  receivedAt: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  rawBody?: any;
}

export type BookingStatus = 'AGENDADO' | 'EXECUTADO' | 'CANCELADO' | 'NAO_COMPARECEU';
export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'ASSINATURA_CLUBE' | 'PENDENTE';

export type RecurrenceType = 'SINGLE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  cancelReason?: string;
  cancelledAt?: string;
  notes?: string;
  recurrenceId?: string; // Links recurring batch bookings
  recurrenceType?: RecurrenceType;
  createdAt: string;
  reminderSent?: boolean;
}

export interface AbsenceDay {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string; // e.g. "Feriado", "Folga do Barbeiro", "Curso de especialização"
  barberName?: string; // Optional: if specific to one barber or entire shop
}

export interface CashTransaction {
  id: string;
  bookingId?: string;
  type: 'ENTRADA' | 'SAIDA';
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  category: 'SERVICO' | 'ASSINATURA' | 'PRODUTO' | 'DESPESA_FIXA' | 'PRODUTOS_SUPRIMENTOS' | 'OUTROS';
  date: string; // ISO date string
  createdByName: string;
}

export interface BarberAvailabilityConfig {
  openTime: string; // e.g. "08:00"
  closeTime: string; // e.g. "20:00"
  intervalMinutes: number; // 30, 45 or 60
  lunchStart: string; // "12:00"
  lunchEnd: string; // "13:00"
  workingDays: number[]; // 0=Sunday, 1=Monday, 2=Tuesday, etc.
}

export interface ClientReportItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  lastBookingDate: string | null;
  status: 'ATIVO' | 'EM_RISCO' | 'INATIVO'; // Ativo (<30d), Em Risco (30-60d), Inativo (>60d)
  hasSubscription: boolean;
}

export interface RevenueForecast {
  period: 'Semana' | 'Mês' | 'Trimestre' | 'Semestre' | 'Ano';
  projectedBookingsCount: number;
  bookingsRevenue: number;
  subscriptionRevenue: number;
  totalProjectedRevenue: number;
}
