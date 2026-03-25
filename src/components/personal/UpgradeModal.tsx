/**
 * UpgradeModal — Pricing comparison modal for free → Pro upgrade.
 *
 * Shown when any "Upgrade" / "View Plans" button is clicked in personal workspace.
 * Wired to PayMongo checkout via paymentService.
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { redirectToCheckout, PRICING, type BillingCycle } from '../../services/paymentService';

interface Props {
  open: boolean;
  onClose: () => void;
  currentTier: string;
}

const FREE_FEATURES = [
  'Up to 50 students',
  '1 advisory section',
  '1 teaching section (ECR)',
  'SF2, SF5, SF9 form generation',
  '10 PDF downloads per day',
  'Watermark on PDFs',
  'Cloud data storage',
];

const PRO_FEATURES = [
  'Unlimited students',
  '2 advisory sections',
  'Unlimited teaching sections',
  'All teacher-level forms',
  'Unlimited PDF downloads',
  'No watermark on PDFs',
  'Grade history (multi-year)',
  'Excel/CSV bulk import',
  'Offline PWA mode',
  'Priority email support',
];

const UpgradeModal: React.FC<Props> = ({ open, onClose, currentTier }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      await redirectToCheckout(billingCycle);
    } catch (err: any) {
      setError(err?.message || 'Payment setup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold mb-3">
            <SparklesIcon className="w-3.5 h-3.5" />
            Choose Your Plan
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Upgrade to Personal Pro
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Get the most out of EduSync for your classroom
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-6">
          {/* Free Plan */}
          <div className={`rounded-xl border-2 p-5 ${
            currentTier === 'free'
              ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
              : 'border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Free</h3>
              {currentTier === 'free' && (
                <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">₱0</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">forever</span>
            </div>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl border-2 border-indigo-500 dark:border-indigo-400 p-5 relative bg-indigo-50/50 dark:bg-indigo-900/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300">Pro</h3>
              {currentTier === 'pro' && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            <div className="mb-1">
              <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                {billingCycle === 'monthly' ? '₱79' : '₱399'}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            {/* Billing cycle toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Yearly
                <span className="ml-1 text-green-600 dark:text-green-400 font-bold">-58%</span>
              </button>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <CheckIcon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {currentTier === 'free' && (
              <>
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-3 text-center">{error}</p>
                )}
                <button
                  className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? 'Redirecting to checkout…' : `Upgrade Now — ${billingCycle === 'monthly' ? PRICING.monthly.label : PRICING.yearly.label}`}
                </button>
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                  Secure payment via GCash, Maya, GrabPay, or Card
                </p>
              </>
            )}
          </div>
        </div>

        {/* School plan teaser */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/30 rounded-b-2xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Need a school-wide solution?{' '}
            <a href="mailto:support@edusync.ph" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Contact us
            </a>{' '}
            for School Plans starting at ₱1,999/month.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
