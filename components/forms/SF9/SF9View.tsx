/**
 * SF9View.tsx
 * Individual School Form 9 Report Card View
 * Shows SF9 report card for a single student with print/PDF functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useGradesPostgreSQL } from '../../../src/hooks/useGradesPostgreSQL';
import { useLearningAreasPostgreSQL } from '../../../src/hooks/useLearningAreasPostgreSQL';
import { useCoreValuesPostgreSQL } from '../../../src/hooks/useCoreValuesPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { useTeachersPostgreSQL } from '../../../src/hooks/useTeachersPostgreSQL';
import { useAttendancePostgreSQL } from '../../../src/hooks/useAttendancePostgreSQL';
import { useSchoolSettingsPostgreSQL } from '../../../src/hooks/useSchoolSettingsPostgreSQL';
import { useHomeroomGuidancePostgreSQL } from '../../../src/hooks/useHomeroomGuidancePostgreSQL';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import PrintableSF9Report from './PrintableSF9Report';

const SF9View: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const sid = schoolId ?? undefined;

  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId: sid });
  const { grades, loading: gradesLoading } = useGradesPostgreSQL({ schoolId: sid });
  const { learningAreas, loading: learningAreasLoading } = useLearningAreasPostgreSQL();
  const { coreValues, coreValueGrades, loading: coreValuesLoading } = useCoreValuesPostgreSQL(true, sid, true);
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: sid });
  const { teachers, loading: teachersLoading } = useTeachersPostgreSQL({ schoolId: sid });
  const { attendanceRecords, loading: attendanceLoading } = useAttendancePostgreSQL({ schoolId: sid || '' });
  const { grades: homeroomGuidanceGrades, loading: hgLoading } = useHomeroomGuidancePostgreSQL(true, sid);
  const { settings, loading: settingsLoading } = useSchoolSettingsPostgreSQL({ schoolId: sid, enableRealtime: false });

  const loading = studentsLoading || gradesLoading || learningAreasLoading ||
    coreValuesLoading || sectionsLoading || teachersLoading ||
    attendanceLoading || hgLoading || settingsLoading;

  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (!loading && students.length > 0 && studentId) {
      setStudent(students.find(s => s.id === studentId) ?? null);
    }
  }, [students, loading, studentId]);

  const schoolData = useMemo(() => ({
    grades,
    learningAreas,
    coreValues,
    coreValueGrades,
    sections,
    teachers,
    attendanceRecords,
    homeroomGuidanceGrades,
    settings: settings || {
      schoolName: 'School Name',
      region: 'Region',
      division: 'Division',
      district: 'District',
      schoolYear: '2025-2026',
    },
    monthlySchoolDaysConfig: {
      Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0, Jun: 10,
      Jul: 22, Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10
    } as Record<string, number>,
  }), [grades, learningAreas, coreValues, coreValueGrades, sections, teachers, attendanceRecords, homeroomGuidanceGrades, settings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">The requested student could not be found.</p>
          <button onClick={() => navigate('/reports/school-forms/sf9')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ← Back to SF9 Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/reports/school-forms/sf9')} className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">📋 School Form 9 - Report Card</h1>
            </div>
            <div className="text-sm text-gray-500">
              Student: <span className="font-medium text-gray-700">{student.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg">
          <PrintableSF9Report student={student} schoolData={schoolData} />
        </div>
      </div>
    </div>
  );
};

export default SF9View;
