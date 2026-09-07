import React, { useState } from 'react';
import { TimeSlotDisplay } from '../../types';
import { useSalon } from '../../context/SalonContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatDateShort,
  formatDayOfWeekName,
  createWhatsAppLink,
  getConfirmationWhatsAppMessage,
  getDayOfWeekNumber,
  generateTimeSlotsForDay,
  isDateTimeInPast,
} from '../../utils/dateTime';
import {
  X,
  Clock,
  User,
  Phone,
  Check,
  MessageSquare,
  Ban,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { RescheduleModal } from './RescheduleModal';

interface SlotDetailsModalProps {
  date: string;
  slot?: TimeSlotDisplay;
  time?: string;
  onClose: () => void;
  onOpenNewAppointment?: () => void;
}

export const SlotDetailsModal: React.FC<SlotDetailsModalProps> = ({
  date,
  slot,
  time,
  onClose,
  onOpenNewAppointment,
}) => {
  const {
    confirmAppointment,
    refuseAppointment,
    cancelAppointment,
    finalizeAppointment,
    addBlockedSlot,
    removeBlockedSlot,
    blockedSlots,
    availability,
    appointments,
    settings,
  } = useSalon();

  const [rescheduleAppointment, setRescheduleAppointment] = useState<any | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Compute effective slot safely if slot prop wasn't passed or is undefined
  const effectiveTime = slot?.time || time || '09:00';
  const dow = getDayOfWeekNumber(date);
  const dayCfg = availability.find((c) => c.dayOfWeek === dow);

  const fallbackSlot: TimeSlotDisplay = (() => {
    if (dayCfg) {
      const generated = generateTimeSlotsForDay(date, dayCfg, blockedSlots, appointments);
      const found = generated.find((s) => s.time === effectiveTime);
      if (found) return found;
    }

    const slotApts = appointments.filter(
      (a) => a.date === date && a.time === effectiveTime && a.status !== 'CANCELADO' && a.status !== 'RECUSADO'
    );
    const confirmedCount = slotApts.filter((a) => a.status === 'CONFIRMADO').length;
    const pendingCount = slotApts.filter((a) => a.status === 'PENDENTE' || a.status === 'AGUARDANDO NOVO HORÁRIO').length;
    const totalCapacity = dayCfg?.defaultCapacity || 2;
    const isBlocked = blockedSlots.some((b) => b.date === date && (b.isAllDay || b.time === effectiveTime));
    const blockInfo = blockedSlots.find((b) => b.date === date && (b.isAllDay || b.time === effectiveTime));

    const isPast = isDateTimeInPast(date, effectiveTime);
    return {
      time: effectiveTime,
      totalCapacity,
      confirmedCount,
      pendingCount,
      availableSpots: (isBlocked || isPast) ? 0 : Math.max(0, totalCapacity - confirmedCount),
      isBlocked,
      blockReason: blockInfo?.reason,
      isPast,
      appointments: slotApts,
    };
  })();

  const currentSlot: TimeSlotDisplay = slot || fallbackSlot;
  const isSlotPast = currentSlot.isPast || isDateTimeInPast(date, currentSlot.time);

  // Check if slot is currently blocked
  const currentBlock = blockedSlots.find(
    (b) => b.date === date && (b.isAllDay || b.time === currentSlot.time)
  );

  const handleConfirm = (id: string, clientName: string, clientWa: string, serviceName: string) => {
    const res = confirmAppointment(id);
    if (!res.success) {
      setActionNotice(res.message || 'Erro ao confirmar');
    } else {
      setActionNotice('Agendamento confirmado! Vaga reservada.');
      const waMsg = getConfirmationWhatsAppMessage(
        clientName,
        date,
        currentSlot.time,
        serviceName,
        settings.name
      );
      const url = createWhatsAppLink(clientWa, waMsg);
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        // Safe popup fallback
      }
    }
  };

  const handleToggleBlock = () => {
    if (currentBlock) {
      removeBlockedSlot(currentBlock.id);
      setActionNotice('Horário desbloqueado com sucesso.');
    } else {
      addBlockedSlot(
        date,
        currentSlot.time,
        false,
        blockReasonInput.trim() || 'Bloqueio administrativo'
      );
      setActionNotice('Horário bloqueado com sucesso.');
    }
  };

  return (
    <>
      <div
        id="slot-details-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      >
        <div
          id="slot-details-modal-content"
          className="w-full max-w-lg bg-[#16161B] rounded-3xl shadow-2xl border border-[#262630] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#262630] bg-[#121216]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/30 flex items-center justify-center font-bold text-sm shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#E6CA85] flex items-center gap-2">
                  <span className="font-mono">{currentSlot.time}</span>
                  <span className="text-xs font-sans font-normal text-[#9E988F]">
                    • {formatDayOfWeekName(date)}, {formatDateShort(date)}
                  </span>
                </h3>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className="text-[#D8D4CE]">
                    Capacidade: <strong>{currentSlot.totalCapacity} {currentSlot.totalCapacity === 1 ? 'vaga' : 'vagas'}</strong>
                  </span>
                  <span className="text-[#9E988F]">•</span>
                  <span className={currentSlot.confirmedCount >= currentSlot.totalCapacity ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {currentSlot.confirmedCount} ocupada(s)
                  </span>
                  <span className="text-[#9E988F]">•</span>
                  <span className="text-[#9E988F]">
                    {currentSlot.availableSpots} disponível(is)
                  </span>
                </div>
              </div>
            </div>

            <button
              id="btn-close-slot-modal"
              onClick={onClose}
              className="p-2 text-[#9E988F] hover:text-[#F5F3EF] rounded-full hover:bg-[#22222D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {actionNotice && (
              <div className="p-3.5 rounded-2xl bg-[#121216] border border-[#C5A059]/30 text-[#E6CA85] text-xs font-semibold flex items-center justify-between">
                <span>{actionNotice}</span>
                <button
                  onClick={() => setActionNotice(null)}
                  className="text-[#9E988F] hover:text-[#F5F3EF] font-bold px-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Blocked Slot Banner */}
            {currentSlot.isBlocked ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-400 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-[#F5F3EF]">Horário Bloqueado</h4>
                    <p className="mt-0.5 text-rose-300">
                      Motivo: {currentSlot.blockReason || 'Bloqueio administrativo'}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9E988F]">
                      Clientes não visualizam este horário na página pública de agendamento.
                    </p>
                  </div>
                </div>
                <button
                  id="btn-unblock-slot"
                  type="button"
                  onClick={handleToggleBlock}
                  className="px-3.5 py-1.5 rounded-full bg-[#22222D] border border-[#262630] text-[#E6CA85] font-semibold hover:bg-[#2A2A38] transition-colors text-xs shrink-0 cursor-pointer"
                >
                  Desbloquear
                </button>
              </div>
            ) : null}

            {/* Past Slot Notice */}
            {isSlotPast && !currentSlot.isBlocked && (
              <div className="p-3.5 rounded-2xl bg-[#121216] border border-[#262630] text-xs text-[#9E988F] flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#9E988F] shrink-0" />
                <span>Este horário já passou. Novos agendamentos não são permitidos nesta data/horário.</span>
              </div>
            )}

            {/* Appointments in this slot */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9E988F]">
                  Agendamentos neste horário ({currentSlot.appointments.length})
                </h4>
                {currentSlot.availableSpots > 0 && !currentSlot.isBlocked && !isSlotPast && onOpenNewAppointment && (
                  <button
                    id="btn-add-apt-to-slot"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewAppointment();
                    }}
                    className="text-xs font-semibold text-[#E6CA85] hover:text-[#C5A059] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    + Adicionar neste horário
                  </button>
                )}
              </div>

              {currentSlot.appointments.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#121216] border border-dashed border-[#262630] text-xs text-[#9E988F]">
                  Nenhum agendamento para este horário.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSlot.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      id={`slot-apt-item-${apt.id}`}
                      className="p-4 rounded-2xl border border-[#262630] bg-[#121216] hover:border-[#C5A059]/40 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#F5F3EF]">
                              {apt.clientName}
                            </span>
                            <StatusBadge status={apt.status} size="sm" />
                          </div>
                          <p className="text-xs text-[#9E988F] font-medium mt-0.5">
                            {apt.serviceName} • {apt.serviceDuration} min • R$ {apt.servicePrice}
                          </p>
                        </div>

                        {/* WhatsApp Quick Link */}
                        <a
                          href={createWhatsAppLink(
                            apt.clientWhatsapp,
                            `Olá, ${apt.clientName}! Tudo bem? Falamos do ${settings.name}.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-full border border-[#262630] text-emerald-400 hover:bg-[#22222D] transition-colors"
                          title="Falar no WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>

                      {apt.clientNotes && (
                        <p className="text-xs italic text-[#D8D4CE] bg-[#16161B] p-2.5 rounded-xl border border-[#262630]">
                          &ldquo;{apt.clientNotes}&rdquo;
                        </p>
                      )}

                      {/* Action buttons depending on status */}
                      <div className="pt-2 border-t border-[#262630] flex flex-wrap gap-2">
                        {apt.status === 'PENDENTE' && (
                          <>
                            <button
                              id={`btn-confirm-apt-${apt.id}`}
                              type="button"
                              onClick={() =>
                                handleConfirm(
                                  apt.id,
                                  apt.clientName,
                                  apt.clientWhatsapp,
                                  apt.serviceName
                                )
                              }
                              className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirmar Vaga
                            </button>

                            <button
                              id={`btn-offer-reschedule-${apt.id}`}
                              type="button"
                              onClick={() => setRescheduleAppointment(apt)}
                              className="px-4 py-2 rounded-full bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Oferecer Outro Horário
                            </button>

                            <button
                              id={`btn-refuse-apt-${apt.id}`}
                              type="button"
                              onClick={() => refuseAppointment(apt.id, 'Horário indisponível')}
                              className="px-3 py-2 rounded-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Recusar
                            </button>
                          </>
                        )}

                        {apt.status === 'CONFIRMADO' && (
                          <>
                            <button
                              id={`btn-finalize-apt-${apt.id}`}
                              type="button"
                              onClick={() => finalizeAppointment(apt.id)}
                              className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] font-bold text-xs transition-colors cursor-pointer"
                            >
                              Concluir Atendimento
                            </button>

                            <button
                              id={`btn-cancel-apt-${apt.id}`}
                              type="button"
                              onClick={() => cancelAppointment(apt.id, 'Cancelado pelo salão')}
                              className="px-3 py-2 rounded-full border border-[#262630] text-[#9E988F] hover:bg-[#22222D] hover:text-[#F5F3EF] text-xs font-medium transition-colors cursor-pointer"
                            >
                              Cancelar Agendamento
                            </button>
                          </>
                        )}

                        {apt.status === 'AGUARDANDO NOVO HORÁRIO' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setRescheduleAppointment(apt)}
                              className="px-3.5 py-2 rounded-full bg-purple-950/40 text-purple-300 border border-purple-900/50 text-xs font-semibold hover:bg-purple-900/60 transition-colors cursor-pointer"
                            >
                              Revisar Opções Enviadas
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirm(
                                  apt.id,
                                  apt.clientName,
                                  apt.clientWhatsapp,
                                  apt.serviceName
                                )
                              }
                              className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Confirmar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block / Unblock slot section */}
            {!currentSlot.isBlocked && (
              <div className="pt-4 border-t border-[#262630]">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9E988F] mb-2">
                  Bloquear este horário
                </h4>
                <div className="flex gap-2">
                  <input
                    id="input-block-reason"
                    type="text"
                    placeholder="Motivo (ex: Compromisso pessoal, Curso)"
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                  />
                  <button
                    id="btn-confirm-block-slot"
                    type="button"
                    onClick={handleToggleBlock}
                    className="px-4 py-2.5 rounded-full bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  >
                    Bloquear Horário
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {rescheduleAppointment && (
        <RescheduleModal
          appointment={rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
        />
      )}
    </>
  );
};
