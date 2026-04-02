/**
 * SimpleCSVImport - Import for personal workspaces.
 *
 * Supports:
 * - Plain CSV with columns: Last Name, First Name, Middle Name, LRN, Gender, Grade Level
 * - DepEd SF1 Excel files (.xls / .xlsx) — auto-detects the format
 *
 * Differences from SchoolSF1Import:
 * - Enforces tier student limits (free = 50)
 * - Does NOT auto-create sections
 */

import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { parseSF1Excel, SF1Metadata } from '../../services/sf1Parser';
import { checkDuplicateLRNs } from '../../services/sf1ImportService';
import * as XLSX from 'xlsx';

interface SimpleCSVImportProps {
  schoolId: string;
  maxStudents: number;
  currentStudentCount: number;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  lastName: string;
  firstName: string;
  middleName: string;
  lrn: string;
  gender: string;
  gradeLevel: number;
  birthDate?: string; // ISO YYYY-MM-DD from SF1 Excel
  raw: string;
  error?: string;
}

type Step = 'upload' | 'preview' | 'importing' | 'complete';

const TEMPLATE_CSV = `Last Name,First Name,Middle Name,LRN,Gender,Grade Level
Dela Cruz,Juan,Santos,123456789012,Male,6
Reyes,Maria,Garcia,,Female,6`;

