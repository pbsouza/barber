import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, Calendar, Clock, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

export const AdminMetricsView: React.FC = () => {
  const { bookings } = useApp();

  // 1. Day of Week distribution
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayCounts: Record<string, number> = {
    Segunda: 0,
    Terça: 0,
    Quarta: 0,
    Quinta: 0,
    Sexta: 0,
    Sábado: 0,
    Domingo: 0,
  };

  // 2. Hour distribution
  const hourCounts: Record<string, number> = {};
  for (let h = 9; h <= 19; h++) {
    const formattedHour = `${String(h).padStart(2, '0')}:00`;
    hourCounts[formattedHour] = 0;
  }

  // 3. Cancellations distribution and reasons
  const safeBookings = bookings || [];
  let totalBookings = safeBookings.length;
  let totalCancelled = 0;
  const cancelReasonsCount: Record<string, number> = {};

  safeBookings.forEach((b) => {
    // Day of week
    const dateObj = new Date(`${b.date}T12:00:00`);
    const dayName = dayNames[dateObj.getDay()];
    if (dayCounts[dayName] !== undefined) {
      dayCounts[dayName] += 1;
    }

    // Hour
    const hourPrefix = b.time ? b.time.split(':')[0] + ':00' : '10:00';
    if (hourCounts[hourPrefix] !== undefined) {
      hourCounts[hourPrefix] += 1;
    } else {
      hourCounts[hourPrefix] = 1;
    }

    // Cancellations
    if (b.status === 'CANCELADO') {
      totalCancelled += 1;
      const reason = b.cancelReason || 'Sem motivo especificado';
      cancelReasonsCount[reason] = (cancelReasonsCount[reason] || 0) + 1;
    }
  });

  const cancellationRate = totalBookings > 0 ? ((totalCancelled / totalBookings) * 100).toFixed(1) : '0';

  const maxDayCount = Math.max(...Object.values(dayCounts), 1);
  const maxHourCount = Math.max(...Object.values(hourCounts), 1);

  return (
    <div className="space-y-8 text-slate-100">
      {/* Top Banner */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Métricas & Comportamento de Agenda
            </div>
            <h3 className="text-xl font-extrabold text-white font-['Cabinet_Grotesk',sans-serif]">
              Picos de Marcação & Análise de Cancelamentos
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Descubra os dias de maior movimento, os horários nobres de atendimento e as causas frequentes de cancelamentos.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Taxa de Cancelamento</span>
              <div className="text-xl font-extrabold text-red-400 font-mono mt-0.5">{cancellationRate}%</div>
              <span className="text-[10px] text-slate-500">{totalCancelled} de {totalBookings} reservas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Days of week & Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Days of Week Peak */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Pico de Agendamentos por Dia da Semana
          </h4>
          <p className="text-xs text-slate-400 mb-6">Volume total de marcações distribuído por dia:</p>

          <div className="space-y-3">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => {
              const count = dayCounts[day] || 0;
              const pct = Math.round((count / maxDayCount) * 100);
              const isPeak = count === maxDayCount && count > 0;

              return (
                <div key={day} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-semibold ${isPeak ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                      {day} {isPeak && '🔥 (Dia de Maior Pico)'}
                    </span>
                    <span className="font-mono text-slate-400 font-bold">{count} marcação(ões)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hours Peak */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Horários Mais Procurados (Faixa Horária)
          </h4>
          <p className="text-xs text-slate-400 mb-6">Preferência de horários pelos clientes:</p>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(hourCounts).map(([hour, count]) => {
              const pct = Math.round((count / maxHourCount) * 100);
              const isPeak = count === maxHourCount && count > 0;

              return (
                <div
                  key={hour}
                  className={`p-3 rounded-xl border transition ${
                    isPeak
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-mono font-bold text-white">{hour}</span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">{count} agend.</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPeak ? 'bg-amber-500' : 'bg-slate-600'}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 15 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cancellations Analysis & Reasons Ranking */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          Motivos e Análise de Cancelamentos
        </h4>
        <p className="text-xs text-slate-400 mb-6">
          Registro das principais justificativas que levaram clientes a desmarcarem seus horários:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {Object.entries(cancelReasonsCount).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Nenhum cancelamento registrado.</p>
            ) : (
              Object.entries(cancelReasonsCount)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count], idx) => {
                  const pct = totalCancelled > 0 ? Math.round((count / totalCancelled) * 100) : 0;
                  return (
                    <div key={reason} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between items-start text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">
                          #{idx + 1} {reason}
                        </span>
                        <span className="font-mono font-bold text-red-400">
                          {count}x ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Insights para Reduzir Faltas e Cancelamentos
              </h5>
              <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>Envio de Lembrete no WhatsApp:</strong> O envio prévio de 2 a 4 horas antes do atendimento
                    reduz o no-show em até 70%.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>Plano de Assinatura:</strong> Clientes assinantes comparecem 3x mais e quase nunca cancelam
                    sem reagendar imediatamente.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>Sextas e Sábados:</strong> Como concentram o maior pico, reserve intervalos menores para
                    maximizar a capacidade de atendimento.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
