/**
 * Form138DownloadButtonV2 - Official Format Version
 * 
 * Uses the same PrintableReport component as admin/teacher views
 * to ensure consistent DepEd-compliant formatting.
 * 
 * Updated to fetch data from PostgreSQL directly for parent portal.
 */

import React, { useState, useMemo } from 'react';
import PrintableReport from './PrintableReport';
import { generateForm138PDFFromComponent } from '../src/services/form138GeneratorV2';
import type { Student } from '../types';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import { useGradesPostgreSQL } from '../src/hooks/useGradesPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useAttendancePostgreSQL } from '../src/hooks/useAttendancePostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import { useCoreValuesPostgreSQL } from '../src/hooks/useCoreValuesPostgreSQL';

interface Form138DownloadButtonV2Props {
  student: Student;
  schoolData: SchoolDataHook;
}

const Form138DownloadButtonV2: React.FC<Form138DownloadButtonV2Props> = ({
  student,
  schoolData
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data from PostgreSQL for accurate preview
  const schoolId = student.schoolId || '';
  const { grades: pgGrades } = useGradesPostgreSQL({ studentId: student.id, schoolId });
  const { sections: pgSections } = useSectionsPostgreSQL({ schoolId });
  const { attendanceRecords: pgAttendance } = useAttendancePostgreSQL({ schoolId });
  const { learningAreas: pgLearningAreas } = useLearningAreasPostgreSQL();
  const { coreValues: pgCoreValues } = useCoreValuesPostgreSQL(true, schoolId);

  // Calculate preview data from PostgreSQL
  const previewData = useMemo(() => {
    if (!showPreview) return null;
    
    const section = (pgSections || []).find(s => s.id === student.sectionId);
    const studentGrades = pgGrades || [];
    
    // Filter learning areas by student's grade level
    const gradeLevel = section?.gradeLevel;
    const studentGradeIds = new Set(studentGrades.map(g => g.learningAreaId));
    
    const relevantLearningAreas = (pgLearningAreas || []).filter(la => {
      if (!studentGradeIds.has(la.id)) return false;
      if (gradeLevel) {
        if (Array.isArray(la.gradeLevel)) {
          return la.gradeLevel.includes(gradeLevel as number);
        }
        return la.gradeLevel === gradeLevel;
      }
      return true;
    });
    
    // Calculate average
    const finalGrades = studentGrades
      .map(g => g.finalGrade)
      .filter((g): g is number => typeof g === 'number' && g > 0);
    
    const average = finalGrades.length > 0
      ? (finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length).toFixed(2)
      : 'N/A';
    
    // Get attendance data
    const studentAttendanceRecords = (pgAttendance || []).filter(r => r.studentId === student.id);
    let attendanceData = { present: 0, absent: 0, total: 0, percentage: 0 };
    
    if (studentAttendanceRecords.length > 0) {
      const present = studentAttendanceRecords.filter((r: any) => 
        r.status === 'present' || r.status === 'late' || r.dailyStatus === 'present' || r.dailyStatus === 'late'
      ).length;
      const absent = studentAttendanceRecords.filter((r: any) => 
        r.status === 'absent' || r.dailyStatus === 'absent'
      ).length;
      const total = present + absent;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      
      attendanceData = { present, absent, total, percentage };
    }
    
    return {
      studentInfo: {
        name: student.name,
        lrn: student.lrn || 'N/A',
        gradeLevel: section?.gradeLevel || 'N/A',
        section: section?.name || 'N/A',
      },
      gradesCount: relevantLearningAreas.length,
      attendanceData,
      coreValuesCount: (pgCoreValues || []).length,
      average,
    };
  }, [showPreview, student, pgGrades, pgSections, pgAttendance, pgLearningAreas, pgCoreValues]);

  // Create enriched schoolData with PostgreSQL data for PDF generation
  const enrichedSchoolData = useMemo(() => ({
    ...schoolData,
    grades: pgGrades || [],
    sections: pgSections || [],
    attendanceRecords: pgAttendance || [],
    learningAreas: pgLearningAreas || [],
    coreValues: pgCoreValues || [],
  }), [schoolData, pgGrades, pgSections, pgAttendance, pgLearningAreas, pgCoreValues]);

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Wait a bit for the component to render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if elements exist
      const page1 = document.getElementById(`page-1-${student.id}`);
      const page2 = document.getElementById(`page-2-${student.id}`);
      
      if (!page1 || !page2) {
        throw new Error(`Form elements not found. Page 1: ${!!page1}, Page 2: ${!!page2}`);
      }
      
      await generateForm138PDFFromComponent(student, enrichedSchoolData as SchoolDataHook);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      {/* Header Card */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📄</span>
          Download Report Card (Form 138)
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Generate official DepEd Form 138 Report Card for {student.name}
        </p>

        {/* Preview Section */}
        {previewData && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4 space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Preview Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div><strong>Name:</strong> {previewData.studentInfo.name}</div>
              <div><strong>LRN:</strong> {previewData.studentInfo.lrn}</div>
              <div><strong>Grade:</strong> {previewData.studentInfo.gradeLevel}</div>
              <div><strong>Section:</strong> {previewData.studentInfo.section}</div>
              <div><strong>Subjects:</strong> {previewData.gradesCount}</div>
              <div><strong>Average:</strong> {previewData.average}</div>
              <div><strong>Attendance:</strong> {previewData.attendanceData.percentage.toFixed(1)}%</div>
              <div><strong>Days Present:</strong> {previewData.attendanceData.present}/{previewData.attendanceData.total}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>👁️</span>
            <span>{showPreview ? 'Hide' : 'Preview'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-4">
          💡 This uses the official DepEd Form 138 format with complete grades, attendance, and core values.
        </p>
      </div>

      {/* Hidden PrintableReport Component - Rendered for PDF Generation */}
      {/* Use opacity-0 and absolute positioning instead of display:none so it renders but is invisible */}
      <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none">
        <PrintableReport
          student={student}
          schoolData={enrichedSchoolData as SchoolDataHook}
          hideDownloadButton={true}
          studentIndex={0}
        />
      </div>
    </div>
  );
};

export default Form138DownloadButtonV2;
