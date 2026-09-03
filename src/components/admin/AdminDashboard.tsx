import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminBookingsView } from './AdminBookingsView';
import { AdminAvailabilityView } from './AdminAvailabilityView';
import { AdminServicesView } from './AdminServicesView';
import { AdminCashControlView } from './AdminCashControlView';
import { AdminRevenueForecastView } from './AdminRevenueForecastView';
import { AdminClientsReportView } from './AdminClientsReportView';
import { AdminMetricsView } from './AdminMetricsView';
import { AdminSubscriptionsView } from './AdminSubscriptionsView';
import {
  Calendar,
  Clock,
  Scissors,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  ShieldCheck,
  Bell,
  Crown,
  Database,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

type AdminTab = 'BOOKINGS' | 'AVAILABILITY' | 'SERVICES' | 'SUBSCRIPTIONS' | 'CASH' | 'FORECAST' | 'CLIENTS' | 'METRICS';

export const AdminDashboard: React.FC = () => {
  const { currentUser, bookings, isFirebaseConnected, clearAllTestData } = useApp();
  const [currentTab, setCurrentTab] = useState<AdminTab>('BOOKINGS');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const pendingCount = (bookings || []).filter((b) => b.status === 'AGENDADO').length;

  const handleClear = async () => {
    setClearing(true);
    await clearAllTestData();
    setClearing(false);
    setShowClearConfirm(false);
    setClearedSuccess(true);
    setTimeout(() => setClearedSuccess(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Panel Header */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#1e293b] to-[#0f172a] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Painel de Controle do Administrador
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {isFirebaseConnected ? 'Firebase Firestore Conectado' : 'Modo Offline'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
                Gestão da Barbearia Belchior
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Olá, {currentUser?.name}! Gerencie agendamentos, caixa, métricas e previsões com facilidade.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-300">
                <strong className="text-white font-mono">{pendingCount}</strong> agendamento(s) aguardando
              </span>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-semibold transition flex items-center gap-2"
              title="Limpar todos os dados de agendamentos e transações de teste"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Dados de Teste</span>
            </button>
          </div>
        </div>

        {clearedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dados de teste limpos com sucesso! O banco de dados está pronto para produção.</span>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-2xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Limpar todos os dados de teste?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Esta ação apagará todos os agendamentos, lançamentos de caixa e ausências fictícias do Firestore e do armazenamento local. Os serviços cadastrados e planos serão mantidos.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={clearing}
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                disabled={clearing}
                onClick={handleClear}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-600/20 flex items-center gap-2"
              >
                {clearing ? 'Limpando...' : 'Sim, Limpar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'BOOKINGS', label: 'Horários Reservados', icon: Calendar, badge: pendingCount },
          { id: 'AVAILABILITY', label: 'Disponibilidade & Ausências', icon: Clock },
          { id: 'SERVICES', label: 'Serviços & Preços', icon: Scissors },
          { id: 'SUBSCRIPTIONS', label: 'Clubes & InfinitePay', icon: Crown },
          { id: 'CASH', label: 'Controle de Caixa', icon: DollarSign },
          { id: 'FORECAST', label: 'Previsão de Receita', icon: TrendingUp },
          { id: 'CLIENTS', label: 'Relatório de Clientes', icon: Users },
          { id: 'METRICS', label: 'Métricas & Picos', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-900/80 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {currentTab === 'BOOKINGS' && <AdminBookingsView />}
        {currentTab === 'AVAILABILITY' && <AdminAvailabilityView />}
        {currentTab === 'SERVICES' && <AdminServicesView />}
        {currentTab === 'SUBSCRIPTIONS' && <AdminSubscriptionsView />}
        {currentTab === 'CASH' && <AdminCashControlView />}
        {currentTab === 'FORECAST' && <AdminRevenueForecastView />}
        {currentTab === 'CLIENTS' && <AdminClientsReportView />}
        {currentTab === 'METRICS' && <AdminMetricsView />}
      </div>
    </div>
  );
};
