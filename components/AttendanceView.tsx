import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SchoolDataHook } from '../hooks/useSchoolData';
import type { AttendanceStatus, AuthUser, StudentUser, ParentUser } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface AttendanceViewProps {
  schoolData: SchoolDataHook;
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
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ schoolData, session, forceStudentId }) => {
  const { students, attendanceRecords, updateAttendance, sections, substituteAssignments, classSchedules } = schoolData;
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const isReadOnly = isStudentView || isParentView || (session.user as AuthUser).role === 'principal';
  const [selectedSectionId, setSelectedSectionId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Refs to help auto-scroll to today's column
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  
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
    if (isStudentView) return students.filter(s => s.id === session.user.id);
    if (isParentView) return students.filter(s => s.id === forceStudentId);

    const authUser = session.user as AuthUser;
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) return students;
    
    const authorizedSectionIds = new Set<string>();

    const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
    if (teacherAdviserSection) authorizedSectionIds.add(teacherAdviserSection.id);
    
    const today = new Date().toISOString().split('T')[0];
    const activeSubAssignments = substituteAssignments.filter(sub => 
      sub.teacherId === authUser.id && today >= sub.startDate && today <= sub.endDate
    );

    if (activeSubAssignments.length > 0) {
        const originalTeacherIds = activeSubAssignments.map(sub => sub.originalTeacherId);
        sections.forEach(s => {
            if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
                authorizedSectionIds.add(s.id);
            }
        });
        classSchedules.forEach(schedule => {
            if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
                authorizedSectionIds.add(schedule.sectionId);
            }
        });
    }

    classSchedules.forEach(schedule => {
      if (schedule.teacherId === authUser.id && schedule.sectionId) {
        authorizedSectionIds.add(schedule.sectionId);
      }
    });

    if (authorizedSectionIds.size === 0) return [];
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [students, sections, substituteAssignments, classSchedules, session, forceStudentId]);

  const visibleSections = useMemo(() => {
    const ids = new Set<string>();
    visibleStudents.forEach(s => { if (s.sectionId) ids.add(s.sectionId); });
    return sections.filter(sec => ids.has(sec.id));
  }, [visibleStudents, sections]);

  const filteredStudents = useMemo(() => {
    const base = (isStudentView || isParentView)
      ? visibleStudents
      : visibleStudents.filter(student =>
          student.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    const bySection = selectedSectionId === 'all' ? base : base.filter(s => s.sectionId === selectedSectionId);
    return bySection;
  }, [visibleStudents, debouncedSearchQuery, isStudentView, isParentView, selectedSectionId]);

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
    const key = now.toISOString().split('T')[0];
    const cell = headerCellRefs.current[key];
    const scroller = tableScrollRef.current;
    if (cell && scroller) {
      const left = cell.offsetLeft - 120; // small offset so date label is visible
      scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }, [daysInMonth, currentDate]);
  
  const handleAttendanceChange = useCallback((studentId: string, date: Date, currentStatus?: AttendanceStatus) => {
    if(isReadOnly) return;
    const dateStr = date.toISOString().split('T')[0];
    const currentIndex = currentStatus ? STATUS_OPTIONS.indexOf(currentStatus) : -1;
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
    const newStatus = STATUS_OPTIONS[nextIndex];
    updateAttendance(studentId, dateStr, newStatus);
  }, [isReadOnly, updateAttendance]);
  
  const handleMarkAllPresent = useCallback((day: Date) => {
    if (isReadOnly) return;
    const dateStr = day.toISOString().split('T')[0];
    // Apply to current page for performance and clarity
    pagedStudents.forEach(student => updateAttendance(student.id, dateStr, 'P'));
  }, [pagedStudents, updateAttendance, isReadOnly]);


  const calculateTotals = useCallback((studentId: string): Record<AttendanceStatus, number> & { total: number } => {
    const record = attendanceRecords.find(r => r.studentId === studentId);
    if (!record) return { P: 0, A: 0, L: 0, E: 0, total: 0 };

    const year = currentDate.getFullYear();
    const schoolYearStartMonth = 6; // June
    
    const totals = Object.entries(record.dailyStatus).reduce((acc, [date, status]) => {
      const entryDate = new Date(date);
      // Simple school year check
      const entryYear = entryDate.getMonth() >= schoolYearStartMonth - 1 ? entryDate.getFullYear() : entryDate.getFullYear() -1;
      const currentSchoolYear = currentDate.getMonth() >= schoolYearStartMonth - 1 ? year : year - 1;

      if(entryYear === currentSchoolYear) {
        // FIX: The `status` from Object.entries is typed as `unknown`. Cast it to the correct type `AttendanceStatus` to use it as an index.
        const statusKey = status as AttendanceStatus;
        acc[statusKey] = (acc[statusKey] || 0) + 1;
      }
      return acc;
    }, {} as Record<AttendanceStatus, number>);

    return {
      P: totals.P || 0,
      A: totals.A || 0,
      L: totals.L || 0,
      E: totals.E || 0,
      total: (totals.P || 0) + (totals.A || 0) + (totals.L || 0) + (totals.E || 0),
    };
  }, [attendanceRecords, currentDate]);
  
  const title = isStudentView ? 'My Attendance' : (isParentView ? `Attendance for ${filteredStudents[0]?.name}` : 'Manage Attendance');

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const markTodayPresentForPage = () => {
    if (isReadOnly) return;
    const now = new Date();
    const sameMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
    if (!sameMonth) {
      jumpToToday();
      return;
    }
    const dateStr = now.toISOString().split('T')[0];
    pagedStudents.forEach(student => updateAttendance(student.id, dateStr, 'P'));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{title}</h1>

      <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
        {!(isStudentView || isParentView) && (
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="flex items-center gap-2">
              <label className="font-semibold">Class:</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"
              >
                <option value="all">All</option>
                {visibleSections.map(s => (
                  <option key={s.id} value={s.id}>{`Grade ${s.gradeLevel} - ${s.name}`}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm input-style"
            />
            <div className="flex items-center gap-2 ml-2">
              <label className="font-semibold">Page size:</label>
              <select
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
        )}
        <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">‹</button>
            <span className="font-bold text-lg w-32 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">›</button>
            <button onClick={jumpToToday} className="ml-2 px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm">Today</button>
            {!(isStudentView || isParentView) && (
              <button onClick={markTodayPresentForPage} disabled={isReadOnly} className="px-3 py-1 rounded bg-green-600 text-white text-sm disabled:opacity-50">Mark Today Present (page)</button>
            )}
        </div>
        <div className="flex-1 min-w-[200px] flex justify-end">
            <div className="flex space-x-2 text-xs">
                {Object.entries(STATUS_MAP).map(([key, {label, bgColor}]) => (
                    <div key={key} className="flex items-center space-x-1">
                        <div className={`w-3 h-3 rounded-full ${bgColor}`}></div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div ref={tableScrollRef} className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal text-sm border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-100 dark:bg-slate-900">
              <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 px-3 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-1/4">Student Name</th>
              {daysInMonth.map(day => {
                const key = day.toISOString().split('T')[0];
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
              const studentRecord = attendanceRecords.find(r => r.studentId === student.id);
              const totals = calculateTotals(student.id);
              return (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-3 py-3 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white whitespace-nowrap">{student.name}</td>
                {daysInMonth.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const status = studentRecord?.dailyStatus[dateStr];
                    return (
                        <td 
                            key={dateStr} 
                            onClick={() => handleAttendanceChange(student.id, day, status)}
                            className={`border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-xs ${!isReadOnly && 'cursor-pointer'} ${getStatusColor(status)}`}
                        >
                            {status}
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
