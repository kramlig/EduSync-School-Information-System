/**
 * referralService — Client-side referral system for personal workspace.
 *
 * Handles:
 * - Getting/generating the user's referral code
 * - Tracking referral stats (how many signed up, converted)
 * - Applying referral code during signup
 * - Sharing referral link
 */

import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────

export interface ReferralCode {
  id: string;
  code: string;
  userId: string;
  createdAt: string;
}

export interface ReferralStats {
  code: string;
  totalReferred: number;
  signedUp: number;
  converted: number;
  creditsEarned: number;
  creditsRemaining: number; // 6 - creditsUsedThisYear
}

export interface Referral {
  id: string;
  referredEmail: string | null;
  status: 'pending' | 'signed_up' | 'converted' | 'expired';
  credited: boolean;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────

const MAX_CREDITS_PER_YEAR = 6;
const REFERRAL_LINK_BASE = `${typeof window !== 'undefined' ? window.location.origin : ''}/personal/signup`;

// ─── Code Generation ─────────────────────────────────────────────

function generateCode(firstName: string): string {
  const name = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'TEACHER';
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${name}-${rand}`;
}

// ─── Service Functions ───────────────────────────────────────────

/**
 * Get or create the referral code for a user.
 */
export async function getOrCreateReferralCode(
  userId: string,
  firstName: string
): Promise<ReferralCode> {
  // Check if code already exists
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return {
      id: existing.id,
      code: existing.code,
      userId: existing.user_id,
      createdAt: existing.created_at,
    };
  }

  // Generate new code (retry on collision)
  for (let i = 0; i < 5; i++) {
    const code = generateCode(firstName);
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code })
      .select()
      .single();

    if (data) {
      return {
        id: data.id,
        code: data.code,
        userId: data.user_id,
        createdAt: data.created_at,
      };
    }

    // Unique constraint violation — retry with new code
    if (error?.code === '23505') continue;
    throw error;
  }

  throw new Error('Failed to generate unique referral code after 5 attempts');
}

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const [codeRes, referralsRes, creditsRes] = await Promise.all([
    supabase.from('referral_codes').select('code').eq('user_id', userId).single(),
    supabase.from('referrals').select('status, credited').eq('referrer_user_id', userId),
    supabase
      .from('referral_credits_per_year')
      .select('credits_used')
      .eq('referrer_user_id', userId)
      .eq('credit_year', new Date().getFullYear())
      .single(),
  ]);

  const code = codeRes.data?.code || '';
  const referrals = referralsRes.data || [];
  const creditsUsed = creditsRes.data?.credits_used ?? 0;

  return {
    code,
    totalReferred: referrals.length,
    signedUp: referrals.filter((r) => r.status !== 'pending').length,
    converted: referrals.filter((r) => r.status === 'converted').length,
    creditsEarned: referrals.filter((r) => r.credited).length,
    creditsRemaining: Math.max(0, MAX_CREDITS_PER_YEAR - creditsUsed),
  };
}

/**
 * Get individual referral records for display.
 */
export async function getReferralList(userId: string): Promise<Referral[]> {
  const { data } = await supabase
    .from('referrals')
    .select('id, referred_email, status, credited, created_at')
    .eq('referrer_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return (data || []).map((r) => ({
    id: r.id,
    referredEmail: r.referred_email,
    status: r.status,
    credited: r.credited,
    createdAt: r.created_at,
  }));
}

/**
 * Record that a referral code was used during signup.
 */
export async function applyReferralCode(
  referralCode: string,
  referredUserId: string,
  referredEmail: string
): Promise<boolean> {
  // Look up the code
  const { data: codeData } = await supabase
    .from('referral_codes')
    .select('user_id')
    .eq('code', referralCode.toUpperCase())
    .single();

  if (!codeData) return false;

  // Create referral record
  const { error } = await supabase.from('referrals').insert({
    referrer_user_id: codeData.user_id,
    referred_user_id: referredUserId,
    referred_email: referredEmail,
    referral_code: referralCode.toUpperCase(),
    status: 'signed_up',
  });

  return !error;
}

/**
 * Get the referral share link.
 */
export function getReferralLink(code: string): string {
  return `${REFERRAL_LINK_BASE}?ref=${encodeURIComponent(code)}`;
}

/**
 * Copy referral link to clipboard.
 */
export async function copyReferralLink(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getReferralLink(code));
    return true;
  } catch {
    return false;
  }
}
