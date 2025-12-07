/**
 * DivisionPersonnel - View personnel (SF7) across division schools
 * 
 * Displays personnel data from teachers table with:
 * - Multi-school aggregation for division users
 * - Filtering by position, employment status, school
 * - Search by name/employee number
 * - Export to CSV functionality
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { UserGroupIcon, ArrowDownTrayIcon, FunnelIcon, SearchIcon, ArrowPathIcon } from '../../../components/icons';

// Personnel types
type PositionType = 'teacher_i' | 'teacher_ii' | 'teacher_iii' | 'master_teacher_i' | 'master_teacher_ii' | 
                    'principal_i' | 'principal_ii' | 'principal_iii' | 'principal_iv' |
                    'head_teacher_i' | 'head_teacher_ii' | 'head_teacher_iii' | 'other';
type EmploymentStatus = 'permanent' | 'temporary' | 'substitute' | 'contract' | 'volunteer';

interface PersonnelRecord {
  id: string;
  school_id: string;
  school_name?: string;
  employee_number?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position: PositionType;
  employment_status: EmploymentStatus;
  date_hired?: string;
  highest_education?: string;
  major_specialization?: string;
}

interface PersonnelFilter {
  position?: PositionType;
  employment_status?: EmploymentStatus;
  search?: string;
}

interface PersonnelSummary {
  total: number;
  by_position: Record<string, number>;
  by_status: Record<string, number>;
  by_school: Record<string, number>;
}

const POSITION_LABELS: Record<PositionType, string> = {
  teacher_i: 'Teacher I',
  teacher_ii: 'Teacher II',
  teacher_iii: 'Teacher III',
  master_teacher_i: 'Master Teacher I',
  master_teacher_ii: 'Master Teacher II',
  principal_i: 'Principal I',
  principal_ii: 'Principal II',
  principal_iii: 'Principal III',
  principal_iv: 'Principal IV',
  head_teacher_i: 'Head Teacher I',
  head_teacher_ii: 'Head Teacher II',
  head_teacher_iii: 'Head Teacher III',
  other: 'Other',
};

const STATUS_LABELS: Record<EmploymentStatus, string> = {
  permanent: 'Permanent',
  temporary: 'Temporary',
  substitute: 'Substitute',
  contract: 'Contractual',
  volunteer: 'Volunteer',
};

const DivisionPersonnel: React.FC = () => {
  const { accessibleSchools, selectedSchoolId, hasPermission, loading: contextLoading } = useDivisionContext();

  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PersonnelFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const canExport = hasPermission('personnel', 'export');

  // Memoize school IDs to prevent unnecessary re-fetches
  const schoolIds = useMemo(() => {
    if (selectedSchoolId) return [selectedSchoolId];
    return accessibleSchools.map(s => s.id);
  }, [selectedSchoolId, accessibleSchools]);

  // Fetch personnel data
  const fetchPersonnel = useCallback(async () => {
    if (schoolIds.length === 0) {
      setPersonnel([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('teachers')
        .select(`
          id,
          school_id,
          employee_number,
          name,
          first_name,
          last_name,
          email,
          phone,
          position,
          employment_status,
          date_hired,
          highest_education,
          major_specialization,
          schools(name)
        `)
        .in('school_id', schoolIds)
        .is('deleted_at', null);

      // Apply filters
      if (filter.position) {
        query = query.eq('position', filter.position);
      }
      if (filter.employment_status) {
        query = query.eq('employment_status', filter.employment_status);
      }
      if (filter.search) {
        const searchTerm = `%${filter.search.toLowerCase()}%`;
        query = query.or(`name.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},employee_number.ilike.${searchTerm}`);
      }

      const { data, error: fetchError } = await query.order('name', { ascending: true });

      if (fetchError) throw fetchError;

      // Map data with school names
      const mappedData: PersonnelRecord[] = (data || []).map(teacher => {
        const schoolData = Array.isArray(teacher.schools) ? teacher.schools[0] : teacher.schools;
        return {
          id: teacher.id,
          school_id: teacher.school_id,
          school_name: schoolData?.name || 'Unknown School',
        employee_number: teacher.employee_number,
        name: teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        position: teacher.position as PositionType || 'other',
        employment_status: teacher.employment_status as EmploymentStatus || 'permanent',
        date_hired: teacher.date_hired,
        highest_education: teacher.highest_education,
        major_specialization: teacher.major_specialization,
      };
      });

      setPersonnel(mappedData);
    } catch (err) {
      console.error('[DivisionPersonnel] Error fetching personnel:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch personnel data');
    } finally {
      setLoading(false);
    }
  }, [schoolIds, filter]);

  useEffect(() => {
    if (!contextLoading) {
      fetchPersonnel();
    }
  }, [fetchPersonnel, contextLoading]);

  // Calculate summary statistics
  const summary: PersonnelSummary = useMemo(() => {
    const result: PersonnelSummary = {
      total: personnel.length,
      by_position: {},
      by_status: {},
      by_school: {},
    };

    personnel.forEach(p => {
      // By position
      result.by_position[p.position] = (result.by_position[p.position] || 0) + 1;
      // By status
      result.by_status[p.employment_status] = (result.by_status[p.employment_status] || 0) + 1;
      // By school
      const schoolName = p.school_name || 'Unknown';
      result.by_school[schoolName] = (result.by_school[schoolName] || 0) + 1;
    });

    return result;
  }, [personnel]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!canExport || personnel.length === 0) return;

    const headers = ['Name', 'Employee Number', 'Position', 'Employment Status', 'School', 'Email', 'Date Hired'];
    const rows = personnel.map(p => [
      p.name,
      p.employee_number || '',
      POSITION_LABELS[p.position] || p.position,
      STATUS_LABELS[p.employment_status] || p.employment_status,
      p.school_name || '',
      p.email || '',
      p.date_hired || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personnel-sf7-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canExport, personnel]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PersonnelFilter, value: string | undefined) => {
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
            Personnel Data (SF7)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {summary.total} personnel across {selectedSchoolId ? '1 school' : `${accessibleSchools.length} schools`}
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
            onClick={fetchPersonnel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><ArrowPathIcon /></span>
            Refresh
          </button>
          
          {canExport && (
            <button 
              onClick={handleExport}
              disabled={personnel.length === 0}
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
                placeholder="Search by name or ID..."
                value={filter.search || ''}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Position Filter */}
            <select
              value={filter.position || ''}
              onChange={e => handleFilterChange('position', e.target.value as PositionType)}
              aria-label="Filter by position"
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Positions</option>
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Employment Status Filter */}
            <select
              value={filter.employment_status || ''}
              onChange={e => handleFilterChange('employment_status', e.target.value as EmploymentStatus)}
              aria-label="Filter by employment status"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Personnel</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Permanent</p>
          <p className="text-2xl font-bold text-green-600">{summary.by_status['permanent'] || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Temporary</p>
          <p className="text-2xl font-bold text-amber-600">{summary.by_status['temporary'] || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Schools</p>
          <p className="text-2xl font-bold text-blue-600">{Object.keys(summary.by_school).length}</p>
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
            <p className="text-slate-500 dark:text-slate-400">Loading personnel data...</p>
          </div>
        ) : personnel.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4"><UserGroupIcon /></div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Personnel Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {filter.search || filter.position || filter.employment_status
                ? 'Try adjusting your filters'
                : 'No personnel records in the selected schools'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employee #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">School</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {personnel.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-sm">
                      {p.employee_number || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {POSITION_LABELS[p.position] || p.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        p.employment_status === 'permanent' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {STATUS_LABELS[p.employment_status] || p.employment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm max-w-[200px] truncate">
                      {p.school_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                      {p.email || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionPersonnel;
