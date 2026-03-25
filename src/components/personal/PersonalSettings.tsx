/**
 * PersonalSettings — Settings page for personal workspace.
 *
 * Shows workspace info, subscription tier, usage stats, and account actions.
 */

import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  UserIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  GiftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import UpgradeModal from './UpgradeModal';
import ReferralCard from './ReferralCard';
import JoinSchoolModal from './JoinSchoolModal';
import { getBillingHistory, cancelSubscription, getSubscriptionStatus, type BillingHistoryItem } from '../../services/paymentService';

interface Props {
  userName: string;
  email: string;
  schoolName: string;
  tier: string;
  schoolId: string;
  userId: string;
}

interface UsageStats {
  studentCount: number;
  learningAreaCount: number;
  gradeCount: number;
  downloadsToday: number;
}

const TIER_LIMITS = {
  free: { maxStudents: 50, maxDownloads: 10 },
  pro: { maxStudents: 99999, maxDownloads: 99999 },
  school: { maxStudents: 99999, maxDownloads: 99999 },
};

const PersonalSettings: React.FC<Props> = ({ userName, email, schoolName, tier, schoolId, userId }) => {
  const [currentTier, setCurrentTier] = useState(tier);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showJoinSchool, setShowJoinSchool] = useState(false);
  const [usage, setUsage] = useState<UsageStats>({ studentCount: 0, learningAreaCount: 0, gradeCount: 0, downloadsToday: 0 });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'cancelled'; text: string } | null>(null);
  const cardClass = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5';

  // Handle return from PayMongo checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setPaymentMessage({ type: 'success', text: 'Payment successful! Your Pro subscription is now active.' });
      window.history.replaceState({}, '', window.location.pathname);
      // Fetch real subscription status and update session
      getSubscriptionStatus()
        .then((status) => {
          if (status.tier) {
            setCurrentTier(status.tier);
            // Update localStorage session so the tier persists across navigation
            try {
              const raw = localStorage.getItem('edusync_session');
              if (raw) {
                const session = JSON.parse(raw);
                session.user.tier = status.tier;
                localStorage.setItem('edusync_session', JSON.stringify(session));
              }
            } catch { /* ignore */ }
          }
        })
        .catch(() => {});
    } else if (payment === 'cancelled') {
      setPaymentMessage({ type: 'cancelled', text: 'Payment was cancelled. You can upgrade anytime.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;

    async function fetchUsage() {
      setLoadingUsage(true);
      const [studentsRes, areasRes, gradesRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('learning_areas').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabase.from('grades').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      ]);
      if (cancelled) return;
      setUsage({
        studentCount: studentsRes.count ?? 0,
        learningAreaCount: areasRes.count ?? 0,
        gradeCount: gradesRes.count ?? 0,
        downloadsToday: 0,
      });
      setLoadingUsage(false);
    }

    fetchUsage();
    return () => { cancelled = true; };
  }, [schoolId]);

  // Fetch billing history for pro users
  useEffect(() => {
    if (currentTier === 'free') return;
    setLoadingBilling(true);
    getBillingHistory()
      .then(setBillingHistory)
      .catch(() => setBillingHistory([]))
      .finally(() => setLoadingBilling(false));
  }, [currentTier]);

  // Fetch real subscription status on mount to catch webhook updates
  useEffect(() => {
    getSubscriptionStatus()
      .then((status) => {
        if (status.tier && status.tier !== currentTier) {
          setCurrentTier(status.tier);
          try {
            const raw = localStorage.getItem('edusync_session');
            if (raw) {
              const session = JSON.parse(raw);
              session.user.tier = status.tier;
              localStorage.setItem('edusync_session', JSON.stringify(session));
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const limits = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const studentPct = limits.maxStudents > 0 ? Math.min(100, Math.round((usage.studentCount / limits.maxStudents) * 100)) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Cog6ToothIcon className="w-6 h-6 text-slate-600" />
          Settings
        </h1>
      </div>

      {/* Payment return message */}
      {paymentMessage && (
        <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${
          paymentMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          <p className={`text-sm font-medium ${
            paymentMessage.type === 'success'
              ? 'text-green-800 dark:text-green-300'
              : 'text-amber-800 dark:text-amber-300'
          }`}>
            {paymentMessage.text}
          </p>
          <button
            onClick={() => setPaymentMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-3"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Usage Stats */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <ChartBarIcon className="w-4 h-4" />
          Usage
        </h2>
        {loadingUsage ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Students usage bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Students</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {usage.studentCount} / {currentTier === 'free' ? limits.maxStudents : '∞'}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    studentPct >= 90 ? 'bg-red-500' : studentPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: currentTier === 'free' ? `${studentPct}%` : '5%' }}
                />
              </div>
              {currentTier === 'free' && studentPct >= 80 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {studentPct >= 100 ? 'Limit reached!' : 'Approaching limit'} —{' '}
                  <button className="underline font-medium" onClick={() => setShowUpgrade(true)}>Upgrade to Pro</button>
                </p>
              )}
            </div>

            {/* Summary stats grid */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white">{usage.studentCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Students</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white">{usage.learningAreaCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Subjects</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white">{usage.gradeCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Grades</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <SparklesIcon className="w-4 h-4" />
          Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white capitalize">
              {currentTier} Plan
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentTier === 'free'
                ? '50 students, 1 section, 10 downloads/day'
                : currentTier === 'pro'
                ? 'Unlimited students & downloads'
                : 'Full school features'}
            </p>
          </div>
          {currentTier === 'free' && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
        {currentTier === 'free' && (
          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              Unlock Pro for ₱79/month
            </p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
              Unlimited students, offline mode, advanced reports, priority support
            </p>
          </div>
        )}
        {currentTier === 'pro' && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={async () => {
                if (!window.confirm('Cancel your Pro subscription? You\'ll keep Pro features until the end of your current billing period.')) return;
                try {
                  const result = await cancelSubscription();
                  setPaymentMessage({
                    type: 'cancelled',
                    text: `Subscription cancelled. Pro features active until ${new Date(result.endsAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                  });
                } catch {
                  setPaymentMessage({ type: 'cancelled', text: 'Failed to cancel subscription. Please try again.' });
                }
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 underline transition-colors"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* Billing History (only for paid users) */}
      {currentTier !== 'free' && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
            <ClockIcon className="w-4 h-4" />
            Billing History
          </h2>
          {loadingBilling ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            </div>
          ) : billingHistory.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No billing records yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {billingHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-slate-800 dark:text-white">{item.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {item.paymentMethod && (
                        <span className="ml-2 text-slate-400">via {item.paymentMethod}</span>
                      )}
                    </p>
                    {item.periodStart && item.periodEnd && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Coverage: {new Date(item.periodStart).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        {' — '}
                        {new Date(item.periodEnd).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      ₱{item.amount.toFixed(2)}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      item.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      item.status === 'refunded' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      item.status === 'cancelled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account info */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <UserIcon className="w-4 h-4" />
          Account
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="font-medium text-slate-800 dark:text-white">{userName}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-slate-800 dark:text-white">{email}</dd>
          </div>
        </dl>
      </div>

      {/* School / workspace info */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <BuildingLibraryIcon className="w-4 h-4" />
          School Information
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">School Name</dt>
            <dd className="font-medium text-slate-800 dark:text-white">{schoolName}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Workspace ID</dt>
            <dd className="font-mono text-xs text-slate-500 dark:text-slate-400">{schoolId}</dd>
          </div>
        </dl>
      </div>

      {/* Data Export */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <ArrowDownTrayIcon className="w-4 h-4" />
          Data Export
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Download all your workspace data as a JSON file.
        </p>
        <button
          onClick={async () => {
            const [students, grades, areas, attendance] = await Promise.all([
              supabase.from('students').select('*').eq('school_id', schoolId),
              supabase.from('grades').select('*').eq('school_id', schoolId),
              supabase.from('learning_areas').select('*').eq('school_id', schoolId),
              supabase.from('attendance').select('*').eq('school_id', schoolId),
            ]);
            const blob = new Blob([JSON.stringify({
              exportedAt: new Date().toISOString(),
              students: students.data,
              grades: grades.data,
              learningAreas: areas.data,
              attendance: attendance.data,
            }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edusync-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
        >
          Export All Data
        </button>
      </div>

      {/* Referral Program */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <GiftIcon className="w-4 h-4" />
          Refer a Teacher
        </h2>
        <ReferralCard userId={userId} userName={userName} />
      </div>

      {/* Join a School */}
      <div className={`${cardClass} border-dashed`}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2">
          <BuildingLibraryIcon className="w-4 h-4" />
          Join a School
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Has your school adopted EduSync? Enter your invitation code to join the school workspace and collaborate with other teachers.
        </p>
        <button
          onClick={() => setShowJoinSchool(true)}
          className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          Enter Invitation Code
        </button>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={currentTier} />
      <JoinSchoolModal
        isOpen={showJoinSchool}
        onClose={() => setShowJoinSchool(false)}
        userId={userId}
        userName={userName}
        email={email}
      />
    </div>
  );
};

export default PersonalSettings;
