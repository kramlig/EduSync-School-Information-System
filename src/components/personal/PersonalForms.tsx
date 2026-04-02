/**
 * PersonalForms — Generate DepEd forms from personal workspace data.
 *
 * Teacher picks a section, then generates SF5/SF9/SF2 for that section.
 * School info is auto-populated from the workspace's school record.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { canDownloadAuthenticated, recordDownloadAuthenticated } from '../../services/tools/rateLimiter';
import { generateSF5Standalone } from '../../services/tools/sf5StandaloneGenerator';
import { generateSF9Standalone } from '../../services/tools/sf9StandaloneGenerator';
import type { SF9AttendanceRecord, SF9CoreValueGrade, SF9HomeroomGuidanceGrades } from '../../services/tools/sf9StandaloneGenerator';
import { generateSF2Standalone } from '../../services/tools/sf2StandaloneGenerator';
import type { SF5ParsedRow, SF9ParsedRow, SF2ParsedRow } from '../../services/tools/csvParser';

interface Props {
  schoolId: string;
  teacherId: string;
  tier: string;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  name: string | null;
  lrn: string | null;
  gender: string | null;
}

// Parse name from first_name/last_name or fallback to name field
function parseName(s: StudentRow): { firstName: string; lastName: string } {
  if (s.first_name || s.last_name) {
    return { firstName: s.first_name || '', lastName: s.last_name || '' };
  }
  const full = (s.name || '').trim();
  if (!full) return { firstName: '', lastName: '' };
  const parts = full.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

interface GradeRow {
  student_id: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  final_grade: number | null;
  learning_area: { name: string } | null;
}

interface AttendanceRow {
  student_id: string;
  date: string;
  status: string;
}

interface SchoolRow {
  name: string;
  school_id_number: string | null;
  division: string;
  region: string;
  district: string | null;
  current_school_year: string | null;
}

interface SectionRow {
  id: string;
  name: string;
  grade_level: number;
  school_year: string;
  adviser_id?: string | null;
  isAdvisory?: boolean;
}

interface TeacherRow {
  name: string;
}

interface CoreValueRow {
  id: string;
  code: string;
  name: string;
  indicators: string[] | null;
}

interface CoreValueGradeRow {
  student_id: string;
  core_value_id: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  indicator_ratings: Record<string, Record<string, string>> | null;
  core_value: { code: string } | null;
}

interface HGGradeRow {
  student_id: string;
  q1_ratings: Record<string, number> | null;
  q2_ratings: Record<string, number> | null;
  q3_ratings: Record<string, number> | null;
  q4_ratings: Record<string, number> | null;
}

type FormType = 'sf5' | 'sf9' | 'sf2';

const PersonalForms: React.FC<Props> = ({ schoolId, teacherId, tier }) => {
  // Section selector
  const [allSections, setAllSections] = useState<SectionRow[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Data state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [fullYearAttendance, setFullYearAttendance] = useState<AttendanceRow[]>([]);
  const [, setCoreValues] = useState<CoreValueRow[]>([]);
  const [coreValueGrades, setCoreValueGrades] = useState<CoreValueGradeRow[]>([]);
  const [hgGrades, setHgGrades] = useState<HGGradeRow[]>([]);
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [teacher, setTeacher] = useState<TeacherRow | null>(null);

  // UI state
  const [loadingSections, setLoadingSections] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<FormType | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedSection = useMemo(
    () => allSections.find(s => s.id === selectedSectionId) || null,
    [allSections, selectedSectionId]
  );

  // ─── Fetch teacher's sections ────────────────────────────

  useEffect(() => {
    if (!schoolId || !teacherId) { setLoadingSections(false); return; }
    let cancelled = false;

    (async () => {
      // Get sections from teaching_assignments + adviser sections
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
      const allIds = [...new Set([...taIds, ...advIds])];

      if (allIds.length > 0 && !cancelled) {
        const { data } = await supabase
          .from('sections')
          .select('id, name, grade_level, school_year, adviser_id')
          .in('id', allIds)
          .is('deleted_at', null)
          .order('grade_level')
          .order('name');

        if (!cancelled && data) {
          const mapped = data.map(s => ({
            ...s,
            isAdvisory: s.adviser_id === teacherId,
          }));
          setAllSections(mapped);
          if (mapped.length > 0) setSelectedSectionId(mapped[0].id);
        }
      }

      // Also fetch school + teacher info (static)
      const [schoolRes, teacherRes] = await Promise.all([
        supabase
          .from('schools')
          .select('name, school_id_number, division, region, district, current_school_year')
          .eq('id', schoolId)
          .single(),
        supabase
          .from('teachers')
          .select('name')
          .eq('id', teacherId)
          .single(),
      ]);
      if (!cancelled) {
        if (schoolRes.data) setSchool(schoolRes.data);
        if (teacherRes.data) setTeacher(teacherRes.data);
        setLoadingSections(false);
      }
    })();

    return () => { cancelled = true; };
  }, [schoolId, teacherId]);

  // ─── Fetch section-scoped data when section changes ──────

  const fetchSectionData = useCallback(async () => {
    if (!schoolId || !selectedSectionId) return;
    setLoading(true);
    setError('');

    try {
      // 1) Fetch students for the selected section
      const studentsRes = await supabase
        .from('students')
        .select('id, first_name, last_name, middle_name, name, lrn, gender')
        .eq('school_id', schoolId)
        .eq('section_id', selectedSectionId)
        .is('deleted_at', null)
        .order('last_name');

      const stuData = studentsRes.data || [];
      setStudents(stuData);

      if (stuData.length === 0) {
        setGrades([]);
        setCoreValues([]);
        setCoreValueGrades([]);
        setFullYearAttendance([]);
        setHgGrades([]);
        setLoading(false);
        return;
      }

      const studentIds = stuData.map(s => s.id);

      // 2) Fetch grades, core values, attendance, HG grades scoped by student IDs
      const [
        gradesRes,
        coreValuesRes,
        coreValueGradesRes,
        fullYearAttRes,
        hgGradesRes,
      ] = await Promise.all([
        supabase
          .from('grades')
          .select('student_id, q1, q2, q3, q4, final_grade, learning_area:learning_areas!learning_area_id(name)')
          .eq('school_id', schoolId)
          .in('student_id', studentIds),
        supabase
          .from('core_values')
          .select('id, code, name, indicators')
          .order('display_order'),
        supabase
          .from('core_value_grades')
          .select('student_id, core_value_id, q1, q2, q3, q4, indicator_ratings, core_value:core_values!core_value_id(code)')
          .eq('school_id', schoolId)
          .in('student_id', studentIds)
          .is('deleted_at', null),
        supabase
          .from('attendance_records')
          .select('student_id, date, status')
          .eq('school_id', schoolId)
          .eq('section_id', selectedSectionId),
        supabase
          .from('homeroom_guidance_grades')
          .select('student_id, q1_ratings, q2_ratings, q3_ratings, q4_ratings')
          .eq('school_id', schoolId)
          .in('student_id', studentIds)
          .is('deleted_at', null),
      ]);

      if (gradesRes.data) setGrades(gradesRes.data as unknown as GradeRow[]);
      if (coreValuesRes.data) setCoreValues(coreValuesRes.data as CoreValueRow[]);
      if (coreValueGradesRes.data) setCoreValueGrades(coreValueGradesRes.data as unknown as CoreValueGradeRow[]);
      if (fullYearAttRes.data) setFullYearAttendance(fullYearAttRes.data as AttendanceRow[]);
      if (hgGradesRes.data) setHgGrades(hgGradesRes.data as HGGradeRow[]);
    } catch {
      setError('Failed to load section data.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedSectionId]);

  useEffect(() => { fetchSectionData(); }, [fetchSectionData]);

  // Fetch attendance separately for the selected month
  const fetchMonthAttendance = useCallback(async () => {
    if (!schoolId || !selectedSectionId) return;
    const [year, month] = reportMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data } = await supabase
      .from('attendance_records')
      .select('student_id, date, status')
      .eq('school_id', schoolId)
      .eq('section_id', selectedSectionId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (data) setAttendance(data);
  }, [schoolId, selectedSectionId, reportMonth]);

  useEffect(() => { fetchMonthAttendance(); }, [fetchMonthAttendance]);

  const hasStudents = students.length > 0;
  const hasGrades = grades.length > 0;
  const hasAttendance = attendance.length > 0;

  // How many students have at least one grade entry
  const studentsWithGrades = useMemo(() => {
    const ids = new Set(grades.map(g => g.student_id));
    return students.filter(s => ids.has(s.id)).length;
  }, [students, grades]);

  // How many students have attendance this month
  const studentsWithAttendance = useMemo(() => {
    const ids = new Set(attendance.map(a => a.student_id));
    return students.filter(s => ids.has(s.id)).length;
  }, [students, attendance]);

  // ─── Transform & Generate ────────────────────────────────

  // Track and enforce form download limits via usage_tracking
  const trackForm = (formType: string) => {
    recordDownloadAuthenticated(teacherId, formType, {
      school_id: schoolId,
      section_id: selectedSectionId,
      student_count: students.length,
    }).catch(() => {});
  };

  const schoolInfo = useMemo(() => ({
    name: school?.name || '',
    schoolId: school?.school_id_number || '',
    division: school?.division || '',
    region: school?.region || '',
    district: school?.district || '',
  }), [school]);

  const schoolYear = school?.current_school_year || '2025-2026';
  const gradeLevel = selectedSection?.grade_level || 6;
  const sectionName = selectedSection?.name || 'My Class';
  const adviserName = teacher?.name || '';
  const noWatermark = tier === 'pro' || tier === 'school';

  async function handleGenerate(formType: FormType) {
    if (!hasStudents) return;
    setGenerating(formType);
    setError('');
    setSuccess('');

    // Server-side rate limit check for free-tier users
    const maxDownloads = tier === 'pro' || tier === 'school' ? 99999 : 10;
    const { allowed } = await canDownloadAuthenticated(teacherId, maxDownloads);
    if (!allowed) {
      setError(`Daily download limit reached (${maxDownloads}/day). Upgrade to Pro for unlimited downloads.`);
      setGenerating(null);
      return;
    }

    try {
      if (formType === 'sf5') {
        if (!hasGrades) {
          setError('No grades found. Enter grades for your students first, then generate SF5.');
          setGenerating(null);
          return;
        }

        // Build SF5 rows: one per student with their general average
        const sf5Rows: SF5ParsedRow[] = students.map(s => {
          const studentGrades = grades.filter(g => g.student_id === s.id);
          const finals = studentGrades.map(g => g.final_grade).filter((v): v is number => v !== null);
          const generalAverage = finals.length > 0 ? finals.reduce((a, b) => a + b, 0) / finals.length : 0;
          const nameParts = parseName(s);

          return {
            lrn: s.lrn || '',
            lastName: nameParts.lastName,
            firstName: nameParts.firstName,
            middleName: s.middle_name || '',
            gender: s.gender || '',
            subjects: Object.fromEntries(studentGrades
              .filter(g => g.learning_area && g.final_grade !== null)
              .map(g => [(g.learning_area as { name: string }).name, g.final_grade as number])),
            generalAverage,
          };
        });

        await generateSF5Standalone({
          schoolInfo,
          schoolYear,
          gradeLevel,
          sectionName,
          adviserName,
          students: sf5Rows,
          addWatermark: !noWatermark,
        });
        setSuccess('SF5 (Promotion Report) downloaded successfully!');
        trackForm('sf5');

      } else if (formType === 'sf9') {
        if (!hasGrades) {
          setError('No grades found. Enter grades for your students first, then generate SF9.');
          setGenerating(null);
          return;
        }

        // Build SF9 rows: one per (student, subject) pair
        const sf9Rows: SF9ParsedRow[] = [];
        for (const s of students) {
          const studentGrades = grades.filter(g => g.student_id === s.id && g.learning_area);
          const nameParts = parseName(s);
          for (const g of studentGrades) {
            sf9Rows.push({
              lrn: s.lrn || '',
              lastName: nameParts.lastName,
              firstName: nameParts.firstName,
              middleName: s.middle_name || '',
              gender: s.gender || '',
              subject: (g.learning_area as { name: string }).name,
              q1: g.q1,
              q2: g.q2,
              q3: g.q3,
              q4: g.q4,
            });
          }
        }

        if (sf9Rows.length === 0) {
          setError('No subject grades found. Ensure learning areas are assigned.');
          setGenerating(null);
          return;
        }

        // Build per-student attendance map (keyed by LRN or lastName-firstName)
        const sf9Attendance: Record<string, SF9AttendanceRecord> = {};
        for (const s of students) {
          const np = parseName(s);
          const key = s.lrn || `${np.lastName}-${np.firstName}`;
          const records = fullYearAttendance.filter(a => a.student_id === s.id);
          const dailyStatus: Record<string, string> = {};
          for (const r of records) {
            dailyStatus[r.date] = r.status.charAt(0).toUpperCase();
          }
          if (Object.keys(dailyStatus).length > 0) {
            sf9Attendance[key] = { dailyStatus };
          }
        }

        // Build per-student core value grades map
        const sf9CoreValueGrades: Record<string, SF9CoreValueGrade[]> = {};
        for (const s of students) {
          const np = parseName(s);
          const key = s.lrn || `${np.lastName}-${np.firstName}`;
          const studentCvGrades = coreValueGrades.filter(g => g.student_id === s.id);
          if (studentCvGrades.length > 0) {
            sf9CoreValueGrades[key] = studentCvGrades.map(g => ({
              coreValueCode: (g.core_value as { code: string } | null)?.code || '',
              q1: g.q1 || undefined,
              q2: g.q2 || undefined,
              q3: g.q3 || undefined,
              q4: g.q4 || undefined,
              indicatorRatings: g.indicator_ratings || undefined,
            }));
          }
        }

        // Build per-student homeroom guidance grades map
        const sf9HomeroomGuidance: Record<string, SF9HomeroomGuidanceGrades> = {};
        for (const s of students) {
          const np = parseName(s);
          const key = s.lrn || `${np.lastName}-${np.firstName}`;
          const hg = hgGrades.find(g => g.student_id === s.id);
          if (hg) {
            sf9HomeroomGuidance[key] = {
              q1_ratings: hg.q1_ratings || {},
              q2_ratings: hg.q2_ratings || {},
              q3_ratings: hg.q3_ratings || {},
              q4_ratings: hg.q4_ratings || {},
            };
          }
        }

        await generateSF9Standalone({
          schoolInfo,
          schoolYear,
          gradeLevel,
          sectionName,
          adviserName,
          rows: sf9Rows,
          applyWatermark: !noWatermark,
          attendance: Object.keys(sf9Attendance).length > 0 ? sf9Attendance : undefined,
          coreValueGrades: Object.keys(sf9CoreValueGrades).length > 0 ? sf9CoreValueGrades : undefined,
          homeroomGuidanceGrades: Object.keys(sf9HomeroomGuidance).length > 0 ? sf9HomeroomGuidance : undefined,
        });
        setSuccess('SF9 (Report Cards) downloaded successfully!');
        trackForm('sf9');

      } else if (formType === 'sf2') {
        // Build SF2 rows: one per student with attendance map
        const sf2Rows: SF2ParsedRow[] = students.map(s => {
          const records = attendance.filter(a => a.student_id === s.id);
          const attendanceMap: Record<string, string> = {};
          for (const r of records) {
            // Convert status to short form: Present→P, Absent→A, Late→L, Excused→E
            attendanceMap[r.date] = r.status.charAt(0).toUpperCase();
          }
          const nameParts = parseName(s);
          return {
            lrn: s.lrn || '',
            lastName: nameParts.lastName,
            firstName: nameParts.firstName,
            middleName: s.middle_name || '',
            gender: s.gender || '',
            attendance: attendanceMap,
          };
        });

        await generateSF2Standalone({
          schoolName: schoolInfo.name,
          schoolId: schoolInfo.schoolId,
          district: schoolInfo.district,
          division: schoolInfo.division,
          region: schoolInfo.region,
          schoolYear,
          gradeLevel: String(gradeLevel),
          sectionName,
          adviserName,
          reportMonth,
          students: sf2Rows,
          applyWatermark: !noWatermark,
        });
        setSuccess('SF2 (Attendance Report) downloaded successfully!');
        trackForm('sf2');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed.');
    } finally {
      setGenerating(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────

  if (loadingSections) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading workspace data...
      </div>
    );
  }

  if (allSections.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            Generate DepEd Forms
          </h1>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
          <ClipboardDocumentListIcon className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No sections found</p>
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
            Create a section first from <a href="/personal/sections" className="underline font-medium">My Sections</a>, then come back to generate forms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6 text-purple-600" />
          Generate DepEd Forms
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Forms are auto-filled from your saved students and grades. No CSV upload needed.
        </p>
      </div>

      {/* Section Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Select Section
        </label>
        <div className="flex flex-wrap gap-2">
          {allSections.map(sec => (
            <button
              key={sec.id}
              onClick={() => { setSelectedSectionId(sec.id); setSuccess(''); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                sec.id === selectedSectionId
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              Grade {sec.grade_level} - {sec.name}
              {sec.isAdvisory && (
                <span className={`ml-1.5 text-xs ${sec.id === selectedSectionId ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'}`}>
                  (Adviser)
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading section data */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-2">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          Loading section data...
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* No students warning */}
      {!hasStudents && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium">No students in your workspace yet.</p>
          <p className="text-xs mt-1">
            Add students first from the{' '}
            <a href="/personal/students" className="underline font-medium">Students</a> page,
            then come back to generate forms.
          </p>
        </div>
      )}

      {/* School Info Summary */}
      {school && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm">
          <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Form Header Info (auto-filled)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div><span className="font-medium">School:</span> {school.name}</div>
            <div><span className="font-medium">Division:</span> {school.division}</div>
            <div><span className="font-medium">Grade:</span> {gradeLevel}</div>
            <div><span className="font-medium">Section:</span> {sectionName}</div>
            <div><span className="font-medium">Adviser:</span> {adviserName}</div>
            <div><span className="font-medium">SY:</span> {schoolYear}</div>
            <div><span className="font-medium">Students:</span> {students.length}</div>
            <div><span className="font-medium">Region:</span> {school.region}</div>
          </div>
        </div>
      )}

      {/* Form Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* SF5 Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">SF5 — Promotion Report</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex-1 mb-2">
            Report on Promotion and Level of Proficiency. Requires student grades.
          </p>
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            {hasGrades
              ? <span className="text-green-600 dark:text-green-400">{studentsWithGrades} student(s) with grades</span>
              : <span className="text-amber-500">No grades entered yet</span>
            }
          </div>
          <button
            onClick={() => handleGenerate('sf5')}
            disabled={!hasStudents || !hasGrades || generating !== null}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating === 'sf5' ? (
              <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><ArrowDownTrayIcon className="w-4 h-4" /> Generate SF5</>
            )}
          </button>
        </div>

        {/* SF9 Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">SF9 — Report Card</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex-1 mb-2">
            Learner&apos;s Progress Report Card with quarterly grades per subject.
          </p>
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            {hasGrades
              ? <span className="text-green-600 dark:text-green-400">{studentsWithGrades} student(s) with grades</span>
              : <span className="text-amber-500">No grades entered yet</span>
            }
          </div>
          <button
            onClick={() => handleGenerate('sf9')}
            disabled={!hasStudents || !hasGrades || generating !== null}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating === 'sf9' ? (
              <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><ArrowDownTrayIcon className="w-4 h-4" /> Generate SF9</>
            )}
          </button>
        </div>

        {/* SF2 Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-teal-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">SF2 — Daily Attendance</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex-1 mb-2">
            Learner Daily Attendance Report for a selected month.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {hasAttendance
                ? <span className="text-green-600 dark:text-green-400">{studentsWithAttendance} recorded</span>
                : <span className="text-amber-500">No records</span>
              }
            </span>
          </div>
          <button
            onClick={() => handleGenerate('sf2')}
            disabled={!hasStudents || generating !== null}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating === 'sf2' ? (
              <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><ArrowDownTrayIcon className="w-4 h-4" /> Generate SF2</>
            )}
          </button>
        </div>
      </div>

      {/* Tip / Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 text-sm text-indigo-800 dark:text-indigo-200">
        <p className="font-medium mb-1">How it works</p>
        <ul className="text-xs text-indigo-600 dark:text-indigo-300 space-y-1 list-disc list-inside">
          <li>SF5 and SF9 require grades — enter them via the Gradebook first.</li>
          <li>SF2 generates even without attendance records (empty form with student names).</li>
          <li>School info on forms comes from your workspace settings.</li>
          {tier === 'free' && <li>Free tier: PDFs include a small EduSync watermark. Upgrade to Pro to remove it.</li>}
        </ul>
      </div>
    </div>
  );
};

export default PersonalForms;
