import { useCallback, useState } from 'react';
import type { FormType } from './types';
import { FORM_LABELS } from './types';
import { parseSF5File, parseSF9File, parseSF2File, parseCoreValuesFile, parseHomeroomGuidanceFile } from '../../services/tools/csvParser';
import type { SF5ParsedRow, SF9ParsedRow, SF2ParsedRow, CoreValuesParsedRow, HomeroomGuidanceParsedRow, ParseResult, ParseError } from '../../services/tools/csvParser';
import { validateSF5Data, validateSF9Data, validateSF2Data, validateCoreValuesData, validateHomeroomGuidanceData } from '../../services/tools/dataValidator';
import type { ValidationResult } from '../../services/tools/dataValidator';

export interface UploadResult {
  sf5Data?: SF5ParsedRow[];
  sf9Data?: SF9ParsedRow[];
  sf2Data?: SF2ParsedRow[];
  coreValuesData?: CoreValuesParsedRow[];
  homeroomGuidanceData?: HomeroomGuidanceParsedRow[];
  validation: ValidationResult;
  fileName: string;
  rowCount: number;
  reportMonth?: string;
}

interface Props {
  formType: FormType;
  onDataReady: (result: UploadResult) => void;
  onClear: () => void;
  currentResult: UploadResult | null;
}

