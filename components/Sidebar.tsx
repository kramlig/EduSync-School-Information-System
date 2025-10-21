import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { HomeIcon, AcademicCapIcon, BriefcaseIcon, IdentificationIcon, UsersIcon, CalendarIcon, ClipboardUserIcon, BookOpenIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, TableCellsIcon, HeartIcon, ClipboardCheckIcon, CalendarDaysIcon, CogIcon, MegaphoneIcon, ChevronLeftIcon, ChevronRightIcon, BuildingOfficeIcon } from './icons';
import DepEdLogo from './DepEdLogo';

interface SidebarProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  schoolName?: string;
  schoolYear?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ session, schoolName = 'School', schoolYear }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
        { path: '/grades', label: 'Grades & Reports', icon: <TableCellsIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'] },
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
            <span className={`ml-4 truncate transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
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
            <h3 className={`px-6 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>{group.title}</h3>
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
    <nav className={`transition-all duration-300 bg-slate-800 dark:bg-slate-950 text-white flex flex-col print:hidden sticky top-0 self-start h-screen overflow-hidden ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header with Logo, School Name & Toggle */}
      <div className="flex-shrink-0 border-b border-slate-700">
        <div className={`flex items-center h-20 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : 'flex-row'} min-w-0`}>
            <DepEdLogo className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-12 w-12'}`} />
            <div className={`flex flex-col min-w-0 transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 h-0 overflow-hidden' : 'opacity-100'}`}>
              <div className="text-base font-bold text-white leading-tight">EduSync</div>
              <div className="text-xs text-slate-400 leading-tight flex items-center gap-1 truncate">
                <BuildingOfficeIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate" title={schoolName}>{schoolName}</span>
              </div>
              {schoolYear && (
                <div className="text-xs text-slate-500 leading-tight">SY {schoolYear}</div>
              )}
            </div>
          </div>
          
          {/* Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex-shrink-0 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeftIcon />
            </button>
          )}
        </div>
        
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center pb-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <ul className="flex-1 mt-2 overflow-y-auto no-scrollbar pr-1">
        {renderNavItems()}
      </ul>
      
      {/* Footer */}
      <div className={`p-4 border-t border-slate-700 text-center text-xs text-slate-400 flex-shrink-0 transition-all duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden p-0' : 'opacity-100'}`}>
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