import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  generateTimeSlotsForDay,
  getDayOfWeekNumber,
  formatCurrency,
  getTodayDateStr,
  isDateInPast,
  isDateTimeInPast,
  formatDateBR,
  formatPhoneBR,
  normalizeWhatsAppNumber,
} from '../../utils/dateTime';
import { X, Calendar, Clock, User, Phone, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppointmentStatus } from '../../types';
import { BrazilianDatePicker } from '../common/BrazilianDatePicker';

interface NewAppointmentModalProps {
  onClose: () => void;
  defaultDate?: string;
  defaultTime?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  onClose,
  defaultDate,
  defaultTime,
}) => {
  const {
    services,
    availability,
    blockedSlots,
    appointments,
    createAdminAppointment,
  } = useSalon();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const initialDate = defaultDate && !isDateInPast(defaultDate) ? defaultDate : getTodayDateStr();
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(defaultTime || '14:00');
  const [status, setStatus] = useState<AppointmentStatus>('CONFIRMADO');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate available slots for chosen date
  const dow = getDayOfWeekNumber(date);
  const dayConfig = availability.find((c) => c.dayOfWeek === dow);
  const slots = dayConfig
    ? generateTimeSlotsForDay(date, dayConfig, blockedSlots, appointments)
    : [];

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneBR(val);
    setClientPhone(formatted);
    setClientWhatsapp(normalizeWhatsAppNumber(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientName.trim()) {
      setErrorMessage('Informe o nome da cliente.');
      return;
    }
    if (!clientPhone.trim()) {
      setErrorMessage('Informe o telefone da cliente.');
      return;
    }
    if (!serviceId) {
      setErrorMessage('Selecione o procedimento.');
      return;
    }
    if (!date || !time) {
      setErrorMessage('Selecione data e horário.');
      return;
    }
    if (isDateInPast(date)) {
      setErrorMessage('Não é permitido agendar em datas passadas.');
      return;
    }
    if (isDateTimeInPast(date, time)) {
      setErrorMessage('Não é permitido agendar em horários que já passaram.');
      return;
    }

    const res = createAdminAppointment({
      clientName,
      clientPhone,
      clientWhatsapp: normalizeWhatsAppNumber(clientWhatsapp || clientPhone),
      serviceId,
      date,
      time,
      status,
      notes,
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Erro ao criar agendamento.');
      return;
    }

    onClose();
  };

  return (
    <div
      id="new-appointment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <div
        id="new-appointment-modal-content"
        className="w-full max-w-lg bg-[#16161B] rounded-3xl shadow-2xl border border-[#262630] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262630] bg-[#121216]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#22222D] border border-[#C5A059]/30 flex items-center justify-center text-[#E6CA85]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#E6CA85]">
                Novo Agendamento
              </h3>
              <p className="text-xs text-[#9E988F]">
                Inserir agendamento manual diretamente pelo salão
              </p>
            </div>
          </div>
          <button
            id="btn-close-new-apt-modal"
            onClick={onClose}
            className="p-1.5 text-[#9E988F] hover:text-[#F5F3EF] rounded-lg hover:bg-[#22222D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Client Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                Nome da Cliente *
              </label>
              <div className="relative">
                <input
                  id="input-new-apt-name"
                  type="text"
                  required
                  placeholder="Ex: Mariana Castro"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                />
                <User className="w-4 h-4 text-[#9E988F] absolute left-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    id="input-new-apt-phone"
                    type="tel"
                    required
                    placeholder="(11) 99999-8888"
                    value={clientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                  />
                  <Phone className="w-4 h-4 text-[#9E988F] absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                  WhatsApp (apenas números)
                </label>
                <input
                  id="input-new-apt-wa"
                  type="text"
                  placeholder="5511999998888"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(normalizeWhatsAppNumber(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Procedure */}
          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Procedimento *
            </label>
            <select
              id="select-new-apt-service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden cursor-pointer"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#16161B] text-[#F5F3EF]">
                  {s.name} ({s.durationMinutes} min) - {formatCurrency(s.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Data do Atendimento *</span>
                <span className="normal-case font-mono font-normal text-[#9E988F] text-[11px]">(DD/MM/AAAA)</span>
              </label>
              <BrazilianDatePicker
                id="input-new-apt-date"
                value={date}
                onChange={setDate}
                min={getTodayDateStr()}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                Horário *
              </label>
              <div className="relative">
                <select
                  id="select-new-apt-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden cursor-pointer"
                >
                  {slots.map((s) => {
                    const isPast = s.isPast || isDateTimeInPast(date, s.time);
                    const isDisabled = s.isBlocked || isPast;
                    return (
                      <option key={s.time} value={s.time} disabled={isDisabled} className="bg-[#16161B] text-[#F5F3EF]">
                        {s.time}{' '}
                        {isPast
                          ? '(Passado)'
                          : s.isBlocked
                          ? '(Bloqueado)'
                          : `(${s.availableSpots} livre)`}
                      </option>
                    );
                  })}
                  {!slots.some((s) => s.time === time) && (
                    <option value={time} className="bg-[#16161B] text-[#F5F3EF]">{time}</option>
                  )}
                </select>
                <Clock className="w-4 h-4 text-[#9E988F] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Status Inicial
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-status-choice-confirmado"
                type="button"
                onClick={() => setStatus('CONFIRMADO')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'CONFIRMADO'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50 ring-1 ring-emerald-500/40 font-bold'
                    : 'bg-[#121216] text-[#9E988F] border-[#262630] hover:bg-[#1A1A22]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmado (Ocupa vaga)</span>
              </button>

              <button
                id="btn-status-choice-pendente"
                type="button"
                onClick={() => setStatus('PENDENTE')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'PENDENTE'
                    ? 'bg-[#22222D] text-[#E6CA85] border-[#C5A059]/60 ring-1 ring-[#C5A059]/30 font-bold'
                    : 'bg-[#121216] text-[#9E988F] border-[#262630] hover:bg-[#1A1A22]'
                }`}
              >
                <Clock className="w-4 h-4 text-[#C5A059]" />
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Observações internas (opcional)
            </label>
            <textarea
              id="input-new-apt-notes"
              rows={2}
              placeholder="Ex: Cliente agendou pelo WhatsApp, avisar sobre o teste de mecha."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-[#262630] flex gap-2.5">
            <button
              id="btn-submit-new-apt"
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] font-bold text-sm transition-colors shadow-xs cursor-pointer"
            >
              Confirmar e Cadastrar
            </button>
            <button
              id="btn-cancel-new-apt"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-[#22222D] hover:bg-[#2A2A38] text-[#D8D4CE] border border-[#262630] font-medium text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
