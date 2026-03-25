/**
 * HomeroomGuidanceView — Shared Homeroom Guidance competency rating view.
 *
 * Works in both the main workspace (receives schoolData + session) and the
 * personal workspace (receives schoolId directly). The component internally
 * detects which mode it's in and fetches students accordingly.
 *
 * Grid: Students × Competencies per quarter, rated 0-4.
 * Uses useHomeroomGuidancePostgreSQL hook for data + mutations.
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  BookOpenIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useHomeroomGuidancePostgreSQL, type HomeroomGuidanceGrade } from '../src/hooks/useHomeroomGuidancePostgreSQL';
import { getCurrentSchoolYear } from '../services/dateHelpers';

/* ────────── Constants ────────── */

const QUARTERS = [
  { key: 'q1', label: 'Q1 – First Quarter' },
  { key: 'q2', label: 'Q2 – Second Quarter' },
  { key: 'q3', label: 'Q3 – Third Quarter' },
  { key: 'q4', label: 'Q4 – Fourth Quarter' },
] as const;

const HOMEROOM_COMPETENCIES: Record<string, string[]> = {
  'FIRST QUARTER': [
    'Value oneself',
    'Value others',
    'Respect individual differences',
    'Gain understanding of oneself and others',
    'Identify the methods of effective study habits toward lifelong learning',
    'Demonstrate effective study habit',
  ],
  'SECOND QUARTER': [
    'Provide proper procedure toward responsible decision-making',
    'Evaluate experiences in decision-making toward achieving common good',
    'Share the lessons learned from school and community that can be used in daily living',
    'Apply lessons from home, school, and community to daily living with consideration to family and society',
    'Understand the importance of guidance from parents or guardians and significant adults in choosing a profession, vocation, and future plans',
  ],
  'THIRD QUARTER': [
    'Enrich knowledge and skills toward academic achievement',
    'Reflect on the decisions made for life and profession',
  ],
  'FOURTH QUARTER': [
    "Share one's abilities for the development of others and community",
    'Strengthen self-empowerment to respond to the needs of the community',
    'Respond to personal and social needs that can contribute to the promotion of international standards',
    'Demonstrate academic excellence based on global needs',
  ],
};

const QUARTER_TO_LABEL: Record<string, string> = {
  q1: 'FIRST QUARTER',
  q2: 'SECOND QUARTER',
  q3: 'THIRD QUARTER',
  q4: 'FOURTH QUARTER',
};

const RATING_OPTIONS = [
  { value: 4, label: '4', desc: 'Developed and Commendable', color: 'text-green-700 bg-green-100 dark:bg-green-900/40' },
  { value: 3, label: '3', desc: 'Sufficiently Developed', color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/40' },
  { value: 2, label: '2', desc: 'Developing', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40' },
  { value: 1, label: '1', desc: 'Needs Improvement', color: 'text-orange-700 bg-orange-100 dark:bg-orange-900/40' },
  { value: 0, label: '0', desc: 'No Chance to observe', color: 'text-slate-500 bg-slate-100 dark:bg-slate-700' },
];

/* ────────── Types ────────── */

interface MainWorkspaceProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser; type: 'staff' | 'student' };
  schoolId?: never;
}

interface PersonalWorkspaceProps {
  schoolId: string;
  schoolData?: never;
  session?: never;
}

type Props = MainWorkspaceProps | PersonalWorkspaceProps;

/* ────────── Component ────────── */

