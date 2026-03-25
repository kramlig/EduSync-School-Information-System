/**
 * SF9Dashboard.tsx
 * School Form 9 (Report Card) Dashboard
 *
 * Student list dashboard for generating DepEd SF9 report cards.
 * Mirrors Form138Dashboard but renders SF9-formatted report cards
 * with MATATAG curriculum layout and Homeroom Guidance assessment.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import { useGradesPostgreSQL } from '../../../src/hooks/useGradesPostgreSQL';
import { useLearningAreasPostgreSQL } from '../../../src/hooks/useLearningAreasPostgreSQL';
import { useAttendancePostgreSQL } from '../../../src/hooks/useAttendancePostgreSQL';
import { useCoreValuesPostgreSQL } from '../../../src/hooks/useCoreValuesPostgreSQL';
import { useTeachersPostgreSQL } from '../../../src/hooks/useTeachersPostgreSQL';
import { useHomeroomGuidancePostgreSQL } from '../../../src/hooks/useHomeroomGuidancePostgreSQL';
import { supabase } from '../../../src/lib/supabase';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import PrintableSF9Report from '../SF9/PrintableSF9Report';
import { EmptyState } from '../shared/FormComponents';
import { CardSkeleton } from '../shared/LoadingStates';

// Staff roles that can see all students
const ADMIN_ROLES = ['admin', 'principal', 'registrar', 'superadmin'];

const getStudentDisplayName = (student: any): string => {
  if (student.name?.trim()) return student.name.trim();
  const full = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  return full || 'Unnamed Student';
};

const getFinalGrade = (grade: any): number | undefined => {
  if (!grade) return undefined;
  if (grade.finalGrade !== undefined) return grade.finalGrade;
  const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
  const values: number[] = [];
  for (const q of quarters) {
    const v = grade[q];
    if (typeof v === 'number') values.push(v);
    else if (v && typeof v === 'object') {
      const nums = Object.values(v as Record<string, any>).filter(n => typeof n === 'number') as number[];
      if (nums.length) values.push(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length));
    }
  }
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

interface SF9DashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

const STUDENTS_PER_PAGE = 30;

const SF9Dashboard: React.FC<SF9DashboardProps> = ({ session }) => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();

  const authUser = session.user;
  const teacherId = (authUser as any).postgresqlId || authUser.id;
  const userRole = (authUser as any).role?.toLowerCase() || '';
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Filter state
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');

  // Data hooks
  const sid = schoolId ?? undefined;

  const studentFetchOptions = useMemo(() => {
    const options: any = { schoolId: sid, includeSection: true };
    if (selectedSectionId !== 'all') options.sectionId = selectedSectionId;
    return options;
  }, [sid, selectedSectionId]);

  const { students, loading: studentsLoading } = useStudentsPostgreSQL(studentFetchOptions);
  const { grades, loading: gradesLoading } = useGradesPostgreSQL({ schoolId: sid });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: sid });
  const { learningAreas, loading: learningAreasLoading } = useLearningAreasPostgreSQL();
  const { coreValues, coreValueGrades, loading: coreValuesLoading } = useCoreValuesPostgreSQL(true, sid);
  const { attendanceRecords, loading: attendanceLoading } = useAttendancePostgreSQL({ schoolId: sid || '' });
  const { teachers, loading: teachersLoading } = useTeachersPostgreSQL({ schoolId: sid });
  const { grades: homeroomGuidanceGrades, loading: hgLoading } = useHomeroomGuidancePostgreSQL(true, sid);

  const [settings, setSettings] = useState<any>({ schoolYear: '2025-2026' });
  const [settingsLoading, setSettingsLoading] = useState(true);

  const loading = studentsLoading || gradesLoading || sectionsLoading || learningAreasLoading || coreValuesLoading || attendanceLoading || teachersLoading || hgLoading || settingsLoading;

  // Fetch school settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      if (sid && sid !== 'default') {
        const { data, error } = await supabase
          .from('schools')
          .select('current_school_year, settings, name, division, region, district, principal_name, school_id_number')
          .eq('id', sid)
          .single();
        if (!error && data) {
          setSettings({
            schoolYear: data.current_school_year,
            schoolName: data.name,
            schoolId: data.school_id_number || '',
            division: data.division,
            region: data.region,
            district: data.district,
            principalName: data.principal_name,
            ...data.settings,
          });
        }
      }
    } catch (err) {
      console.error('[SF9Dashboard] Error fetching settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, [sid]);

  useEffect(() => {
    if (sid) fetchSettings();
  }, [sid, fetchSettings]);

  // schoolData object for PrintableSF9Report
  const schoolData = useMemo(() => ({
    students,
    grades,
    sections,
    teachers,
    settings,
    learningAreas,
    coreValues,
    coreValueGrades,
    attendanceRecords,
    homeroomGuidanceGrades,
    monthlySchoolDaysConfig: {
      Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0, Jun: 10,
      Jul: 22, Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10,
    } as Record<string, number>,
  }), [students, grades, sections, teachers, settings, learningAreas, coreValues, coreValueGrades, attendanceRecords, homeroomGuidanceGrades]);

  // Selection & pagination
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);

  // ── Filtering ──
  const filteredStudents = useMemo(() => {
    let filtered = [...students];
    if (!isAdmin) {
      const teacherSectionIds = new Set(sections.filter(s => s.adviserId === teacherId).map(s => s.id));
      filtered = filtered.filter(s => s.sectionId && teacherSectionIds.has(s.sectionId));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s =>
        getStudentDisplayName(s).toLowerCase().includes(q) || (s.lrn || '').toLowerCase().includes(q),
      );
    }
    if (selectedGradeLevel !== 'all') {
      filtered = filtered.filter(s => {
        const sec = sections.find(x => x.id === s.sectionId);
        return sec && sec.gradeLevel.toString() === selectedGradeLevel;
      });
    }
    if (selectedSectionId !== 'all') {
      filtered = filtered.filter(s => s.sectionId === selectedSectionId);
    }
    return filtered;
  }, [students, searchQuery, selectedGradeLevel, selectedSectionId, sections, teacherId, isAdmin]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGradeLevel, selectedSectionId]);

  const availableGradeLevels = useMemo(() => {
    const src = isAdmin ? sections : sections.filter(s => s.adviserId === teacherId);
    return Array.from(new Set(src.map(s => s.gradeLevel.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
  }, [sections, teacherId, isAdmin]);

  const availableSections = useMemo(() => {
    const src = isAdmin ? sections : sections.filter(s => s.adviserId === teacherId);
    return selectedGradeLevel === 'all' ? src : src.filter(s => s.gradeLevel.toString() === selectedGradeLevel);
  }, [sections, selectedGradeLevel, teacherId, isAdmin]);

  // ── Actions ──
  const handleSelectAll = useCallback(() => setSelectedStudents(filteredStudents.map(s => s.id)), [filteredStudents]);
  const handleDeselectAll = useCallback(() => setSelectedStudents([]), []);
  const handleStudentToggle = useCallback((id: string) => {
    setSelectedStudents(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }, []);

  const handlePrintSelected = useCallback(() => {
    if (selectedStudents.length === 0) return;
    navigate(`/reports/school-forms/sf9/print?students=${selectedStudents.join(',')}`);
  }, [selectedStudents, navigate]);

  const handlePrintStudent = useCallback((id: string) => {
    navigate(`/reports/school-forms/sf9/print?students=${id}`);
  }, [navigate]);

  const handleViewStudent = useCallback((studentObj: any) => {
    setViewingStudent(studentObj);
    setShowViewModal(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedGradeLevel('all');
    setSelectedSectionId('all');
  }, []);

  const statistics = useMemo(() => {
    const total = filteredStudents.length;
    const honor = filteredStudents.filter(s => {
      const sg = grades.filter((g: any) => g.studentId === s.id);
      const finals = sg.map((g: any) => getFinalGrade(g)).filter((g: any): g is number => typeof g === 'number');
      return finals.length > 0 && finals.reduce((a, b) => a + b, 0) / finals.length >= 90;
    }).length;
    return { totalStudents: total, honorStudents: honor, selectedCount: selectedStudents.length };
  }, [filteredStudents, grades, selectedStudents]);

  // ── Render ──
  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">📝 School Form 9 - Report Card</h1>
            <p className="text-teal-100 text-lg">Generate and print SF9 report cards (MATATAG Curriculum)</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-teal-200">
              <span>📊 {statistics.totalStudents} Students Available</span>
              {statistics.honorStudents > 0 && <span>🏆 {statistics.honorStudents} Honor Students</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold opacity-90">{statistics.totalStudents}</div>
            <div className="text-teal-200 text-sm">Students</div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
          <p className="text-sm font-medium text-gray-600">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{statistics.totalStudents}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-600">Honor Students</p>
          <p className="text-2xl font-bold text-gray-900">{statistics.honorStudents}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <p className="text-sm font-medium text-gray-600">Selected</p>
          <p className="text-2xl font-bold text-gray-900">{statistics.selectedCount}</p>
        </div>
      </div>

      {/* Filters & student list */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Student Report Cards</h2>
          {selectedStudents.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
              <button
                onClick={handlePrintSelected}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                🖨️ Print Selected
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="sf9-gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              id="sf9-gradeLevel"
              value={selectedGradeLevel}
              onChange={e => setSelectedGradeLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Grades</option>
              {availableGradeLevels.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sf9-section" className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              id="sf9-section"
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Sections</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sf9-search" className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <input
              id="sf9-search"
              type="text"
              placeholder="Search by name or LRN"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              disabled={filteredStudents.length === 0}
              className="text-teal-600 hover:text-teal-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Select All ({filteredStudents.length})
            </button>
            <button onClick={clearFilters} className="text-gray-600 hover:text-gray-800 text-sm font-medium">
              Clear Filters
            </button>
          </div>
          {filteredStudents.length > STUDENTS_PER_PAGE && (
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * STUDENTS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
            </div>
          )}
        </div>

        {/* Student grid */}
        {filteredStudents.length === 0 ? (
          <EmptyState title="No Students Found" message="No students match your current filters. Try adjusting your search criteria." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedStudents.map(student => {
                const sec = sections.find(s => s.id === student.sectionId);
                const studentGradeList = grades.filter((g: any) => g.studentId === student.id);
                const hasGrades = studentGradeList.length > 0;
                const finals = studentGradeList.map((g: any) => getFinalGrade(g)).filter((g: any): g is number => typeof g === 'number');
                const average = finals.length > 0 ? finals.reduce((a, b) => a + b, 0) / finals.length : 0;

                return (
                  <div key={student.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{getStudentDisplayName(student)}</h3>
                            <p className="text-sm text-gray-600 font-medium">LRN: {student.lrn || 'Not Assigned'}</p>
                            <p className="text-sm text-gray-500">
                              {sec ? `${sec.name} (Grade ${sec.gradeLevel})` : 'No Section'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              student.enrollmentStatus === 'enrolled' || !student.enrollmentStatus
                                ? 'bg-green-100 text-green-700'
                                : student.enrollmentStatus === 'transferred'
                                  ? 'bg-blue-100 text-blue-700'
                                  : student.enrollmentStatus === 'graduated'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {student.enrollmentStatus === 'enrolled' || !student.enrollmentStatus
                              ? '✓ Enrolled'
                              : student.enrollmentStatus === 'transferred'
                                ? '📤 Transferred'
                                : student.enrollmentStatus === 'graduated'
                                  ? '🎓 Graduated'
                                  : student.enrollmentStatus || 'Enrolled'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                        className="mt-1 ml-2"
                        title="Select student"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {hasGrades ? (
                          <>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                                average >= 90
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : average >= 85
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : average >= 75
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                      : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {average.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {average >= 90
                                ? '🏆 Advanced'
                                : average >= 85
                                  ? '⭐ Proficient'
                                  : average >= 80
                                    ? '📈 Approaching'
                                    : average >= 75
                                      ? '✓ Developing'
                                      : '⚠️ Beginning'}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            📋 No Grades
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="flex items-center gap-1 px-2 py-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-xs font-medium border border-teal-200"
                          title="Preview SF9"
                        >
                          👁️ Preview
                        </button>
                        <button
                          onClick={() => handlePrintStudent(student.id)}
                          className="flex items-center gap-1 px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs font-medium border border-green-200"
                          title="Print SF9 PDF"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-700">
                  Page <span className="font-semibold">{currentPage}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm border rounded-lg ${currentPage === pageNum ? 'bg-teal-600 text-white border-teal-600' : 'hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
                </div>
                <div className="text-sm text-gray-600">{filteredStudents.length} total students</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && viewingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-[95vw] lg:max-w-[1200px] mx-auto bg-white rounded-lg shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
                <h3 className="text-lg font-semibold text-slate-800">
                  📝 School Form 9 - {getStudentDisplayName(viewingStudent)}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePrintStudent(viewingStudent.id)}
                    className="group flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="text-sm">Print PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingStudent(null);
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <PrintableSF9Report student={viewingStudent} schoolData={schoolData} hideDownloadButton={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SF9Dashboard;

