import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus, PaymentMethod } from '../../types';
import {
  Calendar,
  Clock,
  Send,
  Copy,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  CreditCard,
  User,
  Scissors,
  Check,
  AlertCircle,
} from 'lucide-react';

export const AdminBookingsView: React.FC = () => {
  const { bookings, updateBookingStatus, sendWhatsAppReminder } = useApp();

  const [filterDate, setFilterDate] = useState<'HOJE' | 'AMANHA' | 'SEMANA' | 'TODOS'>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Execution modal state
  const [executingBooking, setExecutingBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');

  // Cancel modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Cliente solicitou cancelamento');
  const [customReason, setCustomReason] = useState<string>('');

  const todayStr = '2026-09-02';
  const tomorrowStr = '2026-09-03';

  // Filter bookings
  const safeBookings = bookings || [];
  const filteredBookings = safeBookings.filter((b) => {
    // Date filter
    if (filterDate === 'HOJE' && b.date !== todayStr) return false;
    if (filterDate === 'AMANHA' && b.date !== tomorrowStr) return false;
    if (filterDate === 'SEMANA') {
      const bTime = new Date(b.date).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = (bTime - todayTime) / (1000 * 3600 * 24);
      if (diffDays < 0 || diffDays > 7) return false;
    }

    // Status filter
    if (filterStatus !== 'TODOS' && b.status !== filterStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        b.clientName.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        b.clientPhone.includes(q);
      if (!matches) return false;
    }

    return true;
  });

  // Sort by date and time
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dtA = `${a.date}T${a.time}`;
    const dtB = `${b.date}T${b.time}`;
    return dtA.localeCompare(dtB);
  });

  // Copy pre-formatted message
  const handleCopyMessage = (b: Booking) => {
    const formattedDate = b.date.split('-').reverse().join('/');
    const text = `💈 *Lembrete Lucas Hoffmann Barber*\n\nOlá, *${b.clientName}*! Seu horário para *${b.serviceName}* com *${b.barberName}* está agendado para:\n\n📅 Data: *${formattedDate}*\n⏰ Horário: *${b.time}*\n📍 Endereço: *Rua das Palmeiras, 450 - Centro*\n\nPor favor, chegue com 5 minutos de antecedência. Caso precise reagendar, nos avise aqui pelo WhatsApp!\n\n_Aguardamos você!_`;

    navigator.clipboard.writeText(text);
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleConfirmExecution = () => {
    if (!executingBooking) return;
    updateBookingStatus(executingBooking.id, 'EXECUTADO', paymentMethod);
    setExecutingBooking(null);
  };

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    const finalReason = cancelReason === 'Outro' ? customReason || 'Não informado' : cancelReason;
    updateBookingStatus(cancellingBooking.id, 'CANCELADO', undefined, finalReason);
    setCancellingBooking(null);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Filter Bar */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'HOJE', label: 'Hoje' },
            { id: 'AMANHA', label: 'Amanhã' },
            { id: 'SEMANA', label: 'Esta Semana' },
            { id: 'TODOS', label: 'Todos' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterDate(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterDate === item.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="AGENDADO">Agendados (Aguardando)</option>
            <option value="EXECUTADO">Executados (Concluídos)</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Bookings Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Exibindo {sortedBookings.length} agendamento(s)</span>
        <span className="text-[11px] text-slate-500">
          Horários atualizados em tempo real com controle de ausências
        </span>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {sortedBookings.length === 0 ? (
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">Nenhum agendamento encontrado</h4>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar seus filtros de data ou termo de busca.</p>
          </div>
        ) : (
          sortedBookings.map((b) => {
            const isAgendado = b.status === 'AGENDADO';
            const isExecuted = b.status === 'EXECUTADO';
            const isCancelled = b.status === 'CANCELADO';

            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition ${
                  isAgendado
                    ? 'bg-[#1e293b] border-slate-800 hover:border-slate-700 shadow-md'
                    : isExecuted
                    ? 'bg-slate-900/50 border-slate-800/80 opacity-90'
                    : 'bg-red-950/20 border-red-900/30 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Client & Service info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                        isAgendado
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : isExecuted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      <Scissors className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{b.clientName}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isAgendado
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isExecuted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {b.status}
                        </span>

                        {b.recurrenceType && b.recurrenceType !== 'SINGLE' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            Recorrente ({b.recurrenceType})
                          </span>
                        )}

                        {b.reminderSent && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                            ✓ Lembrete Enviado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="text-slate-200 font-semibold">{b.serviceName}</span>
                        <span>•</span>
                        <span>{b.clientPhone}</span>
                        <span>•</span>
                        <span>Barbeiro: {b.barberName}</span>
                      </div>

                      {b.cancelReason && (
                        <div className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Motivo do cancelamento: {b.cancelReason}</span>
                        </div>
                      )}

                      {b.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">Obs: {b.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Date & Price */}
                  <div className="flex items-center gap-6 lg:text-right shrink-0">
                    <div>
                      <div className="flex items-center lg:justify-end gap-1.5 text-xs font-mono font-bold text-amber-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{b.date.split('-').reverse().join('/')}</span>
                        <Clock className="w-3.5 h-3.5 text-amber-400 ml-1" />
                        <span>{b.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{b.durationMinutes} minutos</p>
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-white">
                        {b.servicePrice === 0 ? 'Assinatura VIP' : `R$ ${b.servicePrice.toFixed(2).replace('.', ',')}`}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {b.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                    {/* Send WhatsApp Preformatted Reminder */}
                    <button
                      onClick={() => sendWhatsAppReminder(b)}
                      title="Abrir WhatsApp com mensagem pré-formatada"
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Copy Pre-formatted message */}
                    <button
                      onClick={() => handleCopyMessage(b)}
                      title="Copiar texto pré-formatado do lembrete"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    >
                      {copiedId === b.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isAgendado && (
                      <>
                        {/* Conclude and register payment */}
                        <button
                          onClick={() => {
                            setExecutingBooking(b);
                            setPaymentMethod(b.paymentMethod !== 'PENDENTE' ? b.paymentMethod : 'PIX');
                          }}
                          className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={() => setCancellingBooking(b)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Conclude Booking & Choose Payment Method */}
      {executingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Concluir Atendimento e Lançar no Caixa
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cliente: <span className="font-bold text-white">{executingBooking.clientName}</span> •{' '}
              {executingBooking.serviceName}
            </p>

            <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">Valor do Serviço:</span>
              <span className="text-lg font-extrabold text-amber-400">
                {executingBooking.servicePrice === 0
                  ? 'Assinatura VIP (R$ 0,00)'
                  : `R$ ${executingBooking.servicePrice.toFixed(2).replace('.', ',')}`}
              </span>
            </div>

            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              Forma de Pagamento Utilizada:
            </label>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { id: 'PIX', label: 'PIX Instantâneo' },
                { id: 'DINHEIRO', label: 'Dinheiro Físico' },
                { id: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
                { id: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
                { id: 'ASSINATURA_CLUBE', label: 'Clube de Assinatura' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                    paymentMethod === opt.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExecutingBooking(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmExecution}
                className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
              >
                Confirmar Atendimento & Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Booking With Reason Registration */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Cancelar Horário do Cliente
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cliente: {cancellingBooking.clientName} • {cancellingBooking.date.split('-').reverse().join('/')} às{' '}
              {cancellingBooking.time}
            </p>

            <label className="block text-xs font-bold text-slate-300 mb-2">
              Motivo do Cancelamento (necessário para as métricas da barbearia):
            </label>

            <div className="space-y-2 mb-4">
              {[
                'Cliente avisou com antecedência',
                'Imprevisto no trabalho de última hora',
                'Problema de saúde ou sintomas gripais',
                'Cliente não compareceu (No-Show)',
                'Reagendamento para outra data',
                'Outro',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="radio"
                    name="admin_cancel_reason"
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
                  placeholder="Especifique o motivo detalhado..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancellingBooking(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20"
              >
                Registrar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
