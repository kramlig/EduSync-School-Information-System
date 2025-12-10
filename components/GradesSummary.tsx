/**
 * GradesSummary - Clean, focused view of quarterly grades
 * 
 * Purpose: Display computed grades from ECR in a simple, scannable format
 * 
 * Design Principles:
 * - ECR is the source of truth for grade entry
 * - This view is READ-ONLY (grades come from ECR sync)
 * - Simple table: Students × Subjects × Quarterly Grades
 * - Clear CTAs: Edit in ECR, Generate Reports
 * - Performance badges inline for quick identification
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser, StudentUser, ParentUser, SchoolSettings } from '../types';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import { supabase } from '../src/lib/supabase';
import Spinner from './Spinner';

interface GradesSummaryProps {
  schoolData: { settings: SchoolSettings; loading?: boolean };
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
}

type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

// Performance badge based on average
const PerformanceBadge: React.FC<{ average: number | null }> = ({ average }) => {
  if (average === null) return <span className="text-slate-400">-</span>;
  
  if (average >= 95) return <span title="With Highest Honors">🏆</span>;
  if (average >= 90) return <span title="With High Honors">⭐</span>;
  if (average >= 85) return <span title="With Honors">✨</span>;
  if (average >= 75) return <span title="Passed">✓</span>;
  return <span title="Needs Improvement" className="text-red-500">⚠️</span>;
};

// Grade cell with color coding
const GradeCell: React.FC<{ grade: number | null | undefined }> = ({ grade }) => {
  if (grade === null || grade === undefined) {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }
  
  let colorClass = 'text-slate-700 dark:text-slate-300';
  if (grade >= 90) colorClass = 'text-green-600 dark:text-green-400 font-semibold';
  else if (grade >= 85) colorClass = 'text-blue-600 dark:text-blue-400';
  else if (grade >= 75) colorClass = 'text-slate-700 dark:text-slate-300';
  else colorClass = 'text-red-600 dark:text-red-400 font-semibold';
  
  return <span className={colorClass}>{grade.toFixed(0)}</span>;
};

const GradesSummary: React.FC<GradesSummaryProps> = ({ schoolData, session }) => {
  // Determine user type first (static values)
  const isStaff = session.type === 'staff';
  const authUser = session.user as AuthUser;
  const schoolId = authUser.schoolId || '';

  // State
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterKey>(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 8) return 'q1';
    if (month >= 9 && month <= 11) return 'q2';
    if (month === 12 || month === 1 || month === 2) return 'q3';
    return 'q4';
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Direct data state - bypass hook dependency issues
  const [localStudents, setLocalStudents] = useState<any[]>([]);
  const [localGrades, setLocalGrades] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Load sections for the school
  const { sections: rawSections, loading: sectionsLoading } = useSectionsPostgreSQL({
    schoolId: schoolId || undefined,
    includeAdviser: true,
    includeStudentCount: true
  });

  // Load learning areas
  const { learningAreas } = useLearningAreasPostgreSQL();

  // Filter and deduplicate sections
  const visibleSections = useMemo(() => {
    if (!isStaff || !rawSections.length) return [];
    
    let filtered = rawSections;
    if (!['admin', 'principal', 'registrar'].includes(authUser.role)) {
      const teacherId = (authUser as any).postgresqlId || authUser.id;
      filtered = rawSections.filter(s => s.adviserId === teacherId);
    }
    
    const seen = new Set<string>();
    return filtered.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [rawSections, authUser.role, (authUser as any).postgresqlId, authUser.id, isStaff]);

  // Auto-select first section when sections load
  React.useEffect(() => {
    if (!sectionsLoading && visibleSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(visibleSections[0].id);
    }
  }, [sectionsLoading, visibleSections.length]); // Minimal dependencies

  // DIRECT DATA FETCH - This is the key fix
  // Fetch students and grades directly when section changes
  React.useEffect(() => {
    if (!selectedSectionId) {
      setLocalStudents([]);
      setLocalGrades([]);
      return;
    }

    let cancelled = false;
    
    const fetchData = async () => {
      setDataLoading(true);
      
      try {
        // Fetch students for section
        const { data: studentData } = await supabase
          .from('students')
          .select('id, name, first_name, last_name, lrn, section_id')
          .eq('section_id', selectedSectionId)
          .eq('enrollment_status', 'enrolled')
          .is('deleted_at', null)
          .order('name');
        
        if (cancelled) return;
        
        const students = studentData || [];
        setLocalStudents(students);
        
        if (students.length === 0) {
          setLocalGrades([]);
          setDataLoading(false);
          return;
        }
        
        // Fetch grades for those students
        const studentIds = students.map((s: { id: string }) => s.id);
        const { data: gradeData } = await supabase
          .from('grades')
          .select('*')
          .in('student_id', studentIds);
        
        if (cancelled) return;
        
        setLocalGrades(gradeData || []);
      } catch (err) {
        console.error('[GradesSummary] Error fetching data:', err);
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [selectedSectionId]); // Only depends on sectionId - simple and reliable

  // Use local data
  const students = localStudents;
  const grades = localGrades;
  const gradesLoading = dataLoading;
  const studentsLoading = dataLoading;

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.lrn?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Get learning areas for the selected section's grade level
  const selectedSection = visibleSections.find(s => s.id === selectedSectionId);
  const sectionLearningAreas = useMemo(() => {
    if (!selectedSection) return [];
    const gradeLevel = typeof selectedSection.gradeLevel === 'number' 
      ? selectedSection.gradeLevel 
      : parseInt(String(selectedSection.gradeLevel).replace(/\D/g, '')) || 0;
    
    return learningAreas.filter(la => {
      if (!la.gradeLevel || la.gradeLevel.length === 0) return true;
      return la.gradeLevel.includes(gradeLevel);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedSection, learningAreas]);

  // Calculate student averages and stats
  const studentStats = useMemo(() => {
    return filteredStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const quarterGrades: number[] = [];
      
      sectionLearningAreas.forEach(la => {
        const grade = studentGrades.find(g => g.learningAreaId === la.id);
        const quarterValue = grade?.[selectedQuarter];
        if (typeof quarterValue === 'number') {
          quarterGrades.push(quarterValue);
        }
      });
      
      const average = quarterGrades.length > 0
        ? quarterGrades.reduce((sum, g) => sum + g, 0) / quarterGrades.length
        : null;
      
      const completion = sectionLearningAreas.length > 0
        ? (quarterGrades.length / sectionLearningAreas.length) * 100
        : 0;
      
      return {
        student,
        grades: studentGrades,
        average,
        completion,
        quarterGrades
      };
    });
  }, [filteredStudents, grades, sectionLearningAreas, selectedQuarter]);

  // Class statistics
  const classStats = useMemo(() => {
    const averages = studentStats.filter(s => s.average !== null).map(s => s.average!);
    const classAverage = averages.length > 0 
      ? averages.reduce((sum, a) => sum + a, 0) / averages.length 
      : 0;
    
    const honorRoll = studentStats.filter(s => s.average !== null && s.average >= 85).length;
    const needsAttention = studentStats.filter(s => s.average !== null && s.average < 75).length;
    const incomplete = studentStats.filter(s => s.completion < 100).length;
    
    return { classAverage, honorRoll, needsAttention, incomplete, total: studentStats.length };
  }, [studentStats]);

  // Loading state
  const isLoading = sectionsLoading || studentsLoading || gradesLoading;

  if (isLoading && !selectedSectionId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Grade Summary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View quarterly grades computed from Electronic Class Record
          </p>
        </div>
        
        <Link
          to="/grades/class-record-selector"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit in Class Record
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Section Select */}
        <div className="flex items-center gap-2">
          <label htmlFor="section-select" className="text-sm font-medium text-slate-600 dark:text-slate-400">Section:</label>
          <select
            id="section-select"
            aria-label="Select section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={sectionsLoading}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          >
            {sectionsLoading ? (
              <option value="">Loading sections...</option>
            ) : visibleSections.length === 0 ? (
              <option value="">No sections available</option>
            ) : null}
            {visibleSections.map(section => (
              <option key={section.id} value={section.id}>
                Grade {section.gradeLevel} - {section.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quarter Select */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Quarter:</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
            {(['q1', 'q2', 'q3', 'q4'] as QuarterKey[]).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedQuarter === q
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {classStats.classAverage.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Class Average</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {classStats.honorRoll}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Honor Roll (≥85)</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {classStats.needsAttention}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Needs Attention (&lt;75)</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">
            {classStats.total}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Students</div>
        </div>
      </div>

      {/* Grades Table */}
      {selectedSectionId ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                    Student
                  </th>
                  {sectionLearningAreas.map(la => (
                    <th 
                      key={la.id} 
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider min-w-[80px]"
                      title={la.name}
                    >
                      {la.kToTwelveCode || la.name.substring(0, 6)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30">
                    Average
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={sectionLearningAreas.length + 3} className="px-4 py-8 text-center">
                      <Spinner />
                    </td>
                  </tr>
                ) : studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={sectionLearningAreas.length + 3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No students found
                    </td>
                  </tr>
                ) : (
                  studentStats.map(({ student, grades: studentGrades, average }) => (
                    <tr 
                      key={student.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white sticky left-0 bg-white dark:bg-slate-800 z-10">
                        <div className="flex items-center gap-2">
                          <span>{student.name}</span>
                          <PerformanceBadge average={average} />
                        </div>
                        {student.lrn && (
                          <div className="text-xs text-slate-400">{student.lrn}</div>
                        )}
                      </td>
                      {sectionLearningAreas.map(la => {
                        const grade = studentGrades.find(g => g.learningAreaId === la.id);
                        const quarterValue = grade?.[selectedQuarter];
                        return (
                          <td key={la.id} className="px-3 py-3 text-center text-sm">
                            <GradeCell grade={typeof quarterValue === 'number' ? quarterValue : null} />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-sm font-semibold bg-indigo-50/50 dark:bg-indigo-900/20">
                        {average !== null ? (
                          <span className={average >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {average !== null && average >= 75 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Passed
                          </span>
                        ) : average !== null ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-full">
                            Incomplete
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-slate-400 dark:text-slate-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
            Select a Section
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose a section from the dropdown above to view student grades
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {selectedSectionId && studentStats.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <Link
            to={`/reports/form138?section=${selectedSectionId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Form 138
          </Link>
          <Link
            to="/grades/class-record-selector"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Grades in ECR
          </Link>
        </div>
      )}
    </div>
  );
};

export default GradesSummary;
