/**
 * SchoolBillingSettings — Subscription & billing management for institutional schools.
 *
 * Sections:
 *  1. Current Plan — plan name, status, usage bars
 *  2. Trial Banner — days remaining + upgrade CTA (if trial)
 *  3. Plan Comparison — Starter vs Professional vs Enterprise
 *  4. Billing History — past payments table
 *  5. Cancel Subscription
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { useSchoolSubscription, useSchoolCapacity } from '../../hooks/useSchoolSubscription';
import {
  SCHOOL_PRICING,
  getPlanDisplayName,
  redirectToSchoolCheckout,
  getSchoolBillingHistory,
  cancelSchoolSubscription,
} from '../../services/schoolSubscriptionService';
import { CheckCircleIcon, ExclamationTriangleIcon } from '../../../components/icons';

type BillingCycle = 'monthly' | 'yearly';

interface BillingHistoryItem {
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
}

const SchoolBillingSettings: React.FC = () => {
  const { schoolId } = useSchoolContext();
  const { subscription, plan, limits, isTrialExpired, trialDaysLeft, loading, refresh } = useSchoolSubscription();
  const { usage, canAddStudents, canAddTeachers, canAddSections } = useSchoolCapacity();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [_historyLoading, setHistoryLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);

  // Handle payment callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setPaymentStatus('success');
      refresh();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refresh]);

  // Load billing history
  useEffect(() => {
    if (!schoolId || schoolId === 'default') return;
    setHistoryLoading(true);
    getSchoolBillingHistory(schoolId)
      .then(setBillingHistory)
      .catch(() => setBillingHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [schoolId, subscription]);

  const handleUpgrade = useCallback(async (targetPlan: 'starter' | 'professional') => {
    if (!schoolId) return;
    setUpgrading(true);
    try {
      await redirectToSchoolCheckout(schoolId, targetPlan, billingCycle);
    } catch (err) {
      console.error('Checkout error:', err);
      setUpgrading(false);
    }
  }, [schoolId, billingCycle]);

  const handleCancel = useCallback(async () => {
    if (!schoolId) return;
    setCancelling(true);
    try {
      await cancelSchoolSubscription(schoolId);
      refresh();
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(false);
    }
  }, [schoolId, refresh]);

  // Memoize to prevent infinite loops
  const usagePercents = useMemo(() => ({
    students: limits.maxStudents > 0 ? Math.min(100, (usage.students / limits.maxStudents) * 100) : 0,
    teachers: limits.maxTeachers > 0 ? Math.min(100, (usage.teachers / limits.maxTeachers) * 100) : 0,
    sections: limits.maxSections > 0 ? Math.min(100, (usage.sections / limits.maxSections) * 100) : 0,
  }), [usage, limits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isPaid = plan === 'starter' || plan === 'professional' || plan === 'enterprise';
  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>

      {/* Payment callback banners */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircleIcon />
          <div>
            <p className="font-medium text-green-800">Payment successful!</p>
            <p className="text-sm text-green-600">Your subscription has been upgraded. It may take a moment to reflect.</p>
          </div>
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <ExclamationTriangleIcon />
          <p className="text-yellow-800">Payment was cancelled. No charges were made.</p>
        </div>
      )}

      {/* Trial Banner */}
      {plan === 'trial' && (
        <div className={`rounded-lg p-4 ${isTrialExpired ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${isTrialExpired ? 'text-red-800' : 'text-blue-800'}`}>
                {isTrialExpired
                  ? 'Your trial has expired'
                  : trialDaysLeft !== null
                    ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your trial`
                    : 'You are on the Trial plan'
                }
              </p>
              <p className={`text-sm mt-1 ${isTrialExpired ? 'text-red-600' : 'text-blue-600'}`}>
                {isTrialExpired
                  ? 'Upgrade now to continue adding students, teachers, and sections.'
                  : 'Upgrade to unlock unlimited teachers, sections, and up to 1,500 students.'
                }
              </p>
            </div>
            <button
              onClick={() => handleUpgrade('starter')}
              disabled={upgrading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
            >
              {upgrading ? 'Redirecting...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                plan === 'professional' ? 'bg-indigo-100 text-indigo-800' :
                plan === 'starter' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getPlanDisplayName(plan)}
              </span>
              {isActive && <span className="text-xs text-green-600">Active</span>}
              {isCancelled && <span className="text-xs text-yellow-600">Cancels at period end</span>}
            </div>
          </div>
          {subscription?.amountCents && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ₱{(subscription.amountCents / 100).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                per {subscription.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>
          )}
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="text-sm text-gray-500 mb-4">
            {isCancelled ? 'Access until' : 'Next billing date'}:{' '}
            <span className="font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        )}

        {/* Usage Bars */}
        <div className="space-y-3">
          <UsageBar
            label="Students"
            used={usage.students}
            max={limits.maxStudents}
            percent={usagePercents.students}
            warning={!canAddStudents}
          />
          <UsageBar
            label="Teachers"
            used={usage.teachers}
            max={limits.maxTeachers}
            percent={usagePercents.teachers}
            warning={!canAddTeachers}
          />
          <UsageBar
            label="Sections"
            used={usage.sections}
            max={limits.maxSections}
            percent={usagePercents.sections}
            warning={!canAddSections}
          />
        </div>

        {/* Cancel button for paid plans */}
        {isPaid && isActive && !isCancelled && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-4">
              Your access will continue until the end of the current billing period
              {subscription?.currentPeriodEnd && (
                <> ({new Date(subscription.currentPeriodEnd).toLocaleDateString('en-PH')})</>
              )}. After that, your school will revert to the Trial plan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {isPaid ? 'Change Plan' : 'Choose a Plan'}
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Yearly <span className="text-green-600 text-xs">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trial / Free */}
          <PlanCard
            name="Trial"
            price="Free"
            subtitle="Get started"
            features={[
              'Up to 100 students',
              'Up to 5 teachers',
              'Up to 10 sections',
              'Basic SIS features',
            ]}
            isCurrent={plan === 'trial'}
            onSelect={undefined}
          />

          {/* Starter */}
          <PlanCard
            name="Starter"
            price={billingCycle === 'monthly'
              ? SCHOOL_PRICING.starter.monthly.label
              : SCHOOL_PRICING.starter.yearly.label
            }
            subtitle={billingCycle === 'yearly'
              ? SCHOOL_PRICING.starter.yearly.monthlyEquivalent
              : 'per month'
            }
            features={[
              'Up to 500 students',
              'Unlimited teachers',
              'Unlimited sections',
              'Parent portal',
              'Full SIS features',
            ]}
            isCurrent={plan === 'starter'}
            isRecommended
            onSelect={plan !== 'starter' && plan !== 'professional' && plan !== 'enterprise'
              ? () => handleUpgrade('starter')
              : undefined
            }
            loading={upgrading}
          />

          {/* Professional */}
          <PlanCard
            name="Professional"
            price={billingCycle === 'monthly'
              ? SCHOOL_PRICING.professional.monthly.label
              : SCHOOL_PRICING.professional.yearly.label
            }
            subtitle={billingCycle === 'yearly'
              ? SCHOOL_PRICING.professional.yearly.monthlyEquivalent
              : 'per month'
            }
            features={[
              'Up to 1,500 students',
              'Unlimited teachers',
              'Unlimited sections',
              'AI lesson plans (Gemini)',
              'Advanced analytics',
              'Division reporting',
              'Priority support',
            ]}
            isCurrent={plan === 'professional'}
            onSelect={plan !== 'professional' && plan !== 'enterprise'
              ? () => handleUpgrade('professional')
              : undefined
            }
            loading={upgrading}
          />
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Need more than 1,500 students? <a href="mailto:support@edusync.ph" className="text-indigo-600 hover:underline">Contact us</a> for Enterprise pricing.
        </p>
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Description</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Method</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Period</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map(item => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2 px-3">{new Date(item.date).toLocaleDateString('en-PH')}</td>
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-3 font-medium">₱{item.amount.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'paid' ? 'bg-green-100 text-green-700' :
                        item.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 capitalize">{item.paymentMethod || '—'}</td>
                    <td className="py-2 px-3 text-gray-500">
                      {item.periodStart && item.periodEnd
                        ? `${new Date(item.periodStart).toLocaleDateString('en-PH')} — ${new Date(item.periodEnd).toLocaleDateString('en-PH')}`
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────

interface UsageBarProps {
  label: string;
  used: number;
  max: number;
  percent: number;
  warning: boolean;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, used, max, percent, warning }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600">{label}</span>
      <span className={warning ? 'text-red-600 font-medium' : 'text-gray-500'}>
        {used.toLocaleString()} / {max >= 99999 ? '∞' : max.toLocaleString()}
      </span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          warning ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-indigo-500'
        }`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  </div>
);

interface PlanCardProps {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  isCurrent: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
  loading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name, price, subtitle, features, isCurrent, isRecommended, onSelect, loading,
}) => (
  <div className={`relative rounded-lg border-2 p-5 ${
    isCurrent ? 'border-indigo-500 bg-indigo-50/30' :
    isRecommended ? 'border-indigo-300' :
    'border-gray-200'
  }`}>
    {isRecommended && !isCurrent && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
        Recommended
      </span>
    )}
    {isCurrent && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
        Current Plan
      </span>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mt-1">{name}</h3>
    <p className="text-2xl font-bold text-gray-900 mt-2">{price}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
    <ul className="mt-4 space-y-2">
      {features.map(f => (
        <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
          <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {f}
        </li>
      ))}
    </ul>
    {onSelect && !isCurrent && (
      <button
        onClick={onSelect}
        disabled={loading}
        className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? 'Redirecting...' : `Upgrade to ${name}`}
      </button>
    )}
  </div>
);

export default SchoolBillingSettings;
