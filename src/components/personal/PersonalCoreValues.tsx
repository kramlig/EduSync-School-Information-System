/**
 * PersonalCoreValues — Core Values behavior grading for personal workspace.
 *
 * Spreadsheet-style grid: Students × Behavior Statements per Core Value,
 * with AO/SO/RO/NO dropdowns for the selected quarter.
 * Saves to `core_value_grades.indicator_ratings` JSONB via Supabase.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HeartIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { getCurrentSchoolYear } from '../../../services/dateHelpers';

interface Props {
  schoolId: string;
  teacherId: string;
  tier: string;
}

interface StudentRow {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
}

function displayName(s: StudentRow): string {
  if (s.last_name && s.first_name) return `${s.last_name}, ${s.first_name}`;
  if (s.last_name) return s.last_name;
  if (s.first_name) return s.first_name;
  if (s.name) return s.name;
  return 'Unnamed Student';
}

interface CoreValue {
  id: string;
  code: string;
  name: string;
  indicators: string[];
  display_order: number;
}

interface GradeRow {
  id: string;
  student_id: string;
  core_value_id: string;
  indicator_ratings: Record<string, Record<string, string>>; // { q1: { "behavior text": "AO" }, ... }
}

const RATINGS = ['AO', 'SO', 'RO', 'NO'] as const;
type Rating = typeof RATINGS[number];

const RATING_COLORS: Record<Rating, string> = {
  AO: 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-300',
  SO: 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
  RO: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300',
  NO: 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300',
};

const QUARTERS = [
  { key: 'q1', label: 'Q1' },
  { key: 'q2', label: 'Q2' },
  { key: 'q3', label: 'Q3' },
  { key: 'q4', label: 'Q4' },
] as const;

const STANDARD_CORE_VALUES: Omit<CoreValue, 'id'>[] = [
  {
    code: 'MAKADIYOS',
    name: 'MAKA-DIYOS',
    display_order: 1,
    indicators: [
      'Expresses one\'s spiritual beliefs while respecting the spiritual beliefs of others',
      'Shows adherence to ethical principles by upholding truth',
    ],
  },
  {
    code: 'MAKATAO',
    name: 'MAKATAO',
    display_order: 2,
    indicators: [
      'Is sensitive to individual, social, and cultural differences',
      'Demonstrates contributions toward solidarity',
    ],
  },
  {
    code: 'MAKAKALIKASAN',
    name: 'MAKAKALIKASAN',
    display_order: 3,
    indicators: [
      'Cares for the environment and utilizes resources wisely, judiciously, and economically',
    ],
  },
  {
    code: 'MAKABANSA',
    name: 'MAKABANSA',
    display_order: 4,
    indicators: [
      'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
      'Demonstrates appropriate behavior in civic engagement activities in the school, community, and country',
    ],
  },
];

export default function PersonalCoreValues({ schoolId, teacherId, tier: _tier }: Props) {
  const [advisorySections, setAdvisorySections] = useState<{ id: string; name: string; grade_level: number }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [grades, setGrades] = useState<Map<string, GradeRow>>(new Map()); // key: "studentId:coreValueId"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [quarter, setQuarter] = useState<string>('q1');
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const schoolYear = useMemo(() => getCurrentSchoolYear(), []);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const gradeKey = (studentId: string, cvId: string) => `${studentId}:${cvId}`;

  // ── Ensure core values exist ──
  const ensureCoreValues = useCallback(async (): Promise<CoreValue[]> => {
    // Core values are global after migration (school_id column removed).
    const { data, error: fetchErr } = await supabase
      .from('core_values')
      .select('id, code, name, indicators, display_order')
      .order('display_order');

    if (fetchErr) throw fetchErr;
    if (data && data.length > 0) return data;

    // Seed standard values (global — no school_id column)
    const toInsert = STANDARD_CORE_VALUES.map(cv => ({
      code: cv.code,
      name: cv.name,
      indicators: cv.indicators,
      display_order: cv.display_order,
    }));
    const { data: inserted, error: insErr } = await supabase
      .from('core_values')
      .insert(toInsert)
      .select('id, code, name, indicators, display_order');
    if (insErr) throw insErr;
    return inserted || [];
  }, []);

  // ── Fetch advisory sections ──
  useEffect(() => {
    if (!schoolId || !teacherId) return;
    (async () => {
      const { data } = await supabase
        .from('sections')
        .select('id, name, grade_level')
        .eq('school_id', schoolId)
        .eq('adviser_id', teacherId)
        .is('deleted_at', null)
        .order('grade_level')
        .order('name');
      const secs = data || [];
      setAdvisorySections(secs);
      if (secs.length > 0 && !selectedSectionId) setSelectedSectionId(secs[0].id);
    })();
  }, [schoolId, teacherId]);

  // ── Fetch all data for selected section ──
  const fetchData = useCallback(async () => {
    if (!schoolId || !selectedSectionId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, cvs] = await Promise.all([
        supabase.from('students')
          .select('id, name, first_name, last_name, middle_name')
          .eq('school_id', schoolId)
          .eq('section_id', selectedSectionId)
          .is('deleted_at', null)
          .order('last_name').order('first_name'),
        ensureCoreValues(),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents(studentsRes.data || []);
      setCoreValues(cvs);

      // Fetch grades for this school year
      if (cvs.length > 0) {
        const cvIds = cvs.map(c => c.id);
        const { data: gradeData, error: gErr } = await supabase
          .from('core_value_grades')
          .select('id, student_id, core_value_id, indicator_ratings')
          .eq('school_id', schoolId)
          .eq('school_year', schoolYear)
          .in('core_value_id', cvIds)
          .is('deleted_at', null);
        if (gErr) throw gErr;

        const map = new Map<string, GradeRow>();
        for (const g of gradeData || []) {
          map.set(gradeKey(g.student_id, g.core_value_id), {
            ...g,
            indicator_ratings: g.indicator_ratings || {},
          });
        }
        setGrades(map);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedSectionId, schoolYear, ensureCoreValues]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save a rating (debounced) ──
  const saveRating = useCallback((studentId: string, cvId: string, indicator: string, rating: string | null) => {
    const key = gradeKey(studentId, cvId);

    // Update local state immediately
    setGrades(prev => {
      const next = new Map(prev);
      const existing = next.get(key);
      const currentRatings = existing?.indicator_ratings || {};
      const qRatings = { ...(currentRatings[quarter] || {}) };

      if (rating) {
        qRatings[indicator] = rating;
      } else {
        delete qRatings[indicator];
      }

      const newRatings = { ...currentRatings, [quarter]: qRatings };
      next.set(key, {
        id: existing?.id || '',
        student_id: studentId,
        core_value_id: cvId,
        indicator_ratings: newRatings,
      });
      return next;
    });

    // Debounce save
    const timerKey = `${key}:${indicator}`;
    const existing = debounceTimers.current.get(timerKey);
    if (existing) clearTimeout(existing);

    debounceTimers.current.set(timerKey, setTimeout(async () => {
      setSaving(prev => new Set(prev).add(timerKey));
      try {
        // Read latest state
        const latestGrade = grades.get(key) || (() => {
          // Construct from local state since Map may not be updated yet
          const currentRatings: Record<string, Record<string, string>> = {};
          currentRatings[quarter] = rating ? { [indicator]: rating } : {};
          return {
            id: '',
            student_id: studentId,
            core_value_id: cvId,
            indicator_ratings: currentRatings,
          };
        })();

        const updatedRatings = { ...latestGrade.indicator_ratings };
        const qr = { ...(updatedRatings[quarter] || {}) };
        if (rating) qr[indicator] = rating;
        else delete qr[indicator];
        updatedRatings[quarter] = qr;

        if (latestGrade.id) {
          const { error: upErr } = await supabase
            .from('core_value_grades')
            .update({ indicator_ratings: updatedRatings, updated_at: new Date().toISOString() })
            .eq('id', latestGrade.id);
          if (upErr) throw upErr;
        } else {
          const { data, error: insErr } = await supabase
            .from('core_value_grades')
            .insert({
              school_id: schoolId,
              student_id: studentId,
              core_value_id: cvId,
              school_year: schoolYear,
              indicator_ratings: updatedRatings,
            })
            .select('id, student_id, core_value_id, indicator_ratings')
            .single();
          if (insErr) throw insErr;
          if (data) {
            setGrades(prev => {
              const next = new Map(prev);
              next.set(key, { ...data, indicator_ratings: data.indicator_ratings || {} });
              return next;
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to save rating');
      } finally {
        setSaving(prev => {
          const s = new Set(prev);
          s.delete(timerKey);
          return s;
        });
      }
    }, 500));
  }, [schoolId, schoolYear, quarter, grades]);

  // ── Fill All with a rating for a particular indicator ──
  const fillAll = useCallback(async (cvId: string, indicator: string, rating: Rating) => {
    for (const s of students) {
      saveRating(s.id, cvId, indicator, rating);
    }
    setSuccessMsg(`Filled all with ${rating}`);
    setTimeout(() => setSuccessMsg(''), 2000);
  }, [students, saveRating]);

  // ── Total indicators ──
  const allIndicators = useMemo(() => {
    return coreValues.flatMap(cv => cv.indicators.map(ind => ({ cvId: cv.id, cvCode: cv.code, cvName: cv.name, indicator: ind })));
  }, [coreValues]);

  // ── Render ──
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading core values data...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <HeartIcon className="w-6 h-6 text-pink-600" />
            Learner&apos;s Observed Values
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Rate each behavior statement: AO (Always Observed), SO (Sometimes), RO (Rarely), NO (Not Observed)
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
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {q.label}
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

      {/* Section Selector (adviser sections only) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Advisory Section</label>
        {advisorySections.length === 0 ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You are not an adviser of any section. Core values are rated by the section adviser.
          </p>
        ) : (
          <select
            value={selectedSectionId}
            onChange={e => { setSelectedSectionId(e.target.value); setStudents([]); }}
            className="w-full sm:w-64 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
          >
            {advisorySections.map(s => (
              <option key={s.id} value={s.id}>Grade {s.grade_level} - {s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* School year */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        School Year: <span className="font-medium text-slate-700 dark:text-slate-200">{schoolYear}</span>
      </div>

      {/* No students */}
      {advisorySections.length > 0 && students.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium">No students in your workspace yet.</p>
          <p className="text-xs mt-1">
            Add students from the <a href="/personal/students" className="underline font-medium">My Students</a> page first.
          </p>
        </div>
      ) : (
        /* Core Values Grid — one table per core value */
        <div className="space-y-4">
          {coreValues.map(cv => (
            <div key={cv.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {/* Core value header */}
              <div className="px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-bold text-sm text-slate-800 dark:text-white">{cv.name}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-700/50 text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 min-w-[180px]">
                        Student
                      </th>
                      {cv.indicators.map((ind, idx) => (
                        <th key={idx} className="text-center px-2 py-2 font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600 min-w-[180px]">
                          <div className="text-[11px] leading-tight">{ind}</div>
                          <div className="mt-1 flex items-center justify-center gap-1">
                            {RATINGS.map(r => (
                              <button
                                key={r}
                                onClick={() => fillAll(cv.id, ind, r)}
                                title={`Fill all with ${r}`}
                                className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-300"
                              >
                                All {r}
                              </button>
                            ))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => {
                      const key = gradeKey(s.id, cv.id);
                      const grade = grades.get(key);
                      const qRatings = grade?.indicator_ratings?.[quarter] || {};

                      return (
                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-750/30'}>
                          <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 whitespace-nowrap">
                            {displayName(s)}
                          </td>
                          {cv.indicators.map((ind, iIdx) => {
                            const currentRating = qRatings[ind] as Rating | undefined;
                            const cellSaving = saving.has(`${key}:${ind}`);

                            return (
                              <td key={iIdx} className="text-center px-1 py-1 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-center gap-0.5">
                                  {RATINGS.map(r => (
                                    <button
                                      key={r}
                                      onClick={() => saveRating(s.id, cv.id, ind, currentRating === r ? null : r)}
                                      disabled={cellSaving}
                                      className={`w-7 h-6 rounded text-[10px] font-bold transition-colors ${
                                        cellSaving ? 'opacity-50 cursor-wait' :
                                        currentRating === r ? RATING_COLORS[r] + ' ring-1 ring-current' :
                                        'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                      }`}
                                      title={currentRating === r ? `Clear ${r}` : r}
                                    >
                                      {r}
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
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <span className="font-medium">Legend:</span>
        <span><span className="font-bold text-green-600">AO</span> — Always Observed</span>
        <span><span className="font-bold text-blue-600">SO</span> — Sometimes Observed</span>
        <span><span className="font-bold text-yellow-600">RO</span> — Rarely Observed</span>
        <span><span className="font-bold text-red-600">NO</span> — Not Observed</span>
      </div>
    </div>
  );
}
