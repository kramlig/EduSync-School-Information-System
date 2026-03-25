/**
 * paymentService — Client-side payment service for personal workspace subscriptions.
 *
 * Communicates with Firebase Functions (server-side) that handle PayMongo API calls.
 * Never exposes API keys client-side.
 *
 * PayMongo supports: GCash, Maya (PayMaya), Credit/Debit Cards, GrabPay
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// ─── Types ───────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'yearly';

export interface CheckoutRequest {
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface SubscriptionStatus {
  tier: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billingCycle: BillingCycle | null;
  currentPeriodEnd: string | null;
  amountCents: number | null;
  currency: string;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  billingCycle: BillingCycle | null;
  paymentMethod: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}

// ─── Pricing ─────────────────────────────────────────────────────

export const PRICING = {
  monthly: {
    amountCents: 7900, // ₱79.00
    label: '₱79/month',
  },
  yearly: {
    amountCents: 39900, // ₱399.00/year (₱33.25/mo — 58% off)
    label: '₱399/year',
    monthlyEquivalent: '₱33.25/mo',
    savings: '58%',
  },
} as const;

// ─── Service ─────────────────────────────────────────────────────

function getFns() {
  return getFunctions();
}

/**
 * Ensure Firebase Auth is signed in and matches the session user.
 * Personal workspace users rely on Firebase Auth for Cloud Function calls,
 * but the auth state can fall out of sync with the localStorage session.
 */
function ensureAuthMatchesSession(): void {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Get the session's expected Firebase UID
  try {
    const raw = localStorage.getItem('edusync_session');
    if (raw) {
      const session = JSON.parse(raw);
      const sessionUid = session?.user?.firebaseUid;
      if (sessionUid && currentUser && currentUser.uid !== sessionUid) {
        console.error(`[PaymentService] Firebase Auth UID (${currentUser.uid}) doesn't match session UID (${sessionUid}). Please re-login.`);
        throw new Error('Authentication mismatch. Please log out and log back in to proceed with payment.');
      }
    }
  } catch (e: any) {
    if (e.message?.includes('Authentication mismatch')) throw e;
    // ignore parse errors
  }

  if (!currentUser) {
    throw new Error('Not authenticated. Please log out and log back in to proceed with payment.');
  }
}

/**
 * Create a PayMongo checkout session for upgrading to Pro.
 * Returns a URL to redirect the user to PayMongo's hosted checkout page.
 */
export async function createCheckoutSession(req: CheckoutRequest): Promise<CheckoutResponse> {
  ensureAuthMatchesSession();
  const createCheckout = httpsCallable<CheckoutRequest, CheckoutResponse>(
    getFns(),
    'createPayMongoCheckout'
  );
  const result = await createCheckout(req);
  return result.data;
}

/**
 * Get the current subscription status for the authenticated user.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const getStatus = httpsCallable<void, SubscriptionStatus>(getFns(), 'getSubscriptionStatus');
  const result = await getStatus();
  return result.data;
}

/**
 * Cancel the current subscription. Takes effect at end of current billing period.
 */
export async function cancelSubscription(): Promise<{ success: boolean; endsAt: string }> {
  const cancel = httpsCallable<void, { success: boolean; endsAt: string }>(
    getFns(),
    'cancelSubscription'
  );
  const result = await cancel();
  return result.data;
}

/**
 * Get billing history for the authenticated user.
 */
export async function getBillingHistory(): Promise<BillingHistoryItem[]> {
  const getHistory = httpsCallable<void, BillingHistoryItem[]>(getFns(), 'getBillingHistory');
  const result = await getHistory();
  return result.data;
}

/**
 * Redirect to PayMongo checkout.
 * Convenience wrapper that creates a session and redirects.
 */
export async function redirectToCheckout(billingCycle: BillingCycle): Promise<void> {
  const { checkoutUrl } = await createCheckoutSession({
    billingCycle,
    successUrl: `${window.location.origin}/personal/settings?payment=success`,
    cancelUrl: `${window.location.origin}/personal/settings?payment=cancelled`,
  });
  window.location.href = checkoutUrl;
}
