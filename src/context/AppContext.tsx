import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  BarberService,
  SubscriptionPlan,
  Booking,
  AbsenceDay,
  CashTransaction,
  BarberAvailabilityConfig,
  PaymentMethod,
  BookingStatus,
  RecurrenceType,
  ClientReportItem,
  RevenueForecast,
  InfinitePayConfig,
} from '../types';
import {
  INITIAL_SERVICES,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_INFINITEPAY_CONFIG,
  INITIAL_USERS,
  INITIAL_BOOKINGS,
  INITIAL_ABSENCE_DAYS,
  INITIAL_TRANSACTIONS,
  INITIAL_AVAILABILITY_CONFIG,
} from '../mockData';

interface PendingBookingData {
  serviceId: string;
  barberName: string;
  datesAndTimes: Array<{ date: string; time: string }>;
  recurrenceType: RecurrenceType;
  notes?: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  sessionRemainingSeconds: number;
  sessionExpiredModalOpen: boolean;
  renewSession: () => void;
  login: (email: string, role?: 'ADMIN' | 'CLIENT', name?: string, phone?: string) => boolean;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'LOGIN' | 'REGISTER', initialRole?: 'ADMIN' | 'CLIENT') => void;
  closeAuthModal: () => void;
  authModalMode: 'LOGIN' | 'REGISTER';

  // Services
  services: BarberService[];
  addService: (service: Omit<BarberService, 'id'>) => void;
  updateService: (id: string, service: Partial<BarberService>) => void;
  deleteService: (id: string) => void;

  // Subscription Plans
  plans: SubscriptionPlan[];
  addPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  updatePlan: (id: string, plan: Partial<SubscriptionPlan>) => void;
  deletePlan: (id: string) => void;
  subscribeUserToPlan: (userId: string, planId: string) => void;
  cancelUserSubscription: (userId: string) => void;
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;

  // InfinitePay Digital Wallet Config
  infinitePayConfig: InfinitePayConfig;
  updateInfinitePayConfig: (config: Partial<InfinitePayConfig>) => void;

  // Bookings
  bookings: Booking[];
  pendingBooking: PendingBookingData | null;
  setPendingBooking: (data: PendingBookingData | null) => void;
  createBookingBatch: (bookingData: PendingBookingData, client: User) => string[];
  updateBookingStatus: (bookingId: string, status: BookingStatus, paymentMethod?: PaymentMethod, cancelReason?: string) => void;
  markReminderSent: (bookingId: string) => void;

  // Availability & Absence
  availabilityConfig: BarberAvailabilityConfig;
  updateAvailabilityConfig: (config: Partial<BarberAvailabilityConfig>) => void;
  absenceDays: AbsenceDay[];
  addAbsenceDay: (date: string, reason: string) => void;
  deleteAbsenceDay: (id: string) => void;

  // Cash Control
  transactions: CashTransaction[];
  addTransaction: (trans: Omit<CashTransaction, 'id' | 'date'>) => void;

  // Forecast & Reports
  getRevenueForecasts: () => RevenueForecast[];
  getClientReports: () => ClientReportItem[];

  // Admin Reminders
  activeAdminReminderBooking: Booking | null;
  dismissAdminReminder: () => void;
  sendWhatsAppReminder: (booking: Booking) => void;

  // Navigation / View State
  activeView: 'BOOKING' | 'MY_BOOKINGS' | 'ADMIN_PANEL';
  setActiveView: (view: 'BOOKING' | 'MY_BOOKINGS' | 'ADMIN_PANEL') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SESSION_MAX_DURATION = 300; // 5 minutes in seconds

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to initial data
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('barber_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('barber_users');
      if (!saved) return INITIAL_USERS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [services, setServices] = useState<BarberService[]>(() => {
    try {
      const saved = localStorage.getItem('barber_services');
      if (!saved) return INITIAL_SERVICES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => {
    try {
      const saved = localStorage.getItem('barber_plans');
      if (!saved) return INITIAL_SUBSCRIPTION_PLANS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SUBSCRIPTION_PLANS;
    } catch {
      return INITIAL_SUBSCRIPTION_PLANS;
    }
  });

  const [infinitePayConfig, setInfinitePayConfig] = useState<InfinitePayConfig>(() => {
    try {
      const saved = localStorage.getItem('barber_infinitepay');
      if (!saved) return INITIAL_INFINITEPAY_CONFIG;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : INITIAL_INFINITEPAY_CONFIG;
    } catch {
      return INITIAL_INFINITEPAY_CONFIG;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('barber_bookings');
      if (!saved) return INITIAL_BOOKINGS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [absenceDays, setAbsenceDays] = useState<AbsenceDay[]>(() => {
    try {
      const saved = localStorage.getItem('barber_absence_days');
      if (!saved) return INITIAL_ABSENCE_DAYS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_ABSENCE_DAYS;
    } catch {
      return INITIAL_ABSENCE_DAYS;
    }
  });

  const [availabilityConfig, setAvailabilityConfig] = useState<BarberAvailabilityConfig>(() => {
    try {
      const saved = localStorage.getItem('barber_availability');
      if (!saved) return INITIAL_AVAILABILITY_CONFIG;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : INITIAL_AVAILABILITY_CONFIG;
    } catch {
      return INITIAL_AVAILABILITY_CONFIG;
    }
  });

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('barber_transactions');
      if (!saved) return INITIAL_TRANSACTIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [pendingBooking, setPendingBooking] = useState<PendingBookingData | null>(() => {
    try {
      const saved = localStorage.getItem('barber_pending_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<'BOOKING' | 'MY_BOOKINGS' | 'ADMIN_PANEL'>('BOOKING');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // 5-minute login expiration timer state
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(SESSION_MAX_DURATION);
  const [sessionExpiredModalOpen, setSessionExpiredModalOpen] = useState(false);

  // Admin proactive reminder for upcoming bookings
  const [activeAdminReminderBooking, setActiveAdminReminderBooking] = useState<Booking | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);

  // Sync state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('barber_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('barber_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('barber_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('barber_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('barber_infinitepay', JSON.stringify(infinitePayConfig));
  }, [infinitePayConfig]);

  useEffect(() => {
    localStorage.setItem('barber_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('barber_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('barber_absence_days', JSON.stringify(absenceDays));
  }, [absenceDays]);

  useEffect(() => {
    localStorage.setItem('barber_availability', JSON.stringify(availabilityConfig));
  }, [availabilityConfig]);

  useEffect(() => {
    localStorage.setItem('barber_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (pendingBooking) {
      localStorage.setItem('barber_pending_booking', JSON.stringify(pendingBooking));
    } else {
      localStorage.removeItem('barber_pending_booking');
    }
  }, [pendingBooking]);

  // Session timer logic: 5 minutes automatic logout
  const renewSession = useCallback(() => {
    setSessionRemainingSeconds(SESSION_MAX_DURATION);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setSessionRemainingSeconds(SESSION_MAX_DURATION);
    setActiveView('BOOKING');
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Reset countdown on login or user presence
    setSessionRemainingSeconds(SESSION_MAX_DURATION);

    const interval = setInterval(() => {
      setSessionRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          setSessionExpiredModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset on user activity
    const handleActivity = () => {
      setSessionRemainingSeconds((prev) => (prev > 0 ? SESSION_MAX_DURATION : 0));
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [currentUser, logout]);

  // Proactive Admin reminder check
  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      setActiveAdminReminderBooking(null);
      return;
    }

    // Find next upcoming scheduled booking for today or next day that hasn't been reminded yet
    const todayStr = '2026-09-02';
    const upcoming = bookings.find(
      (b) =>
        b.status === 'AGENDADO' &&
        (b.date === todayStr || b.date === '2026-09-03') &&
        !b.reminderSent &&
        !dismissedReminders.includes(b.id)
    );

    if (upcoming) {
      setActiveAdminReminderBooking(upcoming);
    } else {
      setActiveAdminReminderBooking(null);
    }
  }, [currentUser, bookings, dismissedReminders]);

  const dismissAdminReminder = useCallback(() => {
    if (activeAdminReminderBooking) {
      setDismissedReminders((prev) => [...prev, activeAdminReminderBooking.id]);
      setActiveAdminReminderBooking(null);
    }
  }, [activeAdminReminderBooking]);

  // Auth management
  const login = useCallback(
    (email: string, role?: 'ADMIN' | 'CLIENT', name?: string, phone?: string): boolean => {
      const normalizedEmail = email.trim().toLowerCase();
      let matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      // Auto-detect admin if email matches admin pattern or explicit admin role
      const isAdminEmail =
        normalizedEmail.includes('admin') ||
        normalizedEmail === 'belchior87@gmail.com' ||
        role === 'ADMIN';

      if (!matchedUser) {
        // Create user on the fly if new
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: name || (isAdminEmail ? 'Belchior (Administrador)' : 'Novo Cliente'),
          email: normalizedEmail,
          phone: phone || '(11) 99999-9999',
          role: isAdminEmail ? 'ADMIN' : 'CLIENT',
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, newUser]);
        matchedUser = newUser;
      } else if (isAdminEmail && matchedUser.role !== 'ADMIN') {
        matchedUser = { ...matchedUser, role: 'ADMIN' };
        setUsers((prev) => prev.map((u) => (u.id === matchedUser!.id ? matchedUser! : u)));
      }

      setCurrentUser(matchedUser);
      renewSession();
      setIsAuthModalOpen(false);

      // Auto route: if admin, open Admin Panel; if client and has pending booking, stay on booking flow to confirm
      if (matchedUser.role === 'ADMIN') {
        setActiveView('ADMIN_PANEL');
      } else {
        if (!pendingBooking) {
          setActiveView('MY_BOOKINGS');
        }
      }

      return true;
    },
    [users, pendingBooking, renewSession]
  );

  const openAuthModal = useCallback((mode: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openSubscriptionModal = useCallback(() => setIsSubscriptionModalOpen(true), []);
  const closeSubscriptionModal = useCallback(() => setIsSubscriptionModalOpen(false), []);

  // Services CRUD
  const addService = useCallback((serviceData: Omit<BarberService, 'id'>) => {
    const newService: BarberService = {
      ...serviceData,
      id: `serv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
  }, []);

  const updateService = useCallback((id: string, updatedFields: Partial<BarberService>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Subscription plans CRUD & InfinitePay
  const addPlan = useCallback((planData: Omit<SubscriptionPlan, 'id'>) => {
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      isActive: planData.isActive !== undefined ? planData.isActive : true,
    };
    setPlans((prev) => [...prev, newPlan]);
  }, []);

  const updatePlan = useCallback((id: string, updatedFields: Partial<SubscriptionPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateInfinitePayConfig = useCallback((config: Partial<InfinitePayConfig>) => {
    setInfinitePayConfig((prev) => ({ ...prev, ...config }));
  }, []);

  // Subscription management
  const subscribeUserToPlan = useCallback(
    (userId: string, planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, subscriptionId: planId, subscriptionStartDate: new Date().toISOString().split('T')[0] }
            : u
        )
      );

      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) =>
          prev ? { ...prev, subscriptionId: planId, subscriptionStartDate: new Date().toISOString().split('T')[0] } : null
        );
      }

      // Record transaction
      const newTransaction: CashTransaction = {
        id: `trans-${Date.now()}`,
        type: 'ENTRADA',
        description: `Assinatura de Plano: ${plan.name}`,
        amount: plan.monthlyPrice,
        paymentMethod: 'CARTAO_CREDITO',
        category: 'ASSINATURA',
        date: new Date().toISOString(),
        createdByName: 'Sistema Assinaturas',
      };
      setTransactions((prev) => [newTransaction, ...prev]);
    },
    [currentUser, plans]
  );

  const cancelUserSubscription = useCallback(
    (userId: string) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, subscriptionId: undefined, subscriptionStartDate: undefined } : u))
      );
      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) =>
          prev ? { ...prev, subscriptionId: undefined, subscriptionStartDate: undefined } : null
        );
      }
    },
    [currentUser]
  );

  // Booking batch creation
  const createBookingBatch = useCallback(
    (bookingData: PendingBookingData, client: User): string[] => {
      const selectedService = services.find((s) => s.id === bookingData.serviceId);
      if (!selectedService) return [];

      const recurrenceId = bookingData.datesAndTimes.length > 1 ? `rec-${Date.now()}` : undefined;
      const isSubscriber = Boolean(client.subscriptionId);

      const createdIds: string[] = [];
      const newBookings: Booking[] = bookingData.datesAndTimes.map((item, index) => {
        const id = `book-${Date.now()}-${index}`;
        createdIds.push(id);

        return {
          id,
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          clientEmail: client.email,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          servicePrice: isSubscriber ? 0 : selectedService.price,
          durationMinutes: selectedService.durationMinutes,
          barberName: bookingData.barberName,
          date: item.date,
          time: item.time,
          status: 'AGENDADO',
          paymentMethod: isSubscriber ? 'ASSINATURA_CLUBE' : 'PENDENTE',
          isPaid: isSubscriber,
          notes: bookingData.notes,
          recurrenceId,
          recurrenceType: bookingData.recurrenceType,
          createdAt: new Date().toISOString(),
          reminderSent: false,
        };
      });

      setBookings((prev) => [...newBookings, ...prev]);
      setPendingBooking(null);
      return createdIds;
    },
    [services]
  );

  // Booking status update (e.g. Executed with payment, Cancelled with reason)
  const updateBookingStatus = useCallback(
    (bookingId: string, status: BookingStatus, paymentMethod: PaymentMethod = 'PIX', cancelReason?: string) => {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b;

          const updated: Booking = {
            ...b,
            status,
            paymentMethod: status === 'EXECUTADO' ? paymentMethod : b.paymentMethod,
            isPaid: status === 'EXECUTADO' ? true : b.isPaid,
            cancelReason: status === 'CANCELADO' ? cancelReason : b.cancelReason,
            cancelledAt: status === 'CANCELADO' ? new Date().toISOString() : b.cancelledAt,
          };

          // If executed, automatically record cash entry if not already logged as subscription
          if (status === 'EXECUTADO' && b.servicePrice > 0 && b.paymentMethod !== 'ASSINATURA_CLUBE') {
            const trans: CashTransaction = {
              id: `trans-cash-${Date.now()}`,
              bookingId: b.id,
              type: 'ENTRADA',
              description: `Atendimento: ${b.serviceName} - ${b.clientName}`,
              amount: b.servicePrice,
              paymentMethod: paymentMethod,
              category: 'SERVICO',
              date: new Date().toISOString(),
              createdByName: 'Belchior Barber',
            };
            setTransactions((t) => [trans, ...t]);
          }

          return updated;
        })
      );
    },
    []
  );

  const markReminderSent = useCallback((bookingId: string) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, reminderSent: true } : b)));
  }, []);

  // WhatsApp Preformatted Reminder Dispatcher
  const sendWhatsAppReminder = useCallback(
    (booking: Booking) => {
      const cleanPhone = booking.clientPhone.replace(/\D/g, '');
      const formattedDate = booking.date.split('-').reverse().join('/');
      const text = `💈 *Lembrete Barbearia Belchior Master*\n\nOlá, *${booking.clientName}*! Seu horário para *${booking.serviceName}* com *${booking.barberName}* está agendado para:\n\n📅 Data: *${formattedDate}*\n⏰ Horário: *${booking.time}*\n📍 Endereço: *Rua das Palmeiras, 450 - Centro*\n\nPor favor, chegue com 5 minutos de antecedência. Caso precise reagendar, nos avise aqui pelo WhatsApp!\n\n_Aguardamos você!_`;

      markReminderSent(booking.id);
      dismissAdminReminder();

      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    },
    [markReminderSent, dismissAdminReminder]
  );

  // Availability & Absence
  const updateAvailabilityConfig = useCallback((config: Partial<BarberAvailabilityConfig>) => {
    setAvailabilityConfig((prev) => ({ ...prev, ...config }));
  }, []);

  const addAbsenceDay = useCallback((date: string, reason: string) => {
    const newAbsence: AbsenceDay = {
      id: `abs-${Date.now()}`,
      date,
      reason,
    };
    setAbsenceDays((prev) => [...prev, newAbsence]);
  }, []);

  const deleteAbsenceDay = useCallback((id: string) => {
    setAbsenceDays((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Transactions
  const addTransaction = useCallback((transData: Omit<CashTransaction, 'id' | 'date'>) => {
    const newTrans: CashTransaction = {
      ...transData,
      id: `trans-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [newTrans, ...prev]);
  }, []);

  // Financial Revenue Forecast calculation
  const getRevenueForecasts = useCallback((): RevenueForecast[] => {
    // Current date reference: 2026-09-02
    const now = new Date('2026-09-02T00:00:00');
    const safeUsers = users || [];
    const safeBookings = bookings || [];
    const safePlans = plans || [];

    // Active subscriptions monthly yield
    const activeSubscribers = safeUsers.filter((u) => Boolean(u.subscriptionId));
    const monthlySubscriptionRevenue = activeSubscribers.reduce((acc, user) => {
      const plan = safePlans.find((p) => p.id === user.subscriptionId);
      return acc + (plan?.monthlyPrice || 0);
    }, 0);

    const periods: Array<{
      period: 'Semana' | 'Mês' | 'Trimestre' | 'Semestre' | 'Ano';
      days: number;
      months: number;
    }> = [
      { period: 'Semana', days: 7, months: 0.25 },
      { period: 'Mês', days: 30, months: 1 },
      { period: 'Trimestre', days: 90, months: 3 },
      { period: 'Semestre', days: 180, months: 6 },
      { period: 'Ano', days: 365, months: 12 },
    ];

    return periods.map(({ period, days, months }) => {
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Filter upcoming future bookings within range
      const inRangeBookings = safeBookings.filter((b) => {
        const bDate = new Date(`${b.date}T${b.time || '12:00'}`);
        return bDate >= now && bDate <= endDate && b.status === 'AGENDADO';
      });

      const bookingsRevenue = inRangeBookings.reduce((sum, b) => sum + (b.servicePrice || 0), 0);
      const subscriptionRevenue = Math.round(monthlySubscriptionRevenue * months * 100) / 100;

      return {
        period,
        projectedBookingsCount: inRangeBookings.length,
        bookingsRevenue,
        subscriptionRevenue,
        totalProjectedRevenue: bookingsRevenue + subscriptionRevenue,
      };
    });
  }, [bookings, users, plans]);

  // Client Reports calculation
  const getClientReports = useCallback((): ClientReportItem[] => {
    const safeUsers = users || [];
    const safeBookings = bookings || [];
    const clientsOnly = safeUsers.filter((u) => u.role === 'CLIENT');
    const todayMs = new Date('2026-09-02T00:00:00').getTime();

    return clientsOnly.map((c) => {
      const userBookings = safeBookings.filter((b) => b.clientId === c.id);
      const totalBookings = userBookings.length;
      const completed = userBookings.filter((b) => b.status === 'EXECUTADO');
      const cancelled = userBookings.filter((b) => b.status === 'CANCELADO');
      const totalSpent = completed.reduce((acc, curr) => acc + (curr.servicePrice || 0), 0);

      // Find last booking date
      let lastDate: string | null = null;
      if (userBookings.length > 0) {
        const sorted = [...userBookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastDate = sorted[0].date;
      }

      let status: 'ATIVO' | 'EM_RISCO' | 'INATIVO' = 'ATIVO';
      if (!lastDate) {
        status = 'INATIVO';
      } else {
        const diffDays = Math.floor((todayMs - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          status = 'ATIVO';
        } else if (diffDays <= 60) {
          status = 'EM_RISCO';
        } else {
          status = 'INATIVO';
        }
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        totalBookings,
        completedBookings: completed.length,
        cancelledBookings: cancelled.length,
        totalSpent,
        lastBookingDate: lastDate,
        status,
        hasSubscription: Boolean(c.subscriptionId),
      };
    });
  }, [users, bookings]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      sessionRemainingSeconds,
      sessionExpiredModalOpen,
      renewSession,
      login,
      logout,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authModalMode,
      services,
      addService,
      updateService,
      deleteService,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      infinitePayConfig,
      updateInfinitePayConfig,
      subscribeUserToPlan,
      cancelUserSubscription,
      isSubscriptionModalOpen,
      openSubscriptionModal,
      closeSubscriptionModal,
      bookings,
      pendingBooking,
      setPendingBooking,
      createBookingBatch,
      updateBookingStatus,
      markReminderSent,
      availabilityConfig,
      updateAvailabilityConfig,
      absenceDays,
      addAbsenceDay,
      deleteAbsenceDay,
      transactions,
      addTransaction,
      getRevenueForecasts,
      getClientReports,
      activeAdminReminderBooking,
      dismissAdminReminder,
      sendWhatsAppReminder,
      activeView,
      setActiveView,
    }),
    [
      currentUser,
      users,
      sessionRemainingSeconds,
      sessionExpiredModalOpen,
      renewSession,
      login,
      logout,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authModalMode,
      services,
      addService,
      updateService,
      deleteService,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      infinitePayConfig,
      updateInfinitePayConfig,
      subscribeUserToPlan,
      cancelUserSubscription,
      isSubscriptionModalOpen,
      openSubscriptionModal,
      closeSubscriptionModal,
      bookings,
      pendingBooking,
      setPendingBooking,
      createBookingBatch,
      updateBookingStatus,
      markReminderSent,
      availabilityConfig,
      updateAvailabilityConfig,
      absenceDays,
      addAbsenceDay,
      deleteAbsenceDay,
      transactions,
      addTransaction,
      getRevenueForecasts,
      getClientReports,
      activeAdminReminderBooking,
      dismissAdminReminder,
      sendWhatsAppReminder,
      activeView,
      setActiveView,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {sessionExpiredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 text-2xl">
              ⏱️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sessão Expirada por Inatividade</h3>
            <p className="text-slate-400 text-sm mb-6">
              Para sua segurança, a sessão foi desconectada após 5 minutos sem interação.
            </p>
            <button
              onClick={() => {
                setSessionExpiredModalOpen(false);
                openAuthModal('LOGIN');
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
            >
              Fazer Login Novamente
            </button>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
