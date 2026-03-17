/**
 * SF1-SHS Dashboard - School Register for Senior High School
 * 
 * Official DepEd Form SF1-SHS for SHS student registration:
 * - Track/Strand-based enrollment
 * - Semester tracking (1st/2nd)
 * - Grade 11 and 12 classification
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSHSStudents, SHS_TRACKS, SHS_STRANDS, getTrackName, getStrandName } from '../../../src/hooks/useSHSPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import BackButton from '../../BackButton';
import {
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
  PrinterIcon,
} from '../../icons';

interface SF1SHSDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

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

const SF1SHSDashboard: React.FC<SF1SHSDashboardProps> = ({ session, onBack }) => {
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

  // Data hooks - SHS only (grades 11-12)
  const { students, statistics, loading: studentsLoading } = useSHSStudents({
    schoolId,
    gradeLevel: selectedGradeLevel || undefined,
    track: selectedTrack || undefined,
    strand: selectedStrand || undefined,
    sectionId: selectedSection || undefined,
  });

  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });

  const loading = studentsLoading || sectionsLoading;

  // Filter SHS sections only (Grades 11-12)
  const shsSections = useMemo(() => {
    let filtered = sections.filter(s => s.grade_level >= 11);
    if (selectedGradeLevel) {
      filtered = filtered.filter(s => s.grade_level === selectedGradeLevel);
    }
    return filtered;
  }, [sections, selectedGradeLevel]);

  // Available strands based on selected track
  const availableStrands = useMemo(() => {
    if (!selectedTrack) return SHS_STRANDS;
    return SHS_STRANDS.filter(s => s.track === selectedTrack);
  }, [selectedTrack]);

  // Filter students
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

  // Reset section when grade level changes
  useEffect(() => {
    setSelectedSection(null);
  }, [selectedGradeLevel]);

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
    const grade11 = filteredStudents.filter(s => s.grade_level === 11).length;
    const grade12 = filteredStudents.filter(s => s.grade_level === 12).length;
    const male = filteredStudents.filter(s => s.gender?.toLowerCase() === 'male').length;
    const female = total - male;
    
    const byTrack: Record<string, { total: number; male: number; female: number }> = {};
    const byStrand: Record<string, { total: number; male: number; female: number }> = {};

    filteredStudents.forEach(s => {
      const isMale = s.gender?.toLowerCase() === 'male';
      
      // By track
      if (s.shs_track) {
        if (!byTrack[s.shs_track]) byTrack[s.shs_track] = { total: 0, male: 0, female: 0 };
        byTrack[s.shs_track].total++;
        if (isMale) byTrack[s.shs_track].male++;
        else byTrack[s.shs_track].female++;
      }

      // By strand
      if (s.shs_strand) {
        if (!byStrand[s.shs_strand]) byStrand[s.shs_strand] = { total: 0, male: 0, female: 0 };
        byStrand[s.shs_strand].total++;
        if (isMale) byStrand[s.shs_strand].male++;
        else byStrand[s.shs_strand].female++;
      }
    });

    return {
      total,
      grade11,
      grade12,
      male,
      female,
      byTrack,
      byStrand,
    };
  }, [filteredStudents]);

  // Export data
  const handleExport = () => {
    const exportData = filteredStudents.map((s, index) => ({
      'No.': index + 1,
      'LRN': s.lrn,
      'Last Name': s.lastName || s.name?.split(' ').pop() || '',
      'First Name': s.firstName || s.name?.split(' ')[0] || '',
      'Middle Name': s.middleName || '',
      'Sex': s.gender || '',
      'Birth Date': s.birthday || s.birthDate || '',
      'Age': s.age || '',
      'Grade Level': s.grade_level,
      'Section': s.section_name || '',
      'Track': s.shs_track || '',
      'Strand': s.shs_strand || '',
      'Specialization': s.shs_specialization || '',
      'Parent/Guardian': s.guardianName || '',
      'Contact': s.parentContact || '',
      'Address': s.address || '',
    }));

    const filename = `SF1-SHS_${selectedSchoolYear}_Sem${selectedSemester}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">SF1-SHS</h1>
              <p className="text-sm text-slate-600">School Register - Senior High School</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-4">
          <p className="text-xs">Republic of the Philippines • Department of Education</p>
          <h1 className="text-lg font-bold">School Form 1 (SF1) School Register</h1>
          <h2 className="text-base font-semibold">SENIOR HIGH SCHOOL</h2>
          <p className="text-sm">{school?.name || 'School Name'}</p>
          <p className="text-sm">School Year {selectedSchoolYear} • Semester {selectedSemester}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:hidden">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{summaryStats.total}</p>
                <p className="text-xs text-slate-500">Total SHS</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{summaryStats.grade11}</p>
                <p className="text-xs text-slate-500">Grade 11</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{summaryStats.grade12}</p>
                <p className="text-xs text-slate-500">Grade 12</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summaryStats.male}</p>
              <p className="text-xs text-slate-500">Male</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-600">{summaryStats.female}</p>
              <p className="text-xs text-slate-500">Female</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">{Object.keys(summaryStats.byTrack).length}</p>
              <p className="text-xs text-slate-500">Tracks Active</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
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
                <option value={11}>Grade 11</option>
                <option value={12}>Grade 12</option>
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
        <div className="flex items-center gap-2 border-b border-slate-200 print:hidden">
          <button
            onClick={() => setViewMode('summary')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            Summary by Track/Strand
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
            Student Register
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'summary' ? (
            /* Summary View */
            <div className="p-6 space-y-6 print:p-2">
              {/* Track Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 print:text-base">Enrollment by Track</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                  {SHS_TRACKS.map(track => {
                    const data = summaryStats.byTrack[track.code] || { total: 0, male: 0, female: 0 };
                    return (
                      <div key={track.code} className="p-4 bg-slate-50 rounded-lg print:p-2 print:border print:border-slate-300">
                        <h4 className="text-sm font-medium text-slate-600 mb-2 print:text-xs">{track.name}</h4>
                        <p className="text-2xl font-bold text-slate-800 print:text-lg">{data.total}</p>
                        <div className="flex gap-4 mt-1 text-xs text-slate-500">
                          <span>M: {data.male}</span>
                          <span>F: {data.female}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strand Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 print:text-base">Enrollment by Strand</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm print:text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-600 font-medium">Strand</th>
                        <th className="px-3 py-2 text-left text-slate-600 font-medium">Track</th>
                        <th className="px-3 py-2 text-center text-slate-600 font-medium">Male</th>
                        <th className="px-3 py-2 text-center text-slate-600 font-medium">Female</th>
                        <th className="px-3 py-2 text-center text-slate-600 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SHS_STRANDS.map(strand => {
                        const data = summaryStats.byStrand[strand.code] || { total: 0, male: 0, female: 0 };
                        if (data.total === 0) return null;
                        return (
                          <tr key={strand.code} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">{strand.name}</td>
                            <td className="px-3 py-2 text-slate-600">{getTrackName(strand.track)}</td>
                            <td className="px-3 py-2 text-center text-blue-600">{data.male}</td>
                            <td className="px-3 py-2 text-center text-pink-600">{data.female}</td>
                            <td className="px-3 py-2 text-center font-medium">{data.total}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-semibold">
                        <td className="px-3 py-2" colSpan={2}>TOTAL</td>
                        <td className="px-3 py-2 text-center text-blue-600">{summaryStats.male}</td>
                        <td className="px-3 py-2 text-center text-pink-600">{summaryStats.female}</td>
                        <td className="px-3 py-2 text-center">{summaryStats.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* List View - Student Register */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 print:hidden">
                <span className="text-sm font-medium text-slate-700">
                  Students ({filteredStudents.length})
                </span>
              </div>
              <div className="overflow-auto print:overflow-visible" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                <table className="w-full text-sm print:text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10 print:bg-slate-200">
                    <tr>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium">No.</th>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium">LRN</th>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium">Name</th>
                      <th className="px-2 py-2 text-center text-slate-600 font-medium">Sex</th>
                      <th className="px-2 py-2 text-center text-slate-600 font-medium">Grade</th>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium">Section</th>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium">Track</th>
                      <th className="px-2 py-2 text-left text-slate-600 font-medium">Strand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                          No SHS students found.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student, index) => (
                        <tr key={student.id} className="hover:bg-slate-50 print:hover:bg-white">
                          <td className="px-2 py-2 text-slate-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                          <td className="px-2 py-2 text-slate-600 font-mono text-xs">{student.lrn}</td>
                          <td className="px-2 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-2 py-2 text-center text-slate-600">
                            {student.gender?.charAt(0).toUpperCase() || '-'}
                          </td>
                          <td className="px-2 py-2 text-center text-slate-600">{student.grade_level}</td>
                          <td className="px-2 py-2 text-slate-600">{student.section_name || '-'}</td>
                          <td className="px-2 py-2 text-slate-600">{student.shs_track || '-'}</td>
                          <td className="px-2 py-2 text-slate-600">{student.shs_strand || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
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

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-8 text-xs">
            <div>
              <p className="border-t border-slate-400 pt-1">Class Adviser's Signature</p>
            </div>
            <div>
              <p className="border-t border-slate-400 pt-1">Date</p>
            </div>
            <div>
              <p className="border-t border-slate-400 pt-1">School Head's Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SF1SHSDashboard;
