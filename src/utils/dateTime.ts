import {
  DayAvailabilityConfig,
  BlockedSlot,
  Appointment,
  TimeSlotDisplay,
  WeekConfig,
} from '../types';

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return days[date.getDay()];
}

export function formatFullDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const dayName = formatDayOfWeekName(dateStr);
  return `${dayName}, ${day} de ${months[date.getMonth()]} de ${year}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

// Date and Time helpers for past date restriction
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function isDateInPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const todayStr = getTodayDateStr();
  return dateStr < todayStr;
}

export function isDateTimeInPast(dateStr: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  const todayStr = getTodayDateStr();
  if (dateStr < todayStr) return true;
  if (dateStr === todayStr && timeStr) {
    const currentTimeStr = getCurrentTimeStr();
    return timeStr <= currentTimeStr;
  }
  return false;
}

// Generate an array of dates from Monday to Saturday for a given week start date (YYYY-MM-DD)
export function getWeekDates(mondayStr: string): string[] {
  const [year, month, day] = mondayStr.split('-').map(Number);
  const monday = new Date(year, month - 1, day);
  const dates: string[] = [];

  for (let i = 0; i < 6; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
  }
  return dates;
}

// Check day of week: 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado, 0=Domingo
export function getDayOfWeekNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

// Generate time slots according to daily configuration (e.g. 08:00 to 18:00, 60min interval)
export function generateTimeSlotsForDay(
  dateStr: string,
  config: DayAvailabilityConfig | undefined,
  blockedSlots: BlockedSlot[],
  appointments: Appointment[]
): TimeSlotDisplay[] {
  if (!config || !config.isOpen) {
    return [];
  }

  // Check if entire day is blocked
  const dayBlocked = blockedSlots.find(
    (b) => b.date === dateStr && (b.isAllDay || !b.time)
  );
  if (dayBlocked) {
    return [];
  }

  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);
  const interval = config.intervalMinutes || 60;

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let lunchStartMin = -1;
  let lunchEndMin = -1;
  if (config.lunchBreakStart && config.lunchBreakEnd) {
    const [lsh, lsm] = config.lunchBreakStart.split(':').map(Number);
    const [leh, lem] = config.lunchBreakEnd.split(':').map(Number);
    lunchStartMin = lsh * 60 + lsm;
    lunchEndMin = leh * 60 + lem;
  }

  const slots: TimeSlotDisplay[] = [];

  for (let m = startMinutes; m < endMinutes; m += interval) {
    // If slot falls inside lunch break
    if (lunchStartMin !== -1 && lunchEndMin !== -1) {
      if (m >= lunchStartMin && m < lunchEndMin) {
        continue;
      }
    }

    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // Capacity for this slot
    const slotCapacity =
      config.customSlotCapacities && config.customSlotCapacities[timeStr] !== undefined
        ? config.customSlotCapacities[timeStr]
        : config.defaultCapacity || 1;

    // Check if slot specifically blocked
    const slotBlock = blockedSlots.find(
      (b) => b.date === dateStr && b.time === timeStr
    );

    // Filter appointments for this date and time
    const slotAppointments = appointments.filter(
      (a) => a.date === dateStr && a.time === timeStr && a.status !== 'CANCELADO' && a.status !== 'RECUSADO'
    );

    // IMPORTANT: In rules: Only CONFIRMADO occupies the slot!
    const confirmedCount = slotAppointments.filter(
      (a) => a.status === 'CONFIRMADO'
    ).length;

    const pendingCount = slotAppointments.filter(
      (a) => a.status === 'PENDENTE' || a.status === 'AGUARDANDO NOVO HORÁRIO'
    ).length;

    const isBlocked = !!slotBlock;
    const isPast = isDateTimeInPast(dateStr, timeStr);
    const availableSpots = (isBlocked || isPast) ? 0 : Math.max(0, slotCapacity - confirmedCount);

    slots.push({
      time: timeStr,
      totalCapacity: slotCapacity,
      confirmedCount,
      pendingCount,
      availableSpots,
      isBlocked,
      blockReason: slotBlock?.reason,
      isPast,
      appointments: slotAppointments,
    });
  }

  return slots;
}

// Find available alternative slots for "Oferecer Outro Horário"
export function findAlternativeAvailableSlots(
  dateStr: string,
  configs: DayAvailabilityConfig[],
  blockedSlots: BlockedSlot[],
  appointments: Appointment[],
  preferredTime?: string
): { date: string; time: string; label: string }[] {
  // Can't offer alternatives on dates that are in the past
  if (isDateInPast(dateStr)) return [];

  const dow = getDayOfWeekNumber(dateStr);
  const dayConfig = configs.find((c) => c.dayOfWeek === dow);
  if (!dayConfig || !dayConfig.isOpen) return [];

  const slots = generateTimeSlotsForDay(dateStr, dayConfig, blockedSlots, appointments);
  const available = slots.filter((s) => !s.isBlocked && !s.isPast && s.availableSpots > 0);

  // Return up to 6 alternatives
  return available
    .filter((s) => s.time !== preferredTime)
    .slice(0, 6)
    .map((s) => ({
      date: dateStr,
      time: s.time,
      label: `${s.time} (${s.availableSpots} ${s.availableSpots === 1 ? 'vaga' : 'vagas'})`,
    }));
}

// Normalizes Brazilian phone numbers for WhatsApp (wa.me)
// Ensures country code +55 is present exactly once, preventing duplications like +55 55...
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (!clean) return '';

  // Strip duplicate 55 prefix if present (e.g. 5555981920180 -> 55981920180)
  while (clean.startsWith('5555')) {
    clean = clean.slice(2);
  }

  // If number already begins with country code '55':
  if (clean.startsWith('55')) {
    // If it has 12 or 13 digits (55 + 2-digit DDD + 8 or 9 phone digits), it's complete
    if (clean.length === 12 || clean.length === 13) {
      return clean;
    }
    // If it has 11 digits starting with 55 (e.g. 55981920180):
    // Already starts with 55! NEVER prepend another 55!
    if (clean.length === 11 || clean.length === 10) {
      return clean;
    }
    return clean;
  }

  // If number does NOT start with '55':
  // Brazilian numbers with 2-digit DDD are 10 (landline) or 11 (mobile) digits
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }

  // Shorter numbers (8 or 9 digits without DDD): prepend 55
  if (clean.length === 8 || clean.length === 9) {
    return `55${clean}`;
  }

  return clean;
}

// Build WhatsApp Link with automatic deduplication of country code
export function createWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  if (!cleanPhone) return '#';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// Format phone for Brazilian display: (DD) 9XXXX-XXXX
export function formatPhoneBR(val: string): string {
  if (!val) return '';
  let digits = val.replace(/\D/g, '');

  // If it starts with duplicated 5555, remove extra 55
  while (digits.startsWith('5555')) {
    digits = digits.slice(2);
  }

  // If 12 or 13 digits starting with 55, remove 55 for local display
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// WhatsApp Message Templates
export function getConfirmationWhatsAppMessage(
  clientName: string,
  dateStr: string,
  timeStr: string,
  serviceName: string,
  salonName: string = 'Eveline Studio Hair'
): string {
  const dateFormatted = `${formatDayOfWeekName(dateStr)}, ${formatDateShort(dateStr)}`;
  return `Olá, ${clientName}! Seu agendamento foi confirmado para ${dateFormatted} às ${timeStr}.\nProcedimento: ${serviceName}.\nSalão: ${salonName}.\nEstamos te esperando! 🌸`;
}

export function getOfferRescheduleWhatsAppMessage(
  clientName: string,
  originalTime: string,
  options: string[],
  salonName: string = 'Eveline Studio Hair'
): string {
  const optionsText = options.join(', ');
  return `Olá, ${clientName}! O horário solicitado (${originalTime}) não está mais disponível no ${salonName}.\nTemos estas opções de horários disponíveis: ${optionsText}.\nQual delas fica melhor para você? ✨`;
}

export function getRefusalWhatsAppMessage(
  clientName: string,
  dateStr: string,
  timeStr: string,
  reason?: string
): string {
  const dateFormatted = `${formatDayOfWeekName(dateStr)}, ${formatDateShort(dateStr)}`;
  return `Olá, ${clientName}! Infelizmente não conseguimos confirmar sua solicitação para ${dateFormatted} às ${timeStr}${
    reason ? ` devido a: ${reason}` : ''
  }.\nPodemos verificar outro dia ou horário para você? Fique à vontade para nos responder por aqui.`;
}
