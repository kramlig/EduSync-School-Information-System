/**
 * DivisionSF7Dashboard - Division-level view of SF7 Personnel Report
 * 
 * Displays aggregated personnel data across all schools in a division.
 * Features:
 * - Overview summary cards
 * - Personnel by position
 * - Personnel by employment status
 * - Personnel by district
 * - School-by-school breakdown
 * - Export to CSV
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import {
  getDivisionPersonnelSummary,
  exportPersonnelToCSV,
  type DivisionPersonnelAggregate,
} from '../../services/divisionReportService';
import { logView, logExport } from '../../services/divisionAuditService';
import { downloadDivisionSF7PDF } from '../../utils/pdf/divisionSF7Generator';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { DivisionDashboardSkeleton } from './common';

// Position display names
const POSITION_LABELS: Record<string, string> = {
  teacher_i: 'Teacher I',
  teacher_ii: 'Teacher II',
  teacher_iii: 'Teacher III',
  master_teacher_i: 'Master Teacher I',
  master_teacher_ii: 'Master Teacher II',
  head_teacher_i: 'Head Teacher I',
  head_teacher_ii: 'Head Teacher II',
  head_teacher_iii: 'Head Teacher III',
  principal_i: 'Principal I',
  principal_ii: 'Principal II',
  principal_iii: 'Principal III',
  principal_iv: 'Principal IV',
  other: 'Other',
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  permanent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  temporary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  substitute: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  volunteer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const DivisionSF7Dashboard: React.FC = () => {
  const {
    division,
    divisionUser,
    accessibleSchools,
    filteredSchools,
    selectedSchoolId,
    hasPermission,
    loading: contextLoading,
  } = useDivisionContext();

  const [data, setData] = useState<DivisionPersonnelAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'position' | 'status' | 'district' | 'school'>('position');
  const [pdfLoading, setPdfLoading] = useState(false);
  const hasLoggedView = useRef(false);

  const canExport = hasPermission('reports', 'export');

  // Fetch data (use global district filter)
  useEffect(() => {
    if (!division?.id || contextLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use filteredSchools (already filtered by global district) or selectedSchool
        const schoolIds = selectedSchoolId 
          ? [selectedSchoolId] 
          : filteredSchools.map(s => s.id);

        const result = await getDivisionPersonnelSummary({
          division_id: division.id,
          school_ids: schoolIds.length < accessibleSchools.length ? schoolIds : undefined,
        });

        setData(result);
        
        // Log view audit event (only once per component mount)
        if (!hasLoggedView.current && divisionUser) {
          hasLoggedView.current = true;
          await logView(
            division.id,
            divisionUser.id,
            divisionUser.name,
            'sf7',
            'SF7 Personnel Report',
            'reports'
          );
        }
      } catch (err) {
        console.error('[DivisionSF7] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load personnel data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [division?.id, selectedSchoolId, filteredSchools, contextLoading, divisionUser, accessibleSchools]);

  // Handle CSV export
  const handleExport = useCallback(async () => {
    if (!data) return;

    const csv = exportPersonnelToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `division-sf7-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Log export audit event
    if (division?.id && divisionUser) {
      await logExport(
        division.id,
        divisionUser.id,
        divisionUser.name,
        'sf7',
        'SF7 Personnel Report',
        'reports',
        'csv'
      );
    }
  }, [data, division?.id, divisionUser]);

  // Handle PDF export
  const handlePDFExport = useCallback(async () => {
    if (!data || !division) return;

    try {
      setPdfLoading(true);
      await downloadDivisionSF7PDF(data, {
        division_name: division.name,
        region: division.region || 'Region XI',
        school_year: new Date().getFullYear().toString(),
        date_prepared: new Date().toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      // Log export audit event
      if (divisionUser) {
        await logExport(
          division.id,
          divisionUser.id,
          divisionUser.name,
          'sf7',
          'SF7 Personnel Report PDF',
          'reports',
          'pdf'
        );
      }
    } catch (err) {
      console.error('[DivisionSF7] PDF export error:', err);
    } finally {
      setPdfLoading(false);
    }
  }, [data, division, divisionUser]);

  // Calculate permanent vs non-permanent
  const permanentCount = useMemo(() => {
    return data?.by_status?.permanent || 0;
  }, [data]);

  const permanentPercent = useMemo(() => {
    if (!data || data.total_personnel === 0) return 0;
    return Math.round((permanentCount / data.total_personnel) * 100);
  }, [data, permanentCount]);

  // Format position name
  const formatPosition = (position: string): string => {
    return POSITION_LABELS[position] || position.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Format status name
  const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (contextLoading || loading) {
    return <DivisionDashboardSkeleton summaryCards={4} showViewModes={true} showFilters={false} tableColumns={6} />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">Error Loading Data</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            SF7 - School Personnel Assignment List
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {selectedSchoolId
              ? `Viewing: ${accessibleSchools.find(s => s.id === selectedSchoolId)?.name}`
              : `Consolidated report for ${data?.total_schools || 0} schools`}
          </p>
        </div>

        {canExport && data && (
          <div className="flex gap-2">
            <button
              onClick={handlePDFExport}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {pdfLoading ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4" />
              )}
              {pdfLoading ? 'Generating...' : 'Export PDF'}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Schools"
          value={data?.total_schools.toLocaleString() || '0'}
          subtitle={`${Object.keys(data?.by_district || {}).length} districts`}
          icon={<BuildingOfficeIcon className="w-6 h-6 text-indigo-600" />}
          bgColor="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <SummaryCard
          title="Total Personnel"
          value={data?.total_personnel.toLocaleString() || '0'}
          subtitle={`${Object.keys(data?.by_position || {}).length} positions`}
          icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          title="Permanent"
          value={permanentCount.toLocaleString()}
          subtitle={`${permanentPercent}% of total`}
          icon={<BriefcaseIcon className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50 dark:bg-green-900/20"
          valueColor="text-green-600 dark:text-green-400"
        />
        <SummaryCard
          title="Non-Permanent"
          value={(data?.total_personnel ? data.total_personnel - permanentCount : 0).toLocaleString()}
          subtitle={`${100 - permanentPercent}% of total`}
          icon={<ClockIcon className="w-6 h-6 text-amber-600" />}
          bgColor="bg-amber-50 dark:bg-amber-900/20"
          valueColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* View Mode Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          View By
        </label>
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
          {(['position', 'status', 'district', 'school'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Data Tables */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {viewMode === 'position' && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                Personnel by Position
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Position</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Count</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">% of Total</th>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data?.by_position && Object.entries(data.by_position)
                    .sort(([, a], [, b]) => b - a)
                    .map(([position, count]) => {
                      const percent = data.total_personnel > 0
                        ? Math.round((count / data.total_personnel) * 100)
                        : 0;
                      return (
                        <tr key={position} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                            {formatPosition(position)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                            {count.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                            {percent}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                {data && (
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_personnel.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                        100%
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {viewMode === 'status' && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                Personnel by Employment Status
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Count</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">% of Total</th>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data?.by_status && Object.entries(data.by_status)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => {
                      const percent = data.total_personnel > 0
                        ? Math.round((count / data.total_personnel) * 100)
                        : 0;
                      return (
                        <tr key={status} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {formatStatus(status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                            {count.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                            {percent}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  status === 'permanent' ? 'bg-green-500' :
                                  status === 'temporary' ? 'bg-blue-500' :
                                  status === 'contract' ? 'bg-purple-500' :
                                  status === 'substitute' ? 'bg-amber-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                {data && (
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_personnel.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                        100%
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {viewMode === 'district' && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                Personnel by District
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">District</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Schools</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Personnel</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Avg per School</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data?.by_district && Object.entries(data.by_district)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([district, counts]) => (
                      <tr key={district} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {district}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                          {counts.schools}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                          {counts.personnel.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                          {counts.schools > 0 ? Math.round(counts.personnel / counts.schools) : 0}
                        </td>
                      </tr>
                    ))}
                </tbody>
                {data && (
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                        {data.total_schools}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_personnel.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                        {data.total_schools > 0 ? Math.round(data.total_personnel / data.total_schools) : 0}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {viewMode === 'school' && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                Personnel by School ({data?.schools.length || 0} schools)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">School</th>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">District</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Personnel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data?.schools
                    .sort((a, b) => a.school_name.localeCompare(b.school_name))
                    .map(school => (
                      <tr key={school.school_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {school.school_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {school.district || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                          {school.total_personnel.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
                {data && (
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-900 dark:text-white" colSpan={2}>Total</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_personnel.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {(!data || data.total_personnel === 0) && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No personnel data available</p>
            <p className="text-sm mt-1">
              Personnel records will appear here once teachers are added to schools.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  bgColor?: string;
  valueColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  bgColor = 'bg-slate-50 dark:bg-slate-700/50',
  valueColor = 'text-slate-900 dark:text-white',
}) => (
  <div className={`${bgColor} rounded-xl p-5 border border-slate-200 dark:border-slate-700`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${valueColor} mt-1`}>{value}</p>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

export default DivisionSF7Dashboard;
