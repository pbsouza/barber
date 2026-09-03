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
} from 'lucide-react';

type AdminTab = 'BOOKINGS' | 'AVAILABILITY' | 'SERVICES' | 'SUBSCRIPTIONS' | 'CASH' | 'FORECAST' | 'CLIENTS' | 'METRICS';

export const AdminDashboard: React.FC = () => {
  const { currentUser, bookings } = useApp();
  const [currentTab, setCurrentTab] = useState<AdminTab>('BOOKINGS');

  const pendingCount = (bookings || []).filter((b) => b.status === 'AGENDADO').length;

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
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Painel de Controle do Administrador
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

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-300">
                <strong className="text-white font-mono">{pendingCount}</strong> agendamento(s) aguardando
              </span>
            </div>
          </div>
        </div>
      </div>

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
