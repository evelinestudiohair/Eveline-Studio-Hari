import React from 'react';
import { AppointmentStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarClock,
  CheckCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1 font-bold uppercase tracking-wider',
    md: 'text-[11px] px-3 py-1 gap-1.5 font-bold uppercase tracking-wider',
    lg: 'text-xs px-3.5 py-1.5 gap-2 font-bold uppercase tracking-wider',
  };

  switch (status) {
    case 'PENDENTE':
      return (
        <span
          id="status-badge-pendente"
          className={`inline-flex items-center rounded-full bg-[#C5A059]/15 text-[#E6CA85] border border-[#C5A059]/40 shadow-xs ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-[#E6CA85] shrink-0 animate-pulse" />
          <span>Pendente</span>
        </span>
      );

    case 'CONFIRMADO':
      return (
        <span
          id="status-badge-confirmado"
          className={`inline-flex items-center rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Confirmado</span>
        </span>
      );

    case 'AGUARDANDO NOVO HORÁRIO':
      return (
        <span
          id="status-badge-aguardando-novo"
          className={`inline-flex items-center rounded-full bg-purple-950/50 text-purple-300 border border-purple-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <CalendarClock className="w-3 h-3 text-purple-400 shrink-0" />
          <span>Novo Horário</span>
        </span>
      );

    case 'RECUSADO':
      return (
        <span
          id="status-badge-recusado"
          className={`inline-flex items-center rounded-full bg-rose-950/50 text-rose-300 border border-rose-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
          <span>Recusado</span>
        </span>
      );

    case 'CANCELADO':
      return (
        <span
          id="status-badge-cancelado"
          className={`inline-flex items-center rounded-full bg-[#1E1E26] text-[#9E988F] border border-[#2E2E3A] shadow-xs ${sizeClasses[size]}`}
        >
          <AlertCircle className="w-3 h-3 text-[#9E988F] shrink-0" />
          <span>Cancelado</span>
        </span>
      );

    case 'FINALIZADO':
      return (
        <span
          id="status-badge-finalizado"
          className={`inline-flex items-center rounded-full bg-sky-950/50 text-sky-300 border border-sky-800/60 shadow-xs ${sizeClasses[size]}`}
        >
          <CheckCheck className="w-3 h-3 text-sky-400 shrink-0" />
          <span>Finalizado</span>
        </span>
      );

    default:
      return null;
  }
};
