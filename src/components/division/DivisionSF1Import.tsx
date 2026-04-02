/**
 * DivisionSF1Import - SF1 (School Form 1) Import Module
 * 
 * Division-level interface for importing student enrollment data from
 * DepEd LIS SF1 CSV exports. Supports creating new schools and sections.
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * @see docs/features/SF1_IMPORT_MODULE.md
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { parseSF1File, type SF1ParseResult } from '../../services/sf1Parser';
import { 
  previewSF1Import, 
  importSF1, 
  type SF1ImportResult,
  type SF1ImportOptions 
} from '../../services/sf1ImportService';

// ============================================================================
// TYPES
// ============================================================================

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  file: File | null;
  parseResult: SF1ParseResult | null;
  preview: Awaited<ReturnType<typeof previewSF1Import>> | null;
  importResult: SF1ImportResult | null;
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

const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DivisionSF1Import: React.FC = () => {
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

  const [options, setOptions] = useState<SF1ImportOptions>({
    divisionId: division?.id,
    createSchoolIfMissing: true,
    createSectionIfMissing: true,
    skipDuplicateLRNs: true,
    updateExistingStudents: false,
    importParents: true
  });

  const [isDragging, setIsDragging] = useState(false);

  // Check permissions
  const canImport = useMemo(() => {
    return hasPermission('enrollment', 'write') || hasPermission('schools', 'write');
  }, [hasPermission]);

  // ========================================================================
  // FILE HANDLING
  // ========================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, error: null }));

    // Validate file type
    if (!/\.(csv|xlsx?)$/i.test(file.name)) {
      setState(prev => ({ ...prev, error: 'Please select an Excel (.xls, .xlsx) or CSV file' }));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
      return;
    }

    try {
      // Parse file (Excel or CSV)
      const isExcel = /\.xlsx?$/i.test(file.name);
      let parseResult: SF1ParseResult;
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        parseResult = parseSF1File({ name: file.name, buffer });
      } else {
        const content = await file.text();
        parseResult = parseSF1File({ name: file.name, text: content });
      }
      
      if (!parseResult.success) {
        setState(prev => ({
          ...prev,
          error: `Parse error: ${parseResult.errors.join(', ')}`
        }));
        return;
      }

      // Get preview
      const preview = await previewSF1Import(parseResult);

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
      const result = await importSF1(state.parseResult, {
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
          Upload SF1 File
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Drag and drop your DepEd SF1 file here (.xls, .xlsx, or .csv)
        </p>
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
          <DocumentIcon className="w-5 h-5 mr-2" />
          Select File
          <input
            type="file"
            accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          Supports Excel (.xls, .xlsx) and CSV files up to 10MB
        </p>
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
                  {(state.file?.size || 0 / 1024).toFixed(1)} KB
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
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.schoolId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Name:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.schoolName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Division:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.division}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">District:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.district || 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Status:</dt>
                <dd>
                  {preview.schoolStatus === 'exists' ? (
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

          {/* Section Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center space-x-2 mb-4">
              <UsersIcon className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-slate-900 dark:text-white">Section Information</h4>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Grade Level:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.gradeLevelRaw}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Section:</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{metadata.sectionName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">School Year:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.schoolYear}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Adviser:</dt>
                <dd className="text-slate-700 dark:text-slate-300">{metadata.adviserName || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Status:</dt>
                <dd>
                  {preview.sectionStatus === 'exists' ? (
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
        </div>

        {/* Student Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Student Data Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {parseResult.totalCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total in File</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {parseResult.maleCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Male</div>
            </div>
            <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {parseResult.femaleCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Female</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {preview.studentsToImport}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Will Import</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {preview.duplicateLRNs.length + preview.invalidStudents.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Will Skip</div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(preview.duplicateLRNs.length > 0 || preview.invalidStudents.length > 0) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  Some records will be skipped
                </h4>
                <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {preview.duplicateLRNs.length > 0 && (
                    <li>• {preview.duplicateLRNs.length} student(s) with LRNs already in database</li>
                  )}
                  {preview.invalidStudents.length > 0 && (
                    <li>• {preview.invalidStudents.length} student(s) with validation errors</li>
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
                checked={options.createSectionIfMissing}
                onChange={(e) => setOptions(prev => ({ ...prev, createSectionIfMissing: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Create section if it doesn't exist
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.skipDuplicateLRNs}
                onChange={(e) => setOptions(prev => ({ ...prev, skipDuplicateLRNs: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Skip duplicate LRNs (recommended)
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.updateExistingStudents}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  updateExistingStudents: e.target.checked,
                  skipDuplicateLRNs: e.target.checked ? false : prev.skipDuplicateLRNs 
                }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Update existing students (fill in missing data like parents, address)
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.importParents}
                onChange={(e) => setOptions(prev => ({ ...prev, importParents: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Import parent/guardian information
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
            disabled={preview.studentsToImport === 0 && !options.updateExistingStudents}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>
              {options.updateExistingStudents 
                ? `Update ${preview.duplicateLRNs.length} / Import ${preview.studentsToImport} Students`
                : `Import ${preview.studentsToImport} Students`}
            </span>
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
        Importing Students...
      </h3>
      <p className="text-slate-500 dark:text-slate-400">
        Please wait while we process your SF1 data
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
                {importResult.studentsImported} student(s) imported
                {importResult.studentsUpdated > 0 && ` • ${importResult.studentsUpdated} student(s) updated`}
                {importResult.schoolCreated && ' • New school created'}
                {importResult.sectionCreated && ' • New section created'}
              </p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {importResult.studentsImported}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Imported</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
              {importResult.studentsUpdated}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Updated</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {importResult.studentsSkipped}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Skipped</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {importResult.studentsFailed}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Failed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {importResult.parentsCreated}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Parents Created</div>
          </div>
        </div>

        {/* Created Resources */}
        {(importResult.schoolCreated || importResult.sectionCreated) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Resources Created</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {importResult.schoolCreated && (
                <li>✓ New school: {state.parseResult?.metadata?.schoolName}</li>
              )}
              {importResult.sectionCreated && (
                <li>✓ New section: {state.parseResult?.metadata?.gradeLevelRaw} - {state.parseResult?.metadata?.sectionName}</li>
              )}
            </ul>
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
            You don't have permission to import SF1 data. Please contact your administrator.
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
          SF1 Import
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Import student enrollment data from DepEd LIS School Form 1 (SF1) exports
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

export default DivisionSF1Import;
