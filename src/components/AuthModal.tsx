import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { X, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    login,
    pendingBooking,
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
      closeAuthModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#181D21] border border-[#2E3740] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-[#F6F2EA]">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#A6B2BD] hover:text-white hover:bg-[#262E35] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo variant="icon" />
          </div>
          <h2 className="text-2xl font-black text-[#F6F2EA] font-['Cabinet_Grotesk',sans-serif] uppercase tracking-wide">
            {mode === 'LOGIN' ? 'Acessar Conta' : 'Criar Cadastro'}
          </h2>
          <p className="text-xs text-[#A6B2BD] mt-1">
            {pendingBooking
              ? 'Faça login ou cadastre-se para confirmar seu agendamento na Lucas Hoffmann Barber'
              : 'Gerencie seus horários, assinaturas e histórico exclusivo'}
          </p>
        </div>

        {/* Pending Booking Notice */}
        {pendingBooking && (
          <div className="mb-5 p-3 rounded-2xl bg-[#CBA358]/10 border border-[#CBA358]/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#CBA358]/20 text-[#CBA358] font-bold text-xs">
              {pendingBooking.datesAndTimes.length}x
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#E5C158]">Reserva em andamento!</span>
              <p className="text-[#A6B2BD]">
                Horário reservado: {pendingBooking.datesAndTimes[0]?.time} em{' '}
                {pendingBooking.datesAndTimes[0]?.date.split('-').reverse().join('/')}
              </p>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex rounded-2xl bg-[#13171A] p-1 border border-[#2C343D] mb-5">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'LOGIN'
                ? 'bg-gradient-to-r from-[#CBA358] to-[#B88C3E] text-[#14181B] shadow-md shadow-[#CBA358]/20'
                : 'text-[#A6B2BD] hover:text-[#F6F2EA]'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('REGISTER')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'REGISTER'
                ? 'bg-gradient-to-r from-[#CBA358] to-[#B88C3E] text-[#14181B] shadow-md shadow-[#CBA358]/20'
                : 'text-[#A6B2BD] hover:text-[#F6F2EA]'
            }`}
          >
            Novo Cadastro
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-[#C5CCD3] mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8895A3] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-2xl py-3 pl-10 pr-3 text-sm text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#C5CCD3] mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8895A3] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#13171A] border border-[#2C343D] rounded-2xl py-3 pl-10 pr-3 text-sm text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358] transition"
              />
            </div>
            <p className="text-[10px] text-[#8895A3] mt-1">
              O sistema detecta automaticamente se sua conta é de Administrador ou Cliente.
            </p>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-[#C5CCD3] mb-1.5">WhatsApp / Celular</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8895A3] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-2xl py-3 pl-10 pr-3 text-sm text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358] transition"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-[#C5CCD3]">Senha</label>
              {mode === 'LOGIN' && (
                <span className="text-[11px] text-[#CBA358] hover:underline cursor-pointer font-semibold">Esqueceu?</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8895A3] absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#13171A] border border-[#2C343D] rounded-2xl py-3 pl-10 pr-3 text-sm text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#CBA358] to-[#B88C3E] hover:from-[#DFB86C] hover:to-[#CBA358] text-[#14181B] font-black text-sm uppercase tracking-wider transition shadow-lg shadow-[#CBA358]/25 flex items-center justify-center gap-2 mt-3"
          >
            <span>{mode === 'LOGIN' ? 'Entrar no Sistema' : 'Concluir Cadastro'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
