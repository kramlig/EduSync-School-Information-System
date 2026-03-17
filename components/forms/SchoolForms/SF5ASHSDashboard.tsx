/**
 * SF5A-SHS Dashboard - End of Semester and School Year Learner Status
 * 
 * Official DepEd Form SF5A-SHS for Senior High School tracking:
 * - Semester enrollment status
 * - End of semester learner status (Promoted, Retained, etc.)
 * - Track/Strand distribution
 * - Semester completion rates
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSHSStudents, SHS_TRACKS, SHS_STRANDS, getStrandsByTrack, getTrackName, getStrandName } from '../../../src/hooks/useSHSPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import BackButton from '../../BackButton';
import {
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  AcademicCapIcon,
} from '../../icons';

interface SF5ASHSDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

// Status options for SHS students
const LEARNER_STATUS_OPTIONS = [
  { value: 'enrolled', label: 'Enrolled', color: 'bg-blue-100 text-blue-800' },
  { value: 'promoted', label: 'Promoted', color: 'bg-green-100 text-green-800' },
  { value: 'retained', label: 'Retained', color: 'bg-red-100 text-red-800' },
  { value: 'transferred_in', label: 'Transferred In', color: 'bg-purple-100 text-purple-800' },
  { value: 'transferred_out', label: 'Transferred Out', color: 'bg-orange-100 text-orange-800' },
  { value: 'dropped', label: 'Dropped', color: 'bg-gray-100 text-gray-800' },
  { value: 'graduated', label: 'Graduated', color: 'bg-emerald-100 text-emerald-800' },
];

const getStatusColor = (status: string): string => {
  return LEARNER_STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string): string => {
  return LEARNER_STATUS_OPTIONS.find(s => s.value === status)?.label || status;
};

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

const SF5ASHSDashboard: React.FC<SF5ASHSDashboardProps> = ({ session, onBack }) => {
  const { schoolId, settings, school } = useSchoolContext();
  const currentSchoolYear = settings?.currentSchoolYear || '2025-2026';

  // State
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(currentSchoolYear);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<11 | 12 | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'list'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Data hooks
  const { students, statistics, loading: studentsLoading, refresh } = useSHSStudents({
    schoolId,
    gradeLevel: selectedGradeLevel || undefined,
    track: selectedTrack || undefined,
    strand: selectedStrand || undefined,
    sectionId: selectedSection || undefined,
  });

  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });

  const loading = studentsLoading || sectionsLoading;

  // Filter SHS sections only
  const shsSections = useMemo(() => {
    return sections.filter(s => s.grade_level && (s.grade_level === 11 || s.grade_level === 12));
  }, [sections]);

  // Available strands based on selected track
  const availableStrands = useMemo(() => {
    if (!selectedTrack) return SHS_STRANDS;
    return getStrandsByTrack(selectedTrack);
  }, [selectedTrack]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [students, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGradeLevel, selectedTrack, selectedStrand, selectedSection, searchQuery]);

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
    const byStatus: Record<string, number> = {};
    const byTrack: Record<string, number> = {};
    const byStrand: Record<string, number> = {};

    filteredStudents.forEach(s => {
      // By enrollment status
      const status = s.enrollment_status || 'enrolled';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // By track
      if (s.shs_track) {
        byTrack[s.shs_track] = (byTrack[s.shs_track] || 0) + 1;
      }

      // By strand
      if (s.shs_strand) {
        byStrand[s.shs_strand] = (byStrand[s.shs_strand] || 0) + 1;
      }
    });

    return { byStatus, byTrack, byStrand };
  }, [filteredStudents]);

  // Export data
  const handleExport = () => {
    const exportData = filteredStudents.map(s => ({
      'LRN': s.lrn,
      'Name': s.name,
      'Grade Level': s.grade_level,
      'Section': s.section_name || '',
      'Track': s.track_name || s.shs_track || '',
      'Strand': s.strand_name || s.shs_strand || '',
      'Specialization': s.shs_specialization || '',
      'Semester': selectedSemester,
      'Status': getStatusLabel(s.enrollment_status || 'enrolled'),
      'Completion Status': s.shs_completion_status || '',
    }));

    const filename = `SF5A-SHS_${selectedSchoolYear}_Sem${selectedSemester}_${new Date().toISOString().split('T')[0]}.csv`;
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
              <h1 className="text-2xl font-bold text-slate-800">SF5A-SHS</h1>
              <p className="text-sm text-slate-600">End of Semester and School Year Learner Status</p>
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
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{statistics.totalSHSStudents}</p>
                  <p className="text-xs text-slate-500">Total SHS</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{statistics.byGradeLevel.grade11}</p>
                <p className="text-xs text-slate-500">Grade 11</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{statistics.byGradeLevel.grade12}</p>
                <p className="text-xs text-slate-500">Grade 12</p>
              </div>
            </div>
            {Object.entries(statistics.byTrack).slice(0, 3).map(([track, count]) => (
              <div key={track} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500 truncate">{track}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1st Semester</option>
                <option value={2}>2nd Semester</option>
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Grade Level</label>
              <select
                value={selectedGradeLevel ?? ''}
                onChange={(e) => setSelectedGradeLevel(e.target.value ? Number(e.target.value) as 11 | 12 : null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
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
                {shsSections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name} (G{section.grade_level})
                  </option>
                ))}
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
              {/* Status Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Learner Status Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {LEARNER_STATUS_OPTIONS.map(status => (
                    <div key={status.value} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {summaryStats.byStatus[status.value] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Track Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Track Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SHS_TRACKS.map(track => (
                    <div key={track.code} className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">{track.name}</h4>
                      <p className="text-2xl font-bold text-slate-800">
                        {summaryStats.byTrack[track.code] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strand Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Strand Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {SHS_STRANDS.map(strand => (
                    <div key={strand.code} className="p-3 bg-slate-50 rounded-lg">
                      <h4 className="text-xs font-medium text-slate-600 mb-1 truncate" title={strand.name}>
                        {strand.code}
                      </h4>
                      <p className="text-xl font-bold text-slate-800">
                        {summaryStats.byStrand[strand.code] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
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
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Grade</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Section</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Track</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Strand</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                          No SHS students found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-600 font-mono text-xs">{student.lrn}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{student.grade_level}</td>
                          <td className="px-3 py-2 text-slate-600">{student.section_name || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{student.shs_track || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{student.shs_strand || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(student.enrollment_status || 'enrolled')}`}>
                              {getStatusLabel(student.enrollment_status || 'enrolled')}
                            </span>
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

export default SF5ASHSDashboard;
