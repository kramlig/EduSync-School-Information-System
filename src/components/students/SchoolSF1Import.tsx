/**
 * SchoolSF1Import - SF1 Import for School Admins
 * 
 * School-level interface for importing student enrollment data from
 * DepEd LIS SF1 CSV exports. Unlike DivisionSF1Import, this component:
 * - Only imports into the current school (no school creation)
 * - Creates sections if they don't exist
 * - Perfect for school admins to bulk import students
 * 
 * @see src/services/sf1Parser.ts - SF1 CSV parser
 * @see src/services/sf1ImportService.ts - Database operations
 */

import React, { useState, useCallback, useRef } from 'react';
import { parseSF1File, type SF1ParseResult } from '../../services/sf1Parser';
import { 
  lookupSection,
  createSectionFromSF1,
  importStudents as importStudentsDB,
  createParentRecords,
  type SF1ImportResult
} from '../../services/sf1ImportService';
// import type { SF1Student } from '../../services/sf1Parser';

// ============================================================================
// TYPES
// ============================================================================

interface SchoolSF1ImportProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  file: File | null;
  parseResult: SF1ParseResult | null;
  importResult: SF1ImportResult | null;
  error: string | null;
  progress: number;
}

// ============================================================================
// ICONS
// ============================================================================

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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

const DocumentIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SchoolSF1Import: React.FC<SchoolSF1ImportProps> = ({
  schoolId,
  schoolName,
  onClose,
  onImportComplete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    parseResult: null,
    importResult: null,
    error: null,
    progress: 0
  });
  
  const [importOptions, setImportOptions] = useState({
    createSectionIfMissing: true,
    skipDuplicateLRNs: true,
    updateExistingStudents: false,
    importParents: true
  });

  // Handle file selection — supports .xls, .xlsx, and .csv
  const handleFileSelect = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, file, error: null }));
    
    try {
      const isExcel = /\.xlsx?$/i.test(file.name);
      let result: SF1ParseResult;

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        result = parseSF1File({ name: file.name, buffer });
      } else {
        const text = await file.text();
        result = parseSF1File({ name: file.name, text });
      }
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          error: `Failed to parse SF1 file: ${result.errors.join(', ')}`
        }));
        return;
      }
      
      if (result.students.length === 0) {
        setState(prev => ({
          ...prev,
          error: 'No students found in the SF1 file'
        }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        parseResult: result,
        step: 'preview'
      }));
      
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: `Error reading file: ${err.message}`
      }));
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && /\.(csv|xlsx?)$/i.test(file.name)) {
      handleFileSelect(file);
    } else {
      setState(prev => ({ ...prev, error: 'Please drop a .xls, .xlsx, or .csv file' }));
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Execute import
  const handleImport = useCallback(async () => {
    if (!state.parseResult?.metadata) return;
    
    const { metadata, students } = state.parseResult;
    
    setState(prev => ({ ...prev, step: 'importing', progress: 0, error: null }));
    
    const result: SF1ImportResult = {
      success: false,
      schoolCreated: false,
      schoolId: schoolId,
      sectionCreated: false,
      sectionId: null,
      studentsImported: 0,
      studentsUpdated: 0,
      studentsSkipped: 0,
      studentsFailed: 0,
      parentsCreated: 0,
      errors: [],
      warnings: [],
      importedStudents: [],
      updatedStudents: [],
      skippedStudents: [],
      failedStudents: []
    };
    
    try {
      // Step 1: Check/Create Section
      setState(prev => ({ ...prev, progress: 10 }));
      
      let sectionId: string | null = null;
      
      const sectionLookup = await lookupSection(
        schoolId,
        metadata.gradeLevel,
        metadata.sectionName,
        metadata.schoolYear
      );
      
      if (sectionLookup.exists && sectionLookup.sectionId) {
        sectionId = sectionLookup.sectionId;
      } else if (importOptions.createSectionIfMissing) {
        // Create the section
        const newSectionId = await createSectionFromSF1(schoolId, metadata);
        if (newSectionId) {
          sectionId = newSectionId;
          result.sectionCreated = true;
          result.warnings.push(`Created new section: ${metadata.sectionName} (Grade ${metadata.gradeLevel})`);
        } else {
          result.errors.push(`Failed to create section: ${metadata.sectionName}`);
          setState(prev => ({ ...prev, step: 'complete', importResult: result }));
          return;
        }
      } else {
        result.errors.push(`Section "${metadata.sectionName}" not found. Enable "Create section if missing" to auto-create.`);
        setState(prev => ({ ...prev, step: 'complete', importResult: result }));
        return;
      }
      
      result.sectionId = sectionId;
      
      // Step 2: Import Students
      setState(prev => ({ ...prev, progress: 30 }));
      
      const importResult = await importStudentsDB(
        schoolId,
        sectionId,
        students,
        metadata.gradeLevel,
        importOptions.skipDuplicateLRNs,
        importOptions.updateExistingStudents
      );
      
      result.importedStudents = importResult.imported;
      result.updatedStudents = importResult.updated;
      result.skippedStudents = importResult.skipped;
      result.failedStudents = importResult.failed;
      result.studentsImported = importResult.imported.length;
      result.studentsUpdated = importResult.updated.length;
      result.studentsSkipped = importResult.skipped.length;
      result.studentsFailed = importResult.failed.length;
      
      setState(prev => ({ ...prev, progress: 70 }));
      
      // Step 3: Import Parents (if enabled)
      if (importOptions.importParents && importResult.imported.length > 0) {
        let parentsCreated = 0;
        
        for (const importedStudent of importResult.imported) {
          const sf1Student = students.find(st => st.lrn === importedStudent.lrn);
          if (sf1Student) {
            const count = await createParentRecords(schoolId, importedStudent.id, sf1Student);
            parentsCreated += count;
          }
        }
        
        result.parentsCreated = parentsCreated;
      }
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      result.success = result.studentsImported > 0 || result.studentsUpdated > 0;
      
      setState(prev => ({
        ...prev,
        step: 'complete',
        importResult: result
      }));
      
    } catch (err: any) {
      result.errors.push(err.message);
      setState(prev => ({
        ...prev,
        step: 'complete',
        importResult: result
      }));
    }
  }, [state.parseResult, schoolId, importOptions]);

  // Reset and start over
  const handleReset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      parseResult: null,
      importResult: null,
      error: null,
      progress: 0
    });
  }, []);

  // Handle close and refresh
  const handleFinish = useCallback(() => {
    onImportComplete();
    onClose();
  }, [onClose, onImportComplete]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Import from SF1</h2>
              <p className="text-blue-100 text-sm">{schoolName}</p>
            </div>
            <button
              onClick={onClose}
              title="Close"
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Upload */}
          {state.step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📋 How to get your SF1 file:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Get the SF1 Excel file from DepEd LIS or your Registrar</li>
                  <li>Each file should be <strong>one grade level &amp; section</strong> (e.g. SF1_2025_Grade-1-HOPE.xls)</li>
                  <li>Supports <strong>.xls</strong> (Excel 97-2003), <strong>.xlsx</strong>, and <strong>.csv</strong> formats</li>
                  <li>Upload the file here — we'll extract all student data automatically</li>
                </ol>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">Drop SF1 file here</p>
                <p className="text-sm text-gray-500 mt-1">Supports .xls, .xlsx, and .csv — or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  title="Upload SF1 CSV"
                  className="hidden"
                />
              </div>

              {/* Error */}
              {state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{state.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {state.step === 'preview' && state.parseResult && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                <DocumentIcon className="w-10 h-10 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{state.file?.name}</p>
                  <p className="text-sm text-gray-500">
                    {state.parseResult.metadata?.schoolName} • Grade {state.parseResult.metadata?.gradeLevel} - {state.parseResult.metadata?.sectionName}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Change file
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">{state.parseResult.totalCount}</p>
                  <p className="text-sm text-blue-600">Total Students</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{state.parseResult.maleCount}</p>
                  <p className="text-sm text-green-600">Male</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-pink-700">{state.parseResult.femaleCount}</p>
                  <p className="text-sm text-pink-600">Female</p>
                </div>
              </div>

              {/* Warnings */}
              {state.parseResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationIcon className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Warnings</span>
                  </div>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {state.parseResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Import Options */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Import Options</h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.createSectionIfMissing}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, createSectionIfMissing: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Create section if it doesn't exist</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicateLRNs}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicateLRNs: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Skip students with duplicate LRNs</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.updateExistingStudents}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, updateExistingStudents: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Update existing students with new data</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.importParents}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, importParents: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Import parent/guardian information</span>
                </label>
              </div>

              {/* Student Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-900">Student Preview (first 10)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">LRN</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Sex</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Birth Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {state.parseResult.students.slice(0, 10).map((student, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{student.lrn}</td>
                          <td className="px-4 py-2">{student.fullName}</td>
                          <td className="px-4 py-2">{student.sex}</td>
                          <td className="px-4 py-2">{student.birthDateRaw}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {state.parseResult.students.length > 10 && (
                  <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 border-t">
                    ... and {state.parseResult.students.length - 10} more students
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {state.step === 'importing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">Importing Students...</p>
              <p className="text-gray-500 mb-4">Please wait while we import the student data.</p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{state.progress}%</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {state.step === 'complete' && state.importResult && (
            <div className="space-y-6">
              {/* Result Header */}
              {state.importResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-800 mb-2">Import Complete!</h3>
                  <p className="text-green-700">
                    Successfully imported {state.importResult.studentsImported} students
                    {state.importResult.studentsUpdated > 0 && ` and updated ${state.importResult.studentsUpdated}`}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-800 mb-2">Import Failed</h3>
                  <p className="text-red-700">
                    {state.importResult.errors.join('. ')}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{state.importResult.studentsImported}</p>
                  <p className="text-sm text-green-600">Imported</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{state.importResult.studentsUpdated}</p>
                  <p className="text-sm text-blue-600">Updated</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{state.importResult.studentsSkipped}</p>
                  <p className="text-sm text-yellow-600">Skipped</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{state.importResult.studentsFailed}</p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {/* Warnings */}
              {state.importResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationIcon className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Notes</span>
                  </div>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {state.importResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parent Stats */}
              {state.importResult.parentsCreated > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-purple-800">
                    <strong>{state.importResult.parentsCreated}</strong> parent/guardian records created
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          {state.step === 'upload' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <div></div>
            </>
          )}
          
          {state.step === 'preview' && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import {state.parseResult?.totalCount} Students
              </button>
            </>
          )}
          
          {state.step === 'importing' && (
            <div className="w-full text-center text-gray-500">
              Do not close this window...
            </div>
          )}
          
          {state.step === 'complete' && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Import Another
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolSF1Import;
