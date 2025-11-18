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
  const { students, learningAreas, sections } = schoolData;
  
  // Get school ID from first student (temporary - will come from auth context later)
  const schoolId = students[0]?.schoolId;
  
  // Fetch grades from PostgreSQL
  const {
    grades: pgGrades,
    loading: gradesLoading,
    error: gradesError,
    updateGrade: updatePgGrade
  } = useGradesPostgreSQL({
    sectionId: selectedSectionId || undefined,
    schoolId
  });

  const [selectedSection, setSelectedSection] = useState<string>(
    selectedSectionId || sections[0]?.id || ''
  );

  // Filter students by selected section
  const sectionStudents = useMemo(() => {
    if (!selectedSection) return students;
    return students.filter(s => s.sectionId === selectedSection);
  }, [students, selectedSection]);

  // Get learning areas for selected section
  const sectionLearningAreas = useMemo(() => {
    const section = sections.find(s => s.id === selectedSection);
    if (!section) return learningAreas;
    
    // Filter learning areas by grade level
    return learningAreas.filter(la => {
      const laGrade = typeof la.gradeLevel === 'number' 
        ? la.gradeLevel 
        : parseInt(la.gradeLevel.replace('Grade ', ''));
      const sectionGrade = section.gradeLevel;
      return laGrade === sectionGrade;
    });
  }, [learningAreas, sections, selectedSection]);

  // Get grade for specific student and learning area
  const getGrade = (studentId: string, learningAreaId: string) => {
    return pgGrades.find(
      g => g.studentId === studentId && g.learningAreaId === learningAreaId
    );
  };

  if (gradesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading grades from PostgreSQL...</p>
        </div>
      </div>
    );
  }

  if (gradesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          ❌ Error Loading Grades
        </h3>
        <p className="text-red-700">{gradesError.message}</p>
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
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">Learning Areas</div>
          <div className="text-2xl font-bold text-green-900">{sectionLearningAreas.length}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm text-purple-600 font-medium">Total Grades</div>
          <div className="text-2xl font-bold text-purple-900">{pgGrades.length}</div>
        </div>
      </div>

      {/* Simple Grade Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Student
                </th>
                {sectionLearningAreas.slice(0, 5).map(la => (
                  <th key={la.id} className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    {la.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sectionStudents.slice(0, 10).map(student => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {student.name}
                  </td>
                  {sectionLearningAreas.slice(0, 5).map(la => {
                    const grade = getGrade(student.id, la.id);
                    return (
                      <td key={la.id} className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                          grade?.finalGrade
                            ? grade.finalGrade >= 90
                              ? 'bg-green-100 text-green-800'
                              : grade.finalGrade >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {grade?.finalGrade || '-'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