export default function DataUploader({ formType, onDataReady, onClear, currentResult }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // SF9 supplementary uploads state
  const [cvResult, setCvResult] = useState<{ data: CoreValuesParsedRow[]; fileName: string; validation: ValidationResult } | null>(null);
  const [hgResult, setHgResult] = useState<{ data: HomeroomGuidanceParsedRow[]; fileName: string; validation: ValidationResult } | null>(null);
  const [cvErrors, setCvErrors] = useState<ParseError[]>([]);
  const [hgErrors, setHgErrors] = useState<ParseError[]>([]);
  const [isCvProcessing, setIsCvProcessing] = useState(false);
  const [isHgProcessing, setIsHgProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setParseErrors([]);

    try {
      if (formType === 'sf5') {
        const result: ParseResult<SF5ParsedRow> = await parseSF5File(file);
        if (result.errors.length > 0) {
          setParseErrors(result.errors);
          if (result.data.length === 0) { setIsProcessing(false); return; }
        }
        const validation = validateSF5Data(result.data);
        onDataReady({ sf5Data: result.data, validation, fileName: file.name, rowCount: result.totalRows });
      } else if (formType === 'sf9') {
        const result: ParseResult<SF9ParsedRow> = await parseSF9File(file);
        if (result.errors.length > 0) {
          setParseErrors(result.errors);
          if (result.data.length === 0) { setIsProcessing(false); return; }
        }
        const validation = validateSF9Data(result.data);
        onDataReady({
          sf9Data: result.data, validation, fileName: file.name, rowCount: result.totalRows,
          // Carry over previously-uploaded supplementary data
          coreValuesData: cvResult?.data,
          homeroomGuidanceData: hgResult?.data,
        });
      } else if (formType === 'sf2') {
        const result: ParseResult<SF2ParsedRow> = await parseSF2File(file, reportMonth);
        if (result.errors.length > 0) {
          setParseErrors(result.errors);
          if (result.data.length === 0) { setIsProcessing(false); return; }
        }
        const validation = validateSF2Data(result.data);
        onDataReady({ sf2Data: result.data, validation, fileName: file.name, rowCount: result.totalRows, reportMonth });
      }
    } catch (err) {
      setParseErrors([{ row: 0, field: 'file', message: err instanceof Error ? err.message : 'Failed to parse file' }]);
    } finally {
      setIsProcessing(false);
    }
  }, [formType, onDataReady, reportMonth, cvResult, hgResult]);

  /** Process a Core Values supplementary CSV for SF9 */
  const processCvFile = useCallback(async (file: File) => {
    setIsCvProcessing(true);
    setCvErrors([]);
    try {
      const result: ParseResult<CoreValuesParsedRow> = await parseCoreValuesFile(file);
      if (result.errors.length > 0) {
        setCvErrors(result.errors);
        if (result.data.length === 0) { setIsCvProcessing(false); return; }
      }
      const validation = validateCoreValuesData(result.data);
      setCvResult({ data: result.data, fileName: file.name, validation });
      if (currentResult?.sf9Data) {
        onDataReady({ ...currentResult, coreValuesData: result.data });
      }
    } catch (err) {
      setCvErrors([{ row: 0, field: 'file', message: err instanceof Error ? err.message : 'Failed to parse file' }]);
    } finally {
      setIsCvProcessing(false);
    }
  }, [currentResult, onDataReady]);

  /** Process a Homeroom Guidance supplementary CSV for SF9 */
  const processHgFile = useCallback(async (file: File) => {
    setIsHgProcessing(true);
    setHgErrors([]);
    try {
      const result: ParseResult<HomeroomGuidanceParsedRow> = await parseHomeroomGuidanceFile(file);
      if (result.errors.length > 0) {
        setHgErrors(result.errors);
        if (result.data.length === 0) { setIsHgProcessing(false); return; }
      }
      const validation = validateHomeroomGuidanceData(result.data);
      setHgResult({ data: result.data, fileName: file.name, validation });
      if (currentResult?.sf9Data) {
        onDataReady({ ...currentResult, homeroomGuidanceData: result.data });
      }
    } catch (err) {
      setHgErrors([{ row: 0, field: 'file', message: err instanceof Error ? err.message : 'Failed to parse file' }]);
    } finally {
      setIsHgProcessing(false);
    }
  }, [currentResult, onDataReady]);

  const handleSupplementaryFile = useCallback((file: File, type: 'cv' | 'hg') => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      const setter = type === 'cv' ? setCvErrors : setHgErrors;
      setter([{ row: 0, field: 'file', message: 'Unsupported file type. Please upload .csv or .xlsx' }]);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const setter = type === 'cv' ? setCvErrors : setHgErrors;
      setter([{ row: 0, field: 'file', message: 'File too large (max 5 MB)' }]);
      return;
    }
    if (type === 'cv') processCvFile(file);
    else processHgFile(file);
  }, [processCvFile, processHgFile]);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      setParseErrors([{ row: 0, field: 'file', message: 'Unsupported file type. Please upload .csv or .xlsx' }]);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseErrors([{ row: 0, field: 'file', message: 'File too large (max 5 MB)' }]);
      return;
    }
    processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-upload of same file
  }, [handleFile]);

  const handleClear = () => {
    setParseErrors([]);
    setCvResult(null);
    setHgResult(null);
    setCvErrors([]);
    setHgErrors([]);
    onClear();
  };

  const info = FORM_LABELS[formType];

  // SF9 shows a multi-file layout; other forms use a single drop zone
  const isSF9 = formType === 'sf9';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Upload Student Data</h2>
        <p className="text-gray-500 mt-1">
          {isSF9
            ? <>Upload up to <strong>3 CSV files</strong> for your SF9 report card. Only the Subject Grades file is required — Core Values and Homeroom Guidance are optional (they fill page 2).  </>
            : <>Upload a CSV or Excel file with student records for <strong>{info.label}</strong>.</>
          }
        </p>
      </div>

      {/* Template downloads */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <strong>Download templates:</strong>{' '}
        <button type="button" onClick={() => downloadTemplate(formType)} className="text-blue-600 underline hover:text-blue-800">
          {isSF9 ? 'Subject Grades' : info.label}
        </button>
        {isSF9 && (
          <>
            {' · '}
            <button type="button" onClick={() => downloadCoreValuesTemplate()} className="text-blue-600 underline hover:text-blue-800">
              Core Values
            </button>
            {' · '}
            <button type="button" onClick={() => downloadHomeroomGuidanceTemplate()} className="text-blue-600 underline hover:text-blue-800">
              Homeroom Guidance
            </button>
          </>
        )}
        <span className="text-gray-500"> — fill in Excel, then upload below.</span>
      </div>

      {/* SF2: Report month picker */}
      {formType === 'sf2' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Month <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            value={reportMonth}
            onChange={e => setReportMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            The month this attendance data covers. Day columns in the PDF will match this month.
          </p>
        </div>
      )}

      {/* ═══ SF9: All 3 upload zones shown simultaneously ═══ */}
      {isSF9 ? (
        <div className="space-y-4">
          {/* 1. Subject Grades — required */}
          <SF9UploadZone
            label="📊 Subject Grades"
            tag="Required"
            tagColor="red"
            description="Per-student per-subject quarterly grades (LRN, Name, Subject, Q1–Q4)"
            result={currentResult ? { data: currentResult.sf9Data ?? [], fileName: currentResult.fileName, validation: currentResult.validation, rowCount: currentResult.rowCount } : null}
            errors={parseErrors}
            isProcessing={isProcessing}
            onFile={handleFile}
            onClear={handleClear}
            isDragTarget
            isDragging={isDragging}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          />

          {/* 2. Core Values — optional */}
          <SupplementaryUpload
            label="⭐ Core Values (Observed Values of the Learner)"
            tag="Optional — Page 2"
            description="Maka-Diyos, Makatao, Makakalikasan, Makabansa — AO/SO/RO/NO per behavior per quarter"
            result={cvResult}
            errors={cvErrors}
            isProcessing={isCvProcessing}
            onFile={(f) => handleSupplementaryFile(f, 'cv')}
            onClear={() => {
              setCvResult(null);
              setCvErrors([]);
              if (currentResult) onDataReady({ ...currentResult, coreValuesData: undefined });
            }}
          />

          {/* 3. Homeroom Guidance — optional */}
          <SupplementaryUpload
            label="🏠 Homeroom Guidance (Learner's Development Assessment)"
            tag="Optional — Page 2"
            description="Competencies per quarter rated 0–4"
            result={hgResult}
            errors={hgErrors}
            isProcessing={isHgProcessing}
            onFile={(f) => handleSupplementaryFile(f, 'hg')}
            onClear={() => {
              setHgResult(null);
              setHgErrors([]);
              if (currentResult) onDataReady({ ...currentResult, homeroomGuidanceData: undefined });
            }}
          />

          {/* Quick status summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-3">
            <span className="font-medium">Status:</span>
            <span>{currentResult?.sf9Data ? '✓ Grades' : '○ Grades (required)'}</span>
            <span className="text-blue-300">|</span>
            <span>{cvResult ? '✓ Core Values' : '○ Core Values'}</span>
            <span className="text-blue-300">|</span>
            <span>{hgResult ? '✓ Homeroom Guidance' : '○ Homeroom Guidance'}</span>
          </div>
        </div>
      ) : (
        /* ═══ Non-SF9 forms: single drop zone (unchanged) ═══ */
        <>
          {/* Drop zone */}
          {!currentResult && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 transition-colors cursor-pointer
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-white'}
                ${isProcessing ? 'pointer-events-none opacity-60' : ''}
              `}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500">Processing file…</span>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 font-medium">Drag & drop your file here</p>
                  <p className="text-gray-400 text-sm mt-1">or click to browse — .csv, .xlsx (max 5 MB)</p>
                </>
              )}
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="font-semibold text-red-700 mb-2">File Errors</p>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {parseErrors.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    {err.row > 0 && <span className="font-mono">Row {err.row}: </span>}
                    {err.message}
                  </li>
                ))}
                {parseErrors.length > 10 && (
                  <li className="text-red-400">…and {parseErrors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Upload success summary */}
          {currentResult && (
            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-700">
                    ✓ {currentResult.fileName}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {currentResult.rowCount} rows parsed · {currentResult.validation.errors.length === 0 ? 'All data valid' : `${currentResult.validation.errors.length} validation issues`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>

              {/* Validation warnings */}
              {currentResult.validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="font-semibold text-yellow-700 mb-2">Warnings</p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                    {currentResult.validation.warnings.slice(0, 5).map((w, i) => <li key={i}>Row {w.row}: {w.message}</li>)}
                  </ul>
                </div>
              )}

              {/* Validation errors */}
              {currentResult.validation.errors.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="font-semibold text-red-700 mb-2">Validation Errors</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {currentResult.validation.errors.slice(0, 10).map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                    {currentResult.validation.errors.length > 10 && (
                      <li className="text-red-400">…and {currentResult.validation.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Data preview table */}
              <DataPreviewTable formType={formType} result={currentResult} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- SF9 Upload Zone (for the main grades file, with drag-and-drop) ---------- */

function SF9UploadZone({
  label, tag, tagColor, description, result, errors, isProcessing,
  onFile, onClear, isDragTarget, isDragging, onDragOver, onDragLeave, onDrop,
}: {
  label: string;
  tag: string;
  tagColor: 'red' | 'gray';
  description: string;
  result: { data: unknown[]; fileName: string; validation: ValidationResult; rowCount: number } | null;
  errors: ParseError[];
  isProcessing: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
  isDragTarget?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const tagClasses = tagColor === 'red'
    ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800">{label}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagClasses}`}>{tag}</span>
        </div>
        {result && (
          <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>

      {!result && (
        <div
          onDragOver={isDragTarget ? onDragOver : undefined}
          onDragLeave={isDragTarget ? onDragLeave : undefined}
          onDrop={isDragTarget ? onDrop : undefined}
          className={`
            relative mt-3 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}
            ${isProcessing ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Processing…</span>
            </div>
          ) : (
            <>
              <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Drop file or click to browse</p>
            </>
          )}
        </div>
      )}

      {result && (
        <>
          <div className="mt-2 text-sm text-green-700">
            ✓ {result.fileName} — {result.rowCount} rows
            {result.validation.errors.length === 0 && ' · All data valid'}
          </div>
          <ValidationDetails validation={result.validation} />
        </>
      )}

      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          {errors.slice(0, 5).map((err, i) => (
            <p key={i}>{err.row > 0 ? `Row ${err.row}: ` : ''}{err.message}</p>
          ))}
          {errors.length > 5 && <p className="text-red-400">…and {errors.length - 5} more</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Supplementary Upload Component ---------- */

function SupplementaryUpload({
  label, tag, description, result, errors, isProcessing, onFile, onClear,
}: {
  label: string;
  tag?: string;
  description: string;
  result: { data: unknown[]; fileName: string; validation: ValidationResult } | null;
  errors: ParseError[];
  isProcessing: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800">{label}</p>
          {tag && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>}
        </div>
        {result && (
          <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      {!result && (
        <div className="mt-3">
          <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border cursor-pointer transition-colors ${
            isProcessing ? 'opacity-50 pointer-events-none bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
          }`}>
            {isProcessing ? (
              <><span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />Processing…</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Upload CSV</>
            )}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} className="hidden" />
          </label>
        </div>
      )}
      {result && (
        <>
          <div className="mt-2 text-sm text-green-700">
            ✓ {result.fileName} — {result.data.length} rows
            {result.validation.errors.length === 0 && ' · All data valid'}
          </div>
          <ValidationDetails validation={result.validation} />
        </>
      )}
      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          {errors.slice(0, 5).map((err, i) => (
            <p key={i}>{err.row > 0 ? `Row ${err.row}: ` : ''}{err.message}</p>
          ))}
          {errors.length > 5 && <p className="text-red-400">…and {errors.length - 5} more</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Collapsible Validation Details ---------- */

function ValidationDetails({ validation }: { validation: ValidationResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  if (!hasErrors && !hasWarnings) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`text-xs font-medium flex items-center gap-1 ${hasErrors ? 'text-red-600 hover:text-red-800' : 'text-yellow-600 hover:text-yellow-800'}`}
      >
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {hasErrors ? `${validation.errors.length} validation issue${validation.errors.length !== 1 ? 's' : ''}` : ''}
        {hasErrors && hasWarnings ? ' + ' : ''}
        {hasWarnings ? `${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''}` : ''}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 text-xs">
          {hasErrors && (
            <div className="bg-red-50 border-l-4 border-red-400 p-2 rounded">
              <p className="font-semibold text-red-700 mb-1">Errors</p>
              <ul className="list-disc list-inside text-red-600 space-y-0.5">
                {validation.errors.slice(0, 15).map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
                {validation.errors.length > 15 && (
                  <li className="text-red-400">…and {validation.errors.length - 15} more</li>
                )}
              </ul>
            </div>
          )}
          {hasWarnings && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
              <p className="font-semibold text-yellow-700 mb-1">Warnings</p>
              <ul className="list-disc list-inside text-yellow-600 space-y-0.5">
                {validation.warnings.slice(0, 10).map((w, i) => (
                  <li key={i}>Row {w.row}: {w.message}</li>
                ))}
                {validation.warnings.length > 10 && (
                  <li className="text-yellow-400">…and {validation.warnings.length - 10} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Data Preview Table ---------- */

function DataPreviewTable({ formType, result }: { formType: FormType; result: UploadResult }) {
  const rows = formType === 'sf5' ? result.sf5Data
    : formType === 'sf9' ? result.sf9Data
    : result.sf2Data;
  if (!rows || rows.length === 0) return null;

  const previewRows = rows.slice(0, 5);

  return (
    <div className="overflow-x-auto">
      <p className="text-sm text-gray-500 mb-2">First {Math.min(5, rows.length)} of {rows.length} rows:</p>
      <table className="min-w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-600">LRN</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Last Name</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">First Name</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Gender</th>
            {formType === 'sf5' && <th className="px-3 py-2 text-left font-medium text-gray-600">Gen. Avg</th>}
            {formType === 'sf9' && <th className="px-3 py-2 text-left font-medium text-gray-600">Subject</th>}
            {formType === 'sf9' && <th className="px-3 py-2 text-left font-medium text-gray-600">Q1</th>}
            {formType === 'sf2' && <th className="px-3 py-2 text-left font-medium text-gray-600">Days Recorded</th>}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-3 py-1.5 font-mono text-gray-700">{row.lrn}</td>
              <td className="px-3 py-1.5">{row.lastName}</td>
              <td className="px-3 py-1.5">{row.firstName}</td>
              <td className="px-3 py-1.5">{row.gender}</td>
              {formType === 'sf5' && 'generalAverage' in row && (
                <td className="px-3 py-1.5 font-mono">{(row as any).generalAverage ?? '—'}</td>
              )}
              {formType === 'sf9' && 'subject' in row && (
                <>
                  <td className="px-3 py-1.5">{(row as any).subject}</td>
                  <td className="px-3 py-1.5 font-mono">{(row as any).q1 ?? '—'}</td>
                </>
              )}
              {formType === 'sf2' && 'attendance' in row && (
                <td className="px-3 py-1.5 font-mono">{Object.keys((row as SF2ParsedRow).attendance).length}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- CSV Template Downloader ---------- */

function downloadTemplate(formType: FormType) {
  let content: string;
  let filename: string;

  if (formType === 'sf5') {
    content = [
      'LRN,Last Name,First Name,Middle Name,Gender,Filipino,English,Mathematics,Science,Araling Panlipunan,EPP/TLE,MAPEH,ESP,General Average',
      '123456789012,Dela Cruz,Juan,Santos,Male,85,88,90,87,86,84,89,91,87.5',
    ].join('\n');
    filename = 'sf5_template.csv';
  } else if (formType === 'sf9') {
    content = [
      'LRN,Last Name,First Name,Middle Name,Gender,Subject,Q1,Q2,Q3,Q4',
      '123456789012,Dela Cruz,Juan,Santos,Male,Filipino,85,88,87,90',
      '123456789012,Dela Cruz,Juan,Santos,Male,English,90,88,92,89',
    ].join('\n');
    filename = 'sf9_template.csv';
  } else if (formType === 'sf2') {
    content = [
      'LRN,Last Name,First Name,Middle Name,Gender,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31',
      '123456789012,Dela Cruz,Juan,Santos,Male,P,P,P,A,P,P,P,P,L,P,P,P,P,P,A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P',
    ].join('\n');
    filename = 'sf2_template.csv';
  } else {
    return;
  }

  downloadBlobCSV(content, filename);
}

function downloadCoreValuesTemplate() {
  const content = [
    'LRN,Last Name,First Name,Middle Name,Gender,Core Value,Behavior,Q1,Q2,Q3,Q4',
    "123456789012,Dela Cruz,Juan,Santos,Male,Maka-Diyos,Expresses one's spiritual beliefs while respecting the spiritual beliefs of others,AO,SO,AO,AO",
    '123456789012,Dela Cruz,Juan,Santos,Male,Maka-Diyos,Shows adherence to ethical principles by upholding truth,SO,SO,AO,AO',
    '123456789012,Dela Cruz,Juan,Santos,Male,Makatao,Is sensitive to individual social and cultural differences,AO,AO,SO,AO',
    '123456789012,Dela Cruz,Juan,Santos,Male,Makatao,Demonstrates contributions toward solidarity,SO,AO,AO,AO',
    '123456789012,Dela Cruz,Juan,Santos,Male,Makakalikasan,Cares for the environment and utilizes resources wisely judiciously and economically,AO,AO,AO,SO',
    '123456789012,Dela Cruz,Juan,Santos,Male,Makabansa,Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen,AO,SO,AO,AO',
    '123456789012,Dela Cruz,Juan,Santos,Male,Makabansa,Demonstrates appropriate behavior in civic engagement activities,SO,SO,AO,AO',
  ].join('\n');
  downloadBlobCSV(content, 'sf9_core_values_template.csv');
}

function downloadHomeroomGuidanceTemplate() {
  const content = [
    'LRN,Last Name,First Name,Middle Name,Gender,Quarter,Competency,Rating',
    '123456789012,Dela Cruz,Juan,Santos,Male,First Quarter,Value oneself,4',
    '123456789012,Dela Cruz,Juan,Santos,Male,First Quarter,Value others,3',
    '123456789012,Dela Cruz,Juan,Santos,Male,First Quarter,Respect individual differences,4',
    '123456789012,Dela Cruz,Juan,Santos,Male,Second Quarter,Provide proper procedure toward responsible decision-making,3',
    '123456789012,Dela Cruz,Juan,Santos,Male,Third Quarter,Enrich knowledge and skills toward academic achievement,4',
    '123456789012,Dela Cruz,Juan,Santos,Male,Fourth Quarter,Share one\'s abilities for the development of others and community,3',
  ].join('\n');
  downloadBlobCSV(content, 'sf9_homeroom_guidance_template.csv');
}

function downloadBlobCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
