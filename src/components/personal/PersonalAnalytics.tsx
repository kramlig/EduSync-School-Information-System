/**
 * PersonalAnalytics — Workspace analytics dashboard for personal mode.
 *
 * Shows teacher-relevant metrics: student performance distribution,
 * grading progress, form generation activity, and workspace usage trends.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  schoolId: string;
  tier: string;
}

interface AnalyticsData {
  totalStudents: number;
  totalGrades: number;
  averageGrade: number;
  // Distribution buckets
  outstanding: number; // 90-100
  verySatisfactory: number; // 85-89
  satisfactory: number; // 80-84
  fairlySatisfactory: number; // 75-79
  didNotMeet: number; // below 75
  // Activity
  formsGenerated: number;
  subjectsCount: number;
  gradingCompletion: number; // percentage
}

const EMPTY: AnalyticsData = {
  totalStudents: 0,
  totalGrades: 0,
  averageGrade: 0,
  outstanding: 0,
  verySatisfactory: 0,
  satisfactory: 0,
  fairlySatisfactory: 0,
  didNotMeet: 0,
  formsGenerated: 0,
  subjectsCount: 0,
  gradingCompletion: 0,
};

const PersonalAnalytics: React.FC<Props> = ({ schoolId, tier }) => {
  const [data, setData] = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'quarter' | 'semester' | 'year'>('quarter');

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Fetch students (with IDs for grading completion calc)
        const { data: studentRows, count: studentCount } = await supabase
          .from('students')
          .select('id', { count: 'exact' })
          .eq('school_id', schoolId);

        // Build date filter based on period
        const now = new Date();
        let dateFrom: string;
        if (period === 'quarter') {
          const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          dateFrom = qStart.toISOString();
        } else if (period === 'semester') {
          const sStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
          dateFrom = sStart.toISOString();
        } else {
          dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
        }

        // Fetch grades with values for distribution, filtered by period
        const { data: grades } = await supabase
          .from('grades')
          .select('grade_value, student_id')
          .eq('school_id', schoolId)
          .gte('created_at', dateFrom);

        // Fetch subjects
        const { count: subjectCount } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId);

        // Fetch form download count — filter by school_id inside JSONB metadata
        const { count: formCount } = await supabase
          .from('usage_tracking')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'form_download')
          .contains('metadata', { school_id: schoolId });

        if (cancelled) return;

        const gradeValues = (grades || [])
          .map((g: any) => Number(g.grade_value))
          .filter((v: number) => !isNaN(v) && v > 0);

        const avg = gradeValues.length
          ? gradeValues.reduce((a: number, b: number) => a + b, 0) / gradeValues.length
          : 0;

        // Calculate grading completion: % of students who have at least one grade
        const totalStudents = studentCount || 0;
        const studentsWithGrades = new Set(
          (grades || []).map((g: any) => g.student_id).filter(Boolean)
        ).size;
        const completion = totalStudents > 0
          ? Math.round((studentsWithGrades / totalStudents) * 100)
          : 0;

        setData({
          totalStudents,
          totalGrades: gradeValues.length,
          averageGrade: Math.round(avg * 100) / 100,
          outstanding: gradeValues.filter((v: number) => v >= 90).length,
          verySatisfactory: gradeValues.filter((v: number) => v >= 85 && v < 90).length,
          satisfactory: gradeValues.filter((v: number) => v >= 80 && v < 85).length,
          fairlySatisfactory: gradeValues.filter((v: number) => v >= 75 && v < 80).length,
          didNotMeet: gradeValues.filter((v: number) => v < 75).length,
          formsGenerated: formCount || 0,
          subjectsCount: subjectCount || 0,
          gradingCompletion: completion,
        });
      } catch {
        // Silently fail — analytics are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [schoolId, period]);

  // Memoize distribution for bar chart
  const distribution = useMemo(() => [
    { label: 'Outstanding', range: '90-100', count: data.outstanding, color: 'bg-emerald-500' },
    { label: 'Very Satisfactory', range: '85-89', count: data.verySatisfactory, color: 'bg-blue-500' },
    { label: 'Satisfactory', range: '80-84', count: data.satisfactory, color: 'bg-yellow-500' },
    { label: 'Fairly Satisfactory', range: '75-79', count: data.fairlySatisfactory, color: 'bg-orange-500' },
    { label: 'Did Not Meet', range: 'Below 75', count: data.didNotMeet, color: 'bg-red-500' },
  ], [data]);

  const maxCount = useMemo(() => Math.max(...distribution.map(d => d.count), 1), [distribution]);

  const card = 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5';

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student performance overview and workspace activity
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(['quarter', 'semester', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className={card}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Students</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{data.totalStudents}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Grades Entered</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{data.totalGrades}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class Average</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data.averageGrade > 0 ? data.averageGrade.toFixed(1) : '—'}
          </p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Grading</p>
          <p className={`text-2xl font-bold mt-1 ${
            data.gradingCompletion >= 80 ? 'text-emerald-600' :
            data.gradingCompletion >= 50 ? 'text-amber-600' :
            'text-slate-900 dark:text-white'
          }`}>
            {data.gradingCompletion}%
          </p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subjects</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{data.subjectsCount}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Forms Generated</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{data.formsGenerated}</p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className={card}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Grade Distribution
        </h2>
        {data.totalGrades === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No grades entered yet. Start adding grades in the Gradebook to see distribution.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {distribution.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <div className="w-36 text-sm text-slate-600 dark:text-slate-300 shrink-0">
                  {d.label}
                  <span className="text-xs text-slate-400 ml-1">({d.range})</span>
                </div>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${d.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Performance Summary</h2>
          {data.totalGrades === 0 ? (
            <p className="text-sm text-slate-400">No data available yet.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Passing Rate</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {data.totalGrades > 0
                    ? `${Math.round(((data.totalGrades - data.didNotMeet) / data.totalGrades) * 100)}%`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Honor Students (90+)</span>
                <span className="font-medium text-emerald-600">{data.outstanding}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">At-Risk (&lt;75)</span>
                <span className="font-medium text-red-600">{data.didNotMeet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Class Average</span>
                <span className="font-medium text-slate-900 dark:text-white">{data.averageGrade.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pro Upgrade CTA for free users */}
        {tier === 'free' ? (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Unlock Advanced Analytics</h2>
              <ul className="text-sm text-indigo-100 space-y-1">
                <li>• Quarterly trend charts</li>
                <li>• Subject-wise breakdown</li>
                <li>• Exportable reports</li>
                <li>• Student progress tracking</li>
              </ul>
            </div>
            <a
              href="/personal/settings"
              className="mt-4 inline-block text-center px-4 py-2 bg-white text-indigo-600 font-medium text-sm rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Upgrade to Pro — ₱79/month
            </a>
          </div>
        ) : (
          <div className={card}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <a href="/personal/grades" className="block px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                → Open Gradebook
              </a>
              <a href="/personal/forms" className="block px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                → Generate Forms
              </a>
              <a href="/personal/students" className="block px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                → Manage Students
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalAnalytics;
