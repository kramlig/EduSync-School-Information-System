/**
 * ReferralCard — Referral program widget for personal workspace settings.
 *
 * Shows the user's referral code, share link, and referral stats.
 * Loaded lazily only when the Settings page is visited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GiftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  getOrCreateReferralCode,
  getReferralStats,
  getReferralLink,
  copyReferralLink,
  type ReferralStats,
} from '../../services/referralService';

interface Props {
  userId: string;
  userName: string;
}

const ReferralCard: React.FC<Props> = ({ userId, userName }) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = userName.split(' ')[0] || 'Teacher';

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        await getOrCreateReferralCode(userId, firstName);
        const s = await getReferralStats(userId);
        if (!cancelled) setStats(s);
      } catch (err: any) {
        if (!cancelled) setError('Could not load referral data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (userId) init();
    return () => { cancelled = true; };
  }, [userId, firstName]);

  const handleCopy = useCallback(async () => {
    if (!stats?.code) return;
    const success = await copyReferralLink(stats.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [stats?.code]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {error || 'Referral program unavailable'}
      </p>
    );
  }

  const link = getReferralLink(stats.code);

  return (
    <div className="space-y-4">
      {/* Referral pitch */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Refer a colleague → They get Pro at ₱29 for their first month, you get 1 month free!
        </p>
        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
          Earn up to 6 free months per year
        </p>
      </div>

      {/* Referral code + copy */}
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Your referral code</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-mono font-bold text-slate-800 dark:text-white tracking-wide">
            {stats.code}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                Copy Link
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{link}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <UserPlusIcon className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.signedUp}</p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Signed Up</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.converted}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Converted</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.creditsRemaining}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Credits Left</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;
