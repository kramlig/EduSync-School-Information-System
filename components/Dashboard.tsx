import React, { useMemo } from 'react';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { AcademicCapIcon, BookOpenIcon, StarIcon } from './icons';
import type { AuthUser } from '../types';

interface DashboardProps {
  schoolData: SchoolDataHook;
  authUser: AuthUser;
}

const Dashboard: React.FC<DashboardProps> = ({ schoolData, authUser }) => {
  const { students, learningAreas, grades, sections, isSyncing } = schoolData;

  const visibleStudents = useMemo(() => {
    if (authUser.role === 'admin') {
      return students;
    }
    const teacherSection = sections.find(s => s.adviserId === authUser.id);
    if (!teacherSection) return [];
    return students.filter(s => s.sectionId === teacherSection.id);
  }, [students, sections, authUser]);

  const visibleStudentIds = useMemo(() => new Set(visibleStudents.map(s => s.id)), [visibleStudents]);

  const filteredGrades = useMemo(() => grades.filter(g => visibleStudentIds.has(g.studentId)), [grades, visibleStudentIds]);

  const gradesWithFinal = filteredGrades.filter(g => typeof g.finalGrade === 'number');
  const averageGrade = gradesWithFinal.length > 0
    ? (gradesWithFinal.reduce((acc, g) => acc + g.finalGrade!, 0) / gradesWithFinal.length).toFixed(1)
    : 'N/A';

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Dashboard</h1>
      {isSyncing && (
        <div className="mb-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm">
          Syncing local data with the server...
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Total Students" value={visibleStudents.length.toString()} icon={<AcademicCapIcon />} />
        <Card title="Total Learning Areas" value={learningAreas.length.toString()} icon={<BookOpenIcon />} />
        <Card title="Class Average Grade" value={`${averageGrade}%`} icon={<StarIcon />} />
      </div>
      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome to EduSync</h2>
        <p className="text-slate-600 dark:text-slate-300">
          This is your central hub for managing school information. You can navigate using the sidebar to view students, manage learning areas, and record grades.
          The system is designed to work even when you're offline. Any changes you make will be saved locally and synced automatically when you reconnect.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;