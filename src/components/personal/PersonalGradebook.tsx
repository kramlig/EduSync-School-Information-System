/**
 * PersonalGradebook — Grade entry for personal workspace.
 *
 * Students × Learning Areas grid with Q1–Q4 columns.
 * Fetches data directly from Supabase (no SchoolContext available).
 * Debounced auto-save via upsert on grades table.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import UpgradeModal from './UpgradeModal';

interface Props {
  schoolId: string;
  tier: string;
}

interface StudentRow {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  lrn: string | null;
}

interface LearningAreaRow {
  id: string;
  code: string;
  name: string;
  display_order: number;
  is_composite: boolean;
  components: string[] | null;
  grade_levels: number[];
  is_active: boolean;
}

interface GradeRow {
  id: string;
  student_id: string;
  learning_area_id: string;
  school_year: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  final_grade: number | null;
  remarks: string | null;
}

type Quarter = 'q1' | 'q2' | 'q3' | 'q4';

// Cell key for debounce tracking
function cellKey(studentId: string, areaId: string, quarter: Quarter): string {
  return `${studentId}:${areaId}:${quarter}`;
}

function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

function computeFinalGrade(g: { q1: number | null; q2: number | null; q3: number | null; q4: number | null }): { finalGrade: number | null; remarks: string | null } {
  const quarters = [g.q1, g.q2, g.q3, g.q4].filter((v): v is number => v !== null);
  if (quarters.length === 0) return { finalGrade: null, remarks: null };
  const avg = Math.round(quarters.reduce((a, b) => a + b, 0) / quarters.length);
  return { finalGrade: avg, remarks: avg >= 75 ? 'Passed' : 'Failed' };
}

function displayName(s: StudentRow): string {
  // Prefer first_name/last_name; fall back to single 'name' field
  if (s.last_name && s.first_name) return `${s.last_name}, ${s.first_name}`;
  if (s.last_name) return s.last_name;
  if (s.first_name) return s.first_name;
  if (s.name) return s.name;
  return s.lrn || 'Unnamed Student';
}

export default function PersonalGradebook({ schoolId, tier }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || '';
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [areas, setAreas] = useState<LearningAreaRow[]>([]);
  const [grades, setGrades] = useState<Map<string, GradeRow>>(new Map());
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>(initialSubject);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Pending edits for debounced save (key → value)
  const pendingRef = useRef<Map<string, number | null>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Grade map key: studentId:learningAreaId
  function gradeMapKey(studentId: string, areaId: string): string {
    return `${studentId}:${areaId}`;
  }

  // ── Fetch all data ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, areasRes, gradesRes, schoolRes] = await Promise.all([
        supabase.from('students').select('id, name, first_name, last_name, middle_name, lrn')
          .eq('school_id', schoolId).order('last_name').order('first_name'),
        supabase.from('learning_areas').select('id, code, name, display_order, is_composite, components, grade_levels, is_active')
          .eq('school_id', schoolId).eq('is_active', true).order('display_order').order('name'),
        supabase.from('grades').select('id, student_id, learning_area_id, school_year, q1, q2, q3, q4, final_grade, remarks')
          .eq('school_id', schoolId).eq('school_year', schoolYear),
        supabase.from('schools').select('current_school_year').eq('id', schoolId).single(),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (areasRes.error) throw areasRes.error;
      if (gradesRes.error) throw gradesRes.error;

      setStudents(studentsRes.data || []);
      setAreas(areasRes.data || []);

      // Use school's current_school_year if different
      if (schoolRes.data?.current_school_year && schoolRes.data.current_school_year !== schoolYear) {
        setSchoolYear(schoolRes.data.current_school_year);
      }

      // Build grade map
      const map = new Map<string, GradeRow>();
      for (const g of (gradesRes.data || [])) {
        map.set(gradeMapKey(g.student_id, g.learning_area_id), g);
      }
      setGrades(map);
    } catch (err: any) {
      setError(err.message || 'Failed to load gradebook data');
    } finally {
      setLoading(false);
    }
  }, [schoolId, schoolYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Default to first area
  useEffect(() => {
    if (areas.length > 0 && !selectedArea) {
      setSelectedArea(areas[0].id);
    }
  }, [areas, selectedArea]);

  // ── Save a single grade cell ───────────────────────────────
  const saveGrade = useCallback(async (
    studentId: string,
    areaId: string,
    quarter: Quarter,
    value: number | null,
  ) => {
    // Validate range on save (allow null to clear)
    if (value !== null && (value < 60 || value > 100)) return;

    const key = cellKey(studentId, areaId, quarter);
    setSaving(prev => new Set(prev).add(key));

    try {
      const mapKey = gradeMapKey(studentId, areaId);
      const existing = grades.get(mapKey);

      if (existing && existing.id) {
        // Update existing record
        const updated = { ...existing, [quarter]: value };
        const { finalGrade, remarks } = computeFinalGrade(updated);
        const { error: updateErr } = await supabase.from('grades')
          .update({ [quarter]: value, final_grade: finalGrade, remarks, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;

        // Update local state
        setGrades(prev => {
          const next = new Map(prev);
          next.set(mapKey, { ...existing, [quarter]: value, final_grade: finalGrade, remarks });
          return next;
        });
      } else {
        // Insert new record
        const newGrade: any = {
          student_id: studentId,
          learning_area_id: areaId,
          school_id: schoolId,
          school_year: schoolYear,
          [quarter]: value,
        };
        const { finalGrade, remarks } = computeFinalGrade({
          q1: null, q2: null, q3: null, q4: null,
          [quarter]: value,
        } as any);
        newGrade.final_grade = finalGrade;
        newGrade.remarks = remarks;

        const { data: inserted, error: insertErr } = await supabase
          .from('grades').insert([newGrade]).select().single();
        if (insertErr) throw insertErr;

        setGrades(prev => {
          const next = new Map(prev);
          next.set(mapKey, inserted as GradeRow);
          return next;
        });
      }
    } catch (err: any) {
      console.error('Grade save failed:', err);
      setError(`Save failed: ${err.message}`);
    } finally {
      setSaving(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [grades, schoolId, schoolYear]);

  // ── Debounced input handler ────────────────────────────────
  const handleGradeInput = useCallback((
    studentId: string,
    areaId: string,
    quarter: Quarter,
    rawValue: string,
  ) => {
    const key = cellKey(studentId, areaId, quarter);

    // Parse — allow intermediate typing, validate range only on save
    let value: number | null = null;
    if (rawValue.trim() !== '') {
      const parsed = parseFloat(rawValue);
      if (isNaN(parsed) || parsed > 100) return; // Block clearly invalid
      if (parsed < 0) return;
      value = Math.round(parsed * 100) / 100; // Keep 2 decimals max
    }

    // Optimistic local update
    const mapKey = gradeMapKey(studentId, areaId);
    setGrades(prev => {
      const next = new Map(prev);
      const existing = prev.get(mapKey);
      if (existing) {
        const updated = { ...existing, [quarter]: value };
        const { finalGrade, remarks } = computeFinalGrade(updated);
        next.set(mapKey, { ...updated, final_grade: finalGrade, remarks });
      } else {
        const stub: GradeRow = {
          id: '', student_id: studentId, learning_area_id: areaId,
          school_year: schoolYear, q1: null, q2: null, q3: null, q4: null,
          final_grade: null, remarks: null, [quarter]: value,
        };
        const { finalGrade, remarks } = computeFinalGrade(stub);
        next.set(mapKey, { ...stub, final_grade: finalGrade, remarks });
      }
      return next;
    });

    // Debounce the actual save (500ms)
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    debounceTimers.current.set(key, setTimeout(() => {
      debounceTimers.current.delete(key);
      saveGrade(studentId, areaId, quarter, value);
    }, 500));
  }, [saveGrade, schoolYear]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // ── Filtered students ──────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      (s.last_name || '').toLowerCase().includes(q) ||
      (s.first_name || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.lrn && s.lrn.includes(q))
    );
  }, [students, searchQuery]);

  // ── Statistics ─────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!selectedArea || students.length === 0) return { completion: 0, average: 0, passRate: 0 };

    let totalFinal = 0;
    let countFinal = 0;
    let countPassed = 0;
    let countWithAny = 0;

    for (const s of students) {
      const g = grades.get(gradeMapKey(s.id, selectedArea));
      if (g) {
        const hasAny = g.q1 !== null || g.q2 !== null || g.q3 !== null || g.q4 !== null;
        if (hasAny) countWithAny++;
        if (g.final_grade !== null) {
          totalFinal += g.final_grade;
          countFinal++;
          if (g.final_grade >= 75) countPassed++;
        }
      }
    }

    return {
      completion: Math.round((countWithAny / students.length) * 100),
      average: countFinal > 0 ? Math.round(totalFinal / countFinal) : 0,
      passRate: countFinal > 0 ? Math.round((countPassed / countFinal) * 100) : 0,
    };
  }, [students, grades, selectedArea]);

  // ── Current quarter detection ──────────────────────────────
  const currentQuarter = useMemo((): Quarter => {
    const month = new Date().getMonth(); // 0-indexed
    if (month >= 5 && month <= 7) return 'q1';   // Jun-Aug
    if (month >= 8 && month <= 10) return 'q2';   // Sep-Nov
    if (month >= 11 || month <= 1) return 'q3';   // Dec-Feb
    return 'q4'; // Mar-May
  }, []);

  // ── Render helpers ─────────────────────────────────────────
  function gradeColor(val: number | null): string {
    if (val === null) return '';
    if (val >= 90) return 'text-green-600 dark:text-green-400';
    if (val >= 75) return 'text-blue-600 dark:text-blue-400';
    return 'text-red-600 dark:text-red-400';
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading gradebook...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <button onClick={fetchData} className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm underline">
          Retry
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-medium mb-1">No Students Yet</p>
        <p className="text-sm">Add students in the Students tab before entering grades.</p>
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-medium mb-1">No Learning Areas</p>
        <p className="text-sm">Learning areas will be seeded automatically. Try refreshing.</p>
        <button onClick={fetchData} className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm underline">
          Refresh
        </button>
      </div>
    );
  }

  const quarters: Quarter[] = ['q1', 'q2', 'q3', 'q4'];
  const quarterLabels: Record<Quarter, string> = { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/personal/grades')}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium hover:underline transition-colors"
        >
          Grade Entry
        </button>
        <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Gradebook</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <AcademicCapIcon className="h-6 w-6 text-indigo-500" />
            Gradebook
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {schoolYear} &middot; {students.length} students &middot; {areas.length} subjects
          </p>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
        {areas.map(area => (
          <button
            key={area.id}
            onClick={() => setSelectedArea(area.id)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedArea === area.id
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {area.code || area.name}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.completion}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average</p>
          <p className={`text-xl font-bold ${gradeColor(stats.average)}`}>
            {stats.average || '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pass Rate</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.passRate}%</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search students..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400"
      />

      {/* Grade Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-3 py-2 font-medium text-slate-600 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-800/50 min-w-[180px]">
                Student
              </th>
              {quarters.map(q => (
                <th
                  key={q}
                  className={`text-center px-2 py-2 font-medium min-w-[80px] ${
                    q === currentQuarter
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {quarterLabels[q]}
                  {q === currentQuarter && <span className="block text-[10px] font-normal">Current</span>}
                </th>
              ))}
              <th className="text-center px-2 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[70px]">Final</th>
              <th className="text-center px-2 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[70px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredStudents.map(student => {
              const g = grades.get(gradeMapKey(student.id, selectedArea));
              return (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-900">
                    <div className="font-medium text-slate-800 dark:text-white truncate">
                      {displayName(student)}
                    </div>
                    {student.lrn && (
                      <div className="text-xs text-slate-400">{student.lrn}</div>
                    )}
                  </td>
                  {quarters.map(q => {
                    const val = g ? (g[q] as number | null) : null;
                    const key = cellKey(student.id, selectedArea, q);
                    const isSaving = saving.has(key);
                    return (
                      <td key={q} className={`text-center px-1 py-1 ${
                        q === currentQuarter ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                      }`}>
                        <div className="relative">
                          <input
                            type="number"
                            min={60}
                            max={100}
                            step={1}
                            value={val ?? ''}
                            onChange={e => handleGradeInput(student.id, selectedArea, q, e.target.value)}
                            className={`w-full text-center px-1 py-1.5 text-sm border rounded-md
                              bg-white dark:bg-slate-800 
                              border-slate-200 dark:border-slate-600
                              focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 
                              outline-none transition-colors
                              ${gradeColor(val)}
                              ${isSaving ? 'opacity-60' : ''}
                            `}
                            placeholder="—"
                          />
                          {isSaving && (
                            <ArrowPathIcon className="absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-indigo-400" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-2">
                    <span className={`font-bold ${gradeColor(g?.final_grade ?? null)}`}>
                      {g?.final_grade ?? '—'}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2">
                    {g?.remarks ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        g.remarks === 'Passed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {g.remarks === 'Passed' && <CheckCircleIcon className="h-3 w-3" />}
                        {g.remarks === 'Failed' && <ExclamationTriangleIcon className="h-3 w-3" />}
                        {g.remarks}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Free tier watermark */}
      {tier === 'free' && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
          Free Tier —{' '}
          <button className="underline hover:text-indigo-500 transition-colors" onClick={() => setShowUpgrade(true)}>
            Upgrade to Pro
          </button>{' '}
          for unlimited students and advanced features
        </p>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={tier} />
    </div>
  );
}
