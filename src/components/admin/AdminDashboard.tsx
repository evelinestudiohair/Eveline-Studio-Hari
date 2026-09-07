import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatDateShort,
  formatDateBR,
  formatDayOfWeekName,
  createWhatsAppLink,
  getConfirmationWhatsAppMessage,
  formatCurrency,
  getWeekDates,
  getDayOfWeekNumber,
  generateTimeSlotsForDay,
} from '../../utils/dateTime';
import {
  Calendar,
  Clock,
  Check,
  X,
  Plus,
  Users,
  CalendarDays,
  Sparkles,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  CalendarClock,
  Settings,
} from 'lucide-react';
import { NewAppointmentModal } from './NewAppointmentModal';
import { RescheduleModal } from './RescheduleModal';
import { SlotDetailsModal } from './SlotDetailsModal';
import { Appointment } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
}) => {
  const {
    settings,
    appointments,
    confirmAppointment,
    refuseAppointment,
    currentWeek,
    weeks,
    availability,
    blockedSlots,
    openWeek,
  } = useSalon();

  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [selectedSlotModal, setSelectedSlotModal] = useState<{
    date: string;
    time: string;
  } | null>(null);

  // Filter tabs for today's agenda: "Todos" or "Confirmados"
  const [agendaFilter, setAgendaFilter] = useState<'ALL' | 'CONFIRMED'>('ALL');

  // Today reference (defaulting to 2026-09-14 as sample active day)
  const todayDateStr = '2026-09-14';

  const todayAppointments = appointments.filter((a) => a.date === todayDateStr);

  const displayedTodayAppointments = todayAppointments.filter((a) => {
    if (agendaFilter === 'CONFIRMED') return a.status === 'CONFIRMADO';
    return true;
  });

  const confirmedTodayCount = todayAppointments.filter(
    (a) => a.status === 'CONFIRMADO'
  ).length;

  const pendingRequests = appointments.filter(
    (a) => a.status === 'PENDENTE' || a.status === 'AGUARDANDO NOVO HORÁRIO'
  );

  // Next client appointment
  const nextClientApt =
    todayAppointments.find((a) => a.status === 'CONFIRMADO') ||
    todayAppointments[0] ||
    null;

  // Compute week availability items for the side bento card
  const activeWeekDates = getWeekDates(currentWeek.startDate);

  const weekDayStats = activeWeekDates.map((dateStr) => {
    const dow = getDayOfWeekNumber(dateStr);
    const dayCfg = availability.find((c) => c.dayOfWeek === dow);
    const isClosed = !dayCfg || !dayCfg.isOpen;
    const isDayBlocked = blockedSlots.some(
      (b) => b.date === dateStr && (b.isAllDay || !b.time)
    );

    if (isClosed || isDayBlocked) {
      return {
        dateStr,
        dayName: formatDayOfWeekName(dateStr),
        status: isDayBlocked ? 'Bloqueado' : 'Fechado',
        freeSlots: 0,
        isLotado: false,
      };
    }

    const slots = generateTimeSlotsForDay(
      dateStr,
      dayCfg,
      blockedSlots,
      appointments
    );
    const totalSpots = slots.reduce((acc, s) => acc + s.totalCapacity, 0);
    const availableSpots = slots.reduce((acc, s) => acc + s.availableSpots, 0);

    return {
      dateStr,
      dayName: formatDayOfWeekName(dateStr),
      status: availableSpots === 0 ? 'Lotado' : `${availableSpots} Vagas Livres`,
      freeSlots: availableSpots,
      isLotado: availableSpots === 0,
    };
  });

  const handleConfirmQuick = (apt: Appointment) => {
    const res = confirmAppointment(apt.id);
    if (res.success) {
      const waMsg = getConfirmationWhatsAppMessage(
        apt.clientName,
        apt.date,
        apt.time,
        apt.serviceName,
        settings.name
      );
      const url = createWhatsAppLink(apt.clientWhatsapp, waMsg);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert(res.message);
    }
  };

  return (
    <div id="admin-bento-dashboard" className="space-y-6">
      {/* Header section from Bento Grid */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-2">
        <div>
          <h2 className="text-3xl font-serif text-[#E6CA85] tracking-tight">
            Olá, {settings.ownerName}
          </h2>
          <p className="text-[#9E988F] text-sm mt-0.5">
            Hoje é {formatDayOfWeekName(todayDateStr)}, {formatDateBR(todayDateStr)}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-bento-settings"
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="bg-[#1E1E26] border border-[#2E2E3A] px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#D8D4CE] hover:bg-[#252530] transition-colors shadow-xs cursor-pointer"
          >
            Configurações
          </button>

          <button
            id="btn-bento-new-apt"
            type="button"
            onClick={() => setIsNewAppointmentOpen(true)}
            className="bg-[#C5A059] px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#0D0D10] shadow-lg shadow-[#C5A059]/15 hover:bg-[#DFBD69] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Agendamento</span>
          </button>
        </div>
      </header>

      {/* Bento Grid: Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Stat 1: Agendamentos Hoje */}
        <div className="md:col-span-3 bg-[#16161B] border border-[#262630] rounded-3xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#9E988F] mb-1 font-bold">
              Agendamentos Hoje
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F3EF]">
              {String(confirmedTodayCount).padStart(2, '0')}
            </h3>
          </div>
          <div className="bg-[#24171A] p-3.5 rounded-2xl text-rose-400 border border-rose-900/40 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2: Solicitações Pendentes */}
        <div
          onClick={() => onNavigateTab('pending')}
          className="md:col-span-3 bg-[#16161B] border border-[#262630] rounded-3xl p-5 flex items-center justify-between shadow-xs cursor-pointer hover:border-[#C5A059]/50 transition-colors"
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#9E988F] mb-1 font-bold">
              Solicitações Pendentes
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#E6CA85]">
              {String(pendingRequests.length).padStart(2, '0')}
            </h3>
          </div>
          <div className="bg-[#241F14] p-3.5 rounded-2xl text-[#E6CA85] border border-[#C5A059]/30 shadow-xs">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Highlight Banner (Próximo Cliente) */}
        <div className="md:col-span-6 bg-gradient-to-r from-[#1E1E28] via-[#1A1A22] to-[#252018] border border-[#C5A059]/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#F5F3EF] shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-[#C5A059]/20 p-3 rounded-2xl text-[#E6CA85] shrink-0 border border-[#C5A059]/30">
              <Calendar className="w-6 h-6 text-[#E6CA85]" />
            </div>
            <div>
              <p className="text-xs text-[#E6CA85] font-semibold uppercase tracking-wider">Próximo Cliente do Dia</p>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#F5F3EF]">
                {nextClientApt
                  ? `${nextClientApt.clientName} • ${nextClientApt.time} (${nextClientApt.serviceName})`
                  : 'Nenhum próximo agendamento hoje'}
              </h3>
            </div>
          </div>

          {nextClientApt && (
            <button
              type="button"
              onClick={() =>
                setSelectedSlotModal({
                  date: nextClientApt.date,
                  time: nextClientApt.time,
                })
              }
              className="bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Ver Detalhes
            </button>
          )}
        </div>
      </div>

      {/* Main Bento Layout: Agenda Row & Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Agenda Bento Card (col-span-8) */}
        <div className="lg:col-span-8 bg-[#16161B] border border-[#262630] rounded-3xl overflow-hidden flex flex-col shadow-xs">
          {/* Card Header with Filter Pills */}
          <div className="p-6 border-b border-[#262630] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg text-[#F5F3EF]">
                Atendimentos de Hoje ({formatDateBR(todayDateStr)})
              </h3>
              <p className="text-xs text-[#9E988F]">
                {displayedTodayAppointments.length} agendamentos na grade deste dia
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setAgendaFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  agendaFilter === 'ALL'
                    ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 font-bold shadow-xs'
                    : 'border border-[#2E2E3A] text-[#9E988F] hover:bg-[#1E1E26] hover:text-[#F5F3EF]'
                }`}
              >
                Todos ({todayAppointments.length})
              </button>

              <button
                type="button"
                onClick={() => setAgendaFilter('CONFIRMED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  agendaFilter === 'CONFIRMED'
                    ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 font-bold shadow-xs'
                    : 'border border-[#2E2E3A] text-[#9E988F] hover:bg-[#1E1E26] hover:text-[#F5F3EF]'
                }`}
              >
                Confirmados ({confirmedTodayCount})
              </button>
            </div>
          </div>

          {/* List of Appointments */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#262630] max-h-[480px]">
            {displayedTodayAppointments.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#9E988F]">
                Nenhum atendimento listado para os filtros selecionados hoje.
              </div>
            ) : (
              displayedTodayAppointments.map((apt) => {
                const isPending =
                  apt.status === 'PENDENTE' ||
                  apt.status === 'AGUARDANDO NOVO HORÁRIO';

                return (
                  <div
                    key={apt.id}
                    className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isPending ? 'bg-[#241F14]/40 hover:bg-[#241F14]/70' : 'hover:bg-[#1C1C24]'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 font-mono text-sm font-bold text-[#E6CA85] shrink-0">
                        {apt.time}
                      </div>

                      <div>
                        <p className="font-bold text-sm text-[#F5F3EF]">
                          {apt.clientName}
                        </p>
                        <p className="text-xs text-[#9E988F]">
                          {apt.serviceName} • {apt.serviceDuration} min • {formatCurrency(apt.servicePrice)}
                        </p>
                        {apt.clientNotes && (
                          <p className="text-[11px] italic text-[#D8D4CE] bg-[#121216] border border-[#262630] px-2.5 py-1 rounded-lg mt-1 inline-block">
                            &ldquo;{apt.clientNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <StatusBadge status={apt.status} size="sm" />

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmQuick(apt)}
                          className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] text-xs rounded-lg font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          Confirmar
                        </button>
                      ) : (
                        <a
                          href={createWhatsAppLink(
                            apt.clientWhatsapp,
                            `Olá, ${apt.clientName}! Passando para confirmar seu horário hoje às ${apt.time} no ${settings.name}.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 hover:bg-[#1E1E26] rounded-lg text-emerald-400 transition-colors"
                          title="Falar no WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSlotModal({
                            date: apt.date,
                            time: apt.time,
                          })
                        }
                        className="p-2 hover:bg-[#1E1E26] rounded-lg text-[#9E988F] transition-colors cursor-pointer"
                        title="Ver detalhes da vaga"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-[#121216] border-t border-[#262630] flex items-center justify-between">
            <span className="text-xs text-[#9E988F]">
              Grade de atendimento flexível e controlada manualmente
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('agenda')}
              className="text-xs font-bold text-[#E6CA85] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Abrir Agenda Semanal Completa
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right / Side Bento Column (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Side Card 1: Novas Solicitações */}
          <div className="bg-[#16161B] border border-[#262630] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-[#E6CA85]">
                Novas Solicitações
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('pending')}
                className="bg-[#1E1E26] text-[#E6CA85] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#C5A059]/30 hover:bg-[#252530] transition-colors cursor-pointer"
              >
                Ver Todas ({pendingRequests.length})
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-[#9E988F] text-center py-4">
                Nenhuma solicitação pendente no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-[#121216] p-4 rounded-2xl shadow-xs border border-[#262630] space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-[#F5F3EF]">
                          {apt.clientName}
                        </p>
                        <p className="text-xs text-[#9E988F]">
                          {apt.serviceName} • {apt.time} ({formatDateShort(apt.date)})
                        </p>
                      </div>
                      <span className="text-[10px] text-[#9E988F]">recente</span>
                    </div>

                    {apt.clientNotes && (
                      <p className="text-xs text-[#D8D4CE] italic bg-[#1A1A22] p-2 rounded-xl border border-[#2E2E3A]">
                        &ldquo;{apt.clientNotes}&rdquo;
                      </p>
                    )}

                    <div className="flex space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmQuick(apt)}
                        className="flex-1 bg-[#C5A059] text-[#0D0D10] text-[10px] py-2 rounded-lg font-bold hover:bg-[#DFBD69] transition-colors cursor-pointer"
                      >
                        Aceitar
                      </button>

                      <button
                        type="button"
                        onClick={() => setRescheduleApt(apt)}
                        className="flex-1 border border-[#2E2E3A] bg-[#1E1E26] text-[#E6CA85] text-[10px] py-2 rounded-lg font-bold hover:bg-[#252530] transition-colors cursor-pointer"
                      >
                        Outro Horário
                      </button>

                      <button
                        type="button"
                        onClick={() => refuseAppointment(apt.id, 'Sem disponibilidade')}
                        className="border border-[#2E2E3A] text-rose-400 hover:bg-[#24171A] text-[10px] px-2 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                        title="Recusar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Card 2: Disponibilidade da Semana */}
          <div className="bg-[#16161B] border border-[#262630] rounded-3xl p-6 flex flex-col shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base text-[#F5F3EF]">
                Disponibilidade da Semana
              </h3>
              <span className="text-[10px] uppercase font-bold text-[#E6CA85] bg-[#1E1E26] px-2 py-0.5 rounded-full border border-[#C5A059]/30">
                {currentWeek.status === 'OPEN' ? 'Aberta' : 'Fechada'}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {weekDayStats.map((item) => (
                <div
                  key={item.dateStr}
                  onClick={() => onNavigateTab('agenda')}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    item.isLotado
                      ? 'bg-rose-950/30 border border-rose-900/40 text-rose-400'
                      : 'hover:bg-[#1E1E26] border border-transparent'
                  }`}
                >
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-[#F5F3EF]">
                      {item.dayName}, {formatDateShort(item.dateStr)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      item.isLotado
                        ? 'text-rose-400'
                        : item.freeSlots === 1
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('availability')}
              className="w-full mt-5 py-2.5 border-2 border-dashed border-[#2E2E3A] rounded-2xl text-xs font-bold text-[#9E988F] hover:border-[#C5A059] hover:text-[#E6CA85] transition-all cursor-pointer"
            >
              Gerenciar Vagas & Abrir Próxima Semana
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isNewAppointmentOpen && (
        <NewAppointmentModal
          onClose={() => setIsNewAppointmentOpen(false)}
          defaultDate={todayDateStr}
        />
      )}

      {rescheduleApt && (
        <RescheduleModal
          appointment={rescheduleApt}
          onClose={() => setRescheduleApt(null)}
        />
      )}

      {selectedSlotModal && (
        <SlotDetailsModal
          date={selectedSlotModal.date}
          time={selectedSlotModal.time}
          onClose={() => setSelectedSlotModal(null)}
          onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
        />
      )}
    </div>
  );
};
