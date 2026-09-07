import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  formatDateShort,
  formatDateBR,
  formatDayOfWeekName,
  getWeekDates,
  generateTimeSlotsForDay,
  getDayOfWeekNumber,
  formatCurrency,
  createWhatsAppLink,
  normalizeWhatsAppNumber,
  formatPhoneBR,
  isDateInPast,
  isDateTimeInPast,
  getTodayDateStr,
} from '../../utils/dateTime';
import { StatusBadge } from '../common/StatusBadge';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertCircle,
} from 'lucide-react';

export const ClientBookingView: React.FC = () => {
  const {
    services,
    availability,
    weeks,
    appointments,
    blockedSlots,
    requestAppointment,
    settings,
  } = useSalon();

  // Mode: Booking Flow or "Consultar meu agendamento"
  const [viewMode, setViewMode] = useState<'BOOKING' | 'STATUS_CHECK'>('BOOKING');

  // Booking Flow Steps:
  // 1: Service selection
  // 2: Date & Time selection
  // 3: Client info & submit
  // 4: Success confirmation screen
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || ''
  );
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(1); // default to week 2 (open)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-14');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedAppointmentId, setSubmittedAppointmentId] = useState<string | null>(null);

  // Status check state
  const [searchPhone, setSearchPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Selected week
  const activeWeek = weeks[selectedWeekIndex] || weeks[0];
  const weekDates = getWeekDates(activeWeek.startDate);

  // Calculate slots for chosen date
  const dow = getDayOfWeekNumber(selectedDate);
  const dayConfig = availability.find((c) => c.dayOfWeek === dow);
  const isDayConfigOpen = dayConfig?.isOpen ?? false;
  const isDayBlocked = blockedSlots.some(
    (b) => b.date === selectedDate && (b.isAllDay || !b.time)
  );

  const availableSlots = isDayConfigOpen && !isDayBlocked && dayConfig
    ? generateTimeSlotsForDay(selectedDate, dayConfig, blockedSlots, appointments)
    : [];

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedServiceId) {
      setErrorMessage('Por favor, selecione um procedimento.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Por favor, selecione a data e o horário desejados.');
      return;
    }
    if (isDateInPast(selectedDate)) {
      setErrorMessage('Não é permitido agendar em datas passadas. Por favor, selecione uma data futura.');
      return;
    }
    if (isDateTimeInPast(selectedDate, selectedTime)) {
      setErrorMessage('Este horário já passou. Por favor, escolha um horário futuro.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage('Por favor, informe o seu nome completo.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 8) {
      setErrorMessage('Por favor, informe um número de telefone/WhatsApp válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullWa = normalizeWhatsAppNumber(clientPhone);

      const res = await requestAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientWhatsapp: fullWa,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        clientNotes: clientNotes.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Não foi possível solicitar este horário.');
        setIsSubmitting(false);
        return;
      }

      setSubmittedAppointmentId(res.appointmentId || null);
      setCurrentStep(4); // Move to Success Screen
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao enviar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter client appointments for status checking
  const searchedAppointments = appointments.filter((a) => {
    if (!searchPhone) return false;
    const cleanSearch = searchPhone.replace(/\D/g, '');
    const cleanPhone = a.clientPhone.replace(/\D/g, '');
    const cleanWa = a.clientWhatsapp.replace(/\D/g, '');
    return (
      cleanPhone.includes(cleanSearch) ||
      cleanWa.includes(cleanSearch) ||
      a.clientName.toLowerCase().includes(searchPhone.toLowerCase())
    );
  });

  return (
    <div id="client-booking-experience" className="max-w-3xl mx-auto space-y-6">
      {/* Salon Header with Studio Owner Cover & Instagram-style Logo */}
      <div className="bg-[#16161B] rounded-3xl border border-[#262630] shadow-2xl overflow-hidden relative">
        {/* Cover Banner with Studio Owner Photo */}
        <div className="relative w-full h-48 sm:h-64 bg-[#121216] overflow-hidden">
          {settings.ownerCoverUrl ? (
            <img
              src={settings.ownerCoverUrl}
              alt={`${settings.ownerName} - ${settings.name}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#16161B] via-[#22222D] to-[#16161B] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#C5A059]/40 animate-pulse" />
            </div>
          )}

          {/* Dark luxury gradient overlays so text & avatar pop cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#16161B] via-[#16161B]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D10]/80 via-transparent to-[#0D0D10]/80" />

          {/* Top subtle badge on cover */}
          <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D0D10]/80 backdrop-blur-md border border-[#C5A059]/40 text-[#E6CA85] text-[10px] font-bold uppercase tracking-wider shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Atendimento Exclusivo
            </span>
          </div>
        </div>

        {/* Profile Details & Avatar overlapping the cover */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 relative -mt-16 sm:-mt-20 z-10 text-center">
          {/* Circular Instagram-style Logo / Profile Photo */}
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#E6CA85] to-[#8C6D34] shadow-2xl mx-auto">
              <div className="w-full h-full rounded-full bg-[#16161B] overflow-hidden flex items-center justify-center border-2 border-[#16161B]">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Scissors className="w-8 h-8 text-[#E6CA85]" />
                )}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#16161B] flex items-center justify-center" title="Studio Aberto">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#E6CA85] tracking-tight">
            {settings.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            <span className="text-sm font-semibold text-[#F5F3EF]">
              {settings.ownerName}
            </span>
            <span className="text-xs text-[#C5A059]">✦</span>
            <span className="text-xs text-[#C5A059] font-medium tracking-wide">
              {settings.ownerRole || 'Master Hair Stylist & Visagista'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#9E988F] mt-2 max-w-lg mx-auto leading-relaxed">
            {settings.ownerBio || 'Atendimento personalizado com horário marcado, biossegurança e produtos de alta performance para a beleza e saúde dos seus cabelos.'}
          </p>

          {/* Trust badges pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4 text-[11px] text-[#D8D4CE]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F1F28] border border-[#2A2A38]">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              Hora Marcada
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F1F28] border border-[#2A2A38]">
              <ShieldCheck className="w-3 h-3 text-[#C5A059]" />
              Produtos Premium
            </span>
            {settings.address && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F1F28] border border-[#2A2A38] truncate max-w-xs sm:max-w-none">
                📍 {settings.address}
              </span>
            )}
          </div>

          {/* View Switcher: Solicitar Horário vs Acompanhar Solicitação */}
          <div className="inline-flex items-center p-1 bg-[#121216] rounded-full border border-[#262630] mt-6 shadow-inner">
            <button
              id="tab-client-new-booking"
              type="button"
              onClick={() => {
                setViewMode('BOOKING');
                if (currentStep === 4) setCurrentStep(1);
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'BOOKING'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs font-bold'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Solicitar Horário
            </button>

            <button
              id="tab-client-check-status"
              type="button"
              onClick={() => setViewMode('STATUS_CHECK')}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'STATUS_CHECK'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs font-bold'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Acompanhar Meu Agendamento
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODE 1: STATUS CHECK VIEW */}
      {/* ============================================================ */}
      {viewMode === 'STATUS_CHECK' ? (
        <div className="bg-[#16161B] rounded-3xl p-6 sm:p-8 border border-[#262630] shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#F5F3EF]">
              Consultar Status do Meu Agendamento
            </h2>
            <p className="text-xs text-[#9E988F] mt-0.5">
              Digite seu telefone ou nome para verificar se sua solicitação foi confirmada ou se o salão propôs outro horário.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="input-client-check-phone"
                type="text"
                placeholder="Digite seu WhatsApp ou Telefone..."
                value={searchPhone}
                onChange={(e) => {
                  setSearchPhone(e.target.value);
                  setHasSearched(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setHasSearched(true);
                }}
                className="w-full pl-9 pr-4 py-3 rounded-full border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-xs sm:text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
              />
              <Search className="w-4 h-4 text-[#7A756D] absolute left-3.5 top-3.5" />
            </div>

            <button
              id="btn-client-search"
              type="button"
              onClick={() => setHasSearched(true)}
              className="px-6 py-3 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] font-bold text-xs sm:text-sm transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              Consultar
            </button>
          </div>

          {hasSearched && (
            <div className="space-y-4 pt-2">
              {searchedAppointments.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#121216] border border-dashed border-[#2A2A38] text-xs text-[#9E988F]">
                  Nenhum agendamento localizado com este contato. Verifique o número digitado ou faça uma nova solicitação.
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#9E988F]">
                    Seus Agendamentos Encontrados ({searchedAppointments.length}):
                  </h3>

                  {searchedAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-5 rounded-2xl border border-[#262630] bg-[#131317] space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-base text-[#F5F3EF] block">
                            {apt.serviceName}
                          </span>
                          <span className="text-xs text-[#9E988F]">
                            Cliente: {apt.clientName}
                          </span>
                        </div>
                        <StatusBadge status={apt.status} size="md" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#1A1A22] p-3 rounded-xl border border-[#2A2A38]">
                        <div>
                          <span className="text-[#9E988F] block text-[11px]">Data:</span>
                          <span className="font-bold text-[#F5F3EF]">
                            {formatDayOfWeekName(apt.date)}, {formatDateShort(apt.date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9E988F] block text-[11px]">Horário:</span>
                          <span className="font-mono font-bold text-[#E6CA85] text-sm">
                            {apt.time}
                          </span>
                        </div>
                      </div>

                      {/* Status Explanation Messages */}
                      {apt.status === 'PENDENTE' && (
                        <div className="p-3 rounded-xl bg-[#221C12] border border-amber-800/60 text-xs text-[#F5D78E]">
                          <strong>Aguardando confirmação:</strong> Sua solicitação foi recebida e a profissional está analisando a grade. Você receberá o retorno em breve pelo WhatsApp!
                        </div>
                      )}

                      {apt.status === 'CONFIRMADO' && (
                        <div className="p-3 rounded-xl bg-[#142019] border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Horário Confirmado!</strong> Sua vaga está reservada no {settings.name}. Te esperamos no endereço: {settings.address}.
                          </div>
                        </div>
                      )}

                      {apt.status === 'AGUARDANDO NOVO HORÁRIO' && (
                        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs text-purple-300 space-y-2">
                          <div>
                            <strong>Opção sugerida pelo salão:</strong> O horário original não pôde ser confirmado, mas a profissional ofereceu{' '}
                            <strong className="text-white">
                              {apt.offeredTime} no dia {formatDateShort(apt.offeredDate || apt.date)}
                            </strong>
                            .
                          </div>
                          {apt.offeredAlternatives && apt.offeredAlternatives.length > 0 && (
                            <p className="text-[11px] text-purple-300/80">
                              Outras opções disponíveis: {apt.offeredAlternatives.join(', ')}
                            </p>
                          )}
                          <a
                            href={createWhatsAppLink(
                              settings.whatsapp,
                              `Olá, ${settings.ownerName}! Vi a opção de horário (${apt.offeredTime}) e gostaria de confirmar.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Responder pelo WhatsApp
                          </a>
                        </div>
                      )}

                      {apt.status === 'RECUSADO' && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                          <strong>Não foi possível atender:</strong> {apt.adminNotes || 'Infelizmente não há disponibilidade nesta data.'} Entre em contato para verificarmos outros dias!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* MODE 2: STEP-BY-STEP BOOKING FLOW */
        /* ============================================================ */
        <div className="bg-[#16161B] rounded-3xl p-6 sm:p-8 border border-[#262630] shadow-2xl space-y-6">
          {/* Progress Indicator */}
          {currentStep < 4 && (
            <div className="border-b border-[#262630] pb-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#9E988F] uppercase tracking-wider mb-2">
                <span>Passo {currentStep} de 3</span>
                <span className="text-[#E6CA85]">
                  {currentStep === 1
                    ? 'Escolher Procedimento'
                    : currentStep === 2
                    ? 'Escolher Dia & Horário'
                    : 'Seus Dados & Solicitar'}
                </span>
              </div>
              <div className="w-full bg-[#1F1F28] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C5A059] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT PROCEDURE */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#F5F3EF]">
                  1. Qual procedimento você deseja realizar?
                </h2>
                <p className="text-xs text-[#9E988F] mt-0.5">
                  Selecione o serviço abaixo para vermos a duração e disponibilidade.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {services
                  .filter((s) => s.active)
                  .map((service) => {
                    const isSelected = selectedServiceId === service.id;

                    return (
                      <button
                        key={service.id}
                        id={`btn-client-service-${service.id}`}
                        type="button"
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#22222D] border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-md'
                            : 'bg-[#131317] border-[#2A2A38] hover:bg-[#1A1A22]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E6CA85] bg-[#1E1E26] px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                              {service.category || 'Serviço'}
                            </span>
                            <span className="text-xs font-bold text-[#F5F3EF]">
                              {formatCurrency(service.price)}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-[#F5F3EF] mt-2.5">
                            {service.name}
                          </h3>

                          {service.description && (
                            <p className="text-xs text-[#9E988F] mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-[#262630] flex items-center justify-between text-xs text-[#9E988F]">
                          <span className="flex items-center gap-1 text-[#9E988F]">
                            <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                            {service.durationMinutes} min
                          </span>
                          <span className={`font-bold ${isSelected ? 'text-[#E6CA85]' : 'text-[#9E988F]'}`}>
                            {isSelected ? 'Selecionado ✓' : 'Selecionar'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  id="btn-step1-next"
                  type="button"
                  onClick={() => {
                    if (selectedServiceId) setCurrentStep(2);
                  }}
                  disabled={!selectedServiceId}
                  className="px-6 py-3 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md shadow-[#C5A059]/20 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continuar para Data e Horário</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATE & TIME */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#F5F3EF]">
                  2. Escolha o dia e horário de preferência
                </h2>
                <p className="text-xs text-[#9E988F] mt-0.5">
                  Procedimento selecionado: <strong className="text-[#E6CA85]">{selectedService.name}</strong> ({selectedService.durationMinutes} min).
                </p>
              </div>

              {/* Week Selector tabs */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-[#121216] border border-[#262630]">
                <button
                  id="btn-client-prev-week"
                  type="button"
                  disabled={selectedWeekIndex <= 0}
                  onClick={() => {
                    const newIdx = selectedWeekIndex - 1;
                    setSelectedWeekIndex(newIdx);
                    const wDates = getWeekDates(weeks[newIdx].startDate);
                    const validDate = wDates.find((d) => !isDateInPast(d)) || weeks[newIdx].startDate;
                    setSelectedDate(validDate);
                    setSelectedTime('');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#1E1E26] text-[#D8D4CE] border border-[#2E2E3A] text-xs font-semibold shadow-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#252530] cursor-pointer"
                >
                  ← Anterior
                </button>

                <div className="text-center">
                  <span className="text-xs font-bold text-[#F5F3EF] block">
                    Semana de {formatDateBR(activeWeek.startDate)} a {formatDateBR(activeWeek.endDate)}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      activeWeek.status === 'OPEN'
                        ? 'text-emerald-400'
                        : 'text-[#9E988F]'
                    }`}
                  >
                    {activeWeek.status === 'OPEN' ? 'Disponível para agendamento' : 'Agenda Fechada'}
                  </span>
                </div>

                <button
                  id="btn-client-next-week"
                  type="button"
                  disabled={selectedWeekIndex >= weeks.length - 1}
                  onClick={() => {
                    const newIdx = selectedWeekIndex + 1;
                    setSelectedWeekIndex(newIdx);
                    const wDates = getWeekDates(weeks[newIdx].startDate);
                    const validDate = wDates.find((d) => !isDateInPast(d)) || weeks[newIdx].startDate;
                    setSelectedDate(validDate);
                    setSelectedTime('');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#1E1E26] text-[#D8D4CE] border border-[#2E2E3A] text-xs font-semibold shadow-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#252530] cursor-pointer"
                >
                  Próxima →
                </button>
              </div>

              {/* Check if active week is CLOSED */}
              {activeWeek.status === 'CLOSED' ? (
                <div className="p-8 text-center rounded-3xl bg-[#131317] border border-dashed border-[#2A2A38] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1E1E26] text-[#9E988F] flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5F3EF]">
                    Essa agenda está fechada no momento.
                  </h3>
                  <p className="text-xs text-[#9E988F] max-w-md mx-auto leading-relaxed">
                    Aguarde a abertura da próxima semana ou verifique as outras semanas nos botões acima. Você também pode nos chamar no WhatsApp para tirar dúvidas.
                  </p>
                </div>
              ) : (
                <>
                  {/* Days of week selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-2">
                      Selecione o Dia da Semana
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {weekDates.map((dStr) => {
                        const dowNum = getDayOfWeekNumber(dStr);
                        const dayCfg = availability.find((c) => c.dayOfWeek === dowNum);
                        const isClosed = !dayCfg || !dayCfg.isOpen;
                        const isBlocked = blockedSlots.some(
                          (b) => b.date === dStr && (b.isAllDay || !b.time)
                        );
                        const isPast = isDateInPast(dStr);
                        const isSelected = selectedDate === dStr;

                        return (
                          <button
                            key={dStr}
                            id={`btn-client-date-${dStr}`}
                            type="button"
                            disabled={isClosed || isBlocked || isPast}
                            onClick={() => {
                              setSelectedDate(dStr);
                              setSelectedTime('');
                            }}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#22222D] border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-md text-[#E6CA85]'
                                : isPast || isClosed || isBlocked
                                ? 'bg-[#101014] border-[#1E1E26] text-[#55504A] opacity-50 cursor-not-allowed'
                                : 'bg-[#131317] border-[#2A2A38] hover:bg-[#1A1A22] text-[#D8D4CE]'
                            }`}
                          >
                            <span className="block text-[11px] font-bold uppercase tracking-wider">
                              {formatDayOfWeekName(dStr).split('-')[0]}
                            </span>
                            <span className="block text-sm font-extrabold mt-0.5">
                              {formatDateShort(dStr)}
                            </span>
                            <span className="text-[10px] mt-1 block font-medium">
                              {isPast
                                ? 'Passado'
                                : isBlocked
                                ? 'Bloqueado'
                                : isClosed
                                ? 'Fechado'
                                : 'Aberto'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots for the selected day */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider">
                        Horários para {formatDayOfWeekName(selectedDate)}, {formatDateShort(selectedDate)}
                      </label>
                      <span className="text-[11px] text-[#9E988F]">
                        Apenas horários com vagas livres podem ser selecionados
                      </span>
                    </div>

                    {isDateInPast(selectedDate) ? (
                      <div className="p-6 text-center rounded-2xl bg-[#121216] border border-[#2A2A38] text-xs text-[#9E988F]">
                        Esta data já passou. Por favor, selecione uma data presente ou futura.
                      </div>
                    ) : isDayBlocked ? (
                      <div className="p-6 text-center rounded-2xl bg-[#121216] border border-[#2A2A38] text-xs text-[#9E988F]">
                        O salão estará fechado nesta data. Por favor, selecione outro dia.
                      </div>
                    ) : !isDayConfigOpen ? (
                      <div className="p-6 text-center rounded-2xl bg-[#121216] border border-[#2A2A38] text-xs text-[#9E988F]">
                        O salão não realiza atendimentos neste dia da semana.
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl bg-[#121216] border border-[#2A2A38] text-xs text-[#9E988F]">
                        Nenhum horário disponível para esta data.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {availableSlots.map((slot) => {
                          const isPast = slot.isPast || isDateTimeInPast(selectedDate, slot.time);
                          const isFull = slot.availableSpots <= 0;
                          const isBlocked = slot.isBlocked;
                          const isUnavailable = isFull || isBlocked || isPast;
                          const isSelected = selectedTime === slot.time;

                          return (
                            <button
                              key={slot.time}
                              id={`btn-client-slot-${slot.time.replace(':', '')}`}
                              type="button"
                              disabled={isUnavailable}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C5A059] text-[#0D0D10] border-[#DFBD69] shadow-md ring-2 ring-[#C5A059]/30 font-bold'
                                  : isUnavailable
                                  ? 'bg-[#101014] border-[#1E1E26] text-[#55504A] opacity-50 cursor-not-allowed'
                                  : 'bg-[#131317] border-[#2A2A38] text-[#F5F3EF] hover:border-[#C5A059] hover:bg-[#1A1A22]'
                              }`}
                            >
                              <span className="text-base font-mono font-bold tracking-tight">
                                {slot.time}
                              </span>

                              <span
                                className={`text-[10px] font-bold uppercase mt-0.5 ${
                                  isSelected
                                    ? 'text-[#0D0D10]'
                                    : isUnavailable
                                    ? 'text-[#55504A]'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {isPast
                                  ? 'Encerrado'
                                  : isBlocked
                                  ? 'Indisponível'
                                  : isFull
                                  ? 'Lotado'
                                  : 'Disponível'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="pt-4 border-t border-[#262630] flex items-center justify-between">
                <button
                  id="btn-step2-back"
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-full border border-[#2E2E3A] text-[#D8D4CE] hover:bg-[#1E1E26] font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  id="btn-step2-next"
                  type="button"
                  disabled={
                    !selectedTime ||
                    activeWeek.status === 'CLOSED' ||
                    isDateInPast(selectedDate) ||
                    isDateTimeInPast(selectedDate, selectedTime)
                  }
                  onClick={() => {
                    if (isDateInPast(selectedDate) || isDateTimeInPast(selectedDate, selectedTime)) {
                      setErrorMessage('Não é permitido agendar em datas ou horários passados.');
                      return;
                    }
                    if (selectedTime && activeWeek.status === 'OPEN') {
                      setCurrentStep(3);
                    }
                  }}
                  className="px-6 py-3 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md shadow-[#C5A059]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Continuar para Meus Dados</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT INFO & SUBMISSION */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmitRequest} className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#F5F3EF]">
                  3. Informe seus dados para contato
                </h2>
                <p className="text-xs text-[#9E988F] mt-0.5">
                  A profissional entrará em contato com você pelo WhatsApp para confirmar o agendamento.
                </p>
              </div>

              {/* Summary of chosen slot */}
              <div className="p-4 rounded-2xl bg-[#1E1E28] border border-[#C5A059]/30 text-xs space-y-1.5 text-[#DFBD69]">
                <div className="font-bold text-[#E6CA85] flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-[#E6CA85]" />
                  <span>Resumo do Horário Selecionado</span>
                </div>
                <p className="text-[#F5F3EF]">
                  Procedimento: <strong className="text-[#E6CA85]">{selectedService.name}</strong> • {formatCurrency(selectedService.price)} ({selectedService.durationMinutes} min)
                </p>
                <p className="text-[#F5F3EF]">
                  Data & Horário: <strong className="text-[#E6CA85]">{formatDayOfWeekName(selectedDate)}, {formatDateBR(selectedDate)} às {selectedTime}</strong>
                </p>
              </div>

              {/* Form inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <input
                      id="input-client-name"
                      type="text"
                      required
                      placeholder="Ex: Ana Paula Ribeiro"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
                    />
                    <User className="w-4 h-4 text-[#7A756D] absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                    Seu WhatsApp / Telefone *
                  </label>
                  <div className="relative">
                    <input
                      id="input-client-phone"
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(formatPhoneBR(e.target.value))}
                      maxLength={15}
                      className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
                    />
                    <Phone className="w-4 h-4 text-[#7A756D] absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-[#9E988F] mt-1">
                    Você receberá a confirmação por este número.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                    Observações adicionais (opcional)
                  </label>
                  <textarea
                    id="textarea-client-notes"
                    rows={2}
                    placeholder="Ex: Cabelo com progressiva, prefiro secador morno..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Informative Alert explaining manual confirmation */}
              <div className="p-3.5 rounded-2xl bg-[#221C12] border border-amber-800/60 text-xs text-[#F5D78E] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#E6CA85] shrink-0 mt-0.5" />
                <div>
                  <strong>Atenção:</strong> Os horários não são confirmados automaticamente. A profissional analisará a solicitação para garantir o tempo ideal do seu atendimento.
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-3 border-t border-[#262630] flex items-center justify-between gap-3">
                <button
                  id="btn-step3-back"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-full border border-[#2E2E3A] text-[#D8D4CE] hover:bg-[#1E1E26] font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  id="btn-submit-booking-request"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md shadow-[#C5A059]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Enviando solicitação...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enviar Solicitação de Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS SCREEN */}
          {currentStep === 4 && (
            <div id="booking-success-view" className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-[#221C12] text-[#E6CA85] border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-sm ring-8 ring-[#C5A059]/15 animate-bounce">
                <Clock className="w-10 h-10 text-[#E6CA85]" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#E6CA85]">
                  Solicitação enviada!
                </h2>
                <p className="text-sm font-semibold text-[#DFBD69]">
                  Seu horário está aguardando confirmação do salão.
                </p>
                <p className="text-xs text-[#9E988F] leading-relaxed">
                  Você receberá a confirmação após a análise da profissional. Fique atenta ao seu WhatsApp!
                </p>
              </div>

              {/* Recap Box */}
              <div className="max-w-sm mx-auto p-5 rounded-2xl bg-[#121216] border border-[#2A2A38] text-left text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#262630]">
                  <span className="text-[#9E988F]">Status atual:</span>
                  <StatusBadge status="PENDENTE" size="sm" />
                </div>
                <p>
                  <span className="text-[#9E988F]">Cliente:</span> <strong className="text-[#F5F3EF]">{clientName}</strong>
                </p>
                <p>
                  <span className="text-[#9E988F]">Procedimento:</span> <strong className="text-[#F5F3EF]">{selectedService.name}</strong>
                </p>
                <p>
                  <span className="text-[#9E988F]">Data e Horário:</span>{' '}
                  <strong className="text-[#E6CA85]">
                    {formatDayOfWeekName(selectedDate)}, {formatDateShort(selectedDate)} às {selectedTime}
                  </strong>
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  id="btn-talk-salon-wa"
                  href={createWhatsAppLink(
                    settings.whatsapp,
                    `Olá, ${settings.ownerName}! Acabei de enviar uma solicitação de agendamento para ${selectedService.name} em ${formatDateShort(selectedDate)} às ${selectedTime}. Nome: ${clientName}.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Avisar no WhatsApp</span>
                </a>

                <button
                  id="btn-new-request-flow"
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedTime('');
                    setClientNotes('');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#2E2E3A] text-[#D8D4CE] hover:bg-[#1E1E26] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Fazer outro agendamento
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
