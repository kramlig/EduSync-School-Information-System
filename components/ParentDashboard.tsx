import React, { useMemo } from 'react';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { AcademicCapIcon, MegaphoneIcon } from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';

interface ParentDashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ schoolData, session }) => {
  const { students, announcements, teachers, isSyncing } = schoolData;
  const parent = session.user as ParentUser;

  const children = useMemo(() => {
    return students.filter(s => parent.studentIds.includes(s.id));
  }, [students, parent]);

  const relevantAnnouncements = useMemo(() => {
    return announcements
        .filter(a => ['all', 'parents'].includes(a.target))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Show latest 5
  }, [announcements]);

  const getAuthorName = (authorId: string) => {
    return teachers.find(t => t.id === authorId)?.name || 'School Admin';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Parent Dashboard</h1>
      {isSyncing && (
        <div className="mb-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm">
          Syncing data...
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="My Children" value={children.length.toString()} icon={<AcademicCapIcon />} />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Welcome, {parent.name}!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              This is your personal portal to stay updated on your children's academic progress.
            </p>
            <div className="space-y-3">
                {children.map(child => (
                    <div key={child.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{child.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{child.email}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center"><MegaphoneIcon/> <span className="ml-2">Recent Announcements</span></h2>
            <div className="space-y-4">
                {relevantAnnouncements.length > 0 ? relevantAnnouncements.map(an => (
                    <div key={an.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">{an.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Posted on {an.date} by {getAuthorName(an.authorId)}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{an.content}</p>
                    </div>
                )) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent announcements.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;