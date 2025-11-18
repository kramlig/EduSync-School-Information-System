/**
 * GradebookViewPostgreSQL - PostgreSQL Migration Test Component
 * 
 * This is a TEST VERSION of GradebookView that uses PostgreSQL (via Supabase)
 * instead of Firestore for grade data.
 * 
 * Purpose: Verify PostgreSQL grade fetching works before full migration
 * 
 * Differences from original:
 * - Uses useGradesPostgreSQL hook instead of schoolData.grades
 * - Grade updates go to PostgreSQL
 * - Real-time subscriptions from Supabase
 * 
 * Once verified working, this will replace the original GradebookView.
 */

import React, { useState, useMemo } from 'react';
import type { Student, LearningArea, Section, AuthUser, StudentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { useGradesPostgreSQL } from '../src/hooks/useGradesPostgreSQL';
import { useSupabase } from '../src/hooks/useSupabase';

interface GradebookViewPostgreSQLProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser; type: 'staff' | 'student' };
  selectedSectionId?: string;
}

const GradebookViewPostgreSQL: React.FC<GradebookViewPostgreSQLProps> = ({
  schoolData,
  session,
  selectedSectionId
}) => {
  const { sections } = schoolData; // Only use sections from Firestore for now
  
  const [selectedSection, setSelectedSection] = useState<string>(
    selectedSectionId || sections[0]?.id || ''
  );

  // Fetch students from PostgreSQL
  const {
    data: pgStudents,
    loading: studentsLoading,
    error: studentsError
  } = useSupabase('students', {
    select: '*, sections(name, grade_level)',
    orderBy: 'last_name'
  });

  // Fetch learning areas from PostgreSQL
  const {
    data: pgLearningAreas,
    loading: areasLoading,
    error: areasError
  } = useSupabase('learning_areas', {
    orderBy: 'name'
  });
  
  // Fetch grades from PostgreSQL
  const {
    grades: pgGrades,
    loading: gradesLoading,
    error: gradesError,
    updateGrade: updatePgGrade
  } = useGradesPostgreSQL({
    sectionId: selectedSection || undefined
  });

  // Filter students by selected section
  const sectionStudents = useMemo(() => {
    if (!selectedSection) return pgStudents;
    return pgStudents.filter((s: any) => s.section_id === selectedSection);
  }, [pgStudents, selectedSection]);

  // Get learning areas for selected section
  const sectionLearningAreas = useMemo(() => {
    const section = sections.find(s => s.id === selectedSection);
    if (!section) return pgLearningAreas;
    
    // Filter learning areas by grade level
    return pgLearningAreas.filter((la: any) => {
      const laGrade = typeof la.grade_level === 'number' 
        ? la.grade_level 
        : (typeof la.grade_level === 'string' && la.grade_level.includes('Grade'))
          ? parseInt(la.grade_level.replace('Grade ', ''))
          : parseInt(String(la.grade_level));
      const sectionGrade = section.gradeLevel;
      return laGrade === sectionGrade;
    });
  }, [pgLearningAreas, sections, selectedSection]);

  // Get grade for specific student and learning area
  const getGrade = (studentId: string, learningAreaId: string) => {
    return pgGrades.find(
      g => g.studentId === studentId && g.learningAreaId === learningAreaId
    );
  };

  const loading = studentsLoading || areasLoading || gradesLoading;
  const error = studentsError || areasError || gradesError;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading grades from PostgreSQL...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          ❌ Error Loading Grades
        </h3>
        <p className="text-red-700 mb-2">{error.message || 'Unknown error'}</p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
            Show error details
          </summary>
          <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          📊 Gradebook (PostgreSQL Test)
        </h2>
        <p className="text-indigo-100">
          Testing grade data from PostgreSQL database via Supabase
        </p>
      </div>

      {/* Section Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Section
        </label>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="w-full md:w-64 p-2 border border-slate-300 rounded-lg"
        >
          {sections.map(section => (
            <option key={section.id} value={section.id}>
              Grade {section.gradeLevel} - {section.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Students</div>
          <div className="text-2xl font-bold text-blue-900">{sectionStudents.length}</div>
          <div className="text-xs text-blue-500 mt-1">From Firestore</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">PostgreSQL Grades</div>
          <div className="text-2xl font-bold text-green-900">{pgGrades.length}</div>
          <div className="text-xs text-green-500 mt-1">Total grade records</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm text-purple-600 font-medium">Avg Final Grade</div>
          <div className="text-2xl font-bold text-purple-900">
            {pgGrades.length > 0 
              ? Math.round(pgGrades.filter(g => g.finalGrade).reduce((sum, g) => sum + (g.finalGrade || 0), 0) / pgGrades.filter(g => g.finalGrade).length)
              : '-'
            }
          </div>
          <div className="text-xs text-purple-500 mt-1">Across all subjects</div>
        </div>
      </div>

      {/* Grade Records List (Raw Data View) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          📊 Grade Records from PostgreSQL
        </h3>
        
        {pgGrades.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No grade records found in PostgreSQL database
          </div>
        ) : (
          <div className="space-y-4">
            {pgGrades.slice(0, 10).map((grade) => {
              const student = pgStudents.find((s: any) => s.id === grade.studentId);
              const learningArea = pgLearningAreas.find((la: any) => la.id === grade.learningAreaId);
              return (
                <div key={grade.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900">
                      {student ? `${student.first_name} ${student.last_name}` : `Student ID: ${grade.studentId.substring(0, 8)}...`}
                    </div>
                    <div className="text-sm text-slate-500">
                      {learningArea?.name || `LA ID: ${grade.learningAreaId.substring(0, 8)}...`}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Q1</div>
                      <div className="font-semibold text-slate-900">
                        {typeof grade.q1 === 'number' ? grade.q1 : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Q2</div>
                      <div className="font-semibold text-slate-900">
                        {typeof grade.q2 === 'number' ? grade.q2 : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Q3</div>
                      <div className="font-semibold text-slate-900">
                        {typeof grade.q3 === 'number' ? grade.q3 : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Q4</div>
                      <div className="font-semibold text-slate-900">
                        {typeof grade.q4 === 'number' ? grade.q4 : '-'}
                      </div>
                    </div>
                    <div className="text-center border-l border-slate-200 pl-2">
                      <div className="text-xs text-slate-500">Final</div>
                      <div className={`font-bold ${
                        grade.finalGrade && grade.finalGrade >= 90 ? 'text-green-600' :
                        grade.finalGrade && grade.finalGrade >= 75 ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {grade.finalGrade || '-'}
                      </div>
                    </div>
                  </div>
                  {grade.remarks && (
                    <div className="mt-2 text-sm">
                      <span className={`inline-block px-2 py-1 rounded ${
                        grade.remarks === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {grade.remarks}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              PostgreSQL Connection Successful
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Grades are being read from PostgreSQL database via Supabase.
                Real-time subscriptions are active - changes will update automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradebookViewPostgreSQL;
