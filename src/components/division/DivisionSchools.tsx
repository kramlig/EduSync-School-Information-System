/**
 * DivisionSchools - View schools in the division
 * 
 * Displays all schools accessible to the division user with:
 * - Student and teacher counts per school
 * - District grouping
 * - Quick navigation to school data
 * - Summary statistics
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { AcademicCapIcon, TargetIcon, UserGroupIcon, ArrowPathIcon, SearchIcon } from '../../../components/icons';

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
  const { accessibleSchools, selectedSchoolId, selectSchool, loading: contextLoading } = useDivisionContext();

  const [schoolStats, setSchoolStats] = useState<Map<string, SchoolStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = useMemo(() => {
    let schools = selectedSchoolId
      ? accessibleSchools.filter(s => s.id === selectedSchoolId)
      : accessibleSchools;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      schools = schools.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.school_id_number?.toLowerCase().includes(query) ||
        s.district?.toLowerCase().includes(query)
      );
    }

    return schools;
  }, [accessibleSchools, selectedSchoolId, searchQuery]);

  // Fetch student and teacher counts per school
  const fetchStats = useCallback(async () => {
    if (accessibleSchools.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const schoolIds = accessibleSchools.map(s => s.id);

      // Fetch counts in parallel
      const [studentsResult, teachersResult] = await Promise.all([
        supabase
          .from('students')
          .select('school_id')
          .in('school_id', schoolIds)
          .is('deleted_at', null)
          .eq('enrollment_status', 'enrolled'),
        supabase
          .from('teachers')
          .select('school_id')
          .in('school_id', schoolIds)
          .is('deleted_at', null),
      ]);

      // Count by school
      const stats = new Map<string, SchoolStats>();
      schoolIds.forEach(id => {
        stats.set(id, { school_id: id, student_count: 0, teacher_count: 0 });
      });

      (studentsResult.data || []).forEach(s => {
        const stat = stats.get(s.school_id);
        if (stat) stat.student_count++;
      });

      (teachersResult.data || []).forEach(t => {
        const stat = stats.get(t.school_id);
        if (stat) stat.teacher_count++;
      });

      setSchoolStats(stats);
    } catch (err) {
      console.error('[DivisionSchools] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [accessibleSchools]);

  useEffect(() => {
    if (!contextLoading) {
      fetchStats();
    }
  }, [fetchStats, contextLoading]);

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

  // Summary statistics
  const summary = useMemo(() => {
    return {
      totalSchools: accessibleSchools.length,
      totalStudents: Array.from(schoolStats.values()).reduce((sum, s) => sum + s.student_count, 0),
      totalTeachers: Array.from(schoolStats.values()).reduce((sum, s) => sum + s.teacher_count, 0),
      districts: new Set(accessibleSchools.map(s => s.district).filter(Boolean)).size,
    };
  }, [accessibleSchools, schoolStats]);

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
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}><ArrowPathIcon /></span>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
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

      {/* School Cards */}
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

      {filteredSchools.length === 0 && (
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
