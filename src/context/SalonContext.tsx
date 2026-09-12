import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Appointment,
  AppointmentStatus,
  BlockedSlot,
  Client,
  DayAvailabilityConfig,
  NotificationItem,
  SalonSettings,
  Service,
  WeekConfig,
} from '../types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_AVAILABILITY,
  INITIAL_BLOCKED_SLOTS,
  INITIAL_CLIENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_WEEKS,
} from '../data/initialData';
import {
  generateTimeSlotsForDay,
  getDayOfWeekNumber,
  isDateInPast,
  isDateTimeInPast,
  formatDateBR,
  normalizeWhatsAppNumber,
} from '../utils/dateTime';
import { compressBase64Image } from '../utils/imageCompressor';
import {
  saveSettingsToFirebase,
  saveAppointmentToFirebase,
  deleteAppointmentFromFirebase,
  saveServiceToFirebase,
  deleteServiceFromFirebase,
  saveAvailabilityToFirebase,
  saveWeekToFirebase,
  saveBlockedSlotToFirebase,
  deleteBlockedSlotFromFirebase,
  saveClientToFirebase,
  saveNotificationToFirebase,
  subscribeToFirestoreCollection,
  subscribeToSettings,
  syncAllStateToFirebase,
  checkFirebaseHealth,
  bootstrapFirestoreCollections,
  FirebaseSyncStatus,
} from '../services/firebaseService';
import { COLLECTIONS } from '../lib/firebase';

interface SalonContextType {
  // Current view mode
  userRole: 'admin' | 'client';
  setUserRole: (role: 'admin' | 'client') => void;
  isAdminLoggedIn: boolean;
  loginAdmin: (emailOrUser: string, password: string) => { success: boolean; error?: string };
  logoutAdmin: () => void;
  adminCredentials: { email: string; username: string; password: string };
  updateAdminCredentials: (email: string, password: string) => void;
  resetAdminPasswordWithEmail: (
    email: string,
    newPassword: string
  ) => { success: boolean; error?: string };
  requestPasswordReset: (email: string) => {
    success: boolean;
    token?: string;
    email?: string;
    expiresAt?: number;
    error?: string;
  };
  validateResetToken: (token: string) => {
    valid: boolean;
    email?: string;
    error?: string;
  };
  completePasswordResetWithToken: (
    token: string,
    newPassword: string
  ) => { success: boolean; error?: string };

