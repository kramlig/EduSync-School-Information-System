/**
 * TeachersLandingPage — Marketing page for Personal Workspace.
 *
 * Targets individual Filipino teachers. Sells the free workspace
 * and Pro upgrade (₱79/month). Separate from the school admin
 * landing page at /landing.
 *
 * Route: /teachers
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const FEATURES = [
  {
    icon: DocumentTextIcon,
    title: 'Generate DepEd Forms',
    desc: 'SF2, SF5, SF9 — auto-filled from your data. Download as PDF instantly.',
  },
  {
    icon: UserGroupIcon,
    title: 'Manage Students',
    desc: 'Add students with LRN, gender, and contact info. Search and organize easily.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Digital Gradebook',
    desc: 'Enter quarterly grades per subject. Auto-compute averages following DepEd Order No. 8.',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Dashboard',
    desc: 'See grade distribution, passing rate, honor roll, and at-risk students at a glance.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Works on Any Device',
    desc: 'Phone, tablet, or laptop. Use offline — your data syncs when you reconnect.',
  },
  {
    icon: LockClosedIcon,
    title: 'Your Data, Your Control',
    desc: 'Private workspace. No one else sees your data. Export or delete anytime.',
  },
];

const FREE_FEATURES = [
  'Up to 50 students',
  '1 advisory section',
  'Generate SF2, SF5, SF9',
  '10 downloads per day',
  'Digital gradebook',
  'Analytics dashboard',
];

const PRO_FEATURES = [
  'Unlimited students',
  'Unlimited sections',
  'All 6 personal forms',
  'Unlimited downloads',
  'Priority support',
  'No watermarks',
  'Advanced analytics',
  'Data export',
];

const TESTIMONIALS = [
  {
    name: 'Maria Santos',
    role: 'Grade 6 Teacher, Zamboanga City',
    text: 'Hindi ko na kailangan mag-encode sa Excel nang oras-oras. Sa EduSync, i-click ko lang at nag-generate na ang SF5 ko.',
  },
  {
    name: 'Jose Dela Cruz',
    role: 'Grade 10 Adviser, Davao Region',
    text: 'Ang dali gamitin. Naka-save ako ng 3 hours per week sa report cards. Pati attendance, auto na.',
  },
  {
    name: 'Ana Reyes',
    role: 'Grade 3 Teacher, CALABARZON',
    text: 'Free pa! Perfect for solo teachers like me na walang school system. Salamat EduSync!',
  },
];

const TeachersLandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'EduSync for Teachers — Free DepEd Form Generator & Gradebook';
    return () => { document.title = 'EduSync — School Information System for Filipino Educators'; };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">EduSync</span>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
              for Teachers
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/personal/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full mb-6">
            Free forever — no credit card needed
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Your personal<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              DepEd command center
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Generate SF2, SF5, and SF9 forms. Track grades and attendance.
            All in one workspace built for Filipino public school teachers.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/personal/signup"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
            >
              Create Free Workspace
              <ArrowRightIcon className="w-5 h-5 inline ml-2" />
            </Link>
            <Link
              to="/tools/form-generator"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Try Form Generator
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Used by 500+ teachers across 12 regions
          </p>
        </div>
      </section>

      {/* ─── Problem Statement ─── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Tired of manual encoding?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Filipino teachers spend <span className="font-bold text-indigo-600">8-12 hours per grading period</span>{' '}
            manually filling DepEd forms in Excel. Report cards, attendance sheets,
            promotion lists — all done by hand, over and over.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { stat: '8+ hrs', label: 'per grading period on forms' },
              { stat: '4×', label: 'repeated for quarterly reports' },
              { stat: '40+', label: 'students per section to encode' },
            ].map((item) => (
              <div key={item.stat} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-3xl font-extrabold text-indigo-600">{item.stat}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Everything you need, in one workspace
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              No more juggling Excel files, Google Sheets, and paper forms.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Simple, teacher-friendly pricing
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Start free. Upgrade only when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Free</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Perfect to get started</p>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₱0</span>
                <span className="text-slate-400"> / forever</span>
              </p>
              <ul className="mt-6 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/personal/signup"
                className="mt-6 block text-center w-full py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-500 p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pro</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">For dedicated teachers</p>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₱79</span>
                <span className="text-slate-400"> / month</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">or ₱399/year (save 58%)</p>
              <ul className="mt-6 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/personal/signup"
                className="mt-6 block text-center w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Start Free, Upgrade Anytime
              </Link>
            </div>
          </div>

          {/* School plan teaser */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Need it for your whole school?{' '}
              <Link to="/landing" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                See School Plans →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white mb-10">
            Teachers love EduSync
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
              >
                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-10">
            Start in 2 minutes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign up free', desc: 'Enter your name, email, and school info. No credit card needed.' },
              { step: '2', title: 'Add your students', desc: 'Type or paste LRNs and names. Import from CSV if you have existing data.' },
              { step: '3', title: 'Generate forms', desc: 'Click generate — download beautiful SF2, SF5, SF9 PDFs instantly.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Referral CTA ─── */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Refer a colleague, get a month free</h2>
            <p className="mt-2 text-indigo-100 text-sm">
              Share your referral link. When they upgrade, you get 1 month of Pro free.
              They get their first month at just ₱29.
            </p>
            <Link
              to="/personal/signup"
              className="mt-6 inline-block px-6 py-3 bg-white text-indigo-600 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Stop encoding. Start teaching.
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Join hundreds of Filipino teachers who automated their DepEd paperwork with EduSync.
          </p>
          <Link
            to="/personal/signup"
            className="mt-8 inline-block px-10 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
          >
            Get Started — It's Free
            <ArrowRightIcon className="w-5 h-5 inline ml-2" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} EduSync. Made with ❤️ for Filipino educators.
          </p>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/privacy" className="hover:text-slate-700 dark:hover:text-slate-200">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-200">Terms</Link>
            <Link to="/landing" className="hover:text-slate-700 dark:hover:text-slate-200">For Schools</Link>
            <Link to="/tools/form-generator" className="hover:text-slate-700 dark:hover:text-slate-200">Free Tools</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeachersLandingPage;
