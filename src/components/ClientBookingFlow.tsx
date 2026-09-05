import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RecurrenceType, BarberService } from '../types';
import {
  Scissors,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Repeat,
  ArrowRight,
  ArrowLeft,
  Crown,
  UserCheck,
  Share2,
  CreditCard,
  ExternalLink,
} from 'lucide-react';

export const ClientBookingFlow: React.FC = () => {
  const {
    services,
    availabilityConfig,
    absenceDays,
    bookings,
    currentUser,
    openAuthModal,
    openSubscriptionModal,
    createBookingBatch,
    setPendingBooking,
    setActiveView,
    infinitePayConfig,
    establishmentInfo,
  } = useApp();

  // Booking state
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [selectedBarber, setSelectedBarber] = useState<string>('Lucas Hoffmann');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-02');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('SINGLE');
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmedBookingIds, setConfirmedBookingIds] = useState<string[]>([]);

  // Internal step navigation with Browser & Android back button support
  const goToStep = (newStep: 1 | 2 | 3 | 4, pushHistory = true) => {
    setStep(newStep);
    if (pushHistory) {
      window.history.pushState({ appView: 'BOOKING', bookingStep: newStep }, '');
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.bookingStep === 'number') {
        setStep(event.state.bookingStep as 1 | 2 | 3 | 4);
      } else if (event.state && event.state.appView === 'BOOKING') {
        setStep(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const safeServices = services || [];
  const safeBookings = bookings || [];

  // Find active service
  const selectedService = useMemo(
    () => safeServices.find((s) => s.id === selectedServiceId) || safeServices[0],
    [safeServices, selectedServiceId]
  );

  // Check if current user is subscriber
  const isSubscriber = Boolean(currentUser?.subscriptionId);

  // Check if selected date is an absence day
  const isDateBlockedByAbsence = useMemo(() => {
    return absenceDays.find((a) => a.date === selectedDate);
  }, [absenceDays, selectedDate]);

  // Generate available time slots based on availability config, interval, and existing bookings
  const timeSlots = useMemo(() => {
    const slots: Array<{ time: string; available: boolean; reason?: string }> = [];

    const [openH, openM] = availabilityConfig.openTime.split(':').map(Number);
    const [closeH, closeM] = availabilityConfig.closeTime.split(':').map(Number);
    const [lunchStartH, lunchStartM] = availabilityConfig.lunchStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = availabilityConfig.lunchEnd.split(':').map(Number);

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;
    const lunchStartTotal = lunchStartH * 60 + lunchStartM;
    const lunchEndTotal = lunchEndH * 60 + lunchEndM;

    for (let current = startMinutes; current < endMinutes; current += availabilityConfig.intervalMinutes) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Check lunch
      if (current >= lunchStartTotal && current < lunchEndTotal) {
        continue;
      }

      // Check if already booked on selectedDate
      const isBooked = safeBookings.some(
        (b) => b.date === selectedDate && b.time === timeStr && b.status !== 'CANCELADO'
      );

      slots.push({
        time: timeStr,
        available: !isBooked && !isDateBlockedByAbsence,
        reason: isDateBlockedByAbsence ? 'Barbearia fechada neste dia' : isBooked ? 'Horário já reservado' : undefined,
      });
    }

    return slots;
  }, [availabilityConfig, selectedDate, bookings, isDateBlockedByAbsence]);

  // Calculate batch dates based on recurrence
  const computedDatesAndTimes = useMemo(() => {
    if (!selectedDate || !selectedTime) return [];

    const result: Array<{ date: string; time: string }> = [{ date: selectedDate, time: selectedTime }];
    const baseDate = new Date(`${selectedDate}T${selectedTime}:00`);

    if (recurrence === 'WEEKLY') {
      // 4 consecutive weeks
      for (let i = 1; i <= 3; i++) {
        const next = new Date(baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        result.push({
          date: next.toISOString().split('T')[0],
          time: selectedTime,
        });
      }
    } else if (recurrence === 'BIWEEKLY') {
      // Every 15 days, 3 appointments
      for (let i = 1; i <= 2; i++) {
        const next = new Date(baseDate.getTime() + i * 14 * 24 * 60 * 60 * 1000);
        result.push({
          date: next.toISOString().split('T')[0],
          time: selectedTime,
        });
      }
    } else if (recurrence === 'MONTHLY') {
      // 1x per month for 3 months
      for (let i = 1; i <= 2; i++) {
        const next = new Date(baseDate);
        next.setMonth(next.getMonth() + i);
        result.push({
          date: next.toISOString().split('T')[0],
          time: selectedTime,
        });
      }
    }

    return result;
  }, [selectedDate, selectedTime, recurrence]);

  // Handle proceed to step 3
  const handleProceedToReview = () => {
    if (!selectedTime) return;

    if (!currentUser) {
      // Save pending booking and open auth modal as requested:
      // "Cliente, na área pública, primeiro faz a reserva do horário, depois é direcionado para fazer o login e concluir a reserva"
      setPendingBooking({
        serviceId: selectedService.id,
        barberName: selectedBarber,
        datesAndTimes: computedDatesAndTimes,
        recurrenceType: recurrence,
        notes,
      });
      openAuthModal('LOGIN');
      return;
    }

    goToStep(3);
  };

  // Confirm booking
  const handleConfirmBooking = () => {
    if (!currentUser) {
      openAuthModal('LOGIN');
      return;
    }

    const ids = createBookingBatch(
      {
        serviceId: selectedService.id,
        barberName: selectedBarber,
        datesAndTimes: computedDatesAndTimes,
        recurrenceType: recurrence,
        notes,
      },
      currentUser
    );

    setConfirmedBookingIds(ids);
    goToStep(4);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Banner with Subscription Highlights */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E2429] via-[#181D21] to-[#121619] border border-[#CBA358]/30 p-6 md:p-8 mb-8 shadow-2xl shadow-black/80">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#CBA358]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CBA358]/10 border border-[#CBA358]/30 text-[#E5C158] text-xs font-bold mb-3 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#CBA358]" />
              Lucas Hoffmann Barber • Estética Masculina de Alto Padrão
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F6F2EA] tracking-tight font-['Cabinet_Grotesk',sans-serif] uppercase">
              Agende seu Horário com <span className="text-[#CBA358]">Excelência</span>
            </h1>
            <p className="text-[#A6B2BD] text-sm mt-2 leading-relaxed">
              Cortes clássicos, navalhados de alta precisão e barboterapia relaxante com toalha quente. Escolha horários únicos ou garanta sua recorrência semanal/quinzenal.
            </p>
          </div>

          {/* Club Subscription Teaser */}
          <div className="w-full md:w-auto shrink-0 bg-gradient-to-b from-[#252D34] to-[#161B1E] border border-[#CBA358]/30 rounded-2xl p-5 text-center shadow-lg shadow-black/40">
            <div className="flex items-center justify-center gap-1.5 text-[#E5C158] font-bold text-xs mb-1">
              <Crown className="w-4 h-4 text-[#CBA358]" />
              Clube de Assinatura
            </div>
            <p className="text-xs text-[#D0D7DE] font-medium">Cortes & Barbas Ilimitadas</p>
            <button
              onClick={openSubscriptionModal}
              className="mt-3 w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#CBA358] to-[#B88C3E] hover:from-[#DFB86C] hover:to-[#CBA358] text-[#14181B] font-black text-xs uppercase tracking-wider transition shadow-md shadow-[#CBA358]/20"
            >
              Conhecer Planos
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between max-w-lg mx-auto mb-8 px-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
            }`}
          >
            1
          </div>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Serviço</span>
        </div>
        <div className={`h-0.5 flex-1 mx-2 transition ${step >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
            }`}
          >
            2
          </div>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Data & Horário</span>
        </div>
        <div className={`h-0.5 flex-1 mx-2 transition ${step >= 3 ? 'bg-amber-500' : 'bg-slate-800'}`} />
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
            }`}
          >
            3
          </div>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Revisão</span>
        </div>
        <div className={`h-0.5 flex-1 mx-2 transition ${step >= 4 ? 'bg-amber-500' : 'bg-slate-800'}`} />
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 4 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
            }`}
          >
            4
          </div>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Concluído</span>
        </div>
      </div>

      {/* STEP 1: SERVICE SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              1. Selecione o Serviço Desejado
            </h2>
            <span className="text-xs text-slate-400">{safeServices.filter((s) => s.isActive).length} opções disponíveis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeServices
              .filter((s) => s.isActive)
              .map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition relative group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-[#1e293b] border-slate-800 hover:border-slate-700 hover:bg-[#24334a]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 mb-2 inline-block">
                          {service.category}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                          {service.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{service.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-extrabold text-amber-400">
                          {isSubscriber ? 'Grátis (VIP)' : `R$ ${service.price.toFixed(2).replace('.', ',')}`}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{service.durationMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#2A333C] flex items-center justify-between text-xs">
                      <span className="text-[#A6B2BD]">Profissional: Lucas Hoffmann</span>
                      <span className={`font-semibold ${isSelected ? 'text-[#CBA358]' : 'text-[#798593]'}`}>
                        {isSelected ? '✓ Selecionado' : 'Clique para escolher'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => goToStep(2)}
              className="flex items-center gap-2 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20"
            >
              <span>Escolher Data e Horário</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE, TIME & MULTIPLE BOOKING / RECURRENCE */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => goToStep(1)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos serviços
            </button>
            <div className="text-right">
              <span className="text-xs font-semibold text-amber-400">{selectedService.name}</span>
              <p className="text-[11px] text-slate-400">Duração média: {selectedService.durationMinutes} minutos</p>
            </div>
          </div>

          {/* Recurrence Selector - RESERVAR VÁRIOS HORÁRIOS */}
          <div className="bg-[#1e293b] border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Frequência da Reserva (Múltiplos Horários)</h3>
              </div>
              <span className="text-[11px] text-slate-400">Garanta sua agenda com antecedência</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'SINGLE', label: 'Horário Único', desc: '1 atendimento' },
                { id: 'WEEKLY', label: 'Semanalmente', desc: '4 agendamentos' },
                { id: 'BIWEEKLY', label: 'Quinzenalmente', desc: '3 agendamentos' },
                { id: 'MONTHLY', label: 'Mensalmente', desc: '3 agendamentos' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecurrence(opt.id as RecurrenceType)}
                  className={`p-3 rounded-xl border text-left transition ${
                    recurrence === opt.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker & Barber */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5">
              <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                Escolha a Data Inicial
              </label>
              <input
                type="date"
                min="2026-09-02"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime(''); // Reset time selection on date change
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />

              {isDateBlockedByAbsence && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Barbearia Fechada nesta data:</span>
                    <p className="mt-0.5 text-red-300">{isDateBlockedByAbsence.reason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5">
              <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Profissional Barbeiro
              </label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              >
                <option value="Lucas Hoffmann">Lucas Hoffmann (Barbeiro Master)</option>
                <option value="Equipe Lucas Hoffmann">Qualquer Barbeiro da Equipe</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-2">
                Atendimento pontual com toalha aromatizada e bebida de cortesia.
              </p>
            </div>
          </div>

          {/* Available Time Slots */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Horários Disponíveis em {selectedDate.split('-').reverse().join('/')}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Clique para selecionar o melhor horário para você:
            </p>

            {isDateBlockedByAbsence ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Não há horários disponíveis devido ao fechamento programado da barbearia.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                          : slot.available
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-500/50'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed line-through opacity-60'
                      }`}
                    >
                      <span>{slot.time}</span>
                      <span className="text-[9px] font-normal mt-0.5">
                        {slot.available ? (isSelected ? 'Escolhido' : 'Livre') : 'Ocupado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Computed Dates Preview for Recurrence */}
          {recurrence !== 'SINGLE' && selectedTime && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-bold text-amber-400 mb-2">
                Agendamentos automáticos que serão criados ({computedDatesAndTimes.length} datas):
              </p>
              <div className="flex flex-wrap gap-2">
                {computedDatesAndTimes.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200"
                  >
                    #{idx + 1}: {item.date.split('-').reverse().join('/')} às {item.time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Observações especiais (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Prefiro tesoura no topo, barba bem alinhada, degradê na zero"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => goToStep(1)}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Voltar
            </button>

            <button
              disabled={!selectedTime}
              onClick={handleProceedToReview}
              className={`flex items-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition ${
                selectedTime
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{currentUser ? 'Revisar Agendamento' : 'Identificar-se e Concluir'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & AUTH CHECK */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => goToStep(2)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Editar data e horário
            </button>
            <span className="text-xs text-slate-400">Passo 3 de 4</span>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              Confirme os Detalhes da sua Reserva
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Serviço Selecionado</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedService.name}</p>
                <p className="text-xs text-slate-500">Duração: {selectedService.durationMinutes} min</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Profissional</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedBarber}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="text-sm font-bold text-white mt-0.5">{currentUser?.name}</p>
                <p className="text-xs text-slate-500">{currentUser?.phone} • {currentUser?.email}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Frequência</p>
                <span className="inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {recurrence === 'SINGLE'
                    ? '1 Horário Único'
                    : recurrence === 'WEEKLY'
                    ? 'Semanal (4 horários)'
                    : recurrence === 'BIWEEKLY'
                    ? 'Quinzenal (3 horários)'
                    : 'Mensal (3 horários)'}
                </span>
              </div>
            </div>

            {/* Dates List */}
            <div className="py-4 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-300 mb-2">Datas e Horários Agendados:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {computedDatesAndTimes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-400">Agendamento #{idx + 1}</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {item.date.split('-').reverse().join('/')} às {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {isSubscriber ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Crown className="w-4 h-4" />
                    <span>Incluso na sua Assinatura VIP do Clube (Custo Zero)</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-slate-400">Total a pagar no atendimento:</span>
                    <div className="text-2xl font-extrabold text-amber-400">
                      R${' '}
                      {(selectedService.price * computedDatesAndTimes.length)
                        .toFixed(2)
                        .replace('.', ',')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400">
                        Pague no local ou com Cartão via InfinitePay
                      </span>
                      {infinitePayConfig.enabled && infinitePayConfig.defaultUrl && (
                        <a
                          href={infinitePayConfig.defaultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Link InfinitePay</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmBooking}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <span>Confirmar Todos os Horários</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 4 && (
        <div className="bg-[#1e293b] border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl max-w-xl mx-auto animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>

          <h2 className="text-2xl font-extrabold text-white font-['Cabinet_Grotesk',sans-serif]">
            Reserva Confirmada com Sucesso!
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Seus horários foram inseridos na agenda da barbearia. Um lembrete também foi programado para você.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Serviço:</span>
              <span className="font-bold text-white">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Primeiro Horário:</span>
              <span className="font-bold text-amber-400 font-mono">
                {computedDatesAndTimes[0]?.date.split('-').reverse().join('/')} às{' '}
                {computedDatesAndTimes[0]?.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total de Horários:</span>
              <span className="font-bold text-slate-200">{computedDatesAndTimes.length} agendamento(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Barbeiro:</span>
              <span className="font-bold text-slate-200">{selectedBarber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Endereço:</span>
              <span className="text-slate-300">
                {establishmentInfo.address}, {establishmentInfo.neighborhood} - {establishmentInfo.city}
              </span>
            </div>
          </div>

          {/* WhatsApp share confirmation */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                const cleanPhone = (establishmentInfo.phone || currentUser?.phone || '5511987654321').replace(/\D/g, '');
                const msg = `💈 Olá! Confirmei meu agendamento na ${establishmentInfo.name || 'Lucas Hoffmann Barber'} para ${selectedService.name} no dia ${computedDatesAndTimes[0]?.date.split('-').reverse().join('/')} às ${computedDatesAndTimes[0]?.time} no endereço: ${establishmentInfo.address}, ${establishmentInfo.neighborhood}.`;
                window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar comprovante no WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveView('MY_BOOKINGS')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Ver Meus Agendamentos
            </button>
          </div>

          <button
            onClick={() => {
              goToStep(1);
              setSelectedTime('');
              setRecurrence('SINGLE');
            }}
            className="mt-4 text-xs text-amber-400 hover:underline"
          >
            Fazer outro agendamento
          </button>
        </div>
      )}
    </div>
  );
};
