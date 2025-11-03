/**
 * Form138DownloadButtonV2 - Official Format Version
 * 
 * Uses the same PrintableReport component as admin/teacher views
 * to ensure consistent DepEd-compliant formatting
 */

import React, { useState } from 'react';
import PrintableReport from './PrintableReport';
import { generateForm138PDFFromComponent, previewForm138Data } from '../src/services/form138GeneratorV2';
import type { Student } from '../types';
import type { SchoolDataHook } from '../hooks/useSchoolData';

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
      
      await generateForm138PDFFromComponent(student, schoolData);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewData = showPreview ? previewForm138Data(student, schoolData) : null;

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
          schoolData={schoolData}
          hideDownloadButton={true}
          studentIndex={0}
        />
      </div>
    </div>
  );
};

export default Form138DownloadButtonV2;
