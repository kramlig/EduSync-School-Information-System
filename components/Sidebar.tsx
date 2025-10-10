import React from 'react';
import type { ViewType, AuthUser, StudentUser, ParentUser } from '../types';
import { ChartPieIcon, AcademicCapIcon, BookOpenIcon, ClipboardDocumentListIcon, HomeIcon, HeartIcon, CalendarDaysIcon, BriefcaseIcon, UsersIcon, CogIcon, ClipboardUserIcon, CalendarIcon, TableCellsIcon, ClipboardCheckIcon, ClipboardDocumentCheckIcon, ClipboardDocumentIcon, MegaphoneIcon, IdentificationIcon } from './icons';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, session }) => {
  
  const staffNavGroups = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
      ]
    },
    {
      title: 'School Management',
      items: [
        { id: 'announcements', label: 'Announcements', icon: <MegaphoneIcon />, roles: ['admin', 'principal'] },
        { id: 'students', label: 'Students', icon: <AcademicCapIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'teachers', label: 'Teachers', icon: <BriefcaseIcon />, roles: ['admin', 'registrar'] },
        { id: 'parents', label: 'Parents', icon: <IdentificationIcon />, roles: ['admin', 'registrar'] },
        { id: 'sections', label: 'Classes', icon: <UsersIcon />, roles: ['admin', 'registrar'] },
        { id: 'scheduler', label: 'Scheduler', icon: <CalendarIcon />, roles: ['admin', 'principal', 'registrar'] },
        { id: 'substitutes', label: 'Substitutes', icon: <ClipboardUserIcon />, roles: ['admin', 'registrar'] },
        { id: 'learningAreas', label: 'Learning Areas', icon: <BookOpenIcon />, roles: ['admin'] },
      ]
    },
    {
      title: 'Academics',
      items: [
        { id: 'lessonPlans', label: 'Lesson Plans', icon: <ClipboardDocumentIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'grades', label: 'Grades', icon: <ClipboardDocumentListIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'gradebook', label: 'Gradebook', icon: <TableCellsIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'coreValues', label: 'Core Values', icon: <HeartIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'coreValuesGradebook', label: 'Core Values Gradebook', icon: <ClipboardCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { id: 'attendance', label: 'Attendance', icon: <CalendarDaysIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: <CogIcon />, roles: ['admin'] },
      ]
    }
  ];
  
  const studentNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
      { id: 'assignments', label: 'My Assignments', icon: <ClipboardDocumentCheckIcon /> },
      { id: 'grades', label: 'My Grades', icon: <ClipboardDocumentListIcon /> },
      { id: 'coreValues', label: 'My Core Values', icon: <HeartIcon /> },
      { id: 'attendance', label: 'My Attendance', icon: <CalendarDaysIcon /> },
      { id: 'scheduler', label: 'My Schedule', icon: <CalendarIcon /> },
  ];

  const parentNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
      { id: 'announcements', label: 'Announcements', icon: <MegaphoneIcon /> },
      { id: 'assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon /> },
      { id: 'grades', label: 'Grades', icon: <ClipboardDocumentListIcon /> },
      { id: 'coreValues', label: 'Core Values', icon: <HeartIcon /> },
      { id: 'attendance', label: 'Attendance', icon: <CalendarDaysIcon /> },
      { id: 'scheduler', label: 'Schedule', icon: <CalendarIcon /> },
  ];
  
  const renderStaffNav = () => {
    const userRole = (session.user as AuthUser).role;
    return staffNavGroups.map(group => {
      const visibleItems = group.items.filter(item => item.roles.includes(userRole));
      if (visibleItems.length === 0) {
        return null;
      }
      return (
        <React.Fragment key={group.title}>
          <h3 className="px-6 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:block">{group.title}</h3>
          {visibleItems.map(item => (
            <li key={item.id} className="px-2">
              <button
                onClick={() => setView(item.id as ViewType)}
                title={item.label}
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
        </React.Fragment>
      );
    });
  };

  const renderSimpleNav = (items: typeof studentNavItems) => {
    return items.map(item => (
      <li key={item.id} className="px-2">
        <button
          onClick={() => setView(item.id as ViewType)}
          title={item.label}
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
    ));
  };
  
  return (
    <nav className="w-16 md:w-64 bg-slate-800 dark:bg-slate-950 text-white flex flex-col print:hidden overflow-y-auto">
      <div className="flex-shrink-0 flex items-center justify-center md:justify-start md:pl-6 h-16 border-b border-slate-700">
        <ChartPieIcon />
        <span className="hidden md:inline ml-3 text-lg font-bold">EduSync</span>
      </div>
      <ul className="flex-1 mt-2">
        {session.type === 'staff' && renderStaffNav()}
        {session.type === 'student' && renderSimpleNav(studentNavItems)}
        {session.type === 'parent' && renderSimpleNav(parentNavItems)}
      </ul>
      <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-400 hidden md:block flex-shrink-0">
        <p>&copy; 2024 EduSync Inc.</p>
        <p>Offline-First SIS</p>
      </div>
    </nav>
  );
};

export default Sidebar;