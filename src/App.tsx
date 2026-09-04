import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { SubscriptionPlansModal } from './components/SubscriptionPlansModal';
import { ClientBookingFlow } from './components/ClientBookingFlow';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReminderModal } from './components/admin/AdminReminderModal';
import { BrandLogo } from './components/BrandLogo';
import { MapPin, Phone, Clock, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, currentUser, setActiveView, openSubscriptionModal } = useApp();

  return (
    <div className="min-h-screen bg-[#13171A] text-[#F6F2EA] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeView === 'ADMIN_PANEL' && currentUser?.role === 'ADMIN' ? (
          <AdminDashboard />
        ) : activeView === 'MY_BOOKINGS' ? (
          <ClientDashboard />
        ) : (
          <ClientBookingFlow />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal />
      <SubscriptionPlansModal />
      <AdminReminderModal />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#262E35] bg-[#0E1214] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#A6B2BD]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <BrandLogo variant="compact" />
            </div>
            <p className="text-[#A6B2BD] leading-relaxed text-xs">
              Excelência e tradição em cortes clássicos, navalhados de alta precisão, barboterapia premium com toalha quente e clube de assinaturas exclusivo.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F6F2EA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBA358]" />
              Localização & Contato
            </h4>
            <div className="space-y-2 text-xs text-[#A6B2BD]">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#CBA358] shrink-0" />
                <span>Rua das Palmeiras, 450 - Centro</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#CBA358] shrink-0" />
                <span>(11) 98765-4321 • Atendimento VIP</span>
              </p>
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
                <span>Segunda a Sexta: 09:00 às 20:00</span>
              </p>
              <p className="pl-5 text-[#8895A3]">Sábado: 08:30 às 19:00</p>
              <p className="pl-5 text-[#8895A3]">Domingo: Fechado (Consultar feriados)</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F6F2EA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBA358]" />
              Atalhos do Sistema
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
              <button
                onClick={() => setActiveView('ADMIN_PANEL')}
                className="text-left text-[#CBA358] hover:text-[#E5C158] transition flex items-center gap-1 font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Painel do Administrador
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#262E35] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#798593] text-[11px]">
          <p>© 2026 Lucas Hoffmann Barber • Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Gestão & Agendamento de Alta Performance • Sessão Segura
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
