import { BarberService, SubscriptionPlan, User, Booking, AbsenceDay, CashTransaction, BarberAvailabilityConfig, InfinitePayConfig } from './types';

export const INITIAL_INFINITEPAY_CONFIG: InfinitePayConfig = {
  merchantName: 'Lucas Hoffmann Barber',
  defaultUrl: 'https://pay.infinitepay.io/lucashoffmannbarber',
  enabled: true,
  notes: 'Pagamento via Cartão de Crédito ou Débito com a segurança e aprovação imediata da InfinitePay.',
  serverWebhookUrl: 'https://ais-pre-pov473yuxfbnsvikwv5lt2-381752577235.us-east5.run.app/api/webhooks/infinitepay',
};

export const INITIAL_SERVICES: BarberService[] = [
  {
    id: 'serv-1',
    name: 'Corte Cabelo Clássico / Fade',
    category: 'Cabelo',
    price: 45.0,
    durationMinutes: 40,
    description: 'Corte moderno com tesoura e máquina, degradê navalhado, acabamento preciso e finalização com pomada modeladora.',
    isActive: true,
  },
  {
    id: 'serv-2',
    name: 'Barba Terapia Completa',
    category: 'Barba',
    price: 35.0,
    durationMinutes: 30,
    description: 'Toalha quente com óleos essenciais, massagem facial, lâmina descartável, esfoliação e balm hidratante.',
    isActive: true,
  },
  {
    id: 'serv-3',
    name: 'Combo Barba & Cabelo Executivo',
    category: 'Combo',
    price: 70.0,
    durationMinutes: 60,
    description: 'O combo mais pedido: Corte de cabelo completo + Barboterapia com toalha quente e bebida cortesia.',
    isActive: true,
  },
  {
    id: 'serv-4',
    name: 'Pigmentação de Barba & Cabelo',
    category: 'Tratamento',
    price: 40.0,
    durationMinutes: 30,
    description: 'Disfarce óptico de fios brancos e falhas com tonalizante profissional de longa durabilidade.',
    isActive: true,
  },
  {
    id: 'serv-5',
    name: 'Alinhamento Capilar / Botox',
    category: 'Tratamento',
    price: 80.0,
    durationMinutes: 50,
    description: 'Tratamento redutor de volume e frizz com nutrição profunda para fios macios e fáceis de pentear.',
    isActive: true,
  },
  {
    id: 'serv-6',
    name: 'Sobrancelha na Navalha / Pinça',
    category: 'Outros',
    price: 15.0,
    durationMinutes: 15,
    description: 'Design de sobrancelha masculina natural e alinhamento do contorno.',
    isActive: true,
  },
];

export const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-basic',
    name: 'Clube Essencial',
    monthlyPrice: 89.90,
    description: 'Ideal para quem gosta de manter o cabelo sempre na régua.',
    includedServicesDescription: '2 Cortes de Cabelo por mês + 10% de desconto em outros serviços',
    maxBookingsPerMonth: 2,
    discountPercentageOnOthers: 10,
    infinitePayUrl: 'https://pay.infinitepay.io/lucashoffmannbarber/clube-essencial',
    isActive: true,
  },
  {
    id: 'plan-vip',
    name: 'Clube Vip Master (Ilimitado)',
    monthlyPrice: 149.90,
    description: 'O plano mais procurado por clientes frequentes e executivos.',
    includedServicesDescription: 'Cortes & Barbas ILIMITADOS no mês + 1 Bebida especial por visita + 20% off em produtos',
    maxBookingsPerMonth: -1, // Unlimited
    discountPercentageOnOthers: 20,
    popular: true,
    infinitePayUrl: 'https://pay.infinitepay.io/lucashoffmannbarber/clube-vip',
    isActive: true,
  },
  {
    id: 'plan-barba',
    name: 'Clube Barba Alinhada',
    monthlyPrice: 79.90,
    description: 'Para os barbudos de respeito que exigem cuidados semanais.',
    includedServicesDescription: '4 Barboterapias completas com toalha quente no mês + 15% off em pomadas/óleos',
    maxBookingsPerMonth: 4,
    discountPercentageOnOthers: 15,
    infinitePayUrl: 'https://pay.infinitepay.io/lucashoffmannbarber/clube-barba',
    isActive: true,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Lucas Hoffmann (Administrador)',
    email: 'lucashoffmann@gmail.com',
    phone: '(11) 98765-4321',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T10:00:00Z',
  },
];

export const INITIAL_AVAILABILITY_CONFIG: BarberAvailabilityConfig = {
  openTime: '09:00',
  closeTime: '20:00',
  intervalMinutes: 30,
  lunchStart: '12:00',
  lunchEnd: '13:00',
  workingDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
};

// Sem dados de teste para bloqueios
export const INITIAL_ABSENCE_DAYS: AbsenceDay[] = [];

// Sem dados de teste para agendamentos
export const INITIAL_BOOKINGS: Booking[] = [];

// Sem dados de teste para transações de caixa
export const INITIAL_TRANSACTIONS: CashTransaction[] = [];
