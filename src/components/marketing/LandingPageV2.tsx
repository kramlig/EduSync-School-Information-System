import React, { useEffect } from 'react';
import {
  AcademicCapIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import heroPersonalWorkspace from '../../assets/landing/hero-personal-workspace.svg';
import featureAutomationStrip from '../../assets/landing/feature-automation-strip.svg';
import './landing-v2-animations.css';

/* ── Institutional Features (School-wide SIS) ── */
const institutionalFeatures = [
  {
    title: 'Multi-Role Dashboard',
    description: 'Dedicated views for Admin, Principal, Registrar, Teacher, Student, and Parent — each sees exactly what they need.',
    icon: UsersIcon,
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    title: 'Student & Enrollment',
    description: 'Complete student lifecycle — from public enrollment portal and application review to graduation records.',
    icon: UserGroupIcon,
    accent: 'from-cyan-500 to-sky-500',
  },
  {
    title: 'Grade Management',
    description: 'Full gradebook, class records, and quarterly grade summaries with DepEd-compliant computation formulas.',
    icon: AcademicCapIcon,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: '15+ DepEd Forms',
    description: 'SF1–SF10 (including SF9 Report Card and SF10 Permanent Record), SHS variants, and ELLN assessments — auto-generated from your data.',
    icon: DocumentTextIcon,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Financial Management',
    description: 'Fee structures, tuition tracking, payment recording, receipt generation, and financial reports for private schools.',
    icon: BanknotesIcon,
    accent: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Attendance & Scheduling',
    description: 'Daily attendance tracking, class scheduling, and substitute teacher management in one connected system.',
    icon: ClockIcon,
    accent: 'from-rose-500 to-red-500',
  },
  {
    title: 'Analytics & Reports',
    description: 'Assessment analytics, intervention planning, proficiency dashboards, and exportable reports across all sections.',
    icon: ChartBarIcon,
    accent: 'from-lime-500 to-green-500',
  },
  {
    title: 'Division Management',
    description: 'Multi-school network administration with aggregated SF5/SF6/SF7 reports, bulk imports, and audit logging.',
    icon: BuildingOffice2Icon,
    accent: 'from-blue-500 to-indigo-500',
  },
];

/* ── Personal Workspace Features (Solo Teacher) ── */
const personalFeatures = [
  {
    title: 'Student Master List',
    description: 'Manage up to 50 students free — search, filters, and profile-level context.',
    icon: UserGroupIcon,
    accent: 'from-cyan-500 to-sky-500',
  },
  {
    title: 'Quick Gradebook',
    description: 'Capture grades fast and move between quick gradebook and full class record.',
    icon: AcademicCapIcon,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'DepEd Forms',
    description: 'Generate SF9 Report Cards, SF10 Permanent Records, and more — directly from your grade data.',
    icon: DocumentTextIcon,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Attendance & Core Values',
    description: 'Track attendance, core values, and homeroom guidance in one workspace.',
    icon: ClipboardDocumentListIcon,
    accent: 'from-rose-500 to-red-500',
  },
];

/* ── Platform Differentiators ── */
const platformStats = [
  { label: 'DepEd forms supported', value: '15+' },
  { label: 'User roles', value: '6 portals' },
  { label: 'Report readiness', value: 'Always audit-ready' },
  { label: 'Works offline', value: 'PWA-enabled' },
];

/* ── Trust Signals ── */
const trustItems = [
  { icon: ShieldCheckIcon, text: 'DepEd-aligned compliance' },
  { icon: GlobeAltIcon, text: 'Offline-first PWA' },
  { icon: BuildingOffice2Icon, text: 'Multi-tenant isolation' },
  { icon: Cog6ToothIcon, text: 'Role-based access control' },
];

const socialProof = [
  {
    quote: 'Our daily class record routine dropped from nearly 2 hours to around 40 minutes.',
    name: 'Ma. Teresa L.',
    role: 'Grade 8 Adviser',
    metric: '67% faster record workflow',
  },
  {
    quote: 'Enrollment used to be chaos. Now parents apply online and we review from the dashboard.',
    name: 'John Carlo R.',
    role: 'School Registrar',
    metric: 'Zero paper enrollment forms',
  },
  {
    quote: 'All 12 schools in our division now submit SF5 and SF7 reports from one aggregated dashboard.',
    name: 'Angela P.',
    role: 'Division Supervisor',
    metric: '12 schools, 1 dashboard',
  },
];

const LandingPageV2: React.FC = () => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.lpv2-reveal'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -48px 0px' }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100"
      style={{ fontFamily: "Sora, Manrope, 'Segoe UI', sans-serif" }}
    >
      {/* ── Background Glow ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute top-24 right-0 h-[30rem] w-[30rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:pt-24">
        <div className="lpv2-reveal rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Complete School Information System
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                One Platform for
                <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-violet-300 bg-clip-text text-transparent">
                  Schools, Teachers, and Divisions
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200/90">
                EduSync is a complete, DepEd-aligned school information system — from enrollment and grading to
                15+ auto-generated forms, financial management, and multi-school division reporting.
                Run your entire school or start free as a solo teacher.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  School / Admin Login
                </a>
                <a
                  href="/personal/signup"
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                >
                  Free Teacher Workspace
                </a>
              </div>
            </div>

            <div className="relative lpv2-reveal">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/40 via-emerald-500/40 to-violet-500/40 blur-xl" />
              <div className="lpv2-image-shell relative rounded-2xl border border-white/15 bg-slate-900/90 shadow-2xl">
                <img
                  src={heroPersonalWorkspace}
                  alt="EduSync school information system dashboard preview"
                  className="lpv2-image-hero h-auto w-full"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats Bar */}
        <div className="lpv2-stagger mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((item) => (
            <div key={item.label} className="lpv2-reveal rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
              <p className="mt-2 text-xl font-extrabold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — INSTITUTIONAL FEATURES (School-Wide SIS)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="mb-8 lpv2-reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">For Schools &amp; Divisions</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Complete Institutional Management
          </h2>
          <p className="mt-3 max-w-3xl text-base text-slate-300">
            Everything a school needs — multi-role access, enrollment workflows, grade management,
            DepEd forms automation, financial tracking, and division-level reporting.
          </p>
        </div>

        <div className="lpv2-stagger grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {institutionalFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="lpv2-reveal group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] sm:p-6"
              >
                <div className={`mb-5 inline-flex rounded-lg bg-gradient-to-r ${feature.accent} p-3 text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </article>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="lpv2-reveal mt-10 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 sm:gap-10">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.text} className="flex items-center gap-2 text-sm text-slate-300">
                <Icon className="h-5 w-5 text-emerald-400" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — WORKFLOW VISUAL
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="lpv2-reveal mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">How It Works</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            From Student Data to DepEd-Ready Reports
          </h2>
        </div>
        <div className="lpv2-reveal overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <img
            src={featureAutomationStrip}
            alt="Workflow: student management to gradebook to auto-generated DepEd forms"
            className="lpv2-image-strip h-auto w-full"
            loading="lazy"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — PERSONAL WORKSPACE (Free Tier)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="lpv2-reveal rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Free for Solo Teachers
              </p>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Personal Teacher Workspace
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Don't have a school account? Start free with up to 50 students.
                Get your own gradebook, class records, DepEd forms, attendance tracker, and analytics — no admin needed.
              </p>
              <a
                href="/personal/signup"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 py-3 text-sm font-bold uppercase tracking-wider text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Start Free Workspace
              </a>
            </div>
            <div className="lpv2-stagger grid gap-4 sm:grid-cols-2">
              {personalFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="lpv2-reveal rounded-xl border border-white/10 bg-slate-900/60 p-4"
                  >
                    <div className={`mb-3 inline-flex rounded-lg bg-gradient-to-r ${feature.accent} p-2.5 text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — PORTALS (Student + Parent)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="lpv2-reveal mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Everyone Connected</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Dedicated Portals for Students &amp; Parents
          </h2>
        </div>
        <div className="lpv2-stagger grid gap-6 md:grid-cols-2">
          <article className="lpv2-reveal rounded-2xl border border-white/10 bg-white/[0.045] p-6 sm:p-8">
            <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 p-3 text-white shadow-lg">
              <AcademicCapIcon className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Student Portal</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Students view their grades, attendance, assignments, schedules, and announcements.
              They can track assignment submissions and see pending deadlines — all from their own dashboard.
            </p>
          </article>
          <article className="lpv2-reveal rounded-2xl border border-white/10 bg-white/[0.045] p-6 sm:p-8">
            <div className="mb-4 inline-flex rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 p-3 text-white shadow-lg">
              <SparklesIcon className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Parent Portal</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Parents monitor their children's grades, attendance, and billing.
              Multi-child support lets families with multiple students manage everything from one account.
            </p>
          </article>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — SOCIAL PROOF
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="mb-6 lpv2-reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Trusted by Educators</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Real Outcomes from Real Schools</h2>
        </div>

        <div className="lpv2-stagger grid gap-4 md:grid-cols-3">
          {socialProof.map((item) => (
            <article
              key={item.name}
              className="lpv2-reveal rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-lg"
            >
              <p className="text-sm leading-relaxed text-slate-200">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-slate-400">{item.role}</p>
                <p className="mt-2 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {item.metric}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="lpv2-reveal rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to modernize your school?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
            Whether you run an entire school or manage a single classroom, EduSync has the tools you need.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              School / Admin Login
            </a>
            <a
              href="/personal/signup"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
            >
              Start Free Teacher Workspace
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPageV2;
