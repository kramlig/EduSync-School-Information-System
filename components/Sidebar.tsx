import React from 'react';
import type { ViewType, AuthUser, StudentUser } from '../types';
import { ChartPieIcon, AcademicCapIcon, BookOpenIcon, ClipboardDocumentListIcon, HomeIcon, HeartIcon, CalendarDaysIcon, BriefcaseIcon, UsersIcon, CogIcon, ClipboardUserIcon, CalendarIcon, TableCellsIcon, ClipboardCheckIcon, ClipboardDocumentCheckIcon } from './icons';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, session }) => {
  
  const staffNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'students', label: 'Students', icon: <AcademicCapIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'teachers', label: 'Teachers', icon: <BriefcaseIcon />, roles: ['admin', 'registrar'] },
    { id: 'sections', label: 'Classes', icon: <UsersIcon />, roles: ['admin', 'registrar'] },
    { id: 'scheduler', label: 'Scheduler', icon: <CalendarIcon />, roles: ['admin', 'principal', 'registrar'] },
    { id: 'substitutes', label: 'Substitutes', icon: <ClipboardUserIcon />, roles: ['admin', 'registrar'] },
    { id: 'learningAreas', label: 'Learning Areas', icon: <BookOpenIcon />, roles: ['admin'] },
    { id: 'grades', label: 'Grades', icon: <ClipboardDocumentListIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'gradebook', label: 'Gradebook', icon: <TableCellsIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'coreValues', label: 'Core Values', icon: <HeartIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'coreValuesGradebook', label: 'Core Values Gradebook', icon: <ClipboardCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'attendance', label: 'Attendance', icon: <CalendarDaysIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
    { id: 'settings', label: 'Settings', icon: <CogIcon />, roles: ['admin'] },
  ];
  
  const studentNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
      { id: 'grades', label: 'My Grades', icon: <ClipboardDocumentListIcon /> },
      { id: 'coreValues', label: 'My Core Values', icon: <HeartIcon /> },
      { id: 'attendance', label: 'My Attendance', icon: <CalendarDaysIcon /> },
      { id: 'scheduler', label: 'My Schedule', icon: <CalendarIcon /> },
  ];
  
  let navItems;
  if (session.type === 'staff') {
      const userRole = (session.user as AuthUser).role;
      navItems = staffNavItems.filter(item => item.roles.includes(userRole));
  } else {
      navItems = studentNavItems;
  }

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