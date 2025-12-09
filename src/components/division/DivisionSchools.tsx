/**
 * DivisionSchools - View schools in the division
 * 
 * Displays all schools accessible to the division user with:
 * - Student and teacher counts per school (server-side aggregation via RPC)
 * - District grouping
 * - Quick navigation to school data
 * - Summary statistics
 * - Debounced search for better performance
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../../hooks/useDebounce';
import { AcademicCapIcon, TargetIcon, UserGroupIcon, ArrowPathIcon, SearchIcon } from '../../../components/icons';
import { SummaryCardSkeleton } from './common';

interface SchoolStats {
  school_id: string;
  student_count: number;
  teacher_count: number;
}

interface SchoolWithStats {
  id: string;
  name: string;
  school_id_number?: string;
  district?: string;
  address?: string;
  principal_name?: string;
  student_count: number;
  teacher_count: number;
}

const DivisionSchools: React.FC = () => {
  const { 
    division, 
    accessibleSchools, 
    filteredSchools: contextFilteredSchools,
    selectedSchoolId, 
    selectSchool, 
    loading: contextLoading 
  } = useDivisionContext();

  const [schoolStats, setSchoolStats] = useState<Map<string, SchoolStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Summary counts (from server-side aggregation)
  const [summaryCounts, setSummaryCounts] = useState({
    totalStudents: 0,
    totalTeachers: 0,
  });
  
  // Debounce search input
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Use global district filter, then apply search
  const filteredSchools = useMemo(() => {
    // Start with context-filtered schools (already filtered by global district)
    let schools = selectedSchoolId
      ? accessibleSchools.filter(s => s.id === selectedSchoolId)
      : contextFilteredSchools;

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      schools = schools.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.school_id_number?.toLowerCase().includes(query) ||
        s.district?.toLowerCase().includes(query)
      );
    }

    return schools;
  }, [accessibleSchools, contextFilteredSchools, selectedSchoolId, debouncedSearch]);

  // Fetch all data using RPC (single API call) with fallback to multiple queries
  const fetchAllData = useCallback(async () => {
    if (!division?.id || contextFilteredSchools.length === 0) {
      setLoading(false);
      setSummaryCounts({ totalStudents: 0, totalTeachers: 0 });
      return;
    }

    try {
      setLoading(true);
      
      // Use filtered school IDs based on global district filter
      const schoolIdsToFetch = contextFilteredSchools.map(s => s.id);
      
      // Try RPC first for optimal performance
      const { data, error } = await supabase.rpc('get_division_schools_stats', {
        p_division_id: division.id,
        p_school_ids: schoolIdsToFetch,
      });

      // Check if RPC function exists
      if (error?.code === '42883' || error?.code === 'PGRST202' || 
          (error?.message?.includes('function') && (error?.message?.includes('does not exist') || error?.message?.includes('schema cache')))) {
        console.warn('[DivisionSchools] RPC not deployed, using fallback');
        await fetchStatsFallback();
        return;
      }

      if (error) {
        console.error('[DivisionSchools] RPC error:', error);
        await fetchStatsFallback();
        return;
      }

      // Process RPC result
      console.log('[DivisionSchools] RPC returned data for', data?.total_schools, 'schools');
      
      setSummaryCounts({
        totalStudents: data?.total_students || 0,
        totalTeachers: data?.total_teachers || 0,
      });

      // Build stats map from RPC result
      const stats = new Map<string, SchoolStats>();
      (data?.schools || []).forEach((school: { school_id: string; student_count: number; teacher_count: number }) => {
        stats.set(school.school_id, {
          school_id: school.school_id,
          student_count: school.student_count,
          teacher_count: school.teacher_count,
        });
      });
      setSchoolStats(stats);

    } catch (err) {
      console.error('[DivisionSchools] Error:', err);
      await fetchStatsFallback();
    } finally {
      setLoading(false);
    }
  }, [division?.id, contextFilteredSchools]);

  // Fallback: Fetch using multiple queries (for when RPC is not deployed)
  const fetchStatsFallback = useCallback(async () => {
    if (contextFilteredSchools.length === 0) {
      setSummaryCounts({ totalStudents: 0, totalTeachers: 0 });
      return;
    }

    const schoolIds = contextFilteredSchools.map(s => s.id);

    try {
      // Fetch summary counts
      const [studentsResult, teachersResult] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .in('school_id', schoolIds)
          .is('deleted_at', null)
          .eq('enrollment_status', 'enrolled'),
        supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .in('school_id', schoolIds)
          .is('deleted_at', null),
      ]);

      setSummaryCounts({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
      });

      // Initialize stats with zeros
      const stats = new Map<string, SchoolStats>();
      schoolIds.forEach(id => {
        stats.set(id, { school_id: id, student_count: 0, teacher_count: 0 });
      });

      // Fetch counts per school in batches
      const batchSize = 10;
      for (let i = 0; i < schoolIds.length; i += batchSize) {
        const batch = schoolIds.slice(i, i + batchSize);
        
        const countPromises = batch.flatMap(schoolId => [
          supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .is('deleted_at', null)
            .eq('enrollment_status', 'enrolled')
            .then(result => ({ schoolId, type: 'students', count: result.count || 0 })),
          supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .is('deleted_at', null)
            .then(result => ({ schoolId, type: 'teachers', count: result.count || 0 })),
        ]);

        const results = await Promise.all(countPromises);
        
        results.forEach(({ schoolId, type, count }) => {
          const stat = stats.get(schoolId);
          if (stat) {
            if (type === 'students') stat.student_count = count;
            else stat.teacher_count = count;
          }
        });
      }

      setSchoolStats(stats);
    } catch (err) {
      console.error('[DivisionSchools] Fallback error:', err);
    }
  }, [contextFilteredSchools]);

  useEffect(() => {
    if (!contextLoading) {
      fetchAllData();
    }
  }, [fetchAllData, contextLoading]);

  // Map schools with stats
  const schoolsWithStats: SchoolWithStats[] = useMemo(() => {
    return filteredSchools.map(school => {
      const stats = schoolStats.get(school.id);
      return {
        ...school,
        student_count: stats?.student_count || 0,
        teacher_count: stats?.teacher_count || 0,
      };
    });
  }, [filteredSchools, schoolStats]);

  // Summary statistics - use contextFilteredSchools for filtered counts
  const summary = useMemo(() => {
    return {
      totalSchools: contextFilteredSchools.length,
      totalStudents: summaryCounts.totalStudents,
      totalTeachers: summaryCounts.totalTeachers,
      districts: new Set(contextFilteredSchools.map(s => s.district).filter(Boolean)).size,
    };
  }, [contextFilteredSchools, summaryCounts]);

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Schools</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and view schools in your division
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => fetchAllData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <span className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><ArrowPathIcon /></span>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {contextLoading ? (
        <SummaryCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Schools</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalSchools}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalStudents.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Teachers</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalTeachers.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Districts</p>
            <p className="text-2xl font-bold text-amber-600">{summary.districts}</p>
          </div>
        </div>
      )}

      {/* School Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 rounded-b-xl">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolsWithStats.map(school => (
          <div
            key={school.id}
            className={`bg-white dark:bg-slate-800 rounded-xl border transition-all cursor-pointer ${
              selectedSchoolId === school.id
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
            onClick={() => selectSchool(selectedSchoolId === school.id ? null : school.id)}
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="w-6 h-6 text-blue-600 dark:text-blue-400"><AcademicCapIcon /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {school.name}
                  </h3>
                  {school.school_id_number && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      ID: {school.school_id_number}
                    </p>
                  )}
                  {school.district && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <span className="w-4 h-4"><TargetIcon /></span>
                      {school.district}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 rounded-b-xl">
              <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="w-4 h-4"><AcademicCapIcon /></span>
                <span className="font-medium">{school.student_count.toLocaleString()}</span>
                <span className="text-slate-400">students</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="w-4 h-4"><UserGroupIcon /></span>
                <span className="font-medium">{school.teacher_count}</span>
                <span className="text-slate-400">teachers</span>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {!loading && filteredSchools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4"><AcademicCapIcon /></div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Schools Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {searchQuery 
              ? 'No schools match your search criteria.'
              : 'No schools are assigned to your account.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DivisionSchools;