const HomeroomGuidanceView: React.FC<Props> = (props) => {
  const isPersonal = 'schoolId' in props && typeof props.schoolId === 'string' && !props.schoolData;
  const resolvedSchoolId = isPersonal
    ? props.schoolId
    : ((props as MainWorkspaceProps).session?.user as AuthUser)?.schoolId || '';

  const schoolYear = useMemo(() => getCurrentSchoolYear(), []);

  // Determine current user role and adviser status for editing access
  const authUser = !isPersonal ? (props as MainWorkspaceProps).session?.user as AuthUser : null;
  const currentUserId = authUser ? ((authUser as any).postgresqlId || authUser.id) : null;
  const isAdminLike = authUser ? ['admin', 'principal', 'registrar', 'superadmin'].includes(authUser.role) : false;

  /* ── Section filter (main workspace only) ── */
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [quarter, setQuarter] = useState<string>('q1');
  const [successMsg, setSuccessMsg] = useState('');

  /* ── Fetch data via shared hooks ── */
  const { students: pgStudents, loading: studentsLoading } = useStudentsPostgreSQL({
    schoolId: resolvedSchoolId,
    sectionId: !isPersonal && selectedSectionId !== 'all' ? selectedSectionId : undefined,
  });
  const { sections: pgSections } = useSectionsPostgreSQL({
    schoolId: isPersonal ? undefined : resolvedSchoolId,
  });
  const {
    grades: hgGrades,
    loading: gradesLoading,
    error: hookError,
    updateRating,
    refetch,
  } = useHomeroomGuidancePostgreSQL(
    true,
    resolvedSchoolId,
    schoolYear,
    !isPersonal && selectedSectionId !== 'all' ? selectedSectionId : undefined,
  );

  const loading = studentsLoading || gradesLoading;
  const error = hookError?.message || null;

  /* ── Derived ── */
  const students = useMemo(() => pgStudents || [], [pgStudents]);
  const sections = useMemo(() => pgSections || [], [pgSections]);

  // Adviser gating: only adviser (or admin-like roles) can edit homeroom guidance for a section
  const canEditHomeroom = useMemo(() => {
    // Personal workspace: owner can always edit
    if (isPersonal) return true;
    // Admin/principal/registrar/superadmin can always edit
    if (isAdminLike) return true;
    // If no specific section selected ("all"), disable editing (must pick a section first)
    if (!selectedSectionId || selectedSectionId === 'all') return false;
    // Teachers can only edit if they are the adviser for the selected section
    const section = sections.find(s => s.id === selectedSectionId);
    return section?.adviserId === currentUserId;
  }, [isPersonal, isAdminLike, selectedSectionId, sections, currentUserId]);

  const gradesMap = useMemo(() => {
    const map = new Map<string, HomeroomGuidanceGrade>();
    for (const g of hgGrades) map.set(g.studentId, g);
    return map;
  }, [hgGrades]);

  const competencies = useMemo(() => {
    return HOMEROOM_COMPETENCIES[QUARTER_TO_LABEL[quarter]] || [];
  }, [quarter]);

  const currentQuarterLabel = useMemo(() => {
    return QUARTERS.find(q => q.key === quarter)?.label || '';
  }, [quarter]);

  const ratingsKey = useMemo(() => {
    const map: Record<string, keyof Pick<HomeroomGuidanceGrade, 'q1Ratings' | 'q2Ratings' | 'q3Ratings' | 'q4Ratings'>> = {
      q1: 'q1Ratings', q2: 'q2Ratings', q3: 'q3Ratings', q4: 'q4Ratings',
    };
    return map[quarter];
  }, [quarter]);

  /* ── Debounced save ── */
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const saveRating = useCallback((studentId: string, competency: string, value: number | null) => {
    const timerKey = `${studentId}:${competency}`;

    const existingTimer = debounceTimers.current.get(timerKey);
    if (existingTimer) clearTimeout(existingTimer);

    debounceTimers.current.set(timerKey, setTimeout(async () => {
      setSaving(prev => new Set(prev).add(timerKey));
      try {
        await updateRating(studentId, quarter as 'q1' | 'q2' | 'q3' | 'q4', competency, value, schoolYear);
      } catch (err: any) {
        console.error('[HomeroomGuidanceView] save error:', err);
      } finally {
        setSaving(prev => {
          const s = new Set(prev);
          s.delete(timerKey);
          return s;
        });
      }
    }, 400));
  }, [quarter, schoolYear, updateRating]);

  /* ── Fill all ── */
  const fillAll = useCallback((competency: string, value: number) => {
    for (const s of students) {
      saveRating(s.id, competency, value);
    }
    setSuccessMsg(`Filled all with ${value}`);
    setTimeout(() => setSuccessMsg(''), 2000);
  }, [students, saveRating]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading homeroom guidance data...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6 text-indigo-600" />
            Homeroom Guidance Assessment
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Rate each competency: 4 (Developed), 3 (Sufficient), 2 (Developing), 1 (Needs Improvement), 0 (No Chance)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Section filter — main workspace only */}
          {!isPersonal && sections.length > 0 && (
            <select
              title="Section"
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Sections</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {/* Quarter selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            {QUARTERS.map(q => (
              <button
                key={q.key}
                onClick={() => setQuarter(q.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  quarter === q.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {q.key.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={refetch}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{successMsg}</p>
        </div>
      )}

      {/* Adviser-only editing notice */}
      {!isPersonal && !canEditHomeroom && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {!selectedSectionId || selectedSectionId === 'all'
              ? 'Select a specific section to edit homeroom guidance ratings.'
              : 'Only the class adviser can edit homeroom guidance ratings for this section. You are viewing in read-only mode.'}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        School Year: <span className="font-medium text-slate-700 dark:text-slate-200">{schoolYear}</span>
        {' · '}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">{currentQuarterLabel}</span>
        {' · '}
        <span>{students.length} students</span>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">LEGEND:</div>
        <div className="flex flex-wrap gap-3 text-xs">
          {RATING_OPTIONS.map(r => (
            <span key={r.value} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-[11px] ${r.color}`}>
                {r.label}
              </span>
              <span className="text-slate-600 dark:text-slate-400">– {r.desc}</span>
            </span>
          ))}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium">No students found.</p>
          <p className="text-xs mt-1">
            {isPersonal
              ? <>Add students from the <a href="/personal/students" className="underline font-medium">My Students</a> page first.</>
              : 'No students match the current filters. Try selecting a different section.'}
          </p>
        </div>
      ) : (
        /* Competency Table */
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-700/50 text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 min-w-[180px]">
                    Student
                  </th>
                  {competencies.map((comp, idx) => (
                    <th key={idx} className="text-center px-2 py-2 font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600 min-w-[150px]">
                      <div className="text-[11px] leading-tight mb-1">{comp}</div>
                      {canEditHomeroom && (
                        <div className="flex items-center justify-center gap-0.5">
                          {RATING_OPTIONS.map(r => (
                            <button
                              key={r.value}
                              onClick={() => fillAll(comp, r.value)}
                              title={`Fill all with ${r.value}`}
                              className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-300"
                            >
                              All {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const grade = gradesMap.get(s.id);
                  const qRatings: Record<string, number> = grade ? (grade[ratingsKey] || {}) : {};

                  return (
                    <tr key={s.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-750/30'}>
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 whitespace-nowrap">
                        {s.lastName}, {s.firstName}
                      </td>
                      {competencies.map((comp, cIdx) => {
                        const currentVal = qRatings[comp] as number | undefined;
                        const cellSaving = saving.has(`${s.id}:${comp}`);

                        return (
                          <td key={cIdx} className="text-center px-1 py-1 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-center gap-0.5">
                              {RATING_OPTIONS.map(r => (
                                <button
                                  key={r.value}
                                  onClick={() => canEditHomeroom && saveRating(s.id, comp, currentVal === r.value ? null : r.value)}
                                  disabled={cellSaving || !canEditHomeroom}
                                  className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                                    !canEditHomeroom ? (currentVal === r.value ? r.color + ' ring-1 ring-current opacity-60' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed') :
                                    cellSaving ? 'opacity-50 cursor-wait' :
                                    currentVal === r.value ? r.color + ' ring-1 ring-current' :
                                    'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                  }`}
                                  title={!canEditHomeroom ? 'Read-only — only the class adviser can edit' : currentVal === r.value ? `Clear ${r.label}` : `${r.label} – ${r.desc}`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeroomGuidanceView;
