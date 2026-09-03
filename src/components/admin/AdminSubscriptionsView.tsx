import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan } from '../../types';
import {
  Crown,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
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
  } = useApp();

  // InfinitePay form state
  const [merchantName, setMerchantName] = useState(infinitePayConfig.merchantName || 'Barbearia Belchior');
  const [defaultUrl, setDefaultUrl] = useState(infinitePayConfig.defaultUrl || 'https://pay.infinitepay.io/barbearia-belchior');
  const [enabled, setEnabled] = useState(infinitePayConfig.enabled ?? true);
  const [notes, setNotes] = useState(infinitePayConfig.notes || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
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

  // QR Code preview modal
  const [qrModal, setQrModal] = useState<{ title: string; url: string } | null>(null);

  // Webhook InfinitePay state
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/infinitepay`
    : 'https://seu-dominio/api/webhooks/infinitepay';

  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [webhookHealth, setWebhookHealth] = useState<{ status: string; latency?: number; time?: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Webhook Simulator state
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simOrderNsu, setSimOrderNsu] = useState('');
  const [simPaidAmount, setSimPaidAmount] = useState('89.90');
  const [simCaptureMethod, setSimCaptureMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [simInvoiceSlug, setSimInvoiceSlug] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Raw JSON Inspection Modal
  const [selectedRawPayload, setSelectedRawPayload] = useState<any | null>(null);

  const fetchWebhookEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/webhooks/infinitepay/events');
      if (res.ok) {
        const data = await res.json();
        setWebhookEvents(data.events || []);
      }
    } catch (err) {
      console.error('Falha ao buscar eventos do webhook', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const testWebhookHealth = async () => {
    setIsCheckingHealth(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/webhooks/infinitepay');
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setWebhookHealth({ status: 'online', latency: elapsed, time: new Date().toLocaleTimeString('pt-BR') });
      } else {
        setWebhookHealth({ status: 'error', latency: elapsed });
      }
    } catch {
      setWebhookHealth({ status: 'offline' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleClearWebhookLogs = async () => {
    if (!window.confirm('Tem certeza que deseja limpar o histórico de eventos de webhook?')) return;
    try {
      await fetch('/api/webhooks/infinitepay/events', { method: 'DELETE' });
      setWebhookEvents([]);
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
    try {
      const res = await fetch('/api/webhooks/infinitepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_slug: simInvoiceSlug.trim() || `inv_sim_${Math.floor(100000 + Math.random() * 900000)}`,
          order_nsu: simOrderNsu.trim(),
          paid_amount: parseFloat(simPaidAmount.replace(',', '.')) || 89.9,
          capture_method: simCaptureMethod,
          transaction_nsu: `tx_sim_${Math.floor(10000000 + Math.random() * 90000000)}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSimFeedback({
          type: 'success',
          message: `Webhook recebido com sucesso (HTTP 200)! Pedido: "${data.order_nsu}", Transação: "${data.transaction_nsu}".`,
        });
        fetchWebhookEvents();
        setTimeout(() => {
          setIsSimModalOpen(false);
          setSimFeedback(null);
        }, 2200);
      } else {
        setSimFeedback({
          type: 'error',
          message: data.error || data.message || 'Erro ao processar webhook simulado (HTTP 400)',
        });
      }
    } catch (err: any) {
      setSimFeedback({
        type: 'error',
        message: err?.message || 'Falha de conexão com o endpoint do servidor.',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    fetchWebhookEvents();
    testWebhookHealth();
    const interval = setInterval(fetchWebhookEvents, 8000);
    return () => clearInterval(interval);
  }, []);

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
    });
    setSaveSuccessMsg('Configurações da InfinitePay salvas com sucesso!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
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
    setDiscountPercentageOnOthers(plan.discountPercentageOnOthers);
    setIncludedServicesDescription(plan.includedServicesDescription);
    setPlanInfinitePayUrl(plan.infinitePayUrl || '');
    setPlanPopular(Boolean(plan.popular));
    setPlanActive(plan.isActive !== false);
    setIsCreating(false);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const computedMaxBookings = isUnlimitedBookings ? -1 : Math.max(1, Number(maxBookingsPerMonth));

    const planPayload = {
      name: planName.trim(),
      description: planDescription.trim(),
      monthlyPrice: Number(monthlyPrice),
      maxBookingsPerMonth: computedMaxBookings,
      discountPercentageOnOthers: Number(discountPercentageOnOthers) || 0,
      includedServicesDescription: includedServicesDescription.trim(),
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
                placeholder="Ex: Barbearia Belchior"
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
              <p className="text-[11px] text-slate-500 mt-1">
                Utilizado como link padrão de pagamento com cartão de crédito se o plano não tiver um link específico.
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
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${webhookHealth.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {webhookHealth.status === 'online' ? `Online (${webhookHealth.latency}ms)` : 'Offline'}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-cyan-300 break-all select-all flex items-center">
              {webhookUrl}
            </div>
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
                {webhookEvents.length} {webhookEvents.length === 1 ? 'notificação' : 'notificações'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchWebhookEvents}
                disabled={loadingEvents}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
              {webhookEvents.length > 0 && (
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

          {webhookEvents.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-900/50 rounded-xl border border-slate-800/80">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-slate-300">Nenhuma notificação recebida ainda</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                O servidor está ativo e aguardando POSTs da InfinitePay. Você pode clicar no botão <strong>"Simular Webhook da InfinitePay"</strong> acima para testar o envio e validação agora mesmo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-semibold">Data / Hora</th>
                    <th className="pb-2.5 font-semibold">Order NSU</th>
                    <th className="pb-2.5 font-semibold">Transaction NSU</th>
                    <th className="pb-2.5 font-semibold">Forma</th>
                    <th className="pb-2.5 font-semibold">Valor</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {webhookEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 font-mono text-[11px] text-slate-400">
                        {new Date(ev.receivedAt).toLocaleTimeString('pt-BR')}
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(ev.receivedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-cyan-300 font-bold">
                        {ev.order_nsu}
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">
                        {ev.transaction_nsu || '-'}
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
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRawPayload(ev.rawBody)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition inline-flex items-center gap-1"
                          title="Inspecionar JSON bruto recebido"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>Ver JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{plan.includedServicesDescription}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>
                          {plan.maxBookingsPerMonth === -1 ? 'Cortes Ilimitados' : `${plan.maxBookingsPerMonth} cortes/mês`}
                        </strong>{' '}
                        inclusos com custo zero
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{plan.discountPercentageOnOthers}% de desconto em produtos & outros serviços</span>
                    </div>
                  </div>

                  {/* InfinitePay Link status for this plan */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        Link InfinitePay do Plano:
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
                            onClick={() => setQrModal({ title: `Link InfinitePay - ${plan.name}`, url: effectivePaymentUrl })}
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
          <span className="text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            Total: {activeSubscribers.length} assinante(s)
          </span>
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
                  Configure as regras, valor mensal e o link de pagamento InfinitePay.
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
                  placeholder="Ex: Clube VIP Belchior, Clube Essencial, Clube Barba"
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

              <div>
                <label className="block font-bold text-slate-300 mb-1">Detalhamento dos Benefícios Inclusos *</label>
                <textarea
                  rows={2}
                  value={includedServicesDescription}
                  onChange={(e) => setIncludedServicesDescription(e.target.value)}
                  placeholder="Ex: 2 Cortes de Cabelo por mês + 10% de desconto em outros serviços e barbearia"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Plan specific InfinitePay URL */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Link Específico InfinitePay para este Plano (Opcional)
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
              Escaneie com a câmera do celular ou app da InfinitePay para pagar via cartão.
            </p>

            {/* Generated QR Code via Google Chart / QR Server API */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto mb-4 border-4 border-emerald-500/20">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrModal.url)}`}
                alt="QR Code de Pagamento InfinitePay"
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
    </div>
  );
};
