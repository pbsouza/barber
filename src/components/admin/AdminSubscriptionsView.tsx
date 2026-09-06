import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan, InfinitePayWebhookEvent, getPlanBenefits } from '../../types';
import {
  Crown,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Copy,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  DollarSign,
  AlertCircle,
  MessageCircle,
  Link as LinkIcon,
  CheckCircle2,
  Radio,
  Terminal,
  RefreshCw,
  Send,
  Eye,
  Activity,
  Code2,
  Info,
  UserPlus,
  Globe,
} from 'lucide-react';

interface WebhookEventItem {
  id: string;
  invoice_slug?: string;
  order_nsu: string;
  paid_amount?: number | string;
  capture_method?: string;
  transaction_nsu?: string;
  receivedAt: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  rawBody: any;
}

// Safe fetch that never throws on HTML 404 responses
async function safeJsonFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      const isHtml = text.toLowerCase().includes('<html') || text.toLowerCase().includes('<!doctype');
      return {
        ok: false,
        status: res.status,
        isHtml,
        error: isHtml
          ? `O endpoint respondeu com página HTML (status ${res.status}). No GitHub Pages não há servidor Node Express rodando diretamente.`
          : 'Resposta não é um JSON válido.',
        raw: text,
      };
    }
    return { ok: res.ok, status: res.status, data: json, raw: text, isHtml: false };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || 'Falha de conexão.', isHtml: false };
  }
}

