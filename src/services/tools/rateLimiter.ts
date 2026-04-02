/**
 * Rate limiter for form downloads.
 *
 * Tier 0 (anonymous): Client-side localStorage (3/day) — intentionally bypassable.
 * Tier 1 (free account): Server-side via usage_tracking table (10/day).
 * Tier 2 (pro) / School: Unlimited — no enforcement.
 */

import { supabase } from '../../lib/supabase';

const STORAGE_KEY = 'edusync_tool_usage';
const ANON_DAILY_LIMIT = 3;

// ─── Tier 0 (anonymous, localStorage) ────────────────────

interface UsageData {
  date: string;
  count: number;
}

function getLocalUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: '', count: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: '', count: 0 };
  }
}

function getToday(): string {
  return new Date().toDateString();
}

/** Tier 0 only — synchronous client-side check. */
export function canDownload(): boolean {
  const usage = getLocalUsage();
  if (usage.date !== getToday()) return true;
  return usage.count < ANON_DAILY_LIMIT;
}

/** Tier 0 only — record to localStorage. */
export function recordDownload(): void {
  const today = getToday();
  const usage = getLocalUsage();
  if (usage.date !== today) {
    usage.date = today;
    usage.count = 0;
  }
  usage.count++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function downloadsRemaining(): number {
  const usage = getLocalUsage();
  if (usage.date !== getToday()) return ANON_DAILY_LIMIT;
  return Math.max(0, ANON_DAILY_LIMIT - usage.count);
}

export function getDailyLimit(): number {
  return ANON_DAILY_LIMIT;
}

// ─── Authenticated rate limiting (server-side) ───────────

/**
 * Check whether an authenticated user can download today.
 * Queries the usage_tracking table for today's download count
 * and compares against their subscription's maxDownloadsPerDay.
 *
 * Returns { allowed, remaining, limit }.
 */
export async function canDownloadAuthenticated(
  userId: string,
  maxDownloadsPerDay: number,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Pro / School = unlimited
  if (maxDownloadsPerDay >= 99999) {
    return { allowed: true, remaining: maxDownloadsPerDay, limit: maxDownloadsPerDay };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('usage_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', 'form_download')
    .gte('created_at', todayStart.toISOString());

  const used = error ? 0 : (count ?? 0);
  const remaining = Math.max(0, maxDownloadsPerDay - used);

  return {
    allowed: remaining > 0,
    remaining,
    limit: maxDownloadsPerDay,
  };
}

/**
 * Record a download in usage_tracking (server-side).
 * Should be called AFTER successful PDF generation.
 */
export async function recordDownloadAuthenticated(
  userId: string,
  formType: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from('usage_tracking').insert({
    user_id: userId,
    action: 'form_download',
    form_type: formType,
    metadata,
  });
}
