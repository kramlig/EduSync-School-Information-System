
import React from 'react';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { AcademicCapIcon, BookOpenIcon, StarIcon } from './icons';

interface DashboardProps {
  schoolData: SchoolDataHook;
}

const Dashboard: React.FC<DashboardProps> = ({ schoolData }) => {
  const { students, learningAreas, grades, isSyncing } = schoolData;

  // FIX: Property 'grade' does not exist on type 'Grade'. Use 'finalGrade' instead and filter out grades without one.
  const gradesWithFinal = grades.filter(g => typeof g.finalGrade === 'number');
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
        <Card title="Total Students" value={students.length.toString()} icon={<AcademicCapIcon />} />
        <Card title="Total Learning Areas" value={learningAreas.length.toString()} icon={<BookOpenIcon />} />
        <Card title="Average Grade" value={`${averageGrade}%`} icon={<StarIcon />} />
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
