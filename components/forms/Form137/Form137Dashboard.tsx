/**
 * Form 137 Dashboard
 * 
 * Landing page for Form 137 (Permanent Academic Record)
 * Shows list of students and allows:
 * - Viewing existing Form 137 records
 * - Creating new records
 * - Filtering by grade level, section, school year
 * - Quick access to student records
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form137Service } from '../../../services/formsService';
import { getCurrentSchoolYear, getSchoolYearOptions } from '../../../services/dateHelpers';
import {
  SectionHeader,
  Badge,
  EmptyState
} from '../shared/FormComponents';
import {
  LoadingSpinner,
  ErrorState,
  CardSkeleton
} from '../shared/LoadingStates';
import { 
  AcademicCapIcon, 
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon
} from '../../icons';

// Eye icon for viewing records
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Plus icon for creating records
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

interface StudentRecord {
  studentId: string;
  studentName: string;
  lrn?: string;
  gradeLevel: number;
  section: string;
  recordCount: number;
  latestSchoolYear: string;
  generalAverage?: number;
  promotionStatus?: string;
}

export const Form137Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(getCurrentSchoolYear());
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStudentRecords();
  }, [selectedSchoolYear, selectedGradeLevel]);

  const loadStudentRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, this would fetch from a students collection
      // For now, we'll get all Form 137 records and group by student
      const allRecords = await Form137Service.getBySchoolYear(selectedSchoolYear);
      
      // Group records by student
      const studentMap = new Map<string, StudentRecord>();
      
      allRecords.forEach(record => {
        const existing = studentMap.get(record.studentId);
        
        if (existing) {
          existing.recordCount++;
          // Update latest if this record is more recent
          if (record.schoolYear > existing.latestSchoolYear) {
            existing.latestSchoolYear = record.schoolYear;
            existing.gradeLevel = record.gradeLevel;
            existing.section = record.section;
            existing.generalAverage = record.generalAverage;
            existing.promotionStatus = record.promotionStatus;
          }
        } else {
          studentMap.set(record.studentId, {
            studentId: record.studentId,
            studentName: record.studentName,
            lrn: record.lrn,
            gradeLevel: record.gradeLevel,
            section: record.section,
            recordCount: 1,
            latestSchoolYear: record.schoolYear,
            generalAverage: record.generalAverage,
            promotionStatus: record.promotionStatus
          });
        }
      });

      let studentList = Array.from(studentMap.values());

      // Filter by grade level if selected
      if (selectedGradeLevel !== 'all') {
        studentList = studentList.filter(s => s.gradeLevel === selectedGradeLevel);
      }

      // Sort by name
      studentList.sort((a, b) => a.studentName.localeCompare(b.studentName));

      setStudents(studentList);
    } catch (err) {
      console.error('Error loading student records:', err);
      setError('Failed to load student records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (studentId: string) => {
    navigate(`/forms/137/${studentId}`);
  };

  const handleCreateRecord = () => {
    navigate('/forms/137/new');
  };

  // Filter students by search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.studentName.toLowerCase().includes(query) ||
      student.lrn?.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Form 137 - Permanent Academic Record
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Loading student records...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorState
          title="Failed to Load Records"
          message={error}
          onRetry={loadStudentRecords}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Form 137 - Permanent Academic Record
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage learner's permanent academic records
          </p>
        </div>
        <button
          onClick={handleCreateRecord}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon />
          <span>Create New Record</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Students</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{students.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">School Year</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{selectedSchoolYear}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Records</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {students.reduce((sum, s) => sum + s.recordCount, 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Grade</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {students.length > 0
              ? Math.round(
                  students.reduce((sum, s) => sum + (s.generalAverage || 0), 0) / students.length
                )
              : 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search Students
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, LRN, or Section"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* School Year */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              School Year
            </label>
            <select
              aria-label="Select school year"
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              {getSchoolYearOptions(5).map(sy => (
                <option key={sy} value={sy}>{sy}</option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Grade Level
            </label>
            <select
              aria-label="Select grade level"
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Grades</option>
              <option value={0}>Kinder</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<div className="w-16 h-16"><ClipboardDocumentListIcon /></div>}
          title="No Records Found"
          message={searchQuery ? `No students found matching "${searchQuery}"` : `No Form 137 records found for school year ${selectedSchoolYear}`}
          action={{
            label: 'Create First Record',
            onClick: handleCreateRecord
          }}
        />
      ) : (
        <>
          <SectionHeader 
            title="Student Records"
            subtitle={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => (
              <div
                key={student.studentId}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer group"
                onClick={() => handleViewRecord(student.studentId)}
              >
                {/* Student Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {student.studentName}
                    </h3>
                    {student.lrn && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        LRN: {student.lrn}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <AcademicCapIcon />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Grade Level:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {student.gradeLevel === 0 ? 'Kinder' : `Grade ${student.gradeLevel}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Section:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {student.section}
                    </span>
                  </div>
                  {student.generalAverage && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Gen. Average:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {student.generalAverage}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Badge 
                      label={`${student.recordCount} record${student.recordCount !== 1 ? 's' : ''}`}
                      color="gray"
                      size="sm"
                    />
                    {student.promotionStatus && (
                      <Badge 
                        label={student.promotionStatus}
                        color={
                          student.promotionStatus === 'PROMOTED' ? 'green' :
                          student.promotionStatus === 'RETAINED' ? 'red' : 'yellow'
                        }
                        size="sm"
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewRecord(student.studentId);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    aria-label={`View ${student.studentName}'s Form 137 record`}
                  >
                    <EyeIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Form137Dashboard;
