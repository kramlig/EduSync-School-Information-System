/**
 * DivisionSF7Import - SF7 (School Personnel Report) Import Module
 * 
 * Division-level interface for importing teacher/personnel data from
 * DepEd LIS SF7 CSV exports. Supports creating new schools and bulk teacher import.
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * @see docs/features/SF1_IMPORT_MODULE.md (similar architecture)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { parseSF7, type SF7ParseResult, POSITION_LABELS, STATUS_LABELS } from '../../services/sf7Parser';
import { 
  previewSF7Import, 
  importSF7, 
  type SF7ImportResult,
  type SF7ImportOptions 
} from '../../services/sf7ImportService';

// ============================================================================
// TYPES
// ============================================================================

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  file: File | null;
  parseResult: SF7ParseResult | null;
  preview: Awaited<ReturnType<typeof previewSF7Import>> | null;
  importResult: SF7ImportResult | null;
  error: string | null;
}

// ============================================================================
// ICONS (Inline SVGs for consistency)
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

const UserGroupIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DivisionSF7Import: React.FC = () => {
  const { division, hasPermission } = useDivisionContext();
  
  // State
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    parseResult: null,
    preview: null,
    importResult: null,
    error: null
  });

  const [options, setOptions] = useState<SF7ImportOptions>({
    divisionId: division?.id,
    createSchoolIfMissing: true,
    skipDuplicateEmployeeNumbers: true,
    skipDuplicateEmails: true,
    generateTemporaryEmails: false
  });

  const [isDragging, setIsDragging] = useState(false);

  // Check permissions - Memoize to prevent infinite loops
  const canImport = useMemo(() => {
    return hasPermission('personnel', 'write') || hasPermission('schools', 'write');
  }, [hasPermission]);

  // ========================================================================
  // FILE HANDLING
  // ========================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, error: null }));

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setState(prev => ({ ...prev, error: 'Please select a CSV file' }));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
      return;
    }

    try {
      // Read file content
      const content = await file.text();
      
      // Parse CSV
      const parseResult = parseSF7(content);
      
      if (!parseResult.success) {
        setState(prev => ({
          ...prev,
          error: `Parse error: ${parseResult.errors.join(', ')}`
        }));
        return;
      }

      // Get preview
      const preview = await previewSF7Import(parseResult);

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
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
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
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // ========================================================================
  // IMPORT HANDLING
  // ========================================================================

  const handleImport = useCallback(async () => {
    if (!state.parseResult) return;

    setState(prev => ({ ...prev, step: 'importing', error: null }));

    try {
      const result = await importSF7(state.parseResult, {
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

  // ========================================================================
  // POSITION/STATUS STATISTICS
  // ========================================================================

  const positionStats = useMemo(() => {
    if (!state.parseResult?.teachers) return {};
    const stats: Record<string, number> = {};
    for (const teacher of state.parseResult.teachers) {
      if (teacher.position) {
        stats[teacher.position] = (stats[teacher.position] || 0) + 1;
      }
    }
    return stats;
  }, [state.parseResult?.teachers]);

  const statusStats = useMemo(() => {
    if (!state.parseResult?.teachers) return {};
    const stats: Record<string, number> = {};
    for (const teacher of state.parseResult.teachers) {
      if (teacher.employmentStatus) {
        stats[teacher.employmentStatus] = (stats[teacher.employmentStatus] || 0) + 1;
      }
    }
    return stats;
  }, [state.parseResult?.teachers]);

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
          Upload SF7 CSV File
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Drag and drop your DepEd LIS SF7 (School Personnel Report) export file here, or click to browse
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
          Supports CSV files up to 10MB from DepEd LIS SF7 export
        </p>
      </div>

      {/* Sample Format Info */}
      <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Expected CSV Format</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          The SF7 file should contain teacher information with columns like:
        </p>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>Employee Number/ID</li>
          <li>Name (Last Name, First Name, Middle Name)</li>
          <li>Position/Designation</li>
          <li>Employment Status (Permanent, Temporary, Contract)</li>
          <li>Date Hired</li>
          <li>Highest Educational Attainment</li>
          <li>Major/Specialization</li>
          <li>PRC License Number</li>
        </ul>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const { parseResult, preview } = state;
    if (!parseResult?.metadata || !preview) return null;

    const metadata = parseResult.metadata;
    const validTeachers = parseResult.teachers.filter(t => t.isValid);
    const invalidTeachers = parseResult.teachers.filter(t => !t.isValid);

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
                <dt className="text-slate-500 dark:text-slate-400">Division:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.division || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">District:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.district || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">School Year:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.schoolYear || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Status:</dt>
                <dd>
                  {preview.schoolStatus === 'exists' || preview.schoolStatus === 'provided' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                      Exists in database
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      <ExclamationIcon className="w-3.5 h-3.5 mr-1" />
                      Will be created
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Teachers Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center space-x-2 mb-4">
              <UserGroupIcon className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">Personnel Summary</h4>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Total in File:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{parseResult.totalCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Valid Records:</dt>
                <dd className="font-medium text-green-600 dark:text-green-400">{validTeachers.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Invalid Records:</dt>
                <dd className="font-medium text-red-600 dark:text-red-400">{invalidTeachers.length}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Duplicate Employee #:</dt>
                <dd className="text-amber-600 dark:text-amber-400">{preview.duplicateEmployeeNumbers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Duplicate Emails:</dt>
                <dd className="text-amber-600 dark:text-amber-400">{preview.duplicateEmails}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Position Breakdown */}
        {Object.keys(positionStats).length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center space-x-2 mb-4">
              <BriefcaseIcon className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">Position Breakdown</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(positionStats).map(([position, count]) => (
                <div key={position} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{count}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {POSITION_LABELS[position as keyof typeof POSITION_LABELS] || position}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employment Status Breakdown */}
        {Object.keys(statusStats).length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <h4 className="font-medium text-slate-900 dark:text-white mb-4">Employment Status Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{count}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Import Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {parseResult.totalCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total in File</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {preview.teachersToImport}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Will Import</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {preview.duplicateEmployeeNumbers + preview.duplicateEmails}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Will Skip (Duplicates)</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {invalidTeachers.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Invalid Records</div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(preview.duplicateEmployeeNumbers > 0 || invalidTeachers.length > 0) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  Some records will be skipped
                </h4>
                <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {preview.duplicateEmployeeNumbers > 0 && (
                    <li>• {preview.duplicateEmployeeNumbers} teacher(s) with employee numbers already in database</li>
                  )}
                  {preview.duplicateEmails > 0 && (
                    <li>• {preview.duplicateEmails} teacher(s) with emails already in database</li>
                  )}
                  {invalidTeachers.length > 0 && (
                    <li>• {invalidTeachers.length} teacher(s) with validation errors (missing name)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Import Options */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Import Options</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.createSchoolIfMissing}
                onChange={(e) => setOptions(prev => ({ ...prev, createSchoolIfMissing: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Create school if it doesn't exist
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.skipDuplicateEmployeeNumbers}
                onChange={(e) => setOptions(prev => ({ ...prev, skipDuplicateEmployeeNumbers: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Skip duplicate employee numbers (recommended)
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.skipDuplicateEmails}
                onChange={(e) => setOptions(prev => ({ ...prev, skipDuplicateEmails: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Skip duplicate emails (recommended)
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.generateTemporaryEmails}
                onChange={(e) => setOptions(prev => ({ ...prev, generateTemporaryEmails: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Generate temporary emails for teachers without email
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
            disabled={preview.teachersToImport === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Import {preview.teachersToImport} Teachers</span>
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
        Importing Teachers...
      </h3>
      <p className="text-slate-500 dark:text-slate-400">
        Please wait while we process your SF7 data
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
                {importResult.teachersImported} teacher(s) imported
                {importResult.schoolCreated && ' • New school created'}
              </p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {importResult.teachersImported}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Imported</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {importResult.teachersSkipped}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Skipped (Duplicates)</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {importResult.teachersFailed}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Failed</div>
          </div>
        </div>

        {/* Created Resources */}
        {importResult.schoolCreated && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Resources Created</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>✓ New school: {state.parseResult?.metadata?.schoolName}</li>
            </ul>
          </div>
        )}

        {/* Imported Teachers Preview */}
        {importResult.importedTeachers.length > 0 && importResult.importedTeachers.length <= 20 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <h4 className="font-medium text-slate-900 dark:text-white mb-4">Imported Teachers</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Employee #</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.importedTeachers.slice(0, 20).map((teacher, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{teacher.employeeNumber || '-'}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white">{teacher.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        {/* Skipped Teachers Details */}
        {importResult.skippedTeachers.length > 0 && (
          <details className="bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <summary className="p-4 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              View {importResult.skippedTeachers.length} Skipped Teacher(s)
            </summary>
            <div className="px-4 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 font-medium text-slate-500">Name</th>
                    <th className="text-left py-2 font-medium text-slate-500">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.skippedTeachers.map((teacher, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="py-2 text-slate-700 dark:text-slate-300">{teacher.name}</td>
                      <td className="py-2 text-amber-600 dark:text-amber-400">{teacher.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* Action Buttons */}
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
            You don't have permission to import SF7 data. Please contact your administrator.
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
          SF7 Import
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Import teacher/personnel data from DepEd LIS School Form 7 (SF7) exports
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

export default DivisionSF7Import;
