// Vercel Serverless Function - InfinitePay Webhook
// Direct Firestore REST integration - Zero external dependencies, ultra-fast and reliable

const FIREBASE_PROJECT_ID = 'gen-lang-client-0282193407';
const FIRESTORE_DB_ID = 'ai-studio-barbergestoagend-e7b915a6-e45b-4bcc-a26e-050a695dff1d';
const FIREBASE_API_KEY = 'AIzaSyC3GlZ-iIQiOPtW6WpzwRl1NQYGb_RfRl8';

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

// Convert plain JS object to Firestore REST fields structure
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
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

  // GET: Healthcheck & Ping test
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      platform: 'Vercel Serverless Function',
      service: 'Barbearia Belchior - InfinitePay Webhook',
      timestamp: new Date().toISOString(),
      firestoreConnected: true,
      instructions: 'Envie requisições POST da InfinitePay para este endpoint para confirmação automática de assinaturas.',
    });
  }

  // POST: Receive Webhook Notification from InfinitePay
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};

      // Extract InfinitePay parameters across different API versions
      const invoice_slug =
        payload.invoice_slug ||
        payload.data?.invoice_slug ||
        payload.invoiceSlug ||
        payload.invoice_id ||
        '';

      const order_nsu =
        payload.order_nsu ||
        payload.data?.order_nsu ||
        payload.orderNsu ||
        payload.order_id ||
        payload.orderId ||
        invoice_slug ||
        `AVULSO-${Date.now()}`;

      const rawAmount =
        payload.paid_amount ??
        payload.data?.paid_amount ??
        payload.amount ??
        payload.value ??
        payload.data?.amount;

      const paid_amount = normalizeAmount(rawAmount);

      const capture_method =
        payload.capture_method ||
        payload.data?.capture_method ||
        payload.payment_method ||
        payload.data?.payment_method ||
        'credit_card';

      const transaction_nsu =
        payload.transaction_nsu ||
        payload.data?.transaction_nsu ||
        payload.transactionNsu ||
        payload.id ||
        payload.nsu ||
        `tx_${Date.now()}`;

      const receipt_url =
        payload.receipt_url ||
        payload.data?.receipt_url ||
        (transaction_nsu ? `https://recibo.infinitepay.io/${transaction_nsu}` : '');

      const eventId = `ev_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // Identificação estrita do cliente
      let matchedClient: any = null;
      let resolvedUserId = 'UNASSIGNED';

      try {
        const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents:runQuery?key=${FIREBASE_API_KEY}`;
        const queryRes = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'users' }],
            },
          }),
        });

        if (queryRes.ok) {
          const userResults = await queryRes.json();
          const cleanOrderNsu = String(order_nsu || '').trim().toLowerCase();
          const cleanTxNsu = String(transaction_nsu || '').trim().toLowerCase();
          const explicitUserId = String(
            payload.userId ||
            payload.custom_id ||
            payload.client_id ||
            (payload.metadata && payload.metadata.userId) ||
            ''
          ).trim().toLowerCase();

          const parseUserDoc = (item: any) => {
            if (!item.document || !item.document.fields) return null;
            const f = item.document.fields;
            const docName = item.document.name;
            const id = f.id?.stringValue || docName.split('/').pop();
            const role = f.role?.stringValue || 'CLIENT';
            const pendingOrderNsu = f.pendingOrderNsu?.stringValue || '';
            const subscriptionOrderNsu = f.subscriptionOrderNsu?.stringValue || '';
            const order_nsu_field = f.order_nsu?.stringValue || '';
            const pendingPlanId = f.pendingPlanId?.stringValue || 'plano-ouro';
            const subscriptionStatus = f.subscriptionStatus?.stringValue || '';
            const status = f.status?.stringValue || '';
            const lastCheckoutAt = f.lastCheckoutAt?.stringValue || '';
            return {
              docName,
              id,
              role,
              pendingOrderNsu,
              subscriptionOrderNsu,
              order_nsu: order_nsu_field,
              pendingPlanId,
              subscriptionStatus,
              status,
              lastCheckoutAt,
            };
          };

          const userDocs = userResults
            .map(parseUserDoc)
            .filter((u: any) => u !== null && u.role !== 'ADMIN');

          // 1. Identifica por ID explícito
          if (explicitUserId) {
            matchedClient = userDocs.find((u: any) => (u.id || '').toLowerCase() === explicitUserId);
          }

          // 2. Identifica por order_nsu ou pendingOrderNsu exato
          if (!matchedClient && cleanOrderNsu) {
            matchedClient = userDocs.find((u: any) => {
              const uId = (u.id || '').toLowerCase();
              const pNsu = (u.pendingOrderNsu || '').toLowerCase();
              const sNsu = (u.subscriptionOrderNsu || '').toLowerCase();
              const oNsu = (u.order_nsu || '').toLowerCase();

              return (
                cleanOrderNsu &&
                (uId === cleanOrderNsu || pNsu === cleanOrderNsu || sNsu === cleanOrderNsu || oNsu === cleanOrderNsu)
              );
            });
          }

          // 3. Identifica se o order_nsu contém o ID do usuário (ex: ORD_{userId}_... ou SUB_{userId}_...)
          if (!matchedClient && cleanOrderNsu) {
            matchedClient = userDocs.find((u: any) => {
              const uId = (u.id || '').toLowerCase();
              return (
                uId &&
                (cleanOrderNsu.startsWith(`ord_${uId}_`) ||
                  cleanOrderNsu.startsWith(`sub_${uId}_`) ||
                  cleanOrderNsu.startsWith(`ord_${uId}`) ||
                  cleanOrderNsu.startsWith(`sub_${uId}`) ||
                  cleanOrderNsu.includes(uId))
              );
            });
          }

          // 4. Identifica por transaction_nsu
          if (!matchedClient && cleanTxNsu) {
            matchedClient = userDocs.find((u: any) => {
              const pNsu = (u.pendingOrderNsu || '').toLowerCase();
              const sNsu = (u.subscriptionOrderNsu || '').toLowerCase();
              const oNsu = (u.order_nsu || '').toLowerCase();
              return cleanTxNsu && (pNsu === cleanTxNsu || sNsu === cleanTxNsu || oNsu === cleanTxNsu);
            });
          }
        }
      } catch (err) {
        console.warn('[Vercel Webhook] Erro ao buscar usuários no Firestore:', err);
      }

      if (matchedClient) {
        resolvedUserId = matchedClient.id;
      }

      const eventData = {
        id: eventId,
        userId: resolvedUserId,
        invoice_slug: String(invoice_slug),
        order_nsu: String(order_nsu).trim(),
        paid_amount: paid_amount,
        capture_method: String(capture_method),
        transaction_nsu: String(transaction_nsu),
        receipt_url: String(receipt_url),
        status: 'PROCESSED',
        receivedAt: new Date().toISOString(),
        rawBody: JSON.stringify(payload),
      };

      // 1. Grava no subcollection do usuário específico: /users/{userId}/webhook_events/{eventId}
      if (matchedClient) {
        const userEventUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/users/${matchedClient.id}/webhook_events?documentId=${eventId}&key=${FIREBASE_API_KEY}`;
        await fetch(userEventUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFirestoreFields(eventData) }),
        }).catch((e) => console.warn('[Vercel Webhook] Falha ao salvar no subcollection do usuário:', e));

        // 2. Atualiza o documento do cliente específico com status: PROCESSED e order_nsu
        const patchUrl = `https://firestore.googleapis.com/v1/${matchedClient.docName}?updateMask.fieldPaths=status&updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=order_nsu&updateMask.fieldPaths=subscriptionOrderNsu&updateMask.fieldPaths=subscriptionPaymentNsu&updateMask.fieldPaths=subscriptionId&updateMask.fieldPaths=subscriptionStartDate&key=${FIREBASE_API_KEY}`;
        const updateData = {
          status: 'PROCESSED',
          subscriptionStatus: 'PROCESSED',
          order_nsu: String(order_nsu).trim(),
          subscriptionOrderNsu: String(order_nsu).trim(),
          subscriptionPaymentNsu: String(transaction_nsu).trim(),
          subscriptionId: matchedClient.pendingPlanId || 'plano-ouro',
          subscriptionStartDate: new Date().toISOString(),
        };

        const patchRes = await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFirestoreFields(updateData) }),
        });

        if (patchRes.ok) {
          console.log(`[Vercel Webhook] Cliente ${matchedClient.id} atualizado com sucesso para status: PROCESSED!`);
        } else {
          const patchErr = await patchRes.text();
          console.warn('[Vercel Webhook] Falha ao atualizar cliente:', patchErr);
        }
      } else {
        console.warn(`[Vercel Webhook Alerta] Pedido "${order_nsu}" não pertence a nenhum usuário cadastrado. Nenhuma assinatura de terceiros foi ativada.`);
      }

      // 3. Grava também no log central de webhook_events para o painel de administração
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/webhook_events?documentId=${eventId}&key=${FIREBASE_API_KEY}`;
      await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(eventData) }),
      }).catch((e) => console.warn('[Vercel Webhook] Falha ao registrar log central de webhook:', e));

      // 4. Registra automaticamente entrada financeira no caixa da barbearia
      if (paid_amount > 0) {
        const transUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/transactions?documentId=trans_${eventId}&key=${FIREBASE_API_KEY}`;
        const transData = {
          id: `trans_${eventId}`,
          type: 'ENTRADA',
          description: `Assinatura InfinitePay: ${order_nsu} (${capture_method})`,
          amount: paid_amount,
          paymentMethod: String(capture_method).toLowerCase().includes('pix') ? 'PIX' : 'CARTAO_CREDITO',
          category: 'ASSINATURA',
          date: new Date().toISOString(),
          createdByName: 'Webhook InfinitePay (Vercel)',
        };

        await fetch(transUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFirestoreFields(transData) }),
        }).catch((e) => console.warn('[Vercel Webhook] Falha ao registrar caixa:', e));
      }

      console.log(`[Vercel Webhook] Sucesso! Pedido ${order_nsu} processado.`);

      return res.status(200).json({
        success: true,
        message: 'Webhook recebido e gravado no Firebase Firestore com sucesso!',
        order_nsu: eventData.order_nsu,
        transaction_nsu: eventData.transaction_nsu,
        paid_amount: eventData.paid_amount,
        receivedAt: eventData.receivedAt,
      });
    } catch (err: any) {
      console.error('[Vercel Webhook] Erro geral:', err);
      return res.status(500).json({
        error: 'Erro interno ao processar webhook',
        details: err?.message || 'Falha desconhecida',
      });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
