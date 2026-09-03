import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Send, X, Calendar, Clock, User, Scissors } from 'lucide-react';

export const AdminReminderModal: React.FC = () => {
  const { activeAdminReminderBooking, dismissAdminReminder, sendWhatsAppReminder } = useApp();

  if (!activeAdminReminderBooking) return null;

  const booking = activeAdminReminderBooking;
  const formattedDate = booking.date.split('-').reverse().join('/');

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 bg-[#1e293b] border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-500/20 animate-in slide-in-from-bottom-5 text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-400">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 animate-bounce">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">Lembrete de Agendamento Próximo</h4>
            <p className="text-[11px] text-amber-300/90 font-medium">Você tem um cliente para atender em breve!</p>
          </div>
        </div>

        <button
          onClick={dismissAdminReminder}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            Cliente:
          </span>
          <span className="font-bold text-white">{booking.clientName}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            Serviço:
          </span>
          <span className="font-semibold text-slate-200">{booking.serviceName}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Horário:
          </span>
          <span className="font-mono font-bold text-amber-300">
            {formattedDate} às {booking.time}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-3">
        Deseja enviar a mensagem pré-formatada de confirmação no WhatsApp do cliente agora?
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={dismissAdminReminder}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
        >
          Lembrar Mais Tarde
        </button>

        <button
          onClick={() => sendWhatsAppReminder(booking)}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
