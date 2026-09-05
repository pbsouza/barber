import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { SubscriptionPlansModal } from './components/SubscriptionPlansModal';
import { ClientBookingFlow } from './components/ClientBookingFlow';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReminderModal } from './components/admin/AdminReminderModal';
import { BrandLogo } from './components/BrandLogo';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MapPin, Phone, Clock, ShieldCheck, Mail } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeView,
    currentUser,
    setActiveView,
    openSubscriptionModal,
    establishmentInfo,
  } = useApp();

  // Browser & Android back button navigation handler
  useEffect(() => {
    // Ensure initial root state exists in history
    if (!window.history.state) {
      window.history.replaceState({ appView: 'BOOKING' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.appView) {
        setActiveView(event.state.appView);
      } else {
        // Navigate internally back to home booking screen instead of exiting the webapp
        setActiveView('BOOKING');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView]);

  // Sync activeView changes to browser history
  useEffect(() => {
    if (window.history.state?.appView !== activeView) {
      window.history.pushState({ appView: activeView }, '');
    }
  }, [activeView]);

  return (
    <div className="min-h-screen bg-[#13171A] text-[#F6F2EA] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Viewport with Landscape & Large Screen Enhancements */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
        {activeView === 'ADMIN_PANEL' && currentUser?.role === 'ADMIN' ? (
          <AdminDashboard />
        ) : activeView === 'MY_BOOKINGS' ? (
          <ClientDashboard />
        ) : (
          <ClientBookingFlow />
        )}
      </main>

      {/* Global Modals & Indicators */}
      <AuthModal />
      <SubscriptionPlansModal />
      <AdminReminderModal />
      <OfflineIndicator />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#262E35] bg-[#0E1214] py-10 px-4 sm:px-6 lg:px-8 text-xs text-[#A6B2BD]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <BrandLogo variant="compact" />
            </div>
            <p className="text-[#A6B2BD] leading-relaxed text-xs">
              {establishmentInfo.description ||
                'Excelência e tradição em cortes clássicos, navalhados de alta precisão, barboterapia premium com toalha quente e clube de assinaturas exclusivo.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F6F2EA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBA358]" />
              Localização & Contato
            </h4>
            <div className="space-y-2.5 text-xs text-[#A6B2BD]">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#CBA358] shrink-0 mt-0.5" />
                <span>
                  {establishmentInfo.address}, {establishmentInfo.neighborhood}
                  <br />
                  <span className="text-[#8895A3]">{establishmentInfo.city}</span>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#CBA358] shrink-0" />
                <span>{establishmentInfo.phone}</span>
              </p>
              {establishmentInfo.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#CBA358] shrink-0" />
                  <span className="truncate">{establishmentInfo.contactEmail}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F6F2EA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBA358]" />
              Horário de Atendimento
            </h4>
            <div className="space-y-1.5 text-xs text-[#A6B2BD]">
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#CBA358] shrink-0" />
                <span>Segunda a Sexta: {establishmentInfo.hoursWeekdays}</span>
              </p>
              <p className="pl-5 text-[#8895A3]">Sábado: {establishmentInfo.hoursSaturday}</p>
              <p className="pl-5 text-[#8895A3]">Domingo: {establishmentInfo.hoursSunday}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F6F2EA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBA358]" />
              Atalhos Rápidos
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <button
                onClick={() => setActiveView('BOOKING')}
                className="text-left text-[#A6B2BD] hover:text-[#CBA358] transition"
              >
                Agendamento de Horários
              </button>
              <button
                onClick={openSubscriptionModal}
                className="text-left text-[#A6B2BD] hover:text-[#CBA358] transition"
              >
                Planos do Clube VIP
              </button>
              {/* Painel ADM só aparece quando autenticado com e-mail de administrador */}
              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => setActiveView('ADMIN_PANEL')}
                  className="text-left text-[#CBA358] hover:text-[#E5C158] transition flex items-center gap-1 font-semibold pt-1 border-t border-slate-800/60"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Acessar Painel do Administrador
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#262E35] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#798593] text-[11px]">
          <p>© 2026 {establishmentInfo.name || 'Lucas Hoffmann Barber'} • Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Gestão & Agendamento Inteligente • Conexão Segura
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