const SimpleCSVImport: React.FC<SimpleCSVImportProps> = ({
  schoolId,
  maxStudents,
  currentStudentCount,
  onClose,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedRows, setFailedRows] = useState<string[]>([]);
  const [sf1Metadata, setSf1Metadata] = useState<SF1Metadata | null>(null);

  const remaining = maxStudents - currentStudentCount;

  // ── Parse CSV ──────────────────────────────────────────────────────
  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Skip header
    const parsed = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      const [lastName = '', firstName = '', middleName = '', lrn = '', gender = '', gradeLevelStr = ''] = cols;
      const gradeLevel = parseInt(gradeLevelStr, 10);
      const row: ParsedRow = {
        lastName,
        firstName,
        middleName,
        lrn,
        gender,
        gradeLevel: isNaN(gradeLevel) ? 0 : gradeLevel,
        raw: line,
      };
      // Validation
      if (!lastName && !firstName) row.error = 'Name is required';
      else if (lrn && !/^\d{12}$/.test(lrn)) row.error = 'LRN must be exactly 12 digits';
      else if (gradeLevel < 1 || gradeLevel > 12) row.error = 'Grade level must be 1-12';
      return row;
    });

    // Check for duplicate LRNs within the same file
    const lrnsSeen = new Set<string>();
    for (const row of parsed) {
      if (row.error || !row.lrn) continue;
      if (lrnsSeen.has(row.lrn)) {
        row.error = 'Duplicate LRN in file';
      } else {
        lrnsSeen.add(row.lrn);
      }
    }

    return parsed;
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isExcel = /\.xlsx?$/i.test(file.name);
      const isCsv = /\.csv$/i.test(file.name);

      if (!isExcel && !isCsv) {
        setError('Please upload a .csv, .xls, or .xlsx file');
        return;
      }

      try {
        let parsed: ParsedRow[] = [];

        if (isExcel) {
          // Try SF1 format first
          const buffer = await file.arrayBuffer();
          const sf1Result = parseSF1Excel(buffer);

          if (sf1Result.success && sf1Result.students.length > 0) {
            // Store SF1 metadata for section creation during import
            if (sf1Result.metadata) setSf1Metadata(sf1Result.metadata);
            // Convert SF1 students to ParsedRows
            parsed = sf1Result.students.map((s) => ({
              lastName: s.lastName,
              firstName: s.firstName,
              middleName: s.middleName,
              lrn: s.lrn,
              gender: s.sex === 'M' ? 'Male' : 'Female',
              gradeLevel: sf1Result.metadata?.gradeLevel || 0,
              birthDate: s.birthDate || undefined,
              raw: s.fullName,
              error: s.isValid ? undefined : s.validationErrors.join('; '),
            }));
          } else {
            // Fallback: treat as generic Excel with headers in row 1
            const wb = XLSX.read(buffer, { type: 'array', raw: false });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const jsonRows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            parsed = jsonRows.map((row) => {
              const keys = Object.keys(row);
              // Try to match common header names
              const get = (patterns: RegExp[]) => {
                for (const p of patterns) {
                  const k = keys.find((k) => p.test(k));
                  if (k && row[k]) return String(row[k]).trim();
                }
                return '';
              };
              const lastName = get([/last/i]) || get([/surname/i]);
              const firstName = get([/first/i]);
              const middleName = get([/middle/i]);
              const lrn = get([/lrn/i]);
              const gender = get([/sex|gender/i]);
              const gradeLevelStr = get([/grade/i]);
              const gradeLevel = parseInt(gradeLevelStr, 10);
              const r: ParsedRow = {
                lastName,
                firstName,
                middleName,
                lrn,
                gender,
                gradeLevel: isNaN(gradeLevel) ? 0 : gradeLevel,
                raw: Object.values(row).join(','),
              };
              if (!lastName && !firstName) r.error = 'Name is required';
              else if (lrn && !/^\d{12}$/.test(lrn)) r.error = 'LRN must be exactly 12 digits';
              else if (gradeLevel < 1 || gradeLevel > 12) r.error = 'Grade level must be 1-12';
              return r;
            });
          }
        } else {
          // CSV parsing
          const text = await file.text();
          parsed = parseCSV(text);
        }

        if (parsed.length === 0) {
          setError('No data rows found in the file.');
          return;
        }
        setRows(parsed);
        setError(null);
        setStep('preview');
      } catch (err: any) {
        setError(`Error reading file: ${err.message}`);
      }
    },
    [parseCSV],
  );

  const validRows = rows.filter((r) => !r.error);
  const invalidRows = rows.filter((r) => r.error);
  const rowsToImport = validRows.slice(0, remaining); // enforce cap
  const cappedCount = validRows.length - rowsToImport.length;

  // ── Import ─────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setStep('importing');
    setProgress(0);
    setSkippedCount(0);
    let imported = 0;
    let skipped = 0;
    const failed: string[] = [];

    // Pre-check: find LRNs that already exist in OTHER schools
    const lrnsToCheck = rowsToImport.filter(r => r.lrn).map(r => r.lrn);
    let crossSchoolLRNs = new Set<string>();
    if (lrnsToCheck.length > 0) {
      const { duplicates } = await checkDuplicateLRNs(lrnsToCheck);
      // Only flag LRNs that exist in a DIFFERENT school
      crossSchoolLRNs = new Set(
        duplicates
          .filter(d => d.existingSchoolId !== schoolId)
          .map(d => d.lrn)
      );
    }

    // Resolve section: lookup or create from SF1 metadata
    let sectionId: string | null = null;
    if (sf1Metadata?.sectionName && sf1Metadata.gradeLevel != null) {
      const sy = sf1Metadata.schoolYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      // Try to find existing section
      const { data: existing } = await supabase
        .from('sections')
        .select('id')
        .eq('school_id', schoolId)
        .eq('grade_level', sf1Metadata.gradeLevel)
        .ilike('name', sf1Metadata.sectionName)
        .is('deleted_at', null)
        .maybeSingle();
      if (existing) {
        sectionId = existing.id;
      } else {
        // Create section
        const { data: created } = await supabase
          .from('sections')
          .insert({
            school_id: schoolId,
            name: sf1Metadata.sectionName,
            grade_level: sf1Metadata.gradeLevel,
            school_year: sy,
          })
          .select('id')
          .single();
        if (created) sectionId = created.id;
      }
    }

    for (let i = 0; i < rowsToImport.length; i++) {
      const r = rowsToImport[i];
      const name = [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');
      const rowData: Record<string, unknown> = {
        school_id: schoolId,
        first_name: r.firstName,
        last_name: r.lastName,
        middle_name: r.middleName || null,
        name,
        lrn: r.lrn || null,
        gender: r.gender || null,
        grade_level: r.gradeLevel,
        enrollment_status: 'enrolled',
      };
      if (sectionId) rowData.section_id = sectionId;
      if (r.birthDate) rowData.date_of_birth = r.birthDate;

      // Use upsert for students with LRN (updates existing records on conflict)
      if (r.lrn) {
        // Skip LRNs that belong to a different school to prevent cross-tenant overwrites
        if (crossSchoolLRNs.has(r.lrn)) {
          failed.push(`${r.firstName} ${r.lastName}: LRN ${r.lrn} already registered at another school`);
          skipped++;
          setProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
          continue;
        }
        const { error: upsertErr } = await supabase
          .from('students')
          .upsert(rowData, { onConflict: 'school_id,lrn' });
        if (upsertErr) {
          failed.push(`${r.firstName} ${r.lastName}: ${upsertErr.message}`);
        } else {
          imported++;
        }
      } else {
        // No LRN — plain insert
        const { error: insertErr } = await supabase.from('students').insert(rowData);
        if (insertErr) {
          failed.push(`${r.firstName} ${r.lastName}: ${insertErr.message}`);
        } else {
          imported++;
        }
      }
      setProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
    }

    setImportedCount(imported);
    setSkippedCount(skipped);
    setFailedRows(failed);
    setStep('complete');
  }, [rowsToImport, schoolId, sf1Metadata]);

  // ── Download template ──────────────────────────────────────────────
  const downloadTemplate = useCallback(() => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Students</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload a CSV or DepEd SF1 Excel file
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          {/* ── UPLOAD STEP ── */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Tier limit notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
                <strong>Student limit:</strong> You can import up to <strong>{remaining}</strong> more students ({currentStudentCount}/{maxStudents} used).
              </div>

              {/* Expected format */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Supported Formats</h3>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li><strong>DepEd SF1 Excel</strong> (.xls / .xlsx) — official School Form 1 files</li>
                  <li><strong>Plain CSV</strong> — with columns: Last Name, First Name, Middle Name, LRN, Gender, Grade Level</li>
                </ul>
                <button onClick={downloadTemplate} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download CSV template
                </button>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
              >
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Click to select a file</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Supports .xls, .xlsx, and .csv files</p>
                <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="hidden" onChange={handleFileChange} />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── PREVIEW STEP ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{rowsToImport.length}</div>
                  <div className="text-xs text-green-700 dark:text-green-400">Ready to import</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-600">{invalidRows.length}</div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-400">Invalid (skipped)</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{rows.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total rows</div>
                </div>
              </div>

              {cappedCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
                  <strong>{cappedCount} students</strong> will be skipped due to your plan's {maxStudents}-student limit. Upgrade to Pro for unlimited students.
                </div>
              )}

              {/* Preview table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">LRN</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Gender</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Grade</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className={r.error ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-200">{r.firstName} {r.lastName}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{r.lrn || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.gender || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.gradeLevel || '—'}</td>
                        <td className="px-3 py-2">
                          {r.error ? (
                            <span className="text-xs text-red-600 dark:text-red-400">{r.error}</span>
                          ) : (
                            <span className="text-xs text-green-600 dark:text-green-400">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="text-xs text-center text-gray-400 py-2">Showing first 50 of {rows.length} rows</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setStep('upload'); setRows([]); setError(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={rowsToImport.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Import {rowsToImport.length} Students
                </button>
              </div>
            </div>
          )}

          {/* ── IMPORTING STEP ── */}
          {step === 'importing' && (
            <div className="text-center py-8 space-y-4">
              <svg className="animate-spin w-10 h-10 mx-auto text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Importing students…</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 max-w-md mx-auto">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-gray-500">{progress}%</p>
            </div>
          )}

          {/* ── COMPLETE STEP ── */}
          {step === 'complete' && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Import Complete</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{importedCount}</div>
                  <div className="text-xs text-green-700 dark:text-green-400">Imported / Updated</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-amber-600">{skippedCount}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-400">Skipped</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">{failedRows.length}</div>
                  <div className="text-xs text-red-700 dark:text-red-400">Failed</div>
                </div>
              </div>

              {failedRows.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Failed rows:</p>
                  {failedRows.map((msg, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">{msg}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => { onImportComplete(); onClose(); }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCSVImport;
