import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { formatDateBR } from '../../utils/dateTime';
import { BrazilianDatePicker } from '../common/BrazilianDatePicker';
import {
  Lock,
  Unlock,
  Clock,
  Calendar,
  Save,
  ShieldAlert,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const AdminAvailability: React.FC = () => {
  const {
    weeks,
    toggleWeekStatus,
    openWeek,
    closeWeek,
    availability,
    updateDayAvailability,
    setSlotCapacity,
    blockedSlots,
    addBlockedSlot,
    removeBlockedSlot,
  } = useSalon();

  const [activeTab, setActiveTab] = useState<'WEEKS' | 'DAYS' | 'BLOCKS'>('WEEKS');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // Segunda default
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // New Block State
  const [newBlockDate, setNewBlockDate] = useState('2026-09-14');
  const [newBlockTime, setNewBlockTime] = useState('14:00');
  const [newBlockIsAllDay, setNewBlockIsAllDay] = useState(false);
  const [newBlockReason, setNewBlockReason] = useState('');

  const currentDayConfig = availability.find((c) => c.dayOfWeek === selectedDayOfWeek) || availability[0];

  const handleUpdateDay = (field: string, value: any) => {
    updateDayAvailability(selectedDayOfWeek, { [field]: value });
    setSaveFeedback('Configurações do dia salvas!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleCapacityChange = (time: string, capacity: number) => {
    setSlotCapacity(selectedDayOfWeek, time, Math.max(1, capacity));
    setSaveFeedback(`Vagas para ${time} atualizadas para ${capacity}!`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate) return;

    addBlockedSlot(
      newBlockDate,
      newBlockIsAllDay ? undefined : newBlockTime,
      newBlockIsAllDay,
      newBlockReason.trim() || 'Bloqueio administrativo'
    );
    setNewBlockReason('');
    setSaveFeedback('Bloqueio cadastrado com sucesso!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div id="admin-availability" className="space-y-6">
      {/* Top Header & Sub-tabs */}
      <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85]">
              Disponibilidade & Controle de Agenda
            </h2>
            <p className="text-xs sm:text-sm text-[#9E988F] mt-1">
              Controle abertura de semanas, horários de atendimento, vagas por horário e bloqueios.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-[#121216] rounded-xl border border-[#262630] self-start sm:self-auto">
            <button
              id="subtab-weeks"
              type="button"
              onClick={() => setActiveTab('WEEKS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'WEEKS'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Abertura por Semana
            </button>

            <button
              id="subtab-days"
              type="button"
              onClick={() => setActiveTab('DAYS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'DAYS'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Horários & Vagas
            </button>

            <button
              id="subtab-blocks"
              type="button"
              onClick={() => setActiveTab('BLOCKS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'BLOCKS'
                  ? 'bg-[#22222D] text-[#E6CA85] border border-[#C5A059]/40 shadow-xs'
                  : 'text-[#9E988F] hover:text-[#F5F3EF]'
              }`}
            >
              Bloqueios ({blockedSlots.length})
            </button>
          </div>
        </div>

        {saveFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-[#142019] border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveFeedback}</span>
          </div>
        )}
      </div>

      {/* 1. WEEKS TAB */}
      {activeTab === 'WEEKS' && (
        <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#F5F3EF]">
              Controle de Abertura Semanal
            </h3>
            <p className="text-xs text-[#9E988F] mt-1">
              Feche semanas que já estejam lotadas e abra com antecedência apenas as semanas que deseja disponibilizar para suas clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeks.map((w) => {
              const isOpen = w.status === 'OPEN';

              return (
                <div
                  key={w.id}
                  id={`week-card-${w.id}`}
                  className={`p-5 rounded-2xl border transition-all ${
                    isOpen
                      ? 'bg-[#15241B]/40 border-emerald-800/60 ring-1 ring-emerald-700/30'
                      : 'bg-[#121216] border-[#262630]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9E988F]">
                        Período
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-[#F5F3EF] mt-0.5">
                        {formatDateBR(w.startDate)} a {formatDateBR(w.endDate)}
                      </h4>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isOpen
                          ? 'bg-[#142019] text-emerald-300 border border-emerald-800/60'
                          : 'bg-[#1E1E26] text-[#9E988F] border border-[#2E2E3A]'
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ABERTA</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-[#9E988F]" />
                          <span>FECHADA</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[#9E988F] mt-3">
                    {isOpen
                      ? 'Clientes conseguem solicitar horários nesta semana normalmente.'
                      : 'Clientes veem: "Essa agenda está fechada no momento. Aguarde a abertura da próxima semana."'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#262630] flex items-center justify-between">
                    <span className="text-xs text-[#9E988F]">
                      Alterar disponibilidade:
                    </span>

                    <button
                      id={`btn-toggle-week-${w.id}`}
                      type="button"
                      onClick={() => toggleWeekStatus(w.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                        isOpen
                          ? 'bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#C5A059]/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>FECHAR AGENDA</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>ABRIR AGENDA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DAYS TAB */}
      {activeTab === 'DAYS' && (
        <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#F5F3EF]">
              Grade de Atendimento e Quantidade de Vagas
            </h3>
            <p className="text-xs text-[#9E988F] mt-1">
              Configure os horários de início e fim, intervalo de almoço e personalize a quantidade de vagas por horário.
            </p>
          </div>

          {/* Day selection tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {availability.map((day) => (
              <button
                key={day.dayOfWeek}
                id={`btn-select-day-${day.dayOfWeek}`}
                type="button"
                onClick={() => setSelectedDayOfWeek(day.dayOfWeek)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedDayOfWeek === day.dayOfWeek
                    ? 'bg-[#22222D] border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-xs text-[#E6CA85]'
                    : 'bg-[#121216] border-[#262630] hover:bg-[#1A1A22] text-[#D8D4CE]'
                }`}
              >
                <span className="block text-xs font-bold">
                  {day.dayName.split('-')[0]}
                </span>
                <span className={`text-[11px] font-semibold mt-0.5 block ${day.isOpen ? 'text-emerald-400' : 'text-[#7A756D]'}`}>
                  {day.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Day Configuration Form */}
          <div className="p-5 rounded-2xl bg-[#121216] border border-[#262630] space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#E6CA85] uppercase tracking-wider">
                Configurações de {currentDayConfig.dayName}
              </h4>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="checkbox-day-is-open"
                  type="checkbox"
                  checked={currentDayConfig.isOpen}
                  onChange={(e) => handleUpdateDay('isOpen', e.target.checked)}
                  className="w-4 h-4 accent-[#C5A059] rounded-sm"
                />
                <span className="text-xs font-bold text-[#F5F3EF]">
                  Atender neste dia
                </span>
              </label>
            </div>

            {currentDayConfig.isOpen ? (
              <div className="space-y-4">
                {/* Working Hours & Interval */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                      Horário Inicial
                    </label>
                    <input
                      id="input-day-start-time"
                      type="time"
                      value={currentDayConfig.startTime}
                      onChange={(e) => handleUpdateDay('startTime', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                      Horário Final
                    </label>
                    <input
                      id="input-day-end-time"
                      type="time"
                      value={currentDayConfig.endTime}
                      onChange={(e) => handleUpdateDay('endTime', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                      Início Almoço / Pausa
                    </label>
                    <input
                      id="input-day-lunch-start"
                      type="time"
                      value={currentDayConfig.lunchBreakStart || '12:00'}
                      onChange={(e) => handleUpdateDay('lunchBreakStart', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                      Fim Almoço / Pausa
                    </label>
                    <input
                      id="input-day-lunch-end"
                      type="time"
                      value={currentDayConfig.lunchBreakEnd || '13:00'}
                      onChange={(e) => handleUpdateDay('lunchBreakEnd', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                      Intervalo entre atendimentos
                    </label>
                    <select
                      id="select-day-interval"
                      value={currentDayConfig.intervalMinutes}
                      onChange={(e) => handleUpdateDay('intervalMinutes', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                    >
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (1 hora)</option>
                      <option value={90}>90 minutos (1h 30m)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                      Vagas padrão por horário
                    </label>
                    <input
                      id="input-day-default-capacity"
                      type="number"
                      min={1}
                      max={10}
                      value={currentDayConfig.defaultCapacity || 1}
                      onChange={(e) => handleUpdateDay('defaultCapacity', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Individual Slot Capacity Overrides */}
                <div className="pt-4 border-t border-[#262630]">
                  <h5 className="text-xs font-bold text-[#E6CA85] uppercase tracking-wider mb-2">
                    Vagas Específicas por Horário
                  </h5>
                  <p className="text-xs text-[#9E988F] mb-3">
                    Você pode alterar a quantidade de atendimentos simultâneos permitidos em cada horário. O sistema nunca permitirá ultrapassar este limite.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => {
                      const cap = currentDayConfig.customSlotCapacities?.[t] ?? currentDayConfig.defaultCapacity ?? 1;

                      return (
                        <div
                          key={t}
                          className="p-2.5 rounded-xl bg-[#16161B] border border-[#262630] flex flex-col items-center gap-1.5 shadow-2xs"
                        >
                          <span className="font-bold text-xs text-[#F5F3EF]">{t}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCapacityChange(t, cap - 1)}
                              className="w-6 h-6 rounded-md bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#2E2E3A] text-xs font-bold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-extrabold w-5 text-center text-[#E6CA85]">
                              {cap}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCapacityChange(t, cap + 1)}
                              className="w-6 h-6 rounded-md bg-[#22222D] hover:bg-[#2A2A38] text-[#E6CA85] border border-[#2E2E3A] text-xs font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[10px] text-[#9E988F]">{cap === 1 ? 'vaga' : 'vagas'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#9E988F] bg-[#16161B] rounded-xl border border-dashed border-[#262630]">
                Este dia está marcado como fechado. Marque a opção acima caso queira atender às {currentDayConfig.dayName}s.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. BLOCKS TAB */}
      {activeTab === 'BLOCKS' && (
        <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#F5F3EF]">
              Bloqueios de Horários e Dias Inteiros
            </h3>
            <p className="text-xs text-[#9E988F] mt-1">
              Horários bloqueados nunca aparecem para as clientes na página de agendamento.
            </p>
          </div>

          {/* Create new block */}
          <form onSubmit={handleCreateBlock} className="p-5 rounded-2xl bg-[#121216] border border-[#262630] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6CA85]">
              + Cadastrar Novo Bloqueio
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] mb-1 flex items-center justify-between">
                  <span>Data *</span>
                  <span className="font-mono text-[10px] text-[#9E988F]">(DD/MM/AAAA)</span>
                </label>
                <BrazilianDatePicker
                  id="input-new-block-date"
                  required
                  value={newBlockDate}
                  onChange={setNewBlockDate}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                  Tipo de Bloqueio
                </label>
                <select
                  id="select-new-block-type"
                  value={newBlockIsAllDay ? 'ALL_DAY' : 'SPECIFIC_TIME'}
                  onChange={(e) => setNewBlockIsAllDay(e.target.value === 'ALL_DAY')}
                  className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                >
                  <option value="SPECIFIC_TIME">Horário Específico</option>
                  <option value="ALL_DAY">Dia Inteiro Fechado</option>
                </select>
              </div>

              {!newBlockIsAllDay && (
                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                    Horário a Bloquear
                  </label>
                  <input
                    id="input-new-block-time"
                    type="time"
                    value={newBlockTime}
                    onChange={(e) => setNewBlockTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] font-medium focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                Motivo do Bloqueio
              </label>
              <input
                id="input-new-block-reason"
                type="text"
                required
                placeholder="Ex: Compromisso pessoal, Dentista, Feriado municipal"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] placeholder-[#6E6A62] focus:border-[#C5A059] focus:outline-hidden"
              />
            </div>

            <button
              id="btn-submit-new-block"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Confirmar Bloqueio
            </button>
          </form>

          {/* List of active blocks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8D4CE]">
              Bloqueios Ativos ({blockedSlots.length})
            </h4>

            {blockedSlots.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#9E988F] bg-[#121216] rounded-xl border border-dashed border-[#262630]">
                Nenhum horário bloqueado no momento.
              </div>
            ) : (
              <div className="divide-y divide-[#262630] border border-[#262630] rounded-xl overflow-hidden bg-[#121216]">
                {blockedSlots.map((b) => (
                  <div
                    key={b.id}
                    id={`block-item-${b.id}`}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-[#1A1A22] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#F5F3EF]">
                          {formatDateBR(b.date)}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-950/40 border border-rose-900/40 text-rose-400">
                          {b.isAllDay ? 'Dia Inteiro' : b.time}
                        </span>
                      </div>
                      <p className="text-xs text-[#9E988F] mt-0.5">
                        Motivo: <strong className="text-[#D8D4CE]">{b.reason}</strong>
                      </p>
                    </div>

                    <button
                      id={`btn-remove-block-${b.id}`}
                      type="button"
                      onClick={() => removeBlockedSlot(b.id)}
                      className="p-2 text-[#9E988F] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remover bloqueio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
