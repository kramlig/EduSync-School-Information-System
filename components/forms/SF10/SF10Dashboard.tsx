/**
 * SF10 Dashboard — Learner Permanent Academic Record
 * 
 * Entry point for generating and viewing SF10-ES (Elementary) and SF10-JHS (Junior HS).
 * Fetches students from PostgreSQL, checks for existing Form 137 records, 
 * and renders the official DepEd form layout.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { generateForm137FromSystemData } from '../../../services/form137Generator';
import type { AcademicHistory } from '../shared/FormTypes';
import { SF10ElementaryView } from './SF10ElementaryView';
import { SF10JHSView } from './SF10JHSView';
import {
  Badge,
  EmptyState
} from '../shared/FormComponents';
import {
  CardSkeleton
} from '../shared/LoadingStates';
import { AcademicCapIcon } from '../../icons';

/** Infer the Student type returned by the hook */
type HookStudent = ReturnType<typeof useStudentsPostgreSQL>['students'][number];

type FormVariant = 'ES' | 'JHS';

/**
 * Determines which SF10 variant to show based on grade level
 */
function getVariant(gradeLevel: number | string | undefined): FormVariant {
  const gl = typeof gradeLevel === 'string' ? parseInt(gradeLevel, 10) : (gradeLevel ?? 7);
  if (gl >= 1 && gl <= 6) return 'ES';
  return 'JHS';
}

// Icons
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 3.75H5.25" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

export const SF10Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { schoolId: rawSchoolId } = useSchoolContext();
  const schoolId = rawSchoolId ?? undefined;
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId, includeSection: true });
  const { sections } = useSectionsPostgreSQL({ schoolId });

  // State
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedStudent, setSelectedStudent] = useState<HookStudent | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AcademicHistory | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGradeLevel, setFilterGradeLevel] = useState<number | 'all'>('all');
  const [filterVariant, setFilterVariant] = useState<FormVariant | 'all'>('all');

  // Memoize to prevent infinite loops
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const gl = typeof s.gradeLevel === 'string' ? parseInt(s.gradeLevel, 10) : s.gradeLevel;
      if (filterGradeLevel !== 'all' && gl !== filterGradeLevel) return false;
      if (filterVariant !== 'all') {
        const v = getVariant(s.gradeLevel);
        if (v !== filterVariant) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = s.name?.toLowerCase().includes(q);
        const lrnMatch = s.lrn?.toLowerCase().includes(q);
        if (!nameMatch && !lrnMatch) return false;
      }
      return true;
    });
  }, [students, filterGradeLevel, filterVariant, searchQuery]);

  const gradeLevels = useMemo(() => {
    if (!students) return [];
    const levels = [...new Set(students.map(s => {
      const gl = typeof s.gradeLevel === 'string' ? parseInt(s.gradeLevel, 10) : (s.gradeLevel ?? 0);
      return gl;
    }))].sort((a, b) => a - b);
    return levels;
  }, [students]);

  /** Generate SF10 record from PostgreSQL data (no Firestore dependency) */
  const handleViewSF10 = useCallback(async (student: HookStudent) => {
    setError(null);
    setSelectedStudent(student);
    setGenerating(true);

    try {
      const result = await generateForm137FromSystemData({ studentId: student.id });

      if (result.success) {
        // Use generated data directly (new record) or existing record from generator
        const record: AcademicHistory | undefined = result.data
          ? { id: `sf10-${student.id}`, ...result.data }
          : result.existingRecord;

        if (record) {
          setSelectedRecord(record);
          setView('form');
        } else {
          setError('No academic data found for this student.');
        }
      } else {
        setError(result.error || 'Failed to generate SF10 record. Make sure grades are entered.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading the record.');
    } finally {
      setGenerating(false);
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedRecord(null);
    setSelectedStudent(null);
    setError(null);
  }, []);

  // Render form view
  if (view === 'form' && selectedRecord && selectedStudent) {
    const variant = getVariant(selectedStudent.gradeLevel);

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
        {/* Toolbar */}
        <div className="sf10-no-print sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon /> Back to Student List
          </button>

          <div className="flex items-center gap-3">
            <Badge
              label={variant === 'ES' ? 'SF10-ES (Elementary)' : 'SF10-JHS (Junior HS)'}
              color="blue"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {selectedStudent.name} — LRN: {selectedStudent.lrn || 'N/A'}
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PrinterIcon /> Print SF10
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4">
          {variant === 'ES' ? (
            <SF10ElementaryView record={selectedRecord} schoolInfo={{
              district: (selectedRecord as any).district,
              division: (selectedRecord as any).division,
              region: (selectedRecord as any).region,
            }} />
          ) : (
            <SF10JHSView record={selectedRecord} schoolInfo={{
              district: (selectedRecord as any).district,
              division: (selectedRecord as any).division,
              region: (selectedRecord as any).region,
            }} />
          )}
        </div>
      </div>
    );
  }

  // Render list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/school-forms')}
            className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
          >
            <ArrowLeftIcon /> Back to School Forms
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
              <div className="w-8 h-8 text-white"><AcademicCapIcon /></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                SF10 — Learner Permanent Academic Record
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate official DepEd SF10 forms (formerly Form 137) for elementary and junior high school students
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name or LRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Grade Level Filter */}
            <select
              aria-label="Filter by grade level"
              value={filterGradeLevel}
              onChange={(e) => setFilterGradeLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Grades</option>
              {gradeLevels.map(gl => (
                <option key={gl} value={gl}>Grade {gl}</option>
              ))}
            </select>

            {/* Variant Filter */}
            <select
              aria-label="Filter by form variant"
              value={filterVariant}
              onChange={(e) => setFilterVariant(e.target.value as FormVariant | 'all')}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Variants</option>
              <option value="ES">SF10-ES (Elementary)</option>
              <option value="JHS">SF10-JHS (Junior HS)</option>
            </select>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {studentsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!studentsLoading && filteredStudents.length === 0 && (
          <EmptyState
            icon={<div className="w-16 h-16"><AcademicCapIcon /></div>}
            title="No Students Found"
            message="No students match your filters. Try adjusting the search or grade level filter."
          />
        )}

        {/* Student List */}
        {!studentsLoading && filteredStudents.length > 0 && (
          <div className="grid gap-3">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Student</div>
              <div className="col-span-2">LRN</div>
              <div className="col-span-1">Grade</div>
              <div className="col-span-2">Section</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {filteredStudents.map((student) => {
              const variant = getVariant(student.gradeLevel);
              const sectionName = sections?.find(s => s.id === student.sectionId)?.name || student.sectionName || '—';

              return (
                <div
                  key={student.id}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="col-span-4">
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{student.name}</div>
                  </div>
                  <div className="col-span-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {student.lrn || '—'}
                  </div>
                  <div className="col-span-1">
                    <Badge label={`G${student.gradeLevel ?? ''}`} color="blue" size="sm" />
                  </div>
                  <div className="col-span-2 text-sm text-slate-600 dark:text-slate-400">
                    {sectionName}
                  </div>
                  <div className="col-span-1">
                    <Badge
                      label={variant}
                      color={variant === 'ES' ? 'green' : 'purple'}
                      size="sm"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleViewSF10(student)}
                      disabled={generating && selectedStudent?.id === student.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                    >
                      {generating && selectedStudent?.id === student.id ? (
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <EyeIcon />
                      )}
                      View SF10
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SF10Dashboard;
