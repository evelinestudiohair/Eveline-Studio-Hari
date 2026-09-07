import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface BrazilianDatePickerProps {
  id?: string;
  value: string; // ISO date format 'YYYY-MM-DD'
  onChange: (value: string) => void;
  min?: string; // 'YYYY-MM-DD'
  max?: string; // 'YYYY-MM-DD'
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES_PT = [
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

const WEEKDAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isoToBr(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

function brToIso(brDate: string): string | null {
  const parts = brDate.split('/');
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;

  // Days in month validation
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;

  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

function formatMask(input: string): string {
  // Extract numbers only
  const nums = input.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 2) {
    return nums;
  }
  if (nums.length <= 4) {
    return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  }
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`;
}

export const BrazilianDatePicker: React.FC<BrazilianDatePickerProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className = '',
  placeholder = 'DD/MM/AAAA',
}) => {
  const [inputText, setInputText] = useState(() => isoToBr(value));
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial viewing month/year from current value or today
  const getInitialView = () => {
    if (value && value.length === 10) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const [viewDate, setViewDate] = useState(getInitialView);

  // Sync inputText when value prop changes externally
  useEffect(() => {
    setInputText(isoToBr(value));
    if (value && value.length === 10) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewDate({ year: y, month: m - 1 });
      }
    }
  }, [value]);

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const masked = formatMask(rawVal);
    setInputText(masked);

    if (masked.length === 10) {
      const iso = brToIso(masked);
      if (iso) {
        if (min && iso < min) {
          // Date before min allowed
          return;
        }
        if (max && iso > max) {
          return;
        }
        onChange(iso);
      }
    } else if (masked.length === 0) {
      onChange('');
    }
  };

  const handleInputBlur = () => {
    // If not full or invalid, revert to existing value
    if (inputText.length > 0 && inputText.length < 10) {
      setInputText(isoToBr(value));
    } else if (inputText.length === 10) {
      const iso = brToIso(inputText);
      if (!iso || (min && iso < min) || (max && iso > max)) {
        setInputText(isoToBr(value));
      }
    }
  };

  const handleSelectDay = (day: number) => {
    const yStr = String(viewDate.year);
    const mStr = String(viewDate.month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const iso = `${yStr}-${mStr}-${dStr}`;

    if (min && iso < min) return;
    if (max && iso > max) return;

    onChange(iso);
    setInputText(`${dStr}/${mStr}/${yStr}`);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const totalDaysInMonth = new Date(
    viewDate.year,
    viewDate.month + 1,
    0
  ).getDate();

  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Today string in ISO
  const todayObj = new Date();
  const todayIso = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="\d{2}/\d{2}/\d{4}"
          placeholder={placeholder}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={() => !disabled && setIsOpen(true)}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className={`w-full px-3.5 py-2 pr-10 rounded-xl border border-[#2A2A38] text-sm font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] bg-[#16161B] text-[#F5F3EF] disabled:bg-[#121216] disabled:text-[#6E6A62] disabled:cursor-not-allowed ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#9E988F] hover:text-[#E6CA85] transition-colors focus:outline-hidden cursor-pointer"
          title="Abrir calendário"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* Brazilian Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-[#16161B] rounded-2xl shadow-2xl border border-[#262630] p-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Month / Year & Nav */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#9E988F] hover:bg-[#22222D] hover:text-[#F5F3EF] transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-[#E6CA85] uppercase tracking-wider">
              {MONTH_NAMES_PT[viewDate.month]} {viewDate.year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#9E988F] hover:bg-[#22222D] hover:text-[#F5F3EF] transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers (PT-BR: Dom, Seg, Ter, Qua, Qui, Sex, Sáb) */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {WEEKDAY_NAMES_PT.map((w, idx) => (
              <span
                key={w}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  idx === 0 ? 'text-[#E6CA85]' : 'text-[#7A756D]'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {leadingBlanks.map((_, i) => (
              <span key={`blank-${i}`} className="w-8 h-8" />
            ))}

            {daysArray.map((day) => {
              const yStr = String(viewDate.year);
              const mStr = String(viewDate.month + 1).padStart(2, '0');
              const dStr = String(day).padStart(2, '0');
              const currentDayIso = `${yStr}-${mStr}-${dStr}`;

              const isSelected = value === currentDayIso;
              const isToday = todayIso === currentDayIso;
              const isDisabled =
                (min && currentDayIso < min) || (max && currentDayIso > max);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={Boolean(isDisabled)}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059] text-[#0D0D10] font-bold shadow-xs'
                      : isToday
                      ? 'border border-[#C5A059] text-[#E6CA85] font-bold bg-[#22222D]'
                      : isDisabled
                      ? 'text-[#4A4742] opacity-40 cursor-not-allowed'
                      : 'text-[#D8D4CE] hover:bg-[#22222D] hover:text-[#F5F3EF]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action: Hoje */}
          <div className="mt-3 pt-2 border-t border-[#262630] flex items-center justify-between text-[11px]">
            <span className="text-[#7A756D] font-mono">Formato: DD/MM/AAAA</span>
            <button
              type="button"
              onClick={() => {
                if (min && todayIso < min) return;
                if (max && todayIso > max) return;
                onChange(todayIso);
                setInputText(isoToBr(todayIso));
                const [y, m] = todayIso.split('-').map(Number);
                setViewDate({ year: y, month: m - 1 });
                setIsOpen(false);
              }}
              className="text-[#E6CA85] font-semibold hover:underline cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
