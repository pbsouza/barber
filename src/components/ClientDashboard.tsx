import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Clock,
  Crown,
  Plus,
  AlertCircle,
  XCircle,
  Scissors,
  CheckCircle,
  Check,
  HelpCircle,
} from 'lucide-react';
import { getPlanBenefits } from '../types';

export const ClientDashboard: React.FC = () => {
  const {
    currentUser,
    bookings,
    plans,
    updateBookingStatus,
    openSubscriptionModal,
    setActiveView,
    cancelUserSubscription,
  } = useApp();

  const [selectedTab, setSelectedTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Imprevisto de última hora');
  const [customReason, setCustomReason] = useState<string>('');

  if (!currentUser) return null;

  const clientBookings = (bookings || []).filter((b) => b.clientId === currentUser.id);

  const upcomingBookings = clientBookings.filter((b) => b.status === 'AGENDADO');
  const historyBookings = clientBookings.filter((b) => b.status !== 'AGENDADO');

  const activePlan = plans.find((p) => p.id === currentUser.subscriptionId);

  const handleConfirmCancel = () => {
    if (!cancellingBookingId) return;
    const finalReason = cancelReason === 'Outro' ? customReason || 'Não informado' : cancelReason;
    updateBookingStatus(cancellingBookingId, 'CANCELADO', undefined, finalReason);
    setCancellingBookingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Top Profile & Subscription Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client Welcome Card */}
        <div className="md:col-span-2 bg-[#1e293b] border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center font-extrabold text-xl text-slate-950 shadow-lg shadow-amber-500/20">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Olá, {currentUser.name}!
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">{currentUser.email} • {currentUser.phone}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {clientBookings.length} agendamento(s) no total
                  </span>
                  {activePlan && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {activePlan.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveView('BOOKING')}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Subscription Club Status Card */}
        <div className="bg-[#1e293b] border border-amber-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Crown className="w-4 h-4" />
                Clube de Assinatura
              </span>
              {activePlan && (
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              )}
            </div>

            {activePlan ? (
              <div>
                <h3 className="text-base font-bold text-white">{activePlan.name}</h3>
                <div className="mt-2 space-y-1">
                  {getPlanBenefits(activePlan).map((b, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-300 mt-2.5">
                  R$ {activePlan.monthlyPrice.toFixed(2).replace('.', ',')}/mês
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-white">Você ainda não é assinante</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Economize até 40% com cortes e barbas ilimitadas todos os meses.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
            {activePlan ? (
              <button
                onClick={() => {
                  if (confirm('Deseja realmente cancelar sua assinatura do clube?')) {
                    cancelUserSubscription(currentUser.id);
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-red-400 transition"
              >
                Cancelar Assinatura
              </button>
            ) : (
              <button
                onClick={openSubscriptionModal}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition text-center"
              >
                Assinar Agora
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTab('UPCOMING')}
              className={`pb-2 text-sm font-bold transition flex items-center gap-2 border-b-2 -mb-4 ${
                selectedTab === 'UPCOMING'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Próximos Agendamentos ({upcomingBookings.length})</span>
            </button>

            <button
              onClick={() => setSelectedTab('HISTORY')}
              className={`pb-2 text-sm font-bold transition flex items-center gap-2 border-b-2 -mb-4 ${
                selectedTab === 'HISTORY'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Histórico de Atendimentos ({historyBookings.length})</span>
            </button>
          </div>
        </div>

        {/* UPCOMING TAB */}
        {selectedTab === 'UPCOMING' && (
          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum agendamento pendente</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Você não possui nenhum horário marcado no momento. Que tal dar aquele trato no visual?
                </p>
                <button
                  onClick={() => setActiveView('BOOKING')}
                  className="mt-4 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agendar Horário Agora</span>
                </button>
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{b.serviceName}</h4>
                        {b.recurrenceType && b.recurrenceType !== 'SINGLE' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Recorrente ({b.recurrenceType})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="font-mono text-amber-300 font-semibold">
                          📅 {b.date.split('-').reverse().join('/')} às {b.time}
                        </span>
                        <span>•</span>
                        <span>Barbeiro: {b.barberName}</span>
                      </div>
                      {b.notes && <p className="text-[11px] text-slate-500 mt-1">Obs: {b.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-slate-200">
                        {b.servicePrice === 0 ? 'Incluso no Plano' : `R$ ${b.servicePrice.toFixed(2).replace('.', ',')}`}
                      </span>
                      <p className="text-[10px] text-slate-500 capitalize">{b.paymentMethod.replace('_', ' ')}</p>
                    </div>

                    <button
                      onClick={() => setCancellingBookingId(b.id)}
                      className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {selectedTab === 'HISTORY' && (
          <div className="space-y-3">
            {historyBookings.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Nenhum histórico de agendamentos executados ou cancelados.
              </div>
            ) : (
              historyBookings.map((b) => {
                const isExecuted = b.status === 'EXECUTADO';
                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{b.serviceName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isExecuted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isExecuted ? '✓ Atendido' : '✕ Cancelado'}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        {b.date.split('-').reverse().join('/')} às {b.time} • Barbeiro: {b.barberName}
                      </p>
                      {b.cancelReason && (
                        <p className="text-[11px] text-red-400/80 mt-1">Motivo: {b.cancelReason}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-300">
                        {b.servicePrice === 0 ? 'Assinatura VIP' : `R$ ${b.servicePrice.toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Confirmar Cancelamento do Horário
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Por favor, selecione o motivo do cancelamento para registrarmos no controle da barbearia:
            </p>

            <div className="space-y-2 mb-4">
              {[
                'Imprevisto de última hora',
                'Horário de trabalho / compromisso',
                'Problema de saúde',
                'Quero reagendar para outro dia',
                'Outro',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {cancelReason === 'Outro' && (
                <input
                  type="text"
                  placeholder="Especifique o motivo..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCancellingBookingId(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
