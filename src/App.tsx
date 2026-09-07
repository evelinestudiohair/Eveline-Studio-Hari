import React, { useState } from 'react';
import { SalonProvider, useSalon } from './context/SalonContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/layout/Navbar';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminWeeklyAgenda } from './components/admin/AdminWeeklyAgenda';
import { AdminPendingQueue } from './components/admin/AdminPendingQueue';
import { AdminAvailability } from './components/admin/AdminAvailability';
import { AdminClients } from './components/admin/AdminClients';
import { AdminServices } from './components/admin/AdminServices';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { ClientBookingView } from './components/client/ClientBookingView';
import {
  Shield,
  Eye,
  MessageSquare,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  Bell,
  Plus,
  Lock,
} from 'lucide-react';
import { createWhatsAppLink } from './utils/dateTime';
import { NewAppointmentModal } from './components/admin/NewAppointmentModal';

const SalonAppContent: React.FC = () => {
  const {
    userRole,
    setUserRole,
    isAdminLoggedIn,
    logoutAdmin,
    settings,
    pendingAppointmentsCount,
  } = useSalon();
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [isNewAptModalOpen, setIsNewAptModalOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0D10] text-[#F5F3EF] flex font-sans selection:bg-[#C5A059]/20 selection:text-[#E6CA85]">
      {/* Desktop Sidebar (Only in Admin Mode for authenticated admin) */}
      {isAdminLoggedIn && userRole === 'admin' && (
        <div className="hidden lg:block">
          <AdminSidebar
            currentTab={adminTab}
            onSelectTab={setAdminTab}
            onOpenNewApt={() => setIsNewAptModalOpen(true)}
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          currentTab={adminTab}
          onSelectTab={setAdminTab}
          onOpenLogin={() => setShowAdminLogin(true)}
        />

        {/* Top Banner: ONLY visible to authenticated admin when previewing client view */}
        {isAdminLoggedIn && userRole === 'client' && (
          <div className="bg-[#16161B] text-[#F5F3EF] text-xs py-2.5 px-4 sm:px-8 border-b border-[#262630] animate-in fade-in duration-150">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] ring-2 ring-[#C5A059]/40 animate-pulse" />
                <span>
                  Sessão ativa como <strong className="text-[#E6CA85]">Administradora</strong> • Visualizando página pública de agendamento.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="btn-return-to-admin-panel"
                  type="button"
                  onClick={() => setUserRole('admin')}
                  className="text-[#C5A059] hover:text-[#E6CA85] underline font-semibold cursor-pointer text-xs"
                >
                  ← Retornar ao Painel Administrativo
                </button>
                <span className="text-[#3A3A48]">•</span>
                <button
                  id="btn-logout-preview"
                  type="button"
                  onClick={logoutAdmin}
                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-xs"
                >
                  Encerrar Sessão
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {showAdminLogin && !isAdminLoggedIn ? (
            <AdminLoginView
              onBackToBooking={() => setShowAdminLogin(false)}
              onLoginSuccess={() => setShowAdminLogin(false)}
            />
          ) : isAdminLoggedIn && userRole === 'admin' ? (
            <div>
              {adminTab === 'dashboard' && (
                <AdminDashboard onNavigateTab={setAdminTab} />
              )}
              {adminTab === 'agenda' && <AdminWeeklyAgenda />}
              {adminTab === 'pending' && <AdminPendingQueue />}
              {adminTab === 'availability' && <AdminAvailability />}
              {adminTab === 'clients' && <AdminClients />}
              {adminTab === 'services' && <AdminServices />}
              {adminTab === 'settings' && <AdminSettings />}
            </div>
          ) : (
            <ClientBookingView />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-[#121215] border-t border-[#262630] mt-auto py-6 px-6 sm:px-8 text-xs text-[#9E988F]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-sm text-[#E6CA85] font-semibold">
                {settings.name}
              </span>
              <span className="text-[#3A3A48]">•</span>
              <span>Sistema com Confirmação Manual e Gestão de Vagas</span>
            </div>

            <div className="flex items-center gap-4 text-[#9E988F]">
              <span>{settings.phone}</span>
              <span className="text-[#3A3A48]">•</span>
              <a
                href={createWhatsAppLink(
                  settings.whatsapp,
                  'Olá, gostaria de tirar uma dúvida sobre horários!'
                )}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp Salão
              </a>

              {/* Discreet login link in footer if not logged in */}
              {!isAdminLoggedIn && !showAdminLogin && (
                <>
                  <span className="text-[#3A3A48]">•</span>
                  <button
                    id="btn-footer-admin-login"
                    type="button"
                    onClick={() => setShowAdminLogin(true)}
                    className="text-[#9E988F] hover:text-[#E6CA85] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Acesso da Administradora</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Notification Pill (Active only for logged in admin when pending requests exist) */}
      {isAdminLoggedIn && userRole === 'admin' && pendingAppointmentsCount > 0 && (
        <div
          id="floating-pending-notification"
          onClick={() => setAdminTab('pending')}
          className="fixed bottom-6 right-6 bg-[#1A1A22] text-[#F5F3EF] px-5 py-3 rounded-full flex items-center space-x-3 shadow-2xl cursor-pointer hover:bg-[#22222D] transition-all z-50 border border-[#C5A059]/40"
        >
          <div className="w-2.5 h-2.5 bg-[#E6CA85] rounded-full animate-ping" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#E6CA85]">
            {pendingAppointmentsCount}{' '}
            {pendingAppointmentsCount === 1
              ? 'cliente aguardando confirmação'
              : 'clientes aguardando confirmação'}
          </p>
        </div>
      )}

      {isNewAptModalOpen && (
        <NewAppointmentModal onClose={() => setIsNewAptModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SalonProvider>
        <SalonAppContent />
      </SalonProvider>
    </ErrorBoundary>
  );
}