export const AdminSubscriptionsView: React.FC = () => {
  const {
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    infinitePayConfig,
    updateInfinitePayConfig,
    users,
    cancelUserSubscription,
    subscribeUserToPlan,
    webhookEvents: firestoreWebhookEvents,
    recordWebhookEvent,
    clearWebhookEvents,
  } = useApp();

  // InfinitePay form state
  const [merchantName, setMerchantName] = useState(infinitePayConfig.merchantName || 'Lucas Hoffmann Barber');
  const [defaultUrl, setDefaultUrl] = useState(infinitePayConfig.defaultUrl || 'https://pay.infinitepay.io/lucashoffmannbarber');
  const [enabled, setEnabled] = useState(infinitePayConfig.enabled ?? true);
  const [notes, setNotes] = useState(infinitePayConfig.notes || '');
  const [plansSubtitle, setPlansSubtitle] = useState(
    infinitePayConfig.plansSubtitle ??
      'Economize até 50% em relação a cortes avulsos, tenha prioridade na agenda e pague com segurança no cartão ou PIX.'
  );
  const [guaranteeBannerText, setGuaranteeBannerText] = useState(
    infinitePayConfig.guaranteeBannerText ??
      'Cobrança recorrente no Cartão de Crédito ou PIX com segurança garantida. Sem fidelidade, cancele quando desejar.'
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveTextsSuccessMsg, setSaveTextsSuccessMsg] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Plans form state
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(79.9);
  const [isUnlimitedBookings, setIsUnlimitedBookings] = useState(false);
  const [maxBookingsPerMonth, setMaxBookingsPerMonth] = useState<number>(2);
  const [discountPercentageOnOthers, setDiscountPercentageOnOthers] = useState<number>(10);
  const [includedServicesDescription, setIncludedServicesDescription] = useState('');
  const [planInfinitePayUrl, setPlanInfinitePayUrl] = useState('');
  const [planPopular, setPlanPopular] = useState(false);
  const [planActive, setPlanActive] = useState(true);
  const [planBenefits, setPlanBenefits] = useState<string[]>([]);

  const handleAddBenefit = (text = '') => {
    setPlanBenefits((prev) => [...prev, text]);
  };

  const handleUpdateBenefit = (index: number, text: string) => {
    setPlanBenefits((prev) => {
      const copy = [...prev];
      copy[index] = text;
      return copy;
    });
  };

  const handleRemoveBenefit = (index: number) => {
    setPlanBenefits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveBenefit = (index: number, direction: 'up' | 'down') => {
    setPlanBenefits((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // QR Code preview modal
  const [qrModal, setQrModal] = useState<{ title: string; url: string } | null>(null);

  // Manual Subscription Activation Modal
  const [isManualActivationModalOpen, setIsManualActivationModalOpen] = useState(false);
  const [manualSelectedUserId, setManualSelectedUserId] = useState('');
  const [manualSelectedPlanId, setManualSelectedPlanId] = useState('');
  const [manualPaymentNote, setManualPaymentNote] = useState('Pago em dinheiro na barbearia');
  const [isActivatingManual, setIsActivatingManual] = useState(false);
  const [manualActivationMsg, setManualActivationMsg] = useState('');

  // Webhook InfinitePay state
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  const defaultWebhookUrl = infinitePayConfig.serverWebhookUrl || (isGitHubPages
    ? 'https://ais-pre-pov473yuxfbnsvikwv5lt2-381752577235.us-east5.run.app/api/webhooks/infinitepay'
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/infinitepay`);

  const [serverWebhookUrlInput, setServerWebhookUrlInput] = useState(defaultWebhookUrl);
  const webhookUrl = serverWebhookUrlInput || defaultWebhookUrl;

  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [webhookHealth, setWebhookHealth] = useState<{ status: string; latency?: number; time?: string; note?: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Webhook Simulator state
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simUserId, setSimUserId] = useState('');
  const [simOrderNsu, setSimOrderNsu] = useState('');
  const [simPaidAmount, setSimPaidAmount] = useState('89.90');
  const [simCaptureMethod, setSimCaptureMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [simInvoiceSlug, setSimInvoiceSlug] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Raw JSON Inspection Modal
  const [selectedRawPayload, setSelectedRawPayload] = useState<any | null>(null);

  // Unified real-time webhook events list (backed by Firestore)
  const displayWebhookEvents = (firestoreWebhookEvents && firestoreWebhookEvents.length > 0)
    ? firestoreWebhookEvents
    : [];

  const testWebhookHealth = async () => {
    setIsCheckingHealth(true);
    const start = performance.now();
    try {
      const result = await safeJsonFetch(webhookUrl);
      const elapsed = Math.round(performance.now() - start);
      if (result.ok) {
        setWebhookHealth({ status: 'online', latency: elapsed, time: new Date().toLocaleTimeString('pt-BR') });
      } else if (result.isHtml) {
        setWebhookHealth({
          status: 'github_pages',
          latency: elapsed,
          time: new Date().toLocaleTimeString('pt-BR'),
          note: 'Hospedagem estática (GitHub Pages). Use a URL Cloud Run para o webhook bancário externo.',
        });
      } else {
        setWebhookHealth({ status: 'offline', latency: elapsed, time: new Date().toLocaleTimeString('pt-BR') });
      }
    } catch {
      setWebhookHealth({ status: 'offline' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleClearWebhookLogs = async () => {
    if (!window.confirm('Tem certeza que deseja limpar o histórico de eventos de webhook no Firebase Firestore?')) return;
    try {
      await clearWebhookEvents();
    } catch (err) {
      console.error('Falha ao limpar logs', err);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 3000);
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simOrderNsu.trim()) {
      setSimFeedback({ type: 'error', message: 'Informe o order_nsu do pedido para teste!' });
      return;
    }

    setIsSimulating(true);
    setSimFeedback(null);

    // Identifica o usuário de destino para isolamento rigoroso
    const matchedUser =
      users.find((u) => u.id === simUserId) ||
      users.find((u) => u.pendingOrderNsu && u.pendingOrderNsu.trim().toLowerCase() === simOrderNsu.trim().toLowerCase()) ||
      users.find((u) => u.order_nsu && u.order_nsu.trim().toLowerCase() === simOrderNsu.trim().toLowerCase()) ||
      users.find((u) => simOrderNsu.toLowerCase().includes(u.id.toLowerCase()));

    const targetUserId = matchedUser?.id || simUserId || undefined;

    const testEvent: InfinitePayWebhookEvent = {
      id: `ev-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: targetUserId,
      invoice_slug: simInvoiceSlug.trim() || `inv_sim_${Math.floor(100000 + Math.random() * 900000)}`,
      order_nsu: simOrderNsu.trim(),
      paid_amount: parseFloat(simPaidAmount.replace(',', '.')) || 89.9,
      capture_method: simCaptureMethod,
      transaction_nsu: `tx_sim_${Math.floor(10000000 + Math.random() * 90000000)}`,
      receivedAt: new Date().toISOString(),
      status: 'PROCESSED',
      rawBody: {
        userId: targetUserId,
        invoice_slug: simInvoiceSlug.trim() || `inv_sim_${Date.now()}`,
        order_nsu: simOrderNsu.trim(),
        paid_amount: parseFloat(simPaidAmount.replace(',', '.')) || 89.9,
        capture_method: simCaptureMethod,
        transaction_nsu: `tx_sim_${Date.now()}`,
        simulated: true,
      },
    };

    try {
      // 1. Grava no subcollection /users/{userId}/webhook_events e no ledger central
      await recordWebhookEvent(testEvent, targetUserId);

      // 2. Also forward safely to configured server endpoint if reachable
      try {
        await safeJsonFetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testEvent),
        });
      } catch {
        // Safe ignore
      }

      setSimFeedback({
        type: 'success',
        message: `Webhook simulado com sucesso! Evento gravado no subcollection do cliente (${targetUserId || 'auto-detectado'}) com status: PROCESSED e order_nsu: "${testEvent.order_nsu}".`,
      });

      setTimeout(() => {
        setIsSimModalOpen(false);
        setSimFeedback(null);
      }, 2500);
    } catch (err: any) {
      setSimFeedback({
        type: 'error',
        message: err?.message || 'Erro ao registrar evento no Firebase Firestore.',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleManualActivateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSelectedUserId || !manualSelectedPlanId) {
      setManualActivationMsg('Selecione o cliente e o plano para ativar!');
      return;
    }

    setIsActivatingManual(true);
    setManualActivationMsg('');

    try {
      await subscribeUserToPlan(manualSelectedUserId, manualSelectedPlanId, {
        orderNsu: `MANUAL-ADM-${Date.now().toString().slice(-6)}`,
        transactionNsu: `TX-ADM-${Date.now().toString().slice(-6)}`,
        paymentMethod: 'PIX',
      });
      setManualActivationMsg('Assinatura ativada com sucesso para o cliente!');
      setTimeout(() => {
        setIsManualActivationModalOpen(false);
        setManualActivationMsg('');
        setManualSelectedUserId('');
        setManualSelectedPlanId('');
      }, 1800);
    } catch (err: any) {
      setManualActivationMsg(err?.message || 'Erro ao ativar assinatura.');
    } finally {
      setIsActivatingManual(false);
    }
  };

  useEffect(() => {
    testWebhookHealth();
  }, []);

  useEffect(() => {
    if (infinitePayConfig.plansSubtitle) {
      setPlansSubtitle(infinitePayConfig.plansSubtitle);
    }
    if (infinitePayConfig.guaranteeBannerText) {
      setGuaranteeBannerText(infinitePayConfig.guaranteeBannerText);
    }
  }, [infinitePayConfig.plansSubtitle, infinitePayConfig.guaranteeBannerText]);

  // Calculations & stats
  const activeSubscribers = (users || []).filter((u) => Boolean(u.subscriptionId));
  const activePlansCount = (plans || []).filter((p) => p.isActive !== false).length;
  const mrr = activeSubscribers.reduce((sum, u) => {
    const plan = (plans || []).find((p) => p.id === u.subscriptionId);
    return sum + (plan?.monthlyPrice || 0);
  }, 0);

  const handleSaveInfinitePay = (e: React.FormEvent) => {
    e.preventDefault();
    updateInfinitePayConfig({
      merchantName: merchantName.trim(),
      defaultUrl: defaultUrl.trim(),
      enabled,
      notes: notes.trim(),
      serverWebhookUrl: serverWebhookUrlInput.trim(),
      plansSubtitle: plansSubtitle.trim(),
      guaranteeBannerText: guaranteeBannerText.trim(),
    });
    setSaveSuccessMsg('Configurações salvas com sucesso!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleSavePresentationTexts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updateInfinitePayConfig({
      plansSubtitle: plansSubtitle.trim(),
      guaranteeBannerText: guaranteeBannerText.trim(),
    });
    setSaveTextsSuccessMsg('Subtítulo e banner de garantia salvos com sucesso!');
    setTimeout(() => setSaveTextsSuccessMsg(''), 4000);
  };

  const handleResetDefaultTexts = () => {
    const defaultSub =
      'Economize até 50% em relação a cortes avulsos, tenha prioridade na agenda e pague com segurança no cartão ou PIX.';
    const defaultGuarantee =
      'Cobrança recorrente no Cartão de Crédito ou PIX com segurança garantida. Sem fidelidade, cancele quando desejar.';
    setPlansSubtitle(defaultSub);
    setGuaranteeBannerText(defaultGuarantee);
  };

  const handleCopyLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDescription('');
    setMonthlyPrice(89.9);
    setIsUnlimitedBookings(false);
    setMaxBookingsPerMonth(2);
    setDiscountPercentageOnOthers(15);
    setIncludedServicesDescription('2 Cortes de Cabelo por mês + 15% de desconto em outros serviços');
    setPlanBenefits([
      '2 Cortes de Cabelo por mês inclusos',
      '15% de desconto em produtos & outros serviços',
      'Agendamento prioritário no app'
    ]);
    setPlanInfinitePayUrl('');
    setPlanPopular(false);
    setPlanActive(true);
    setIsCreating(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description);
    setMonthlyPrice(plan.monthlyPrice);
    setIsUnlimitedBookings(plan.maxBookingsPerMonth === -1);
    setMaxBookingsPerMonth(plan.maxBookingsPerMonth === -1 ? 4 : plan.maxBookingsPerMonth);
    setDiscountPercentageOnOthers(plan.discountPercentageOnOthers || 0);
    setIncludedServicesDescription(plan.includedServicesDescription || '');
    
    // Obter lista flexível de benefícios
    const currentBenefits = getPlanBenefits(plan);
    setPlanBenefits(currentBenefits.length > 0 ? [...currentBenefits] : ['']);

    setPlanInfinitePayUrl(plan.infinitePayUrl || '');
    setPlanPopular(Boolean(plan.popular));
    setPlanActive(plan.isActive !== false);
    setIsCreating(false);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const computedMaxBookings = isUnlimitedBookings ? -1 : Math.max(1, Number(maxBookingsPerMonth));
    const cleanBenefits = planBenefits.map((b) => b.trim()).filter(Boolean);

    const planPayload = {
      name: planName.trim(),
      description: planDescription.trim(),
      monthlyPrice: Number(monthlyPrice),
      maxBookingsPerMonth: computedMaxBookings,
      discountPercentageOnOthers: Number(discountPercentageOnOthers) || 0,
      includedServicesDescription: cleanBenefits[0] || includedServicesDescription.trim() || 'Benefícios inclusos no plano',
      benefits: cleanBenefits.length > 0 ? cleanBenefits : undefined,
      infinitePayUrl: planInfinitePayUrl.trim() || undefined,
      popular: planPopular,
      isActive: planActive,
    };

    if (isCreating) {
      addPlan(planPayload);
      setIsCreating(false);
    } else if (editingPlan) {
      updatePlan(editingPlan.id, planPayload);
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    const subscribersCount = (users || []).filter((u) => u.subscriptionId === plan.id).length;
    if (subscribersCount > 0) {
      if (!confirm(`Atenção: Existem ${subscribersCount} cliente(s) vinculados a este plano. Deseja realmente excluí-lo?`)) {
        return;
      }
    } else if (!confirm(`Deseja excluir o plano "${plan.name}"?`)) {
      return;
    }
    deletePlan(plan.id);
  };

  const handleTogglePlanStatus = (plan: SubscriptionPlan) => {
    updatePlan(plan.id, { isActive: plan.isActive === false ? true : false });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Planos Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {activePlansCount} <span className="text-xs font-normal text-slate-400">/ {plans.length} cadastrados</span>
          </p>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assinantes Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">{activeSubscribers.length}</p>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Receita Recorrente (MRR)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            R$ {mrr.toFixed(2).replace('.', ',')}
            <span className="text-xs font-normal text-slate-400">/mês</span>
          </p>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Carteira InfinitePay</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-sm font-bold text-white">
              {enabled ? 'Pagamento Ativo' : 'Desativado'}
            </span>
          </div>
        </div>
      </div>

      {/* InfinitePay Digital Wallet Configuration Section */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#1a2333] to-[#0f172a] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Carteira Digital & Cartão de Crédito
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  InfinitePay
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Integração InfinitePay para Assinaturas e Atendimentos
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Configure o link da sua carteira digital InfinitePay. O cliente poderá efetuar o pagamento da assinatura ou agendamento via cartão de crédito com aprovação instantânea e recebimento direto na sua conta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {defaultUrl && (
              <>
                <button
                  type="button"
                  onClick={() => setQrModal({ title: 'Link InfinitePay da Barbearia', url: defaultUrl })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  title="Ver QR Code para escanear"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Ver QR Code</span>
                </button>
                <a
                  href={defaultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Testar Link</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* InfinitePay Settings Form */}
        <form onSubmit={handleSaveInfinitePay} className="mt-6 space-y-5">
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nome do Estabelecimento / Vendedor na InfinitePay
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Ex: Lucas Hoffmann Barber"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Exibido para o cliente no momento do checkout.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Link Padrão da Carteira Digital / Link de Pagamento InfinitePay
              </label>
              <div className="relative flex items-center">
                <input
                  type="url"
                  value={defaultUrl}
                  onChange={(e) => setDefaultUrl(e.target.value)}
                  placeholder="https://pay.infinitepay.io/seu-estabelecimento"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(defaultUrl)}
                  className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Copiar Link"
                >
                  {copiedUrl === defaultUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {defaultUrl.includes('/api/webhooks') && (
                <div className="mt-2 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Atenção: Você colou a URL do Webhook no campo de Link de Pagamento!</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    O <strong>Link de Pagamento</strong> é a página onde o cliente passa o cartão (ex: <code>https://checkout.infinitepay.io/pedrobs/rzA7EVK6oE</code>). A URL do Webhook (Vercel) deve ficar na seção azul abaixo para receber as notificações da InfinitePay.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDefaultUrl('https://checkout.infinitepay.io/pedrobs/rzA7EVK6oE')}
                    className="px-2.5 py-1 rounded bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 text-[11px] font-bold border border-amber-500/50 transition cursor-pointer"
                  >
                    Usar Link Correto da InfinitePay (checkout.infinitepay.io/pedrobs/...)
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Utilizado como link padrão de pagamento com cartão de crédito se o plano não tiver um link específico (ex: link do checkout da InfinitePay).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mensagem ou Orientações para o Cliente
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pagamento no cartão de crédito via carteira digital InfinitePay."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">Habilitar Opção de Cartão via InfinitePay</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Permite que clientes escolham pagar planos e agendamentos pelo link digital.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações da InfinitePay</span>
            </button>
          </div>
        </form>
      </div>

      {/* Real-time InfinitePay Webhook Section */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#162033] to-[#0f172a] border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Webhook em Tempo Real
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Status 200 OK
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                URL do Webhook InfinitePay
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Cadastre a URL abaixo na API ou painel da InfinitePay. Assim que o cliente pagar a assinatura ou serviço com cartão de crédito ou PIX, o banco envia um POST automático liberando o acesso instantaneamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={testWebhookHealth}
              disabled={isCheckingHealth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Testar conexão do servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{isCheckingHealth ? 'Testando...' : 'Testar Ping'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSimOrderNsu(`SUB-CLI-${Math.floor(1000 + Math.random() * 9000)}`);
                setSimPaidAmount('89.90');
                setSimCaptureMethod('credit_card');
                setSimInvoiceSlug(`inv_${Math.floor(100000 + Math.random() * 900000)}`);
                setSimFeedback(null);
                setIsSimModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simular Webhook da InfinitePay</span>
            </button>
          </div>
        </div>

        {/* Big Webhook URL Display with 1-Click Copy */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              URL Oficial do Webhook (Endpoint POST):
            </span>
            {webhookHealth && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    webhookHealth.status === 'online'
                      ? 'bg-emerald-400'
                      : webhookHealth.status === 'github_pages'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`} />
                  {webhookHealth.status === 'online'
                    ? `Online (${webhookHealth.latency}ms)`
                    : webhookHealth.status === 'github_pages'
                    ? 'Hospedagem Estática'
                    : 'Servidor Offline'}
                </span>
              </div>
            )}
          </div>

          {/* Vercel Free Webhook Setup Helper */}
          <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/60 border border-blue-500/30 rounded-2xl text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Integração Gratuita com Vercel (Sem Cartão de Crédito)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                100% Grátis • Plano Hobby
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              O GitHub Pages é uma hospedagem estática e não recebe requisições POST externas de bancos. Criamos no seu projeto o arquivo <code className="text-cyan-300 font-mono bg-slate-950 px-1 py-0.5 rounded">/api/webhooks/infinitepay.ts</code> pronto para a Vercel. Quando a InfinitePay notificar a Vercel, ela grava diretamente no seu <strong>Firebase Firestore</strong> e libera o acesso do cliente no GitHub Pages instantaneamente!
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                <span>Passo a passo:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                  1. Conecte seu GitHub na <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Vercel.com</a>
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                  2. Clique em <strong>Import</strong> do repositório
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                  3. Cole a URL do seu projeto Vercel abaixo:
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
              <input
                type="text"
                placeholder="Ex: minha-barbearia.vercel.app"
                onChange={(e) => {
                  const val = e.target.value.trim().replace(/^https?:\/\//, '').replace(/\/api\/webhooks\/infinitepay\/?$/, '').replace(/\/$/, '');
                  if (val) {
                    setServerWebhookUrlInput(`https://${val}/api/webhooks/infinitepay`);
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => {
                  setServerWebhookUrlInput('https://meu-projeto.vercel.app/api/webhooks/infinitepay');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition shrink-0"
              >
                Preencher Exemplo
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={serverWebhookUrlInput}
                onChange={(e) => setServerWebhookUrlInput(e.target.value)}
                placeholder="https://seu-projeto.vercel.app/api/webhooks/infinitepay"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-cyan-300 select-all focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleCopyWebhookUrl}
                className={`px-5 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 ${
                  copiedWebhookUrl
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                }`}
              >
                {copiedWebhookUrl ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>URL Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar URL do Webhook</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Esta é a URL que deve ser informada no painel ou webhook da InfinitePay para confirmações automáticas no cartão.
            </p>
          </div>
        </div>

        {/* Bank Specifications Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900/90 border border-slate-800/90 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono font-bold uppercase text-cyan-400">invoice_slug</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Código da Fatura</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Identificador da cobrança gerada na InfinitePay.</p>
          </div>

          <div className="bg-slate-900/90 border border-cyan-500/40 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono font-bold uppercase text-amber-400">order_nsu</div>
            <div className="text-xs font-semibold text-white mt-1">Número do Pedido</div>
            <p className="text-[11px] text-slate-300 mt-0.5">ID do plano/cliente validado pelo servidor para liberar acesso.</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono font-bold uppercase text-emerald-400">paid_amount</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Valor Pago (R$)</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Total confirmado pela operadora de cartão ou PIX.</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono font-bold uppercase text-purple-400">capture_method</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Forma de Pagamento</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tipo: <code className="text-purple-300">credit_card</code> ou <code className="text-purple-300">pix</code>.</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono font-bold uppercase text-blue-400">transaction_nsu</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">NSU da Transação</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Comprovante e ID bancário único da operação.</p>
          </div>
        </div>

        {/* Live Received Webhook Events Table */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Eventos Recebidos da InfinitePay em Tempo Real
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {displayWebhookEvents.length} {displayWebhookEvents.length === 1 ? 'notificação' : 'notificações'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={testWebhookHealth}
                disabled={isCheckingHealth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Testar Conexão"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
              {displayWebhookEvents.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearWebhookLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 text-[11px] font-semibold border border-slate-700 hover:border-rose-700/50 transition"
                >
                  Limpar Logs
                </button>
              )}
            </div>
          </div>

          {displayWebhookEvents.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-900/50 rounded-xl border border-slate-800/80">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-slate-300">Nenhuma notificação recebida ainda</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                O webhook sincroniza com o Firebase Firestore em tempo real. Você pode clicar no botão <strong>"Simular Webhook da InfinitePay"</strong> acima para testar o recebimento e validação agora mesmo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-semibold">Data / Hora</th>
                    <th className="pb-2.5 font-semibold">Cliente Destinatário</th>
                    <th className="pb-2.5 font-semibold">Order NSU</th>
                    <th className="pb-2.5 font-semibold">Transaction NSU</th>
                    <th className="pb-2.5 font-semibold">Forma</th>
                    <th className="pb-2.5 font-semibold">Valor</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayWebhookEvents.map((ev) => {
                    const matchedClient = ev.userId ? users.find((u) => u.id === ev.userId) : null;
                    return (
                      <tr key={ev.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">
                          {new Date(ev.receivedAt).toLocaleTimeString('pt-BR')}
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(ev.receivedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {matchedClient ? (
                            <div>
                              <span className="font-bold text-white text-xs block truncate max-w-[130px]">
                                {matchedClient.name}
                              </span>
                              <span className="text-[10px] text-cyan-400 font-mono block truncate max-w-[130px]">
                                {matchedClient.id}
                              </span>
                            </div>
                          ) : ev.userId ? (
                            <span className="font-mono text-cyan-400 text-[11px]">{ev.userId}</span>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">Não associado</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-cyan-300 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px] select-all" title={ev.order_nsu}>
                              {ev.order_nsu}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(ev.order_nsu)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                              title="Copiar Order NSU"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      <td className="py-2.5 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[120px] select-all" title={ev.transaction_nsu || ''}>
                            {ev.transaction_nsu || '-'}
                          </span>
                          {ev.transaction_nsu && (
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(ev.transaction_nsu || '')}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                              title="Copiar Transaction NSU"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {ev.invoice_slug && (
                          <span className="text-[10px] text-slate-500 block">
                            Fatura: {ev.invoice_slug}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.capture_method?.toLowerCase().includes('pix')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          <CreditCard className="w-3 h-3" />
                          {ev.capture_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-white">
                        {ev.paid_amount !== undefined
                          ? `R$ ${Number(ev.paid_amount).toFixed(2).replace('.', ',')}`
                          : '-'}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          200 OK Processado
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        {ev.transaction_nsu && ev.transaction_nsu.length > 10 && (
                          <a
                            href={ev.receipt_url || `https://recibo.infinitepay.io/${ev.transaction_nsu}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20 transition inline-flex items-center gap-1"
                            title="Abrir Recibo Oficial"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Recibo</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRawPayload(ev.rawBody)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition inline-flex items-center gap-1"
                          title="Inspecionar JSON bruto recebido"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>JSON</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customization of Client Subscription Modal Presentation (Subtitle and Guarantee Banner) */}
      <div className="bg-gradient-to-br from-[#1e293b] via-[#1a2333] to-[#0f172a] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-extrabold shadow-xl shadow-amber-500/20">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Apresentação ao Cliente
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Modal de Assinaturas
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Subtítulo dos Planos e Banner de Garantia
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Personalize os textos exibidos no cabeçalho e no rodapé da janela de planos quando o cliente vai assinar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaultTexts}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Restaurar textos padrão recomendados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurar Padrão</span>
            </button>
            <button
              type="button"
              onClick={handleSavePresentationTexts}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Textos</span>
            </button>
          </div>
        </div>

        {saveTextsSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveTextsSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Subtitle Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Subtítulo do Cabeçalho dos Planos
              </label>
              <span className="text-[10px] text-amber-400 font-semibold">Topo do modal</span>
            </div>
            <textarea
              rows={3}
              value={plansSubtitle}
              onChange={(e) => setPlansSubtitle(e.target.value)}
              placeholder="Ex: Economize até 50% em relação a cortes avulsos, tenha prioridade na agenda e pague com segurança no cartão ou PIX."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Frase exibida logo abaixo do título <em>"Visual Impecável O Ano Todo"</em>.
            </p>
          </div>

          {/* Guarantee Banner Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Texto do Banner de Garantia & Segurança
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Rodapé do modal</span>
            </div>
            <textarea
              rows={3}
              value={guaranteeBannerText}
              onChange={(e) => setGuaranteeBannerText(e.target.value)}
              placeholder="Ex: Cobrança recorrente no Cartão de Crédito ou PIX com segurança garantida. Sem fidelidade, cancele quando desejar."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Frase exibida dentro da caixa com ícone de escudo verde ao final dos planos.
            </p>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Pré-visualização como o Cliente Vê no Modal</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            {/* Header preview */}
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold mb-1">
                <Crown className="w-3 h-3" />
                Clube de Assinatura Lucas Hoffmann
              </div>
              <h4 className="text-base font-extrabold text-white">Visual Impecável O Ano Todo</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                {plansSubtitle || (
                  <span className="italic text-slate-600">Nenhum subtítulo definido</span>
                )}
              </p>
            </div>

            {/* Banner preview */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2.5 text-xs text-slate-300 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {guaranteeBannerText || (
                  <span className="italic text-slate-600">Nenhum texto de garantia definido</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Planos de Assinatura (Clubes de Benefício)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina os pacotes mensais, limites de cortes, descontos e links de cobrança no cartão.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Plano de Assinatura</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const subscribersCount = (users || []).filter((u) => u.subscriptionId === plan.id).length;
            const isInactive = plan.isActive === false;
            const effectivePaymentUrl = plan.infinitePayUrl || infinitePayConfig.defaultUrl;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between relative transition ${
                  isInactive
                    ? 'bg-slate-900/50 border-slate-800/60 opacity-70'
                    : plan.popular
                    ? 'bg-gradient-to-b from-[#2d281e] to-[#1e293b] border-amber-500 shadow-xl shadow-amber-500/10'
                    : 'bg-[#1e293b] border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {plan.popular && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow">
                        Mais Popular
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isInactive
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isInactive ? 'Inativo' : 'Ativo'}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <strong>{subscribersCount}</strong> assinante(s)
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>

                  <div className="mt-4 mb-4 flex items-baseline gap-1">
                    <span className="text-xs text-slate-400">R$</span>
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {plan.monthlyPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-slate-400">/mês</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                    {getPlanBenefits(plan).map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* InfinitePay Link status for this plan */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        Link de Pagamento do Plano:
                      </span>
                      {plan.infinitePayUrl ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">Exclusivo</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Padrão da Barbearia</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate font-mono select-all">
                      {effectivePaymentUrl || 'Nenhum link configurado'}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
                      {effectivePaymentUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(effectivePaymentUrl)}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition"
                          >
                            {copiedUrl === effectivePaymentUrl ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar Link</span>
                              </>
                            )}
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => setQrModal({ title: `Link de Pagamento - ${plan.name}`, url: effectivePaymentUrl })}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>QR Code</span>
                          </button>
                          <span className="text-slate-600">•</span>
                          <a
                            href={effectivePaymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Card Actions */}
                <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePlanStatus(plan)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                      isInactive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isInactive ? 'Ativar Plano' : 'Desativar'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Editar Plano"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition border border-rose-500/20"
                      title="Excluir Plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Subscribers List Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Clientes com Assinatura Ativa
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize quem são os membros cadastrados, plano contratado e canal direto via WhatsApp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setManualSelectedUserId('');
                setManualSelectedPlanId(plans[0]?.id || '');
                setManualPaymentNote('Pago em dinheiro na barbearia');
                setManualActivationMsg('');
                setIsManualActivationModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ativar Assinatura Manual</span>
            </button>
            <span className="text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              Total: {activeSubscribers.length} assinante(s)
            </span>
          </div>
        </div>

        {activeSubscribers.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Nenhum cliente possui assinatura ativa no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">Cliente</th>
                  <th className="pb-3 px-3">Telefone / E-mail</th>
                  <th className="pb-3 px-3">Plano Contratado</th>
                  <th className="pb-3 px-3">Mensalidade</th>
                  <th className="pb-3 px-3">Início da Assinatura</th>
                  <th className="pb-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSubscribers.map((subscriber) => {
                  const plan = (plans || []).find((p) => p.id === subscriber.subscriptionId);
                  const cleanPhone = subscriber.phone ? subscriber.phone.replace(/\D/g, '') : '';
                  const whatsAppLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

                  return (
                    <tr key={subscriber.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs">
                            {subscriber.name.charAt(0)}
                          </div>
                          <span className="font-bold text-white">{subscriber.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        <div>{subscriber.phone}</div>
                        <div className="text-[11px] text-slate-500">{subscriber.email}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
                          {plan?.name || 'Plano Personalizado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                        R$ {(plan?.monthlyPrice || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {subscriber.subscriptionStartDate
                          ? subscriber.subscriptionStartDate.split('-').reverse().join('/')
                          : 'Recente'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {whatsAppLink && (
                            <a
                              href={whatsAppLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1"
                              title="Conversar no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">WhatsApp</span>
                            </a>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente cancelar a assinatura de ${subscriber.name}?`)) {
                                cancelUserSubscription(subscriber.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold transition"
                            title="Cancelar Assinatura"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Create / Edit Subscription Plan */}
      {(isCreating || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingPlan(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isCreating ? 'Criar Novo Plano de Assinatura' : 'Editar Plano de Assinatura'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure as regras, valor mensal e o link de pagamento seguro.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome do Plano *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Ex: Clube VIP Lucas Hoffmann, Clube Essencial, Clube Barba"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descrição Curta *</label>
                <input
                  type="text"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Ex: Cortes e Barba ilimitados com máxima comodidade"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Valor Mensal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Desconto em Outros Serviços/Produtos (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentageOnOthers}
                    onChange={(e) => setDiscountPercentageOnOthers(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Booking limits */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Cortes / Agendamentos Inclusos por Mês</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnlimitedBookings}
                      onChange={(e) => setIsUnlimitedBookings(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-amber-400">Ilimitado</span>
                  </label>
                </div>

                {!isUnlimitedBookings && (
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={maxBookingsPerMonth}
                      onChange={(e) => setMaxBookingsPerMonth(parseInt(e.target.value) || 1)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-center focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-slate-400 text-[11px]">agendamentos inclusos sem cobrança adicional</span>
                  </div>
                )}
              </div>

              {/* Descrições e Benefícios Personalizados do Plano (Flexível) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Descrições & Vantagens Abaixo do Preço *
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Você tem total liberdade para adicionar quantas descrições quiser com o texto que desejar. Cada linha aparecerá com o ícone (✓) abaixo do preço.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddBenefit('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                {/* Sugestões rápidas para facilitar o cadastro */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-2">Sugestões rápidas (clique para incluir):</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[
                      'Cortes & Barbas ILIMITADOS no mês',
                      '2 Cortes de Cabelo por mês',
                      '4 Barboterapias completas com toalha quente no mês',
                      '15% de desconto em pomadas, óleos e balms',
                      '1 Bebida especial cortesia a cada visita',
                      'Atendimento VIP prioritário sem fila',
                      'Lavagem especial e alinhamento de fios'
                    ].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddBenefit(sug)}
                        className="text-[10px] bg-slate-800/90 hover:bg-slate-700 hover:text-amber-300 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/80 transition flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5 text-amber-400" />
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista dinâmica de benefícios */}
                <div className="space-y-2 pt-2">
                  {planBenefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-950/90 p-2 rounded-xl border border-slate-800 focus-within:border-amber-500/60 transition group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>

                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleUpdateBenefit(idx, e.target.value)}
                        placeholder={`Ex: Benefício ou vantagem #${idx + 1}...`}
                        className="flex-1 bg-transparent border-0 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-0"
                      />

                      {/* Reordenar para Cima */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveBenefit(idx, 'up')}
                        title="Mover para cima"
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      {/* Reordenar para Baixo */}
                      <button
                        type="button"
                        disabled={idx === planBenefits.length - 1}
                        onClick={() => handleMoveBenefit(idx, 'down')}
                        title="Mover para baixo"
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Excluir Linha */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        title="Excluir este benefício"
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {planBenefits.length === 0 && (
                    <div className="text-center py-4 px-3 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      Nenhuma descrição cadastrada. Clique em <strong className="text-amber-400 font-bold">"Adicionar Linha"</strong> ou escolha uma sugestão rápida acima para personalizar!
                    </div>
                  )}
                </div>
              </div>

              {/* Plan specific InfinitePay URL */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Link Específico de Pagamento para este Plano (Opcional)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Se vazio, usará o link padrão da barbearia
                  </span>
                </label>
                <input
                  type="url"
                  value={planInfinitePayUrl}
                  onChange={(e) => setPlanInfinitePayUrl(e.target.value)}
                  placeholder="https://pay.infinitepay.io/barbearia-belchior/clube-especifico"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planPopular}
                    onChange={(e) => setPlanPopular(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <p className="font-bold text-white text-xs">Destacar como Mais Popular</p>
                    <p className="text-[10px] text-slate-400">Exibe selo dourado no card</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planActive}
                    onChange={(e) => setPlanActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <p className="font-bold text-white text-xs">Plano Ativo para Venda</p>
                    <p className="text-[10px] text-slate-400">Visível aos clientes no site</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition shadow-lg shadow-amber-500/20"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative text-slate-100">
            <button
              onClick={() => setQrModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">{qrModal.title}</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Escaneie com a câmera do celular ou app do seu banco para pagar com segurança via cartão ou PIX.
            </p>

            {/* Generated QR Code via Google Chart / QR Server API */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-4 border-4 border-emerald-500/20">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrModal.url)}`}
                alt="QR Code de Pagamento Seguro"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <p className="text-[11px] font-mono text-slate-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800 mb-4 select-all">
              {qrModal.url}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(qrModal.url)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
              >
                {copiedUrl === qrModal.url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl === qrModal.url ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
              <a
                href={qrModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Link</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* InfinitePay Webhook Simulator Modal */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsSimModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Simular Webhook da InfinitePay</h3>
                <p className="text-[11px] text-slate-400">Dispara um POST real para <code className="text-cyan-300">/api/webhooks/infinitepay</code></p>
              </div>
            </div>

            {simFeedback && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                simFeedback.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
              }`}>
                {simFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{simFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSimulateWebhook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Cliente Específico (Isolamento de Webhook por Usuário)
                </label>
                <select
                  value={simUserId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setSimUserId(chosenId);
                    const sel = users.find((u) => u.id === chosenId);
                    if (sel?.pendingOrderNsu) {
                      setSimOrderNsu(sel.pendingOrderNsu);
                    } else if (sel?.order_nsu) {
                      setSimOrderNsu(sel.order_nsu);
                    } else if (chosenId) {
                      setSimOrderNsu(`ORD_${chosenId}_${Date.now().toString(36)}`);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Detectar automaticamente ou usuário avulso --</option>
                  {users
                    .filter((u) => u.role !== 'ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id}) {u.pendingOrderNsu ? `[Pendente: ${u.pendingOrderNsu}]` : ''}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ao escolher um cliente, o webhook é gravado exclusivamente na subcoleção dele <code className="text-cyan-400">/users/{'{userId}'}/webhook_events</code>.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  order_nsu (Número do Pedido / Identificador da Assinatura) *
                </label>
                <input
                  type="text"
                  value={simOrderNsu}
                  onChange={(e) => setSimOrderNsu(e.target.value)}
                  placeholder="Ex: SUB-CLI-4920"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Valor Pago (R$)</label>
                  <input
                    type="text"
                    value={simPaidAmount}
                    onChange={(e) => setSimPaidAmount(e.target.value)}
                    placeholder="89.90"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Forma de Pagamento</label>
                  <select
                    value={simCaptureMethod}
                    onChange={(e) => setSimCaptureMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">invoice_slug (Código da Fatura Opcional)</label>
                <input
                  type="text"
                  value={simInvoiceSlug}
                  onChange={(e) => setSimInvoiceSlug(e.target.value)}
                  placeholder="inv_938120"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSimulating ? 'Enviando...' : 'Enviar POST de Teste'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raw JSON Inspector Modal */}
      {selectedRawPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setSelectedRawPayload(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white">Payload JSON Bruto Recebido</h3>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-72 border border-slate-800">
              {JSON.stringify(selectedRawPayload, null, 2)}
            </pre>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRawPayload(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manual Subscription Activation Modal */}
      {isManualActivationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsManualActivationModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ativar Assinatura Manual</h3>
                <p className="text-xs text-slate-400">Para clientes que pagaram em dinheiro, maquininha ou direto no balcão</p>
              </div>
            </div>

            {manualActivationMsg && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-semibold ${
                manualActivationMsg.includes('sucesso')
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {manualActivationMsg}
              </div>
            )}

            <form onSubmit={handleManualActivateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Selecione o Cliente</label>
                <select
                  value={manualSelectedUserId}
                  onChange={(e) => setManualSelectedUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Escolha um cliente cadastrado --</option>
                  {(users || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} {u.phone ? `(${u.phone})` : ''} {u.subscriptionId ? '• [Já é Assinante]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Selecione o Plano</label>
                <select
                  value={manualSelectedPlanId}
                  onChange={(e) => setManualSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Escolha o plano contratado --</option>
                  {(plans || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {p.monthlyPrice.toFixed(2).replace('.', ',')}/mês
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Observação do Pagamento</label>
                <input
                  type="text"
                  value={manualPaymentNote}
                  onChange={(e) => setManualPaymentNote(e.target.value)}
                  placeholder="Ex: Dinheiro no balcão, PIX direto na maquininha..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualActivationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isActivatingManual}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isActivatingManual ? 'Ativando...' : 'Confirmar e Ativar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
