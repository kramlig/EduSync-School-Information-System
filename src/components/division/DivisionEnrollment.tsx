/**
 * DivisionEnrollment - View enrollment (SF1) across division schools
 * 
 * Displays student enrollment data with:
 * - Multi-school aggregation for division users
 * - Filtering by grade level, enrollment status, school
 * - Search by name or LRN
 * - Export to CSV functionality
 * - Enrollment statistics by grade and school
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { DocumentTextIcon, ArrowDownTrayIcon, FunnelIcon, SearchIcon, ArrowPathIcon } from '../../../components/icons';

// Student types
type EnrollmentStatus = 'enrolled' | 'transferred' | 'dropped' | 'graduated';

interface StudentRecord {
  id: string;
  school_id: string;
  school_name?: string;
  lrn: string;
  name: string;
  first_name?: string;
  last_name?: string;
  sex?: 'Male' | 'Female';
  grade_level: number;
  section_name?: string;
  enrollment_status: EnrollmentStatus;
  date_of_birth?: string;
}

interface EnrollmentFilter {
  grade_level?: number;
  enrollment_status?: EnrollmentStatus;
  search?: string;
}

interface EnrollmentSummary {
  total: number;
  by_grade: Record<number, number>;
  by_status: Record<string, number>;
  by_school: Record<string, number>;
  by_sex: { male: number; female: number };
}

const GRADE_LABELS: Record<number, string> = {
  1: 'Grade 1',
  2: 'Grade 2',
  3: 'Grade 3',
  4: 'Grade 4',
  5: 'Grade 5',
  6: 'Grade 6',
  7: 'Grade 7',
  8: 'Grade 8',
  9: 'Grade 9',
  10: 'Grade 10',
  11: 'Grade 11',
  12: 'Grade 12',
};

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  enrolled: 'Enrolled',
  transferred: 'Transferred',
  dropped: 'Dropped',
  graduated: 'Graduated',
};

const DivisionEnrollment: React.FC = () => {
  const { accessibleSchools, selectedSchoolId, hasPermission, loading: contextLoading } = useDivisionContext();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EnrollmentFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const canExport = hasPermission('enrollment', 'export');

  // Memoize school IDs to prevent unnecessary re-fetches
  const schoolIds = useMemo(() => {
    if (selectedSchoolId) return [selectedSchoolId];
    return accessibleSchools.map(s => s.id);
  }, [selectedSchoolId, accessibleSchools]);

  // Fetch student data
  const fetchStudents = useCallback(async () => {
    if (schoolIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('students')
        .select(`
          id,
          school_id,
          lrn,
          name,
          first_name,
          last_name,
          gender,
          grade_level,
          section_id,
          enrollment_status,
          date_of_birth,
          schools(name),
          sections(name)
        `)
        .in('school_id', schoolIds)
        .is('deleted_at', null);

      // Apply filters
      if (filter.grade_level) {
        query = query.eq('grade_level', filter.grade_level);
      }
      if (filter.enrollment_status) {
        query = query.eq('enrollment_status', filter.enrollment_status);
      }
      if (filter.search) {
        const searchTerm = `%${filter.search.toLowerCase()}%`;
        query = query.or(`name.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},lrn.ilike.${searchTerm}`);
      }

      const { data, error: fetchError } = await query.order('name', { ascending: true }).limit(500);

      if (fetchError) throw fetchError;

      // Map data with school and section names
      const mappedData: StudentRecord[] = (data || []).map(student => {
        const schoolData = Array.isArray(student.schools) ? student.schools[0] : student.schools;
        const sectionData = Array.isArray(student.sections) ? student.sections[0] : student.sections;
        return {
          id: student.id,
          school_id: student.school_id,
          school_name: schoolData?.name || 'Unknown School',
          lrn: student.lrn,
          name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          first_name: student.first_name,
          last_name: student.last_name,
          sex: student.gender === 'Male' || student.gender === 'Female' ? student.gender : undefined,
          grade_level: Number(student.grade_level) || 0,
          section_name: sectionData?.name,
          enrollment_status: (student.enrollment_status as EnrollmentStatus) || 'enrolled',
          date_of_birth: student.date_of_birth,
        };
      });

      setStudents(mappedData);
    } catch (err) {
      console.error('[DivisionEnrollment] Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollment data');
    } finally {
      setLoading(false);
    }
  }, [schoolIds, filter]);

  useEffect(() => {
    if (!contextLoading) {
      fetchStudents();
    }
  }, [fetchStudents, contextLoading]);

  // Calculate summary statistics
  const summary: EnrollmentSummary = useMemo(() => {
    const result: EnrollmentSummary = {
      total: students.length,
      by_grade: {},
      by_status: {},
      by_school: {},
      by_sex: { male: 0, female: 0 },
    };

    students.forEach(s => {
      // By grade
      result.by_grade[s.grade_level] = (result.by_grade[s.grade_level] || 0) + 1;
      // By status
      result.by_status[s.enrollment_status] = (result.by_status[s.enrollment_status] || 0) + 1;
      // By school
      const schoolName = s.school_name || 'Unknown';
      result.by_school[schoolName] = (result.by_school[schoolName] || 0) + 1;
      // By sex
      if (s.sex === 'Male') result.by_sex.male++;
      else if (s.sex === 'Female') result.by_sex.female++;
    });

    return result;
  }, [students]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!canExport || students.length === 0) return;

    const headers = ['LRN', 'Name', 'Grade Level', 'Section', 'Sex', 'Status', 'School'];
    const rows = students.map(s => [
      s.lrn,
      s.name,
      GRADE_LABELS[s.grade_level] || `Grade ${s.grade_level}`,
      s.section_name || '',
      s.sex || '',
      STATUS_LABELS[s.enrollment_status] || s.enrollment_status,
      s.school_name || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment-sf1-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canExport, students]);

  // Handle filter changes
  const handleFilterChange = (key: keyof EnrollmentFilter, value: string | number | undefined) => {
    setFilter(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  if (contextLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 animate-spin text-blue-600"><ArrowPathIcon /></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Enrollment Data (SF1)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {summary.total} students across {selectedSchoolId ? '1 school' : `${accessibleSchools.length} schools`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'border-blue-500 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            } hover:bg-slate-50 dark:hover:bg-slate-700`}
          >
            <span className="w-4 h-4"><FunnelIcon /></span>
            Filter
          </button>
          
          <button
            onClick={fetchStudents}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><ArrowPathIcon /></span>
            Refresh
          </button>
          
          {canExport && (
            <button 
              onClick={handleExport}
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <span className="w-4 h-4"><ArrowDownTrayIcon /></span>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search by name or LRN..."
                value={filter.search || ''}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Grade Level Filter */}
            <select
              value={filter.grade_level || ''}
              onChange={e => handleFilterChange('grade_level', e.target.value ? Number(e.target.value) : undefined)}
              aria-label="Filter by grade level"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {Object.entries(GRADE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Enrollment Status Filter */}
            <select
              value={filter.enrollment_status || ''}
              onChange={e => handleFilterChange('enrollment_status', e.target.value as EnrollmentStatus)}
              aria-label="Filter by enrollment status"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => setFilter({})}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Male</p>
          <p className="text-2xl font-bold text-blue-600">{summary.by_sex.male}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Female</p>
          <p className="text-2xl font-bold text-pink-600">{summary.by_sex.female}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Enrolled</p>
          <p className="text-2xl font-bold text-green-600">{summary.by_status['enrolled'] || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Schools</p>
          <p className="text-2xl font-bold text-amber-600">{Object.keys(summary.by_school).length}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4"><ArrowPathIcon /></div>
            <p className="text-slate-500 dark:text-slate-400">Loading enrollment data...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4"><DocumentTextIcon /></div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Students Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {filter.search || filter.grade_level || filter.enrollment_status
                ? 'Try adjusting your filters'
                : 'No student records in the selected schools'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">LRN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Sex</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">School</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-slate-600 dark:text-slate-400">
                      {s.lrn}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {GRADE_LABELS[s.grade_level] || `Grade ${s.grade_level}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                      {s.section_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                      {s.sex || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        s.enrollment_status === 'enrolled' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : s.enrollment_status === 'transferred'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
                      }`}>
                        {STATUS_LABELS[s.enrollment_status] || s.enrollment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm max-w-[200px] truncate">
                      {s.school_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length >= 500 && (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                Showing first 500 results. Use filters to narrow down your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionEnrollment;
