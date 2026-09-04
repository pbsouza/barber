import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SubscriptionPlan, InfinitePayWebhookEvent } from '../types';
import {
  X,
  Crown,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Copy,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Radio,
  RefreshCw,
  Terminal,
  AlertCircle,
} from 'lucide-react';

export const SubscriptionPlansModal: React.FC = () => {
  const {
    isSubscriptionModalOpen,
    closeSubscriptionModal,
    plans,
    currentUser,
    subscribeUserToPlan,
    verifyPaymentForOrder,
    openAuthModal,
    infinitePayConfig,
    webhookEvents,
    isUserSubscriber,
    setUserPendingCheckout,
  } = useApp();

  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [orderNsu, setOrderNsu] = useState<string>('');
  const [manualReceiptNsu, setManualReceiptNsu] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNsu, setCopiedNsu] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [webhookConfirmed, setWebhookConfirmed] = useState(false);

  // Find recent webhook event for THIS specific user matching orderNsu or pendingOrderNsu
  const recentWebhookEvent = useMemo(() => {
    if (!webhookEvents || webhookEvents.length === 0 || !currentUser) return null;
    const cleanOrderNsu = (orderNsu || currentUser.pendingOrderNsu || currentUser.order_nsu || '').trim().toLowerCase();
    const cleanUserId = currentUser.id.toLowerCase();

    return (
      webhookEvents.find((ev) => {
        if (ev.status !== 'PROCESSED' && (ev.status as string) !== 'APPROVED') return false;
        // Garante estritamente que pertence a este usuário
        if (ev.userId && ev.userId.toLowerCase() !== cleanUserId) return false;

        const evOrderNsu = (ev.order_nsu || '').trim().toLowerCase();
        const evTxNsu = (ev.transaction_nsu || '').trim().toLowerCase();

        if (cleanOrderNsu && (evOrderNsu === cleanOrderNsu || evTxNsu === cleanOrderNsu || evOrderNsu.includes(cleanOrderNsu) || cleanOrderNsu.includes(evOrderNsu))) {
          return true;
        }
        if (evOrderNsu.includes(cleanUserId)) {
          return true;
        }
        return false;
      }) || null
    );
  }, [webhookEvents, currentUser, orderNsu]);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!currentUser) {
      closeSubscriptionModal();
      openAuthModal('LOGIN');
      return;
    }

    // NSU único codificado com o ID do usuário cadastrado para rastreio unívoco
    const generatedNsu = `ORD_${currentUser.id}_${Date.now().toString(36)}`;
    setOrderNsu(generatedNsu);
    setManualReceiptNsu('');
    setSelectedPlanForCheckout(plan);
    setCopiedLink(false);
    setCopiedNsu(false);
    setActivationSuccess(false);
    setWebhookConfirmed(false);
    setVerificationError(null);
    setIsVerifying(false);

    // Registra no Firestore que o cliente está com checkout pendente deste pedido e plano
    setUserPendingCheckout(currentUser.id, plan.id, generatedNsu);
  };

  const handleConfirmDetectedPayment = async (ev: InfinitePayWebhookEvent) => {
    if (!currentUser || !selectedPlanForCheckout) return;
    setIsActivating(true);
    setVerificationError(null);
    try {
      await subscribeUserToPlan(currentUser.id, selectedPlanForCheckout.id, {
        orderNsu: ev.order_nsu,
        transactionNsu: ev.transaction_nsu,
        paymentMethod: ev.capture_method?.toLowerCase().includes('pix') ? 'PIX' : 'CARTAO_CREDITO',
      });
      setIsActivating(false);
      setActivationSuccess(true);
      setTimeout(() => {
        closeSubscriptionModal();
        setSelectedPlanForCheckout(null);
        setActivationSuccess(false);
      }, 2500);
    } catch (err: any) {
      setVerificationError(err?.message || 'Erro ao vincular pagamento.');
      setIsActivating(false);
    }
  };

  const handleVerifyAndActivate = async () => {
    if (!currentUser || !selectedPlanForCheckout) return;

    setIsVerifying(true);
    setVerificationError(null);

    // If manual NSU was provided, use it. Otherwise, if there is a recent webhook event, use its NSU, or fallback to orderNsu
    const targetNsu =
      manualReceiptNsu.trim() ||
      recentWebhookEvent?.transaction_nsu ||
      recentWebhookEvent?.order_nsu ||
      orderNsu;

    try {
      const res = await verifyPaymentForOrder(targetNsu, selectedPlanForCheckout.monthlyPrice);

      if (res.paid && res.event) {
        // Successfully verified payment with InfinitePay!
        setIsActivating(true);
        await subscribeUserToPlan(currentUser.id, selectedPlanForCheckout.id, {
          orderNsu: res.event.order_nsu,
          transactionNsu: res.event.transaction_nsu,
          paymentMethod: res.event.capture_method?.toLowerCase().includes('pix') ? 'PIX' : 'CARTAO_CREDITO',
        });
        setIsActivating(false);
        setActivationSuccess(true);
        setTimeout(() => {
          closeSubscriptionModal();
          setSelectedPlanForCheckout(null);
          setActivationSuccess(false);
        }, 2500);
      } else {
        // Payment NOT confirmed by InfinitePay: DO NOT ACTIVATE!
        setVerificationError(
          `Pagamento ainda não confirmado pela InfinitePay para o código "${targetNsu}". Se você acabou de efetuar o pagamento pelo link, aguarde alguns segundos ou envie o comprovante no WhatsApp.`
        );
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Erro ao consultar status de pagamento.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyNsu = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedNsu(true);
    setTimeout(() => setCopiedNsu(false), 3000);
  };

  // Real-time Webhook Polling: listens for InfinitePay confirmation for this order or recent payment
  useEffect(() => {
    if (!isSubscriptionModalOpen || !selectedPlanForCheckout || activationSuccess || webhookConfirmed) return;

    const checkWebhookStatus = async () => {
      try {
        const targetNsu =
          manualReceiptNsu.trim() ||
          recentWebhookEvent?.transaction_nsu ||
          recentWebhookEvent?.order_nsu ||
          orderNsu;

        const res = await verifyPaymentForOrder(targetNsu, selectedPlanForCheckout.monthlyPrice);
        if (res.paid && res.event && currentUser && selectedPlanForCheckout) {
          setWebhookConfirmed(true);
          setIsActivating(true);
          await subscribeUserToPlan(currentUser.id, selectedPlanForCheckout.id, {
            orderNsu: res.event.order_nsu,
            transactionNsu: res.event.transaction_nsu,
            paymentMethod: res.event.capture_method?.toLowerCase().includes('pix') ? 'PIX' : 'CARTAO_CREDITO',
          });
          setIsActivating(false);
          setActivationSuccess(true);
          setTimeout(() => {
            closeSubscriptionModal();
            setSelectedPlanForCheckout(null);
            setActivationSuccess(false);
            setWebhookConfirmed(false);
          }, 2500);
        }
      } catch {
        // Blips ignored in background interval
      }
    };

    const interval = setInterval(checkWebhookStatus, 3500);
    return () => clearInterval(interval);
  }, [
    isSubscriptionModalOpen,
    selectedPlanForCheckout,
    orderNsu,
    manualReceiptNsu,
    recentWebhookEvent,
    activationSuccess,
    webhookConfirmed,
    currentUser,
    subscribeUserToPlan,
    verifyPaymentForOrder,
    closeSubscriptionModal,
  ]);

  // Validação Instantânea pelo status: 'PROCESSED' do Firebase
  // "O sistema vai comparar vai buscar por status: PROCESSED, libera acesso a assinatura. Senão não libera."
  useEffect(() => {
    if (!isSubscriptionModalOpen || !selectedPlanForCheckout || activationSuccess) return;

    if (
      isUserSubscriber(currentUser) &&
      (currentUser?.status === 'PROCESSED' || currentUser?.subscriptionStatus === 'PROCESSED')
    ) {
      setWebhookConfirmed(true);
      setActivationSuccess(true);
      const timer = setTimeout(() => {
        closeSubscriptionModal();
        setSelectedPlanForCheckout(null);
        setActivationSuccess(false);
        setWebhookConfirmed(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [
    isSubscriptionModalOpen,
    selectedPlanForCheckout,
    activationSuccess,
    currentUser?.status,
    currentUser?.subscriptionStatus,
    currentUser?.subscriptionId,
    currentUser,
    isUserSubscriber,
    closeSubscriptionModal,
  ]);

  // Only show active plans to clients
  const visiblePlans = (plans || []).filter((p) => p.isActive !== false);

  const rawUrl = selectedPlanForCheckout
    ? selectedPlanForCheckout.infinitePayUrl || infinitePayConfig.defaultUrl
    : infinitePayConfig.defaultUrl;

  const effectiveInfinitePayUrl = useMemo(() => {
    if (!rawUrl) return '';
    const clean = rawUrl.trim();
    if (!clean) return '';
    const separator = clean.includes('?') ? '&' : '?';
    return `${clean}${separator}order_nsu=${encodeURIComponent(orderNsu)}&custom_id=${encodeURIComponent(currentUser?.id || '')}`;
  }, [rawUrl, orderNsu, currentUser?.id]);

  if (!isSubscriptionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            closeSubscriptionModal();
            setSelectedPlanForCheckout(null);
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* IF CHECKOUT WITH INFINITEPAY IS ACTIVE */}
        {selectedPlanForCheckout ? (
          <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95">
            <button
              onClick={() => setSelectedPlanForCheckout(null)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar aos outros planos</span>
            </button>

            {activationSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <h3 className="text-2xl font-extrabold text-white">Assinatura Ativada com Sucesso!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Parabéns, {currentUser?.name}! Seu plano <strong>{selectedPlanForCheckout.name}</strong> já está ativo. Seus próximos agendamentos inclusos terão custo zero!
                </p>
              </div>
            ) : (
              <>
                {/* Checkout Header */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                    <CreditCard className="w-3.5 h-3.5" />
                    Pagamento com Cartão via InfinitePay
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Finalizar Assinatura</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Você escolheu o <strong>{selectedPlanForCheckout.name}</strong> por{' '}
                    <span className="text-emerald-400 font-bold font-mono">
                      R$ {selectedPlanForCheckout.monthlyPrice.toFixed(2).replace('.', ',')}/mês
                    </span>
                  </p>
                </div>

                {/* Plan Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Plano Selecionado:</span>
                    <span className="font-bold text-white">{selectedPlanForCheckout.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Agendamentos Inclusos:</span>
                    <span className="font-bold text-amber-400">
                      {selectedPlanForCheckout.maxBookingsPerMonth === -1
                        ? 'Ilimitados'
                        : `${selectedPlanForCheckout.maxBookingsPerMonth} cortes/mês`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Benefícios:</span>
                    <span className="text-right text-slate-300 max-w-[280px]">
                      {selectedPlanForCheckout.includedServicesDescription}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400 font-semibold">Valor Mensal Recorrente:</span>
                    <span className="text-lg font-extrabold text-emerald-400 font-mono">
                      R$ {selectedPlanForCheckout.monthlyPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* InfinitePay Digital Wallet Link Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Carteira Digital InfinitePay</p>
                        <p className="text-[10px] text-emerald-400 font-medium">Cartão de Crédito e Débito</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Aprovação Imediata
                    </span>
                  </div>

                  {/* Order NSU or Detected Payment Box */}
                  {recentWebhookEvent ? (
                    <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-2 border-emerald-500/60 rounded-2xl space-y-3 shadow-lg shadow-emerald-950/60 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Pagamento Detectado no Firebase!
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          {recentWebhookEvent.capture_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-300 space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-slate-400">Código do Recibo / NSU:</span>
                          <span className="text-white font-bold text-xs select-all break-all">
                            {recentWebhookEvent.transaction_nsu || recentWebhookEvent.order_nsu}
                          </span>
                        </div>
                        {recentWebhookEvent.invoice_slug && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Fatura:</span>
                            <span className="text-cyan-300 font-semibold">{recentWebhookEvent.invoice_slug}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Registrado em:</span>
                          <span className="text-slate-300">
                            {new Date(recentWebhookEvent.receivedAt).toLocaleTimeString('pt-BR')} (Hoje)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmDetectedPayment(recentWebhookEvent)}
                        disabled={isActivating}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Vincular Este Pagamento e Ativar Minha Assinatura</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          Sessão do Pedido
                        </span>
                        <span className="font-mono text-xs font-bold text-white select-all">
                          {orderNsu}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyNsu(orderNsu)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition shrink-0"
                      >
                        {copiedNsu ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNsu ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}

                  {/* Real-time Webhook Waiting Indicator */}
                  <div className="p-2.5 bg-cyan-950/20 rounded-xl border border-cyan-500/20 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <span className="text-[11px] text-slate-300">
                      Monitorando confirmações em tempo real via <strong>Firebase Firestore</strong>. Assim que você pagar no link, o sistema reconhece seu recibo automaticamente!
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clique no botão abaixo para abrir o link de pagamento seguro da <strong>InfinitePay</strong> ou escaneie o QR Code no seu celular com a câmera ou app da carteira.
                  </p>

                  {/* QR Code preview */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                    <div className="bg-white p-2 rounded-xl shrink-0 shadow">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                          effectiveInfinitePayUrl
                        )}`}
                        alt="QR Code InfinitePay"
                        className="w-20 h-20"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <p className="text-[11px] font-mono text-slate-300 break-all select-all">
                        {effectiveInfinitePayUrl}
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(effectiveInfinitePayUrl)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition flex items-center gap-1"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                        </button>
                        <a
                          href={effectiveInfinitePayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir no Navegador</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Direct Link Action */}
                  <a
                    href={effectiveInfinitePayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar no Cartão via InfinitePay</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Verification Error Notice */}
                {verificationError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-rose-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Pagamento não confirmado pela InfinitePay</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{verificationError}</p>
                    <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-rose-500/20">
                      <p>• Certifique-se de ter concluído o pagamento pelo link ou QR Code da InfinitePay acima.</p>
                      <p>• Se você acabou de pagar no cartão, aguarde alguns segundos pela compensação e tente novamente.</p>
                      <p>• Se pagou via PIX ou dinheiro direto com o barbeiro, utilize a opção do WhatsApp abaixo.</p>
                    </div>
                  </div>
                )}

                {/* Optional NSU / Receipt input */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Código do Recibo, NSU ou Link InfinitePay:
                  </label>
                  <input
                    type="text"
                    value={manualReceiptNsu}
                    onChange={(e) => setManualReceiptNsu(e.target.value)}
                    placeholder={
                      recentWebhookEvent?.transaction_nsu ||
                      recentWebhookEvent?.order_nsu ||
                      'Ex: fad4a6bf-a1cc... ou cole o link do recibo'
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    {recentWebhookEvent
                      ? 'Um pagamento recente já foi identificado no Firebase acima! Você também pode informar outro código se necessário.'
                      : 'Cole o código NSU, identificador da fatura ou link do comprovante gerado após o pagamento.'}
                  </p>
                </div>

                {/* Confirm Subscription Action */}
                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={handleVerifyAndActivate}
                    disabled={isActivating || isVerifying}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Consultando aprovação InfinitePay...</span>
                      </>
                    ) : isActivating ? (
                      <span>Ativando plano na sua conta...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Já Realizei o Pagamento — Verificar Aprovação</span>
                      </>
                    )}
                  </button>

                  {/* Admin Quick Activation Shortcut */}
                  {(currentUser.role === 'ADMIN' || currentUser.role === 'MASTER') && (
                    <button
                      type="button"
                      disabled={isActivating}
                      onClick={async () => {
                        if (!currentUser || !selectedPlanForCheckout) return;
                        setIsActivating(true);
                        await subscribeUserToPlan(currentUser.id, selectedPlanForCheckout.id, {
                          orderNsu: orderNsu || `ADM-${Date.now().toString().slice(-6)}`,
                          transactionNsu: `TX-ADM-${Date.now().toString().slice(-6)}`,
                          paymentMethod: 'CARTAO_CREDITO',
                        });
                        setIsActivating(false);
                        setActivationSuccess(true);
                        setTimeout(() => {
                          closeSubscriptionModal();
                          setSelectedPlanForCheckout(null);
                          setActivationSuccess(false);
                        }, 2000);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Ativar Agora (Modo Administrador / Balcão)</span>
                    </button>
                  )}

                  {/* Secondary option: WhatsApp direct confirmation */}
                  <a
                    href={`https://wa.me/5511987654321?text=${encodeURIComponent(
                      `Olá Lucas Hoffmann! Gostaria de ativar meu plano *${selectedPlanForCheckout.name}* (Identificador: ${orderNsu}). Já efetuei o pagamento, segue o comprovante para liberação.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition flex items-center justify-center gap-2"
                  >
                    <span>💬 Paguei por PIX direto ou na barbearia? Enviar comprovante no WhatsApp</span>
                  </a>

                  <p className="text-[11px] text-center text-slate-500 mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    A assinatura só é liberada com verificação automática do pagamento pela InfinitePay
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
                <Crown className="w-3.5 h-3.5" />
                Clube de Assinatura Lucas Hoffmann
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Cabinet_Grotesk',sans-serif]">
                Visual Impecável O Ano Todo
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Economize até 50% em relação a cortes avulsos, tenha prioridade na agenda e pague no cartão via InfinitePay.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {visiblePlans.map((plan) => {
                const isUserActivePlan = isUserSubscriber(currentUser) && currentUser?.subscriptionId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between relative transition ${
                      plan.popular
                        ? 'bg-gradient-to-b from-[#2d281e] to-[#1e293b] border-amber-500 shadow-xl shadow-amber-500/10 scale-102'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow">
                        Mais Escolhido
                      </div>
                    )}

                    <div>
                      <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-xs text-slate-400 min-h-[32px]">{plan.description}</p>

                      <div className="mt-4 mb-6">
                        <span className="text-xs text-slate-400">R$</span>
                        <span className="text-3xl font-extrabold text-white ml-1 font-mono">
                          {plan.monthlyPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-slate-400">/mês</span>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{plan.includedServicesDescription}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            {plan.maxBookingsPerMonth === -1
                              ? 'Cortes ilimitados no mês'
                              : `${plan.maxBookingsPerMonth} cortes/mês inclusos`}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{plan.discountPercentageOnOthers}% de desconto em produtos de barbearia</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>Pagamento via Cartão pela InfinitePay</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-4">
                      {isUserActivePlan ? (
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Plano Atual Ativo
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                            plan.popular
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                          }`}
                        >
                          <span>{currentUser ? 'Assinar com InfinitePay' : 'Entrar e Assinar'}</span>
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guarantee Banner */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-400 text-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Cobrança recorrente com Cartão de Crédito pela carteira digital InfinitePay. Sem fidelidade, cancele quando desejar.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
