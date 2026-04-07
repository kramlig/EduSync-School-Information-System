/**
 * School Subscription Service
 *
 * Handles subscription management for institutional schools (Tier 3).
 * Separate from personalWorkspaceService which handles personal Free/Pro tiers.
 *
 * Plans: trial → starter (₱1,999/mo) → professional (₱4,999/mo) → enterprise (custom)
 */

import { supabase } from '../lib/supabase';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Get the real firebase_uid from the session.
 * The app uses hybrid auth (anonymous Firebase Auth + session-based identity),
 * so context.auth.uid in Cloud Functions is the anonymous UID.
 * We pass the real UID so the Cloud Function can verify the caller.
 */
function getSessionFirebaseUid(): string | null {
  try {
    const raw = localStorage.getItem('edusync_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user?.firebaseUid || null;
  } catch {
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────

export type SchoolPlan = 'trial' | 'starter' | 'professional' | 'enterprise';
export type SchoolSubStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';

export interface SchoolSubscription {
  id: string;
  schoolId: string;
  plan: SchoolPlan;
  status: SchoolSubStatus;
  maxStudents: number;
  maxTeachers: number;
  maxSections: number;
  aiEnabled: boolean;
  parentPortalEnabled: boolean;
  divisionReporting: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  billingCycle: 'monthly' | 'yearly' | null;
  amountCents: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolPlanLimits {
  maxStudents: number;
  maxTeachers: number;
  maxSections: number;
  aiEnabled: boolean;
  parentPortalEnabled: boolean;
  divisionReporting: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
}

// ─── Pricing ─────────────────────────────────────────────

export const SCHOOL_PRICING = {
  starter: {
    monthly: { amountCents: 199900, label: '₱1,999/month' },
    yearly: {
      amountCents: 1999000,
      label: '₱19,990/year',
      monthlyEquivalent: '₱1,666/mo',
      savings: '17%',
    },
  },
  professional: {
    monthly: { amountCents: 499900, label: '₱4,999/month' },
    yearly: {
      amountCents: 4999000,
      label: '₱49,990/year',
      monthlyEquivalent: '₱4,166/mo',
      savings: '17%',
    },
  },
} as const;

// ─── Plan Limits (mirrors DB function get_school_plan_limits) ─────

const PLAN_LIMITS: Record<SchoolPlan, SchoolPlanLimits> = {
  trial: {
    maxStudents: 100,
    maxTeachers: 5,
    maxSections: 10,
    aiEnabled: false,
    parentPortalEnabled: false,
    divisionReporting: false,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  starter: {
    maxStudents: 500,
    maxTeachers: 99999,
    maxSections: 99999,
    aiEnabled: false,
    parentPortalEnabled: true,
    divisionReporting: false,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  professional: {
    maxStudents: 1500,
    maxTeachers: 99999,
    maxSections: 99999,
    aiEnabled: true,
    parentPortalEnabled: true,
    divisionReporting: true,
    advancedAnalytics: true,
    prioritySupport: true,
  },
  enterprise: {
    maxStudents: 99999,
    maxTeachers: 99999,
    maxSections: 99999,
    aiEnabled: true,
    parentPortalEnabled: true,
    divisionReporting: true,
    advancedAnalytics: true,
    prioritySupport: true,
  },
};

export function getSchoolPlanLimits(plan: SchoolPlan): SchoolPlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;
}

// ─── Queries ─────────────────────────────────────────────

export async function getSchoolSubscription(
  schoolId: string
): Promise<SchoolSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('school_subscriptions')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      schoolId: data.school_id,
      plan: data.plan,
      status: data.status,
      maxStudents: data.max_students,
      maxTeachers: data.max_teachers,
      maxSections: data.max_sections,
      aiEnabled: data.ai_enabled,
      parentPortalEnabled: data.parent_portal_enabled,
      divisionReporting: data.division_reporting,
      advancedAnalytics: data.advanced_analytics,
      prioritySupport: data.priority_support,
      billingCycle: data.billing_cycle,
      amountCents: data.amount_cents,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      trialEndsAt: data.trial_ends_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

// ─── Payment Actions (via Cloud Functions) ───────────────

export async function createSchoolCheckout(
  schoolId: string,
  plan: 'starter' | 'professional',
  billingCycle: 'monthly' | 'yearly'
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const fn = httpsCallable(getFunctions(), 'createSchoolCheckout');
  const result = await fn({ schoolId, plan, billingCycle, firebaseUid: getSessionFirebaseUid() });
  return result.data as { checkoutUrl: string; sessionId: string };
}

export async function getSchoolBillingHistory(schoolId: string): Promise<{
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  billingCycle: string;
  paymentMethod: string;
  periodStart: string;
  periodEnd: string;
}[]> {
  const fn = httpsCallable(getFunctions(), 'getSchoolBillingHistory');
  const result = await fn({ schoolId, firebaseUid: getSessionFirebaseUid() });
  return (result.data as any[]) || [];
}

export async function cancelSchoolSubscription(schoolId: string): Promise<{
  success: boolean;
  endsAt: string;
}> {
  const fn = httpsCallable(getFunctions(), 'cancelSchoolSubscription');
  const result = await fn({ schoolId, firebaseUid: getSessionFirebaseUid() });
  return result.data as { success: boolean; endsAt: string };
}

export async function redirectToSchoolCheckout(
  schoolId: string,
  plan: 'starter' | 'professional',
  billingCycle: 'monthly' | 'yearly'
): Promise<void> {
  const { checkoutUrl } = await createSchoolCheckout(schoolId, plan, billingCycle);
  window.location.href = checkoutUrl;
}

// ─── Trial Helpers ───────────────────────────────────────

export function isTrialExpired(sub: SchoolSubscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== 'trial') return false;
  if (!sub.trialEndsAt) return false; // Grandfathered — no expiry
  return new Date(sub.trialEndsAt) < new Date();
}

export function trialDaysRemaining(sub: SchoolSubscription | null): number | null {
  if (!sub || sub.status !== 'trial' || !sub.trialEndsAt) return null;
  const diff = new Date(sub.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getPlanDisplayName(plan: SchoolPlan): string {
  const names: Record<SchoolPlan, string> = {
    trial: 'Trial',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return names[plan] ?? 'Trial';
}
