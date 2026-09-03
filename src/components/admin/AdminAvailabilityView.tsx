import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Plus, Trash2, ShieldAlert, Check } from 'lucide-react';

export const AdminAvailabilityView: React.FC = () => {
  const { availabilityConfig, updateAvailabilityConfig, absenceDays, addAbsenceDay, deleteAbsenceDay } = useApp();

  const [openTime, setOpenTime] = useState(availabilityConfig.openTime);
  const [closeTime, setCloseTime] = useState(availabilityConfig.closeTime);
  const [intervalMinutes, setIntervalMinutes] = useState(availabilityConfig.intervalMinutes);
  const [lunchStart, setLunchStart] = useState(availabilityConfig.lunchStart);
  const [lunchEnd, setLunchEnd] = useState(availabilityConfig.lunchEnd);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New absence day form state
  const [absenceDate, setAbsenceDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAvailabilityConfig({
      openTime,
      closeTime,
      intervalMinutes,
      lunchStart,
      lunchEnd,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceDate || !absenceReason.trim()) return;

    addAbsenceDay(absenceDate, absenceReason.trim());
    setAbsenceDate('');
    setAbsenceReason('');
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Operating Hours Settings */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Configuração de Horários de Funcionamento da Barbearia
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Define os slots de agendamento exibidos para os clientes na área pública.
            </p>
          </div>

          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold">
              <Check className="w-4 h-4" />
              Configurações Salvas!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Horário de Abertura</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Horário de Fechamento</label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Intervalo dos Horários</label>
            <select
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value={30}>A cada 30 minutos</option>
              <option value={45}>A cada 45 minutos</option>
              <option value={60}>A cada 60 minutos (1 hora)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Início do Almoço / Pausa</label>
            <input
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Término do Almoço / Pausa</label>
            <input
              type="time"
              value={lunchEnd}
              onChange={(e) => setLunchEnd(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Salvar Horários da Grade</span>
            </button>
          </div>
        </form>
      </div>

      {/* Absence Days & Holidays Management */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="mb-6 pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Dias de Ausência & Bloqueio de Agenda
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre feriados, folgas do barbeiro ou cursos. As datas cadastradas aqui são automaticamente bloqueadas
            para agendamentos dos clientes.
          </p>
        </div>

        {/* Add Absence Form */}
        <form onSubmit={handleAddAbsence} className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Cadastrar Novo Dia de Ausência / Folga
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Data do Bloqueio</label>
              <input
                type="date"
                required
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Motivo / Justificativa (visível ao cliente se tentar marcar)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: Feriado Nacional, Curso Master Barber, Reforma"
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
                >
                  Bloquear Dia
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Absence Days List */}
        <div className="space-y-2">
          {absenceDays.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">Nenhum dia de ausência cadastrado.</p>
          ) : (
            absenceDays.map((abs) => (
              <div
                key={abs.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-white">
                      {abs.date.split('-').reverse().join('/')}
                    </span>
                    <span className="text-slate-400 ml-3">{abs.reason}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteAbsenceDay(abs.id)}
                  title="Remover bloqueio"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
