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
  InfinitePayWebhookEvent,
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
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';

// Helper to validate active subscription access
// "O sistema vai comparar vai buscar por status: PROCESSED, libera acesso a assinatura. Senão não libera."
export const isUserSubscriber = (user?: User | null): boolean => {
  if (!user) return false;
  const hasPlan = Boolean(user.subscriptionId);
  const isProcessed = user.status === 'PROCESSED' || user.subscriptionStatus === 'PROCESSED';
  return hasPlan && isProcessed;
};

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

  // Firebase status & data cleaning
  isFirebaseConnected: boolean;
  clearAllTestData: () => Promise<void>;

  // Services
  services: BarberService[];
  addService: (service: Omit<BarberService, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<BarberService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Subscription Plans
  plans: SubscriptionPlan[];
  addPlan: (plan: Omit<SubscriptionPlan, 'id'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<SubscriptionPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  subscribeUserToPlan: (
    userId: string,
    planId: string,
    paymentDetails?: { orderNsu?: string; transactionNsu?: string; paymentMethod?: PaymentMethod }
  ) => Promise<void>;
  cancelUserSubscription: (userId: string) => Promise<void>;
  isUserSubscriber: (user?: User | null) => boolean;
  setUserPendingCheckout: (userId: string, planId: string, orderNsu: string) => Promise<void>;
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;

  // InfinitePay Digital Wallet Config & Webhooks
  infinitePayConfig: InfinitePayConfig;
  updateInfinitePayConfig: (config: Partial<InfinitePayConfig>) => Promise<void>;
  webhookEvents: InfinitePayWebhookEvent[];
  recordWebhookEvent: (event: InfinitePayWebhookEvent, targetUserId?: string) => Promise<void>;
  clearWebhookEvents: () => Promise<void>;
  verifyPaymentForOrder: (orderNsu: string, expectedAmount?: number) => Promise<{ paid: boolean; event?: InfinitePayWebhookEvent; message?: string }>;

  // Bookings
  bookings: Booking[];
  pendingBooking: PendingBookingData | null;
  setPendingBooking: (data: PendingBookingData | null) => void;
  createBookingBatch: (bookingData: PendingBookingData, client: User) => Promise<string[]>;
  updateBookingStatus: (bookingId: string, status: BookingStatus, paymentMethod?: PaymentMethod, cancelReason?: string) => Promise<void>;
  markReminderSent: (bookingId: string) => Promise<void>;

  // Availability & Absence
  availabilityConfig: BarberAvailabilityConfig;
  updateAvailabilityConfig: (config: Partial<BarberAvailabilityConfig>) => Promise<void>;
  absenceDays: AbsenceDay[];
  addAbsenceDay: (date: string, reason: string) => Promise<void>;
  deleteAbsenceDay: (id: string) => Promise<void>;

  // Cash Control
  transactions: CashTransaction[];
  addTransaction: (trans: Omit<CashTransaction, 'id' | 'date'>) => Promise<void>;

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
const CLEAN_STORAGE_KEY = 'barber_clean_firebase_v3';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any old test mock data from browser localStorage once upon boot
  if (typeof window !== 'undefined' && localStorage.getItem(CLEAN_STORAGE_KEY) !== 'true') {
    localStorage.removeItem('barber_bookings');
    localStorage.removeItem('barber_transactions');
    localStorage.removeItem('barber_absence_days');
    localStorage.removeItem('barber_users');
    localStorage.setItem(CLEAN_STORAGE_KEY, 'true');
  }

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Load state with clean initial values
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
      // Filter out dummy clients if any remained
      const valid = Array.isArray(parsed)
        ? parsed.filter((u) => u.email === 'belchior87@gmail.com' || u.role === 'ADMIN')
        : INITIAL_USERS;
      return valid.length > 0 ? valid : INITIAL_USERS;
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

  const [webhookEvents, setWebhookEvents] = useState<InfinitePayWebhookEvent[]>([]);

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

  // ----------------------------------------------------
  // FIREBASE FIRESTORE REAL-TIME SYNCHRONIZATION
  // ----------------------------------------------------
  useEffect(() => {
    testFirestoreConnection();

    // 1. Sync Services
    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snapshot) => {
        if (snapshot.empty) {
          // Seed default real services if collection is empty
          INITIAL_SERVICES.forEach((s) => {
            setDoc(doc(db, 'services', s.id), s).catch(console.error);
          });
          setServices(INITIAL_SERVICES);
        } else {
          const list = snapshot.docs.map((d) => d.data() as BarberService);
          setServices(list);
        }
        setIsFirebaseConnected(true);
      },
      (err) => {
        console.warn('[Firebase] Erro ao sincronizar serviços:', err.message);
        setIsFirebaseConnected(false);
      }
    );

    // 2. Sync Plans
    const unsubPlans = onSnapshot(
      collection(db, 'plans'),
      (snapshot) => {
        if (snapshot.empty) {
          INITIAL_SUBSCRIPTION_PLANS.forEach((p) => {
            setDoc(doc(db, 'plans', p.id), p).catch(console.error);
          });
          setPlans(INITIAL_SUBSCRIPTION_PLANS);
        } else {
          const list = snapshot.docs.map((d) => d.data() as SubscriptionPlan);
          setPlans(list);
        }
      },
      (err) => console.warn('[Firebase] Erro ao sincronizar planos:', err.message)
    );

    // 3. Sync Settings (Availability & InfinitePay)
    const unsubAvailability = onSnapshot(doc(db, 'settings', 'availability'), (snap) => {
      if (snap.exists()) {
        setAvailabilityConfig(snap.data() as BarberAvailabilityConfig);
      } else {
        setDoc(doc(db, 'settings', 'availability'), INITIAL_AVAILABILITY_CONFIG).catch(console.error);
      }
    });

    const unsubInfinitePay = onSnapshot(doc(db, 'settings', 'infinitepay'), (snap) => {
      if (snap.exists()) {
        setInfinitePayConfig(snap.data() as InfinitePayConfig);
      } else {
        setDoc(doc(db, 'settings', 'infinitepay'), INITIAL_INFINITEPAY_CONFIG).catch(console.error);
      }
    });

    // 4. Sync Bookings
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Booking);
        // Sort descending by creation/date
        list.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
        setBookings(list);
      },
      (err) => console.warn('[Firebase] Erro ao sincronizar agendamentos:', err.message)
    );

    // 5. Sync Absences
    const unsubAbsences = onSnapshot(
      collection(db, 'absences'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as AbsenceDay);
        setAbsenceDays(list);
      },
      (err) => console.warn('[Firebase] Erro ao sincronizar ausências:', err.message)
    );

    // 6. Sync Transactions
    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as CashTransaction);
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(list);
      },
      (err) => console.warn('[Firebase] Erro ao sincronizar transações:', err.message)
    );

    // 7. Sync Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          INITIAL_USERS.forEach((u) => {
            setDoc(doc(db, 'users', u.id), u).catch(console.error);
          });
          setUsers(INITIAL_USERS);
        } else {
          const list = snapshot.docs.map((d) => d.data() as User);
          setUsers(list);
          setCurrentUser((prev) => {
            if (!prev) return null;
            const updated = list.find((u) => u.id === prev.id);
            return updated ? { ...prev, ...updated } : prev;
          });
        }
      },
      (err) => console.warn('[Firebase] Erro ao sincronizar usuários:', err.message)
    );

    return () => {
      unsubServices();
      unsubPlans();
      unsubAvailability();
      unsubInfinitePay();
      unsubBookings();
      unsubAbsences();
      unsubTransactions();
      unsubUsers();
    };
  }, []);

  // 8. Sincronização isolada de Webhook Events por Usuário:
  // "O webhook_events tem que ficar dentro do user cadastrado. Por exemplo, user 1 registra o webhook do user 1, user 2 registra o webhook do user 2..."
  useEffect(() => {
    if (!currentUser) {
      setWebhookEvents([]);
      return;
    }

    if (currentUser.role === 'ADMIN') {
      // O Administrador escuta o ledger geral de webhooks para visualização e auditoria
      const unsub = onSnapshot(
        collection(db, 'webhook_events'),
        (snapshot) => {
          const list = snapshot.docs.map((d) => d.data() as InfinitePayWebhookEvent);
          list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
          setWebhookEvents(list);
        },
        (err) => console.warn('[Firebase] Erro ao sincronizar webhook_events globais (admin):', err.message)
      );
      return () => unsub();
    } else {
      // O CLIENTE escuta EXCLUSIVAMENTE a sua própria subcoleção: /users/{userId}/webhook_events
      // Isso impede 100% que dados de um cliente ativem ou sejam consumidos por outro cliente
      const userWebhooksRef = collection(db, 'users', currentUser.id, 'webhook_events');
      const unsub = onSnapshot(
        userWebhooksRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => d.data() as InfinitePayWebhookEvent);
          list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
          setWebhookEvents(list);
        },
        (err) => console.warn(`[Firebase] Erro ao sincronizar webhook_events do usuário ${currentUser.id}:`, err.message)
      );
      return () => unsub();
    }
  }, [currentUser?.id, currentUser?.role]);

  // Sync state to localStorage for offline cache
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

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const upcoming = (bookings || []).find(
      (b) =>
        b.status === 'AGENDADO' &&
        (b.date === todayStr || b.date === tomorrow) &&
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

      const isAdminEmail =
        normalizedEmail.includes('admin') ||
        normalizedEmail === 'belchior87@gmail.com' ||
        role === 'ADMIN';

      if (!matchedUser) {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: name || (isAdminEmail ? 'Lucas Hoffmann (Administrador)' : 'Novo Cliente'),
          email: normalizedEmail,
          phone: phone || '(11) 99999-9999',
          role: isAdminEmail ? 'ADMIN' : 'CLIENT',
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, newUser]);
        matchedUser = newUser;
        setDoc(doc(db, 'users', newUser.id), newUser).catch(console.error);
      } else if (isAdminEmail && matchedUser.role !== 'ADMIN') {
        matchedUser = { ...matchedUser, role: 'ADMIN' };
        setUsers((prev) => prev.map((u) => (u.id === matchedUser!.id ? matchedUser! : u)));
        setDoc(doc(db, 'users', matchedUser.id), matchedUser, { merge: true }).catch(console.error);
      }

      setCurrentUser(matchedUser);
      renewSession();
      setIsAuthModalOpen(false);

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
  const addService = useCallback(async (serviceData: Omit<BarberService, 'id'>) => {
    const newService: BarberService = {
      ...serviceData,
      id: `serv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
    try {
      await setDoc(doc(db, 'services', newService.id), newService);
    } catch (err) {
      console.error('[Firebase] Erro ao salvar serviço:', err);
    }
  }, []);

  const updateService = useCallback(async (id: string, updatedFields: Partial<BarberService>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
    try {
      await updateDoc(doc(db, 'services', id), updatedFields);
    } catch (err) {
      console.error('[Firebase] Erro ao atualizar serviço:', err);
    }
  }, []);

  const deleteService = useCallback(async (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.error('[Firebase] Erro ao excluir serviço:', err);
    }
  }, []);

  // Subscription plans CRUD
  const addPlan = useCallback(async (planData: Omit<SubscriptionPlan, 'id'>) => {
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      isActive: planData.isActive !== undefined ? planData.isActive : true,
    };
    setPlans((prev) => [...prev, newPlan]);
    try {
      await setDoc(doc(db, 'plans', newPlan.id), newPlan);
    } catch (err) {
      console.error('[Firebase] Erro ao salvar plano:', err);
    }
  }, []);

  const updatePlan = useCallback(async (id: string, updatedFields: Partial<SubscriptionPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    try {
      await updateDoc(doc(db, 'plans', id), updatedFields);
    } catch (err) {
      console.error('[Firebase] Erro ao atualizar plano:', err);
    }
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'plans', id));
    } catch (err) {
      console.error('[Firebase] Erro ao deletar plano:', err);
    }
  }, []);

  const updateInfinitePayConfig = useCallback(async (config: Partial<InfinitePayConfig>) => {
    setInfinitePayConfig((prev) => ({ ...prev, ...config }));
    try {
      await setDoc(doc(db, 'settings', 'infinitepay'), config, { merge: true });
    } catch (err) {
      console.error('[Firebase] Erro ao salvar InfinitePay config:', err);
    }
  }, []);

  // Subscription management
  const subscribeUserToPlan = useCallback(
    async (
      userId: string,
      planId: string,
      paymentDetails?: { orderNsu?: string; transactionNsu?: string; paymentMethod?: PaymentMethod }
    ) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      const startDate = new Date().toISOString().split('T')[0];

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                subscriptionId: planId,
                subscriptionStartDate: startDate,
                subscriptionOrderNsu: paymentDetails?.orderNsu,
                order_nsu: paymentDetails?.orderNsu,
                subscriptionPaymentNsu: paymentDetails?.transactionNsu,
                status: 'PROCESSED',
                subscriptionStatus: 'PROCESSED',
              }
            : u
        )
      );

      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                subscriptionId: planId,
                subscriptionStartDate: startDate,
                subscriptionOrderNsu: paymentDetails?.orderNsu,
                order_nsu: paymentDetails?.orderNsu,
                subscriptionPaymentNsu: paymentDetails?.transactionNsu,
                status: 'PROCESSED',
                subscriptionStatus: 'PROCESSED',
              }
            : null
        );
      }

      // Record transaction
      const newTransaction: CashTransaction = {
        id: `trans-${Date.now()}`,
        type: 'ENTRADA',
        description: `Assinatura de Plano: ${plan.name}${paymentDetails?.orderNsu ? ` (${paymentDetails.orderNsu})` : ''}`,
        amount: plan.monthlyPrice,
        paymentMethod: paymentDetails?.paymentMethod || 'CARTAO_CREDITO',
        category: 'ASSINATURA',
        date: new Date().toISOString(),
        createdByName: 'Sistema Assinaturas',
      };
      setTransactions((prev) => [newTransaction, ...prev]);

      try {
        await updateDoc(doc(db, 'users', userId), {
          subscriptionId: planId,
          subscriptionStartDate: startDate,
          subscriptionOrderNsu: paymentDetails?.orderNsu || null,
          order_nsu: paymentDetails?.orderNsu || null,
          subscriptionPaymentNsu: paymentDetails?.transactionNsu || null,
          status: 'PROCESSED',
          subscriptionStatus: 'PROCESSED',
        });
        await setDoc(doc(db, 'transactions', newTransaction.id), newTransaction);
      } catch (err) {
        console.error('[Firebase] Erro ao registrar assinatura:', err);
      }
    },
    [currentUser, plans]
  );

  const cancelUserSubscription = useCallback(
    async (userId: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                subscriptionId: undefined,
                subscriptionStartDate: undefined,
                subscriptionOrderNsu: undefined,
                order_nsu: undefined,
                subscriptionPaymentNsu: undefined,
                status: 'CANCELLED',
                subscriptionStatus: 'CANCELLED',
              }
            : u
        )
      );
      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                subscriptionId: undefined,
                subscriptionStartDate: undefined,
                subscriptionOrderNsu: undefined,
                order_nsu: undefined,
                subscriptionPaymentNsu: undefined,
                status: 'CANCELLED',
                subscriptionStatus: 'CANCELLED',
              }
            : null
        );
      }
      try {
        await updateDoc(doc(db, 'users', userId), {
          subscriptionId: null,
          subscriptionStartDate: null,
          subscriptionOrderNsu: null,
          order_nsu: null,
          subscriptionPaymentNsu: null,
          status: 'CANCELLED',
          subscriptionStatus: 'CANCELLED',
        });
      } catch (err) {
        console.error('[Firebase] Erro ao cancelar assinatura:', err);
      }
    },
    [currentUser]
  );

  const setUserPendingCheckout = useCallback(
    async (userId: string, planId: string, orderNsu: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: 'PENDING',
                subscriptionStatus: 'PENDING',
                pendingPlanId: planId,
                pendingOrderNsu: orderNsu,
                order_nsu: orderNsu,
                subscriptionOrderNsu: orderNsu,
                lastCheckoutAt: new Date().toISOString(),
              }
            : u
        )
      );
      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                status: 'PENDING',
                subscriptionStatus: 'PENDING',
                pendingPlanId: planId,
                pendingOrderNsu: orderNsu,
                order_nsu: orderNsu,
                subscriptionOrderNsu: orderNsu,
                lastCheckoutAt: new Date().toISOString(),
              }
            : null
        );
      }
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: 'PENDING',
          subscriptionStatus: 'PENDING',
          pendingPlanId: planId,
          pendingOrderNsu: orderNsu,
          order_nsu: orderNsu,
          subscriptionOrderNsu: orderNsu,
          lastCheckoutAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[Firebase] Erro ao marcar checkout pendente:', e);
      }
    },
    [currentUser]
  );

  // Instant reactive activation:
  // "Ao gravar o evento no webhook, no campo status, grava também naquele cliente específico o mesmo status e a orde_nsu.
  // Assim a validação vai ser instantâneo. O sistema vai comparar vai buscar por status: PROCESSED, libera acesso a assinatura. Senão não libera."
  useEffect(() => {
    if (!currentUser || currentUser.role === 'ADMIN') return;

    // Se já está com status: PROCESSED e plano ativo, o acesso já está liberado
    if (
      currentUser.subscriptionId &&
      (currentUser.status === 'PROCESSED' || currentUser.subscriptionStatus === 'PROCESSED')
    ) {
      return;
    }

    // 1. Verificação instantânea do documento do próprio cliente:
    // "no campo status, grava também naquele cliente específico o mesmo status e a orde_nsu. Assim a validação vai ser instantâneo. O sistema vai comparar vai buscar por status: PROCESSED, libera acesso a assinatura."
    if (
      currentUser.status === 'PROCESSED' ||
      currentUser.subscriptionStatus === 'PROCESSED'
    ) {
      const planToActivate = currentUser.pendingPlanId || currentUser.subscriptionId || 'plano-ouro';
      const matchedOrderNsu = currentUser.order_nsu || currentUser.subscriptionOrderNsu || currentUser.pendingOrderNsu || '';
      console.log(`[AppContext] Cliente ${currentUser.id} detectado com status: PROCESSED no Firestore! Liberando acesso à assinatura instantaneamente...`);
      subscribeUserToPlan(currentUser.id, planToActivate, {
        orderNsu: matchedOrderNsu,
        transactionNsu: currentUser.subscriptionPaymentNsu || '',
        paymentMethod: 'PIX',
      });
      return;
    }

    // 2. Verificação nos eventos de webhook isolados do próprio usuário:
    // "O webhook_events tem que ficar dentro do user cadastrado. Por exemplo, user 1 registra o webhook do user 1, user 2 registra o webhook do user 2..."
    const pendingNsu = (
      currentUser.pendingOrderNsu ||
      currentUser.order_nsu ||
      currentUser.subscriptionOrderNsu ||
      ''
    ).toLowerCase().trim();
    const cleanUserId = currentUser.id.toLowerCase().trim();
    const pendingPlan = currentUser.pendingPlanId || 'plano-ouro';

    const matchingProcessedEvent = webhookEvents.find((ev) => {
      if (ev.status !== 'PROCESSED' && (ev.status as string) !== 'APPROVED') return false;
      // Garante estritamente que não é de outro usuário caso tenha ID
      if (ev.userId && ev.userId.toLowerCase() !== cleanUserId) return false;

      const evOrderNsu = (ev.order_nsu || '').toLowerCase().trim();
      const evTxNsu = (ev.transaction_nsu || '').toLowerCase().trim();

      if (pendingNsu && (evOrderNsu === pendingNsu || evOrderNsu.includes(pendingNsu) || pendingNsu.includes(evOrderNsu) || evTxNsu === pendingNsu)) {
        return true;
      }
      if (cleanUserId && (evOrderNsu.includes(cleanUserId) || cleanUserId.includes(evOrderNsu))) {
        return true;
      }
      return false;
    });

    if (matchingProcessedEvent) {
      console.log(`[AppContext] Webhook PROCESSED detectado no subcollection do usuário ${currentUser.id}! Ativando assinatura:`, matchingProcessedEvent);
      subscribeUserToPlan(currentUser.id, pendingPlan, {
        orderNsu: matchingProcessedEvent.order_nsu,
        transactionNsu: matchingProcessedEvent.transaction_nsu,
        paymentMethod: matchingProcessedEvent.capture_method?.toLowerCase().includes('pix') ? 'PIX' : 'CARTAO_CREDITO',
      });
    }
  }, [currentUser, webhookEvents, subscribeUserToPlan]);

  const recordWebhookEvent = useCallback(
    async (event: InfinitePayWebhookEvent, targetUserId?: string) => {
      const destUserId = targetUserId || event.userId || currentUser?.id;
      const enrichedEvent: InfinitePayWebhookEvent = {
        ...event,
        userId: destUserId,
      };

      setWebhookEvents((prev) => [enrichedEvent, ...prev.filter((e) => e.id !== enrichedEvent.id)]);

      try {
        if (destUserId) {
          // 1. Grava no subcollection do usuário específico: /users/{userId}/webhook_events/{eventId}
          await setDoc(doc(db, 'users', destUserId, 'webhook_events', enrichedEvent.id), enrichedEvent);

          // 2. Grava status: PROCESSED e order_nsu naquele cliente específico no Firestore para liberação instantânea
          if (enrichedEvent.status === 'PROCESSED' || (enrichedEvent.status as string) === 'APPROVED') {
            await updateDoc(doc(db, 'users', destUserId), {
              status: 'PROCESSED',
              subscriptionStatus: 'PROCESSED',
              order_nsu: enrichedEvent.order_nsu,
              subscriptionOrderNsu: enrichedEvent.order_nsu,
              subscriptionPaymentNsu: enrichedEvent.transaction_nsu || '',
              subscriptionStartDate: new Date().toISOString(),
            }).catch(console.warn);
          }
        }

        // 3. Grava também no ledger central para o painel de auditoria do administrador
        await setDoc(doc(db, 'webhook_events', enrichedEvent.id), enrichedEvent);
      } catch (err) {
        console.error('[Firebase] Erro ao gravar webhook_events:', err);
      }
    },
    [currentUser]
  );

  const clearWebhookEvents = useCallback(async () => {
    setWebhookEvents([]);
    try {
      if (currentUser?.id) {
        const userSnap = await getDocs(collection(db, 'users', currentUser.id, 'webhook_events'));
        const userDeletes = userSnap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(userDeletes);
      }
      if (currentUser?.role === 'ADMIN') {
        const snap = await getDocs(collection(db, 'webhook_events'));
        const deletes = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletes);
      }
    } catch (err) {
      console.error('[Firebase] Erro ao limpar webhook_events:', err);
    }
  }, [currentUser]);

  const verifyPaymentForOrder = useCallback(
    async (orderNsu: string, expectedAmount?: number): Promise<{ paid: boolean; event?: InfinitePayWebhookEvent; message?: string }> => {
      let cleanNsu = (orderNsu || '').trim().toLowerCase();

      // If user pasted a receipt URL like https://recibo.infinitepay.io/fad4a6bf-..., extract the UUID
      if (cleanNsu.includes('recibo.infinitepay.io/')) {
        const parts = cleanNsu.split('recibo.infinitepay.io/');
        if (parts[1]) {
          cleanNsu = parts[1].split('?')[0].split('/')[0].trim();
        }
      }

      // Helper to check if an event strictly matches the current user & order
      const isMatch = (ev: InfinitePayWebhookEvent) => {
        if (ev.status !== 'PROCESSED' && (ev.status as string) !== 'APPROVED') return false;

        // Se o evento possui userId e currentUser está logado como cliente, rejeita se pertencer a outro
        if (currentUser && ev.userId && ev.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
          return false;
        }

        const orderNsuField = (ev.order_nsu || '').toLowerCase();
        const txNsuField = (ev.transaction_nsu || '').toLowerCase();
        const slugField = (ev.invoice_slug || '').toLowerCase();
        const idField = (ev.id || '').toLowerCase();
        const receiptField = (ev.receipt_url || '').toLowerCase();

        // 1. Direct match on any identifier
        if (
          (cleanNsu && orderNsuField === cleanNsu) ||
          (cleanNsu && txNsuField === cleanNsu) ||
          (cleanNsu && slugField === cleanNsu) ||
          (cleanNsu && idField === cleanNsu) ||
          (cleanNsu && receiptField.includes(cleanNsu))
        ) {
          return true;
        }

        // 2. Substring / partial match if search term is at least 5 characters
        if (cleanNsu.length >= 5) {
          if (
            orderNsuField.includes(cleanNsu) ||
            txNsuField.includes(cleanNsu) ||
            cleanNsu.includes(slugField) ||
            receiptField.includes(cleanNsu)
          ) {
            return true;
          }
        }

        // 3. Se o NSU do pedido contiver o ID deste usuário
        if (currentUser?.id && orderNsuField.includes(currentUser.id.toLowerCase())) {
          return true;
        }

        return false;
      };

      // 1. Verifica eventos em memória (que para o cliente já são estritamente os da sua própria subcoleção)
      const localMatched = webhookEvents.find(isMatch);
      if (localMatched) {
        return { paid: true, event: localMatched };
      }

      // 2. Consulta direta à subcoleção do próprio usuário no Firestore
      try {
        if (currentUser?.id) {
          const userSubSnap = await getDocs(collection(db, 'users', currentUser.id, 'webhook_events'));
          const userEvents = userSubSnap.docs.map((d) => d.data() as InfinitePayWebhookEvent);
          userEvents.sort((a, b) => new Date(b.receivedAt || 0).getTime() - new Date(a.receivedAt || 0).getTime());
          const matchedInSub = userEvents.find(isMatch);
          if (matchedInSub) {
            return { paid: true, event: matchedInSub };
          }
        }

        // Se for admin, pode consultar o ledger central
        if (currentUser?.role === 'ADMIN') {
          const snap = await getDocs(collection(db, 'webhook_events'));
          const allEvents = snap.docs.map((d) => d.data() as InfinitePayWebhookEvent);
          allEvents.sort((a, b) => new Date(b.receivedAt || 0).getTime() - new Date(a.receivedAt || 0).getTime());
          const matchedDoc = allEvents.find(isMatch);
          if (matchedDoc) {
            return { paid: true, event: matchedDoc };
          }
        }
      } catch (err) {
        console.warn('[Firebase] Consulta direta a webhook_events falhou:', err);
      }

      // 3. Consulta ao endpoint local do servidor se estiver disponível
      try {
        const serverBase = infinitePayConfig.serverWebhookUrl
          ? infinitePayConfig.serverWebhookUrl.replace(/\/api\/webhooks\/infinitepay\/?$/, '')
          : '';
        const serverUrl = serverBase
          ? `${serverBase}/api/webhooks/infinitepay/status/${encodeURIComponent(orderNsu)}`
          : `/api/webhooks/infinitepay/status/${encodeURIComponent(orderNsu)}`;

        const res = await fetch(serverUrl);
        const text = await res.text();
        if (text.startsWith('{')) {
          const data = JSON.parse(text);
          if (data.paid && data.event) {
            // Garante que o evento pertence ao usuário atual
            if (!currentUser || !data.event.userId || data.event.userId === currentUser.id || currentUser.role === 'ADMIN') {
              return { paid: true, event: data.event };
            }
          }
        }
      } catch {
        // Ignored
      }

      return {
        paid: false,
        message: 'Nenhum pagamento confirmado foi localizado para este pedido até o momento.',
      };
    },
    [webhookEvents, infinitePayConfig.serverWebhookUrl, currentUser]
  );

  // Booking batch creation
  const createBookingBatch = useCallback(
    async (bookingData: PendingBookingData, client: User): Promise<string[]> => {
      const selectedService = services.find((s) => s.id === bookingData.serviceId);
      if (!selectedService) return [];

      const recurrenceId = bookingData.datesAndTimes.length > 1 ? `rec-${Date.now()}` : undefined;
      const isSubscriber = isUserSubscriber(client);

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

      // Persist to Firebase
      try {
        for (const b of newBookings) {
          await setDoc(doc(db, 'bookings', b.id), b);
        }
      } catch (err) {
        console.error('[Firebase] Erro ao gravar agendamentos no Firestore:', err);
      }

      return createdIds;
    },
    [services]
  );

  // Booking status update
  const updateBookingStatus = useCallback(
    async (bookingId: string, status: BookingStatus, paymentMethod: PaymentMethod = 'PIX', cancelReason?: string) => {
      let updatedBooking: Booking | null = null;
      let transactionToSave: CashTransaction | null = null;

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
          updatedBooking = updated;

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
              createdByName: 'Lucas Hoffmann Barber',
            };
            transactionToSave = trans;
            setTransactions((t) => [trans, ...t]);
          }

          return updated;
        })
      );

      try {
        if (updatedBooking) {
          await setDoc(doc(db, 'bookings', bookingId), updatedBooking, { merge: true });
        }
        if (transactionToSave) {
          await setDoc(doc(db, 'transactions', (transactionToSave as CashTransaction).id), transactionToSave);
        }
      } catch (err) {
        console.error('[Firebase] Erro ao atualizar agendamento:', err);
      }
    },
    []
  );

  const markReminderSent = useCallback(async (bookingId: string) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, reminderSent: true } : b)));
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { reminderSent: true });
    } catch (err) {
      console.error('[Firebase] Erro ao atualizar lembrete:', err);
    }
  }, []);

  // WhatsApp Preformatted Reminder Dispatcher
  const sendWhatsAppReminder = useCallback(
    (booking: Booking) => {
      const cleanPhone = booking.clientPhone.replace(/\D/g, '');
      const formattedDate = booking.date.split('-').reverse().join('/');
      const text = `💈 *Lembrete Lucas Hoffmann Barber*\n\nOlá, *${booking.clientName}*! Seu horário para *${booking.serviceName}* com *${booking.barberName}* está agendado para:\n\n📅 Data: *${formattedDate}*\n⏰ Horário: *${booking.time}*\n📍 Endereço: *Rua das Palmeiras, 450 - Centro*\n\nPor favor, chegue com 5 minutos de antecedência. Caso precise reagendar, nos avise aqui pelo WhatsApp!\n\n_Aguardamos você!_`;

      markReminderSent(booking.id);
      dismissAdminReminder();

      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    },
    [markReminderSent, dismissAdminReminder]
  );

  // Availability & Absence
  const updateAvailabilityConfig = useCallback(async (config: Partial<BarberAvailabilityConfig>) => {
    setAvailabilityConfig((prev) => ({ ...prev, ...config }));
    try {
      await setDoc(doc(db, 'settings', 'availability'), config, { merge: true });
    } catch (err) {
      console.error('[Firebase] Erro ao salvar disponibilidade:', err);
    }
  }, []);

  const addAbsenceDay = useCallback(async (date: string, reason: string) => {
    const newAbsence: AbsenceDay = {
      id: `abs-${Date.now()}`,
      date,
      reason,
    };
    setAbsenceDays((prev) => [...prev, newAbsence]);
    try {
      await setDoc(doc(db, 'absences', newAbsence.id), newAbsence);
    } catch (err) {
      console.error('[Firebase] Erro ao salvar ausência:', err);
    }
  }, []);

  const deleteAbsenceDay = useCallback(async (id: string) => {
    setAbsenceDays((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteDoc(doc(db, 'absences', id));
    } catch (err) {
      console.error('[Firebase] Erro ao deletar ausência:', err);
    }
  }, []);

  // Transactions
  const addTransaction = useCallback(async (transData: Omit<CashTransaction, 'id' | 'date'>) => {
    const newTrans: CashTransaction = {
      ...transData,
      id: `trans-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [newTrans, ...prev]);
    try {
      await setDoc(doc(db, 'transactions', newTrans.id), newTrans);
    } catch (err) {
      console.error('[Firebase] Erro ao registrar transação:', err);
    }
  }, []);

  // Clear all test data utility
  const clearAllTestData = useCallback(async () => {
    // 1. Clear state
    setBookings([]);
    setTransactions([]);
    setAbsenceDays([]);
    const cleanUsers = [
      {
        id: 'user-admin',
        name: 'Lucas Hoffmann (Administrador)',
        email: 'belchior87@gmail.com',
        phone: '(11) 98765-4321',
        role: 'ADMIN' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
    ];
    setUsers(cleanUsers);

    // 2. Clear localStorage
    localStorage.removeItem('barber_bookings');
    localStorage.removeItem('barber_transactions');
    localStorage.removeItem('barber_absence_days');
    localStorage.setItem('barber_users', JSON.stringify(cleanUsers));

    // 3. Clear from Firestore collections
    try {
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      for (const d of bookingsSnap.docs) {
        await deleteDoc(d.ref);
      }
      const transSnap = await getDocs(collection(db, 'transactions'));
      for (const d of transSnap.docs) {
        await deleteDoc(d.ref);
      }
      const absSnap = await getDocs(collection(db, 'absences'));
      for (const d of absSnap.docs) {
        await deleteDoc(d.ref);
      }
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        if (d.data().email !== 'belchior87@gmail.com') {
          await deleteDoc(d.ref);
        }
      }
      console.log('[Firebase] Dados de teste limpos com sucesso.');
    } catch (err) {
      console.error('[Firebase] Erro ao limpar dados de teste no Firestore:', err);
    }
  }, []);

  // Financial Revenue Forecast calculation
  const getRevenueForecasts = useCallback((): RevenueForecast[] => {
    const now = new Date();
    const safeUsers = users || [];
    const safeBookings = bookings || [];
    const safePlans = plans || [];

    const activeSubscribers = safeUsers.filter((u) => isUserSubscriber(u));
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
    const todayMs = Date.now();

    return clientsOnly.map((c) => {
      const userBookings = safeBookings.filter((b) => b.clientId === c.id);
      const totalBookings = userBookings.length;
      const completed = userBookings.filter((b) => b.status === 'EXECUTADO');
      const cancelled = userBookings.filter((b) => b.status === 'CANCELADO');
      const totalSpent = completed.reduce((acc, curr) => acc + (curr.servicePrice || 0), 0);

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
        hasSubscription: isUserSubscriber(c),
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
      isFirebaseConnected,
      clearAllTestData,
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
      webhookEvents,
      recordWebhookEvent,
      clearWebhookEvents,
      verifyPaymentForOrder,
      subscribeUserToPlan,
      cancelUserSubscription,
      isUserSubscriber,
      setUserPendingCheckout,
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
      isFirebaseConnected,
      clearAllTestData,
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
      webhookEvents,
      recordWebhookEvent,
      clearWebhookEvents,
      verifyPaymentForOrder,
      subscribeUserToPlan,
      cancelUserSubscription,
      setUserPendingCheckout,
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
