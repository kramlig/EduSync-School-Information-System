/**
 * PersonalHomeroomGuidance — Homeroom Guidance competency rating for personal workspace.
 *
 * Grid: Students × Competencies per quarter, rated 0-4.
 * Saves to `homeroom_guidance_grades` table via Supabase.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpenIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { getCurrentSchoolYear } from '../../../services/dateHelpers';

interface Props {
  schoolId: string;
  tier: string;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
}

interface HGGradeRow {
  id: string;
  student_id: string;
  q1_ratings: Record<string, number>;
  q2_ratings: Record<string, number>;
  q3_ratings: Record<string, number>;
  q4_ratings: Record<string, number>;
}

const QUARTERS = [
  { key: 'q1', label: 'Q1 – First Quarter', dbCol: 'q1_ratings' },
  { key: 'q2', label: 'Q2 – Second Quarter', dbCol: 'q2_ratings' },
  { key: 'q3', label: 'Q3 – Third Quarter', dbCol: 'q3_ratings' },
  { key: 'q4', label: 'Q4 – Fourth Quarter', dbCol: 'q4_ratings' },
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

const QUARTER_COMPETENCY_MAP: Record<string, string> = {
  'FIRST QUARTER': 'q1',
  'SECOND QUARTER': 'q2',
  'THIRD QUARTER': 'q3',
  'FOURTH QUARTER': 'q4',
};

const RATING_OPTIONS = [
  { value: 4, label: '4', desc: 'Developed and Commendable', color: 'text-green-700 bg-green-100 dark:bg-green-900/40' },
  { value: 3, label: '3', desc: 'Sufficiently Developed', color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/40' },
  { value: 2, label: '2', desc: 'Developing', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40' },
  { value: 1, label: '1', desc: 'Needs Improvement', color: 'text-orange-700 bg-orange-100 dark:bg-orange-900/40' },
  { value: 0, label: '0', desc: 'No Chance to observe', color: 'text-slate-500 bg-slate-100 dark:bg-slate-700' },
];

export default function PersonalHomeroomGuidance({ schoolId, tier }: Props) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [grades, setGrades] = useState<Map<string, HGGradeRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [quarter, setQuarter] = useState<string>('q1');
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const schoolYear = useMemo(() => getCurrentSchoolYear(), []);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Get competencies for selected quarter
  const currentQuarterLabel = useMemo(() => {
    const entry = QUARTERS.find(q => q.key === quarter);
    return entry?.label || '';
  }, [quarter]);

  const competencies = useMemo(() => {
    const qMap: Record<string, string> = { q1: 'FIRST QUARTER', q2: 'SECOND QUARTER', q3: 'THIRD QUARTER', q4: 'FOURTH QUARTER' };
    return HOMEROOM_COMPETENCIES[qMap[quarter]] || [];
  }, [quarter]);

  const ratingsCol = useMemo(() => `${quarter}_ratings` as keyof Pick<HGGradeRow, 'q1_ratings' | 'q2_ratings' | 'q3_ratings' | 'q4_ratings'>, [quarter]);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, gradesRes] = await Promise.all([
        supabase.from('students')
          .select('id, first_name, last_name, middle_name')
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .order('last_name').order('first_name'),
        supabase.from('homeroom_guidance_grades')
          .select('id, student_id, q1_ratings, q2_ratings, q3_ratings, q4_ratings')
          .eq('school_id', schoolId)
          .eq('school_year', schoolYear)
          .is('deleted_at', null),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents(studentsRes.data || []);

      // Grades won't exist if table doesn't exist yet — handle gracefully
      const map = new Map<string, HGGradeRow>();
      if (gradesRes.data) {
        for (const g of gradesRes.data) {
          map.set(g.student_id, {
            ...g,
            q1_ratings: g.q1_ratings || {},
            q2_ratings: g.q2_ratings || {},
            q3_ratings: g.q3_ratings || {},
            q4_ratings: g.q4_ratings || {},
          });
        }
      }
      setGrades(map);
    } catch (err: any) {
      // Table might not exist yet — show helpful message
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        setError('Homeroom guidance table not found. Please run the migration: supabase/migrations/20260325_create_homeroom_guidance_grades.sql');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [schoolId, schoolYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save rating (debounced) ──
  const saveRating = useCallback((studentId: string, competency: string, value: number | null) => {
    const timerKey = `${studentId}:${competency}`;

    // Update local state immediately
    setGrades(prev => {
      const next = new Map(prev);
      const existing = next.get(studentId);
      const currentRatings = existing ? { ...existing[ratingsCol] } : {};

      if (value !== null) {
        currentRatings[competency] = value;
      } else {
        delete currentRatings[competency];
      }

      next.set(studentId, {
        id: existing?.id || '',
        student_id: studentId,
        q1_ratings: existing?.q1_ratings || {},
        q2_ratings: existing?.q2_ratings || {},
        q3_ratings: existing?.q3_ratings || {},
        q4_ratings: existing?.q4_ratings || {},
        [ratingsCol]: currentRatings,
      });
      return next;
    });

    // Debounce save
    const existing = debounceTimers.current.get(timerKey);
    if (existing) clearTimeout(existing);

    debounceTimers.current.set(timerKey, setTimeout(async () => {
      setSaving(prev => new Set(prev).add(timerKey));
      try {
        const grade = grades.get(studentId);
        const currentRatings = grade ? { ...grade[ratingsCol] } : {};
        if (value !== null) {
          currentRatings[competency] = value;
        } else {
          delete currentRatings[competency];
        }

        if (grade?.id) {
          const { error: upErr } = await supabase
            .from('homeroom_guidance_grades')
            .update({ [ratingsCol]: currentRatings, updated_at: new Date().toISOString() })
            .eq('id', grade.id);
          if (upErr) throw upErr;
        } else {
          const { data, error: insErr } = await supabase
            .from('homeroom_guidance_grades')
            .upsert({
              school_id: schoolId,
              student_id: studentId,
              school_year: schoolYear,
              [ratingsCol]: currentRatings,
            }, { onConflict: 'student_id,school_year' })
            .select('id, student_id, q1_ratings, q2_ratings, q3_ratings, q4_ratings')
            .single();
          if (insErr) throw insErr;
          if (data) {
            setGrades(prev => {
              const next = new Map(prev);
              next.set(data.student_id, {
                ...data,
                q1_ratings: data.q1_ratings || {},
                q2_ratings: data.q2_ratings || {},
                q3_ratings: data.q3_ratings || {},
                q4_ratings: data.q4_ratings || {},
              });
              return next;
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to save');
      } finally {
        setSaving(prev => {
          const s = new Set(prev);
          s.delete(timerKey);
          return s;
        });
      }
    }, 500));
  }, [schoolId, schoolYear, ratingsCol, grades]);

  // ── Fill all for a competency ──
  const fillAll = useCallback((competency: string, value: number) => {
    for (const s of students) {
      saveRating(s.id, competency, value);
    }
    setSuccessMsg(`Filled all with ${value}`);
    setTimeout(() => setSuccessMsg(''), 2000);
  }, [students, saveRating]);

  // ── Render ──
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

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        School Year: <span className="font-medium text-slate-700 dark:text-slate-200">{schoolYear}</span>
        {' · '}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">{currentQuarterLabel}</span>
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
          <p className="font-medium">No students in your workspace yet.</p>
          <p className="text-xs mt-1">
            Add students from the <a href="/personal/students" className="underline font-medium">My Students</a> page first.
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
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const grade = grades.get(s.id);
                  const qRatings = grade ? grade[ratingsCol] : {};

                  return (
                    <tr key={s.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-750/30'}>
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 whitespace-nowrap">
                        {s.last_name}, {s.first_name}
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
                                  onClick={() => saveRating(s.id, comp, currentVal === r.value ? null : r.value)}
                                  disabled={cellSaving}
                                  className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                                    cellSaving ? 'opacity-50 cursor-wait' :
                                    currentVal === r.value ? r.color + ' ring-1 ring-current' :
                                    'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                  }`}
                                  title={currentVal === r.value ? `Clear ${r.label}` : `${r.label} – ${r.desc}`}
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
}
