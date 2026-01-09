/**
 * DivisionSF5Import - SF5 (Promotion Report) Import Module
 * 
 * Division-level interface for importing promotion/proficiency data from
 * DepEd LIS SF5 CSV exports. Matches students by LRN or name and creates
 * promotion records.
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * @see docs/features/SF1_IMPORT_MODULE.md (similar architecture)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { parseSF5, type SF5ParseResult, PROMOTION_STATUS_LABELS, GRADING_PERIOD_LABELS } from '../../services/sf5Parser';
import { 
  previewSF5Import, 
  importSF5, 
  type SF5ImportResult,
  type SF5ImportOptions 
} from '../../services/sf5ImportService';
import type { GradingPeriod } from '../../types/promotionRecords';

// ============================================================================
// TYPES
// ============================================================================

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  file: File | null;
  parseResult: SF5ParseResult | null;
  preview: Awaited<ReturnType<typeof previewSF5Import>> | null;
  importResult: SF5ImportResult | null;
  error: string | null;
}

// ============================================================================
// ICONS
// ============================================================================

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const DocumentIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const SchoolIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

const ChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const AcademicCapIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DivisionSF5Import: React.FC = () => {
  const { division, hasPermission, schoolYear } = useDivisionContext();
  
  // State
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    parseResult: null,
    preview: null,
    importResult: null,
    error: null
  });

  const [options, setOptions] = useState<SF5ImportOptions>({
    divisionId: division?.id,
    schoolYear: schoolYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    gradingPeriod: 'final',
    createSchoolIfMissing: false,
    createSectionIfMissing: false,
    skipExistingRecords: true,
    updateExistingRecords: false,
    matchByLRN: true,
    matchByName: true
  });

  const [isDragging, setIsDragging] = useState(false);

  // Check permissions - Memoize to prevent infinite loops
  const canImport = useMemo(() => {
    return hasPermission('reports', 'write') || hasPermission('schools', 'write');
  }, [hasPermission]);

  // Promotion statistics from parse result
  const promotionStats = useMemo(() => {
    if (!state.parseResult?.students) return null;
    
    const stats = {
      promoted: 0,
      retained: 0,
      pending: 0,
      graduated: 0,
      transferred: 0
    };
    
    for (const student of state.parseResult.students) {
      if (student.promotionStatus in stats) {
        stats[student.promotionStatus as keyof typeof stats]++;
      }
    }
    
    return stats;
  }, [state.parseResult?.students]);

  // ========================================================================
  // FILE HANDLING
  // ========================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, error: null }));

    if (!file.name.endsWith('.csv')) {
      setState(prev => ({ ...prev, error: 'Please select a CSV file' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
      return;
    }

    try {
      const content = await file.text();
      const parseResult = parseSF5(content);
      
      if (!parseResult.success) {
        setState(prev => ({
          ...prev,
          error: `Parse error: ${parseResult.errors.join(', ')}`
        }));
        return;
      }

      const preview = await previewSF5Import(parseResult, options);

      setState(prev => ({
        ...prev,
        step: 'preview',
        file,
        parseResult,
        preview,
        error: null
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Failed to read file: ${error.message}`
      }));
    }
  }, [options]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ========================================================================
  // IMPORT HANDLING
  // ========================================================================

  const handleImport = useCallback(async () => {
    if (!state.parseResult) return;

    setState(prev => ({ ...prev, step: 'importing', error: null }));

    try {
      const result = await importSF5(state.parseResult, {
        ...options,
        divisionId: division?.id
      });

      setState(prev => ({
        ...prev,
        step: 'complete',
        importResult: result,
        error: result.success ? null : result.errors.join(', ')
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        step: 'preview',
        error: `Import failed: ${error.message}`
      }));
    }
  }, [state.parseResult, options, division?.id]);

  const handleReset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      parseResult: null,
      preview: null,
      importResult: null,
      error: null
    });
  }, []);

  // Refresh preview when options change
  const refreshPreview = useCallback(async () => {
    if (!state.parseResult) return;
    
    const preview = await previewSF5Import(state.parseResult, options);
    setState(prev => ({ ...prev, preview }));
  }, [state.parseResult, options]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <UploadIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Upload SF5 CSV File
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Drag and drop your DepEd LIS SF5 (Promotion Report) export file here, or click to browse
        </p>
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
          <DocumentIcon className="w-5 h-5 mr-2" />
          Select File
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          Supports CSV files up to 10MB from DepEd LIS SF5 export
        </p>
      </div>

      {/* Import Settings */}
      <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Import Settings</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
              School Year
            </label>
            <input
              type="text"
              value={options.schoolYear}
              onChange={(e) => setOptions(prev => ({ ...prev, schoolYear: e.target.value }))}
              placeholder="2024-2025"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
              Grading Period
            </label>
            <select
              value={options.gradingPeriod}
              onChange={(e) => setOptions(prev => ({ ...prev, gradingPeriod: e.target.value as GradingPeriod }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              {Object.entries(GRADING_PERIOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const { parseResult, preview } = state;
    if (!parseResult?.metadata || !preview) return null;

    const metadata = parseResult.metadata;

    return (
      <div className="space-y-6">
        {/* File Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  {state.file?.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {((state.file?.size || 0) / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Change file
            </button>
          </div>
        </div>

        {/* Metadata Preview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* School Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center space-x-2 mb-4">
              <SchoolIcon className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">School Information</h4>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">School ID:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.schoolId || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Name:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.schoolName || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Grade Level:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.gradeLevelRaw || `Grade ${metadata.gradeLevel}`}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Section:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.sectionName || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Status:</dt>
                <dd>
                  {preview.schoolStatus === 'exists' || preview.schoolStatus === 'provided' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                      Exists
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                      <XCircleIcon className="w-3.5 h-3.5 mr-1" />
                      Not Found
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Import Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center space-x-2 mb-4">
              <ChartBarIcon className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">Import Summary</h4>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Total in File:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{parseResult.totalCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Students Matched:</dt>
                <dd className="font-medium text-green-600 dark:text-green-400">{preview.studentsMatched}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Students Not Found:</dt>
                <dd className="font-medium text-amber-600 dark:text-amber-400">{preview.studentsNotFound}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Existing Records:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{preview.existingRecords}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400 font-medium">Records to Import:</dt>
                <dd className="font-bold text-blue-600 dark:text-blue-400">{preview.recordsToImport}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Promotion Statistics */}
        {promotionStats && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center space-x-2 mb-4">
              <AcademicCapIcon className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">Promotion Status Summary</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {promotionStats.promoted}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Promoted</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {promotionStats.retained}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Retained</div>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {promotionStats.pending}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Pending</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {promotionStats.graduated}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Graduated</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {promotionStats.transferred}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Transferred</div>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {(preview.studentsNotFound > 0 || preview.invalidStudents.length > 0) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  Some records cannot be imported
                </h4>
                <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {preview.studentsNotFound > 0 && (
                    <li>• {preview.studentsNotFound} student(s) not found in database (must import SF1 first)</li>
                  )}
                  {preview.invalidStudents.length > 0 && (
                    <li>• {preview.invalidStudents.length} student(s) with invalid data</li>
                  )}
                  {preview.existingRecords > 0 && options.skipExistingRecords && (
                    <li>• {preview.existingRecords} student(s) already have records for this period</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* School Not Found Error */}
        {preview.schoolStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  School Not Found
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  The school in this SF5 file ({metadata.schoolName}) was not found in the database. 
                  Please import the school via SF1 or SF7 first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Import Options */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Import Options</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                School Year
              </label>
              <input
                type="text"
                value={options.schoolYear}
                onChange={(e) => {
                  setOptions(prev => ({ ...prev, schoolYear: e.target.value }));
                }}
                onBlur={refreshPreview}
                placeholder="2024-2025"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Grading Period
              </label>
              <select
                value={options.gradingPeriod}
                onChange={(e) => {
                  setOptions(prev => ({ ...prev, gradingPeriod: e.target.value as GradingPeriod }));
                  setTimeout(refreshPreview, 100);
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {Object.entries(GRADING_PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.matchByLRN}
                onChange={(e) => setOptions(prev => ({ ...prev, matchByLRN: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Match students by LRN (recommended)
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.matchByName}
                onChange={(e) => setOptions(prev => ({ ...prev, matchByName: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Match students by name (fallback)
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.skipExistingRecords}
                onChange={(e) => setOptions(prev => ({ ...prev, skipExistingRecords: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Skip students with existing records
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.updateExistingRecords}
                onChange={(e) => setOptions(prev => ({ ...prev, updateExistingRecords: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Update existing records with new data
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.recordsToImport === 0 || preview.schoolStatus === 'error'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {preview.recordsToImport} Records
          </button>
        </div>
      </div>
    );
  };

  const renderImportingStep = () => (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="animate-spin w-16 h-16 mx-auto mb-6">
        <ArrowPathIcon className="w-16 h-16 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        Importing Promotion Records...
      </h3>
      <p className="text-slate-500 dark:text-slate-400">
        Please wait while we process your SF5 data
      </p>
    </div>
  );

  const renderCompleteStep = () => {
    const { importResult } = state;
    if (!importResult) return null;

    return (
      <div className="space-y-6">
        {/* Success/Error Banner */}
        <div className={`rounded-lg p-6 ${
          importResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-3">
            {importResult.success ? (
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                importResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {importResult.success ? 'Import Completed Successfully!' : 'Import Completed with Errors'}
              </h3>
              <p className={`text-sm ${
                importResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {importResult.recordsImported} record(s) imported
                {importResult.recordsUpdated > 0 && ` • ${importResult.recordsUpdated} updated`}
              </p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {importResult.recordsImported}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Imported</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {importResult.recordsUpdated}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Updated</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {importResult.recordsSkipped + importResult.studentsNotFound}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Skipped</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {importResult.recordsFailed}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Failed</div>
          </div>
        </div>

        {/* Warnings */}
        {importResult.warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Warnings</h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {importResult.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Errors */}
        {importResult.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors</h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {importResult.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Another File
          </button>
        </div>
      </div>
    );
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  if (!canImport) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <XCircleIcon className="w-12 h-12 mx-auto text-red-600 dark:text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Access Denied
          </h3>
          <p className="text-red-700 dark:text-red-300">
            You don't have permission to import SF5 data. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          SF5 Import
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Import promotion/proficiency data from DepEd LIS School Form 5 (SF5) exports
        </p>
      </div>

      {/* Error Banner */}
      {state.error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{state.error}</span>
          </div>
        </div>
      )}

      {/* Step Content */}
      {state.step === 'upload' && renderUploadStep()}
      {state.step === 'preview' && renderPreviewStep()}
      {state.step === 'importing' && renderImportingStep()}
      {state.step === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default DivisionSF5Import;
