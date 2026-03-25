/**
 * PayMongo Payment Functions — Server-side payment processing.
 *
 * Handles:
 * - createPayMongoCheckout: Creates a PayMongo checkout session
 * - paymongoWebhook: Handles PayMongo webhook events (with HMAC signature verification)
 * - getSubscriptionStatus: Returns current subscription info
 * - cancelSubscription: Cancels active subscription
 * - getBillingHistory: Returns real payment history from payment_history table
 *
 * Required env vars (set in functions/.env):
 * - PAYMONGO_SECRET_KEY: PayMongo API secret key (sk_live_... or sk_test_...)
 * - PAYMONGO_WEBHOOK_SECRET: Webhook signing secret from PayMongo dashboard
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 *
 * PayMongo API docs: https://developers.paymongo.com/reference
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ─── Config ──────────────────────────────────────────────────────

const PAYMONGO_API = 'https://api.paymongo.com/v1';

function getPayMongoKey() {
  return process.env.PAYMONGO_SECRET_KEY || '';
}

function getWebhookSecret() {
  return process.env.PAYMONGO_WEBHOOK_SECRET || '';
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase config');
  return createClient(url, key);
}

// ─── Pricing ─────────────────────────────────────────────────────

const PRICING = {
  monthly: {
    amountCents: 7900,
    description: 'EduSync Pro — Monthly',
    interval: 'month',
  },
  yearly: {
    amountCents: 39900,
    description: 'EduSync Pro — Yearly',
    interval: 'year',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────

async function paymongoRequest(method, path, body = null) {
  const key = getPayMongoKey();
  if (!key) throw new functions.https.HttpsError('failed-precondition', 'Payment provider not configured');

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(key + ':').toString('base64')}`,
  };

  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('PayMongo API error:', res.status, JSON.stringify(err));
    throw new functions.https.HttpsError('internal', `Payment provider error: ${res.status}`);
  }

  return res.json();
}

/**
 * Verify PayMongo webhook signature.
 * PayMongo sends: paymongo-signature: t=<timestamp>,te=<test_sig>,li=<live_sig>
 * HMAC = SHA256(timestamp + '.' + rawBody, webhookSecret)
 */
function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = {};
  signatureHeader.split(',').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) parts[key.trim()] = value.trim();
  });

  const timestamp = parts.t;
  if (!timestamp) return false;

  // Check timestamp is within 5 minutes to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    console.warn('Webhook timestamp too old:', timestamp);
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Check against live signature (li) or test signature (te)
  const liveSig = parts.li;
  const testSig = parts.te;

  if (liveSig && crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(liveSig))) {
    return true;
  }
  if (testSig && crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(testSig))) {
    return true;
  }

  return false;
}

// ─── Cloud Functions ─────────────────────────────────────────────

/**
 * Creates a PayMongo Checkout Session for Pro plan upgrade.
 * Called from client via httpsCallable.
 */
exports.createPayMongoCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { billingCycle, successUrl, cancelUrl } = data;
  if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid billing cycle');
  }
  if (!successUrl || !cancelUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing redirect URLs');
  }

  // Validate redirect URLs are from our domain
  const allowedOrigins = ['https://edusync-sis.web.app', 'https://edusync.ph', 'http://localhost'];
  const successOrigin = new URL(successUrl).origin;
  const cancelOrigin = new URL(cancelUrl).origin;
  if (!allowedOrigins.some(o => successOrigin.startsWith(o)) || !allowedOrigins.some(o => cancelOrigin.startsWith(o))) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid redirect URLs');
  }

  const pricing = PRICING[billingCycle];
  const uid = context.auth.uid;

  // Check if user already has an active pro subscription
  const supabase = getSupabase();
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', uid)
    .single();

  if (existingSub && existingSub.tier === 'pro' && existingSub.status === 'active') {
    throw new functions.https.HttpsError('already-exists', 'You already have an active Pro subscription');
  }

  // Create PayMongo checkout session
  const result = await paymongoRequest('POST', '/checkout_sessions', {
    data: {
      attributes: {
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        description: pricing.description,
        line_items: [
          {
            currency: 'PHP',
            amount: pricing.amountCents,
            name: pricing.description,
            quantity: 1,
          },
        ],
        payment_method_types: ['gcash', 'grab_pay', 'paymaya', 'card'],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          firebase_uid: uid,
          billing_cycle: billingCycle,
          tier: 'pro',
        },
      },
    },
  });

  return {
    checkoutUrl: result.data.attributes.checkout_url,
    sessionId: result.data.id,
  };
});

/**
 * PayMongo Webhook Handler.
 * Receives events for payment success/failure.
 * Verifies HMAC signature, updates subscription, records payment history.
 */