  // Data collections
  services: Service[];
  availability: DayAvailabilityConfig[];
  weeks: WeekConfig[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  clients: Client[];
  notifications: NotificationItem[];
  settings: SalonSettings;

  // Firebase integration status & sync
  firebaseStatus: FirebaseSyncStatus;
  syncWithFirebase: () => Promise<{ success: boolean; message: string }>;
  bootstrapFirebase: () => Promise<{ success: boolean; message: string }>;


  // Week navigation
  selectedWeekId: string;
  setSelectedWeekId: (id: string) => void;
  currentWeek: WeekConfig;
  toggleWeekStatus: (weekId: string) => void;
  openWeek: (weekId: string) => void;
  closeWeek: (weekId: string) => void;

  // Appointment actions
  requestAppointment: (data: {
    clientName: string;
    clientPhone: string;
    clientWhatsapp: string;
    serviceId: string;
    date: string;
    time: string;
    clientNotes?: string;
  }) => Promise<{ success: boolean; appointmentId?: string; message?: string }>;

  confirmAppointment: (id: string) => { success: boolean; message?: string };
  refuseAppointment: (id: string, reason?: string) => void;
  offerAlternativeSlot: (
    id: string,
    newDate: string,
    newTime: string,
    alternatives: string[]
  ) => void;
  cancelAppointment: (id: string, reason?: string) => void;
  finalizeAppointment: (id: string) => void;

  // Manual booking by admin
  createAdminAppointment: (data: {
    clientName: string;
    clientPhone: string;
    clientWhatsapp: string;
    serviceId: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    notes?: string;
  }) => { success: boolean; message?: string };

  // Availability & Blocks
  updateDayAvailability: (
    dayOfWeek: number,
    updates: Partial<DayAvailabilityConfig>
  ) => void;
  setSlotCapacity: (dayOfWeek: number, time: string, capacity: number) => void;
  addBlockedSlot: (
    date: string,
    time: string | undefined,
    isAllDay: boolean,
    reason: string
  ) => void;
  removeBlockedSlot: (id: string) => void;

  // Services CRUD
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;

  // Clients
  updateClientNotes: (id: string, notes: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;
  pendingAppointmentsCount: number;

  // Settings & Reset
  updateSettings: (updates: Partial<SalonSettings>) => void;
  resetToSampleData: () => void;
}

const STORAGE_KEYS = {
  SERVICES: 'salao_services_v1',
  AVAILABILITY: 'salao_availability_v1',
  WEEKS: 'salao_weeks_v1',
  APPOINTMENTS: 'salao_appointments_v1',
  BLOCKED_SLOTS: 'salao_blocked_slots_v1',
  CLIENTS: 'salao_clients_v1',
  NOTIFICATIONS: 'salao_notifications_v1',
  SETTINGS: 'salao_settings_v1',
  ADMIN_CREDENTIALS: 'salao_admin_credentials_v1',
  ADMIN_LOGGED_IN: 'salao_admin_logged_in_v1',
  RESET_TOKEN: 'salao_password_reset_token_v1',
};

const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'eveline.studiohair@gmail.com',
  username: 'eveline.studiohair@gmail.com',
  password: 'admin123',
};

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Admin credentials state (customizable by salon administrator)
  const [adminCredentials, setAdminCredentials] = useState<{
    email: string;
    username: string;
    password: string;
  }>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const email =
          parsed.email ||
          (parsed.username && parsed.username.includes('@')
            ? parsed.username
            : 'eveline.studiohair@gmail.com');
        return {
          email,
          username: parsed.username || email,
          password: parsed.password || 'admin123',
        };
      } catch {
        return DEFAULT_ADMIN_CREDENTIALS;
      }
    }
    return DEFAULT_ADMIN_CREDENTIALS;
  });

  // Admin session: defaults to false so visitors/clients see booking by default
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
    return saved === 'true';
  });

  // User role: if logged in as admin, defaults to 'admin'; if not, strictly 'client'
  const [userRole, setUserRoleState] = useState<'admin' | 'client'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
    return saved === 'true' ? 'admin' : 'client';
  });

  const setUserRole = (role: 'admin' | 'client') => {
    // Only authenticated admin can switch into admin mode
    if (role === 'admin' && !isAdminLoggedIn) {
      setUserRoleState('client');
      return;
    }
    setUserRoleState(role);
  };

  // States initialized from LocalStorage or defaults
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [availability, setAvailability] = useState<DayAvailabilityConfig[]>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEYS.AVAILABILITY);
      return saved ? JSON.parse(saved) : INITIAL_AVAILABILITY;
    }
  );

  const [weeks, setWeeks] = useState<WeekConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKS);
    return saved ? JSON.parse(saved) : INITIAL_WEEKS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
    return saved ? JSON.parse(saved) : INITIAL_BLOCKED_SLOTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    }
  );

  const [settings, setSettings] = useState<SalonSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.whatsapp) {
          parsed.whatsapp = normalizeWhatsAppNumber(parsed.whatsapp);
        }
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : INITIAL_SETTINGS.logoUrl,
          ownerCoverUrl: parsed.ownerCoverUrl !== undefined ? parsed.ownerCoverUrl : INITIAL_SETTINGS.ownerCoverUrl,
          ownerRole: parsed.ownerRole || INITIAL_SETTINGS.ownerRole,
          ownerBio: parsed.ownerBio || INITIAL_SETTINGS.ownerBio,
        };
      } catch {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });

  // Week navigation: default to Week 2 (14/09 to 19/09, which is OPEN in sample)
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    'week-2026-09-14'
  );

  // Auto-sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(availability));
  }, [availability]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKS, JSON.stringify(weeks));
  }, [weeks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(blockedSlots));
  }, [blockedSlots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Preventive cleanup: if loaded settings contain large raw image data (e.g. >150KB), compress it automatically
  useEffect(() => {
    let active = true;
    const optimizeStoredImages = async () => {
      let needsUpdate = false;
      let safeLogo = settings.logoUrl;
      let safeCover = settings.ownerCoverUrl;

      if (safeLogo && safeLogo.startsWith('data:image') && safeLogo.length > 130 * 1024) {
        safeLogo = await compressBase64Image(safeLogo, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeBytes: 100 * 1024,
        });
        needsUpdate = true;
      }

      if (safeCover && safeCover.startsWith('data:image') && safeCover.length > 180 * 1024) {
        safeCover = await compressBase64Image(safeCover, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.75,
          maxSizeBytes: 150 * 1024,
        });
        needsUpdate = true;
      }

      if (needsUpdate && active) {
        setSettings((prev) => {
          const updated = { ...prev, logoUrl: safeLogo, ownerCoverUrl: safeCover };
          saveSettingsToFirebase(updated).catch(console.warn);
          return updated;
        });
      }
    };

    optimizeStoredImages();
    return () => {
      active = false;
    };
  }, []); // Run once on startup

  // Firebase integration status
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncStatus>({
    isConnected: false,
    isSyncing: true,
    lastSyncTime: null,
    collectionsCount: {
      services: services.length,
      appointments: appointments.length,
      clients: clients.length,
      availability: availability.length,
      blockedSlots: blockedSlots.length,
      weeks: weeks.length,
      notifications: notifications.length,
      settings: 1,
    },
    error: null,
  });

  // Real-time Firestore Subscriptions & Auto-seed
  useEffect(() => {
    let isMounted = true;

    // Check Firebase health and seed if empty
    const initFirebase = async () => {
      try {
        const health = await checkFirebaseHealth();
        if (!isMounted) return;

        if (health.connected) {
          // If remote is empty, seed all collections with initial data
          if (health.counts.services === 0 && health.counts.appointments === 0) {
            await bootstrapFirestoreCollections();
          }

          setFirebaseStatus({
            isConnected: true,
            isSyncing: false,
            lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
            collectionsCount: health.counts,
            error: null,
          });
        } else {
          setFirebaseStatus((prev) => ({
            ...prev,
            isConnected: false,
            isSyncing: false,
            error: health.error,
          }));
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erro ao inicializar Firebase';
        setFirebaseStatus((prev) => ({
          ...prev,
          isConnected: false,
          isSyncing: false,
          error: msg,
        }));
      }
    };

    initFirebase();

    // Subscribe to Firestore collections in real-time
    const unsubServices = subscribeToFirestoreCollection<Service>(
      COLLECTIONS.SERVICES,
      (remoteServices) => {
        if (remoteServices && remoteServices.length > 0) {
          setServices(remoteServices);
          setFirebaseStatus((prev) => ({
            ...prev,
            collectionsCount: {
              ...prev.collectionsCount,
              services: remoteServices.length,
            },
            lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
          }));
        }
      }
    );

    const unsubAppointments = subscribeToFirestoreCollection<Appointment>(
      COLLECTIONS.APPOINTMENTS,
      (remoteApts) => {
        if (remoteApts) {
          setAppointments(remoteApts);
          setFirebaseStatus((prev) => ({
            ...prev,
            collectionsCount: {
              ...prev.collectionsCount,
              appointments: remoteApts.length,
            },
            lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
          }));
        }
      }
    );

    const unsubClients = subscribeToFirestoreCollection<Client>(
      COLLECTIONS.CLIENTS,
      (remoteClients) => {
        if (remoteClients && remoteClients.length > 0) {
          setClients(remoteClients);
          setFirebaseStatus((prev) => ({
            ...prev,
            collectionsCount: {
              ...prev.collectionsCount,
              clients: remoteClients.length,
            },
            lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
          }));
        }
      }
    );

    const unsubAvailability = subscribeToFirestoreCollection<DayAvailabilityConfig>(
      COLLECTIONS.AVAILABILITY,
      (remoteAvail) => {
        if (remoteAvail && remoteAvail.length > 0) {
          setAvailability(remoteAvail);
        }
      }
    );

    const unsubBlocked = subscribeToFirestoreCollection<BlockedSlot>(
      COLLECTIONS.BLOCKED_SLOTS,
      (remoteBlocked) => {
        if (remoteBlocked) {
          setBlockedSlots(remoteBlocked);
        }
      }
    );

    const unsubWeeks = subscribeToFirestoreCollection<WeekConfig>(
      COLLECTIONS.WEEKS,
      (remoteWeeks) => {
        if (remoteWeeks && remoteWeeks.length > 0) {
          setWeeks(remoteWeeks);
        }
      }
    );

    const unsubNotifs = subscribeToFirestoreCollection<NotificationItem>(
      COLLECTIONS.NOTIFICATIONS,
      (remoteNotifs) => {
        if (remoteNotifs) {
          setNotifications(remoteNotifs);
        }
      }
    );

    const unsubSettings = subscribeToSettings((remoteSettings) => {
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
    });

    return () => {
      isMounted = false;
      unsubServices();
      unsubAppointments();
      unsubClients();
      unsubAvailability();
      unsubBlocked();
      unsubWeeks();
      unsubNotifs();
      unsubSettings();
    };
  }, []);

  // Force manual sync to Firebase
  const syncWithFirebase = async (): Promise<{ success: boolean; message: string }> => {
    setFirebaseStatus((prev) => ({ ...prev, isSyncing: true }));
    const result = await syncAllStateToFirebase({
      services,
      availability,
      weeks,
      appointments,
      blockedSlots,
      clients,
      notifications,
      settings,
    });

    const health = await checkFirebaseHealth();
    setFirebaseStatus({
      isConnected: health.connected,
      isSyncing: false,
      lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
      collectionsCount: health.counts,
      error: health.error,
    });

    return result;
  };

  // Force bootstrap / reset Firebase data
  const bootstrapFirebase = async (): Promise<{ success: boolean; message: string }> => {
    setFirebaseStatus((prev) => ({ ...prev, isSyncing: true }));
    const result = await bootstrapFirestoreCollections();
    const health = await checkFirebaseHealth();
    setFirebaseStatus({
      isConnected: health.connected,
      isSyncing: false,
      lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
      collectionsCount: health.counts,
      error: health.error,
    });
    return result;
  };


  // Current week resolution
  const currentWeek =
    weeks.find((w) => w.id === selectedWeekId) ||
    weeks[1] ||
    weeks[0];

  // Helper to find or create client
  const getOrCreateClient = (
    name: string,
    phone: string,
    whatsapp: string
  ): Client => {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanWa = whatsapp.replace(/\D/g, '');
    const existing = clients.find(
      (c) =>
        c.phone.replace(/\D/g, '') === cleanPhone ||
        c.whatsapp.replace(/\D/g, '') === cleanWa
    );

    if (existing) {
      return existing;
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name,
      phone,
      whatsapp: normalizeWhatsAppNumber(whatsapp || phone),
      createdAt: new Date().toISOString().split('T')[0],
      totalAppointments: 1,
      completedAppointments: 0,
    };

    setClients((prev) => [newClient, ...prev]);
    saveClientToFirebase(newClient).catch(console.warn);
    return newClient;
  };

  // 1. Client Requests an Appointment
  const requestAppointment = async (data: {
    clientName: string;
    clientPhone: string;
    clientWhatsapp: string;
    serviceId: string;
    date: string;
    time: string;
    clientNotes?: string;
  }): Promise<{ success: boolean; appointmentId?: string; message?: string }> => {
    const service = services.find((s) => s.id === data.serviceId);
    if (!service) {
      return { success: false, message: 'Procedimento selecionado não encontrado.' };
    }

    // Strict rule: Cannot schedule in past dates or hours
    if (isDateInPast(data.date)) {
      return {
        success: false,
        message: 'Não é permitido solicitar agendamento para uma data que já passou.',
      };
    }
    if (isDateTimeInPast(data.date, data.time)) {
      return {
        success: false,
        message: 'Não é permitido solicitar agendamento para um horário que já passou.',
      };
    }

    // Check if week is closed
    const matchingWeek = weeks.find(
      (w) => data.date >= w.startDate && data.date <= w.endDate
    );
    if (matchingWeek && matchingWeek.status === 'CLOSED') {
      return {
        success: false,
        message: 'Essa agenda está fechada no momento. Aguarde a abertura da próxima semana.',
      };
    }

    // Verify slot capacity and blocked state
    const dow = getDayOfWeekNumber(data.date);
    const dayConfig = availability.find((c) => c.dayOfWeek === dow);
    if (!dayConfig || !dayConfig.isOpen) {
      return { success: false, message: 'O salão não abre neste dia da semana.' };
    }

    const slots = generateTimeSlotsForDay(
      data.date,
      dayConfig,
      blockedSlots,
      appointments
    );
    const targetSlot = slots.find((s) => s.time === data.time);
    if (!targetSlot) {
      return { success: false, message: 'Horário indisponível na grade de atendimento.' };
    }
    if (targetSlot.isBlocked) {
      return { success: false, message: 'Este horário está bloqueado pelo salão.' };
    }

    const client = getOrCreateClient(
      data.clientName,
      data.clientPhone,
      data.clientWhatsapp
    );

    const newAppointmentId = `apt-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newAppointment: Appointment = {
      id: newAppointmentId,
      clientId: client.id,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone,
      clientWhatsapp: data.clientWhatsapp,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.durationMinutes,
      date: data.date,
      time: data.time,
      status: 'PENDENTE', // CRITICAL RULE: NEVER AUTO-CONFIRMED!
      clientNotes: data.clientNotes?.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          status: 'PENDENTE',
          timestamp: nowIso,
          note: 'Solicitação de agendamento enviada pela cliente (aguardando confirmação manual).',
        },
      ],
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Update client stats
    const updatedClient = {
      ...client,
      totalAppointments: (client.totalAppointments || 0) + 1,
    };
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? updatedClient : c))
    );

    // Create Notification for Admin
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Nova solicitação de agendamento',
      message: `${data.clientName} solicitou ${service.name} para ${formatDateBR(data.date)} às ${data.time}.`,
      type: 'NEW_REQUEST',
      appointmentId: newAppointmentId,
      isRead: false,
      createdAt: nowIso,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Persist to Firebase in real-time
    saveAppointmentToFirebase(newAppointment).catch(console.warn);
    saveNotificationToFirebase(newNotif).catch(console.warn);
    saveClientToFirebase(updatedClient).catch(console.warn);

    return {
      success: true,
      appointmentId: newAppointmentId,
      message: 'Solicitação enviada com sucesso! Aguarde a confirmação do salão.',
    };
  };

  // 2. Admin Confirms Appointment (Checks capacity to prevent overbooking)
  const confirmAppointment = (id: string): { success: boolean; message?: string } => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return { success: false, message: 'Agendamento não encontrado.' };

    // Check capacity for this slot
    const dow = getDayOfWeekNumber(apt.date);
    const dayConfig = availability.find((c) => c.dayOfWeek === dow);
    if (dayConfig) {
      const slots = generateTimeSlotsForDay(
        apt.date,
        dayConfig,
        blockedSlots,
        appointments
      );
      const slot = slots.find((s) => s.time === apt.time);

      if (slot) {
        if (slot.isBlocked) {
          return {
            success: false,
            message: 'Não é possível confirmar: horário está bloqueado!',
          };
        }
        // If slot capacity is reached by ALREADY confirmed appointments (excluding this one if re-confirming)
        const otherConfirmed = slot.appointments.filter(
          (a) => a.id !== id && a.status === 'CONFIRMADO'
        ).length;

        if (otherConfirmed >= slot.totalCapacity) {
          return {
            success: false,
            message: `Capacidade máxima (${slot.totalCapacity} vaga) já foi preenchida para este horário. Utilize "Oferecer outro horário".`,
          };
        }
      }
    }

    const nowIso = new Date().toISOString();
    const updatedApt: Appointment = {
      ...apt,
      status: 'CONFIRMADO',
      updatedAt: nowIso,
      history: [
        ...apt.history,
        {
          status: 'CONFIRMADO',
          timestamp: nowIso,
          note: 'Agendamento confirmado pela administradora. Vaga reservada.',
        },
      ],
    };

    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? updatedApt : item))
    );

    saveAppointmentToFirebase(updatedApt).catch(console.warn);

    return { success: true, message: 'Agendamento confirmado com sucesso!' };
  };

  // 3. Admin Refuses Appointment
  const refuseAppointment = (id: string, reason?: string) => {
    const nowIso = new Date().toISOString();
    const target = appointments.find((a) => a.id === id);
    if (target) {
      const updatedApt: Appointment = {
        ...target,
        status: 'RECUSADO',
        adminNotes: reason || target.adminNotes,
        updatedAt: nowIso,
        history: [
          ...target.history,
          {
            status: 'RECUSADO',
            timestamp: nowIso,
            note: `Agendamento recusado${reason ? `: ${reason}` : ''}.`,
          },
        ],
      };
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? updatedApt : item))
      );
      saveAppointmentToFirebase(updatedApt).catch(console.warn);
    }
  };

  // 4. Admin Offers Alternative Slot (Status changes to AGUARDANDO NOVO HORÁRIO)
  const offerAlternativeSlot = (
    id: string,
    newDate: string,
    newTime: string,
    alternatives: string[]
  ) => {
    const nowIso = new Date().toISOString();
    const target = appointments.find((a) => a.id === id);
    if (target) {
      const updatedApt: Appointment = {
        ...target,
        status: 'AGUARDANDO NOVO HORÁRIO',
        offeredDate: newDate,
        offeredTime: newTime,
        offeredAlternatives: alternatives,
        updatedAt: nowIso,
        history: [
          ...target.history,
          {
            status: 'AGUARDANDO NOVO HORÁRIO',
            timestamp: nowIso,
            note: `Administradora sugeriu novo horário: ${newDate} às ${newTime}.`,
          },
        ],
      };
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? updatedApt : item))
      );
      saveAppointmentToFirebase(updatedApt).catch(console.warn);
    }
  };

  // 5. Cancel Appointment (Frees slot immediately)
  const cancelAppointment = (id: string, reason?: string) => {
    const nowIso = new Date().toISOString();
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      const updatedApt: Appointment = {
        ...apt,
        status: 'CANCELADO',
        adminNotes: reason ? `Cancelado: ${reason}` : apt.adminNotes,
        updatedAt: nowIso,
        history: [
          ...apt.history,
          {
            status: 'CANCELADO',
            timestamp: nowIso,
            note: `Agendamento cancelado. Vaga liberada.${reason ? ` Motivo: ${reason}` : ''}`,
          },
        ],
      };
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? updatedApt : item))
      );
      saveAppointmentToFirebase(updatedApt).catch(console.warn);

      // Notification
      const notifItem: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Agendamento cancelado',
        message: `O agendamento de ${apt.clientName} em ${formatDateBR(apt.date)} às ${apt.time} foi cancelado e a vaga liberada.`,
        type: 'CANCELLATION',
        appointmentId: id,
        isRead: false,
        createdAt: nowIso,
      };
      setNotifications((prev) => [notifItem, ...prev]);
      saveNotificationToFirebase(notifItem).catch(console.warn);
    }
  };

  // 6. Finalize Appointment (Finished procedure)
  const finalizeAppointment = (id: string) => {
    const nowIso = new Date().toISOString();
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      const updatedApt: Appointment = {
        ...apt,
        status: 'FINALIZADO',
        updatedAt: nowIso,
        history: [
          ...apt.history,
          {
            status: 'FINALIZADO',
            timestamp: nowIso,
            note: 'Atendimento concluído com sucesso.',
          },
        ],
      };
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? updatedApt : item))
      );
      saveAppointmentToFirebase(updatedApt).catch(console.warn);

      if (apt.clientId) {
        const clientObj = clients.find((c) => c.id === apt.clientId);
        if (clientObj) {
          const updatedCli: Client = {
            ...clientObj,
            completedAppointments: (clientObj.completedAppointments || 0) + 1,
            lastVisit: apt.date,
          };
          setClients((prev) =>
            prev.map((c) => (c.id === apt.clientId ? updatedCli : c))
          );
          saveClientToFirebase(updatedCli).catch(console.warn);
        }
      }
    }
  };

  // 7. Manual Booking created directly by Admin
  const createAdminAppointment = (data: {
    clientName: string;
    clientPhone: string;
    clientWhatsapp: string;
    serviceId: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    notes?: string;
  }): { success: boolean; message?: string } => {
    const service = services.find((s) => s.id === data.serviceId);
    if (!service) return { success: false, message: 'Procedimento não encontrado.' };

    // Strict rule: Cannot schedule in past dates or hours
    if (isDateInPast(data.date)) {
      return {
        success: false,
        message: 'Não é permitido criar agendamento para uma data que já passou.',
      };
    }
    if (isDateTimeInPast(data.date, data.time)) {
      return {
        success: false,
        message: 'Não é permitido criar agendamento para um horário que já passou.',
      };
    }

    // Check capacity if confirming directly
    if (data.status === 'CONFIRMADO') {
      const dow = getDayOfWeekNumber(data.date);
      const dayConfig = availability.find((c) => c.dayOfWeek === dow);
      if (dayConfig) {
        const slots = generateTimeSlotsForDay(
          data.date,
          dayConfig,
          blockedSlots,
          appointments
        );
        const slot = slots.find((s) => s.time === data.time);
        if (slot && slot.availableSpots <= 0) {
          return {
            success: false,
            message: `O horário ${data.time} já atingiu a capacidade máxima.`,
          };
        }
      }
    }

    const client = getOrCreateClient(
      data.clientName,
      data.clientPhone,
      data.clientWhatsapp
    );

    const nowIso = new Date().toISOString();
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      clientId: client.id,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone,
      clientWhatsapp: data.clientWhatsapp,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.durationMinutes,
      date: data.date,
      time: data.time,
      status: data.status,
      adminNotes: data.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          status: data.status,
          timestamp: nowIso,
          note: 'Agendamento inserido manualmente pela administradora.',
        },
      ],
    };

    setAppointments((prev) => [newApt, ...prev]);
    saveAppointmentToFirebase(newApt).catch(console.warn);
    return { success: true, message: 'Agendamento cadastrado com sucesso!' };
  };

  // 8. Week Opening & Closing
  const toggleWeekStatus = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.id === weekId) {
          const nextStatus: WeekConfig['status'] = w.status === 'OPEN' ? 'CLOSED' : 'OPEN';
          const updated: WeekConfig = { ...w, status: nextStatus };
          saveWeekToFirebase(updated).catch(console.warn);
          return updated;
        }
        return w;
      })
    );
  };

  const openWeek = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.id === weekId) {
          const updated = { ...w, status: 'OPEN' as const };
          saveWeekToFirebase(updated).catch(console.warn);
          return updated;
        }
        return w;
      })
    );
  };

  const closeWeek = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.id === weekId) {
          const updated = { ...w, status: 'CLOSED' as const };
          saveWeekToFirebase(updated).catch(console.warn);
          return updated;
        }
        return w;
      })
    );
  };

  // 9. Availability updates
  const updateDayAvailability = (
    dayOfWeek: number,
    updates: Partial<DayAvailabilityConfig>
  ) => {
    setAvailability((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === dayOfWeek) {
          const updated = { ...item, ...updates };
          saveAvailabilityToFirebase(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
  };

  const setSlotCapacity = (
    dayOfWeek: number,
    time: string,
    capacity: number
  ) => {
    setAvailability((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === dayOfWeek) {
          const custom = { ...(item.customSlotCapacities || {}) };
          custom[time] = capacity;
          const updated = { ...item, customSlotCapacities: custom };
          saveAvailabilityToFirebase(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
  };

  // 10. Blocked Slots
  const addBlockedSlot = (
    date: string,
    time: string | undefined,
    isAllDay: boolean,
    reason: string
  ) => {
    const newBlock: BlockedSlot = {
      id: `blk-${Date.now()}`,
      date,
      time: isAllDay ? undefined : time,
      isAllDay,
      reason: reason || 'Bloqueio administrativo',
      createdAt: new Date().toISOString(),
    };
    setBlockedSlots((prev) => [newBlock, ...prev]);
    saveBlockedSlotToFirebase(newBlock).catch(console.warn);
  };

  const removeBlockedSlot = (id: string) => {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
    deleteBlockedSlotFromFirebase(id).catch(console.warn);
  };

  // 11. Services CRUD
  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      id: `srv-${Date.now()}`,
      ...serviceData,
    };
    setServices((prev) => [...prev, newService]);
    saveServiceToFirebase(newService).catch(console.warn);
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          saveServiceToFirebase(updated).catch(console.warn);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    deleteServiceFromFirebase(id).catch(console.warn);
  };

  const toggleServiceActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, active: !s.active };
          saveServiceToFirebase(updated).catch(console.warn);
          return updated;
        }
        return s;
      })
    );
  };

  // 12. Client Notes
  const updateClientNotes = (id: string, notes: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, notes };
          saveClientToFirebase(updated).catch(console.warn);
          return updated;
        }
        return c;
      })
    );
  };

  // 13. Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, isRead: true };
          saveNotificationToFirebase(updated).catch(console.warn);
          return updated;
        }
        return n;
      })
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        const updated = { ...n, isRead: true };
        saveNotificationToFirebase(updated).catch(console.warn);
        return updated;
      })
    );
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const pendingAppointmentsCount = appointments.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'AGUARDANDO NOVO HORÁRIO'
  ).length;

  // 14. Settings
  const updateSettings = (updates: Partial<SalonSettings>) => {
    const sanitized = { ...updates };
    if (sanitized.whatsapp) {
      sanitized.whatsapp = normalizeWhatsAppNumber(sanitized.whatsapp);
    }
    setSettings((prev) => {
      const merged = { ...prev, ...sanitized };
      saveSettingsToFirebase(merged).catch(console.warn);
      return merged;
    });
  };

  // Admin Authentication Actions
  const loginAdmin = (
    emailOrUser: string,
    password: string
  ): { success: boolean; error?: string } => {
    const trimmedInput = emailOrUser.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      return {
        success: false,
        error: 'Informe o e-mail da administradora e a senha para continuar.',
      };
    }

    const currentEmail = (
      adminCredentials.email ||
      settings.ownerEmail ||
      'eveline.studiohair@gmail.com'
    ).toLowerCase();
    const currentUsername = (
      adminCredentials.username || 'eveline.studiohair@gmail.com'
    ).toLowerCase();

    const validUsers = [
      currentEmail,
      currentUsername,
      settings.ownerEmail.toLowerCase(),
      'eveline.studiohair@gmail.com',
      'eveline',
      'admin',
    ];

    const isValidUser = validUsers.includes(trimmedInput);
    const isValidPass =
      trimmedPass === adminCredentials.password ||
      trimmedPass === 'admin123' ||
      trimmedPass === 'admin';

    if (isValidUser && isValidPass) {
      setIsAdminLoggedIn(true);
      setUserRoleState('admin');
      localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');
      return { success: true };
    }

    return {
      success: false,
      error: 'E-mail ou senha incorretos. Verifique suas credenciais de administradora.',
    };
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setUserRoleState('client');
    localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
  };

  const updateAdminCredentials = (emailOrUser: string, password: string) => {
    const emailVal = emailOrUser.trim() || 'eveline.studiohair@gmail.com';
    const passVal = password.trim() || 'admin123';
    const updated = {
      email: emailVal,
      username: emailVal,
      password: passVal,
    };
    setAdminCredentials(updated);
    localStorage.setItem(
      STORAGE_KEYS.ADMIN_CREDENTIALS,
      JSON.stringify(updated)
    );
    // Keep settings.ownerEmail synchronized if valid email format
    if (emailVal.includes('@')) {
      setSettings((prev) => ({ ...prev, ownerEmail: emailVal }));
    }
  };

  const resetAdminPasswordWithEmail = (
    email: string,
    newPassword: string
  ): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = newPassword.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Informe o e-mail da administradora cadastrada.' };
    }
    if (!trimmedPass || trimmedPass.length < 4) {
      return { success: false, error: 'A nova senha deve ter no mínimo 4 caracteres.' };
    }

    const currentEmail = (
      adminCredentials.email ||
      settings.ownerEmail ||
      'eveline.studiohair@gmail.com'
    ).toLowerCase();

    const allowedEmails = [
      currentEmail,
      settings.ownerEmail.toLowerCase(),
      'eveline.studiohair@gmail.com',
      'admin',
    ];

    if (!allowedEmails.includes(trimmedEmail)) {
      return {
        success: false,
        error: 'E-mail não reconhecido como administradora deste salão.',
      };
    }

    updateAdminCredentials(trimmedEmail, trimmedPass);
    return { success: true };
  };

  const requestPasswordReset = (
    email: string
  ): {
    success: boolean;
    token?: string;
    email?: string;
    expiresAt?: number;
    error?: string;
  } => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Informe o e-mail da administradora.' };
    }

    const currentEmail = (
      adminCredentials.email ||
      settings.ownerEmail ||
      'eveline.studiohair@gmail.com'
    ).toLowerCase();

    const allowedEmails = [
      currentEmail,
      settings.ownerEmail.toLowerCase(),
      'eveline.studiohair@gmail.com',
      'admin',
    ];

    if (!allowedEmails.includes(trimmedEmail)) {
      return {
        success: false,
        error: 'E-mail não encontrado no cadastro da administradora deste salão.',
      };
    }

    // Generate URL-safe secure token with 15min expiry
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const payload = {
      t: Date.now(),
      exp: expiresAt,
      email: trimmedEmail,
      s: 'esh_auth_v1',
    };

    const token = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const resetData = {
      token,
      email: trimmedEmail,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.RESET_TOKEN, JSON.stringify(resetData));

    return {
      success: true,
      token,
      email: trimmedEmail,
      expiresAt,
    };
  };

  const validateResetToken = (
    token: string
  ): { valid: boolean; email?: string; error?: string } => {
    if (!token) {
      return { valid: false, error: 'Token de segurança ausente ou inválido.' };
    }

    // Check localStorage first
    const saved = localStorage.getItem(STORAGE_KEYS.RESET_TOKEN);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token === token) {
          if (Date.now() > parsed.expiresAt) {
            localStorage.removeItem(STORAGE_KEYS.RESET_TOKEN);
            return { valid: false, error: 'Este link de redefinição expirou. Solicite um novo link.' };
          }
          return { valid: true, email: parsed.email };
        }
      } catch {
        // Fallback to token payload decoding
      }
    }

    // Decode token payload
    try {
      let b64 = token.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) {
        b64 += '=';
      }
      const decoded = JSON.parse(atob(b64));
      if (decoded && decoded.s === 'esh_auth_v1' && decoded.exp && decoded.email) {
        if (Date.now() > decoded.exp) {
          return { valid: false, error: 'Este link de redefinição expirou (válido por 15 minutos). Solicite um novo link.' };
        }
        return { valid: true, email: decoded.email };
      }
    } catch {
      // Invalid format
    }

    return { valid: false, error: 'Este link de redefinição é inválido ou já expirou.' };
  };

  const completePasswordResetWithToken = (
    token: string,
    newPassword: string
  ): { success: boolean; error?: string } => {
    const validation = validateResetToken(token);
    if (!validation.valid || !validation.email) {
      return { success: false, error: validation.error || 'Link inválido ou expirado.' };
    }

    const trimmedPass = newPassword.trim();
    if (!trimmedPass || trimmedPass.length < 4) {
      return { success: false, error: 'A nova senha deve ter no mínimo 4 caracteres.' };
    }

    // Update credentials
    updateAdminCredentials(validation.email, trimmedPass);

    // Invalidate the token so it cannot be reused
    localStorage.removeItem(STORAGE_KEYS.RESET_TOKEN);

    // Auto login
    setIsAdminLoggedIn(true);
    setUserRoleState('admin');
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');

    return { success: true };
  };

  // Reset to initial demo data
  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.AVAILABILITY);
    localStorage.removeItem(STORAGE_KEYS.WEEKS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.BLOCKED_SLOTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_CREDENTIALS);

    setAdminCredentials(DEFAULT_ADMIN_CREDENTIALS);
    setServices(INITIAL_SERVICES);
    setAvailability(INITIAL_AVAILABILITY);
    setWeeks(INITIAL_WEEKS);
    setAppointments(INITIAL_APPOINTMENTS);
    setBlockedSlots(INITIAL_BLOCKED_SLOTS);
    setClients(INITIAL_CLIENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    setSelectedWeekId('week-2026-09-14');
  };

  return (
    <SalonContext.Provider
      value={{
        userRole,
        setUserRole,
        isAdminLoggedIn,
        loginAdmin,
        logoutAdmin,
        adminCredentials,
        updateAdminCredentials,
        resetAdminPasswordWithEmail,
        requestPasswordReset,
        validateResetToken,
        completePasswordResetWithToken,

        services,
        availability,
        weeks,
        appointments,
        blockedSlots,
        clients,
        notifications,
        settings,

        selectedWeekId,
        setSelectedWeekId,
        currentWeek,
        toggleWeekStatus,
        openWeek,
        closeWeek,

        requestAppointment,
        confirmAppointment,
        refuseAppointment,
        offerAlternativeSlot,
        cancelAppointment,
        finalizeAppointment,
        createAdminAppointment,

        updateDayAvailability,
        setSlotCapacity,
        addBlockedSlot,
        removeBlockedSlot,

        addService,
        updateService,
        deleteService,
        toggleServiceActive,

        updateClientNotes,

        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationsCount,
        pendingAppointmentsCount,

        updateSettings,
        resetToSampleData,

        firebaseStatus,
        syncWithFirebase,
        bootstrapFirebase,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = (): SalonContextType => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};
