/**
 * SF9-SHS Dashboard - Learner's Progress Report Card for Senior High School
 * 
 * Official DepEd Form SF9-SHS for SHS grades:
 * - Semester-based grades (Midterm + Final = Semester Grade)
 * - Track/Strand-specific subjects
 * - Core, Applied, and Specialized subjects
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSHSStudents, useSHSSemesterGrades, SHS_TRACKS, SHS_STRANDS } from '../../../src/hooks/useSHSPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import BackButton from '../../BackButton';
import {
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PrinterIcon,
} from '../../icons';

interface SF9SHSDashboardProps {
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

// Get grade descriptor
const getGradeDescriptor = (grade: number | null): string => {
  if (grade === null) return '-';
  if (grade >= 90) return 'Outstanding';
  if (grade >= 85) return 'Very Satisfactory';
  if (grade >= 80) return 'Satisfactory';
  if (grade >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet Expectations';
};

// Get grade color
const getGradeColor = (grade: number | null): string => {
  if (grade === null) return 'text-slate-400';
  if (grade >= 90) return 'text-green-600';
  if (grade >= 85) return 'text-blue-600';
  if (grade >= 80) return 'text-indigo-600';
  if (grade >= 75) return 'text-yellow-600';
  return 'text-red-600';
};

const SF9SHSDashboard: React.FC<SF9SHSDashboardProps> = ({ session, onBack }) => {
  const { schoolId, settings, school } = useSchoolContext();
  const currentSchoolYear = settings?.currentSchoolYear || '2025-2026';

  // State
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(currentSchoolYear);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<11 | 12 | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'individual' | 'summary'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Data hooks
  const { students, statistics, loading: studentsLoading } = useSHSStudents({
    schoolId,
    gradeLevel: selectedGradeLevel || undefined,
    track: selectedTrack || undefined,
    strand: selectedStrand || undefined,
    sectionId: selectedSection || undefined,
  });

  const { grades, loading: gradesLoading } = useSHSSemesterGrades({
    schoolId,
    schoolYear: selectedSchoolYear,
    semester: selectedSemester,
    studentId: selectedStudent || undefined,
  });

  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId });

  const loading = studentsLoading || gradesLoading || sectionsLoading;

  // Filter SHS sections
  const shsSections = useMemo(() => {
    let filtered = sections.filter(s => s.grade_level >= 11);
    if (selectedGradeLevel) {
      filtered = filtered.filter(s => s.grade_level === selectedGradeLevel);
    }
    return filtered;
  }, [sections, selectedGradeLevel]);

  // Available strands
  const availableStrands = useMemo(() => {
    if (!selectedTrack) return SHS_STRANDS;
    return SHS_STRANDS.filter(s => s.track === selectedTrack);
  }, [selectedTrack]);

  // Reset filters
  useEffect(() => {
    setSelectedStrand(null);
  }, [selectedTrack]);

  useEffect(() => {
    setSelectedSection(null);
  }, [selectedGradeLevel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGradeLevel, selectedTrack, selectedStrand, selectedSection, searchQuery]);

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

  // Merge students with grades
  const studentsWithGrades = useMemo(() => {
    return filteredStudents.map(student => {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      
      // Calculate averages
      const midtermGrades = studentGrades.filter(g => g.midterm_grade !== null);
      const finalGrades = studentGrades.filter(g => g.final_grade !== null);
      const semesterGrades = studentGrades.filter(g => g.semester_grade !== null);

      const avgMidterm = midtermGrades.length > 0 
        ? Math.round(midtermGrades.reduce((sum, g) => sum + (g.midterm_grade || 0), 0) / midtermGrades.length * 10) / 10
        : null;
      const avgFinal = finalGrades.length > 0 
        ? Math.round(finalGrades.reduce((sum, g) => sum + (g.final_grade || 0), 0) / finalGrades.length * 10) / 10
        : null;
      const avgSemester = semesterGrades.length > 0 
        ? Math.round(semesterGrades.reduce((sum, g) => sum + (g.semester_grade || 0), 0) / semesterGrades.length * 10) / 10
        : null;

      return {
        ...student,
        grades: studentGrades,
        avgMidterm,
        avgFinal,
        avgSemester,
        subjectCount: studentGrades.length,
        passed: avgSemester !== null && avgSemester >= 75,
      };
    });
  }, [filteredStudents, grades]);

  // Pagination
  const totalPages = Math.ceil(studentsWithGrades.length / PAGE_SIZE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return studentsWithGrades.slice(start, start + PAGE_SIZE);
  }, [studentsWithGrades, currentPage]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = studentsWithGrades.length;
    const withGrades = studentsWithGrades.filter(s => s.avgSemester !== null).length;
    const passed = studentsWithGrades.filter(s => s.passed).length;
    const outstanding = studentsWithGrades.filter(s => s.avgSemester !== null && s.avgSemester >= 90).length;
    const verySatisfactory = studentsWithGrades.filter(s => s.avgSemester !== null && s.avgSemester >= 85 && s.avgSemester < 90).length;
    const satisfactory = studentsWithGrades.filter(s => s.avgSemester !== null && s.avgSemester >= 80 && s.avgSemester < 85).length;
    const fairlySatisfactory = studentsWithGrades.filter(s => s.avgSemester !== null && s.avgSemester >= 75 && s.avgSemester < 80).length;
    const failed = studentsWithGrades.filter(s => s.avgSemester !== null && s.avgSemester < 75).length;

    return {
      total,
      withGrades,
      passed,
      passRate: withGrades > 0 ? Math.round((passed / withGrades) * 100) : 0,
      distribution: {
        outstanding,
        verySatisfactory,
        satisfactory,
        fairlySatisfactory,
        failed,
      },
    };
  }, [studentsWithGrades]);

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

  // Selected student details
  const selectedStudentData = useMemo(() => {
    if (!selectedStudent) return null;
    return studentsWithGrades.find(s => s.id === selectedStudent) || null;
  }, [selectedStudent, studentsWithGrades]);

  // Export
  const handleExport = () => {
    const exportData = studentsWithGrades.map((s, index) => ({
      'No.': index + 1,
      'LRN': s.lrn,
      'Name': s.name,
      'Grade Level': s.grade_level,
      'Section': s.section_name || '',
      'Track': s.shs_track || '',
      'Strand': s.shs_strand || '',
      'Subjects': s.subjectCount,
      'Midterm Avg': s.avgMidterm ?? '-',
      'Final Avg': s.avgFinal ?? '-',
      'Semester Avg': s.avgSemester ?? '-',
      'Status': s.passed ? 'Passed' : s.avgSemester !== null ? 'Failed' : 'No Grades',
    }));

    const filename = `SF9-SHS_Grades_${selectedSchoolYear}_Sem${selectedSemester}.csv`;
    exportToCSV(exportData, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">SF9-SHS</h1>
              <p className="text-sm text-slate-600">Learner's Progress Report Card - Senior High School</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedStudent && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                Print Card
              </button>
            )}
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
        {selectedStudentData && (
          <div className="hidden print:block text-center mb-4">
            <p className="text-xs">Republic of the Philippines • Department of Education</p>
            <h1 className="text-lg font-bold">Learner's Progress Report Card</h1>
            <h2 className="text-base font-semibold">SENIOR HIGH SCHOOL (SF9-SHS)</h2>
            <p className="text-sm">{school?.name || 'School Name'}</p>
            <p className="text-sm">School Year {selectedSchoolYear} • Semester {selectedSemester}</p>
          </div>
        )}

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
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{summaryStats.passed}</p>
                <p className="text-xs text-slate-500">Passed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{summaryStats.passRate}%</p>
              <p className="text-xs text-slate-500">Pass Rate</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summaryStats.distribution.outstanding}</p>
              <p className="text-xs text-slate-500">Outstanding</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summaryStats.distribution.verySatisfactory}</p>
              <p className="text-xs text-slate-500">Very Satisfactory</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summaryStats.distribution.failed}</p>
              <p className="text-xs text-slate-500">Failed</p>
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
                title="School Year"
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
                title="Semester"
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
                title="Grade Level"
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
                title="Track"
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
                title="Strand"
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
                title="Section"
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
            onClick={() => { setViewMode('list'); setSelectedStudent(null); }}
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
          {selectedStudent && (
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'individual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4" />
              Report Card
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'individual' && selectedStudentData ? (
            /* Individual Report Card */
            <div className="p-6 print:p-4">
              {/* Student Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:mb-4 print:text-xs">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="font-semibold">{selectedStudentData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">LRN</p>
                  <p className="font-mono">{selectedStudentData.lrn}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Grade & Section</p>
                  <p className="font-semibold">Grade {selectedStudentData.grade_level} - {selectedStudentData.section_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Track/Strand</p>
                  <p className="font-semibold">{selectedStudentData.shs_strand || selectedStudentData.shs_track || '-'}</p>
                </div>
              </div>

              {/* Grades Table */}
              <table className="w-full text-sm print:text-xs border border-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-r">Subject</th>
                    <th className="px-3 py-2 text-center border-b border-r">Type</th>
                    <th className="px-3 py-2 text-center border-b border-r">Midterm</th>
                    <th className="px-3 py-2 text-center border-b border-r">Final</th>
                    <th className="px-3 py-2 text-center border-b border-r">Semester Grade</th>
                    <th className="px-3 py-2 text-center border-b">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentData.grades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        No grades recorded for this semester.
                      </td>
                    </tr>
                  ) : (
                    selectedStudentData.grades.map(grade => (
                      <tr key={grade.id} className="border-b">
                        <td className="px-3 py-2 border-r">{grade.subject_name || 'Subject'}</td>
                        <td className="px-3 py-2 text-center border-r text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100">
                            {grade.subject_type || 'Core'}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-center border-r font-medium ${getGradeColor(grade.midterm_grade)}`}>
                          {grade.midterm_grade ?? '-'}
                        </td>
                        <td className={`px-3 py-2 text-center border-r font-medium ${getGradeColor(grade.final_grade)}`}>
                          {grade.final_grade ?? '-'}
                        </td>
                        <td className={`px-3 py-2 text-center border-r font-bold ${getGradeColor(grade.semester_grade)}`}>
                          {grade.semester_grade ?? '-'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {grade.semester_grade !== null ? getGradeDescriptor(grade.semester_grade) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-semibold">
                  <tr>
                    <td className="px-3 py-2 border-r" colSpan={2}>GENERAL AVERAGE</td>
                    <td className={`px-3 py-2 text-center border-r ${getGradeColor(selectedStudentData.avgMidterm)}`}>
                      {selectedStudentData.avgMidterm ?? '-'}
                    </td>
                    <td className={`px-3 py-2 text-center border-r ${getGradeColor(selectedStudentData.avgFinal)}`}>
                      {selectedStudentData.avgFinal ?? '-'}
                    </td>
                    <td className={`px-3 py-2 text-center border-r ${getGradeColor(selectedStudentData.avgSemester)}`}>
                      {selectedStudentData.avgSemester ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {selectedStudentData.avgSemester !== null ? (
                        selectedStudentData.passed ? (
                          <span className="text-green-600">PASSED</span>
                        ) : (
                          <span className="text-red-600">FAILED</span>
                        )
                      ) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Print Footer */}
              <div className="hidden print:block mt-8 pt-4 border-t border-slate-300">
                <div className="grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <p className="border-t border-slate-400 pt-1">Parent/Guardian Signature</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-400 pt-1">Class Adviser Signature</p>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'summary' ? (
            /* Summary View */
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Grade Distribution</h3>
              
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-3xl font-bold text-green-600">{summaryStats.distribution.outstanding}</p>
                  <p className="text-sm text-green-700">Outstanding</p>
                  <p className="text-xs text-slate-500">(90-100)</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-3xl font-bold text-blue-600">{summaryStats.distribution.verySatisfactory}</p>
                  <p className="text-sm text-blue-700">Very Satisfactory</p>
                  <p className="text-xs text-slate-500">(85-89)</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{summaryStats.distribution.satisfactory}</p>
                  <p className="text-sm text-indigo-700">Satisfactory</p>
                  <p className="text-xs text-slate-500">(80-84)</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{summaryStats.distribution.fairlySatisfactory}</p>
                  <p className="text-sm text-yellow-700">Fairly Satisfactory</p>
                  <p className="text-xs text-slate-500">(75-79)</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-3xl font-bold text-red-600">{summaryStats.distribution.failed}</p>
                  <p className="text-sm text-red-700">Did Not Meet</p>
                  <p className="text-xs text-slate-500">(Below 75)</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{summaryStats.withGrades}</p>
                    <p className="text-sm text-slate-600">With Grades</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">{summaryStats.passed}</p>
                    <p className="text-sm text-slate-600">Passed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{summaryStats.passRate}%</p>
                    <p className="text-sm text-slate-600">Pass Rate</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">
                  Students ({studentsWithGrades.length}) - Click a student to view report card
                </span>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-500px)]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">No.</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">LRN</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Name</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Grade</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Section</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Strand</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Midterm</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Final</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Semester</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                          No SHS students found.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student, index) => (
                        <tr 
                          key={student.id} 
                          className="hover:bg-blue-50 cursor-pointer"
                          onClick={() => { setSelectedStudent(student.id); setViewMode('individual'); }}
                        >
                          <td className="px-3 py-2 text-slate-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono text-xs">{student.lrn}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{student.grade_level}</td>
                          <td className="px-3 py-2 text-slate-600">{student.section_name || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{student.shs_strand || '-'}</td>
                          <td className={`px-3 py-2 text-center font-medium ${getGradeColor(student.avgMidterm)}`}>
                            {student.avgMidterm ?? '-'}
                          </td>
                          <td className={`px-3 py-2 text-center font-medium ${getGradeColor(student.avgFinal)}`}>
                            {student.avgFinal ?? '-'}
                          </td>
                          <td className={`px-3 py-2 text-center font-bold ${getGradeColor(student.avgSemester)}`}>
                            {student.avgSemester ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.avgSemester !== null ? (
                              student.passed ? (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Passed
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  Failed
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
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
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, studentsWithGrades.length)} of {studentsWithGrades.length}
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

export default SF9SHSDashboard;
