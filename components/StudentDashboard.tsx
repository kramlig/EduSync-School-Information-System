import React, { useMemo } from 'react';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { StarIcon, CheckBadgeIcon, XCircleIcon } from './icons';
import type { AuthUser, StudentUser, Grade, AttendanceStatus } from '../types';

interface StudentDashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ schoolData, session }) => {
  const { grades, attendanceRecords, isSyncing } = schoolData;
  const student = session.user as StudentUser;

  const studentGrades = useMemo(() => grades.filter(g => g.studentId === student.id), [grades, student.id]);

  const generalAverage = useMemo(() => {
    const finalGrades = studentGrades.map((g: Grade) => g.finalGrade).filter((g): g is number => typeof g === 'number');
    if (finalGrades.length === 0) return 'N/A';
    const total = finalGrades.reduce((sum: number, grade: number) => sum + grade, 0);
    return (total / finalGrades.length).toFixed(1);
  }, [studentGrades]);

  const attendanceTotal = useMemo(() => {
    const record = attendanceRecords.find(r => r.studentId === student.id);
    if (!record) return { present: 0, absent: 0 };

    return Object.values(record.dailyStatus).reduce(
      (totals: { present: number; absent: number }, status: AttendanceStatus) => {
        if (status === 'P' || status === 'L') {
            totals.present++;
        } else if (status === 'A') {
            totals.absent++;
        }
        return totals;
      },
      { present: 0, absent: 0 }
    );
  }, [attendanceRecords, student.id]);


  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">My Dashboard</h1>
      {isSyncing && (
        <div className="mb-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm">
          Syncing data...
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="General Average" value={`${generalAverage}%`} icon={<StarIcon />} />
        <Card title="Days Present" value={attendanceTotal.present.toString()} icon={<CheckBadgeIcon />} />
        <Card title="Days Absent" value={attendanceTotal.absent.toString()} icon={<XCircleIcon />} />
      </div>
      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, {student.name}!</h2>
        <p className="text-slate-600 dark:text-slate-300">
          This is your personal portal to view your academic progress. Use the sidebar to navigate to your grades, core values, attendance records, and class schedule.
          If you have any questions, please reach out to your class adviser.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;