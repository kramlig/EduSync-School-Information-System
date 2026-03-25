/**
 * EduSync Landing Page - High-Level Marketing Homepage
 * 
 * A modern, conversion-focused landing page showcasing EduSync's capabilities.
 * Designed for school administrators, principals, and decision-makers.
 * 
 * Sections:
 * 1. Hero - Attention-grabbing headline with CTA
 * 2. Problem Statement - Pain points we solve
 * 3. Solution Overview - Key features (6 pillars)
 * 4. Feature Showcase - Detailed capabilities with visuals
 * 5. Benefits - Time savings, cost reduction, impact metrics
 * 6. Social Proof - Success stories & testimonials
 * 7. Pricing - Transparent plans
 * 8. FAQ - Common questions
 * 9. CTA - Final call to action
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  BellIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './landing-animations.css';
import { TrialSignupModal } from './TrialSignupModal';
import EdusyncLogo from '../../../components/EdusyncLogo';
import { DashboardMockup, PhoneMockup, FormPreview } from './LandingIllustrations';

// Self-contained FAQ item — keeps its own open/close state so toggling
// doesn't re-render the entire LandingPage and lose scroll position.
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="font-bold text-lg text-slate-900 dark:text-white">
          {question}
        </span>
        {isOpen ? (
          <ChevronUpIcon className="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-slate-700 dark:text-slate-300">
          {answer}
        </div>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hero Section
  const HeroSection = () => (
    <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white overflow-hidden min-h-screen flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32 w-full" style={{ paddingTop: '2em' }}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <SparklesIcon className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold">100% DepEd-Compliant</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-tight">
              The Future of
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                School Management
              </span>
            </h1>

            <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
              Transform your school with AI-powered analytics, automated DepEd forms, 
              and digital enrollment—all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => setIsTrialModalOpen(true)}
                className="group px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-yellow-300 hover:text-indigo-900 transition-all shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="https://youtu.be/RFOSq6nwfio"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Watch Demo
              </a>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
                <span>30-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-24 pt-12 border-t border-white/20">
          <div className="text-center">
            <p className="text-4xl lg:text-5xl font-bold mb-2">47K+</p>
            <p className="text-blue-200">Schools in PH to Serve</p>
          </div>
          <div className="text-center">
            <p className="text-4xl lg:text-5xl font-bold mb-2">80%</p>
            <p className="text-blue-200">Time Saved</p>
          </div>
          <div className="text-center">
            <p className="text-4xl lg:text-5xl font-bold mb-2">95%</p>
            <p className="text-blue-200">Faster Forms</p>
          </div>
          <div className="text-center">
            <p className="text-4xl lg:text-5xl font-bold mb-2">100%</p>
            <p className="text-blue-200">DepEd Compliant</p>
          </div>
        </div>
      </div>
    </section>
  );

  // Problem Statement
  const ProblemSection = () => (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            The Challenges Philippine Schools Face
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Traditional school management is holding educators back. It's time for change.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: '📄',
              title: 'Manual Paperwork Overload',
              description: 'Teachers spend 40% of their time on forms instead of teaching.',
              impact: '300+ hours wasted per year'
            },
            {
              icon: '📊',
              title: 'No Real-Time Insights',
              description: 'At-risk students identified too late, missing intervention windows.',
              impact: '25% of students slip through'
            },
            {
              icon: '🔄',
              title: 'Duplicate Data Entry',
              description: 'Same information entered multiple times across different forms.',
              impact: '60% of data entry is redundant'
            },
            {
              icon: '💰',
              title: 'Payment Tracking Chaos',
              description: 'Cash receipts get lost, parents unclear on balances, no digital records.',
              impact: '90% of billing errors due to manual tracking'
            },
            {
              icon: '⚠️',
              title: 'Calculation Errors',
              description: 'Manual grading leads to mistakes in student records.',
              impact: '15% error rate in manual forms'
            },
            {
              icon: '📑',
              title: 'Compliance Nightmares',
              description: 'DepEd forms require exact formatting—hard to maintain manually.',
              impact: 'Weeks spent on EBEIS submissions'
            },
            {
              icon: '📞',
              title: 'Parent Communication Gaps',
              description: 'No digital portal for parents, leading to endless calls and home visits.',
              impact: '500+ calls/month to school office'
            },
            {
              icon: '👥',
              title: 'Limited Parent Access',
              description: 'Parents have no visibility into student progress or enrollment status.',
              impact: '80% prefer digital access'
            }
          ].map((problem, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-200 dark:border-slate-700">
              <div className="text-5xl mb-4">{problem.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                {problem.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {problem.description}
              </p>
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                <span>⚡</span>
                {problem.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Solution - 9 Pillars (Updated to showcase Phase 2 features)
  const SolutionSection = () => (
    <section className="py-20 bg-white dark:bg-slate-800" data-section="solution">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            The Complete EduSync Solution
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Nine powerful modules that transform school operations from chaos to clarity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <AcademicCapIcon className="w-12 h-12" />,
              title: 'Academic Management',
              description: 'Complete gradebook with AI-powered analytics and predictions',
              color: 'indigo',
              features: ['Automated grading', 'Honor roll detection', 'Performance tracking']
            },
            {
              icon: <DocumentTextIcon className="w-12 h-12" />,
              title: 'DepEd Forms',
              description: 'Auto-generate Form 137, 138, SF1, SF2, SF9, and ELLN assessments',
              color: 'blue',
              features: ['3-click generation', 'Pixel-perfect formatting', 'Bulk export']
            },
            {
              icon: <UserGroupIcon className="w-12 h-12" />,
              title: 'Enrollment Portal',
              description: 'Digital application with document upload and auto-approval workflow',
              color: 'green',
              features: ['7-step wizard', 'Document upload', 'Status tracking']
            },
            {
              icon: <ChartBarIcon className="w-12 h-12" />,
              title: 'Analytics & Insights',
              description: 'AI-powered predictions and early warning system for at-risk students',
              color: 'purple',
              features: ['Risk detection', 'Trend analysis', 'Smart recommendations']
            },
            {
              icon: <ClipboardDocumentListIcon className="w-12 h-12" />,
              title: 'ELLN Assessment',
              description: 'Digital K-3 literacy and numeracy tracking with ILMP generator',
              color: 'amber',
              features: ['11 domains', 'Progress charts', 'Compliance reports']
            },
            {
              icon: <SparklesIcon className="w-12 h-12" />,
              title: 'AI-Powered',
              description: 'Intelligent recommendations, automated insights, and predictive modeling',
              color: 'pink',
              features: ['Next quarter predictions', 'Intervention strategies', 'Subject analysis']
            },
            {
              icon: <UsersIcon className="w-12 h-12" />,
              title: 'Parent Portal',
              description: 'Complete transparency with 24/7 digital access to student progress and billing',
              color: 'teal',
              features: ['Real-time grade viewing', 'Attendance monitoring', 'Digital payment tracking'],
              isNew: true
            },
            {
              icon: <CurrencyDollarIcon className="w-12 h-12" />,
              title: 'Financial Management',
              description: 'End-to-end billing with digital receipts and payment verification',
              color: 'emerald',
              features: ['Fee structure management', 'Instant receipt generation', 'Payment proof upload'],
              isNew: true
            },
            {
              icon: <BellIcon className="w-12 h-12" />,
              title: 'Smart Notifications',
              description: 'Automated multi-channel alerts keep parents and teachers informed',
              color: 'rose',
              features: ['Email & SMS alerts', 'Grade post notifications', 'Absence alerts (3+ days)'],
              isNew: true
            }
          ].map((pillar, index) => {
            const colorClasses = {
              indigo: 'from-indigo-500 to-indigo-700',
              blue: 'from-blue-500 to-blue-700',
              green: 'from-green-500 to-green-700',
              purple: 'from-purple-500 to-purple-700',
              amber: 'from-amber-500 to-amber-700',
              pink: 'from-pink-500 to-pink-700',
              teal: 'from-teal-500 to-teal-700',
              emerald: 'from-emerald-500 to-emerald-700',
              rose: 'from-rose-500 to-rose-700'
            };

            return (
              <div key={index} className="group bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 dark:border-slate-700 hover:-translate-y-2 relative">
                {pillar.isNew && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    NEW ✨
                  </div>
                )}
                
                <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[pillar.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {pillar.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                  {pillar.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {pillar.description}
                </p>

                <ul className="space-y-2">
                  {pillar.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // Benefits/Impact
  const ImpactSection = () => (
    <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Measurable Impact on Your School
          </h2>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
            Built to deliver measurable results for your school.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { metric: '80%', label: 'Time Savings', description: 'Reduce paperwork by 80%', icon: '⏱️' },
            { metric: '95%', label: 'Faster Forms', description: 'Form 138 in 30 seconds', icon: '⚡' },
            { metric: '25%', label: 'Better Outcomes', description: 'Early intervention success', icon: '📈' },
            { metric: '60%', label: 'Cost Reduction', description: 'Less paper, more efficiency', icon: '💰' },
            { metric: '100%', label: 'DepEd Compliant', description: 'All forms accurate', icon: '✅' },
            { metric: '300+', label: 'Hours Saved', description: 'Per school year', icon: '🎯' },
            { metric: '95%', label: 'Parent Satisfaction', description: 'Love digital portal access', icon: '⭐' },
            { metric: '5-Min', label: 'Payment Recording', description: 'From receipt to digital', icon: '💳' }
          ].map((impact, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center hover:bg-white/20 transition-all">
              <div className="text-4xl mb-3">{impact.icon}</div>
              <div className="text-5xl font-bold mb-2">{impact.metric}</div>
              <div className="text-xl font-semibold mb-2">{impact.label}</div>
              <p className="text-sm text-indigo-200">{impact.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Free Tools CTA Section
  const FreeToolsSection = () => (
    <section className="py-20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" data-section="free-tools">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-800/40 px-4 py-2 rounded-full mb-6">
          <DocumentTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">100% Free — No Account Needed</span>
        </div>

        <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          Generate DepEd Forms <span className="text-emerald-600">Instantly</span>
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
          Upload your class data as CSV or Excel and download official SF2, SF5, and SF9 forms as PDF — right in your browser. No sign-up, no data leaves your device.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {[
            { form: 'SF2', desc: 'Daily Attendance Report', icon: '📋' },
            { form: 'SF5', desc: 'Promotion & Proficiency', icon: '📊' },
            { form: 'SF9', desc: 'Learner Progress Report Card', icon: '📝' },
          ].map(({ form, desc, icon }) => (
            <div key={form} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-3xl mb-3">{icon}</div>
              <div className="font-bold text-slate-900 dark:text-white">{form}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{desc}</div>
            </div>
          ))}
        </div>

        <Link
          to="/tools/form-generator"
          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl text-lg font-bold hover:bg-emerald-700 hover:shadow-lg hover:scale-105 transition-all"
        >
          Try the Free Form Generator
          <ArrowRightIcon className="w-5 h-5" />
        </Link>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
          3 free downloads per day · All data stays in your browser
        </p>
      </div>
    </section>
  );

  // Why Trust EduSync / See It In Action
  const TrustSection = () => (
    <section className="py-20 bg-slate-50 dark:bg-slate-900" data-section="why-edusync">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Built for Philippine Schools
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Designed from the ground up for DepEd compliance, Filipino workflows, and the unique needs of K-12 education.
          </p>
        </div>

        {/* Trust Pillars */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: '🛡️',
              title: '100% DepEd-Compliant',
              description: 'Form 137, 138, SF1, SF2, SF5, SF9, SF10, and ELLN — all pixel-perfect to DepEd standards.',
              gradient: 'from-blue-500 to-indigo-600',
            },
            {
              icon: '📡',
              title: 'Works Offline',
              description: 'Progressive Web App architecture means teachers can work even without internet. Data syncs automatically when back online.',
              gradient: 'from-teal-500 to-cyan-600',
            },
            {
              icon: '🔒',
              title: 'Secure & Private',
              description: 'Role-based access control with 6 user levels. Your school data is encrypted and isolated — no cross-school access.',
              gradient: 'from-slate-600 to-slate-800',
            },
            {
              icon: '🤖',
              title: 'AI-Powered Insights',
              description: 'Gemini AI generates lesson plans and identifies at-risk students automatically, so teachers can focus on teaching.',
              gradient: 'from-purple-500 to-pink-600',
            },
            {
              icon: '👨‍👩‍👧',
              title: 'Parent Portal Included',
              description: 'Parents get 24/7 access to grades, attendance, billing, and notifications — reducing office calls dramatically.',
              gradient: 'from-amber-500 to-orange-600',
            },
            {
              icon: '⚡',
              title: 'Fast Setup',
              description: 'Go live in days, not months. Import existing data, configure your school, and start generating forms immediately.',
              gradient: 'from-green-500 to-emerald-600',
            },
          ].map((item, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA: See It Live — with product mockups */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 lg:p-16 text-white overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: text + buttons */}
            <div className="text-center lg:text-left">
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                See EduSync In Action
              </h3>
              <p className="text-lg text-indigo-100 mb-8 max-w-xl">
                Book a free live demo and explore the full system with your own data. No commitment, no credit card.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => window.open('https://calendly.com/edusync/demo', '_blank')}
                  className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-yellow-300 hover:text-indigo-900 transition-all shadow-xl hover:scale-105"
                >
                  Schedule Free Demo
                </button>
                <button
                  onClick={() => setIsTrialModalOpen(true)}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Start 30-Day Free Trial
                </button>
              </div>
            </div>

            {/* Right: Product mockups */}
            <div className="hidden lg:flex items-center justify-center gap-6">
              <PhoneMockup />
              <div className="mt-12">
                <FormPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Pricing
  const PricingSection = () => (
    <section className="py-20 bg-white dark:bg-slate-800" data-section="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Less than ₱4 per student per month. Unlimited teachers included.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: 'Starter',
              price: '₱1,999',
              period: '/month',
              description: 'Perfect for small schools',
              features: [
                'Up to 500 students',
                'Unlimited teachers ✨',
                'Core features (grades, forms)',
                'Parent portal access',
                'Email support',
                '30-day free trial'
              ],
              cta: 'Start Free Trial',
              popular: false
            },
            {
              name: 'Professional',
              price: '₱4,999',
              period: '/month',
              description: 'Most popular choice',
              features: [
                'Up to 1,500 students',
                'Unlimited teachers ✨',
                'All features + AI analytics',
                'Parent portal with billing access',
                'Email & SMS notifications',
                'Payment proof verification',
                'Priority support',
                '30-day free trial'
              ],
              cta: 'Start Free Trial',
              popular: true
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              description: 'For large schools & divisions',
              features: [
                'Unlimited students',
                'Unlimited teachers',
                'All features + customization',
                'Dedicated account manager',
                'On-site training',
                'SLA guarantee'
              ],
              cta: 'Contact Sales',
              popular: false
            }
          ].map((plan, index) => (
            <div
              key={index}
              className={`relative bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 shadow-lg border-2 ${
                plan.popular
                  ? 'border-indigo-500 dark:border-indigo-400'
                  : 'border-slate-200 dark:border-slate-700'
              } hover:shadow-2xl transition-all ${plan.popular ? 'scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                {plan.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {plan.description}
              </p>

              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => 
                  plan.cta === 'Contact Sales' 
                    ? window.location.href = 'mailto:sales@edusync.ph?subject=Enterprise Plan Inquiry'
                    : setIsTrialModalOpen(true)
                }
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center mt-12 text-slate-600 dark:text-slate-400">
          <span className="text-green-600 dark:text-green-400 font-semibold">💰 Annual discount:</span> Save 20% with yearly payment
        </p>
      </div>
    </section>
  );

  // FAQ
  const FAQSection = () => {
    const faqs = [
      {
        question: 'Is EduSync really 100% DepEd-compliant?',
        answer: 'Yes! All forms (Form 137, 138, SF1, SF2, SF9, ELLN) follow official DepEd formats and calculations per Order No. 8, s. 2015. Our system is designed by educators familiar with Philippine education standards.'
      },
      {
        question: 'How long does it take to set up EduSync?',
        answer: 'Most schools are fully operational within 7 days. Setup includes account creation, data import, staff training, and testing. We provide free onboarding support to ensure smooth transition.'
      },
      {
        question: 'Do parents need to download an app?',
        answer: 'No! EduSync is a Progressive Web App (PWA) that works in any browser. Parents can access it from their phones or computers without downloading anything. They can also \'Add to Home Screen\' for easy access like a native app.'
      },
      {
        question: 'How does the billing system work?',
        answer: 'Our integrated billing system lets you create fee structures, record payments, and generate official receipts. Parents can view their balance online and upload payment proofs (photos of bank deposit slips) for verification. Everything is digital and auditable.'
      },
      {
        question: 'Can I import my existing student data?',
        answer: 'Absolutely! We support Excel/CSV imports and offer free migration assistance. Our team can help transfer data from your current system to EduSync.'
      },
      {
        question: 'What happens if internet connection is lost?',
        answer: 'EduSync is a Progressive Web App (PWA) with offline capabilities. You can continue working offline, and changes sync automatically when connection is restored.'
      },
      {
        question: 'Can I customize notification settings?',
        answer: 'Yes! You control what triggers notifications (grade posts, absences, announcements) and who receives them. Parents can opt-in for SMS alerts (standard messaging rates apply). All notifications are logged for reference.'
      },
      {
        question: 'Is my school data secure?',
        answer: 'Yes. We use bank-level encryption (SSL/TLS, AES-256), daily automatic backups, and comply with the Data Privacy Act 2012. Your data is stored securely on Google Cloud Platform.'
      },
      {
        question: 'Can parents access the system?',
        answer: 'Yes! Parents get their own portal to view student progress, grades, attendance, and billing statements. They can also submit enrollment applications and upload payment proofs online—all from their mobile phones.'
      }
    ];

    return (
      <section className="py-20 bg-slate-50 dark:bg-slate-900" data-section="faq">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Everything you need to know about EduSync.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Final CTA
  const FinalCTASection = () => (
    <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl lg:text-6xl font-bold mb-6">
          Ready to Transform Your School?
        </h2>
        <p className="text-xl lg:text-2xl mb-8 text-indigo-100">
          Start your free 30-day trial today — no credit card required. Experience the full power of EduSync.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => setIsTrialModalOpen(true)}
            className="px-10 py-5 bg-white text-indigo-700 rounded-xl font-bold text-xl hover:bg-yellow-300 hover:text-indigo-900 transition-all shadow-2xl hover:scale-105"
          >
            Start Free Trial →
          </button>

          <button
            onClick={() => window.open('https://calendly.com/edusync/demo', '_blank')}
            className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white rounded-xl font-bold text-xl hover:bg-white/20 transition-all"
          >
            Schedule Demo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-300" />
            <span>Free 30-day trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-300" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-300" />
            <span>Free onboarding & training</span>
          </div>
        </div>

        <div className="mt-12 pt-12 border-t border-white/20">
          <p className="text-sm text-indigo-200 mb-2">Questions? Contact us:</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg">
            <a href="mailto:edusyncph@gmail.com" className="hover:text-yellow-300 transition-colors">
              📧 edusyncph@gmail.com
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="tel:+639988438814" className="hover:text-yellow-300 transition-colors">
              📱 +63 998 843 8814
            </a>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => window.open('https://edusync.ph', '_blank')} className="hover:text-yellow-300 transition-colors">
              💬 Live Chat
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // Footer Section
  const FooterSection = () => (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <EdusyncLogo size="md" showText={true} className="mb-4 brightness-200" />
            <p className="text-sm">
              Modern school management for the digital age. Empowering Filipino schools with DepEd-compliant technology.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => {
                    const section = document.querySelector('[data-section="solution"]');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const section = document.querySelector('[data-section="pricing"]');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Pricing
                </button>
              </li>
              <li>
                <Link 
                  to="/admin" 
                  className="hover:text-white transition-colors text-left block"
                >
                  Login
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setIsTrialModalOpen(true)} 
                  className="hover:text-white transition-colors text-left"
                >
                  Start Free Trial
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => {
                    const section = document.querySelector('[data-section="faq"]');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  FAQ
                </button>
              </li>
              <li><Link to="/teachers" className="hover:text-white transition-colors">For Teachers</Link></li>
              <li><Link to="/tools/form-generator" className="hover:text-white transition-colors">Free Form Generator</Link></li>
              <li><a href="mailto:edusyncph@gmail.com" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="mailto:edusyncph@gmail.com" className="hover:text-white transition-colors">Contact Sales</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © 2026 EduSync. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="https://facebook.com/edusync" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Facebook
            </a>
            <a href="https://twitter.com/edusync" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://linkedin.com/company/edusync" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation Bar - Notebook paper style with alternating blue/red lines */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo - Responsive: Text on desktop, icon only on mobile */}
            <div className="flex items-center flex-shrink-0">
              <div className="md:hidden">
                <EdusyncLogo size="md" showText={false} />
              </div>
              <div className="hidden md:block">
                <EdusyncLogo size="md" showText={true} />
              </div>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="solution"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="why-edusync"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Why EduSync
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="pricing"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="faq"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => setIsTrialModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:scale-105 transition-all"
              >
                Start Free Trial
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="px-6 py-4 space-y-3">
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="solution"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="why-edusync"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Why EduSync
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="pricing"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('[data-section="faq"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => {
                  window.location.href = '/admin';
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsTrialModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg text-base font-bold hover:shadow-lg transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>
      
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ImpactSection />
      <FreeToolsSection />
      <TrustSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <FooterSection />
      
      {/* Trial Signup Modal */}
      <TrialSignupModal 
        isOpen={isTrialModalOpen} 
        onClose={() => setIsTrialModalOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;
