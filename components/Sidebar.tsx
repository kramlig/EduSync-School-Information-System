import React from 'react';
import type { ViewType, AuthUser } from '../types';
import { ChartPieIcon, AcademicCapIcon, BookOpenIcon, ClipboardDocumentListIcon, HomeIcon, HeartIcon, CalendarDaysIcon, BriefcaseIcon, UsersIcon } from './icons';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  authUser: AuthUser;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, authUser }) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, roles: ['admin', 'teacher'] },
    { id: 'students', label: 'Students', icon: <AcademicCapIcon />, roles: ['admin', 'teacher'] },
    { id: 'teachers', label: 'Teachers', icon: <BriefcaseIcon />, roles: ['admin'] },
    { id: 'sections', label: 'Classes', icon: <UsersIcon />, roles: ['admin'] },
    { id: 'learningAreas', label: 'Learning Areas', icon: <BookOpenIcon />, roles: ['admin'] },
    { id: 'grades', label: 'Grades', icon: <ClipboardDocumentListIcon />, roles: ['admin', 'teacher'] },
    { id: 'coreValues', label: 'Core Values', icon: <HeartIcon />, roles: ['admin', 'teacher'] },
    { id: 'attendance', label: 'Attendance', icon: <CalendarDaysIcon />, roles: ['admin', 'teacher'] },
  ];
  
  const navItems = allNavItems.filter(item => item.roles.includes(authUser.role));

  return (
    <nav className="w-16 md:w-64 bg-slate-800 dark:bg-slate-950 text-white flex flex-col print:hidden">
      <div className="flex items-center justify-center md:justify-start md:pl-6 h-16 border-b border-slate-700">
        <ChartPieIcon />
        <span className="hidden md:inline ml-3 text-lg font-bold">EduSync</span>
      </div>
      <ul className="flex-1 mt-4">
        {navItems.map((item) => (
          <li key={item.id} className="px-2">
            <button
              onClick={() => setView(item.id as ViewType)}
              className={`flex items-center w-full h-12 px-4 rounded-lg transition-colors duration-200 ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="hidden md:inline ml-4">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-400 hidden md:block">
        <p>&copy; 2024 EduSync Inc.</p>
        <p>Offline-First SIS</p>
      </div>
    </nav>
  );
};

export default Sidebar;