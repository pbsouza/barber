import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App in serverless environment
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Helper to normalize amount from different InfinitePay formats
function normalizeAmount(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Healthcheck and status query
  if (req.method === 'GET') {
    const orderNsu = req.query?.order_nsu || req.query?.orderNsu;

    if (orderNsu) {
      try {
        const snap = await getDocs(collection(db, 'webhook_events'));
        const matched = snap.docs
          .map((d) => d.data())
          .find((ev: any) => ev.order_nsu?.toLowerCase() === String(orderNsu).toLowerCase());

        if (matched) {
          return res.status(200).json({
            paid: true,
            order_nsu: matched.order_nsu,
            transaction_nsu: matched.transaction_nsu,
            event: matched,
          });
        }
        return res.status(200).json({
          paid: false,
          order_nsu: orderNsu,
          message: 'Pagamento ainda não confirmado pela InfinitePay.',
        });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Erro ao consultar status.' });
      }
    }

    return res.status(200).json({
      status: 'online',
      platform: 'Vercel Serverless Function',
      service: 'Barbearia Belchior - InfinitePay Webhook',
      timestamp: new Date().toISOString(),
      instructions: 'Envie requisições POST com os dados de pagamento da InfinitePay para este endpoint.',
    });
  }

  // POST: Receive Webhook Notification from InfinitePay
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};

      // Extract InfinitePay parameters
      const invoice_slug =
        payload.invoice_slug || payload.data?.invoice_slug || payload.invoiceSlug || '';
      const order_nsu =
        payload.order_nsu ||
        payload.data?.order_nsu ||
        payload.orderNsu ||
        payload.order_id ||
        payload.orderId;
      const rawAmount =
        payload.paid_amount ?? payload.data?.paid_amount ?? payload.amount ?? payload.value;
      const paid_amount = normalizeAmount(rawAmount);
      const capture_method =
        payload.capture_method ||
        payload.data?.capture_method ||
        payload.payment_method ||
        'credit_card';
      const transaction_nsu =
        payload.transaction_nsu ||
        payload.data?.transaction_nsu ||
        payload.transactionNsu ||
        payload.id ||
        `tx_${Date.now()}`;

      if (!order_nsu) {
        console.warn('[Vercel Webhook] Pedido recebido sem order_nsu:', payload);
        return res.status(400).json({
          error: 'Missing required field: order_nsu',
          message: 'O campo order_nsu é obrigatório para identificação do plano/assinatura.',
        });
      }

      const eventId = `ev_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      const eventData = {
        id: eventId,
        invoice_slug: String(invoice_slug),
        order_nsu: String(order_nsu).trim(),
        paid_amount: paid_amount,
        capture_method: String(capture_method),
        transaction_nsu: String(transaction_nsu),
        status: 'PROCESSED',
        receivedAt: new Date().toISOString(),
        rawBody: payload,
      };

      // 1. Grava o evento na coleção 'webhook_events' do Firebase Firestore
      await setDoc(doc(db, 'webhook_events', eventId), eventData);

      // 2. Registra automaticamente a transação de entrada financeira no caixa
      await setDoc(doc(db, 'transactions', `trans_${eventId}`), {
        id: `trans_${eventId}`,
        type: 'ENTRADA',
        description: `Assinatura InfinitePay: ${order_nsu} (${capture_method})`,
        amount: paid_amount,
        paymentMethod: String(capture_method).toLowerCase().includes('pix')
          ? 'PIX'
          : 'CARTAO_CREDITO',
        category: 'ASSINATURA',
        date: new Date().toISOString(),
        createdByName: 'Webhook InfinitePay (Vercel)',
      });

      console.log(`[Vercel Webhook] Sucesso! Pedido ${order_nsu} gravado no Firebase.`);

      // Retorna HTTP 200 para a InfinitePay
      return res.status(200).json({
        success: true,
        message: 'Pagamento confirmado e gravado no Firebase com sucesso!',
        order_nsu: eventData.order_nsu,
        transaction_nsu: eventData.transaction_nsu,
        receivedAt: eventData.receivedAt,
      });
    } catch (err: any) {
      console.error('[Vercel Webhook] Erro ao processar:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        details: err?.message || 'Falha ao gravar evento no Firebase Firestore',
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
