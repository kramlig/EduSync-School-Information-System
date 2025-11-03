/**
 * Form138DownloadButton - Component for downloading student report cards
 * 
 * Provides quarter selection and initiates PDF download using form138Generator
 */

import React, { useState, useMemo } from 'react';
import { generateForm138PDF, previewForm138Data } from '../src/services/form138Generator';
import type { Student, Section, Grade, AttendanceRecord, CoreValueGrade, CoreValue, LearningArea, SchoolSettings } from '../types';

interface Form138DownloadButtonProps {
  student: Student;
  sections: Section[];
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  coreValueGrades: CoreValueGrade[];
  coreValues: CoreValue[];
  learningAreas: LearningArea[];
  settings: SchoolSettings;
}

const Form138DownloadButton: React.FC<Form138DownloadButtonProps> = ({
  student,
  sections,
  grades,
  attendanceRecords,
  coreValueGrades,
  coreValues,
  learningAreas,
  settings
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Final'>('Q1');
  const [showPreview, setShowPreview] = useState(false);

  // Find student's section
  const section = useMemo(() => {
    return sections.find(s => s.id === student.sectionId) || null;
  }, [sections, student.sectionId]);

  // Get student's attendance record
  const studentAttendance = useMemo(() => {
    return attendanceRecords.find(a => a.studentId === student.id) || null;
  }, [attendanceRecords, student.id]);

  // Filter grades for this student
  const studentGrades = useMemo(() => {
    return grades.filter(g => g.studentId === student.id);
  }, [grades, student.id]);

  // Filter core value grades for this student
  const studentCoreValueGrades = useMemo(() => {
    return coreValueGrades.filter(cvg => cvg.studentId === student.id);
  }, [coreValueGrades, student.id]);

  // Preview data
  const previewData = useMemo(() => {
    if (!showPreview) return null;
    
    return previewForm138Data({
      student,
      section,
      grades: studentGrades,
      attendance: studentAttendance,
      coreValueGrades: studentCoreValueGrades,
      coreValues,
      learningAreas,
      settings,
      quarter: selectedQuarter
    });
  }, [showPreview, student, section, studentGrades, studentAttendance, studentCoreValueGrades, coreValues, learningAreas, settings, selectedQuarter]);

  const handleDownload = () => {
    generateForm138PDF({
      student,
      section,
      grades: studentGrades,
      attendance: studentAttendance,
      coreValueGrades: studentCoreValueGrades,
      coreValues,
      learningAreas,
      settings,
      quarter: selectedQuarter
    });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
        📄 Download Report Card (Form 138)
      </h3>
      
      <div className="space-y-4">
        {/* Quarter Selection */}
        <div>
          <label htmlFor="quarter-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select Grading Period
          </label>
          <select
            id="quarter-select"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Q1">1st Quarter</option>
            <option value="Q2">2nd Quarter</option>
            <option value="Q3">3rd Quarter</option>
            <option value="Q4">4th Quarter</option>
            <option value="Final">Final Grades (Whole Year)</option>
          </select>
        </div>

        {/* Preview Section */}
        {showPreview && previewData && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-white">Preview</h4>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Student:</strong> {previewData.studentInfo.name}</p>
              <p><strong>LRN:</strong> {previewData.studentInfo.lrn}</p>
              <p><strong>Grade Level:</strong> {previewData.studentInfo.gradeLevel}</p>
              <p><strong>Section:</strong> {previewData.studentInfo.section}</p>
              <p><strong>Subjects with Grades:</strong> {previewData.gradesCount}</p>
              <p><strong>General Average:</strong> {previewData.average}</p>
              <p><strong>Attendance Rate:</strong> {previewData.attendanceData.percentage.toFixed(1)}%</p>
              <p><strong>Core Values:</strong> {previewData.coreValuesCount}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            👁️ Preview
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            📥 Download PDF
          </button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          💡 The PDF will be automatically generated and downloaded to your device. 
          This is an official DepEd Form 138 Report Card.
        </p>
      </div>
    </div>
  );
};

export default Form138DownloadButton;
