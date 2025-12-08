/**
 * DivisionSF6Dashboard - Division-level view of SF6 Enrollment Summary
 * 
 * Displays aggregated enrollment data across all schools in a division.
 * Features:
 * - Overview summary cards
 * - Enrollment by grade level
 * - Enrollment by district
 * - School-by-school breakdown
 * - Export to CSV
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import {
  getDivisionEnrollmentSummary,
  exportEnrollmentToCSV,
  type DivisionEnrollmentAggregate,
} from '../../services/divisionReportService';
import { logView, logExport } from '../../services/divisionAuditService';
import { generateDivisionSF6PDF } from '../../utils/pdf/divisionSF6Generator';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { DivisionDashboardSkeleton } from './common';

const DivisionSF6Dashboard: React.FC = () => {
  const {
    division,
    divisionUser,
    accessibleSchools,
    selectedSchoolId,
    hasPermission,
    schoolYear,
    loading: contextLoading,
  } = useDivisionContext();

  const [data, setData] = useState<DivisionEnrollmentAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'grade' | 'district' | 'school'>('grade');
  const [pdfLoading, setPdfLoading] = useState(false);
  const hasLoggedView = useRef(false);

  const canExport = hasPermission('reports', 'export');

  // Fetch data
  useEffect(() => {
    if (!division?.id || contextLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const schoolIds = selectedSchoolId ? [selectedSchoolId] : undefined;

        const result = await getDivisionEnrollmentSummary({
          division_id: division.id,
          school_ids: schoolIds,
          school_year: schoolYear,
        });

        setData(result);
        
        // Log view audit event (only once per component mount)
        if (!hasLoggedView.current && divisionUser) {
          hasLoggedView.current = true;
          await logView(
            division.id,
            divisionUser.id,
            divisionUser.name,
            'sf6',
            'SF6 Enrollment Summary',
            'reports'
          );
        }
      } catch (err) {
        console.error('[DivisionSF6] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load enrollment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [division?.id, selectedSchoolId, schoolYear, contextLoading, divisionUser]);

  // Filter schools by selected grade
  const filteredSchools = useMemo(() => {
    if (!data?.schools) return [];
    if (selectedGrade === '') return data.schools;
    return data.schools.filter(s => s.by_grade[selectedGrade as number]);
  }, [data?.schools, selectedGrade]);

  // Handle CSV export
  const handleExport = useCallback(async () => {
    if (!data) return;

    const csv = exportEnrollmentToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `division-sf6-${schoolYear}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Log export audit event
    if (division?.id && divisionUser) {
      await logExport(
        division.id,
        divisionUser.id,
        divisionUser.name,
        'sf6',
        `SF6 Enrollment Summary (${schoolYear})`,
        'reports',
        'csv'
      );
    }
  }, [data, schoolYear, division?.id, divisionUser]);

  // Handle PDF export
  const handlePDFExport = useCallback(async () => {
    if (!data || !division) return;

    try {
      setPdfLoading(true);
      const pdf = await generateDivisionSF6PDF(data, {
        division_name: division.name,
        region: division.region || 'Region XI',
        school_year: schoolYear,
        prepared_by: divisionUser?.name,
        prepared_by_position: divisionUser?.role,
      });

      pdf.save(`division-sf6-${schoolYear}-${new Date().toISOString().split('T')[0]}.pdf`);

      // Log export audit event
      if (divisionUser) {
        await logExport(
          division.id,
          divisionUser.id,
          divisionUser.name,
          'sf6',
          `SF6 Enrollment Summary (${schoolYear})`,
          'reports',
          'pdf'
        );
      }
    } catch (err) {
      console.error('[DivisionSF6] PDF export error:', err);
    } finally {
      setPdfLoading(false);
    }
  }, [data, division, schoolYear, divisionUser]);

  // Grade level options
  const gradeOptions = useMemo(() => {
    if (!data?.by_grade) return [];
    return Object.keys(data.by_grade)
      .map(Number)
      .sort((a, b) => a - b);
  }, [data?.by_grade]);

  // Calculate percentages
  const malePercent = useMemo(() => {
    if (!data || data.total_students === 0) return 0;
    return Math.round((data.total_male / data.total_students) * 100);
  }, [data]);

  const femalePercent = useMemo(() => {
    if (!data || data.total_students === 0) return 0;
    return Math.round((data.total_female / data.total_students) * 100);
  }, [data]);

  if (contextLoading || loading) {
    return <DivisionDashboardSkeleton summaryCards={4} showViewModes={true} showFilters={true} tableColumns={8} />;
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
            SF6 - Summarized Enrollment Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {selectedSchoolId
              ? `Viewing: ${accessibleSchools.find(s => s.id === selectedSchoolId)?.name}`
              : `Consolidated report for ${data?.total_schools || 0} schools`}
            {' · '} School Year {schoolYear}
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
          title="Total Students"
          value={data?.total_students.toLocaleString() || '0'}
          subtitle={`${Object.keys(data?.by_grade || {}).length} grade levels`}
          icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          title="Male"
          value={data?.total_male.toLocaleString() || '0'}
          subtitle={`${malePercent}% of total`}
          icon={
            <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="10" cy="8" r="4" strokeWidth={1.5} />
              <path strokeWidth={1.5} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path strokeWidth={1.5} d="M20 8l-3 3m3-3v3m0-3h-3" />
            </svg>
          }
          bgColor="bg-sky-50 dark:bg-sky-900/20"
          valueColor="text-sky-600 dark:text-sky-400"
        />
        <SummaryCard
          title="Female"
          value={data?.total_female.toLocaleString() || '0'}
          subtitle={`${femalePercent}% of total`}
          icon={
            <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="8" r="4" strokeWidth={1.5} />
              <path strokeWidth={1.5} d="M12 12v6m-3 0h6" />
            </svg>
          }
          bgColor="bg-pink-50 dark:bg-pink-900/20"
          valueColor="text-pink-600 dark:text-pink-400"
        />
      </div>

      {/* Filters and View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Filter by Grade
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Grades</option>
            {gradeOptions.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            View By
          </label>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
            {(['grade', 'district', 'school'] as const).map(mode => (
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
      </div>

      {/* Data Tables */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {viewMode === 'grade' && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                Enrollment by Grade Level
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Grade</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Male</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Female</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Total</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data?.by_grade && Object.entries(data.by_grade)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .filter(([grade]) => selectedGrade === '' || Number(grade) === selectedGrade)
                    .map(([grade, counts]) => (
                      <tr key={grade} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {Number(grade) === 0 ? 'Kindergarten' : `Grade ${grade}`}
                        </td>
                        <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                          {counts.male.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-pink-600 dark:text-pink-400">
                          {counts.female.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                          {counts.total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                          {data.total_students > 0
                            ? `${Math.round((counts.total / data.total_students) * 100)}%`
                            : '0%'}
                        </td>
                      </tr>
                    ))}
                </tbody>
                {data && (
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                        {data.total_male.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-pink-600 dark:text-pink-400">
                        {data.total_female.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_students.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                        100%
                      </td>
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
                Enrollment by District
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">District</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Schools</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Male</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Female</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Total</th>
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
                        <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                          {counts.male.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-pink-600 dark:text-pink-400">
                          {counts.female.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                          {counts.students.toLocaleString()}
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
                      <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                        {data.total_male.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-pink-600 dark:text-pink-400">
                        {data.total_female.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_students.toLocaleString()}
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
                Enrollment by School ({filteredSchools.length} schools)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">School</th>
                    <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">District</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Male</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Female</th>
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredSchools
                    .sort((a, b) => a.school_name.localeCompare(b.school_name))
                    .map(school => (
                      <tr key={school.school_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {school.school_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {school.district || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                          {school.male_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-pink-600 dark:text-pink-400">
                          {school.female_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                          {school.total_students.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
                {data && (
                  <tfoot className="bg-slate-100 dark:bg-slate-900 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-900 dark:text-white" colSpan={2}>Total</td>
                      <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                        {data.total_male.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-pink-600 dark:text-pink-400">
                        {data.total_female.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {data.total_students.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {(!data || data.total_students === 0) && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No enrollment data available</p>
            <p className="text-sm mt-1">
              Enrollment records will appear here once students are enrolled in schools.
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

export default DivisionSF6Dashboard;