exports.paymongoWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  // Verify webhook signature (HMAC-SHA256)
  const webhookSecret = getWebhookSecret();
  if (webhookSecret) {
    const signature = req.headers['paymongo-signature'];
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : (req.rawBody || '').toString();

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('Invalid PayMongo webhook signature');
      return res.status(401).send('Invalid signature');
    }
  }

  const event = req.body;
  const eventType = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data;

  console.log(`PayMongo webhook: ${eventType}`, JSON.stringify(event?.data?.id));
  console.log('Webhook resource keys:', JSON.stringify(resource ? Object.keys(resource) : 'null'));
  console.log('Webhook resource.attributes keys:', JSON.stringify(resource?.attributes ? Object.keys(resource.attributes) : 'null'));
  console.log('Webhook metadata:', JSON.stringify(resource?.attributes?.metadata));

  const supabase = getSupabase();

  if (eventType === 'checkout_session.payment.paid') {
    // PayMongo puts metadata on the payment object, not the checkout session
    const payments = resource?.attributes?.payments || [];
    const paymentIntent = resource?.attributes?.payment_intent;
    const metadata = resource?.attributes?.metadata
      || payments[0]?.attributes?.metadata
      || paymentIntent?.attributes?.metadata;

    console.log('Resolved metadata:', JSON.stringify(metadata));

    if (!metadata?.firebase_uid) {
      console.error('Webhook missing firebase_uid in metadata. Full event:', JSON.stringify(event));
      return res.status(400).send('Missing metadata');
    }

    const uid = metadata.firebase_uid;
    const billingCycle = metadata.billing_cycle || 'monthly';
    const pricing = PRICING[billingCycle] || PRICING.monthly;
    const checkoutSessionId = event?.data?.id;

    // Get payment ID and method from payments array
    const paymentId = (payments.length > 0 ? payments[0]?.id : null) || resource?.id;
    const paymentMethodType = resource?.attributes?.payment_method_used || payments[0]?.attributes?.source?.type || 'unknown';

    // Calculate billing period
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Idempotency: check if we already processed this payment
    const { data: existing } = await supabase
      .from('payment_history')
      .select('id')
      .eq('payment_provider_id', paymentId)
      .single();

    if (existing) {
      console.log(`Payment ${paymentId} already processed, skipping`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // 1. Record payment in payment_history
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: uid,
        payment_provider: 'paymongo',
        payment_provider_id: paymentId,
        checkout_session_id: checkoutSessionId,
        amount_cents: pricing.amountCents,
        currency: 'PHP',
        status: 'paid',
        billing_cycle: billingCycle,
        description: pricing.description,
        payment_method_type: paymentMethodType,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        metadata: { event_type: eventType, raw_payment_id: paymentId },
      });

    if (historyError) {
      console.error('Failed to record payment history:', historyError);
      // Don't fail the webhook — subscription update is more important
    }

    // 2. Update subscription to pro
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        tier: 'pro',
        status: 'active',
        payment_provider: 'paymongo',
        payment_provider_subscription_id: paymentId,
        billing_cycle: billingCycle,
        amount_cents: pricing.amountCents,
        currency: 'PHP',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        max_students: 99999,
        max_teaching_sections: 99999,
        max_advisory_sections: 2,
        max_downloads_per_day: 99999,
        updated_at: now.toISOString(),
      })
      .eq('user_id', uid);

    if (subError) {
      console.error('Failed to update subscription:', subError);
      return res.status(500).send('Database error');
    }

    console.log(`Subscription upgraded: user=${uid}, cycle=${billingCycle}, payment=${paymentId}`);
  }

  if (eventType === 'payment.failed') {
    const metadata = resource?.attributes?.metadata;
    if (metadata?.firebase_uid) {
      // Record the failed payment attempt
      await supabase.from('payment_history').insert({
        user_id: metadata.firebase_uid,
        payment_provider: 'paymongo',
        payment_provider_id: resource?.id,
        amount_cents: resource?.attributes?.amount || 0,
        currency: 'PHP',
        status: 'failed',
        billing_cycle: metadata.billing_cycle,
        description: `Failed payment — ${resource?.attributes?.last_payment_error?.message || 'Unknown error'}`,
        metadata: { event_type: eventType },
      });
    }
  }

  res.status(200).json({ received: true });
});

/**
 * Get subscription status for the authenticated user.
 */
exports.getSubscriptionStatus = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const uid = context.auth.uid;
  console.log('getSubscriptionStatus called for uid:', uid, 'email:', context.auth.token?.email);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, status, billing_cycle, current_period_end, amount_cents, currency')
    .eq('user_id', uid)
    .single();

  console.log('Subscription query result:', JSON.stringify({ data, error }));

  if (error || !data) {
    return {
      tier: 'free',
      status: 'active',
      billingCycle: null,
      currentPeriodEnd: null,
      amountCents: null,
      currency: 'PHP',
    };
  }

  // Auto-expire if past current_period_end
  if (data.tier === 'pro' && data.current_period_end) {
    const endDate = new Date(data.current_period_end);
    if (endDate < new Date()) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', tier: 'free', updated_at: new Date().toISOString() })
        .eq('user_id', context.auth.uid);

      return { tier: 'free', status: 'expired', billingCycle: null, currentPeriodEnd: null, amountCents: null, currency: 'PHP' };
    }
  }

  return {
    tier: data.tier,
    status: data.status,
    billingCycle: data.billing_cycle,
    currentPeriodEnd: data.current_period_end,
    amountCents: data.amount_cents,
    currency: data.currency,
  };
});

/**
 * Cancel subscription. Takes effect at end of billing period.
 */
exports.cancelSubscription = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', context.auth.uid)
    .single();

  if (!sub || sub.tier === 'free') {
    throw new functions.https.HttpsError('failed-precondition', 'No active subscription');
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', context.auth.uid);

  if (error) {
    throw new functions.https.HttpsError('internal', 'Failed to cancel subscription');
  }

  return {
    success: true,
    endsAt: sub.current_period_end || new Date().toISOString(),
  };
});

/**
 * Get billing history from payment_history table.
 * Returns real payment records, ordered by date descending.
 */
exports.getBillingHistory = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const supabase = getSupabase();
  const { data: payments, error } = await supabase
    .from('payment_history')
    .select('id, amount_cents, currency, status, billing_cycle, description, payment_method_type, period_start, period_end, created_at')
    .eq('user_id', context.auth.uid)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch billing history:', error);
    return [];
  }

  return (payments || []).map(p => ({
    id: p.id,
    date: p.created_at,
    amount: p.amount_cents / 100,
    currency: p.currency || 'PHP',
    status: p.status,
    description: p.description,
    billingCycle: p.billing_cycle,
    paymentMethod: p.payment_method_type,
    periodStart: p.period_start,
    periodEnd: p.period_end,
  }));
});
