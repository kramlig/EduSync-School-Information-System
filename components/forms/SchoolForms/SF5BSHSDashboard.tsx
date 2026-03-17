/**
 * SF5B-SHS Dashboard - Learners with Complete SHS Requirements
 * 
 * Official DepEd Form SF5B-SHS for tracking SHS graduation eligibility:
 * - Core subjects completion
 * - Applied/Specialized subjects completion
 * - Work immersion/research requirements
 * - Graduation eligibility status
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSHSStudents, useSHSCompletion, SHS_TRACKS, SHS_STRANDS, getTrackName, getStrandName } from '../../../src/hooks/useSHSPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import BackButton from '../../BackButton';
import {
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from '../../icons';

interface SF5BSHSDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

// Completion status options
const COMPLETION_STATUS_OPTIONS = [
  { value: 'eligible', label: 'Eligible for Graduation', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  { value: 'pending', label: 'Requirements Pending', color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon },
  { value: 'incomplete', label: 'Incomplete', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
];

// CSV Export helper
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value ?? '';
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const SF5BSHSDashboard: React.FC<SF5BSHSDashboardProps> = ({ session, onBack }) => {
  const { schoolId, settings, school } = useSchoolContext();
  const currentSchoolYear = settings?.currentSchoolYear || '2025-2026';

  // State
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(currentSchoolYear);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [filterEligible, setFilterEligible] = useState<'all' | 'eligible' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'list' | 'checklist'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Data hooks - Focus on Grade 12 students (graduating)
  const { students, statistics, loading: studentsLoading } = useSHSStudents({
    schoolId,
    gradeLevel: 12, // SF5B focuses on Grade 12 (graduating students)
    track: selectedTrack || undefined,
    strand: selectedStrand || undefined,
    sectionId: selectedSection || undefined,
  });

  const { requirements, loading: requirementsLoading } = useSHSCompletion({
    schoolId,
    schoolYear: selectedSchoolYear,
    eligibleOnly: filterEligible === 'eligible',
  });

  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });

  const loading = studentsLoading || sectionsLoading || requirementsLoading;

  // Filter Grade 12 sections only
  const grade12Sections = useMemo(() => {
    return sections.filter(s => s.grade_level === 12);
  }, [sections]);

  // Available strands based on selected track
  const availableStrands = useMemo(() => {
    if (!selectedTrack) return SHS_STRANDS;
    return SHS_STRANDS.filter(s => s.track === selectedTrack);
  }, [selectedTrack]);

  // Merge students with their completion requirements
  const studentsWithRequirements = useMemo(() => {
    return students.map(student => {
      const req = requirements.find(r => r.student_id === student.id);
      return {
        ...student,
        requirements: req,
        isEligible: req?.eligible_for_graduation ?? false,
        coreComplete: req?.core_subjects_completed ?? false,
        appliedComplete: req?.applied_subjects_completed ?? false,
        immersionComplete: req?.work_immersion_completed ?? false,
        researchComplete: req?.research_completed ?? false,
      };
    });
  }, [students, requirements]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = studentsWithRequirements;

    if (filterEligible === 'eligible') {
      result = result.filter(s => s.isEligible);
    } else if (filterEligible === 'pending') {
      result = result.filter(s => !s.isEligible);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [studentsWithRequirements, filterEligible, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTrack, selectedStrand, selectedSection, filterEligible, searchQuery]);

  // Reset strand when track changes
  useEffect(() => {
    setSelectedStrand(null);
  }, [selectedTrack]);

  // School year options
  const schoolYears = useMemo(() => {
    const years: string[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = -2; i <= 1; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  }, []);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredStudents.length;
    const eligible = filteredStudents.filter(s => s.isEligible).length;
    const pending = total - eligible;
    
    const byTrack: Record<string, { total: number; eligible: number }> = {};
    const byStrand: Record<string, { total: number; eligible: number }> = {};

    filteredStudents.forEach(s => {
      // By track
      if (s.shs_track) {
        if (!byTrack[s.shs_track]) byTrack[s.shs_track] = { total: 0, eligible: 0 };
        byTrack[s.shs_track].total++;
        if (s.isEligible) byTrack[s.shs_track].eligible++;
      }

      // By strand
      if (s.shs_strand) {
        if (!byStrand[s.shs_strand]) byStrand[s.shs_strand] = { total: 0, eligible: 0 };
        byStrand[s.shs_strand].total++;
        if (s.isEligible) byStrand[s.shs_strand].eligible++;
      }
    });

    // Requirements completion stats
    const coreComplete = filteredStudents.filter(s => s.coreComplete).length;
    const appliedComplete = filteredStudents.filter(s => s.appliedComplete).length;
    const immersionComplete = filteredStudents.filter(s => s.immersionComplete).length;
    const researchComplete = filteredStudents.filter(s => s.researchComplete).length;

    return {
      total,
      eligible,
      pending,
      eligibilityRate: total > 0 ? Math.round((eligible / total) * 100) : 0,
      byTrack,
      byStrand,
      requirements: {
        coreComplete,
        appliedComplete,
        immersionComplete,
        researchComplete,
      },
    };
  }, [filteredStudents]);

  // Export data
  const handleExport = () => {
    const exportData = filteredStudents.map(s => ({
      'LRN': s.lrn,
      'Name': s.name,
      'Section': s.section_name || '',
      'Track': s.shs_track || '',
      'Strand': s.shs_strand || '',
      'Core Subjects': s.coreComplete ? 'Complete' : 'Incomplete',
      'Applied Subjects': s.appliedComplete ? 'Complete' : 'Incomplete',
      'Work Immersion': s.immersionComplete ? 'Complete' : 'Incomplete',
      'Research/Capstone': s.researchComplete ? 'Complete' : 'Incomplete',
      'Eligible for Graduation': s.isEligible ? 'Yes' : 'No',
    }));

    const filename = `SF5B-SHS_Completers_${selectedSchoolYear}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">SF5B-SHS</h1>
              <p className="text-sm text-slate-600">Learners with Complete SHS Requirements</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{summaryStats.total}</p>
                <p className="text-xs text-slate-500">Grade 12 Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{summaryStats.eligible}</p>
                <p className="text-xs text-slate-500">Eligible</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{summaryStats.eligibilityRate}%</p>
              <p className="text-xs text-slate-500">Eligibility Rate</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 col-span-2">
            <p className="text-xs text-slate-500 mb-2">Requirements Completion</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-slate-800">{summaryStats.requirements.coreComplete}</p>
                <p className="text-xs text-slate-500">Core</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{summaryStats.requirements.appliedComplete}</p>
                <p className="text-xs text-slate-500">Applied</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{summaryStats.requirements.immersionComplete}</p>
                <p className="text-xs text-slate-500">Immersion</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{summaryStats.requirements.researchComplete}</p>
                <p className="text-xs text-slate-500">Research</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* School Year */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">School Year</label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {schoolYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Track */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Track</label>
              <select
                value={selectedTrack ?? ''}
                onChange={(e) => setSelectedTrack(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tracks</option>
                {SHS_TRACKS.map(track => (
                  <option key={track.code} value={track.code}>{track.name}</option>
                ))}
              </select>
            </div>

            {/* Strand */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Strand</label>
              <select
                value={selectedStrand ?? ''}
                onChange={(e) => setSelectedStrand(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Strands</option>
                {availableStrands.map(strand => (
                  <option key={strand.code} value={strand.code}>{strand.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
              <select
                value={selectedSection ?? ''}
                onChange={(e) => setSelectedSection(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                {grade12Sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>

            {/* Eligibility Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={filterEligible}
                onChange={(e) => setFilterEligible(e.target.value as 'all' | 'eligible' | 'pending')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Students</option>
                <option value="eligible">Eligible Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name or LRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setViewMode('summary')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            Summary
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            Student List
          </button>
          <button
            onClick={() => setViewMode('checklist')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'checklist'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Requirements Checklist
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'summary' ? (
            /* Summary View */
            <div className="p-6 space-y-6">
              {/* Track Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Eligibility by Track</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SHS_TRACKS.map(track => {
                    const data = summaryStats.byTrack[track.code] || { total: 0, eligible: 0 };
                    const rate = data.total > 0 ? Math.round((data.eligible / data.total) * 100) : 0;
                    return (
                      <div key={track.code} className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-600 mb-2">{track.name}</h4>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-bold text-green-600">{data.eligible}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-lg text-slate-600">{data.total}</span>
                        </div>
                        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{rate}% eligible</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strand Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Eligibility by Strand</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {SHS_STRANDS.map(strand => {
                    const data = summaryStats.byStrand[strand.code] || { total: 0, eligible: 0 };
                    if (data.total === 0) return null;
                    const rate = data.total > 0 ? Math.round((data.eligible / data.total) * 100) : 0;
                    return (
                      <div key={strand.code} className="p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-xs font-medium text-slate-600 mb-1">{strand.code}</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-green-600">{data.eligible}</span>
                          <span className="text-xs text-slate-400">/ {data.total}</span>
                        </div>
                        <p className="text-xs text-slate-500">{rate}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : viewMode === 'checklist' ? (
            /* Requirements Checklist View */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">
                  Requirements Checklist ({filteredStudents.length} students)
                </span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Student</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Track/Strand</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Core</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Applied</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Immersion</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Research</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                          No Grade 12 students found.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-800">{student.name}</span>
                            <span className="text-xs text-slate-400 ml-2">({student.lrn})</span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {student.shs_strand || student.shs_track || '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.coreComplete ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.appliedComplete ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.immersionComplete ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.researchComplete ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.isEligible ? (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Eligible
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* List View */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">
                  Students ({filteredStudents.length})
                </span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">LRN</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Name</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Section</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Track</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Strand</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                          No Grade 12 students found.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-600 font-mono text-xs">{student.lrn}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-3 py-2 text-slate-600">{student.section_name || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{student.shs_track || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{student.shs_strand || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            {student.isEligible ? (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Eligible
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="px-2 text-sm text-slate-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded disabled:opacity-50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SF5BSHSDashboard;
