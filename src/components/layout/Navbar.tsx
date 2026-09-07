import React, { useState } from 'react';
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
  Menu,
  X,
  Lock,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { NewAppointmentModal } from '../admin/NewAppointmentModal';
import { createWhatsAppLink } from '../../utils/dateTime';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogin,
}) => {
  const {
    userRole,
    setUserRole,
    isAdminLoggedIn,
    logoutAdmin,
    adminCredentials,
    settings,
    pendingAppointmentsCount,
  } = useSalon();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewAptModalOpen, setIsNewAptModalOpen] = useState(false);

  const adminNavItems = [
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
    <>
      <header className="sticky top-0 z-40 bg-[#121215]/95 backdrop-blur-md border-b border-[#262630] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1A1A22] border border-[#C5A059]/30 text-[#E6CA85] flex items-center justify-center shadow-xs">
                <Scissors className="w-5 h-5 text-[#E6CA85]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif italic text-[#E6CA85] tracking-tight leading-none">
                  {settings.name}
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-[#9E988F] mt-0.5">
                  {isAdminLoggedIn && userRole === 'admin'
                    ? 'Painel Administrativo'
                    : 'Agendamento Exclusivo'}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* If user is NOT logged in as admin: Pure client view actions */}
              {!isAdminLoggedIn ? (
                <>
                  <a
                    id="btn-nav-wa-contact"
                    href={createWhatsAppLink(
                      settings.whatsapp,
                      'Olá! Gostaria de tirar uma dúvida sobre horários de atendimento.'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/50 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    id="btn-nav-admin-login"
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#3A3A48] text-[#D8D4CE] hover:text-[#F5F3EF] hover:bg-[#1E1E26] hover:border-[#C5A059]/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    title="Acesso exclusivo da administradora do salão"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#E6CA85]" />
                    <span className="hidden sm:inline">Área da Administradora</span>
                    <span className="sm:hidden">Entrar</span>
                  </button>
                </>
              ) : (
                /* If admin IS authenticated */
                <>
                  {/* Toggle between admin workspace and previewing client view */}
                  {userRole === 'admin' ? (
                    <button
                      id="btn-nav-view-client"
                      type="button"
                      onClick={() => setUserRole('client')}
                      className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#3A3A48] text-xs font-semibold text-[#D8D4CE] hover:bg-[#1E1E26] hover:border-[#C5A059]/40 transition-all"
                      title="Ver como a cliente visualiza o agendamento"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#E6CA85]" />
                      <span>Visão da Cliente</span>
                    </button>
                  ) : (
                    <button
                      id="btn-nav-back-to-admin"
                      type="button"
                      onClick={() => setUserRole('admin')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C5A059] text-[#0D0D10] text-xs font-bold hover:bg-[#DFBD69] shadow-xs transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Voltar ao Painel</span>
                    </button>
                  )}

                  {/* New Appointment button (only in admin workspace) */}
                  {userRole === 'admin' && (
                    <button
                      id="btn-nav-new-apt"
                      type="button"
                      onClick={() => setIsNewAptModalOpen(true)}
                      className="hidden sm:inline-flex items-center gap-2 bg-[#C5A059] hover:bg-[#DFBD69] px-4 py-1.5 rounded-full text-xs font-bold text-[#0D0D10] shadow-md shadow-[#C5A059]/15 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Novo Agendamento</span>
                    </button>
                  )}

                  {/* Admin info badge */}
                  <span
                    className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181820] border border-[#2A2A38] text-[11px] font-mono text-[#C5A059] max-w-[200px] truncate"
                    title={`Administradora: ${adminCredentials.email || 'eveline.studiohair@gmail.com'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                    <span className="truncate">{adminCredentials.email || 'eveline.studiohair@gmail.com'}</span>
                  </span>

                  {/* Logout button */}
                  <button
                    id="btn-nav-logout"
                    type="button"
                    onClick={logoutAdmin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer"
                    title="Encerrar sessão administrativa"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>

                  {/* Mobile nav toggle */}
                  {userRole === 'admin' && (
                    <button
                      id="btn-mobile-nav-toggle"
                      type="button"
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="lg:hidden p-2 rounded-xl text-[#9E988F] hover:bg-[#1E1E26] transition-colors"
                    >
                      {isMobileMenuOpen ? (
                        <X className="w-5 h-5 text-[#F5F3EF]" />
                      ) : (
                        <div className="relative">
                          <Menu className="w-5 h-5 text-[#F5F3EF]" />
                          {pendingAppointmentsCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E6CA85] animate-ping" />
                          )}
                        </div>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown menu for Admin */}
        {isAdminLoggedIn && userRole === 'admin' && isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#262630] bg-[#141419] px-4 py-3 space-y-1 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[#22222D] text-[#E6CA85] font-bold border border-[#C5A059]/30'
                      : 'text-[#9E988F] hover:bg-[#1A1A22]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#C5A059] text-[#0D0D10]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-[#262630] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsNewAptModalOpen(true);
                }}
                className="w-full py-2.5 rounded-full bg-[#C5A059] text-[#0D0D10] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:bg-[#DFBD69]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Agendamento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setUserRole('client');
                }}
                className="w-full py-2 rounded-full border border-[#2E2E3A] text-[#D8D4CE] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#1E1E26]"
              >
                <Eye className="w-3.5 h-3.5 text-[#E6CA85]" />
                <span>Ver Visão da Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logoutAdmin();
                }}
                className="w-full py-2 rounded-full bg-rose-950/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-900/50 hover:bg-rose-900/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão (Sair)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {isNewAptModalOpen && (
        <NewAppointmentModal onClose={() => setIsNewAptModalOpen(false)} />
      )}
    </>
  );
};
