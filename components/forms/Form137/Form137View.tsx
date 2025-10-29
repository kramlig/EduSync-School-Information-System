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
import { useNavigate, useLocation } from 'react-router-dom';
import { AcademicHistory, SchoolYearRecord, QuarterGrade } from '../shared/FormTypes';
import { Form137Service } from '../../../services/formsService';
import { getGradeDescriptor } from '../../../services/gradingFormulas';
import { formatDepEdDate } from '../../../services/dateHelpers';
import {
  FormHeader,
  SectionHeader,
  InfoRow,
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
import { AcademicCapIcon, ChevronLeftIcon } from '../../icons';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [form137Record, setForm137Record] = useState<AcademicHistory | null>(null);
  const [selectedYearData, setSelectedYearData] = useState<SchoolYearRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecord();
  }, [studentId, location.key]); // Reload when route changes

  useEffect(() => {
    // When schoolYear prop changes or record loads, select appropriate year
    if (form137Record && form137Record.schoolYears.length > 0) {
      if (schoolYear) {
        const yearData = form137Record.schoolYears.find(yr => yr.schoolYear === schoolYear);
        setSelectedYearData(yearData || form137Record.schoolYears[form137Record.schoolYears.length - 1]);
      } else {
        // Default to most recent year
        setSelectedYearData(form137Record.schoolYears[form137Record.schoolYears.length - 1]);
      }
    }
  }, [form137Record, schoolYear]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FORM137VIEW LOAD DEBUG ===');
      console.log('Loading record for studentId:', studentId);
      console.log('Timestamp:', new Date().toISOString());

      // Get the ONE cumulative Form 137 record for this student
      const record = await Form137Service.getByStudentId(studentId);
      
      console.log('Record received:', record ? 'Found' : 'Not found');
      if (record) {
        console.log('Record ID:', record.id);
        console.log('School years count:', record.schoolYears?.length);
        console.log('Student name:', record.studentName);
      }
      console.log('==============================');
      
      if (record) {
        setForm137Record(record);
      } else {
        console.warn('No Form 137 record found for student:', studentId);
        setForm137Record(null);
        setSelectedYearData(null);
      }
    } catch (err) {
      console.error('Error loading Form 137 record:', err);
      setError('Failed to load academic record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (form137Record && onPrint) {
      onPrint(form137Record);
    } else {
      window.print();
    }
  };

  const handleEdit = () => {
    if (form137Record && onEdit) {
      onEdit(form137Record);
    }
  };

  // Helper to get grade value (supports both number and QuarterGrade)
  const getGradeValue = (grade: number | QuarterGrade | undefined): number => {
    if (typeof grade === 'number') return grade;
    if (grade && typeof grade === 'object') return grade.finalGrade;
    return 0;
  };

  if (loading) {
    return <FormSkeleton lines={15} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Record"
        message={error}
        onRetry={loadRecord}
      />
    );
  }

  if (!form137Record || form137Record.schoolYears.length === 0) {
    return (
      <EmptyState
        icon={<div className="w-16 h-16"><AcademicCapIcon /></div>}
        title="No Academic Record Found"
        message={`No Form 137 record found for this student.`}
        action={{
          label: 'Create New Record',
          onClick: () => navigate('/forms/137')
        }}
      />
    );
  }

  if (!selectedYearData) {
    return <LoadingSpinner message="Loading year data..." />;
  }

  // Prepare grades table data
  const gradesTableColumns = [
    { header: 'Learning Area', accessor: 'learningAreaName', width: '30%', align: 'left' as const },
    { header: '1st Quarter', accessor: 'q1', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { header: '2nd Quarter', accessor: 'q2', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { header: '3rd Quarter', accessor: 'q3', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { header: '4th Quarter', accessor: 'q4', width: '12%', align: 'center' as const, render: (val: any) => getGradeValue(val) || '-' },
    { 
      header: 'Final Grade', 
      accessor: 'finalGrade', 
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

  const attendanceRate = selectedYearData.daysOfSchool > 0
    ? ((selectedYearData.daysPresent / selectedYearData.daysOfSchool) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button - Only show in view, not in print */}
        <button
          onClick={() => navigate('/forms/137')}
          className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all print:hidden"
        >
          <ChevronLeftIcon />
          Back to Form 137 Dashboard
        </button>

        {/* School Year Selector - Only in view, only when multiple years */}
        {form137Record.schoolYears.length > 1 && (
          <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                📅 School Year:
              </label>
              <select
                aria-label="Select school year"
                value={selectedYearData.schoolYear}
                onChange={(e) => {
                  const yearData = form137Record.schoolYears.find(yr => yr.schoolYear === e.target.value);
                  if (yearData) setSelectedYearData(yearData);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {form137Record.schoolYears.map((yearData) => (
                  <option key={yearData.schoolYear} value={yearData.schoolYear}>
                    {yearData.schoolYear} - Grade {yearData.gradeLevel}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {form137Record.schoolYears.length} year{form137Record.schoolYears.length > 1 ? 's' : ''} recorded
              </span>
            </div>
          </div>
        )}

        {/* Actual Form Content - This is what gets printed */}
        <div id="print-content">
          {/* Form Header */}
          <FormHeader
          formTitle="LEARNER'S PERMANENT ACADEMIC RECORD"
          formCode="DepEd Form 137"
          schoolName={selectedYearData.schoolName}
          schoolId={selectedYearData.schoolId}
          schoolYear={selectedYearData.schoolYear}
          deped={{
            region: 'Region IV-A (CALABARZON)',
            division: 'Division of [Division Name]',
            district: '[District Name]'
          }}
        />

        {/* Premium Student Information Section */}
        <div className="mb-8">
          <SectionHeader 
            title="Student Information"
            icon={<div className="w-6 h-6"><AcademicCapIcon /></div>}
          />
          
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
            {/* Decorative orb */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="LRN" value={form137Record.lrn || 'Not provided'} />
                  <InfoRow label="Name" value={form137Record.studentName} bold />
                  <InfoRow label="Birth Date" value={form137Record.birthDate || 'Not provided'} />
                  <InfoRow label="Birth Place" value={form137Record.birthPlace || 'Not provided'} />
                  {form137Record.sex && <InfoRow label="Sex" value={form137Record.sex} />}
                  {form137Record.age && <InfoRow label="Age" value={form137Record.age.toString()} />}
                  {form137Record.motherTongue && <InfoRow label="Mother Tongue" value={form137Record.motherTongue} />}
                  {form137Record.religion && <InfoRow label="Religion" value={form137Record.religion} />}
                  {form137Record.indigenousPeople && <InfoRow label="Indigenous People" value={form137Record.indigenousPeople} />}
                </div>
              </div>

              {/* Current School Year Info */}
              <div>
                <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Current Enrollment</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="School Year" value={selectedYearData.schoolYear} />
                  <InfoRow label="Grade Level" value={selectedYearData.gradeLevel === 0 ? 'Kinder' : `Grade ${selectedYearData.gradeLevel}`} />
                  <InfoRow label="Section" value={selectedYearData.section} />
                  <InfoRow label="Adviser" value={selectedYearData.adviserName} />
                  {selectedYearData.track && <InfoRow label="Track" value={selectedYearData.track} />}
                  {selectedYearData.strand && <InfoRow label="Strand" value={selectedYearData.strand} />}
                </div>
              </div>

              {/* Family Background */}
              {(form137Record.motherName || form137Record.fatherName || form137Record.guardianName || form137Record.parentGuardian) && (
                <div>
                  <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Family Background</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {form137Record.motherName && <InfoRow label="Mother's Name" value={form137Record.motherName} />}
                    {form137Record.motherOccupation && <InfoRow label="Mother's Occupation" value={form137Record.motherOccupation} />}
                    {form137Record.fatherName && <InfoRow label="Father's Name" value={form137Record.fatherName} />}
                    {form137Record.fatherOccupation && <InfoRow label="Father's Occupation" value={form137Record.fatherOccupation} />}
                    {form137Record.guardianName && <InfoRow label="Guardian's Name" value={form137Record.guardianName} />}
                    {form137Record.guardianRelationship && <InfoRow label="Relationship" value={form137Record.guardianRelationship} />}
                    {form137Record.guardianContactNumber && <InfoRow label="Contact Number" value={form137Record.guardianContactNumber} />}
                    {/* Fallback to legacy field */}
                    {!form137Record.motherName && !form137Record.fatherName && form137Record.parentGuardian && (
                      <InfoRow label="Parent/Guardian" value={form137Record.parentGuardian} />
                    )}
                  </div>
                </div>
              )}

              {/* Address */}
              {(form137Record.completeAddress || form137Record.barangay || form137Record.municipality) && (
                <div>
                  <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Address</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {form137Record.completeAddress && <InfoRow label="Complete Address" value={form137Record.completeAddress} />}
                    {form137Record.barangay && <InfoRow label="Barangay" value={form137Record.barangay} />}
                    {form137Record.municipality && <InfoRow label="Municipality" value={form137Record.municipality} />}
                    {form137Record.province && <InfoRow label="Province" value={form137Record.province} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium Academic Performance Section */}
        <div className="mb-8">
          <SectionHeader 
            title="Academic Performance"
            subtitle={`${selectedYearData.grades.length} learning areas`}
          />

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl">
            {/* Decorative orb */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10">
              <GradeTable
                columns={gradesTableColumns}
                data={selectedYearData.grades}
                stickyHeader
              />
            </div>
          </div>

          {/* Premium Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {/* General Average Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-4 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 -z-10"></div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">General Average</div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                {selectedYearData.generalAverage}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getGradeDescriptor(selectedYearData.generalAverage).label}
              </div>
            </div>

            {/* Promotion Status Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-4 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 -z-10"></div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Promotion Status</div>
              <div className="text-lg font-semibold mt-1">
                <Badge 
                  label={selectedYearData.promotionStatus}
                  color={
                    selectedYearData.promotionStatus === 'Promoted' ? 'green' :
                    selectedYearData.promotionStatus === 'Retained' ? 'red' : 'yellow'
                  }
                />
              </div>
            </div>

            {/* Attendance Rate Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-4 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-600/5 -z-10"></div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Attendance Rate</div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400">
                {attendanceRate}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedYearData.daysPresent} / {selectedYearData.daysOfSchool} days
              </div>
            </div>

            {/* Learning Areas Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-4 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 -z-10"></div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Learning Areas</div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                {selectedYearData.grades.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedYearData.grades.filter(s => s.remarks === 'Passed').length} passed
              </div>
            </div>
          </div>
        </div>

        {/* Premium Attendance Details Section */}
        <div className="mb-8">
          <SectionHeader 
            title="Attendance Record"
            subtitle={`School Year ${selectedYearData.schoolYear}`}
          />

          <div className="grid grid-cols-3 gap-4">
            {/* School Days Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-6 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 -z-10"></div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">📚 School Days</div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                {selectedYearData.daysOfSchool}
              </div>
            </div>

            {/* Days Present Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-6 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 -z-10"></div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✅ Days Present</div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                {selectedYearData.daysPresent}
              </div>
            </div>

            {/* Days Absent Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg p-6 hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-600/10 -z-10"></div>
              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">❌ Days Absent</div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400">
                {selectedYearData.daysOfSchool - selectedYearData.daysPresent}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Core Values Section */}
        {selectedYearData.coreValues && selectedYearData.coreValues.length > 0 && (
          <div className="mb-8">
            <SectionHeader 
              title="Core Values Assessment"
              subtitle="Behavior and character development"
            />

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              {/* Decorative orb */}
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedYearData.coreValues.map((cv, index) => (
                  <div key={index} className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-50/80 to-slate-100/60 dark:from-slate-700/80 dark:to-slate-600/60 backdrop-blur-sm border border-slate-200/40 dark:border-slate-600/40 p-4 hover:scale-105 transition-all duration-200">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {cv.valueName}
                    </div>
                    <Badge 
                      label={cv.rating}
                      color={
                        cv.rating === 'SO' ? 'green' :
                        cv.rating === 'AO' ? 'blue' :
                        cv.rating === 'RO' ? 'yellow' : 'gray'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium Remarks Section */}
        {selectedYearData.remarks && (
          <div className="mb-8">
            <SectionHeader title="Remarks" />
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-900/30 dark:to-yellow-900/20 backdrop-blur-xl border border-amber-200/40 dark:border-amber-700/40 shadow-lg p-6">
              <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 rounded-full blur-3xl -z-10"></div>
              <p className="relative z-10 text-slate-700 dark:text-slate-300 leading-relaxed">{selectedYearData.remarks}</p>
            </div>
          </div>
        )}

        {/* Transfer History Section */}
        {form137Record.transferHistory && form137Record.transferHistory.length > 0 && (
          <div className="mb-8">
            <SectionHeader 
              title="School Transfer History" 
              subtitle={`${form137Record.transferHistory.length} transfer${form137Record.transferHistory.length > 1 ? 's' : ''} recorded`}
            />
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              <div className="space-y-4">
                {form137Record.transferHistory.map((transfer, index) => (
                  <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <InfoRow label="From School" value={transfer.fromSchoolName} />
                      <InfoRow label="To School" value={transfer.toSchoolName} />
                      <InfoRow label="Transfer Date" value={transfer.transferDate} />
                      <InfoRow label="Grade Level" value={`Grade ${transfer.gradeLevel}`} />
                      {transfer.reasonForTransfer && (
                        <InfoRow label="Reason" value={transfer.reasonForTransfer} />
                      )}
                      {transfer.transferCertificateNumber && (
                        <InfoRow label="Certificate No." value={transfer.transferCertificateNumber} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Extracurricular Activities Section */}
        {form137Record.extracurricularActivities && form137Record.extracurricularActivities.length > 0 && (
          <div className="mb-8">
            <SectionHeader 
              title="Extracurricular Activities & Achievements" 
              subtitle={`${form137Record.extracurricularActivities.length} activities recorded`}
            />
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form137Record.extracurricularActivities.map((activity, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/60 dark:from-indigo-900/30 dark:to-purple-900/20 rounded-lg border border-indigo-200/40 dark:border-indigo-700/40">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {activity.activityType === 'Award' ? '🏆' : 
                         activity.activityType === 'Sport' ? '⚽' :
                         activity.activityType === 'Competition' ? '🥇' :
                         activity.activityType === 'Leadership' ? '👔' : '📚'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{activity.activityName}</h4>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                          <div>
                            <Badge label={activity.activityType} color="blue" />
                            <span className="ml-2">{activity.schoolYear}</span>
                          </div>
                          {activity.role && <div>Role: {activity.role}</div>}
                          {activity.award && (
                            <div className="flex items-center gap-2">
                              <Badge label={activity.award} color="yellow" />
                              {activity.achievementLevel && (
                                <Badge label={activity.achievementLevel} color="green" />
                              )}
                            </div>
                          )}
                          {activity.description && (
                            <div className="mt-2 text-xs">{activity.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Health Records Section */}
        {form137Record.healthRecords && form137Record.healthRecords.length > 0 && (
          <div className="mb-8">
            <SectionHeader 
              title="Health Records" 
              subtitle="Medical examinations and health status"
            />
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              <div className="space-y-4">
                {form137Record.healthRecords.map((health, index) => (
                  <div key={index} className="p-4 bg-green-50/80 dark:bg-green-900/20 rounded-lg border border-green-200/40 dark:border-green-700/40">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        🏥 {health.schoolYear}
                      </h4>
                      {health.dateOfExamination && (
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {health.dateOfExamination}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {health.height && <InfoRow label="Height" value={`${health.height} cm`} />}
                      {health.weight && <InfoRow label="Weight" value={`${health.weight} kg`} />}
                      {health.bmi && <InfoRow label="BMI" value={health.bmi.toFixed(1)} />}
                      {health.nutritionalStatus && (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Nutritional Status</div>
                          <Badge 
                            label={health.nutritionalStatus} 
                            color={health.nutritionalStatus === 'Normal' ? 'green' : 'yellow'} 
                          />
                        </div>
                      )}
                      {health.visionScreening && <InfoRow label="Vision" value={health.visionScreening} />}
                      {health.hearingScreening && <InfoRow label="Hearing" value={health.hearingScreening} />}
                      {health.dentalStatus && <InfoRow label="Dental" value={health.dentalStatus} />}
                      {health.immunizationComplete !== undefined && (
                        <InfoRow label="Immunization" value={health.immunizationComplete ? 'Complete' : 'Incomplete'} />
                      )}
                    </div>
                    {health.medicalConditions && (
                      <div className="mt-3 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Medical Conditions: </span>
                        <span className="text-slate-800 dark:text-slate-200">{health.medicalConditions}</span>
                      </div>
                    )}
                    {health.examinedBy && (
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Examined by: {health.examinedBy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Section */}
        {form137Record.eligibility && (
          <div className="mb-8">
            <SectionHeader 
              title="Eligibility for Admission" 
              subtitle="Academic qualifications and eligibility"
            />
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              <div className="space-y-4">
                {/* Elementary Completion */}
                {(form137Record.eligibility.eligibleForJuniorHigh || form137Record.eligibility.elementaryCompletionCertificate) && (
                  <div className="p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border border-blue-200/40 dark:border-blue-700/40">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      🎓 Elementary Completion
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {form137Record.eligibility.eligibleForJuniorHigh !== undefined && (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Eligible for Junior High</div>
                          <Badge 
                            label={form137Record.eligibility.eligibleForJuniorHigh ? 'Yes' : 'No'} 
                            color={form137Record.eligibility.eligibleForJuniorHigh ? 'green' : 'red'} 
                          />
                        </div>
                      )}
                      {form137Record.eligibility.elementaryCompletionCertificate && (
                        <InfoRow label="Certificate No." value={form137Record.eligibility.elementaryCompletionCertificate} />
                      )}
                      {form137Record.eligibility.elementaryCompletionDate && (
                        <InfoRow label="Completion Date" value={form137Record.eligibility.elementaryCompletionDate} />
                      )}
                    </div>
                  </div>
                )}

                {/* Junior High Completion */}
                {(form137Record.eligibility.eligibleForSeniorHigh || form137Record.eligibility.juniorHighCompletionCertificate) && (
                  <div className="p-4 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-lg border border-indigo-200/40 dark:border-indigo-700/40">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
                      🎓 Junior High School Completion
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {form137Record.eligibility.eligibleForSeniorHigh !== undefined && (
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Eligible for Senior High</div>
                          <Badge 
                            label={form137Record.eligibility.eligibleForSeniorHigh ? 'Yes' : 'No'} 
                            color={form137Record.eligibility.eligibleForSeniorHigh ? 'green' : 'red'} 
                          />
                        </div>
                      )}
                      {form137Record.eligibility.juniorHighCompletionCertificate && (
                        <InfoRow label="Certificate No." value={form137Record.eligibility.juniorHighCompletionCertificate} />
                      )}
                      {form137Record.eligibility.juniorHighCompletionDate && (
                        <InfoRow label="Completion Date" value={form137Record.eligibility.juniorHighCompletionDate} />
                      )}
                    </div>
                  </div>
                )}

                {/* Honors & Special Programs */}
                {(form137Record.eligibility.honorsEligibility || form137Record.eligibility.specialProgramEligibility) && (
                  <div className="p-4 bg-yellow-50/80 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/40 dark:border-yellow-700/40">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
                      🌟 Honors & Special Programs
                    </h4>
                    <div className="space-y-2 text-sm">
                      {form137Record.eligibility.honorsEligibility && (
                        <div>
                          <Badge label={form137Record.eligibility.honorsEligibility} color="yellow" />
                        </div>
                      )}
                      {form137Record.eligibility.specialProgramEligibility && form137Record.eligibility.specialProgramEligibility.length > 0 && (
                        <div>
                          <div className="text-slate-600 dark:text-slate-400 mb-1">Special Program Eligibility:</div>
                          <div className="flex flex-wrap gap-2">
                            {form137Record.eligibility.specialProgramEligibility.map((program, idx) => (
                              <Badge key={idx} label={program} color="indigo" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Certification Section */}
        {form137Record.certification && (
          <div className="mb-8">
            <SectionHeader 
              title="Certification" 
              subtitle="Official school certification and verification"
            />
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              <div className="text-center space-y-6">
                {/* Certification Text */}
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {form137Record.certification.certificationText || (
                    <>
                      <p className="mb-4">
                        I CERTIFY that this is a true record of <strong>{form137Record.studentName}</strong> with LRN <strong>{form137Record.lrn || 'N/A'}</strong> 
                        {' '}enrolled in this school as shown in Form 138 (Report Card).
                      </p>
                    </>
                  )}
                </div>

                {/* Signatures Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  {/* Principal Signature */}
                  <div className="text-center">
                    {form137Record.certification.certifiedBySignature && (
                      <div className="mb-2">
                        <img 
                          src={form137Record.certification.certifiedBySignature} 
                          alt="Principal Signature" 
                          className="h-16 mx-auto"
                        />
                      </div>
                    )}
                    <div className="border-t-2 border-slate-400 dark:border-slate-600 pt-2 mx-8">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {form137Record.certification.certifiedBy || '_______________________'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {form137Record.certification.certifiedByPosition || 'School Principal'}
                      </div>
                      {form137Record.certification.certificationDate && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Date: {form137Record.certification.certificationDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registrar Signature */}
                  <div className="text-center">
                    {form137Record.certification.registrarSignature && (
                      <div className="mb-2">
                        <img 
                          src={form137Record.certification.registrarSignature} 
                          alt="Registrar Signature" 
                          className="h-16 mx-auto"
                        />
                      </div>
                    )}
                    <div className="border-t-2 border-slate-400 dark:border-slate-600 pt-2 mx-8">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {form137Record.certification.registrarName || '_______________________'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        School Registrar
                      </div>
                      {form137Record.certification.registrarDate && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Date: {form137Record.certification.registrarDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* School Seal */}
                {form137Record.certification.schoolSealImage && (
                  <div className="flex justify-center mt-6">
                    <img 
                      src={form137Record.certification.schoolSealImage} 
                      alt="School Seal" 
                      className="h-24 opacity-80"
                    />
                  </div>
                )}

                {/* Document Reference Number & QR Code */}
                {(form137Record.documentReferenceNumber || form137Record.qrCodeData) && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-center gap-6">
                      {form137Record.documentReferenceNumber && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Document Reference No.</div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white">
                            {form137Record.documentReferenceNumber}
                          </div>
                        </div>
                      )}
                      {form137Record.qrCodeData && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Scan to Verify</div>
                          <img 
                            src={form137Record.qrCodeData} 
                            alt="QR Code" 
                            className="h-20 w-20 mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Amendment History Section */}
        {form137Record.amendments && form137Record.amendments.length > 0 && (
          <div className="mb-8">
            <SectionHeader 
              title="Amendment History" 
              subtitle={`${form137Record.amendments.length} amendment${form137Record.amendments.length > 1 ? 's' : ''} recorded`}
            />
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-6">
              <div className="space-y-3">
                {form137Record.amendments.map((amendment, index) => (
                  <div key={index} className="p-4 bg-orange-50/80 dark:bg-orange-900/20 rounded-lg border border-orange-200/40 dark:border-orange-700/40">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-orange-900 dark:text-orange-100">
                        {amendment.fieldAmended}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">
                        {amendment.amendmentDate}
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex gap-2">
                        <span className="text-slate-500 dark:text-slate-400">From:</span>
                        <span className="text-red-600 dark:text-red-400 line-through">{amendment.oldValue}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-500 dark:text-slate-400">To:</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">{amendment.newValue}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Reason:</span>
                        <span className="text-slate-700 dark:text-slate-300">{amendment.reasonForAmendment}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span>Amended by: {amendment.amendedBy}</span>
                        {amendment.approvedBy && (
                          <span>• Approved by: {amendment.approvedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium Record Metadata */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-100/80 to-slate-50/60 dark:from-slate-800/80 dark:to-slate-700/60 backdrop-blur-xl border border-slate-200/40 dark:border-slate-600/40 shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">📅 Created:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDepEdDate((form137Record.createdAt as any)?.toDate?.() || new Date())} by {form137Record.createdBy}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">🔄 Last Updated:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDepEdDate((form137Record.updatedAt as any)?.toDate?.() || new Date())} by {form137Record.updatedBy}
              </span>
            </div>
          </div>
        </div>

        {/* Premium Actions */}
        <FormActions
          onPrint={handlePrint}
          onExport={onEdit ? handleEdit : undefined}
          exportLabel="Edit Record"
          printLabel="Print Form 137"
        />
        </div>
      </div>
    </div>
  );
};

export default Form137View;
