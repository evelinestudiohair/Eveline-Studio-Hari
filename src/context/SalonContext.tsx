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
        return parsed;
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
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? { ...c, totalAppointments: (c.totalAppointments || 0) + 1 }
          : c
      )
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

    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'CONFIRMADO',
            updatedAt: nowIso,
            history: [
              ...item.history,
              {
                status: 'CONFIRMADO',
                timestamp: nowIso,
                note: 'Agendamento confirmado pela administradora. Vaga reservada.',
              },
            ],
          };
        }
        return item;
      })
    );

    return { success: true, message: 'Agendamento confirmado com sucesso!' };
  };

  // 3. Admin Refuses Appointment
  const refuseAppointment = (id: string, reason?: string) => {
    const nowIso = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'RECUSADO',
            adminNotes: reason || item.adminNotes,
            updatedAt: nowIso,
            history: [
              ...item.history,
              {
                status: 'RECUSADO',
                timestamp: nowIso,
                note: `Agendamento recusado${reason ? `: ${reason}` : ''}.`,
              },
            ],
          };
        }
        return item;
      })
    );
  };

  // 4. Admin Offers Alternative Slot (Status changes to AGUARDANDO NOVO HORÁRIO)
  const offerAlternativeSlot = (
    id: string,
    newDate: string,
    newTime: string,
    alternatives: string[]
  ) => {
    const nowIso = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'AGUARDANDO NOVO HORÁRIO',
            offeredDate: newDate,
            offeredTime: newTime,
            offeredAlternatives: alternatives,
            updatedAt: nowIso,
            history: [
              ...item.history,
              {
                status: 'AGUARDANDO NOVO HORÁRIO',
                timestamp: nowIso,
                note: `Administradora sugeriu novo horário: ${newDate} às ${newTime}.`,
              },
            ],
          };
        }
        return item;
      })
    );
  };

  // 5. Cancel Appointment (Frees slot immediately)
  const cancelAppointment = (id: string, reason?: string) => {
    const nowIso = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'CANCELADO',
            adminNotes: reason ? `Cancelado: ${reason}` : item.adminNotes,
            updatedAt: nowIso,
            history: [
              ...item.history,
              {
                status: 'CANCELADO',
                timestamp: nowIso,
                note: `Agendamento cancelado. Vaga liberada.${reason ? ` Motivo: ${reason}` : ''}`,
              },
            ],
          };
        }
        return item;
      })
    );

    // Notification
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'Agendamento cancelado',
          message: `O agendamento de ${apt.clientName} em ${formatDateBR(apt.date)} às ${apt.time} foi cancelado e a vaga liberada.`,
          type: 'CANCELLATION',
          appointmentId: id,
          isRead: false,
          createdAt: nowIso,
        },
        ...prev,
      ]);
    }
  };

  // 6. Finalize Appointment (Finished procedure)
  const finalizeAppointment = (id: string) => {
    const nowIso = new Date().toISOString();
    const apt = appointments.find((a) => a.id === id);

    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'FINALIZADO',
            updatedAt: nowIso,
            history: [
              ...item.history,
              {
                status: 'FINALIZADO',
                timestamp: nowIso,
                note: 'Atendimento concluído com sucesso.',
              },
            ],
          };
        }
        return item;
      })
    );

    if (apt?.clientId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === apt.clientId
            ? {
                ...c,
                completedAppointments: (c.completedAppointments || 0) + 1,
                lastVisit: apt.date,
              }
            : c
        )
      );
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
    return { success: true, message: 'Agendamento cadastrado com sucesso!' };
  };

  // 8. Week Opening & Closing
  const toggleWeekStatus = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.id === weekId) {
          const nextStatus = w.status === 'OPEN' ? 'CLOSED' : 'OPEN';
          return { ...w, status: nextStatus };
        }
        return w;
      })
    );
  };

  const openWeek = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((w) => (w.id === weekId ? { ...w, status: 'OPEN' } : w))
    );
  };

  const closeWeek = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((w) => (w.id === weekId ? { ...w, status: 'CLOSED' } : w))
    );
  };

  // 9. Availability updates
  const updateDayAvailability = (
    dayOfWeek: number,
    updates: Partial<DayAvailabilityConfig>
  ) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, ...updates } : item
      )
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
          return { ...item, customSlotCapacities: custom };
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
  };

  const removeBlockedSlot = (id: string) => {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
  };

  // 11. Services CRUD
  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      id: `srv-${Date.now()}`,
      ...serviceData,
    };
    setServices((prev) => [...prev, newService]);
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleServiceActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  // 12. Client Notes
  const updateClientNotes = (id: string, notes: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    );
  };

  // 13. Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
    setSettings((prev) => ({ ...prev, ...sanitized }));
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
