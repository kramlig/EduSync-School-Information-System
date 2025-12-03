import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { AttendanceStatus, AuthUser, StudentUser, ParentUser } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useAttendancePostgreSQL } from '../src/hooks/useAttendancePostgreSQL';
import { useSubstituteAssignmentsPostgreSQL } from '../src/hooks/useSubstituteAssignmentsPostgreSQL';
import { useSchedulePostgreSQL } from '../src/hooks/useSchedulePostgreSQL';

interface AttendanceViewProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  forceStudentId?: string;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['P', 'A', 'L', 'E'];
const STATUS_MAP: Record<AttendanceStatus, { label: string; color: string; bgColor: string }> = {
    P: { label: 'Present', color: 'text-green-800 dark:text-green-200', bgColor: 'bg-green-100 dark:bg-green-900/50' },
    A: { label: 'Absent', color: 'text-red-800 dark:text-red-200', bgColor: 'bg-red-100 dark:bg-red-900/50' },
    L: { label: 'Late', color: 'text-amber-800 dark:text-amber-200', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
    E: { label: 'Excused', color: 'text-sky-800 dark:text-sky-200', bgColor: 'bg-sky-100 dark:bg-sky-900/50' },
};

const getStatusColor = (status?: AttendanceStatus) => {
    if (!status) return 'bg-white dark:bg-slate-800';
    return STATUS_MAP[status].bgColor;
};

// Helper function to format date as YYYY-MM-DD in local timezone (avoids UTC conversion)
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AttendanceView: React.FC<AttendanceViewProps> = ({ session, forceStudentId }) => {
  const { schoolId } = useSchoolContext();
  
  // Direct PostgreSQL hooks - only load what we need
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId: schoolId || undefined });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: schoolId || undefined });
  const { attendanceRecords, updateAttendance, loading: attendanceLoading } = useAttendancePostgreSQL({ schoolId: schoolId || '' });
  const { assignments: substituteAssignments, loading: substituteLoading } = useSubstituteAssignmentsPostgreSQL();
  const { schedules: classSchedules, loading: schedulesLoading } = useSchedulePostgreSQL({ schoolId: schoolId || undefined });
  
  // Combined loading state
  const loading = studentsLoading || sectionsLoading || attendanceLoading || substituteLoading || schedulesLoading;
  
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isReadOnly = isStudentView || isParentView || (session.user as AuthUser).role === 'principal';
  const [selectedSectionId, setSelectedSectionId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // New state for optimistic updates and UI feedback
  const [localAttendance, setLocalAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());

  // Helper function to clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedSectionId('all');
    setSearchQuery('');
    setPage(1);
    setToast({ message: 'All filters cleared', type: 'info' });
  }, []);

  // Refs to help auto-scroll to today's column
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  
  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Clear optimistic updates once server data is synced
  useEffect(() => {
    if (localAttendance.size === 0) return;
    
    // Check if all optimistic updates are now in server data
    const keysToRemove: string[] = [];
    localAttendance.forEach((optimisticStatus, key) => {
      // Key format: "studentId-YYYY-MM-DD" where studentId is UUID (contains hyphens)
      // Extract the last 10 characters which is the date "YYYY-MM-DD"
      const dateStr = key.slice(-10); // "2025-12-01"
      const studentId = key.slice(0, -11); // Everything before "-YYYY-MM-DD"
      
      const studentRecord = attendanceRecords.find(r => r.studentId === studentId);
      const serverStatus = studentRecord?.dailyStatus?.[dateStr];
      
      // If server has this data, remove from optimistic
      if (serverStatus === optimisticStatus) {
        keysToRemove.push(key);
      }
    });
    
    if (keysToRemove.length > 0) {
      setLocalAttendance(prev => {
        const newMap = new Map(prev);
        keysToRemove.forEach(key => newMap.delete(key));
        return newMap;
      });
    }
  }, [attendanceRecords, localAttendance]);
  
  // const selectedMonth = useMemo(() => currentDate.toLocaleString('default', { month: 'short' }), [currentDate]);
  
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    
    while (date.getMonth() === month) {
      if (date.getDay() >= 1 && date.getDay() <= 5) { // Only include weekdays
        days.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const visibleStudents = useMemo(() => {
    // Guard against undefined data during initial load
    if (!students || !sections || !substituteAssignments || !classSchedules) return [];
    
    if (isStudentView) return students.filter(s => s.id === session.user.id);
    if (isParentView) return students.filter(s => s.id === forceStudentId);

    const authUser = session.user as AuthUser;
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) return students;
    
    const authorizedSectionIds = new Set<string>();
    const teacherId = (authUser as any).postgresqlId || authUser.id;

    const teacherAdviserSections = sections.filter(s => s.adviserId === teacherId);
    teacherAdviserSections.forEach(section => {
      authorizedSectionIds.add(section.id);
    });
    
    const today = formatDateLocal(new Date());
    const activeSubAssignments = substituteAssignments.filter((sub: any) => 
      sub.teacherId === teacherId && today >= sub.startDate && today <= sub.endDate
    );

    if (activeSubAssignments.length > 0) {
        const originalTeacherIds = activeSubAssignments.map((sub: any) => sub.originalTeacherId);
        sections.forEach(s => {
            if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
                authorizedSectionIds.add(s.id);
            }
        });
        classSchedules.forEach((schedule: any) => {
            if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
                authorizedSectionIds.add(schedule.sectionId);
            }
        });
    }

    classSchedules.forEach((schedule: any) => {
      if (schedule.teacherId === teacherId && schedule.sectionId) {
        authorizedSectionIds.add(schedule.sectionId);
      }
    });

    if (authorizedSectionIds.size === 0) return [];
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [students, sections, substituteAssignments, classSchedules, session, forceStudentId, isStudentView, isParentView]);

  const visibleSections = useMemo(() => {
    const ids = new Set<string>();
    visibleStudents.forEach(s => { if (s.sectionId) ids.add(s.sectionId); });
    return sections.filter(sec => ids.has(sec.id));
  }, [visibleStudents, sections]);

  const filteredStudents = useMemo(() => {
    const base = (isStudentView || isParentView)
      ? visibleStudents
      : visibleStudents.filter(student => {
          const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
          const email = student.email || '';
          return name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                 email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        });
    const bySection = selectedSectionId === 'all' ? base : base.filter(s => s.sectionId === selectedSectionId);
    return bySection;
  }, [visibleStudents, debouncedSearchQuery, isStudentView, isParentView, selectedSectionId]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSectionId !== 'all') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [selectedSectionId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page]);

  React.useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedSectionId, pageSize]);

  // Auto-scroll to today's column when viewing the current month
  useEffect(() => {
    const now = new Date();
    const sameMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
    if (!sameMonth) return;
    const key = formatDateLocal(now);
    const cell = headerCellRefs.current[key];
    const scroller = tableScrollRef.current;
    if (cell && scroller) {
      const left = cell.offsetLeft - 120; // small offset so date label is visible
      scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }, [daysInMonth, currentDate]);
  
  // Memoized totals calculation (performance optimization)
  const studentTotalsCache = useMemo(() => {
    const cache = new Map<string, Record<AttendanceStatus, number> & { total: number }>();
    
    pagedStudents.forEach(student => {
      const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
      
      const year = currentDate.getFullYear();
      const schoolYearStartMonth = 6; // June
      const currentSchoolYear = currentDate.getMonth() >= schoolYearStartMonth - 1 ? year : year - 1;
      
      // Build a merged map of all attendance (server + optimistic)
      const mergedStatus: Record<string, AttendanceStatus> = {};
      
      // First, add all server data from dailyStatus object
      studentRecords.forEach(record => {
        if (record.dailyStatus) {
          // dailyStatus is already in format { "2025-12-01": "P", "2025-12-02": "A", ... }
          Object.entries(record.dailyStatus).forEach(([date, status]) => {
            mergedStatus[date] = status as AttendanceStatus;
          });
        }
      });
      
      // Then, overlay optimistic updates for this student
      // Key format: "studentId-YYYY-MM-DD"
      localAttendance.forEach((status, key) => {
        // Extract the last 10 characters which is the date "YYYY-MM-DD"
        const dateStr = key.slice(-10);
        const studentId = key.slice(0, -11);
        
        if (studentId === student.id) {
          mergedStatus[dateStr] = status;
        }
      });
      
      // Now calculate totals from the merged data
      const totals = Object.entries(mergedStatus).reduce((acc, [date, status]) => {
        const entryDate = new Date(date + 'T00:00:00'); // Add time to avoid timezone issues
        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();
        
        // Determine which school year this entry belongs to
        // School year starts in June (month 5 in 0-indexed)
        // If month >= June (5), it belongs to school year starting that year
        // If month < June (5), it belongs to school year that started the previous year
        const entrySchoolYear = entryMonth >= schoolYearStartMonth - 1 ? entryYear : entryYear - 1;

        if (entrySchoolYear === currentSchoolYear) {
          const statusKey = status as AttendanceStatus;
          acc[statusKey] = (acc[statusKey] || 0) + 1;
        }
        return acc;
      }, {} as Record<AttendanceStatus, number>);

      cache.set(student.id, {
        P: totals.P || 0,
        A: totals.A || 0,
        L: totals.L || 0,
        E: totals.E || 0,
        total: (totals.P || 0) + (totals.A || 0) + (totals.L || 0) + (totals.E || 0),
      });
    });
    
    return cache;
  }, [pagedStudents, attendanceRecords, currentDate, localAttendance.size, [...localAttendance.entries()].map(([k, v]) => `${k}:${v}`).join('|')]);
  
  const handleAttendanceChange = useCallback(async (studentId: string, date: Date, currentStatus?: AttendanceStatus) => {
    if(isReadOnly) return;
    const dateStr = formatDateLocal(date);
    const key = `${studentId}-${dateStr}`;
    
    // Determine next status
    const currentIndex = currentStatus ? STATUS_OPTIONS.indexOf(currentStatus) : -1;
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
    const newStatus = STATUS_OPTIONS[nextIndex];
    
    // Optimistic UI update
    setLocalAttendance(prev => new Map(prev).set(key, newStatus));
    setUpdatingCells(prev => new Set(prev).add(key));
    
    try {
      await updateAttendance(studentId, dateStr, newStatus);
      // Optimistic state will be cleared by the useEffect when server data catches up
      setToast({ 
        message: `Marked as ${newStatus === 'P' ? 'Present' : newStatus === 'A' ? 'Absent' : newStatus === 'L' ? 'Late' : 'Excused'}`, 
        type: 'success' 
      });
    } catch (error) {
      // Rollback on error
      setLocalAttendance(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
      setToast({ message: 'Failed to update attendance', type: 'error' });
      console.error('Failed to update attendance:', error);
    } finally {
      setUpdatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [isReadOnly, updateAttendance]);
  
  const handleMarkAllPresent = useCallback((day: Date) => {
    if (isReadOnly) return;
    const dateStr = formatDateLocal(day);
    // Apply to current page for performance and clarity
    pagedStudents.forEach(student => updateAttendance(student.id, dateStr, 'P'));
  }, [pagedStudents, updateAttendance, isReadOnly]);


  const calculateTotals = useCallback((studentId: string): Record<AttendanceStatus, number> & { total: number } => {
    // Use memoized cache for performance
    return studentTotalsCache.get(studentId) || { P: 0, A: 0, L: 0, E: 0, total: 0 };
  }, [studentTotalsCache]);
  
  const title = isStudentView ? 'My Attendance' : (isParentView ? `Attendance for ${filteredStudents[0]?.name}` : 'Manage Attendance');

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const markTodayPresentForPage = async () => {
    if (isReadOnly) return;
    const now = new Date();
    const sameMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
    if (!sameMonth) {
      jumpToToday();
      return;
    }
    
    const dateStr = formatDateLocal(now);
    const studentCount = pagedStudents.length;
    
    // Show loading toast
    setToast({ message: `Marking ${studentCount} students as present...`, type: 'info' });
    
    try {
      // Update all students on the current page
      const promises = pagedStudents.map(student => {
        const key = `${student.id}-${dateStr}`;
        // Optimistic UI update
        setLocalAttendance(prev => new Map(prev).set(key, 'P'));
        setUpdatingCells(prev => new Set(prev).add(key));
        return updateAttendance(student.id, dateStr, 'P')
          .finally(() => {
            setUpdatingCells(prev => {
              const newSet = new Set(prev);
              newSet.delete(key);
              return newSet;
            });
          });
      });
      
      await Promise.all(promises);
      setToast({ message: `✓ ${studentCount} students marked as present`, type: 'success' });
    } catch (error) {
      console.error('Failed to mark students present:', error);
      setToast({ message: 'Failed to mark some students present', type: 'error' });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Loading attendance data...</p>
        </div>
      </div>
    );
  }
  
  // Show empty state if no students after loading
  if (!loading && visibleStudents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">No students found</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            {session.type === 'staff' && (session.user as AuthUser).role === 'teacher' 
              ? 'You are not assigned to any sections yet.' 
              : 'Try adjusting your filters or contact your administrator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white flex items-center gap-3 animate-fade-in min-w-[280px]`}>
          <span className="flex-1">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="text-white hover:text-gray-200 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>

      {/* Filter Bar with improvements */}
      <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        {!(isStudentView || isParentView) && (
          <>
            {/* Filter Header with Active Count and Clear All */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">🔍 Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="section-select" className="font-semibold text-sm">📚 Section:</label>
                <select
                  id="section-select"
                  aria-label="Filter by section"
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"
                >
                  <option value="all">All Sections</option>
                  {visibleSections.map(s => (
                    <option key={s.id} value={s.id}>{`Grade ${s.gradeLevel} - ${s.name}`}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                <label htmlFor="search-input" className="font-semibold text-sm">🔎 Search:</label>
                <div className="relative flex-1">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 pr-8 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <label htmlFor="page-size-select" className="font-semibold text-sm">Page size:</label>
                <select
                  id="page-size-select"
                  aria-label="Items per page"
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Result Count */}
            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                📊 Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{visibleStudents.length}</span> students
                {activeFilterCount > 0 && (
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    ({activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied)
                  </span>
                )}
              </span>
            </div>
          </>
        )}

        {/* Month Navigation - Always visible */}
        <div className={`flex items-center ${!(isStudentView || isParentView) ? 'justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700' : 'justify-between'}`}>
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">‹</button>
            <span className="font-bold text-lg w-32 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">›</button>
            <button onClick={jumpToToday} className="ml-2 px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm">Today</button>
            {!(isStudentView || isParentView) && (
              <button onClick={markTodayPresentForPage} disabled={isReadOnly} className="px-3 py-1 rounded bg-green-600 text-white text-sm disabled:opacity-50">Mark Today Present (page)</button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State Message */}
      {!(isStudentView || isParentView) && filteredStudents.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center mb-4">
          <div className="text-4xl mb-2">🔍</div>
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-1">No students found</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {searchQuery && selectedSectionId !== 'all' 
              ? `No students match "${searchQuery}" in ${sections.find(s => s.id === selectedSectionId)?.name || 'selected section'}`
              : searchQuery 
              ? `No students match "${searchQuery}"`
              : selectedSectionId !== 'all'
              ? `No students in ${sections.find(s => s.id === selectedSectionId)?.name || 'selected section'}`
              : 'No students available'}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Status Legend */}
      <div className="mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Status Legend:</span>
          <div className="flex space-x-4 text-sm">
            {Object.entries(STATUS_MAP).map(([key, {label, bgColor}]) => (
              <div key={key} className="flex items-center space-x-1.5">
                <div className={`w-4 h-4 rounded ${bgColor}`}></div>
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={tableScrollRef} className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal text-sm border-collapse">
          <thead className="sticky top-0 z-30 backdrop-blur-sm">
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-md">
              <th className="sticky left-0 z-30 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm px-3 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-1/4 shadow-md">Student Name</th>
              {daysInMonth.map(day => {
                const key = formatDateLocal(day);
                return (
                  <th
                    key={key}
                    ref={el => { headerCellRefs.current[key] = el; }}
                    className="px-1 py-2 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <button
                      onClick={() => handleMarkAllPresent(day)}
                      disabled={isReadOnly}
                      title={isReadOnly ? '' : `Mark all present for ${day.toLocaleDateString()}`}
                      className="w-full h-full disabled:cursor-not-allowed hover:bg-green-100 dark:hover:bg-green-900/50 rounded-sm"
                    >
                      <div className="font-normal text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div>{day.getDate()}</div>
                    </button>
                  </th>
                );
              })}
              <th className="px-2 py-3 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Present</th>
              <th className="px-2 py-3 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Absent</th>
              <th className="px-2 py-3 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Late</th>
            </tr>
          </thead>
          <tbody>
            {pagedStudents.map((student) => {
              const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
              const totals = calculateTotals(student.id);
              return (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 backdrop-blur-sm px-3 py-3 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white whitespace-nowrap shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* Student Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {student.firstName?.[0]?.toUpperCase() || ''}{student.lastName?.[0]?.toUpperCase() || ''}
                      </div>
                    </div>
                    {/* Student Name */}
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white">{student.name}</span>
                      {student.sectionId && (() => {
                        const section = sections.find((sec: any) => sec.id === student.sectionId);
                        return section?.name ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {section.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </td>
                {daysInMonth.map(day => {
                    const dateStr = formatDateLocal(day);
                    const key = `${student.id}-${dateStr}`;
                    
                    // Get attendance from the student's dailyStatus object
                    const attendanceRecord = studentRecords.find(r => r.studentId === student.id);
                    const serverStatus = attendanceRecord?.dailyStatus?.[dateStr] as AttendanceStatus | undefined;
                    
                    // Use optimistic local state if available, otherwise use server state
                    const status = localAttendance.get(key) || serverStatus;
                    const isUpdating = updatingCells.has(key);
                    
                    const statusLabel = status ? STATUS_MAP[status as AttendanceStatus]?.label : '';
                    return (
                        <td 
                            key={dateStr} 
                            onClick={() => handleAttendanceChange(student.id, day, status)}
                            title={statusLabel ? `${statusLabel} - Click to change` : 'Not marked - Click to mark'}
                            className={`group relative border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-base ${!isReadOnly && 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-indigo-500 hover:shadow-lg hover:scale-105'} ${getStatusColor(status)} ${isUpdating ? 'opacity-60' : ''} transition-all duration-150 py-3 px-2`}
                        >
                            <div className={`flex items-center justify-center h-full ${status ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                              {status || '-'}
                            </div>
                            {isUpdating && (
                              <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center backdrop-blur-sm">
                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {/* Hover tooltip */}
                            {!isReadOnly && !isUpdating && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50">
                                {statusLabel ? `${statusLabel} - Click to change` : 'Click to mark'}
                              </div>
                            )}
                        </td>
                    )
                })}
                <td className="px-2 py-3 border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-green-600">{totals.P}</td>
                <td className="px-2 py-3 border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-red-600">{totals.A}</td>
                <td className="px-2 py-3 border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600">{totals.L}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      {!(isStudentView || isParentView) && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing {(pagedStudents.length === 0 ? 0 : (page - 1) * pageSize + 1)}–{(page - 1) * pageSize + pagedStudents.length} of {filteredStudents.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="text-sm">Page {page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
      <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid; border-color: #d1d5db; background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input-style { border-color: #4b5563; }`}</style>
    </div>
  );
};

export default AttendanceView;
