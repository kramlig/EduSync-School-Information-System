/**
 * Form 137 - Permanent Record Viewer
 * 
 * Displays a student's complete academic history including:
 * - Student information
 * - Quarterly grades for all subjects
 * - General average
 * - Attendance record
 * - Core values assessment
 * - Promotion status
 */

import React, { useState, useEffect } from 'react';
import { AcademicHistory, SubjectGrade, QuarterGrade } from '../shared/FormTypes';
import { Form137Service } from '../../../services/formsService';
import { getGradeDescriptor } from '../../../services/gradingFormulas';
import { formatDepEdDate, getCurrentSchoolYear } from '../../../services/dateHelpers';
import {
  FormHeader,
  SectionHeader,
  InfoRow,
  StudentInfoCard,
  GradeTable,
  FormActions,
  Badge,
  EmptyState
} from '../shared/FormComponents';
import {
  FormSkeleton,
  LoadingSpinner,
  ErrorState
} from '../shared/LoadingStates';
import { AcademicCapIcon, PrinterIcon, PencilIcon } from '../../icons';

interface Form137ViewProps {
  studentId: string;
  schoolYear?: string;
  onEdit?: (record: AcademicHistory) => void;
  onPrint?: (record: AcademicHistory) => void;
}

export const Form137View: React.FC<Form137ViewProps> = ({
  studentId,
  schoolYear,
  onEdit,
  onPrint
}) => {
  const [records, setRecords] = useState<AcademicHistory[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AcademicHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [studentId, schoolYear]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const allRecords = await Form137Service.getByStudentId(studentId);
      
      // Filter by school year if provided
      const filtered = schoolYear
        ? allRecords.filter(r => r.schoolYear === schoolYear)
        : allRecords;

      setRecords(filtered);
      
      // Select most recent record by default
      if (filtered.length > 0) {
        setSelectedRecord(filtered[0]);
      }
    } catch (err) {
      console.error('Error loading Form 137 records:', err);
      setError('Failed to load academic records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (selectedRecord && onPrint) {
      onPrint(selectedRecord);
    } else {
      window.print();
    }
  };

  const handleEdit = () => {
    if (selectedRecord && onEdit) {
      onEdit(selectedRecord);
    }
  };

  // Helper to get grade value (supports both number and QuarterGrade)
  const getGradeValue = (grade: number | QuarterGrade | undefined): number => {
    if (typeof grade === 'number') return grade;
    if (grade && typeof grade === 'object') return grade.finalGrade;
    return 0;
  };

  // Helper to check if grade has detailed breakdown
  const hasDetailedGrade = (grade: number | QuarterGrade | undefined): boolean => {
    return grade !== undefined && typeof grade === 'object' && 'ww' in grade;
  };

  if (loading) {
    return <FormSkeleton lines={15} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Records"
        message={error}
        onRetry={loadRecords}
      />
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={<div className="w-16 h-16"><AcademicCapIcon /></div>}
        title="No Academic Records Found"
        message={`No Form 137 records found for this student${schoolYear ? ` in school year ${schoolYear}` : ''}.`}
        action={
          onEdit
            ? {
                label: 'Create New Record',
                onClick: () => onEdit({} as AcademicHistory)
              }
            : undefined
        }
      />
    );
  }

  if (!selectedRecord) {
    return <LoadingSpinner message="Loading record..." />;
  }

  // Prepare grades table data
  const gradesTableColumns = [
    { header: 'Learning Area', accessor: 'learningAreaName', width: '30%', align: 'left' as const },
    { header: '1st Quarter', accessor: 'q1', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { header: '2nd Quarter', accessor: 'q2', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { header: '3rd Quarter', accessor: 'q3', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { header: '4th Quarter', accessor: 'q4', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { 
      header: 'Final Rating', 
      accessor: 'finalRating', 
      width: '12%', 
      align: 'center' as const,
      render: (val: number) => (
        <span className="font-semibold">{val}</span>
      )
    },
    { 
      header: 'Remarks', 
      accessor: 'remarks', 
      width: '10%', 
      align: 'center' as const,
      render: (val: string) => (
        <Badge 
          label={val} 
          color={val === 'Passed' ? 'green' : 'red'}
          size="sm"
        />
      )
    }
  ];

  const attendanceRate = selectedRecord.daysOfSchool > 0
    ? ((selectedRecord.daysPresent / selectedRecord.daysOfSchool) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
      {/* School Year Selector */}
      {records.length > 1 && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            School Year:
          </label>
          <select
            aria-label="Select school year"
            value={selectedRecord.schoolYear}
            onChange={(e) => {
              const record = records.find(r => r.schoolYear === e.target.value);
              if (record) setSelectedRecord(record);
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            {records.map((record) => (
              <option key={record.id} value={record.schoolYear}>
                {record.schoolYear}
              </option>
            ))}
          </select>
          <Badge 
            label={`${records.length} record${records.length > 1 ? 's' : ''}`}
            color="indigo"
          />
        </div>
      )}

      {/* Form Header */}
      <FormHeader
        formTitle="LEARNER'S PERMANENT ACADEMIC RECORD"
        formCode="DepEd Form 137"
        schoolName={selectedRecord.schoolName}
        schoolId={selectedRecord.schoolId}
        schoolYear={selectedRecord.schoolYear}
        deped={{
          region: 'Region IV-A (CALABARZON)',
          division: 'Division of [Division Name]',
          district: '[District Name]'
        }}
      />

      {/* Student Information */}
      <SectionHeader 
        title="Student Information"
        icon={<div className="w-6 h-6"><AcademicCapIcon /></div>}
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <InfoRow label="LRN" value={selectedRecord.lrn || 'Not provided'} />
        <InfoRow label="Name" value={selectedRecord.studentName} bold />
        <InfoRow label="Birth Date" value={selectedRecord.birthDate || 'Not provided'} />
        <InfoRow label="Birth Place" value={selectedRecord.birthPlace || 'Not provided'} />
        <InfoRow label="Parent/Guardian" value={selectedRecord.parentGuardian || 'Not provided'} />
        <InfoRow label="Section" value={selectedRecord.section} />
        <InfoRow label="Grade Level" value={selectedRecord.gradeLevel === 0 ? 'Kinder' : `Grade ${selectedRecord.gradeLevel}`} />
        <InfoRow label="Adviser" value={selectedRecord.adviserName} />
      </div>

      {/* Academic Performance */}
      <SectionHeader 
        title="Academic Performance"
        subtitle={`${selectedRecord.subjects.length} learning areas`}
      />

      <GradeTable
        columns={gradesTableColumns}
        data={selectedRecord.subjects}
        stickyHeader
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-400">General Average</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {selectedRecord.generalAverage}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {getGradeDescriptor(selectedRecord.generalAverage).label}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Promotion Status</div>
          <div className="text-lg font-semibold mt-1">
            <Badge 
              label={selectedRecord.promotionStatus}
              color={
                selectedRecord.promotionStatus === 'PROMOTED' ? 'green' :
                selectedRecord.promotionStatus === 'RETAINED' ? 'red' : 'yellow'
              }
            />
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Attendance Rate</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {attendanceRate}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedRecord.daysPresent} / {selectedRecord.daysOfSchool} days
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Learning Areas</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {selectedRecord.subjects.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedRecord.subjects.filter(s => s.remarks === 'Passed').length} passed
          </div>
        </div>
      </div>

      {/* Attendance Details */}
      <SectionHeader 
        title="Attendance Record"
        subtitle={`School Year ${selectedRecord.schoolYear}`}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">School Days</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {selectedRecord.daysOfSchool}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">Days Present</div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-300">
            {selectedRecord.daysPresent}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-sm text-red-600 dark:text-red-400 mb-1">Days Absent</div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-300">
            {selectedRecord.daysOfSchool - selectedRecord.daysPresent}
          </div>
        </div>
      </div>

      {/* Core Values */}
      {selectedRecord.coreValues && (
        <>
          <SectionHeader 
            title="Core Values Assessment"
            subtitle="Behavior and character development"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(selectedRecord.coreValues.observedValues || {}).map(([value, rating]) => (
              <div key={value} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {value}
                </div>
                <Badge 
                  label={rating}
                  color={
                    rating === 'SO' ? 'green' :
                    rating === 'AO' ? 'blue' :
                    rating === 'RO' ? 'yellow' : 'gray'
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Remarks */}
      {selectedRecord.remarks && (
        <>
          <SectionHeader title="Remarks" />
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-slate-700 dark:text-slate-300">{selectedRecord.remarks}</p>
          </div>
        </>
      )}

      {/* Record Metadata */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-8">
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-semibold">Created:</span> {formatDepEdDate(new Date(selectedRecord.createdAt))} by {selectedRecord.createdBy}
          </div>
          <div>
            <span className="font-semibold">Last Updated:</span> {formatDepEdDate(new Date(selectedRecord.updatedAt))} by {selectedRecord.updatedBy}
          </div>
        </div>
      </div>

      {/* Actions */}
      <FormActions
        onPrint={handlePrint}
        onExport={onEdit ? handleEdit : undefined}
        exportLabel="Edit Record"
        printLabel="Print Form 137"
      />
    </div>
  );
};

export default Form137View;
