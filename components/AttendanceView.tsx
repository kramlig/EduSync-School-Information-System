import React, { useState, useMemo } from 'react';
import { SchoolDataHook, MONTHLY_SCHOOL_DAYS_CONFIG } from '../hooks/useSchoolData';
import type { AuthUser, StudentUser } from '../types';

interface AttendanceViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ schoolData, session }) => {
  const { students, attendanceRecords, updateAttendance, sections, substituteAssignments } = schoolData;
  const isStudentView = session.type === 'student';

  const [searchQuery, setSearchQuery] = useState('');
  const isReadOnly = isStudentView || (session.user as AuthUser).role === 'principal';

  const months = Object.keys(MONTHLY_SCHOOL_DAYS_CONFIG);
  
  const visibleStudents = useMemo(() => {
    if (isStudentView) {
      return students.filter(s => s.id === session.user.id);
    }
    const authUser = session.user as AuthUser;
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return students;
    }
    
    const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
    const today = new Date().toISOString().split('T')[0];
    const activeSubAssignments = substituteAssignments.filter(sub => 
      sub.teacherId === authUser.id &&
      today >= sub.startDate &&
      today <= sub.endDate
    );

    const authorizedSectionIds = new Set<string>();
    if (teacherAdviserSection) {
      authorizedSectionIds.add(teacherAdviserSection.id);
    }
    activeSubAssignments.forEach(sub => authorizedSectionIds.add(sub.sectionId));
    
    if (authorizedSectionIds.size === 0) return [];
    
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [students, sections, substituteAssignments, session]);

  const filteredStudents = isStudentView 
    ? visibleStudents
    : visibleStudents.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  const handleAttendanceChange = (studentId: string, month: string, type: 'present' | 'absent', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
        updateAttendance(studentId, month, type, numValue);
    }
  };

  const calculateTotals = (studentId: string): { present: number, absent: number } => {
    const record = attendanceRecords.find(r => r.studentId === studentId);
    if (!record) return { present: 0, absent: 0 };

    return Object.values(record.monthlyData).reduce(
      (totals: { present: number; absent: number }, monthData: { present: number; absent: number }) => {
        totals.present += monthData.present || 0;
        totals.absent += monthData.absent || 0;
        return totals;
      },
      { present: 0, absent: 0 }
    );
  };
  
  const totalStudents = filteredStudents.length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">{isStudentView ? 'My Attendance' : 'Manage Attendance'}</h1>

      {!isStudentView && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900">
              <th className="px-3 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-100 dark:bg-slate-900 z-10 w-48">Student Name</th>
              {months.map(month => (
                <th key={month} colSpan={2} className="px-3 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{month}</th>
              ))}
              <th colSpan={2} className="px-3 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total</th>
            </tr>
             <tr className="bg-slate-100 dark:bg-slate-900">
              <th className="px-3 py-2 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10"></th>
                {months.map(month => (
                  <React.Fragment key={month}>
                    <th className="px-2 py-2 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">P</th>
                    <th className="px-2 py-2 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">A</th>
                  </React.Fragment>
                ))}
                 <th className="px-2 py-2 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">P</th>
                 <th className="px-2 py-2 border-b-2 border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">A</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, studentIndex) => {
              const studentRecord = attendanceRecords.find(r => r.studentId === student.id);
              const totals = calculateTotals(student.id);
              return (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-3 py-3 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white whitespace-no-wrap sticky left-0 bg-white dark:bg-slate-800 z-10">{student.name}</td>
                {months.map((month, monthIndex) => (
                  <React.Fragment key={month}>
                    <td className="p-1 border-b border-slate-200 dark:border-slate-700">
                      <input 
                        type="number"
                        min="0"
                        value={studentRecord?.monthlyData[month]?.present ?? ''}
                        onChange={e => handleAttendanceChange(student.id, month, 'present', e.target.value)}
                        tabIndex={(monthIndex * 2 * totalStudents) + studentIndex + 1}
                        disabled={isReadOnly}
                        className="w-12 p-1 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
                       />
                    </td>
                     <td className="p-1 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="number"
                        min="0"
                        value={studentRecord?.monthlyData[month]?.absent ?? ''}
                        onChange={e => handleAttendanceChange(student.id, month, 'absent', e.target.value)}
                        tabIndex={(monthIndex * 2 * totalStudents) + totalStudents + studentIndex + 1}
                        disabled={isReadOnly}
                        className="w-12 p-1 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
                      />
                    </td>
                  </React.Fragment>
                ))}
                <td className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-green-600">{totals.present}</td>
                <td className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-red-600">{totals.absent}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceView;