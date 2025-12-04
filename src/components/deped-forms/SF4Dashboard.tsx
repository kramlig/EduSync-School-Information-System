/**
 * SF4 Dashboard - Monthly Learner Movement & Attendance Report
 * DepEd Form SF4 for tracking enrollment changes
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../hooks/useSchoolDataPostgreSQL';
import { useSectionsPostgreSQL } from '../../hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import type {
  StudentMovement,
  MonthlyEnrollmentSnapshot,
  SF4Summary,
  SF4Filter,
  GenerateMonthlySnapshotRequest,
} from '../../types/studentMovements';
import {
  getStudentMovements,
  getMonthlySnapshot,
  generateMonthlySnapshot,
  getSF4Summary,
} from '../../services/studentMovementsService';
import { generateSF4PDF } from '../../utils/pdf/sf4Generator';

interface SF4DashboardProps {
  schoolYear: string;
  session?: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
}

const SF4Dashboard: React.FC<SF4DashboardProps> = ({ schoolYear, session }) => {
  const { schoolId } = useSchoolContext();
  const { settings } = useSchoolDataPostgreSQL({ schoolId: schoolId || null });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({
    schoolId: schoolId || undefined,
  });

  const [movements, setMovements] = useState<StudentMovement[]>([]);
  const [snapshot, setSnapshot] = useState<MonthlyEnrollmentSnapshot | null>(null);
  const [summary, setSummary] = useState<SF4Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | undefined>(undefined);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);

  const schoolIdMemo = useMemo(() => schoolId || '', [schoolId]);

  // Available grade levels
  const gradeLevels = useMemo(() => {
    const levels = new Set<number>();
    sections?.forEach(s => {
      const level = typeof s.gradeLevel === 'string' ? parseInt(s.gradeLevel) : s.gradeLevel;
      levels.add(level);
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [sections]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    if (!selectedGradeLevel) return [];
    return sections?.filter(s => {
      const level = typeof s.gradeLevel === 'string' ? parseInt(s.gradeLevel) : s.gradeLevel;
      return level === selectedGradeLevel;
    }) || [];
  }, [sections, selectedGradeLevel]);

  // Fetch SF4 data
  useEffect(() => {
    if (!schoolIdMemo || sectionsLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filter: SF4Filter = {
          school_id: schoolIdMemo,
          school_year: schoolYear,
          month: selectedMonth,
          grade_level: selectedGradeLevel,
          section_id: selectedSection,
        };

        const [movementsData, snapshotData, summaryData] = await Promise.all([
          getStudentMovements(filter),
          getMonthlySnapshot(schoolIdMemo, schoolYear, selectedMonth, selectedGradeLevel, selectedSection),
          getSF4Summary(schoolIdMemo, schoolYear, selectedMonth, selectedGradeLevel),
        ]);

        setMovements(movementsData);
        setSnapshot(snapshotData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error fetching SF4 data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load SF4 data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolIdMemo, schoolYear, selectedMonth, selectedGradeLevel, selectedSection, sectionsLoading]);

  // Generate monthly snapshot
  const handleGenerateSnapshot = async () => {
    if (!schoolIdMemo || !session) return;

    try {
      setGenerating(true);
      setError(null);

      const request: GenerateMonthlySnapshotRequest = {
        school_id: schoolIdMemo,
        school_year: schoolYear,
        month: selectedMonth,
        grade_level: selectedGradeLevel,
      };

      await generateMonthlySnapshot(request, {
        id: session.user.id,
        name: (session.user as any).displayName || session.user.email || 'Unknown',
      });

      // Refresh data
      const filter: SF4Filter = {
        school_id: schoolIdMemo,
        school_year: schoolYear,
        month: selectedMonth,
        grade_level: selectedGradeLevel,
        section_id: selectedSection,
      };

      const [movementsData, snapshotData, summaryData] = await Promise.all([
        getStudentMovements(filter),
        getMonthlySnapshot(schoolIdMemo, schoolYear, selectedMonth, selectedGradeLevel, selectedSection),
        getSF4Summary(schoolIdMemo, schoolYear, selectedMonth, selectedGradeLevel),
      ]);

      setMovements(movementsData);
      setSnapshot(snapshotData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error generating snapshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate snapshot');
    } finally {
      setGenerating(false);
    }
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!summary || !schoolIdMemo) return;

    try {
      const schoolInfoData = {
        name: (settings as any)?.schoolName || 'School Name',
        schoolId: (settings as any)?.schoolIdNumber || schoolIdMemo,
        division: (settings as any)?.division || 'Division',
        region: (settings as any)?.region || 'Region',
        district: (settings as any)?.district || 'District',
      };

      const selectedSectionObj = selectedSection
        ? sections?.find(s => s.id === selectedSection)
        : undefined;

      await generateSF4PDF({
        schoolInfo: schoolInfoData,
        schoolYear,
        month: selectedMonth,
        gradeLevel: selectedGradeLevel,
        section: selectedSectionObj ? {
          id: selectedSectionObj.id,
          name: selectedSectionObj.name,
          grade_level: typeof selectedSectionObj.gradeLevel === 'string' 
            ? parseInt(selectedSectionObj.gradeLevel) 
            : selectedSectionObj.gradeLevel,
        } : undefined,
        snapshot,
        movements,
        summary,
        preparedBy: (session?.user as any)?.displayName || session?.user.email || 'Unknown',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Home
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <a
                href="/reports/school-forms"
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
              >
                School Forms
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                SF4 - Monthly Movement Report
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SF4 - Monthly Movement Report</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track student enrollment changes and attendance for {formatMonthDisplay(selectedMonth)}
            </p>
          </div>
          <DocumentTextIcon className="h-12 w-12 text-blue-600" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Month */}
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Select month"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label htmlFor="grade-select" className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <select
              id="grade-select"
              value={selectedGradeLevel || ''}
              onChange={e => {
                setSelectedGradeLevel(e.target.value ? parseInt(e.target.value) : undefined);
                setSelectedSection(undefined);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Select grade level"
            >
              <option value="">All Grades</option>
              {gradeLevels.map(level => (
                <option key={level} value={level}>
                  Grade {level}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              id="section-select"
              value={selectedSection || ''}
              onChange={e => setSelectedSection(e.target.value || undefined)}
              disabled={!selectedGradeLevel}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Select section"
            >
              <option value="">All Sections</option>
              {filteredSections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerateSnapshot}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
              <span className="text-sm">Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            icon={UsersIcon}
            label="Beginning Enrollment"
            value={summary.total_beginning_enrollment}
            color="blue"
          />
          <StatCard
            icon={ArrowLeftOnRectangleIcon}
            label="Transferred In"
            value={summary.total_transferred_in}
            color="green"
          />
          <StatCard
            icon={ArrowRightOnRectangleIcon}
            label="Transferred Out"
            value={summary.total_transferred_out}
            color="yellow"
          />
          <StatCard
            icon={UsersIcon}
            label="Dropped"
            value={summary.total_dropped}
            color="red"
          />
          <StatCard
            icon={UsersIcon}
            label="Ending Enrollment"
            value={summary.total_ending_enrollment}
            color="indigo"
          />
        </div>
      )}

      {/* Movements Table */}
      {movements.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Movements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LRN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movement Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map(movement => (
                  <tr key={movement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.movement_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.lrn || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getMovementColor(movement.movement_type)}`}>
                        {formatMovementType(movement.movement_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {movement.destination_school || movement.previous_school || movement.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate PDF Button */}
      {summary && (
        <div className="flex justify-end">
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Download SF4 PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Helper Components
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Helper Functions
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-');
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
}

function formatMovementType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getMovementColor(type: string): string {
  const colors: Record<string, string> = {
    enrolled: 'bg-green-100 text-green-800',
    transferred_in: 'bg-blue-100 text-blue-800',
    transferred_out: 'bg-yellow-100 text-yellow-800',
    dropped: 'bg-red-100 text-red-800',
    promoted: 'bg-purple-100 text-purple-800',
    retained: 'bg-orange-100 text-orange-800',
    graduated: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-teal-100 text-teal-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export default SF4Dashboard;
