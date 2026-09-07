export type AppointmentStatus =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'RECUSADO'
  | 'CANCELADO'
  | 'AGUARDANDO NOVO HORÁRIO'
  | 'FINALIZADO';

export type WeekStatus = 'OPEN' | 'CLOSED';

export interface Service {
  id: string;
  name: string;
  durationMinutes: number; // e.g. 30, 45, 60, 90
  price: number; // in R$
  active: boolean;
  description?: string;
  category?: string;
}

export interface DayAvailabilityConfig {
  dayOfWeek: number; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  dayName: string;
  isOpen: boolean;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "18:00"
  intervalMinutes: number; // e.g. 60 or 30
  lunchBreakStart?: string; // e.g. "12:00"
  lunchBreakEnd?: string; // e.g. "13:00"
  defaultCapacity: number; // default capacity per slot (e.g. 1)
  customSlotCapacities?: Record<string, number>; // specific overrides like { "10:00": 2 }
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "14:00" or undefined for entire day
  isAllDay: boolean;
  reason: string;
  createdAt: string;
}

export interface WeekConfig {
  id: string; // e.g. "2026-W37" or startDate "2026-09-07"
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Saturday)
  status: WeekStatus;
  customMessage?: string;
}

export interface AppointmentHistoryItem {
  status: AppointmentStatus;
  timestamp: string;
  note?: string;
}

export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientWhatsapp: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  clientNotes?: string;
  adminNotes?: string;
  offeredDate?: string;
  offeredTime?: string;
  offeredAlternatives?: string[];
  createdAt: string;
  updatedAt: string;
  history: AppointmentHistoryItem[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  notes?: string;
  createdAt: string;
  lastVisit?: string;
  totalAppointments: number;
  completedAppointments: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'NEW_REQUEST' | 'PENDING_REMINDER' | 'CANCELLATION' | 'RESCHEDULE';
  appointmentId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SalonSettings {
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  cancellationPolicyNotice: string;
}

export interface TimeSlotDisplay {
  time: string;
  totalCapacity: number;
  confirmedCount: number;
  pendingCount: number;
  availableSpots: number;
  isBlocked: boolean;
  blockReason?: string;
  isPast: boolean;
  appointments: Appointment[];
}
