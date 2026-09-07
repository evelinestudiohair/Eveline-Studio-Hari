import React, { useState } from 'react';
import { Appointment } from '../../types';
import { useSalon } from '../../context/SalonContext';
import {
  findAlternativeAvailableSlots,
  formatDateShort,
  formatDateBR,
  formatDayOfWeekName,
  createWhatsAppLink,
  getOfferRescheduleWhatsAppMessage,
  getTodayDateStr,
  isDateInPast,
} from '../../utils/dateTime';
import { X, Calendar, Clock, MessageSquare, Check, Sparkles } from 'lucide-react';
import { BrazilianDatePicker } from '../common/BrazilianDatePicker';

interface RescheduleModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  onClose,
}) => {
  const { availability, blockedSlots, appointments, offerAlternativeSlot, settings } =
    useSalon();

  const initialDate = appointment.date && !isDateInPast(appointment.date) ? appointment.date : getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [additionalAlternatives, setAdditionalAlternatives] = useState<string[]>([]);
  const [customOptionInput, setCustomOptionInput] = useState<string>('');

  // Find nearby available slots for the selected date
  const availableSlots = findAlternativeAvailableSlots(
    selectedDate,
    availability,
    blockedSlots,
    appointments,
    appointment.time
  );

  const toggleAlternative = (time: string) => {
    if (additionalAlternatives.includes(time)) {
      setAdditionalAlternatives((prev) => prev.filter((t) => t !== time));
    } else {
      setAdditionalAlternatives((prev) => [...prev, time]);
    }
  };

  const handleAddCustomOption = () => {
    if (customOptionInput.trim() && !additionalAlternatives.includes(customOptionInput.trim())) {
      setAdditionalAlternatives((prev) => [...prev, customOptionInput.trim()]);
      setCustomOptionInput('');
    }
  };

  const handleSaveAndNotify = () => {
    const mainTime = selectedTime || additionalAlternatives[0] || 'A combinar';
    const allOptions = Array.from(
      new Set([mainTime, ...additionalAlternatives].filter(Boolean))
    );

    offerAlternativeSlot(
      appointment.id,
      selectedDate,
      mainTime,
      allOptions
    );

    // Open WhatsApp with pre-filled message
    const waText = getOfferRescheduleWhatsAppMessage(
      appointment.clientName,
      `${appointment.time} (${formatDateShort(appointment.date)})`,
      allOptions,
      settings.name
    );
    const waUrl = createWhatsAppLink(appointment.clientWhatsapp, waText);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    onClose();
  };

  const handleSaveWithoutWhatsApp = () => {
    const mainTime = selectedTime || additionalAlternatives[0] || 'A combinar';
    const allOptions = Array.from(
      new Set([mainTime, ...additionalAlternatives].filter(Boolean))
    );

    offerAlternativeSlot(
      appointment.id,
      selectedDate,
      mainTime,
      allOptions
    );
    onClose();
  };

  return (
    <div
      id="reschedule-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <div
        id="reschedule-modal-content"
        className="w-full max-w-lg bg-[#16161B] rounded-3xl shadow-2xl border border-[#262630] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262630] bg-[#121216]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#22222D] border border-[#C5A059]/40 flex items-center justify-center text-[#E6CA85]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#E6CA85]">
                Oferecer Outro Horário
              </h3>
              <p className="text-xs text-[#9E988F]">
                Cliente: <strong className="text-[#F5F3EF]">{appointment.clientName}</strong> • {appointment.serviceName}
              </p>
            </div>
          </div>
          <button
            id="btn-close-reschedule-modal"
            onClick={onClose}
            className="p-1.5 text-[#9E988F] hover:text-[#F5F3EF] rounded-lg hover:bg-[#22222D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Current Request Info */}
          <div className="p-3.5 rounded-2xl bg-[#1A1813] border border-[#C5A059]/40 text-xs text-[#E6CA85] flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Horário solicitado originalmente:</span>{' '}
              {formatDayOfWeekName(appointment.date)}, {formatDateShort(appointment.date)} às{' '}
              <strong className="underline text-[#F5F3EF]">{appointment.time}</strong>.
              <p className="mt-1 text-[#D8D4CE]">
                Selecione abaixo uma data e os horários alternativos disponíveis para propor à cliente.
              </p>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Data para sugerir horários</span>
              <span className="normal-case font-mono font-normal text-[#9E988F] text-[11px]">(DD/MM/AAAA)</span>
            </label>
            <BrazilianDatePicker
              id="input-reschedule-date"
              min={getTodayDateStr()}
              value={selectedDate}
              onChange={(newDate) => {
                setSelectedDate(newDate);
                setSelectedTime('');
                setAdditionalAlternatives([]);
              }}
            />
          </div>

          {/* Available Slots nearby */}
          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-2">
              Horários disponíveis encontrados ({availableSlots.length})
            </label>

            {availableSlots.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-[#121216] border border-dashed border-[#262630] text-xs text-[#9E988F]">
                Nenhum horário com vagas livres nesta data. Experimente trocar o dia acima ou inserir manualmente.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const isPrimary = selectedTime === slot.time;
                  const isChecked = isPrimary || additionalAlternatives.includes(slot.time);

                  return (
                    <button
                      key={slot.time}
                      id={`btn-alt-slot-${slot.time.replace(':', '')}`}
                      type="button"
                      onClick={() => {
                        if (!selectedTime) {
                          setSelectedTime(slot.time);
                        } else if (selectedTime === slot.time) {
                          setSelectedTime('');
                        } else {
                          toggleAlternative(slot.time);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-center text-xs font-medium border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isPrimary
                          ? 'bg-[#C5A059] text-[#0D0D10] font-bold border-[#C5A059] shadow-sm'
                          : isChecked
                          ? 'bg-[#22222D] text-[#E6CA85] border-[#C5A059]/60 ring-1 ring-[#C5A059]/30'
                          : 'bg-[#121216] text-[#D8D4CE] border-[#262630] hover:border-[#C5A059]/40 hover:bg-[#1A1A22]'
                      }`}
                    >
                      <span className="text-sm font-semibold">{slot.time}</span>
                      <span className="text-[10px] opacity-80">{slot.label.split('(')[1]?.replace(')', '') || 'livre'}</span>
                      {isPrimary && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-[#0D0D10]/30 px-1 rounded-sm mt-0.5">
                          Principal
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add custom alternative time if needed */}
          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1.5">
              Ou digite outro horário customizado
            </label>
            <div className="flex gap-2">
              <input
                id="input-custom-alt-time"
                type="text"
                placeholder="Ex: 10:30, 16:30"
                value={customOptionInput}
                onChange={(e) => setCustomOptionInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
              />
              <button
                id="btn-add-custom-alt"
                type="button"
                onClick={handleAddCustomOption}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40 transition-colors cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Summary of options to be offered */}
          {(selectedTime || additionalAlternatives.length > 0) && (
            <div className="p-3 rounded-2xl bg-[#121216] border border-[#262630] text-xs">
              <span className="font-semibold text-[#D8D4CE]">Opções que serão oferecidas à cliente:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedTime && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C5A059] text-[#0D0D10] font-bold">
                    <Check className="w-3 h-3" /> {selectedTime} (Principal)
                  </span>
                )}
                {additionalAlternatives
                  .filter((t) => t !== selectedTime)
                  .map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/30 font-medium"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => toggleAlternative(t)}
                        className="hover:text-rose-400 cursor-pointer ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-[#262630] bg-[#121216] flex flex-col sm:flex-row gap-2.5">
          <button
            id="btn-confirm-reschedule-wa"
            type="button"
            onClick={handleSaveAndNotify}
            disabled={!selectedTime && additionalAlternatives.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] text-white font-medium text-xs sm:text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Salvar e Enviar no WhatsApp</span>
          </button>
          <button
            id="btn-confirm-reschedule-internal"
            type="button"
            onClick={handleSaveWithoutWhatsApp}
            disabled={!selectedTime && additionalAlternatives.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Apenas Salvar Status
          </button>
        </div>
      </div>
    </div>
  );
};
