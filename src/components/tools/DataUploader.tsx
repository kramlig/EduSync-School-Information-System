import { useCallback, useState } from 'react';
import type { FormType } from './types';
import { FORM_LABELS } from './types';
import { parseSF5File, parseSF9File, parseSF2File } from '../../services/tools/csvParser';
import type { SF5ParsedRow, SF9ParsedRow, SF2ParsedRow, ParseResult, ParseError } from '../../services/tools/csvParser';
import { validateSF5Data, validateSF9Data, validateSF2Data } from '../../services/tools/dataValidator';
import type { ValidationResult } from '../../services/tools/dataValidator';

export interface UploadResult {
  sf5Data?: SF5ParsedRow[];
  sf9Data?: SF9ParsedRow[];
  sf2Data?: SF2ParsedRow[];
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
        onDataReady({ sf9Data: result.data, validation, fileName: file.name, rowCount: result.totalRows });
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
  }, [formType, onDataReady, reportMonth]);

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
    onClear();
  };

  const info = FORM_LABELS[formType];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Upload Student Data</h2>
        <p className="text-gray-500 mt-1">
          Upload a CSV or Excel file with student records for <strong>{info.label}</strong>.
        </p>
      </div>

      {/* Template download */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <strong>Need a template?</strong> Download the{' '}
        <button
          type="button"
          onClick={() => downloadTemplate(formType)}
          className="text-blue-600 underline hover:text-blue-800"
        >
          {info.label} CSV template
        </button>{' '}
        with the correct column headers, fill it in Excel, and upload here.
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
    </div>
  );
}

/* ---------- Data Preview Table ---------- */

function DataPreviewTable({ formType, result }: { formType: FormType; result: UploadResult }) {
  const rows = formType === 'sf5' ? result.sf5Data : formType === 'sf9' ? result.sf9Data : result.sf2Data;
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

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
