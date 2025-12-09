/**
 * DivisionEnrollment - View enrollment (SF1) across division schools
 * 
 * Displays student enrollment data with:
 * - Multi-school aggregation for division users
 * - Filtering by grade level, enrollment status, school
 * - Search by name or LRN (debounced)
 * - Export to CSV functionality
 * - Server-side pagination for performance
 * - Skeleton loaders for better UX
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../../hooks/useDebounce';
import { DocumentTextIcon, ArrowDownTrayIcon, FunnelIcon, SearchIcon, ArrowPathIcon } from '../../../components/icons';
import { TableSkeleton, Pagination, SummaryCardSkeleton } from './common';

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
  district?: string;  // Filter by district name
  school_id?: string; // Filter by specific school
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
  const { 
    division, 
    accessibleSchools, 
    selectedSchoolId, 
    selectedDistrict,
    hasPermission, 
    loading: contextLoading 
  } = useDivisionContext();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EnrollmentFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  
  // Summary counts (fetched from server)
  const [summaryCounts, setSummaryCounts] = useState<{
    total: number;
    male: number;
    female: number;
    enrolled: number;
    schoolCount: number;
  }>({ total: 0, male: 0, female: 0, enrolled: 0, schoolCount: 0 });

  const canExport = hasPermission('enrollment', 'export');
  
  // Debounce search input (300ms delay)
  const debouncedSearch = useDebounce(filter.search || '', 300);

  // Get unique districts from accessible schools
  const districts = useMemo(() => {
    const districtSet = new Set<string>();
    accessibleSchools.forEach(s => {
      if (s.district) districtSet.add(s.district);
    });
    return Array.from(districtSet).sort();
  }, [accessibleSchools]);

  // Get schools filtered by selected district (from sidebar global filter)
  const filteredSchools = useMemo(() => {
    // Use global district filter from context, or local filter
    const activeDistrict = selectedDistrict || filter.district;
    if (!activeDistrict) return accessibleSchools;
    return accessibleSchools.filter(s => s.district === activeDistrict);
  }, [accessibleSchools, filter.district, selectedDistrict]);

  // Memoize school IDs to prevent unnecessary re-fetches
  const schoolIds = useMemo(() => {
    // If a specific school is selected in filter, use that
    if (filter.school_id) return [filter.school_id];
    // If context-level school is selected, use that
    if (selectedSchoolId) return [selectedSchoolId];
    // Use the filtered schools (already filtered by global or local district)
    return filteredSchools.map(s => s.id);
  }, [selectedSchoolId, filteredSchools, filter.school_id]);

  // Fetch summary counts using RPC for single API call (4 calls → 1 call)
  const fetchSummaryCounts = useCallback(async () => {
    if (schoolIds.length === 0 || !division?.id) {
      setSummaryCounts({ total: 0, male: 0, female: 0, enrolled: 0, schoolCount: 0 });
      return;
    }

    try {
      // Try RPC first (single API call)
      const { data, error } = await supabase.rpc('get_division_enrollment_counts', {
        p_division_id: division.id,
        p_school_ids: schoolIds.length < accessibleSchools.length ? schoolIds : null,
      });

      // Check if RPC exists
      if (error?.code === '42883' || error?.code === 'PGRST202' ||
          (error?.message?.includes('function') && error?.message?.includes('does not exist'))) {
        console.warn('[DivisionEnrollment] RPC not available, using fallback');
        await fetchSummaryCountsFallback();
        return;
      }

      if (error) {
        console.error('[DivisionEnrollment] RPC error:', error);
        await fetchSummaryCountsFallback();
        return;
      }

      setSummaryCounts({
        total: data?.total || 0,
        male: data?.male || 0,
        female: data?.female || 0,
        enrolled: data?.enrolled || 0,
        schoolCount: data?.school_count || schoolIds.length,
      });
    } catch (err) {
      console.error('[DivisionEnrollment] Error fetching summary counts:', err);
      await fetchSummaryCountsFallback();
    }
  }, [schoolIds, division?.id, accessibleSchools.length]);

  // Fallback: fetch counts with multiple API calls
  const fetchSummaryCountsFallback = useCallback(async () => {
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds)
        .is('deleted_at', null);

      // Get male count
      const { count: maleCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds)
        .is('deleted_at', null)
        .eq('gender', 'Male');

      // Get female count
      const { count: femaleCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds)
        .is('deleted_at', null)
        .eq('gender', 'Female');

      // Get enrolled count
      const { count: enrolledCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds)
        .is('deleted_at', null)
        .eq('enrollment_status', 'enrolled');

      setSummaryCounts({
        total: totalCount || 0,
        male: maleCount || 0,
        female: femaleCount || 0,
        enrolled: enrolledCount || 0,
        schoolCount: schoolIds.length,
      });
    } catch (err) {
      console.error('[DivisionEnrollment] Fallback error:', err);
    }
  }, [schoolIds]);

  // Fetch student data with pagination
  const fetchStudents = useCallback(async () => {
    if (schoolIds.length === 0) {
      setStudents([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query with filters
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
        `, { count: 'exact' })
        .in('school_id', schoolIds)
        .is('deleted_at', null);

      // Apply filters
      if (filter.grade_level) {
        query = query.eq('grade_level', filter.grade_level);
      }
      if (filter.enrollment_status) {
        query = query.eq('enrollment_status', filter.enrollment_status);
      }
      if (debouncedSearch) {
        const searchTerm = `%${debouncedSearch.toLowerCase()}%`;
        query = query.or(`name.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},lrn.ilike.${searchTerm}`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error: fetchError, count } = await query
        .order('name', { ascending: true })
        .range(from, to);

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
      setTotal(count || 0);
    } catch (err) {
      console.error('[DivisionEnrollment] Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollment data');
    } finally {
      setLoading(false);
    }
  }, [schoolIds, filter.grade_level, filter.enrollment_status, debouncedSearch, page, pageSize]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (!contextLoading) {
      fetchStudents();
    }
  }, [fetchStudents, contextLoading]);

  // Fetch summary counts on school change
  useEffect(() => {
    if (!contextLoading) {
      fetchSummaryCounts();
    }
  }, [fetchSummaryCounts, contextLoading]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filter.grade_level, filter.enrollment_status, debouncedSearch, filter.district, filter.school_id]);

  // Clear school filter when district changes
  useEffect(() => {
    if (filter.district && filter.school_id) {
      const schoolInDistrict = accessibleSchools.find(
        s => s.id === filter.school_id && s.district === filter.district
      );
      if (!schoolInDistrict) {
        setFilter(prev => ({ ...prev, school_id: undefined }));
      }
    }
  }, [filter.district, filter.school_id, accessibleSchools]);

  // Export to CSV (exports all matching records)
  const handleExport = useCallback(async () => {
    if (!canExport) return;

    try {
      // For export, fetch all matching records (up to 10000)
      let query = supabase
        .from('students')
        .select(`
          id, school_id, lrn, name, first_name, last_name, gender, 
          grade_level, enrollment_status, schools(name), sections(name)
        `)
        .in('school_id', schoolIds)
        .is('deleted_at', null)
        .limit(10000);

      if (filter.grade_level) query = query.eq('grade_level', filter.grade_level);
      if (filter.enrollment_status) query = query.eq('enrollment_status', filter.enrollment_status);
      if (debouncedSearch) {
        const searchTerm = `%${debouncedSearch.toLowerCase()}%`;
        query = query.or(`name.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},lrn.ilike.${searchTerm}`);
      }

      const { data } = await query.order('name', { ascending: true });
      
      if (!data || data.length === 0) return;

      const headers = ['LRN', 'Name', 'Grade Level', 'Section', 'Sex', 'Status', 'School'];
      const rows = data.map(s => {
        const schoolData = Array.isArray(s.schools) ? s.schools[0] : s.schools;
        const sectionData = Array.isArray(s.sections) ? s.sections[0] : s.sections;
        return [
          s.lrn,
          s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          GRADE_LABELS[s.grade_level as number] || `Grade ${s.grade_level}`,
          sectionData?.name || '',
          s.gender || '',
          STATUS_LABELS[s.enrollment_status as EnrollmentStatus] || s.enrollment_status,
          schoolData?.name || '',
        ];
      });

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
    } catch (err) {
      console.error('[DivisionEnrollment] Export error:', err);
    }
  }, [canExport, schoolIds, filter.grade_level, filter.enrollment_status, debouncedSearch]);

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
            {summaryCounts.total.toLocaleString()} students across {selectedSchoolId ? '1 school' : `${accessibleSchools.length} schools`}
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
            onClick={() => { fetchStudents(); fetchSummaryCounts(); }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <span className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><ArrowPathIcon /></span>
            Refresh
          </button>
          
          {canExport && (
            <button 
              onClick={handleExport}
              disabled={total === 0}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

            {/* District Filter */}
            <select
              value={filter.district || ''}
              onChange={e => handleFilterChange('district', e.target.value || undefined)}
              aria-label="Filter by district"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* School Filter */}
            <select
              value={filter.school_id || ''}
              onChange={e => handleFilterChange('school_id', e.target.value || undefined)}
              aria-label="Filter by school"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Schools</option>
              {filteredSchools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

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
      {contextLoading ? (
        <SummaryCardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summaryCounts.total.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Male</p>
            <p className="text-2xl font-bold text-blue-600">{summaryCounts.male.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Female</p>
            <p className="text-2xl font-bold text-pink-600">{summaryCounts.female.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Enrolled</p>
            <p className="text-2xl font-bold text-green-600">{summaryCounts.enrolled.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Schools</p>
            <p className="text-2xl font-bold text-amber-600">{summaryCounts.schoolCount}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <TableSkeleton columns={7} rows={10} />
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
          <>
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
            </div>
            
            {/* Pagination */}
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DivisionEnrollment;
