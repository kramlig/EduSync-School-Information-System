import React, { useState, useMemo } from 'react';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import GradesView from './GradesView';
import GradebookView from './GradebookView';
import BarChart from './BarChart';

type ViewMode = 'spreadsheet' | 'student' | 'analytics';

interface UnifiedGradesViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  forceStudentId?: string; // For parent view
}

const UnifiedGradesView: React.FC<UnifiedGradesViewProps> = ({ schoolData, session, forceStudentId }) => {
  const { students, grades, learningAreas } = schoolData;
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';

  // View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Students and parents always see student mode
    if (isStudentView || isParentView) return 'student';
    // Staff defaults to spreadsheet mode (most efficient for grade entry)
    return 'spreadsheet';
  });

  const title = isStudentView ? 'My Grades' : (isParentView ? `Grades` : 'Grades & Reports');

  // Calculate quarter average helper
  const calculateQuarterAverage = (grade: number | Record<string, number> | undefined): number | undefined => {
    if (grade === undefined) return undefined;
    if (typeof grade === 'number') return grade;
    const subGrades = Object.values(grade).filter(g => typeof g === 'number');
    if (subGrades.length === 0) return undefined;
    const total = subGrades.reduce((acc, val) => acc + val, 0);
    return Math.round(total / subGrades.length);
  };

  // Calculate analytics statistics
  const analyticsStats = useMemo(() => {
    let totalGradeSum = 0;
    let gradeCount = 0;
    const distribution = { excellent: 0, good: 0, fair: 0, passing: 0, failing: 0 };
    const subjectAverages: { subject: string; average: number; count: number }[] = [];

    learningAreas.forEach(la => {
      let subjectSum = 0;
      let subjectCount = 0;

      students.forEach(student => {
        const grade = grades.find(g => g.studentId === student.id && g.learningAreaId === la.id);
        if (grade) {
          ['q1', 'q2', 'q3', 'q4'].forEach(q => {
            const qGrade = calculateQuarterAverage(grade[q as 'q1' | 'q2' | 'q3' | 'q4']);
            if (qGrade !== undefined) {
              totalGradeSum += qGrade;
              gradeCount++;
              subjectSum += qGrade;
              subjectCount++;

              // Distribution
              if (qGrade >= 90) distribution.excellent++;
              else if (qGrade >= 80) distribution.good++;
              else if (qGrade >= 75) distribution.fair++;
              else if (qGrade >= 60) distribution.passing++;
              else distribution.failing++;
            }
          });
        }
      });

      if (subjectCount > 0) {
        subjectAverages.push({
          subject: la.name,
          average: Math.round((subjectSum / subjectCount) * 10) / 10,
          count: subjectCount
        });
      }
    });

    const overallAverage = gradeCount > 0 ? totalGradeSum / gradeCount : 0;

    return {
      overallAverage,
      distribution,
      subjectAverages: subjectAverages.sort((a, b) => b.average - a.average),
      totalGrades: gradeCount,
    };
  }, [students, grades, learningAreas]);

  // Render Analytics Mode
  const renderAnalyticsMode = () => (
    <div>
      {/* Overall Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Average Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-sm font-medium text-purple-100 mb-2">Overall Class Average</h3>
          <p className="text-4xl font-bold">{analyticsStats.overallAverage.toFixed(1)}</p>
          <p className="text-purple-100 text-sm mt-2">
            {analyticsStats.overallAverage >= 90 ? '🌟 Excellent Performance' : 
             analyticsStats.overallAverage >= 80 ? '👍 Good Performance' : 
             analyticsStats.overallAverage >= 75 ? '✓ Fair Performance' : 
             analyticsStats.overallAverage >= 60 ? '⚠ Needs Improvement' : '⚠ Critical'}
          </p>
        </div>

        {/* Total Grades Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-sm font-medium text-blue-100 mb-2">Total Grades Entered</h3>
          <p className="text-4xl font-bold">{analyticsStats.totalGrades.toLocaleString()}</p>
          <p className="text-blue-100 text-sm mt-2">
            Across {students.length} students × {learningAreas.length} subjects
          </p>
        </div>

        {/* Distribution Summary Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-sm font-medium text-green-100 mb-2">Top Performance Grades</h3>
          <p className="text-4xl font-bold">{analyticsStats.distribution.excellent + analyticsStats.distribution.good}</p>
          <p className="text-green-100 text-sm mt-2">
            {(((analyticsStats.distribution.excellent + analyticsStats.distribution.good) / analyticsStats.totalGrades) * 100).toFixed(1)}% scoring 80+
          </p>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Grade Distribution</h2>
        <BarChart
          data={[
            { label: '90-100 (Excellent)', value: analyticsStats.distribution.excellent, color: 'bg-green-500' },
            { label: '80-89 (Good)', value: analyticsStats.distribution.good, color: 'bg-blue-500' },
            { label: '75-79 (Fair)', value: analyticsStats.distribution.fair, color: 'bg-yellow-500' },
            { label: '60-74 (Passing)', value: analyticsStats.distribution.passing, color: 'bg-orange-500' },
            { label: '<60 (Failing)', value: analyticsStats.distribution.failing, color: 'bg-red-500' },
          ]}
        />
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-semibold">Most Common Grade Range:</span>{' '}
            {analyticsStats.distribution.excellent >= Math.max(...Object.values(analyticsStats.distribution)) ? '90-100 (Excellent)' :
             analyticsStats.distribution.good >= Math.max(...Object.values(analyticsStats.distribution)) ? '80-89 (Good)' :
             analyticsStats.distribution.fair >= Math.max(...Object.values(analyticsStats.distribution)) ? '75-79 (Fair)' :
             analyticsStats.distribution.passing >= Math.max(...Object.values(analyticsStats.distribution)) ? '60-74 (Passing)' : '<60 (Failing)'}
          </p>
        </div>
      </div>

      {/* Subject Performance Comparison */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Subject Performance Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Average</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total Grades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {analyticsStats.subjectAverages.map((subject, idx) => {
                const getColor = (avg: number) => {
                  if (avg >= 90) return 'text-green-600 dark:text-green-400';
                  if (avg >= 80) return 'text-blue-600 dark:text-blue-400';
                  if (avg >= 75) return 'text-yellow-600 dark:text-yellow-400';
                  if (avg >= 60) return 'text-orange-600 dark:text-orange-400';
                  return 'text-red-600 dark:text-red-400';
                };

                const getPerformance = (avg: number) => {
                  if (avg >= 90) return '🌟 Excellent';
                  if (avg >= 80) return '👍 Good';
                  if (avg >= 75) return '✓ Fair';
                  if (avg >= 60) return '⚠ Passing';
                  return '❌ Failing';
                };

                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{subject.subject}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${getColor(subject.average)}`}>
                      {subject.average.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {getPerformance(subject.average)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 text-right">
                      {subject.count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3">📊 Quick Insights</h3>
        <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
          <li>
            • <span className="font-semibold">Highest Performing Subject:</span> {analyticsStats.subjectAverages[0]?.subject} ({analyticsStats.subjectAverages[0]?.average.toFixed(1)} average)
          </li>
          <li>
            • <span className="font-semibold">Needs Attention:</span> {analyticsStats.subjectAverages[analyticsStats.subjectAverages.length - 1]?.subject} ({analyticsStats.subjectAverages[analyticsStats.subjectAverages.length - 1]?.average.toFixed(1)} average)
          </li>
          <li>
            • <span className="font-semibold">Pass Rate:</span> {(((analyticsStats.totalGrades - analyticsStats.distribution.failing) / analyticsStats.totalGrades) * 100).toFixed(1)}% of grades are 75 or higher
          </li>
          <li>
            • <span className="font-semibold">Excellence Rate:</span> {((analyticsStats.distribution.excellent / analyticsStats.totalGrades) * 100).toFixed(1)}% of grades are 90 or higher
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{title}</h1>
        
        {/* Mode Switcher Tabs - Only show for staff */}
        {!(isStudentView || isParentView) && (
          <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm p-1 gap-1">
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Spreadsheet</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                viewMode === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Students</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                viewMode === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Render Mode-Specific Content */}
      {viewMode === 'spreadsheet' && <GradebookView schoolData={schoolData} session={session as any} />}
      {viewMode === 'student' && <GradesView schoolData={schoolData} session={session} forceStudentId={forceStudentId} />}
      {viewMode === 'analytics' && renderAnalyticsMode()}
    </div>
  );
};

export default UnifiedGradesView;
