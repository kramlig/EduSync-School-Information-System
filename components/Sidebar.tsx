import React from 'react';
import { NavLink } from 'react-router-dom';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { HomeIcon, AcademicCapIcon, BriefcaseIcon, IdentificationIcon, UsersIcon, CalendarIcon, ClipboardUserIcon, BookOpenIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, TableCellsIcon, HeartIcon, ClipboardCheckIcon, CalendarDaysIcon, CogIcon, MegaphoneIcon, ChartPieIcon } from './icons';

interface SidebarProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const Sidebar: React.FC<SidebarProps> = ({ session }) => {
  
  const staffNavGroups = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: <HomeIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
      ]
    },
    {
      title: 'School Management',
      items: [
        { path: '/announcements', label: 'Announcements', icon: <MegaphoneIcon />, roles: ['admin', 'principal'] },
        { path: '/students', label: 'Students', icon: <AcademicCapIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/teachers', label: 'Teachers', icon: <BriefcaseIcon />, roles: ['admin', 'registrar'] },
        { path: '/parents', label: 'Parents', icon: <IdentificationIcon />, roles: ['admin', 'registrar'] },
        { path: '/sections', label: 'Classes', icon: <UsersIcon />, roles: ['admin', 'registrar'] },
        { path: '/schedule', label: 'Scheduler', icon: <CalendarIcon />, roles: ['admin', 'principal', 'registrar'] },
        { path: '/substitute', label: 'Substitutes', icon: <ClipboardUserIcon />, roles: ['admin', 'registrar'] },
  { path: '/learning-areas', label: 'Learning Areas', icon: <BookOpenIcon />, roles: ['admin'] },
      ]
    },
    {
      title: 'Academics',
      items: [
        { path: '/lesson-plan', label: 'Lesson Plans', icon: <ClipboardDocumentIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/grades', label: 'Grades', icon: <ClipboardDocumentListIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/gradebook', label: 'Gradebook', icon: <TableCellsIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/core-values', label: 'Core Values', icon: <HeartIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/core-values-gradebook', label: 'Core Values Gradebook', icon: <ClipboardCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
        { path: '/attendance', label: 'Attendance', icon: <CalendarDaysIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/settings', label: 'Settings', icon: <CogIcon />, roles: ['admin'] },
      ]
    }
  ];
  
  const studentNavItems = [
      { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
      { path: '/assignments', label: 'My Assignments', icon: <ClipboardDocumentCheckIcon /> },
      { path: '/grades', label: 'My Grades', icon: <ClipboardDocumentListIcon /> },
      { path: '/core-values', label: 'My Core Values', icon: <HeartIcon /> },
      { path: '/attendance', label: 'My Attendance', icon: <CalendarDaysIcon /> },
      { path: '/schedule', label: 'My Schedule', icon: <CalendarIcon /> },
  ];

  const parentNavItems = [
      { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
      { path: '/announcements', label: 'Announcements', icon: <MegaphoneIcon /> },
      { path: '/assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon /> },
      { path: '/grades', label: 'Grades', icon: <ClipboardDocumentListIcon /> },
      { path: '/core-values', label: 'Core Values', icon: <HeartIcon /> },
      { path: '/attendance', label: 'Attendance', icon: <CalendarDaysIcon /> },
      { path: '/schedule', label: 'Schedule', icon: <CalendarIcon /> },
  ];

  const NavItem: React.FC<{ to: string, label: string, icon: React.ReactNode }> = ({ to, label, icon }) => (
    <li className="px-2">
      <NavLink
        to={to}
        end
        title={label}
        className={({ isActive }) =>
          `relative flex items-center w-full h-12 px-4 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`
        }
      >
        {/* Active left indicator */}
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white/90 rounded-r"></span>
            )}
            <span className="shrink-0">{icon}</span>
            <span className="hidden md:inline ml-4 truncate">{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
  
  const renderNavItems = () => {
    if (session.type === 'staff') {
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
              <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} />
            ))}
          </React.Fragment>
        );
      });
    }
    if (session.type === 'student') {
      return studentNavItems.map(item => <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} />);
    }
    if (session.type === 'parent') {
      return parentNavItems.map(item => <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} />);
    }
    return null;
  };

  return (
    <nav className="group w-16 md:w-64 hover:w-64 transition-all duration-200 bg-slate-800 dark:bg-slate-950 text-white flex flex-col print:hidden sticky top-0 self-start h-screen overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-center md:justify-start md:pl-6 h-16 border-b border-slate-700">
        <ChartPieIcon />
        <span className="hidden md:inline ml-3 text-lg font-bold">EduSync</span>
      </div>
      <ul className="flex-1 mt-2 overflow-y-auto no-scrollbar pr-1">
        {renderNavItems()}
      </ul>
      <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-400 hidden md:block flex-shrink-0">
        <p>&copy; 2024 EduSync Inc.</p>
        <p>Offline-First SIS</p>
      </div>
      {/* Hide native scrollbars for a cleaner, app-like feel */}
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </nav>
  );
};

export default Sidebar;