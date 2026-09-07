import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  formatDateShort,
  formatDateBR,
  formatDayOfWeekName,
  getWeekDates,
  generateTimeSlotsForDay,
  getDayOfWeekNumber,
  isDateInPast,
  isDateTimeInPast,
} from '../../utils/dateTime';
import { TimeSlotDisplay } from '../../types';
import { SlotDetailsModal } from './SlotDetailsModal';
import { NewAppointmentModal } from './NewAppointmentModal';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Plus,
  Ban,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export const AdminWeeklyAgenda: React.FC = () => {
  const {
    weeks,
    selectedWeekId,
    setSelectedWeekId,
    currentWeek,
    toggleWeekStatus,
    availability,
    blockedSlots,
    appointments,
    addBlockedSlot,
    removeBlockedSlot,
  } = useSalon();

  const [activeDate, setActiveDate] = useState<string>(currentWeek.startDate);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    slot: TimeSlotDisplay;
  } | null>(null);

  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [blockDayModalDate, setBlockDayModalDate] = useState<string | null>(null);
  const [blockDayReason, setBlockDayReason] = useState('');

  // Find current week index
  const currentWeekIndex = weeks.findIndex((w) => w.id === selectedWeekId);
  const weekDates = getWeekDates(currentWeek.startDate);

  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      const prev = weeks[currentWeekIndex - 1];
      setSelectedWeekId(prev.id);
      setActiveDate(prev.startDate);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      const next = weeks[currentWeekIndex + 1];
      setSelectedWeekId(next.id);
      setActiveDate(next.startDate);
    }
  };

  const handleBlockDay = () => {
    if (blockDayModalDate) {
      addBlockedSlot(
        blockDayModalDate,
        undefined,
        true,
        blockDayReason.trim() || 'Dia Fechado pelo Salão'
      );
      setBlockDayModalDate(null);
      setBlockDayReason('');
    }
  };

  // Active day config & slots
  const activeDow = getDayOfWeekNumber(activeDate);
  const activeDayConfig = availability.find((c) => c.dayOfWeek === activeDow);
  const daySlots = activeDayConfig
    ? generateTimeSlotsForDay(
        activeDate,
        activeDayConfig,
        blockedSlots,
        appointments
      )
    : [];

  const isDayBlocked = blockedSlots.some(
    (b) => b.date === activeDate && (b.isAllDay || !b.time)
  );
  const dayBlockInfo = blockedSlots.find(
    (b) => b.date === activeDate && (b.isAllDay || !b.time)
  );

  return (
    <div id="admin-weekly-agenda" className="space-y-6">
      {/* Week Header & Opening/Closing Controls (Bento Card style) */}
      <div className="bg-[#16161B] rounded-3xl p-6 border border-[#262630] shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E6CA85] bg-[#1E1E26] px-3 py-1 rounded-full border border-[#C5A059]/30">
                Grade Semanal
              </span>
              <span
                id="week-status-badge"
                className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  currentWeek.status === 'OPEN'
                    ? 'bg-[#142019] text-emerald-300 border border-emerald-800/60'
                    : 'bg-[#1E1E26] text-[#9E988F] border border-[#2E2E3A]'
                }`}
              >
                {currentWeek.status === 'OPEN' ? (
                  <>
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    <span>AGENDA ABERTA</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-[#9E988F]" />
                    <span>AGENDA FECHADA</span>
                  </>
                )}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85] mt-2">
              Semana de {formatDateBR(currentWeek.startDate)} a {formatDateBR(currentWeek.endDate)}
            </h2>
            <p className="text-xs text-[#9E988F] mt-0.5">
              {currentWeek.status === 'OPEN'
                ? 'Clientes podem visualizar os horários disponíveis e enviar solicitações.'
                : 'Agenda fechada para clientes. Apenas você pode cadastrar agendamentos manualmente.'}
            </p>
          </div>

          {/* Action buttons for week */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-toggle-week-status"
              type="button"
              onClick={() => toggleWeekStatus(currentWeek.id)}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs uppercase tracking-wider cursor-pointer ${
                currentWeek.status === 'OPEN'
                  ? 'bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
              }`}
            >
              {currentWeek.status === 'OPEN' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>FECHAR AGENDA</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>ABRIR AGENDA</span>
                </>
              )}
            </button>

            <button
              id="btn-agenda-new-apt"
              type="button"
              onClick={() => setIsNewAppointmentOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md shadow-[#C5A059]/15 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Agendamento</span>
            </button>

            {/* Navigation buttons */}
            <div className="flex items-center rounded-full border border-[#2E2E3A] bg-[#121216] p-1">
              <button
                id="btn-prev-week"
                type="button"
                onClick={handlePrevWeek}
                disabled={currentWeekIndex <= 0}
                className="p-1.5 rounded-full text-[#9E988F] hover:bg-[#1E1E26] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-3 text-[#D8D4CE]">
                Semana {currentWeekIndex + 1} de {weeks.length}
              </span>
              <button
                id="btn-next-week"
                type="button"
                onClick={handleNextWeek}
                disabled={currentWeekIndex >= weeks.length - 1}
                className="p-1.5 rounded-full text-[#9E988F] hover:bg-[#1E1E26] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Week Day Selector tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-6 pt-5 border-t border-[#262630]">
          {weekDates.map((dateStr) => {
            const dow = getDayOfWeekNumber(dateStr);
            const dayName = formatDayOfWeekName(dateStr).split('-')[0];
            const isSelected = activeDate === dateStr;

            const cfg = availability.find((c) => c.dayOfWeek === dow);
            const isClosed = !cfg || !cfg.isOpen;
            const isBlocked = blockedSlots.some(
              (b) => b.date === dateStr && (b.isAllDay || !b.time)
            );

            const dayApts = appointments.filter(
              (a) => a.date === dateStr && a.status !== 'CANCELADO' && a.status !== 'RECUSADO'
            );
            const confirmedCount = dayApts.filter((a) => a.status === 'CONFIRMADO').length;
            const pendingCount = dayApts.filter((a) => a.status === 'PENDENTE').length;

            const isPastDay = isDateInPast(dateStr);

            return (
              <button
                key={dateStr}
                id={`btn-day-tab-${dateStr}`}
                type="button"
                onClick={() => setActiveDate(dateStr)}
                className={`p-3.5 rounded-2xl text-left border transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-[#22222D] border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-md'
                    : 'bg-[#131317] border-[#2A2A38] hover:bg-[#1A1A22]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isSelected ? 'text-[#E6CA85]' : 'text-[#D8D4CE]'
                    }`}
                  >
                    {dayName}
                  </span>
                  {isBlocked ? (
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Bloqueado</span>
                  ) : isClosed ? (
                    <span className="text-[10px] font-medium text-[#7A756D]">Fechado</span>
                  ) : isPastDay ? (
                    <span className="text-[10px] font-medium text-[#7A756D]">Passado</span>
                  ) : null}
                </div>

                <div className="text-base font-extrabold text-[#F5F3EF] mt-1">
                  {formatDateShort(dateStr)}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase">
                  {confirmedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#142019] text-emerald-400 border border-emerald-800/40">
                      {confirmedCount} conf.
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#241F14] text-[#F5D78E] border border-amber-800/40 animate-pulse">
                      {pendingCount} pend.
                    </span>
                  )}
                  {confirmedCount === 0 && pendingCount === 0 && (
                    <span className="text-[#7A756D] font-normal lowercase">livre</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Visual Grid (Bento Card style) */}
      <div className="bg-[#16161B] rounded-3xl p-6 border border-[#262630] shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262630]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#F5F3EF] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E6CA85]" />
              <span>
                {formatDayOfWeekName(activeDate)}, {formatDateBR(activeDate)}
              </span>
            </h3>
            <p className="text-xs text-[#9E988F] mt-0.5">
              Clique em qualquer horário para visualizar os agendamentos, confirmar vagas ou bloquear o horário.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isDayBlocked && (
              <button
                id="btn-block-entire-day"
                type="button"
                onClick={() => setBlockDayModalDate(activeDate)}
                className="px-4 py-2 rounded-full border border-[#2E2E3A] text-[#D8D4CE] hover:bg-[#1E1E26] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Bloquear Este Dia Inteiro</span>
              </button>
            )}
          </div>
        </div>

        {/* If day is blocked */}
        {isDayBlocked ? (
          <div className="p-8 text-center rounded-2xl bg-rose-950/20 border border-rose-900/40 my-6">
            <Ban className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-[#F5F3EF]">Dia Inteiro Bloqueado</h4>
            <p className="text-xs text-rose-300 mt-1 max-w-md mx-auto">
              Motivo: {dayBlockInfo?.reason || 'Salão fechado nesta data'}. Clientes não podem agendar neste dia.
            </p>
            <button
              id="btn-unblock-active-day"
              type="button"
              onClick={() => {
                if (dayBlockInfo) {
                  removeBlockedSlot(dayBlockInfo.id);
                }
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Desbloquear Este Dia
            </button>
          </div>
        ) : !activeDayConfig || !activeDayConfig.isOpen ? (
          <div className="p-8 text-center rounded-2xl bg-[#121216] border border-dashed border-[#262630] my-6">
            <Info className="w-8 h-8 text-[#9E988F] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#F5F3EF]">Salão Fechado Neste Dia</h4>
            <p className="text-xs text-[#9E988F] mt-1">
              Configure os dias de atendimento na aba &ldquo;Disponibilidade&rdquo;.
            </p>
          </div>
        ) : daySlots.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#121216] border border-dashed border-[#262630] my-6 text-xs text-[#9E988F]">
            Nenhum horário gerado para esta configuração.
          </div>
        ) : (
          /* Slots Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-5">
            {daySlots.map((slot) => {
              const isPast = slot.isPast || isDateTimeInPast(activeDate, slot.time);
              const isFull = slot.availableSpots <= 0 && !slot.isBlocked;
              const hasConfirmed = slot.confirmedCount > 0;
              const hasPending = slot.pendingCount > 0;

              return (
                <div
                  key={slot.time}
                  id={`agenda-slot-card-${slot.time.replace(':', '')}`}
                  onClick={() => setSelectedSlot({ date: activeDate, slot })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    slot.isBlocked
                      ? 'bg-[#101014] border-[#1E1E26] opacity-60 hover:opacity-90'
                      : isPast
                      ? 'bg-[#101014] border-[#1E1E26] opacity-60 hover:opacity-90'
                      : isFull
                      ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700 hover:shadow-xs'
                      : hasConfirmed
                      ? 'bg-[#15241B]/50 border-emerald-900/50 hover:border-emerald-600 hover:shadow-xs'
                      : 'bg-[#131317] border-[#2A2A38] hover:border-[#C5A059] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg font-mono font-bold text-[#F5F3EF] tracking-tight">
                        {slot.time}
                      </span>
                      <p className="text-[11px] text-[#9E988F] font-medium">
                        {slot.totalCapacity} {slot.totalCapacity === 1 ? 'vaga' : 'vagas'} total
                      </p>
                    </div>

                    {/* Status Pill */}
                    {slot.isBlocked ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1E1E26] text-[#9E988F] border border-[#2E2E3A]">
                        BLOQUEADO
                      </span>
                    ) : isPast ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1E1E26] text-[#7A756D] border border-[#2E2E3A]">
                        ENCERRADO
                      </span>
                    ) : isFull ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-400 border border-rose-900/40">
                        LOTADO
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#142019] text-emerald-400 border border-emerald-800/40">
                        {slot.availableSpots} disponível
                      </span>
                    )}
                  </div>

                  {/* Occupancy Indicator */}
                  <div className="mt-3 pt-2.5 border-t border-[#262630] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9E988F] font-medium">Ocupação:</span>
                      <span className="font-bold text-[#F5F3EF]">
                        {slot.confirmedCount} / {slot.totalCapacity} ocupada(s)
                      </span>
                    </div>

                    {/* Progress mini bar */}
                    <div className="w-full bg-[#1F1F28] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull
                            ? 'bg-rose-500'
                            : hasConfirmed
                            ? 'bg-emerald-500'
                            : 'bg-stone-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (slot.confirmedCount / slot.totalCapacity) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    {/* Pending badge if any */}
                    {hasPending && (
                      <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-[#F5D78E] bg-[#241F14] px-2 py-0.5 rounded-md border border-amber-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping" />
                        <span>{slot.pendingCount} solicitação(ões) pendente(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <SlotDetailsModal
          date={selectedSlot.date}
          slot={selectedSlot.slot}
          onClose={() => setSelectedSlot(null)}
          onOpenNewAppointment={() => {
            setSelectedSlot(null);
            setIsNewAppointmentOpen(true);
          }}
        />
      )}

      {/* New Appointment Modal */}
      {isNewAppointmentOpen && (
        <NewAppointmentModal
          onClose={() => setIsNewAppointmentOpen(false)}
          defaultDate={activeDate}
        />
      )}

      {/* Block Day Modal */}
      {blockDayModalDate && (
        <div
          id="block-day-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-[#16161B] rounded-3xl shadow-2xl p-6 border border-[#262630]">
            <h3 className="text-base font-bold text-[#F5F3EF]">
              Bloquear o dia {formatDateBR(blockDayModalDate)} inteiro
            </h3>
            <p className="text-xs text-[#9E988F] mt-1">
              Nenhuma cliente poderá agendar horários nesta data.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                Motivo do Bloqueio
              </label>
              <input
                id="input-block-day-reason"
                type="text"
                placeholder="Ex: Folga, feriado, curso, reforma..."
                value={blockDayReason}
                onChange={(e) => setBlockDayReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockDayModalDate(null)}
                className="px-4 py-2 rounded-full border border-[#2E2E3A] text-xs font-semibold text-[#D8D4CE] hover:bg-[#1E1E26] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-block-day"
                type="button"
                onClick={handleBlockDay}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Bloquear Dia Inteiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
