import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp, Calendar, Crown, Clock, Sparkles, DollarSign } from 'lucide-react';

export const AdminRevenueForecastView: React.FC = () => {
  const { getRevenueForecasts, bookings, users, plans } = useApp();

  const forecasts = getRevenueForecasts() || [];
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Mês');

  const activeForecast = forecasts.find((f) => f.period === selectedPeriod) || forecasts[1] || forecasts[0] || {
    period: 'Mês',
    projectedBookingsCount: 0,
    bookingsRevenue: 0,
    subscriptionRevenue: 0,
    totalProjectedRevenue: 0,
  };

  // Active subscribers count
  const activeSubscribers = (users || []).filter((u) => Boolean(u.subscriptionId));
  const monthlySubscriptionYield = activeSubscribers.reduce((sum, u) => {
    const plan = (plans || []).find((p) => p.id === u.subscriptionId);
    return sum + (plan?.monthlyPrice || 0);
  }, 0);

  // Maximum value for proportional bar chart
  const maxRevenue = Math.max(...forecasts.map((f) => f.totalProjectedRevenue), 1000);

  return (
    <div className="space-y-8 text-slate-100">
      {/* Top Banner */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Inteligência Financeira Preditiva
            </div>
            <h3 className="text-xl font-extrabold text-white font-['Cabinet_Grotesk',sans-serif]">
              Previsão de Receita Futura
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Projeções calculadas com base nos agendamentos futuros marcados, recorrências semanais/mensais e na
              receita recorrente das assinaturas ativas do clube.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[11px] text-slate-400">Receita Recorrente Mensal (MRR):</span>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                R$ {monthlySubscriptionYield.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-[10px] text-slate-500">{activeSubscribers.length} assinante(s) ativos no clube</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selection Cards (Semana, Mês, Trimestre, Semestre, Ano) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {forecasts.map((f) => {
          const isSelected = selectedPeriod === f.period;
          return (
            <button
              key={f.period}
              onClick={() => setSelectedPeriod(f.period)}
              className={`p-4 rounded-2xl border text-left transition relative ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 scale-102'
                  : 'bg-[#1e293b] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.period}</span>
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-extrabold text-white font-mono mt-1">
                R$ {f.totalProjectedRevenue.toFixed(0)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{f.projectedBookingsCount} agendamentos previstos</p>
            </button>
          );
        })}
      </div>

      {/* Detailed Breakdown for Selected Period */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Visual Bar Comparison */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Comparativo de Escala de Receita Prevista
          </h4>

          <div className="space-y-4 pt-2">
            {forecasts.map((f) => {
              const widthPct = Math.max(10, Math.round((f.totalProjectedRevenue / maxRevenue) * 100));
              const isSelected = selectedPeriod === f.period;

              return (
                <div
                  key={f.period}
                  onClick={() => setSelectedPeriod(f.period)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/50'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-200">{f.period}</span>
                    <span className="font-mono font-extrabold text-amber-400 text-sm">
                      R$ {f.totalProjectedRevenue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Stacked Progress Bar: Bookings + Subscriptions */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{
                        width: `${
                          f.totalProjectedRevenue > 0
                            ? (f.bookingsRevenue / f.totalProjectedRevenue) * widthPct
                            : 0
                        }%`,
                      }}
                      title={`Agendamentos: R$ ${f.bookingsRevenue.toFixed(2)}`}
                    />
                    <div
                      className="bg-purple-500 h-full transition-all duration-500"
                      style={{
                        width: `${
                          f.totalProjectedRevenue > 0
                            ? (f.subscriptionRevenue / f.totalProjectedRevenue) * widthPct
                            : 0
                        }%`,
                      }}
                      title={`Assinaturas: R$ ${f.subscriptionRevenue.toFixed(2)}`}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                    <span>Agendamentos: R$ {f.bookingsRevenue.toFixed(0)}</span>
                    <span>Clube VIP: R$ {f.subscriptionRevenue.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span>Agendamentos Futuros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>Assinaturas do Clube</span>
            </div>
          </div>
        </div>

        {/* Right Col: Deep Dive Card */}
        <div className="bg-[#1e293b] border border-amber-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Detalhamento • {activeForecast.period}
            </span>
            <h4 className="text-2xl font-extrabold text-white mt-1 font-mono">
              R$ {activeForecast.totalProjectedRevenue.toFixed(2).replace('.', ',')}
            </h4>
            <p className="text-xs text-slate-400 mt-1">Previsão bruta estimada para o período.</p>

            <div className="mt-6 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>Horários Confirmados:</span>
                  <span className="text-white font-mono">{activeForecast.projectedBookingsCount} reservas</span>
                </div>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>Receita direta de serviços:</span>
                  <span className="text-amber-300 font-mono font-bold">
                    R$ {activeForecast.bookingsRevenue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>Assinaturas VIP:</span>
                  <span className="text-white font-mono">{activeSubscribers.length} ativos</span>
                </div>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>Receita recorrente garantida:</span>
                  <span className="text-purple-300 font-mono font-bold">
                    R$ {activeForecast.subscriptionRevenue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Dica: Promover o Clube de Assinatura para clientes que cortam a cada 15 dias estabiliza o fluxo de caixa
              e aumenta a previsibilidade semestral e anual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
