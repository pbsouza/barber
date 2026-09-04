import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import {
  Calendar,
  Clock,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Sparkles,
  RefreshCw,
  Crown,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    sessionRemainingSeconds,
    renewSession,
    logout,
    login,
    openAuthModal,
    openSubscriptionModal,
    activeView,
    setActiveView,
  } = useApp();

  const [showDemoMenu, setShowDemoMenu] = useState(false);

  // Format 5-min timer
  const minutes = Math.floor(sessionRemainingSeconds / 60);
  const seconds = sessionRemainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = sessionRemainingSeconds < 60;

  return (
    <header className="sticky top-0 z-40 bg-[#161B1F]/95 backdrop-blur-md border-b border-[#2C343D] shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveView(currentUser?.role === 'ADMIN' ? 'ADMIN_PANEL' : 'BOOKING')}
            className="cursor-pointer group"
          >
            <BrandLogo variant="compact" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1E2429] p-1.5 rounded-2xl border border-[#2D3640]">
            <button
              onClick={() => setActiveView('BOOKING')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeView === 'BOOKING'
                  ? 'bg-gradient-to-r from-[#CBA358] to-[#B88C3E] text-[#14181B] font-bold shadow-md shadow-[#CBA358]/20'
                  : 'text-[#D0D7DE] hover:text-white hover:bg-[#283138]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Agendar Horário
            </button>

            <button
              onClick={openSubscriptionModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#E5C158] hover:text-[#F3D78A] hover:bg-[#CBA358]/10 transition"
            >
              <Crown className="w-4 h-4 text-[#CBA358]" />
              Planos do Clube
            </button>

            {currentUser && currentUser.role === 'CLIENT' && (
              <button
                onClick={() => setActiveView('MY_BOOKINGS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeView === 'MY_BOOKINGS'
                    ? 'bg-gradient-to-r from-[#CBA358] to-[#B88C3E] text-[#14181B] font-bold shadow-md shadow-[#CBA358]/20'
                    : 'text-[#D0D7DE] hover:text-white hover:bg-[#283138]'
                }`}
              >
                <Clock className="w-4 h-4" />
                Meus Agendamentos
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveView('ADMIN_PANEL')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition ${
                  activeView === 'ADMIN_PANEL'
                    ? 'bg-gradient-to-r from-[#CBA358] to-[#B88C3E] text-[#14181B] font-bold shadow-md shadow-[#CBA358]/20'
                    : 'text-[#CBA358] hover:text-[#E5C158] hover:bg-[#CBA358]/10'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Painel ADM
              </button>
            )}
          </nav>

          {/* Right Section: Session Countdown & User Badge */}
          <div className="flex items-center gap-3">
            {/* 5-minute Activity Expiration Countdown Indicator */}
            {currentUser && (
              <div
                title="Sessão expira automaticamente em 5 minutos de inatividade"
                className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                  isUrgent
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                    : 'bg-[#181D21] border-[#2C343D] text-[#A6B2BD]'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-[#CBA358]'}`} />
                <span>Sessão:</span>
                <span className="font-mono font-bold text-[#F6F2EA]">{formattedTime}</span>
                <button
                  onClick={renewSession}
                  className="p-1 hover:text-[#CBA358] transition"
                  title="Renovar tempo de 5 minutos"
                >
                  <RefreshCw className="w-3 h-3 hover:rotate-180 transition duration-300" />
                </button>
              </div>
            )}

            {/* Quick Access Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E2429] hover:bg-[#273038] text-[11px] font-semibold text-[#D0D7DE] border border-[#2D3640] transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#CBA358]" />
                <span className="hidden sm:inline">Acesso Rápido</span>
                <ChevronDown className="w-3 h-3 text-[#A6B2BD]" />
              </button>

              {showDemoMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#1A2025] border border-[#333C46] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowDemoMenu(false)}
                >
                  <div className="text-[10px] font-bold text-[#A6B2BD] uppercase tracking-wider px-2 py-1">
                    Acesso ao Sistema
                  </div>
                  <button
                    onClick={() => {
                      login('belchior87@gmail.com', 'ADMIN');
                      setShowDemoMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left hover:bg-[#CBA358]/10 transition group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#CBA358]/20 text-[#CBA358] border border-[#CBA358]/30 flex items-center justify-center font-bold text-xs">
                      LH
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#F6F2EA] group-hover:text-[#CBA358] transition">
                        Lucas Hoffmann (ADM)
                      </p>
                      <p className="text-[10px] text-[#A6B2BD] truncate">belchior87@gmail.com</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      openAuthModal('REGISTER', 'CLIENT');
                      setShowDemoMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left hover:bg-[#262E35] transition group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      +
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#F6F2EA] group-hover:text-white">Novo Cliente</p>
                      <p className="text-[10px] text-[#A6B2BD] truncate">Cadastre seu nome e telefone</p>
                    </div>
                  </button>

                  <div className="mt-2 pt-2 border-t border-[#2A333C] px-2 py-1 flex items-center justify-between text-[10px] text-[#A6B2BD]">
                    <span>Base em Nuvem:</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Firebase Firestore
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Auth Button or User Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[#1E2429] border border-[#2D3640]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#CBA358] to-[#E5C158] flex items-center justify-center text-xs font-bold text-[#14181B]">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-[#F6F2EA] leading-tight truncate max-w-[120px]">
                      {currentUser.name.split(' ')[0]}
                    </p>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-[#CBA358]/20 text-[#CBA358]'
                          : currentUser.subscriptionId
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-[#262E35] text-[#D0D7DE]'
                      }`}
                    >
                      {currentUser.role === 'ADMIN' ? 'Administrador' : currentUser.subscriptionId ? 'Clube VIP' : 'Cliente'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sair da conta"
                  className="p-2 rounded-xl bg-[#1E2429] hover:bg-red-500/20 hover:text-red-400 text-[#A6B2BD] border border-[#2D3640] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('LOGIN')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#CBA358] to-[#B88C3E] hover:from-[#DFB86C] hover:to-[#CBA358] text-[#14181B] text-xs font-black uppercase tracking-wider transition shadow-md shadow-[#CBA358]/20"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#262E35] text-xs font-semibold">
          <button
            onClick={() => setActiveView('BOOKING')}
            className={`px-3 py-1.5 rounded-lg ${
              activeView === 'BOOKING' ? 'bg-[#CBA358] text-[#14181B] font-bold' : 'text-[#A6B2BD]'
            }`}
          >
            Agendar
          </button>
          <button onClick={openSubscriptionModal} className="px-3 py-1.5 rounded-lg text-[#CBA358]">
            Assinaturas
          </button>
          {currentUser?.role === 'CLIENT' && (
            <button
              onClick={() => setActiveView('MY_BOOKINGS')}
              className={`px-3 py-1.5 rounded-lg ${
                activeView === 'MY_BOOKINGS' ? 'bg-[#CBA358] text-[#14181B] font-bold' : 'text-[#A6B2BD]'
              }`}
            >
              Meus Horários
            </button>
          )}
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveView('ADMIN_PANEL')}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                activeView === 'ADMIN_PANEL' ? 'bg-[#CBA358] text-[#14181B]' : 'text-[#CBA358]'
              }`}
            >
              Painel ADM
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
