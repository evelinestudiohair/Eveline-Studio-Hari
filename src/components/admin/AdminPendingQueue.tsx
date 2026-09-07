import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatDateShort,
  formatDateBR,
  formatDayOfWeekName,
  createWhatsAppLink,
  getConfirmationWhatsAppMessage,
  getRefusalWhatsAppMessage,
  formatCurrency,
} from '../../utils/dateTime';
import {
  Check,
  X,
  CalendarClock,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Sparkles,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { RescheduleModal } from './RescheduleModal';
import { Appointment } from '../../types';

export const AdminPendingQueue: React.FC = () => {
  const {
    appointments,
    confirmAppointment,
    refuseAppointment,
    settings,
  } = useSalon();

  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [refuseModalApt, setRefuseModalApt] = useState<Appointment | null>(null);
  const [refuseReason, setRefuseReason] = useState('Horário indisponível na grade');
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING_ONLY' | 'RESCHEDULE_ONLY'>('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter requests that require admin attention
  const pendingList = appointments.filter((a) => {
    if (filterType === 'PENDING_ONLY') return a.status === 'PENDENTE';
    if (filterType === 'RESCHEDULE_ONLY') return a.status === 'AGUARDANDO NOVO HORÁRIO';
    return a.status === 'PENDENTE' || a.status === 'AGUARDANDO NOVO HORÁRIO';
  });

  const handleConfirm = (apt: Appointment) => {
    const res = confirmAppointment(apt.id);
    if (!res.success) {
      setActionFeedback(res.message || 'Erro ao confirmar vaga.');
    } else {
      setActionFeedback(`Vaga reservada com sucesso para ${apt.clientName}!`);

      // Open WhatsApp confirmation with pre-filled message
      const waMsg = getConfirmationWhatsAppMessage(
        apt.clientName,
        apt.date,
        apt.time,
        apt.serviceName,
        settings.name
      );
      const url = createWhatsAppLink(apt.clientWhatsapp, waMsg);
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        // Fallback if popup blocked
      }
    }
  };

  const handleConfirmRefusal = () => {
    if (!refuseModalApt) return;
    const apt = refuseModalApt;
    const reason = refuseReason.trim() || 'Horário indisponível na grade';
    refuseAppointment(apt.id, reason);
    setActionFeedback(`Solicitação de ${apt.clientName} recusada.`);
    setRefuseModalApt(null);

    const waMsg = getRefusalWhatsAppMessage(
      apt.clientName,
      apt.date,
      apt.time,
      reason
    );
    const url = createWhatsAppLink(apt.clientWhatsapp, waMsg);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div id="admin-pending-queue" className="space-y-6">
      {/* Header Bento Card */}
      <div className="bg-[#16161B] rounded-3xl p-6 border border-[#262630] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-ping" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85]">
                Fila de Solicitações Pendentes
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#9E988F] mt-1">
              Clientes que enviaram solicitações de horário e aguardam sua confirmação manual ou renegociação de horário.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#121216] border border-[#262630] self-start sm:self-auto">
            <button
              id="filter-pending-all"
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs font-bold'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Todas ({appointments.filter((a) => a.status === 'PENDENTE' || a.status === 'AGUARDANDO NOVO HORÁRIO').length})
            </button>

            <button
              id="filter-pending-only"
              type="button"
              onClick={() => setFilterType('PENDING_ONLY')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'PENDING_ONLY'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs font-bold'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Aguardando ({appointments.filter((a) => a.status === 'PENDENTE').length})
            </button>

            <button
              id="filter-reschedule-only"
              type="button"
              onClick={() => setFilterType('RESCHEDULE_ONLY')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'RESCHEDULE_ONLY'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs font-bold'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Novo Horário ({appointments.filter((a) => a.status === 'AGUARDANDO NOVO HORÁRIO').length})
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#121216] border border-[#C5A059]/30 text-[#E6CA85] text-xs font-semibold flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-[#9E988F] hover:text-[#F5F3EF] font-bold px-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Requests List */}
      {pendingList.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#16161B] border border-dashed border-[#262630] shadow-2xs">
          <Sparkles className="w-10 h-10 text-[#C5A059] mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#F5F3EF]">
            Tudo em dia! Nenhuma solicitação pendente no momento.
          </h3>
          <p className="text-xs text-[#9E988F] mt-1 max-w-md mx-auto">
            Assim que uma cliente enviar um pedido de agendamento na página pública, ele aparecerá aqui com destaque para sua aprovação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingList.map((apt) => {
            const isPending = apt.status === 'PENDENTE';
            const isWaitingReschedule = apt.status === 'AGUARDANDO NOVO HORÁRIO';

            return (
              <div
                key={apt.id}
                id={`pending-card-${apt.id}`}
                className="bg-[#16161B] rounded-3xl p-6 border border-[#262630] shadow-2xs hover:border-[#C5A059]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#22222D] text-[#E6CA85] font-bold flex items-center justify-center shrink-0 border border-[#C5A059]/30">
                        {apt.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#F5F3EF]">
                          {apt.clientName}
                        </h3>
                        <p className="text-xs text-[#9E988F] font-medium">
                          {apt.clientPhone}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={apt.status} size="sm" />
                  </div>

                  {/* Procedure & Schedule Details */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#121216] border border-[#262630] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9E988F]">Procedimento:</span>
                      <span className="font-bold text-[#F5F3EF]">
                        {apt.serviceName} ({apt.serviceDuration} min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#9E988F]">Valor:</span>
                      <span className="font-bold text-[#E6CA85]">
                        {formatCurrency(apt.servicePrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#262630]">
                      <span className="text-[#9E988F] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#9E988F]" />
                        Data solicitada:
                      </span>
                      <span className="font-bold text-[#F5F3EF]">
                        {formatDayOfWeekName(apt.date)}, {formatDateShort(apt.date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#9E988F] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#9E988F]" />
                        Horário solicitado:
                      </span>
                      <span className="font-mono font-extrabold text-sm text-[#E6CA85] bg-[#16161B] px-2.5 py-0.5 rounded-lg border border-[#262630]">
                        {apt.time}
                      </span>
                    </div>

                    {isWaitingReschedule && apt.offeredTime && (
                      <div className="pt-2 border-t border-purple-900/40 text-purple-300 bg-purple-950/30 p-2.5 rounded-xl border">
                        <span className="font-semibold block">Nova opção sugerida pelo salão:</span>
                        <span>{apt.offeredTime} ({formatDateShort(apt.offeredDate || apt.date)})</span>
                        {apt.offeredAlternatives && apt.offeredAlternatives.length > 0 && (
                          <p className="text-[11px] text-purple-400 mt-0.5">
                            Outras opções: {apt.offeredAlternatives.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {apt.clientNotes && (
                      <div className="pt-2 border-t border-[#262630]">
                        <span className="text-[#9E988F] block text-[11px]">Obs. da cliente:</span>
                        <p className="italic text-[#D8D4CE] mt-0.5">&ldquo;{apt.clientNotes}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[#262630] flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id={`btn-queue-confirm-${apt.id}`}
                      type="button"
                      onClick={() => handleConfirm(apt)}
                      className="px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>CONFIRMAR</span>
                    </button>

                    <button
                      id={`btn-queue-reschedule-${apt.id}`}
                      type="button"
                      onClick={() => setRescheduleApt(apt)}
                      className="px-4 py-2.5 rounded-full bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CalendarClock className="w-4 h-4 text-[#C5A059]" />
                      <span>OUTRO HORÁRIO</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <a
                      id={`btn-queue-whatsapp-${apt.id}`}
                      href={createWhatsAppLink(
                        apt.clientWhatsapp,
                        `Olá, ${apt.clientName}! Tudo bem? Sobre o seu agendamento no ${settings.name}...`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-4 py-2 rounded-full border border-[#262630] text-[#D8D4CE] hover:bg-[#22222D] hover:text-[#F5F3EF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>FALAR NO WHATSAPP</span>
                    </a>

                    <button
                      id={`btn-queue-refuse-${apt.id}`}
                      type="button"
                      onClick={() => setRefuseModalApt(apt)}
                      className="px-4 py-2 rounded-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>RECUSAR</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refusal Modal */}
      {refuseModalApt && (
        <div
          id="refuse-appointment-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-[#16161B] rounded-3xl shadow-2xl p-6 border border-[#262630] space-y-4">
            <h3 className="text-base font-serif font-bold text-[#E6CA85]">
              Recusar solicitação de {refuseModalApt.clientName}
            </h3>
            <p className="text-xs text-[#9E988F]">
              O horário solicitado ({refuseModalApt.time} em {formatDateShort(refuseModalApt.date)}) não será reservado. Informe o motivo para enviar à cliente:
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                Motivo da Recusa
              </label>
              <input
                type="text"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefuseModalApt(null)}
                className="px-4 py-2 rounded-full border border-[#262630] text-xs font-semibold text-[#9E988F] hover:bg-[#22222D] hover:text-[#F5F3EF] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRefusal}
                className="px-5 py-2 rounded-full bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <RescheduleModal
          appointment={rescheduleApt}
          onClose={() => setRescheduleApt(null)}
        />
      )}
    </div>
  );
};
