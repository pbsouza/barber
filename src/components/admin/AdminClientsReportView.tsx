import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientReportItem } from '../../types';
import { Users, Search, Crown, Send, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const AdminClientsReportView: React.FC = () => {
  const { getClientReports } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'EM_RISCO' | 'INATIVO'>('TODOS');

  const clients = getClientReports() || [];

  const totalAtivos = clients.filter((c) => c.status === 'ATIVO').length;
  const totalEmRisco = clients.filter((c) => c.status === 'EM_RISCO').length;
  const totalInativos = clients.filter((c) => c.status === 'INATIVO').length;

  const filteredClients = clients.filter((c) => {
    if (statusFilter !== 'TODOS' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleWhatsAppReactivate = (client: ClientReportItem) => {
    const cleanPhone = client.phone.replace(/\D/g, '');
    const text = `💈 *Olá, ${client.name}! Tudo bem?*\n\nSentimos sua falta aqui na *Barbearia Belchior Master*!\nQue tal renovar o visual e alinhar a barba essa semana?\n\nPreparamos uma cortesia especial: no seu próximo agendamento você ganha uma cerveja gelada ou café especial!\n\n📅 Agende seu horário pelo nosso app ou responda aqui para escolhermos o melhor horário para você!\n\n_Te esperamos!_`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('ATIVO')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'ATIVO'
              ? 'bg-emerald-500/15 border-emerald-500 shadow'
              : 'bg-[#1e293b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400">Clientes Ativos</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalAtivos}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Agendaram nos últimos 30 dias</p>
        </div>

        <div
          onClick={() => setStatusFilter('EM_RISCO')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'EM_RISCO'
              ? 'bg-amber-500/15 border-amber-500 shadow'
              : 'bg-[#1e293b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-400">Em Risco de Perda</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalEmRisco}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Sem agendamentos entre 31 e 60 dias</p>
        </div>

        <div
          onClick={() => setStatusFilter('INATIVO')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'INATIVO'
              ? 'bg-red-500/15 border-red-500 shadow'
              : 'bg-[#1e293b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-red-400">Clientes Inativos</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalInativos}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Mais de 60 dias sem visitar a barbearia</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'TODOS'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('ATIVO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'ATIVO'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setStatusFilter('EM_RISCO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'EM_RISCO'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Em Risco
          </button>
          <button
            onClick={() => setStatusFilter('INATIVO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'INATIVO'
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Inativos
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Relatório da Base de Clientes ({filteredClients.length})
          </h3>
        </div>

        <div className="space-y-3">
          {filteredClients.map((client) => {
            const isAtivo = client.status === 'ATIVO';
            const isEmRisco = client.status === 'EM_RISCO';

            return (
              <div
                key={client.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{client.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAtivo
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isEmRisco
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {client.status.replace('_', ' ')}
                      </span>

                      {client.hasSubscription && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Assinante VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {client.phone} • {client.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <div>
                    <span className="block text-[11px] text-slate-500">Última Visita</span>
                    <span className="font-semibold text-slate-200">
                      {client.lastBookingDate ? client.lastBookingDate.split('-').reverse().join('/') : 'Nunca'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500">Agendamentos</span>
                    <span className="font-semibold text-slate-200">
                      {client.completedBookings} concluídos / {client.cancelledBookings} cancelados
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500">Total Gasto (LTV)</span>
                    <span className="font-mono font-bold text-amber-400">
                      R$ {client.totalSpent.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleWhatsAppReactivate(client)}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAtivo ? 'Falar no WhatsApp' : 'Mensagem de Reativação'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
