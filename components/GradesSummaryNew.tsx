/**
 * GradesSummary - Simple, working grades overview
 * 
 * Direct Supabase queries, no complex hooks, no magic.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import type { AuthUser, StudentUser, ParentUser, SchoolSettings } from '../types';
import Spinner from './Spinner';

interface GradesSummaryProps {
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
}

type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

interface Section {
  id: string;
  name: string;
  grade_level: number;
}

interface Student {
  id: string;
  name: string;
  lrn: string;
}

interface Grade {
  id: string;
  student_id: string;
  learning_area_id: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
}

interface LearningArea {
  id: string;
  name: string;
  code: string | null;
  k_to_twelve_code: string | null;
  grade_levels: number[] | null;
}

// Get performance badge
const getPerformanceBadge = (avg: number | null) => {
  if (avg === null) return { icon: '—', label: 'Incomplete', color: 'text-slate-400' };
  if (avg >= 90) return { icon: '🏆', label: 'Outstanding', color: 'text-yellow-500' };
  if (avg >= 85) return { icon: '⭐', label: 'Very Good', color: 'text-green-500' };
  if (avg >= 80) return { icon: '✨', label: 'Good', color: 'text-blue-500' };
  if (avg >= 75) return { icon: '✓', label: 'Passed', color: 'text-emerald-500' };
  return { icon: '⚠️', label: 'Failed', color: 'text-red-500' };
};

const GradesSummaryNew: React.FC<GradesSummaryProps> = ({ session }) => {
  const authUser = session.user as AuthUser;
  const schoolId = authUser.schoolId || '';

  // All state in one place
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterKey>('q2');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Step 1: Load sections on mount
  useEffect(() => {
    const loadSections = async () => {
      setLoadingSections(true);
      
      const { data, error } = await supabase
        .from('sections')
        .select('id, name, grade_level')
        .eq('school_id', schoolId)
        .order('grade_level')
        .order('name');
      
      if (error) {
        console.error('Error loading sections:', error);
        setLoadingSections(false);
        return;
      }
      
      const sectionList = data || [];
      setSections(sectionList);
      
      // Auto-select first section
      if (sectionList.length > 0) {
        setSelectedSectionId(sectionList[0].id);
      }
      
      setLoadingSections(false);
    };

    if (schoolId) {
      loadSections();
    }
  }, [schoolId]);

  // Step 2: Load learning areas for the school
  useEffect(() => {
    const loadLearningAreas = async () => {
      if (!schoolId) return;
      
      const { data, error } = await supabase
        .from('learning_areas')
        .select('id, name, code, k_to_twelve_code, grade_levels')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('display_order')
        .order('name');
      
      if (error) {
        console.error('Error loading learning areas:', error);
      }
      
      // Deduplicate by k_to_twelve_code or name
      const seen = new Set<string>();
      const unique = (data || []).filter(la => {
        const key = la.k_to_twelve_code || la.code || la.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      setLearningAreas(unique);
    };

    loadLearningAreas();
  }, [schoolId]);

  // Step 3: Load students and grades when section changes
  useEffect(() => {
    if (!selectedSectionId) {
      setStudents([]);
      setGrades([]);
      return;
    }

    const loadData = async () => {
      setLoadingData(true);

      // Load students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, lrn')
        .eq('section_id', selectedSectionId)
        .eq('enrollment_status', 'enrolled')
        .is('deleted_at', null)
        .order('name');

      if (studentError) {
        console.error('Error loading students:', studentError);
        setLoadingData(false);
        return;
      }

      const studentList = studentData || [];
      setStudents(studentList);

      if (studentList.length === 0) {
        setGrades([]);
        setLoadingData(false);
        return;
      }

      // Load grades for students
      const studentIds = studentList.map(s => s.id);
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('id, student_id, learning_area_id, q1, q2, q3, q4')
        .in('student_id', studentIds);

      if (gradeError) {
        console.error('Error loading grades:', gradeError);
      }

      setGrades(gradeData || []);
      setLoadingData(false);
    };

    loadData();
  }, [selectedSectionId]);

  // Get current section
  const currentSection = sections.find(s => s.id === selectedSectionId);
  
  // Filter learning areas for current grade level - STRICT matching
  const filteredLearningAreas = learningAreas.filter(la => {
    if (!currentSection) return false;
    // Must have grade_levels array that includes this grade
    if (!la.grade_levels || la.grade_levels.length === 0) return false;
    return la.grade_levels.includes(currentSection.grade_level);
  });

  // Filter students by search
  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.lrn?.toLowerCase().includes(q);
  });

  // Calculate stats
  const calculateStats = () => {
    let totalGrades = 0;
    let gradeSum = 0;
    let honorRoll = 0;
    let needsAttention = 0;

    filteredStudents.forEach(student => {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      const quarterGrades: number[] = [];

      filteredLearningAreas.forEach(la => {
        const grade = studentGrades.find(g => g.learning_area_id === la.id);
        const value = grade?.[selectedQuarter];
        if (typeof value === 'number') {
          quarterGrades.push(value);
        }
      });

      if (quarterGrades.length > 0) {
        const avg = quarterGrades.reduce((a, b) => a + b, 0) / quarterGrades.length;
        gradeSum += avg;
        totalGrades++;
        if (avg >= 85) honorRoll++;
        if (avg < 75) needsAttention++;
      }
    });

    return {
      classAverage: totalGrades > 0 ? (gradeSum / totalGrades).toFixed(1) : '0.0',
      honorRoll,
      needsAttention,
      totalStudents: filteredStudents.length
    };
  };

  const stats = calculateStats();

  // Get grade for student/subject
  const getGrade = (studentId: string, learningAreaId: string): number | null => {
    const grade = grades.find(g => g.student_id === studentId && g.learning_area_id === learningAreaId);
    return grade?.[selectedQuarter] ?? null;
  };

  // Calculate student average
  const getStudentAverage = (studentId: string): number | null => {
    const studentGrades = grades.filter(g => g.student_id === studentId);
    const values: number[] = [];

    filteredLearningAreas.forEach(la => {
      const grade = studentGrades.find(g => g.learning_area_id === la.id);
      const value = grade?.[selectedQuarter];
      if (typeof value === 'number') {
        values.push(value);
      }
    });

    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Loading state
  if (loadingSections) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
        <span className="ml-2 text-slate-600">Loading sections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Grade Summary</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View quarterly grades computed from Electronic Class Record
          </p>
        </div>
        <Link
          to="/grades/class-record-selector"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ✏️ Edit in Class Record
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Section */}
        <div className="flex items-center gap-2">
          <label htmlFor="section-select" className="text-sm font-medium text-slate-600 dark:text-slate-400">Section:</label>
          <select
            id="section-select"
            aria-label="Select section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          >
            {sections.length === 0 && <option value="">No sections</option>}
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                Grade {s.grade_level} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quarter */}
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
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
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
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.classAverage}%</div>
          <div className="text-sm text-slate-500">Class Average</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-green-600">{stats.honorRoll}</div>
          <div className="text-sm text-slate-500">Honor Roll (≥85)</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-red-600">{stats.needsAttention}</div>
          <div className="text-sm text-slate-500">Needs Attention (&lt;75)</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalStudents}</div>
          <div className="text-sm text-slate-500">Total Students</div>
        </div>
      </div>

      {/* Loading indicator */}
      {loadingData && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-2">Loading grades...</span>
        </div>
      )}

      {/* Grades Table */}
      {!loadingData && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[800px] relative">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase sticky left-0 bg-slate-50 dark:bg-slate-900 z-30 shadow-sm">
                    Student
                  </th>
                  {filteredLearningAreas.map(la => (
                    <th key={la.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      {la.k_to_twelve_code || la.code || la.name.substring(0, 8)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-900/20">
                    Average
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={filteredLearningAreas.length + 3} className="px-4 py-8 text-center text-slate-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const avg = getStudentAverage(student.id);
                    const badge = getPerformanceBadge(avg);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 z-10 shadow-sm">
                          <div className="font-medium text-slate-800 dark:text-white">
                            {student.name} <span className={badge.color}>{badge.icon}</span>
                          </div>
                          <div className="text-xs text-slate-500">{student.lrn}</div>
                        </td>
                        {filteredLearningAreas.map(la => {
                          const grade = getGrade(student.id, la.id);
                          const color = grade === null ? 'text-slate-400' :
                                       grade < 75 ? 'text-red-600' :
                                       grade < 80 ? 'text-orange-500' : 'text-slate-800 dark:text-white';
                          return (
                            <td key={la.id} className={`px-3 py-3 text-center ${color}`}>
                              {grade !== null ? grade : '—'}
                            </td>
                          );
                        })}
                        <td className={`px-4 py-3 text-center font-semibold bg-indigo-50 dark:bg-indigo-900/20 ${
                          avg === null ? 'text-slate-400' : avg < 75 ? 'text-red-600' : 'text-indigo-600'
                        }`}>
                          {avg !== null ? avg.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            avg === null ? 'bg-slate-100 text-slate-600' :
                            avg >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {avg === null ? 'Incomplete' : avg >= 75 ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradesSummaryNew;
