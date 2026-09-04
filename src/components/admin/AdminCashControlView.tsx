import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

export const AdminCashControlView: React.FC = () => {
  const { transactions, addTransaction, bookings } = useApp();

  const [activeTab, setActiveTab] = useState<'RESUMO' | 'TRANSACOES' | 'SERVICOS'>('RESUMO');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Transaction Form State
  const [transType, setTransType] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [transDesc, setTransDesc] = useState('');
  const [transAmount, setTransAmount] = useState<number>(50);
  const [transMethod, setTransMethod] = useState<PaymentMethod>('PIX');
  const [transCategory, setTransCategory] = useState<any>('PRODUTOS_SUPRIMENTOS');

  // Calculations
  const safeTransactions = transactions || [];
  const safeBookings = bookings || [];

  const totalEntradas = safeTransactions
    .filter((t) => t.type === 'ENTRADA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSaidas = safeTransactions
    .filter((t) => t.type === 'SAIDA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  // Bookings breakdown
  const agendadosList = safeBookings.filter((b) => b.status === 'AGENDADO');
  const executadosList = safeBookings.filter((b) => b.status === 'EXECUTADO');
  const canceladosList = safeBookings.filter((b) => b.status === 'CANCELADO');

  const totalAgendadosPendente = agendadosList.reduce((acc, b) => acc + (b.servicePrice || 0), 0);
  const totalExecutadosRealizado = executadosList.reduce((acc, b) => acc + (b.servicePrice || 0), 0);

  // Payment methods breakdown
  const paymentTotals: Record<PaymentMethod, number> = {
    PIX: 0,
    DINHEIRO: 0,
    CARTAO_CREDITO: 0,
    CARTAO_DEBITO: 0,
    ASSINATURA_CLUBE: 0,
    PENDENTE: 0,
  };

  transactions.forEach((t) => {
    if (t.type === 'ENTRADA') {
      paymentTotals[t.paymentMethod] = (paymentTotals[t.paymentMethod] || 0) + t.amount;
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transDesc.trim()) return;

    addTransaction({
      type: transType,
      description: transDesc.trim(),
      amount: Number(transAmount),
      paymentMethod: transMethod,
      category: transCategory,
      createdByName: 'Lucas Hoffmann Barber',
    });

    setTransDesc('');
    setTransAmount(50);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Saldo Líquido em Caixa</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            R$ {saldoLiquido.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total disponível (Entradas - Saídas)</p>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Recebido (Entradas)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            R$ {totalEntradas.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Serviços executados + Assinaturas</p>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Despesas & Saídas</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono">
            R$ {totalSaidas.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Suprimentos, lâminas, energia</p>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Previsão de Agendados</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            R$ {totalAgendadosPendente.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{agendadosList.length} agendamentos a receber</p>
        </div>
      </div>

      {/* Action Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e293b] border border-slate-800 rounded-2xl p-4">
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('RESUMO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'RESUMO' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Formas de Pagamento
          </button>
          <button
            onClick={() => setActiveTab('SERVICOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'SERVICOS' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Status dos Serviços ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('TRANSACOES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'TRANSACOES' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fluxo de Caixa ({transactions.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento (Despesa / Entrada)</span>
        </button>
      </div>

      {/* TAB 1: RESUMO / FORMAS DE PAGAMENTO */}
      {activeTab === 'RESUMO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Receitas por Forma de Pagamento
            </h3>

            <div className="space-y-3">
              {[
                { label: 'PIX Instantâneo', key: 'PIX', color: 'text-emerald-400' },
                { label: 'Dinheiro Físico', key: 'DINHEIRO', color: 'text-amber-400' },
                { label: 'Cartão de Crédito', key: 'CARTAO_CREDITO', color: 'text-blue-400' },
                { label: 'Cartão de Débito', key: 'CARTAO_DEBITO', color: 'text-cyan-400' },
                { label: 'Assinaturas do Clube', key: 'ASSINATURA_CLUBE', color: 'text-purple-400' },
              ].map((item) => {
                const val = paymentTotals[item.key as PaymentMethod] || 0;
                const percentage = totalEntradas > 0 ? ((val / totalEntradas) * 100).toFixed(1) : 0;
                return (
                  <div key={item.key} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">{item.label}</span>
                      <span className={`font-mono font-bold ${item.color}`}>
                        R$ {val.toFixed(2).replace('.', ',')} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Balanço Operacional de Serviços
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400">Serviços Executados (Concluídos)</span>
                  <p className="text-xs text-slate-400 mt-0.5">{executadosList.length} clientes atendidos</p>
                </div>
                <span className="text-lg font-extrabold text-emerald-300 font-mono">
                  R$ {totalExecutadosRealizado.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400">Serviços Agendados (Futuros / A Realizar)</span>
                  <p className="text-xs text-slate-400 mt-0.5">{agendadosList.length} horários reservados</p>
                </div>
                <span className="text-lg font-extrabold text-amber-300 font-mono">
                  R$ {totalAgendadosPendente.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-400">Cancelamentos Registrados</span>
                  <p className="text-xs text-slate-400 mt-0.5">{canceladosList.length} horários desmarcados</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">Motivos catalogados</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVIÇOS AGENDADOS, EXECUTADOS, CANCELADOS COM MOTIVO */}
      {activeTab === 'SERVICOS' && (
        <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Histórico Detalhado: Agendados, Executados e Cancelados (com Motivo)
            </h3>
            <span className="text-xs text-slate-400">{bookings.length} registros</span>
          </div>

          <div className="space-y-2.5">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {b.status === 'EXECUTADO' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {b.status === 'AGENDADO' && <Clock className="w-4 h-4 text-amber-400" />}
                    {b.status === 'CANCELADO' && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{b.clientName}</span>
                      <span className="text-slate-400">• {b.serviceName}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                          b.status === 'EXECUTADO'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : b.status === 'AGENDADO'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      Data: {b.date.split('-').reverse().join('/')} às {b.time} • Barbeiro: {b.barberName}
                    </p>
                    {b.cancelReason && (
                      <p className="text-[11px] text-red-400 mt-1 font-medium">
                        Motivo do cancelamento: {b.cancelReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="font-mono font-bold text-white">
                    {b.servicePrice === 0 ? 'Assinatura VIP' : `R$ ${b.servicePrice.toFixed(2).replace('.', ',')}`}
                  </span>
                  <p className="text-[10px] text-slate-500 capitalize">
                    {b.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRANSAÇÕES / FLUXO DE CAIXA */}
      {activeTab === 'TRANSACOES' && (
        <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Lançamentos de Caixa (Livro Caixa)</h3>
            <span className="text-xs text-slate-400">{transactions.length} lançamentos</span>
          </div>

          <div className="space-y-2">
            {transactions.map((t) => {
              const isEntrada = t.type === 'ENTRADA';
              const formattedDate = new Date(t.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg font-bold text-xs ${
                        isEntrada ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isEntrada ? '+' : '-'}
                    </div>
                    <div>
                      <span className="font-bold text-white">{t.description}</span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>{t.paymentMethod.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="text-slate-500">Por: {t.createdByName}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-extrabold text-sm ${
                      isEntrada ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isEntrada ? '+' : '-'} R$ {t.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Novo Lançamento Manual no Caixa */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Novo Lançamento no Livro Caixa
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransType('ENTRADA')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    transType === 'ENTRADA' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Entrada (+ Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setTransType('SAIDA')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    transType === 'SAIDA' ? 'bg-red-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Saída (- Despesa)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta de Luz, Venda de Pomada, Reposição de Lâminas"
                  value={transDesc}
                  onChange={(e) => setTransDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={transAmount}
                    onChange={(e) => setTransAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                  <select
                    value={transMethod}
                    onChange={(e) => setTransMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão Débito</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Registrar no Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
