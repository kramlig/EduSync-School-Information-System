/**
 * Client-side rate limiter for Tier 0 (anonymous) form downloads.
 * Uses localStorage — intentionally bypassable (free tier is a marketing tool).
 */

const STORAGE_KEY = 'edusync_tool_usage';
const DAILY_LIMIT = 3;

interface UsageData {
  date: string;
  count: number;
}

function getUsage(): UsageData {
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

export function canDownload(): boolean {
  const usage = getUsage();
  if (usage.date !== getToday()) return true;
  return usage.count < DAILY_LIMIT;
}

export function recordDownload(): void {
  const today = getToday();
  const usage = getUsage();
  if (usage.date !== today) {
    usage.date = today;
    usage.count = 0;
  }
  usage.count++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function downloadsRemaining(): number {
  const usage = getUsage();
  if (usage.date !== getToday()) return DAILY_LIMIT;
  return Math.max(0, DAILY_LIMIT - usage.count);
}

export function getDailyLimit(): number {
  return DAILY_LIMIT;
}
