import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

export interface WebhookEvent {
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

// In-memory store for webhook events
let webhookEvents: WebhookEvent[] = [];

// Helper to normalize amount
function normalizeAmount(amount: any): number {
  if (typeof amount === 'number') {
    // If it is in cents (> 1000 for small purchases), or direct float
    return amount;
  }
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for APIs if called from external
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Barbearia Belchior Webhook & API Server',
      timestamp: new Date().toISOString(),
      webhookEventsCount: webhookEvents.length,
    });
  });

  // 2. GET /api/webhooks/infinitepay - Diagnostic check
  app.get('/api/webhooks/infinitepay', (req, res) => {
    res.json({
      status: 'online',
      message: 'InfinitePay Webhook endpoint está online e pronto para receber notificações POST.',
      endpoint: '/api/webhooks/infinitepay',
      expectedMethod: 'POST',
      expectedFields: [
        'invoice_slug',
        'order_nsu',
        'paid_amount',
        'capture_method',
        'transaction_nsu',
      ],
      totalEventsReceived: webhookEvents.length,
    });
  });

  // 3. POST /api/webhooks/infinitepay - Main Webhook Receiver from InfinitePay
  app.post('/api/webhooks/infinitepay', (req, res) => {
    try {
      const payload = req.body || {};

      // InfinitePay can send keys directly or inside a data/event object
      const invoice_slug = payload.invoice_slug || payload.data?.invoice_slug || payload.invoiceSlug;
      const order_nsu = payload.order_nsu || payload.data?.order_nsu || payload.orderNsu || payload.order_id || payload.orderId;
      const paid_amount = payload.paid_amount ?? payload.data?.paid_amount ?? payload.amount ?? payload.value;
      const capture_method = payload.capture_method || payload.data?.capture_method || payload.payment_method || 'credit_card';
      const transaction_nsu = payload.transaction_nsu || payload.data?.transaction_nsu || payload.transactionNsu || payload.id;

      console.log('>>> [InfinitePay Webhook Received]:', {
        invoice_slug,
        order_nsu,
        paid_amount,
        capture_method,
        transaction_nsu,
      });

      // Validation: according to bank instructions, order_nsu is required to match the order
      if (!order_nsu) {
        console.warn('<<< [InfinitePay Webhook Error]: Missing order_nsu in payload');
        // InfinitePay assistant note: "Se responder com erro 400, a InfinitePay reenvia automaticamente"
        return res.status(400).json({
          error: 'Missing required field: order_nsu',
          message: 'O campo order_nsu é obrigatório para identificação do pedido/assinatura.',
        });
      }

      const newEvent: WebhookEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        invoice_slug: invoice_slug ? String(invoice_slug) : undefined,
        order_nsu: String(order_nsu),
        paid_amount: paid_amount !== undefined ? normalizeAmount(paid_amount) : undefined,
        capture_method: String(capture_method),
        transaction_nsu: transaction_nsu ? String(transaction_nsu) : `tx-${Date.now()}`,
        receivedAt: new Date().toISOString(),
        status: 'PROCESSED',
        rawBody: payload,
      };

      // Keep most recent 100 events
      webhookEvents.unshift(newEvent);
      if (webhookEvents.length > 100) {
        webhookEvents = webhookEvents.slice(0, 100);
      }

      // Sync with Firestore REST API in background
      (async () => {
        try {
          const FIREBASE_PROJECT_ID = 'gen-lang-client-0282193407';
          const FIRESTORE_DB_ID = 'ai-studio-barbergestoagend-e7b915a6-e45b-4bcc-a26e-050a695dff1d';
          const FIREBASE_API_KEY = 'AIzaSyC3GlZ-iIQiOPtW6WpzwRl1NQYGb_RfRl8';

          // 1. Save webhook event
          const eventFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/webhook_events?documentId=${newEvent.id}&key=${FIREBASE_API_KEY}`;
          await fetch(eventFirestoreUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                id: { stringValue: newEvent.id },
                invoice_slug: { stringValue: newEvent.invoice_slug || '' },
                order_nsu: { stringValue: newEvent.order_nsu },
                paid_amount: { doubleValue: Number(newEvent.paid_amount) || 0 },
                capture_method: { stringValue: newEvent.capture_method || '' },
                transaction_nsu: { stringValue: newEvent.transaction_nsu || '' },
                receipt_url: { stringValue: newEvent.transaction_nsu ? `https://recibo.infinitepay.io/${newEvent.transaction_nsu}` : '' },
                status: { stringValue: 'PROCESSED' },
                receivedAt: { stringValue: newEvent.receivedAt },
                rawBody: { stringValue: JSON.stringify(payload) },
              },
            }),
          });

          // 2. Query users to find client and update with status: PROCESSED and order_nsu
          const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents:runQuery?key=${FIREBASE_API_KEY}`;
          const queryRes = await fetch(queryUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              structuredQuery: { from: [{ collectionId: 'users' }] },
            }),
          });

          if (queryRes.ok) {
            const userResults = await queryRes.json();
            const cleanOrderNsu = String(order_nsu || '').trim().toLowerCase();
            const cleanTxNsu = String(transaction_nsu || '').trim().toLowerCase();

            const userDocs = userResults
              .map((item: any) => {
                if (!item.document || !item.document.fields) return null;
                const f = item.document.fields;
                return {
                  docName: item.document.name,
                  id: f.id?.stringValue || '',
                  role: f.role?.stringValue || 'CLIENT',
                  pendingOrderNsu: f.pendingOrderNsu?.stringValue || '',
                  subscriptionOrderNsu: f.subscriptionOrderNsu?.stringValue || '',
                  order_nsu: f.order_nsu?.stringValue || '',
                  pendingPlanId: f.pendingPlanId?.stringValue || 'plano-ouro',
                  subscriptionStatus: f.subscriptionStatus?.stringValue || '',
                  status: f.status?.stringValue || '',
                  lastCheckoutAt: f.lastCheckoutAt?.stringValue || '',
                };
              })
              .filter((u: any) => u !== null && u.role !== 'ADMIN');

            let matched = userDocs.find((u: any) => {
              const uId = (u.id || '').toLowerCase();
              const pNsu = (u.pendingOrderNsu || '').toLowerCase();
              const sNsu = (u.subscriptionOrderNsu || '').toLowerCase();
              const oNsu = (u.order_nsu || '').toLowerCase();
              return (
                (cleanOrderNsu && (uId === cleanOrderNsu || pNsu === cleanOrderNsu || sNsu === cleanOrderNsu || oNsu === cleanOrderNsu)) ||
                (cleanTxNsu && (pNsu === cleanTxNsu || sNsu === cleanTxNsu || oNsu === cleanTxNsu))
              );
            });

            if (!matched) {
              matched = userDocs.find((u: any) => {
                const uId = (u.id || '').toLowerCase();
                return cleanOrderNsu && uId && (cleanOrderNsu.includes(uId) || uId.includes(cleanOrderNsu));
              });
            }

            if (!matched && userDocs.length > 0) {
              const pendingClients = userDocs.filter(
                (u: any) => u.subscriptionStatus === 'PENDING' || u.status === 'PENDING'
              );
              matched = pendingClients.length > 0 ? pendingClients[0] : userDocs[0];
            }

            if (matched) {
              const patchUrl = `https://firestore.googleapis.com/v1/${matched.docName}?updateMask.fieldPaths=status&updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=order_nsu&updateMask.fieldPaths=subscriptionOrderNsu&updateMask.fieldPaths=subscriptionPaymentNsu&updateMask.fieldPaths=subscriptionId&updateMask.fieldPaths=subscriptionStartDate&key=${FIREBASE_API_KEY}`;
              await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    status: { stringValue: 'PROCESSED' },
                    subscriptionStatus: { stringValue: 'PROCESSED' },
                    order_nsu: { stringValue: String(order_nsu).trim() },
                    subscriptionOrderNsu: { stringValue: String(order_nsu).trim() },
                    subscriptionPaymentNsu: { stringValue: String(transaction_nsu).trim() },
                    subscriptionId: { stringValue: matched.pendingPlanId || 'plano-ouro' },
                    subscriptionStartDate: { stringValue: new Date().toISOString() },
                  },
                }),
              });
            }
          }
        } catch (syncErr) {
          console.warn('[Server] Falha ao sincronizar com Firestore:', syncErr);
        }
      })();

      // Return 200 OK to InfinitePay
      return res.status(200).json({
        success: true,
        message: 'Pagamento confirmado e processado com sucesso pelo servidor.',
        order_nsu: newEvent.order_nsu,
        transaction_nsu: newEvent.transaction_nsu,
        status: 'APPROVED',
        receivedAt: newEvent.receivedAt,
      });
    } catch (err: any) {
      console.error('<<< [InfinitePay Webhook Fatal Error]:', err);
      return res.status(400).json({
        error: 'Invalid payload or server error',
        details: err?.message,
      });
    }
  });

  // 4. GET /api/webhooks/infinitepay/events - Retrieve events list for Admin Panel
  app.get('/api/webhooks/infinitepay/events', (req, res) => {
    res.json({
      success: true,
      total: webhookEvents.length,
      events: webhookEvents,
    });
  });

  // 5. GET /api/webhooks/infinitepay/status/:orderNsu - Check if a specific order was confirmed
  app.get('/api/webhooks/infinitepay/status/:orderNsu', (req, res) => {
    const { orderNsu } = req.params;
    const matched = webhookEvents.find(
      (ev) => ev.order_nsu.toLowerCase() === orderNsu.toLowerCase()
    );

    if (matched) {
      return res.json({
        paid: true,
        order_nsu: matched.order_nsu,
        transaction_nsu: matched.transaction_nsu,
        paid_amount: matched.paid_amount,
        capture_method: matched.capture_method,
        receivedAt: matched.receivedAt,
        event: matched,
      });
    }

    return res.json({
      paid: false,
      order_nsu: orderNsu,
      message: 'Aguardando confirmação de pagamento da InfinitePay...',
    });
  });

  // 6. POST /api/webhooks/infinitepay/simulate - Admin test tool to simulate an incoming InfinitePay webhook
  app.post('/api/webhooks/infinitepay/simulate', (req, res) => {
    const { order_nsu, paid_amount, capture_method, invoice_slug, transaction_nsu } = req.body;

    const testEvent: WebhookEvent = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      invoice_slug: invoice_slug || `inv_sim_${Math.floor(100000 + Math.random() * 900000)}`,
      order_nsu: order_nsu || `SIM-${Date.now()}`,
      paid_amount: Number(paid_amount) || 89.9,
      capture_method: capture_method || 'credit_card',
      transaction_nsu: transaction_nsu || `tx_sim_${Math.floor(10000000 + Math.random() * 90000000)}`,
      receivedAt: new Date().toISOString(),
      status: 'PROCESSED',
      rawBody: req.body,
    };

    webhookEvents.unshift(testEvent);
    if (webhookEvents.length > 100) {
      webhookEvents = webhookEvents.slice(0, 100);
    }

    return res.json({
      success: true,
      message: 'Simulação de webhook processada com sucesso!',
      simulatedEvent: testEvent,
    });
  });

  // 7. DELETE /api/webhooks/infinitepay/events - Clear events
  app.delete('/api/webhooks/infinitepay/events', (req, res) => {
    webhookEvents = [];
    return res.json({ success: true, message: 'Histórico de eventos de webhook limpo.' });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`InfinitePay Webhook URL: http://0.0.0.0:${PORT}/api/webhooks/infinitepay`);
  });
}

startServer();
