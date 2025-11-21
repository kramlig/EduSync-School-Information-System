/**
 * Form138View.tsx
 * Individual Form 138 Report Card View Component
 * Shows detailed report card for a single student with print functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useGradesPostgreSQL } from '../../../src/hooks/useGradesPostgreSQL';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import PrintableReport from '../../PrintableReport';

const Form138View: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  
  // Use PostgreSQL hooks
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId });
  const { grades, loading: gradesLoading } = useGradesPostgreSQL({ schoolId, studentId });
  
  const loading = studentsLoading || gradesLoading;
  const error = null;
  
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (!loading && students.length > 0 && studentId) {
      const foundStudent = students.find(s => s.id === studentId);
      setStudent(foundStudent);
    }
  }, [students, loading, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/grades/form138')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Form 138 Dashboard
          </button>
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
          <button
            onClick={() => navigate('/grades/form138')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Form 138 Dashboard
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
              <button
                onClick={() => navigate('/grades/form138')}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">
                📋 Form 138 - Report Card
              </h1>
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
          <PrintableReport
            student={student}
            schoolData={schoolData}
          />
        </div>
      </div>
    </div>
  );
};

export default Form138View;