/**
 * PersonalAttendance — Daily attendance recorder for personal workspace.
 *
 * Simple grid: Students × Days-of-month with P/A/L/E status buttons.
 * Saves to `attendance_records` table via Supabase.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

interface Props {
  schoolId: string;
  tier: string;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  lrn: string | null;
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  date: string;
  status: string;
}

interface SectionRow {
  id: string;
  name: string;
  grade_level: number;
}

const STATUSES = ['Present', 'Absent', 'Late', 'Excused'] as const;
type Status = typeof STATUSES[number];

const STATUS_LABELS: Record<Status, { short: string; color: string; bg: string }> = {
  Present: { short: 'P', color: 'text-green-700', bg: 'bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-800/50' },
  Absent: { short: 'A', color: 'text-red-700', bg: 'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50' },
  Late: { short: 'L', color: 'text-yellow-700', bg: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-800/50' },
  Excused: { short: 'E', color: 'text-blue-700', bg: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/50' },
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekdaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) {
      const str = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(str);
    }
  }
  return days;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function PersonalAttendance({ schoolId, tier: _tier }: Props) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [section, setSection] = useState<SectionRow | null>(null);
  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Current month
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, month] = useMemo(() => currentMonth.split('-').map(Number), [currentMonth]);
  const weekdays = useMemo(() => getWeekdaysInMonth(year, month), [year, month]);

  // Record key: "studentId:date"
  const recKey = (studentId: string, date: string) => `${studentId}:${date}`;

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);

    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const [studentsRes, sectionRes, attRes] = await Promise.all([
        supabase.from('students')
          .select('id, first_name, last_name, middle_name, lrn')
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .order('last_name').order('first_name'),
        supabase.from('sections')
          .select('id, name, grade_level')
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .limit(1)
          .single(),
        supabase.from('attendance_records')
          .select('id, student_id, date, status')
          .eq('school_id', schoolId)
          .gte('date', startDate)
          .lte('date', endDate),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents(studentsRes.data || []);
      if (sectionRes.data) setSection(sectionRes.data);

      const map = new Map<string, AttendanceRecord>();
      for (const r of (attRes.data || [])) {
        map.set(recKey(r.student_id, r.date), r);
      }
      setRecords(map);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [schoolId, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle status ──
  const cycleStatus = useCallback(async (studentId: string, date: string) => {
    const key = recKey(studentId, date);
    if (saving.has(key)) return;

    const existing = records.get(key);
    const currentStatus = existing?.status || null;

    // Cycle: null → Present → Absent → Late → Excused → null
    const order: (Status | null)[] = [null, 'Present', 'Absent', 'Late', 'Excused'];
    const idx = order.indexOf(currentStatus as Status | null);
    const nextStatus = order[(idx + 1) % order.length];

    setSaving(prev => new Set(prev).add(key));
    setError(null);

    try {
      if (nextStatus === null) {
        // Delete the record
        if (existing?.id) {
          const { error: delErr } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', existing.id);
          if (delErr) throw delErr;
        }
        setRecords(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        // Upsert
        const payload = {
          school_id: schoolId,
          student_id: studentId,
          section_id: section?.id || '',
          date,
          status: nextStatus,
        };

        if (existing?.id) {
          const { error: upErr } = await supabase
            .from('attendance_records')
            .update({ status: nextStatus })
            .eq('id', existing.id);
          if (upErr) throw upErr;
          setRecords(prev => {
            const next = new Map(prev);
            next.set(key, { ...existing, status: nextStatus });
            return next;
          });
        } else {
          const { data, error: insErr } = await supabase
            .from('attendance_records')
            .insert(payload)
            .select('id, student_id, date, status')
            .single();
          if (insErr) throw insErr;
          if (data) {
            setRecords(prev => {
              const next = new Map(prev);
              next.set(key, data);
              return next;
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [schoolId, section, records, saving]);

  // ── Mark all present for a date ──
  const markAllPresent = useCallback(async (date: string) => {
    if (!section) return;
    setError(null);
    const toInsert: { school_id: string; student_id: string; section_id: string; date: string; status: string }[] = [];
    const toUpdate: { id: string; status: string }[] = [];

    for (const s of students) {
      const key = recKey(s.id, date);
      const existing = records.get(key);
      if (existing?.status === 'Present') continue;
      if (existing?.id) {
        toUpdate.push({ id: existing.id, status: 'Present' });
      } else {
        toInsert.push({
          school_id: schoolId,
          student_id: s.id,
          section_id: section.id,
          date,
          status: 'Present',
        });
      }
    }

    try {
      if (toInsert.length > 0) {
        const { data, error: insErr } = await supabase
          .from('attendance_records')
          .upsert(toInsert, { onConflict: 'student_id,date' })
          .select('id, student_id, date, status');
        if (insErr) throw insErr;
        if (data) {
          setRecords(prev => {
            const next = new Map(prev);
            for (const r of data) next.set(recKey(r.student_id, r.date), r);
            return next;
          });
        }
      }
      for (const u of toUpdate) {
        await supabase.from('attendance_records').update({ status: u.status }).eq('id', u.id);
      }
      if (toUpdate.length > 0) {
        // Refresh after batch updates
        fetchData();
      }
      setSuccessMsg(`Marked all students present for ${date}`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to mark all present');
    }
  }, [schoolId, section, students, records, fetchData]);

  // ── Month nav ──
  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // ── Stats ──
  const stats = useMemo(() => {
    let present = 0, absent = 0, late = 0, excused = 0;
    for (const r of records.values()) {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Late') late++;
      else if (r.status === 'Excused') excused++;
    }
    return { present, absent, late, excused, total: records.size };
  }, [records]);

  // ── Render ──
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading attendance data...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-teal-600" />
            Daily Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Click cells to cycle: P → A → L → E → clear
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} title="Previous month" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-200 min-w-[160px] text-center">
            {formatMonthLabel(currentMonth)}
          </span>
          <button onClick={nextMonth} title="Next month" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ChevronRightIcon className="w-5 h-5" />
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Present', val: stats.present, cls: 'text-green-600' },
          { label: 'Absent', val: stats.absent, cls: 'text-red-600' },
          { label: 'Late', val: stats.late, cls: 'text-yellow-600' },
          { label: 'Excused', val: stats.excused, cls: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${s.cls}`}>{s.val}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* No students warning */}
      {students.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium">No students in your workspace yet.</p>
          <p className="text-xs mt-1">
            Add students from the <a href="/personal/students" className="underline font-medium">My Students</a> page first.
          </p>
        </div>
      ) : (
        /* Attendance Grid */
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-700/50 text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 min-w-[180px]">
                    Student
                  </th>
                  {weekdays.map(d => {
                    const date = new Date(d + 'T00:00:00');
                    const dayNum = date.getDate();
                    const dayName = WEEKDAY_NAMES[date.getDay()];
                    return (
                      <th key={d} className="text-center px-1 py-1 font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600 min-w-[36px]">
                        <div className="text-[10px] text-slate-400">{dayName}</div>
                        <div>{dayNum}</div>
                        <button
                          onClick={() => markAllPresent(d)}
                          title={`Mark all present for ${d}`}
                          className="text-[9px] text-green-600 hover:underline mt-0.5"
                        >
                          All P
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-750/30'}>
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 whitespace-nowrap">
                      {s.last_name}, {s.first_name}
                    </td>
                    {weekdays.map(d => {
                      const key = recKey(s.id, d);
                      const rec = records.get(key);
                      const status = rec?.status as Status | undefined;
                      const si = saving.has(key);
                      const sInfo = status ? STATUS_LABELS[status] : null;

                      return (
                        <td key={d} className="text-center px-0.5 py-0.5 border-b border-slate-100 dark:border-slate-700">
                          <button
                            onClick={() => cycleStatus(s.id, d)}
                            disabled={si}
                            className={`w-7 h-7 rounded text-[11px] font-bold transition-colors ${
                              si ? 'opacity-50 cursor-wait' :
                              sInfo ? `${sInfo.bg} ${sInfo.color}` :
                              'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            title={status || 'No record'}
                          >
                            {si ? '…' : sInfo?.short || '–'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">Legend:</span>
        {STATUSES.map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`inline-block w-5 h-5 rounded text-center leading-5 text-[10px] font-bold ${STATUS_LABELS[s].bg} ${STATUS_LABELS[s].color}`}>
              {STATUS_LABELS[s].short}
            </span>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
