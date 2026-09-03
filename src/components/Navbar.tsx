import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Scissors,
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
    <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <div
            onClick={() => setActiveView(currentUser?.role === 'ADMIN' ? 'ADMIN_PANEL' : 'BOOKING')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-[2px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-300">
              <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                <Scissors className="w-5 h-5 text-amber-400 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-['Cabinet_Grotesk',sans-serif]">
                  BELCHIOR<span className="text-amber-400">BARBER</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Master
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Agendamento Inteligente & Clube VIP</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1e293b] p-1.5 rounded-xl border border-slate-700/70">
            <button
              onClick={() => setActiveView('BOOKING')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeView === 'BOOKING'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Agendar Horário
            </button>

            <button
              onClick={openSubscriptionModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              Planos do Clube
            </button>

            {currentUser && currentUser.role === 'CLIENT' && (
              <button
                onClick={() => setActiveView('MY_BOOKINGS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  activeView === 'MY_BOOKINGS'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Clock className="w-4 h-4" />
                Meus Agendamentos
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveView('ADMIN_PANEL')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition ${
                  activeView === 'ADMIN_PANEL'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
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
                className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  isUrgent
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
                <span>Sessão:</span>
                <span className="font-mono font-bold text-slate-200">{formattedTime}</span>
                <button
                  onClick={renewSession}
                  className="p-1 hover:text-amber-400 transition"
                  title="Renovar tempo de 5 minutos"
                >
                  <RefreshCw className="w-3 h-3 hover:rotate-180 transition duration-300" />
                </button>
              </div>
            )}

            {/* Quick Demo Access Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Acesso Rápido</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDemoMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1e293b] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowDemoMenu(false)}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Alternar Conta Demo
                  </div>
                  <button
                    onClick={() => {
                      login('belchior87@gmail.com', 'ADMIN');
                      setShowDemoMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-amber-500/10 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      ADM
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                        Belchior (Administrador)
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">belchior87@gmail.com</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      login('lucas.silveira@email.com', 'CLIENT');
                      setShowDemoMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-slate-700/60 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      VIP
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white">Lucas Silveira</p>
                      <p className="text-[10px] text-slate-400 truncate">Assinante Clube VIP Master</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      login('rafael.mendes@email.com', 'CLIENT');
                      setShowDemoMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-slate-700/60 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      CLI
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white">Rafael Mendes</p>
                      <p className="text-[10px] text-slate-400 truncate">Cliente Regular</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Auth Button or User Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/70">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-slate-950">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[120px]">
                      {currentUser.name.split(' ')[0]}
                    </p>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300'
                          : currentUser.subscriptionId
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {currentUser.role === 'ADMIN' ? 'Administrador' : currentUser.subscriptionId ? 'Clube VIP' : 'Cliente'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sair da conta"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('LOGIN')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveView('BOOKING')}
            className={`px-3 py-1.5 rounded-lg ${
              activeView === 'BOOKING' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Agendar
          </button>
          <button onClick={openSubscriptionModal} className="px-3 py-1.5 rounded-lg text-amber-400">
            Assinaturas
          </button>
          {currentUser?.role === 'CLIENT' && (
            <button
              onClick={() => setActiveView('MY_BOOKINGS')}
              className={`px-3 py-1.5 rounded-lg ${
                activeView === 'MY_BOOKINGS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Meus Horários
            </button>
          )}
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveView('ADMIN_PANEL')}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                activeView === 'ADMIN_PANEL' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'
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
