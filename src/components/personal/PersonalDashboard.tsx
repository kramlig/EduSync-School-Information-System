/**
 * PersonalDashboard — Home page for personal workspace.
 *
 * Professional dashboard with live stats, quick actions,
 * section overview, and onboarding stepper.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
  SparklesIcon,
  RocketLaunchIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  HeartIcon,
  BookOpenIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import UpgradeModal from './UpgradeModal';

interface Props {
  userName: string;
  tier: string;
  studentCount: number;
  maxStudents: number;
  schoolId: string;
  teacherId: string;
}

interface SectionInfo {
  id: string;
  name: string;
  grade_level: number;
  isAdvisory: boolean;
  studentCount: number;
}

const ONBOARDING_STEPS = [
  {
    id: 'sections',
    title: 'Create your sections',
    desc: 'Set up your class sections and choose which subjects you teach.',
    icon: ClipboardDocumentListIcon,
    path: '/personal/sections',
    cta: 'My Sections',
  },
  {
    id: 'students',
    title: 'Add your students',
    desc: 'Import a CSV or enter student names and LRNs one by one.',
    icon: UserGroupIcon,
    path: '/personal/students',
    cta: 'Add Students',
  },
  {
    id: 'grades',
    title: 'Enter quarterly grades',
    desc: 'Open the gradebook and record grades per subject for each quarter.',
    icon: AcademicCapIcon,
    path: '/personal/grades',
    cta: 'Open Gradebook',
  },
  {
    id: 'forms',
    title: 'Generate DepEd forms',
    desc: 'Download SF2, SF5, and SF9 as professional PDF files instantly.',
    icon: DocumentTextIcon,
    path: '/personal/forms',
    cta: 'Generate Forms',
  },
] as const;

const PersonalDashboard: React.FC<Props> = ({
  userName, tier, studentCount: propStudentCount, maxStudents, schoolId, teacherId,
}) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();
  const firstName = userName.split(' ')[0] || 'Teacher';

  /* ── Live stats ── */
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [studentCount, setStudentCount] = useState(propStudentCount);
  const [subjectCount, setSubjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !teacherId) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        // Fetch sections where teacher has assignments OR is adviser
        const [taRes, advRes] = await Promise.all([
          supabase
            .from('teaching_assignments')
            .select('section_id')
            .eq('teacher_id', teacherId)
            .eq('school_id', schoolId)
            .eq('is_active', true),
          supabase
            .from('sections')
            .select('id')
            .eq('adviser_id', teacherId)
            .eq('school_id', schoolId),
        ]);
        const taIds = (taRes.data || []).map(r => r.section_id);
        const advIds = (advRes.data || []).map(r => r.id);
        const allSectionIds = [...new Set([...taIds, ...advIds])];

        if (allSectionIds.length > 0) {
          // Get section details + student counts
          const { data: secData } = await supabase
            .from('sections')
            .select('id, name, grade_level, adviser_id')
            .in('id', allSectionIds);

          const { data: stuData } = await supabase
            .from('students')
            .select('id, section_id')
            .eq('school_id', schoolId)
            .in('section_id', allSectionIds);

          const stuCountMap: Record<string, number> = {};
          (stuData || []).forEach(s => {
            stuCountMap[s.section_id] = (stuCountMap[s.section_id] || 0) + 1;
          });

          if (!cancelled) {
            const mapped = (secData || []).map(s => ({
              id: s.id,
              name: s.name,
              grade_level: s.grade_level,
              isAdvisory: s.adviser_id === teacherId,
              studentCount: stuCountMap[s.id] || 0,
            }));
            mapped.sort((a, b) => a.grade_level - b.grade_level || a.name.localeCompare(b.name));
            setSections(mapped);
            setStudentCount(mapped.reduce((sum, s) => sum + s.studentCount, 0));
          }
        }

        // Count distinct subjects assigned
        const { data: subjData } = await supabase
          .from('teaching_assignments')
          .select('subject')
          .eq('teacher_id', teacherId)
          .eq('school_id', schoolId)
          .eq('is_active', true);
        if (!cancelled) {
          const uniqueSubjects = new Set((subjData || []).map(r => r.subject).filter(Boolean));
          setSubjectCount(uniqueSubjects.size);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [schoolId, teacherId]);

  const studentPercent = maxStudents > 0 ? Math.min((studentCount / maxStudents) * 100, 100) : 0;
  const isAtLimit = studentCount >= maxStudents && tier === 'free';
  const advisorySections = useMemo(() => sections.filter(s => s.isAdvisory), [sections]);

  // Onboarding
  const storageKey = 'edusync_onboarding_dismissed';
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === '1');
  const showOnboarding = sections.length === 0 && studentCount === 0 && !dismissed && !loading;
  const dismissOnboarding = () => { localStorage.setItem(storageKey, '1'); setDismissed(true); };

  // Current date for header
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Greeting based on time of day
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 sm:p-8">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-indigo-200 text-sm font-medium flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4" />
                {dateStr}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {greeting}, {firstName}!
              </h1>
              <p className="text-indigo-200 text-sm mt-1">
                {sections.length > 0
                  ? `You have ${sections.length} section${sections.length > 1 ? 's' : ''} and ${studentCount} student${studentCount !== 1 ? 's' : ''}.`
                  : 'Set up your workspace to get started.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                tier === 'free'
                  ? 'bg-white/15 text-white backdrop-blur-sm'
                  : 'bg-amber-400/90 text-amber-950'
              }`}>
                {tier === 'free' ? (
                  <>Free Plan</>
                ) : (
                  <><SparklesIcon className="w-3.5 h-3.5" /> Pro</>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sections */}
        <Link
          to="/personal/sections"
          className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {loading ? <span className="inline-block w-8 h-7 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /> : sections.length}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Sections</p>
        </Link>

        {/* Students */}
        <Link
          to="/personal/students"
          className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {loading ? <span className="inline-block w-8 h-7 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /> : studentCount}
            {!loading && tier === 'free' && (
              <span className="text-sm font-normal text-slate-400 ml-1">/ {maxStudents}</span>
            )}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Students</p>
          {tier === 'free' && !loading && (
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1 mt-2">
              <div
                className={`h-1 rounded-full transition-all ${studentPercent >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${studentPercent}%` }}
              />
            </div>
          )}
        </Link>

        {/* Subjects */}
        <Link
          to="/personal/grades"
          className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-green-200 dark:hover:border-green-700 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpenIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-green-400 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {loading ? <span className="inline-block w-8 h-7 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /> : subjectCount}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Subjects</p>
        </Link>

        {/* Advisory */}
        <Link
          to="/personal/core-values"
          className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-rose-200 dark:hover:border-rose-700 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HeartIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-400 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {loading ? <span className="inline-block w-8 h-7 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /> : advisorySections.length}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Advisory</p>
        </Link>
      </div>

      {/* ─── Capacity Warning ─── */}
      {isAtLimit && !loading && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <SparklesIcon className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
            You've reached the <strong>{maxStudents}-student</strong> limit on the Free plan.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="shrink-0 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* ─── Two-column: Sections + Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Section Overview (wider) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">My Sections</h2>
            <Link
              to="/personal/sections"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-0.5"
            >
              View all <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No sections yet</p>
                <Link
                  to="/personal/sections"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" /> Create Section
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map(sec => (
                  <div
                    key={sec.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      sec.isAdvisory
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}>
                      G{sec.grade_level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                        {sec.name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {sec.studentCount} student{sec.studentCount !== 1 ? 's' : ''}
                        {sec.isAdvisory && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium">
                            <HeartIcon className="w-3 h-3" /> Adviser
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      to="/personal/grades"
                      className="shrink-0 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (narrower) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white px-1">Quick Actions</h2>

          {[
            { to: '/personal/sections', icon: ClipboardDocumentListIcon, color: 'indigo', label: 'My Sections', desc: 'Create & manage sections' },
            { to: '/personal/students', icon: UserGroupIcon, color: 'blue', label: 'My Students', desc: 'Add or import students' },
            { to: '/personal/grades', icon: AcademicCapIcon, color: 'green', label: 'Grade Entry', desc: 'Enter quarterly grades' },
            { to: '/personal/attendance', icon: CalendarDaysIcon, color: 'amber', label: 'Attendance', desc: 'Record daily attendance' },
            { to: '/personal/forms', icon: DocumentTextIcon, color: 'purple', label: 'Generate Forms', desc: 'SF2, SF5, SF9' },
            { to: '/personal/analytics', icon: ClockIcon, color: 'cyan', label: 'Analytics', desc: 'Reports & insights' },
          ].map(item => {
            const colorClasses: Record<string, string> = {
              indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50',
              blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50',
              green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/50',
              amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50',
              purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50',
              cyan: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/50',
            };
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${colorClasses[item.color]}`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Onboarding Stepper (new users only) ─── */}
      {showOnboarding && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 sm:p-8 relative">
          <button
            onClick={dismissOnboarding}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
            aria-label="Dismiss onboarding"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <RocketLaunchIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Get started with EduSync
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Set up your workspace in 4 easy steps
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {ONBOARDING_STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  i === 0
                    ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 shadow-sm'
                    : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7">{step.desc}</p>
                </div>
                {i === 0 && (
                  <button
                    onClick={() => navigate(step.path)}
                    className="shrink-0 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    {step.cta}
                    <ArrowRightIcon className="w-3.5 h-3.5 inline ml-1" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            You can always access these from the sidebar.{' '}
            <button onClick={dismissOnboarding} className="underline hover:text-slate-600 dark:hover:text-slate-300">Skip for now</button>
          </p>
        </div>
      )}

      {/* ─── Pro Upgrade Banner (free users with data) ─── */}
      {tier === 'free' && studentCount > 0 && !loading && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-bold">Unlock Pro Features</h3>
              </div>
              <p className="text-sm text-indigo-100 max-w-lg">
                Unlimited students, multiple sections, all DepEd forms, and priority support — just ₱79/month.
              </p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={tier} />
    </div>
  );
};

export default PersonalDashboard;
