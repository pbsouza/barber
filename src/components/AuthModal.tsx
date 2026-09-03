import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, Phone, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    login,
    pendingBooking,
    createBookingBatch,
    currentUser,
    setActiveView,
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Informe seu e-mail');
      return;
    }

    if (mode === 'REGISTER' && !name.trim()) {
      setErrorMsg('Informe seu nome completo');
      return;
    }

    const success = login(email, undefined, name || undefined, phone || undefined);
    if (success) {
      // If there was a pending booking, conclude it
      // login sets currentUser inside context, but for immediate batch we can get user object
      closeAuthModal();
    }
  };

  const handleQuickLogin = (demoEmail: string, demoRole: 'ADMIN' | 'CLIENT') => {
    login(demoEmail, demoRole);
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Cabinet_Grotesk',sans-serif]">
            {mode === 'LOGIN' ? 'Acesse sua Conta' : 'Criar Cadastro Rápido'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {pendingBooking
              ? 'Faça login ou cadastre-se para confirmar seu agendamento na barbearia'
              : 'Gerencie seus horários, clube de assinatura e histórico'}
          </p>
        </div>

        {/* Pending Booking Notice */}
        {pendingBooking && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
              {pendingBooking.datesAndTimes.length}x
            </div>
            <div className="text-xs">
              <span className="font-semibold text-amber-300">Reserva em andamento!</span>
              <p className="text-slate-400">
                Horário reservado: {pendingBooking.datesAndTimes[0]?.time} em{' '}
                {pendingBooking.datesAndTimes[0]?.date.split('-').reverse().join('/')}
              </p>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'LOGIN' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('REGISTER')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'REGISTER' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Novo Cadastro
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              O sistema detecta automaticamente se sua conta é de Administrador ou Cliente.
            </p>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">WhatsApp / Celular</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Senha</label>
              {mode === 'LOGIN' && (
                <span className="text-[11px] text-amber-400 hover:underline cursor-pointer">Esqueceu?</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
          >
            <span>{mode === 'LOGIN' ? 'Entrar no Sistema' : 'Concluir Cadastro'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acesso Demo Imediato (1 Clique)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('belchior87@gmail.com', 'ADMIN')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition group"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-300 truncate">ADM Barbearia</p>
                <p className="text-[10px] text-slate-400 truncate">Detecta Admin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('lucas.silveira@email.com', 'CLIENT')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition group"
            >
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">Cliente VIP</p>
                <p className="text-[10px] text-slate-400 truncate">Com Assinatura</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
