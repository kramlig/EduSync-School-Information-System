/**
 * PersonalDashboard — Home page for personal workspace.
 *
 * Shows:
 *  - Student count (with tier limit indicator)
 *  - Grades status overview
 *  - Quick actions (Add Students, Enter Grades, Generate Forms)
 *  - Interactive onboarding stepper for new users
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckIcon,
  RocketLaunchIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import UpgradeModal from './UpgradeModal';

interface Props {
  userName: string;
  tier: string;
  studentCount: number;
  maxStudents: number;
}

const ONBOARDING_STEPS = [
  {
    id: 'students',
    title: 'Add your students',
    desc: 'Import a CSV or enter student names and LRNs one by one.',
    icon: UserGroupIcon,
    path: '/personal/students',
    cta: 'Add Students',
    color: 'blue',
  },
  {
    id: 'grades',
    title: 'Enter quarterly grades',
    desc: 'Open the gradebook and record grades per subject for each quarter.',
    icon: AcademicCapIcon,
    path: '/personal/grades',
    cta: 'Open Gradebook',
    color: 'green',
  },
  {
    id: 'forms',
    title: 'Generate DepEd forms',
    desc: 'Download SF2, SF5, and SF9 as professional PDF files instantly.',
    icon: DocumentTextIcon,
    path: '/personal/forms',
    cta: 'Generate Forms',
    color: 'purple',
  },
] as const;

const PersonalDashboard: React.FC<Props> = ({ userName, tier, studentCount, maxStudents }) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();
  const firstName = userName.split(' ')[0] || 'Teacher';
  const studentPercent = maxStudents > 0 ? Math.min((studentCount / maxStudents) * 100, 100) : 0;
  const isNearLimit = studentPercent >= 80;
  const isAtLimit = studentCount >= maxStudents && tier === 'free';

  // Dismiss onboarding permanently via localStorage
  const storageKey = 'edusync_onboarding_dismissed';
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === '1');
  const showOnboarding = studentCount === 0 && !dismissed;

  const dismissOnboarding = () => {
    localStorage.setItem(storageKey, '1');
    setDismissed(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Welcome back, {firstName}!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here's an overview of your personal workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Students card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Students</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {studentCount}
                {tier === 'free' && (
                  <span className="text-sm font-normal text-slate-400"> / {maxStudents}</span>
                )}
              </p>
            </div>
          </div>
          {tier === 'free' && (
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${studentPercent}%` }}
              />
            </div>
          )}
          {isAtLimit && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Student limit reached.{' '}
              <button className="font-semibold underline" onClick={() => setShowUpgrade(true)}>Upgrade</button>
            </p>
          )}
        </div>

        {/* Grades card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gradebook</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {studentCount > 0 ? 'Ready to enter grades' : 'Add students first'}
              </p>
            </div>
          </div>
        </div>

        {/* Forms card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">DepEd Forms</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                SF2, SF5, SF9 available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/personal/students"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <PlusIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add Students</p>
              <p className="text-xs text-slate-400">Import or enter manually</p>
            </div>
          </Link>

          <Link
            to="/personal/grades"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
              <AcademicCapIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Enter Grades</p>
              <p className="text-xs text-slate-400">Open gradebook</p>
            </div>
          </Link>

          <Link
            to="/personal/forms"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
              <DocumentTextIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Generate Forms</p>
              <p className="text-xs text-slate-400">SF2, SF5, SF9</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ─── Welcome Onboarding (first-time users) ─── */}
      {showOnboarding && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 sm:p-8 relative">
          <button
            onClick={dismissOnboarding}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
            aria-label="Dismiss onboarding"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <RocketLaunchIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Welcome to EduSync, {firstName}! 🎉
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Set up your workspace in 3 easy steps
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            {ONBOARDING_STEPS.map((step, i) => {
              const colorMap = {
                blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
              };
              const btnMap = {
                blue: 'bg-blue-600 hover:bg-blue-700',
                green: 'bg-green-600 hover:bg-green-700',
                purple: 'bg-purple-600 hover:bg-purple-700',
              };
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    i === 0
                      ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 shadow-sm'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[step.color]}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7">{step.desc}</p>
                  </div>
                  {i === 0 && (
                    <button
                      onClick={() => navigate(step.path)}
                      className={`shrink-0 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${btnMap[step.color]}`}
                    >
                      {step.cta}
                      <ArrowRightIcon className="w-3.5 h-3.5 inline ml-1" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            You can always access these from the sidebar. <button onClick={dismissOnboarding} className="underline hover:text-slate-600">Skip for now</button>
          </p>
        </div>
      )}

      {/* Pro upgrade banner for free users */}
      {tier === 'free' && studentCount > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5" />
            <h3 className="text-base font-semibold">Unlock Pro Features</h3>
          </div>
          <p className="text-sm text-indigo-100 mb-3">
            Upgrade to Personal Pro for unlimited students, multiple sections, and unlimited downloads at just ₱79/month.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            View Plans
          </button>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={tier} />
    </div>
  );
};

export default PersonalDashboard;
