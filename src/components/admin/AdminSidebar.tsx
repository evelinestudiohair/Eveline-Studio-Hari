import React from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  Scissors,
  LayoutDashboard,
  CalendarDays,
  Clock,
  Sliders,
  Users,
  Settings,
  Eye,
  Shield,
  Plus,
  LogOut,
} from 'lucide-react';
import { formatDateShort } from '../../utils/dateTime';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewApt: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewApt,
}) => {
  const {
    settings,
    pendingAppointmentsCount,
    currentWeek,
    openWeek,
    closeWeek,
    userRole,
    setUserRole,
    logoutAdmin,
    adminCredentials,
  } = useSalon();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda Semanal', icon: CalendarDays },
    {
      id: 'pending',
      label: 'Solicitações',
      icon: Clock,
      badge: pendingAppointmentsCount,
    },
    { id: 'availability', label: 'Disponibilidade', icon: Sliders },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'services', label: 'Procedimentos', icon: Scissors },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#121215] border-r border-[#262630] flex flex-col shrink-0 min-h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#262630]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#C5A059]/40 text-[#E6CA85] flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <Scissors className="w-5 h-5 text-[#E6CA85]" />
            )}
          </div>
          <h1 className="text-xl font-serif italic text-[#E6CA85] tracking-tight leading-tight">
            {settings.name}
          </h1>
        </div>
        <div className="mt-2.5 p-2.5 rounded-xl bg-[#181820] border border-[#2A2A38]">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Acesso Total da Administradora</span>
          </div>
          <p
            className="text-[11px] text-[#9E988F] font-mono truncate mt-0.5"
            title={adminCredentials.email || 'eveline.studiohair@gmail.com'}
          >
            {adminCredentials.email || 'eveline.studiohair@gmail.com'}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                isActive
                  ? 'bg-[#22222D] text-[#E6CA85] font-bold border border-[#C5A059]/30 shadow-xs'
                  : 'text-[#9E988F] hover:bg-[#1A1A22] hover:text-[#F5F3EF]'
              }`}
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#C5A059] text-[#0D0D10]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Widgets */}
      <div className="p-5 mt-auto space-y-3">
        {/* Switch perspective and Logout */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setUserRole('client')}
            className="w-full py-2 px-3 rounded-xl border border-[#2E2E3A] text-[11px] font-semibold text-[#D8D4CE] hover:bg-[#1E1E26] hover:text-[#F5F3EF] transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-3.5 h-3.5 text-[#E6CA85]" />
            <span>Ver Visão da Cliente</span>
          </button>

          <button
            id="sidebar-btn-logout"
            type="button"
            onClick={logoutAdmin}
            className="w-full py-2 px-3 rounded-xl border border-rose-900/60 bg-rose-950/40 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Sistema</span>
          </button>
        </div>

        {/* Current Week Status Card from Bento Grid */}
        <div className="bg-gradient-to-br from-[#1E1E26] to-[#16161B] border border-[#C5A059]/30 text-[#F5F3EF] p-4 rounded-2xl flex flex-col items-center text-center shadow-md">
          <p className="text-[10px] text-[#E6CA85] mb-0.5 uppercase tracking-wider font-semibold">
            Semana Atual ({formatDateShort(currentWeek.startDate)} a {formatDateShort(currentWeek.endDate)})
          </p>
          <p className="text-xs font-bold mb-3 text-[#F5F3EF]">
            {currentWeek.status === 'OPEN' ? 'Agenda Aberta' : 'Agenda Fechada'}
          </p>

          <button
            id="sidebar-btn-toggle-week"
            type="button"
            onClick={() => {
              if (currentWeek.status === 'OPEN') {
                closeWeek(currentWeek.id);
              } else {
                openWeek(currentWeek.id);
              }
            }}
            className="bg-[#C5A059] text-[#0D0D10] font-bold text-xs px-4 py-2 rounded-full w-full uppercase tracking-wider shadow-xs hover:bg-[#DFBD69] transition-colors"
          >
            {currentWeek.status === 'OPEN' ? 'Fechar Agenda' : 'Abrir Agenda'}
          </button>
        </div>
      </div>
    </aside>
  );
};
