import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { SubscriptionPlansModal } from './components/SubscriptionPlansModal';
import { ClientBookingFlow } from './components/ClientBookingFlow';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReminderModal } from './components/admin/AdminReminderModal';
import { Scissors, MapPin, Phone, Clock, ShieldCheck, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, currentUser, setActiveView, openSubscriptionModal } = useApp();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
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
      <footer className="mt-auto border-t border-slate-800 bg-[#0b1120] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <span className="text-base font-extrabold text-white font-['Cabinet_Grotesk',sans-serif]">
                BELCHIOR<span className="text-amber-400">BARBER</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Referência em cortes clássicos, fade moderno, barboterapia tradicional com toalha quente e clube de
              assinatura exclusivo.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Localização & Contato</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Rua das Palmeiras, 450 - Centro</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>(11) 98765-4321 • WhatsApp</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Horário de Atendimento</h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Segunda a Sexta: 09:00 às 20:00</span>
              </p>
              <p className="pl-5 text-slate-500">Sábado: 08:30 às 19:00</p>
              <p className="pl-5 text-slate-500">Domingo: Fechado (Consultar feriados)</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Atalhos do Sistema</h4>
            <div className="flex flex-col gap-2 text-xs">
              <button
                onClick={() => setActiveView('BOOKING')}
                className="text-left text-slate-400 hover:text-amber-400 transition"
              >
                Agendamento de Horários
              </button>
              <button
                onClick={openSubscriptionModal}
                className="text-left text-slate-400 hover:text-amber-400 transition"
              >
                Planos do Clube VIP
              </button>
              <button
                onClick={() => setActiveView('ADMIN_PANEL')}
                className="text-left text-amber-400 hover:text-amber-300 transition flex items-center gap-1 font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Acesso do Administrador
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2026 Barbearia Belchior Master • Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Sistema Web App de Gestão & Agendamentos • Sessão Segura de 5 minutos
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
