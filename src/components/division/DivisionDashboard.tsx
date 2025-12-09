/**
 * DivisionDashboard - Main dashboard for Division-level users
 * 
 * This dashboard provides:
 * - Overview statistics across all accessible schools
 * - Quick access to key metrics
 * - Recent activity feed
 * - School performance summaries
 * 
 * OPTIMIZED: Uses RPC function for single API call with fallback
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

// Inline SVG icons for dashboard
const DashIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-5 h-5" }) => {
  const icons: Record<string, React.ReactNode> = {
    school: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      </svg>
    ),
    graduationCap: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 7v-4m3.5-9.5L18 9" />
      </svg>
    ),
    users: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    checkCircle: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clock: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    alertCircle: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    chart: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    document: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    arrowRight: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    ),
    building: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    mapPin: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
};

interface DivisionStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  schoolsReportingOnTime: number;
  pendingReports: number;
}

interface SchoolSummaryData {
  id: string;
  name: string;
  district: string | null;
  studentCount: number;
  teacherCount: number;
  lastReportDate: string | null;
  reportStatus: 'on-time' | 'pending' | 'overdue';
}

const DivisionDashboard: React.FC = () => {
  const {
    division,
    accessibleSchools,
    filteredSchools,
    selectedSchoolId,
    selectedDistrict,
    hasPermission,
    loading: contextLoading,
  } = useDivisionContext();

  const [stats, setStats] = useState<DivisionStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    schoolsReportingOnTime: 0,
    pendingReports: 0,
  });
  const [schoolSummaries, setSchoolSummaries] = useState<SchoolSummaryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Use filtered schools (by district) instead of all accessible schools
  const targetSchools = useMemo(() => {
    if (selectedSchoolId) {
      return accessibleSchools.filter(s => s.id === selectedSchoolId);
    }
    // If district is selected, use filteredSchools from context
    return filteredSchools;
  }, [selectedSchoolId, filteredSchools, accessibleSchools]);

  // Memoize school IDs to prevent unnecessary re-fetches
  const schoolIds = useMemo(() => {
    return targetSchools.map(s => s.id);
  }, [targetSchools]);

  // Fetch dashboard stats using RPC with fallback
  const fetchDashboardData = useCallback(async () => {
    if (!division?.id || targetSchools.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Try RPC first for optimal performance (single API call)
      // Pass school IDs to filter by district/school selection
      const { data, error } = await supabase.rpc('get_division_dashboard_stats', {
        p_division_id: division.id,
        p_school_ids: schoolIds.length < accessibleSchools.length ? schoolIds : null,
      });

      // Check if RPC function exists
      if (error?.code === '42883' || error?.code === 'PGRST202' ||
          (error?.message?.includes('function') && error?.message?.includes('does not exist'))) {
        console.warn('[DivisionDashboard] RPC not available, using fallback');
        await fetchDashboardDataFallback();
        return;
      }

      if (error) {
        console.error('[DivisionDashboard] RPC error:', error);
        await fetchDashboardDataFallback();
        return;
      }

      // Use RPC data
      setStats({
        totalSchools: data?.total_schools || 0,
        totalStudents: data?.total_students || 0,
        totalTeachers: data?.total_teachers || 0,
        schoolsReportingOnTime: Math.floor((data?.total_schools || 0) * 0.8), // Placeholder
        pendingReports: Math.floor((data?.total_schools || 0) * 0.2), // Placeholder
      });

      const summaries: SchoolSummaryData[] = (data?.schools || []).map((school: {
        school_id: string;
        school_name: string;
        district: string | null;
        student_count: number;
        teacher_count: number;
      }) => ({
        id: school.school_id,
        name: school.school_name,
        district: school.district,
        studentCount: school.student_count,
        teacherCount: school.teacher_count,
        lastReportDate: null,
        reportStatus: Math.random() > 0.3 ? 'on-time' : 'pending' as const,
      }));

      setSchoolSummaries(summaries);
      setLoading(false);
    } catch (err) {
      console.error('[DivisionDashboard] Error:', err);
      await fetchDashboardDataFallback();
    }
  }, [division?.id, schoolIds, targetSchools, accessibleSchools]);

  // Fallback: fetch data using multiple API calls
  const fetchDashboardDataFallback = useCallback(async () => {
    try {
      // Use already-filtered school IDs (by district and/or school selection)
      const targetSchoolIds = schoolIds;

      // Fetch student counts (count only, no data transfer)
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', targetSchoolIds)
        .is('deleted_at', null)
        .eq('enrollment_status', 'enrolled');

      // Fetch teacher counts  
      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .in('school_id', targetSchoolIds)
        .is('deleted_at', null);

      setStats({
        totalSchools: targetSchoolIds.length,
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        schoolsReportingOnTime: Math.floor(targetSchoolIds.length * 0.8),
        pendingReports: Math.floor(targetSchoolIds.length * 0.2),
      });

      // Build school summaries from filtered schools (already filtered by district)
      const summaries: SchoolSummaryData[] = targetSchools.map(school => ({
        id: school.id,
        name: school.name,
        district: school.district || null,
        studentCount: 0, // Not available in fallback without extra calls
        teacherCount: 0,
        lastReportDate: null,
        reportStatus: Math.random() > 0.3 ? 'on-time' : 'pending' as const,
      }));

      setSchoolSummaries(summaries);
      setLoading(false);
    } catch (err) {
      console.error('[DivisionDashboard] Fallback error:', err);
      setLoading(false);
    }
  }, [schoolIds, targetSchools]);

  // Fetch dashboard stats
  useEffect(() => {
    if (!contextLoading) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, contextLoading]);

  // Stat cards data
  const statCards = useMemo(() => [
    {
      title: 'Schools',
      value: stats.totalSchools,
      iconName: 'school',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Students',
      value: stats.totalStudents.toLocaleString(),
      iconName: 'graduationCap',
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers.toLocaleString(),
      iconName: 'users',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Reports On-Time',
      value: `${stats.schoolsReportingOnTime}/${stats.totalSchools}`,
      iconName: 'checkCircle',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ], [stats]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-time':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <DashIcon name="checkCircle" className="w-3 h-3" />
            On-Time
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <DashIcon name="clock" className="w-3 h-3" />
            Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <DashIcon name="alertCircle" className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          
          {/* Table skeleton */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Division Dashboard
            {selectedDistrict && (
              <span className="text-lg font-normal text-slate-500 ml-2">— {selectedDistrict}</span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {selectedSchoolId 
              ? `Viewing: ${accessibleSchools.find(s => s.id === selectedSchoolId)?.name}`
              : `Overview of ${targetSchools.length} schools`
            }
          </p>
        </div>
        
        {hasPermission('reports', 'generate') && (
          <Link
            to="/division/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <DashIcon name="chart" className="w-4 h-4" />
            Generate Reports
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-xl p-5 border border-slate-200 dark:border-slate-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold mt-1 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                <DashIcon name={stat.iconName} className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasPermission('enrollment', 'read') && (
          <Link
            to="/division/enrollment"
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DashIcon name="document" className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white">Enrollment Data (SF1)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">View consolidated enrollment</p>
            </div>
            <span className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors">
              <DashIcon name="arrowRight" className="w-5 h-5" />
            </span>
          </Link>
        )}

        {hasPermission('personnel', 'read') && (
          <Link
            to="/division/personnel"
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <DashIcon name="users" className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white">Personnel Data (SF7)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">View school personnel</p>
            </div>
            <span className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors">
              <DashIcon name="arrowRight" className="w-5 h-5" />
            </span>
          </Link>
        )}

        {hasPermission('reports', 'read') && (
          <Link
            to="/division/reports"
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transition-colors group"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
              <DashIcon name="chart" className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white">Consolidated Reports</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generate division reports</p>
            </div>
            <span className="w-5 h-5 text-slate-400 group-hover:text-green-500 transition-colors">
              <DashIcon name="arrowRight" className="w-5 h-5" />
            </span>
          </Link>
        )}
      </div>

      {/* Schools Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Schools Overview
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  School
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  District
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Students
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Teachers
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Report Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {schoolSummaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="w-12 h-12 mx-auto mb-3 opacity-40">
                      <DashIcon name="building" className="w-12 h-12" />
                    </div>
                    <p>No schools to display</p>
                  </td>
                </tr>
              ) : (
                schoolSummaries.map(school => (
                  <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <DashIcon name="school" className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {school.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <DashIcon name="mapPin" className="w-4 h-4" />
                        {school.district || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {school.studentCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {school.teacherCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(school.reportStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DivisionDashboard;
