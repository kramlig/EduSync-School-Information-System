/**
 * SF7Dashboard - School Personnel Assignment List and Basic Profile
 * Official DepEd Form
 * 
 * Optimized for performance with:
 * - Client-side filtering with debounced search
 * - Memoized computations and callbacks
 * - Extracted sub-components for better rendering
 * - Lazy loading ready structure
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../hooks/useSchoolDataPostgreSQL';
import { useDebounce } from '../../../hooks/useDebounce';
import { getSF7Personnel, getSF7Summary } from '../../services/sf7PersonnelService';
import { downloadSF7PDF } from '../../utils/pdf/sf7PersonnelGenerator';
import type {
  SF7PersonnelRecord,
  SF7Summary,
  SF7Filter,
  PositionType,
  EmploymentStatus,
} from '../../types/sf7Personnel';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// CONSTANTS
// ============================================================================

const POSITION_OPTIONS: { value: PositionType | ''; label: string }[] = [
  { value: '', label: 'All Positions' },
  { value: 'teacher_i', label: 'Teacher I' },
  { value: 'teacher_ii', label: 'Teacher II' },
  { value: 'teacher_iii', label: 'Teacher III' },
  { value: 'master_teacher_i', label: 'Master Teacher I' },
  { value: 'master_teacher_ii', label: 'Master Teacher II' },
  { value: 'head_teacher_i', label: 'Head Teacher I' },
  { value: 'head_teacher_ii', label: 'Head Teacher II' },
  { value: 'head_teacher_iii', label: 'Head Teacher III' },
  { value: 'principal_i', label: 'Principal I' },
  { value: 'principal_ii', label: 'Principal II' },
  { value: 'principal_iii', label: 'Principal III' },
  { value: 'principal_iv', label: 'Principal IV' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: EmploymentStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'contract', label: 'Contract' },
  { value: 'substitute', label: 'Substitute' },
  { value: 'volunteer', label: 'Volunteer' },
];

const STATUS_COLORS: Record<EmploymentStatus | 'default', string> = {
  permanent: 'bg-green-100 text-green-800 border-green-200',
  temporary: 'bg-blue-100 text-blue-800 border-blue-200',
  contract: 'bg-purple-100 text-purple-800 border-purple-200',
  substitute: 'bg-amber-100 text-amber-800 border-amber-200',
  volunteer: 'bg-gray-100 text-gray-800 border-gray-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatPosition = (position: string | null | undefined): string => {
  if (!position) return 'N/A';
  return position
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatStatus = (status: string | null | undefined): string => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusColor = (status: EmploymentStatus): string => {
  return STATUS_COLORS[status] || STATUS_COLORS.default;
};

const buildFullName = (firstName?: string, middleName?: string, lastName?: string): string => {
  return [lastName, firstName, middleName].filter(Boolean).join(', ');
};

// ============================================================================
// SUB-COMPONENTS (Memoized)
// ============================================================================

interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  valueColor?: string;
  gradientFrom: string;
  gradientTo: string;
}

const SummaryCard = memo<SummaryCardProps>(({ 
  title, 
  value, 
  subtitle, 
  icon, 
  valueColor = 'text-gray-900',
  gradientFrom,
  gradientTo 
}) => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold ${valueColor} mt-2`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
));
SummaryCard.displayName = 'SummaryCard';

interface PersonnelRowProps {
  person: SF7PersonnelRecord;
}

const PersonnelRow = memo<PersonnelRowProps>(({ person }) => {
  const fullName = useMemo(
    () => buildFullName(person.first_name, person.middle_name, person.last_name),
    [person.first_name, person.middle_name, person.last_name]
  );

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {person.employee_number || 'N/A'}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {fullName}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
        {formatPosition(person.position)}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(person.employment_status)}`}>
          {formatStatus(person.employment_status)}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {person.major_specialization || 'N/A'}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {person.total_teaching_hours ?? 0}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
        {person.advisory_section || 'N/A'}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {person.teaching_assignments?.length > 0 ? (
          <div className="space-y-1">
            {person.teaching_assignments.slice(0, 3).map((assignment, idx) => (
              <div key={`${assignment.subject}-${idx}`} className="text-xs">
                {assignment.subject} (G{assignment.grade_level})
              </div>
            ))}
            {person.teaching_assignments.length > 3 && (
              <div className="text-xs text-gray-400">
                +{person.teaching_assignments.length - 3} more
              </div>
            )}
          </div>
        ) : (
          'None'
        )}
      </td>
    </tr>
  );
});
PersonnelRow.displayName = 'PersonnelRow';

const LoadingSkeleton = memo(() => (
  <div className="container mx-auto px-4 py-6 max-w-7xl animate-pulse">
    {/* Header skeleton */}
    <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <div className="h-14 w-14 bg-gray-200 rounded-xl" />
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>
      <div className="h-10 w-36 bg-gray-200 rounded-lg" />
    </div>
    
    {/* Summary cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-14 w-14 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Table skeleton */}
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

const ErrorDisplay = memo<{ error: string; onRetry: () => void }>(({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <p className="text-red-600">{error}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
));
ErrorDisplay.displayName = 'ErrorDisplay';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

interface UseSF7DataResult {
  personnel: SF7PersonnelRecord[];
  summary: SF7Summary | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const useSF7Data = (schoolId: string | null, schoolYear: string, isSchoolLoading: boolean): UseSF7DataResult => {
  const [personnel, setPersonnel] = useState<SF7PersonnelRecord[]>([]);
  const [summary, setSummary] = useState<SF7Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!schoolId || isSchoolLoading) return;

    try {
      setLoading(true);
      setError(null);

      const filter: SF7Filter = {
        school_id: schoolId,
        school_year: schoolYear,
      };

      const [personnelData, summaryData] = await Promise.all([
        getSF7Personnel(filter),
        getSF7Summary({ school_id: schoolId, school_year: schoolYear }),
      ]);

      setPersonnel(personnelData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading SF7 data:', err);
      setError('Failed to load personnel data');
    } finally {
      setLoading(false);
    }
  }, [schoolId, schoolYear, isSchoolLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { personnel, summary, loading, error, reload: loadData };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SF7Dashboard: React.FC = () => {
  const { schoolId } = useSchoolContext();
  const { settings, loading: schoolLoading } = useSchoolDataPostgreSQL({ schoolId });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionType | ''>('');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | ''>('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  // Derived values
  const currentSchoolYear = useMemo(
    () => settings?.schoolYear || new Date().getFullYear().toString(),
    [settings?.schoolYear]
  );

  // Data fetching
  const { personnel, summary, loading, error, reload } = useSF7Data(
    schoolId,
    currentSchoolYear,
    schoolLoading
  );

  // Client-side filtering
  const filteredPersonnel = useMemo(() => {
    if (!personnel.length) return [];
    
    let result = personnel;
    
    if (positionFilter) {
      result = result.filter(p => p.position === positionFilter);
    }
    
    if (statusFilter) {
      result = result.filter(p => p.employment_status === statusFilter);
    }
    
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(p => {
        const fullName = [p.first_name, p.middle_name, p.last_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        
        return (
          fullName.includes(searchLower) ||
          p.first_name?.toLowerCase().includes(searchLower) ||
          p.last_name?.toLowerCase().includes(searchLower) ||
          p.employee_number?.toLowerCase().includes(searchLower) ||
          p.position?.toLowerCase().includes(searchLower) ||
          p.major_specialization?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return result;
  }, [personnel, positionFilter, statusFilter, debouncedSearchTerm]);

  // Filtered summary computation
  const filteredSummary = useMemo(() => {
    if (!summary) return null;
    
    const hasActiveFilters = Boolean(positionFilter || statusFilter || debouncedSearchTerm);
    if (!hasActiveFilters) return summary;
    
    const permanentCount = filteredPersonnel.filter(p => p.employment_status === 'permanent').length;
    const totalHours = filteredPersonnel.reduce((sum, p) => sum + (p.total_teaching_hours || 0), 0);
    const avgLoad = filteredPersonnel.length > 0 ? Math.round(totalHours / filteredPersonnel.length) : 0;
    const mastersCount = filteredPersonnel.filter(p => 
      p.highest_education?.toLowerCase().includes('master')
    ).length;
    const docCount = filteredPersonnel.filter(p => 
      p.highest_education?.toLowerCase().includes('doctor') || 
      p.highest_education?.toLowerCase().includes('phd')
    ).length;
    
    return {
      ...summary,
      total_personnel: filteredPersonnel.length,
      by_employment_status: { ...summary.by_employment_status, permanent: permanentCount },
      average_teaching_load: avgLoad,
      with_masters: mastersCount,
      with_doctorate: docCount,
    };
  }, [summary, filteredPersonnel, positionFilter, statusFilter, debouncedSearchTerm]);

  // PDF download handler
  const handleDownloadPDF = useCallback(async () => {
    if (!schoolId || !settings || !summary || !personnel.length) return;

    try {
      await downloadSF7PDF({
        school_id: schoolId,
        school_id_number: (settings as Record<string, unknown>)?.schoolIdNumber as string || '',
        school_name: settings.schoolName || 'School',
        school_year: currentSchoolYear,
        region: settings.region,
        division: settings.division,
        district: settings.district,
        personnel,
        summary,
      });
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  }, [schoolId, settings, summary, personnel, currentSchoolYear]);

  // Event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handlePositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPositionFilter(e.target.value as PositionType | '');
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as EmploymentStatus | '');
  }, []);

  // Loading state
  if (loading || schoolLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={reload} />;
  }

  // Calculate percentage safely
  const permanentPercentage = filteredSummary && filteredSummary.total_personnel > 0
    ? ((filteredSummary.by_employment_status.permanent / filteredSummary.total_personnel) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-gray-600">
          <li>
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/reports/school-forms" className="hover:text-blue-600 transition-colors">
              School Forms
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span className="font-medium text-gray-900" aria-current="page">
              SF7 - Personnel Assignment
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <UserGroupIcon className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                SF7 - Personnel Assignment List
              </h1>
              <p className="text-gray-600 mt-1">
                School personnel profiles and teaching assignments
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={!personnel.length}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
            aria-label="Download SF7 Report as PDF"
          >
            <DocumentArrowDownIcon className="h-5 w-5" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      {filteredSummary && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Personnel Summary">
          <SummaryCard
            title="Total Personnel"
            value={filteredSummary.total_personnel}
            icon={<UserGroupIcon className="h-8 w-8 text-purple-600" />}
            gradientFrom="from-purple-100"
            gradientTo="to-pink-100"
          />
          <SummaryCard
            title="Permanent"
            value={filteredSummary.by_employment_status.permanent}
            subtitle={`${permanentPercentage}% of total`}
            valueColor="text-green-600"
            icon={<BriefcaseIcon className="h-8 w-8 text-green-600" />}
            gradientFrom="from-green-100"
            gradientTo="to-emerald-100"
          />
          <SummaryCard
            title="Avg. Teaching Load"
            value={filteredSummary.average_teaching_load}
            subtitle="hours per week"
            valueColor="text-blue-600"
            icon={<ClockIcon className="h-8 w-8 text-blue-600" />}
            gradientFrom="from-blue-100"
            gradientTo="to-indigo-100"
          />
          <SummaryCard
            title="Advanced Degrees"
            value={filteredSummary.with_masters + filteredSummary.with_doctorate}
            subtitle={`Masters: ${filteredSummary.with_masters}, PhD: ${filteredSummary.with_doctorate}`}
            valueColor="text-indigo-600"
            icon={<AcademicCapIcon className="h-8 w-8 text-indigo-600" />}
            gradientFrom="from-indigo-100"
            gradientTo="to-purple-100"
          />
        </section>
      )}

      {/* Filters */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100" aria-label="Filter Controls">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
              aria-hidden="true" 
            />
            <input
              type="text"
              placeholder="Search by name or employee number..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search personnel"
            />
          </div>

          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={handlePositionChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by position"
          >
            {POSITION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Employment Status Filter */}
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by employment status"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Personnel Table */}
      <section className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100" aria-label="Personnel List">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Employee No.
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Position
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Specialization
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Teaching Hours
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Advisory Class
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Assignments
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {personnel.length === 0 
                      ? 'No personnel found' 
                      : 'No personnel match the current filters'}
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map(person => (
                  <PersonnelRow key={person.id} person={person} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Results count footer */}
        {filteredPersonnel.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Showing {filteredPersonnel.length} of {personnel.length} personnel
          </div>
        )}
      </section>
    </div>
  );
};

export default SF7Dashboard;
