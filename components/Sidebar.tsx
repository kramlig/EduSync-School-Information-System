import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import type { AuthUser, StudentUser, ParentUser, Announcement } from '../types';
import { HomeIcon, AcademicCapIcon, BriefcaseIcon, IdentificationIcon, UsersIcon, CalendarIcon, ClipboardUserIcon, BookOpenIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, TableCellsIcon, CalendarDaysIcon, CogIcon, MegaphoneIcon, ChevronRightIcon, BuildingOfficeIcon, CheckBadgeIcon, UserCircleIcon, CreditCardIcon, CurrencyDollarIcon, ChartPieIcon, DocumentTextIcon } from './icons';
import { useSchoolProfilePostgreSQL } from '../src/hooks/useSchoolProfilePostgreSQL';
import DepEdLogo from './DepEdLogo';

interface SidebarProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  announcements?: Announcement[];
}

const Sidebar: React.FC<SidebarProps> = ({ session, announcements = [] }) => {
  // Fetch school profile from PostgreSQL instead of receiving as props
  const { schoolName, schoolYear } = useSchoolProfilePostgreSQL();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Calculate announcement count for parents
  const parentAnnouncementCount = useMemo(() => {
    if (session.type !== 'parent') return null;
    const count = announcements.filter(a => ['all', 'parents'].includes(a.target)).length;
    return count > 0 ? String(count) : null;
  }, [announcements, session.type]);
  
  const staffNavGroups = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: <HomeIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
      ]
    },
    {
      title: 'School Management',
      items: [
        { path: '/announcements', label: 'Announcements', icon: <MegaphoneIcon />, roles: ['admin', 'principal'], badge: null },
        { path: '/admin/enrollment', label: 'Enrollment', icon: <ClipboardDocumentListIcon />, roles: ['admin'], badge: null },
        { path: '/students', label: 'Students', icon: <AcademicCapIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
        { path: '/teachers', label: 'Teachers', icon: <BriefcaseIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/parents', label: 'Parents', icon: <IdentificationIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/sections', label: 'Classes', icon: <UsersIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/schedule', label: 'Scheduler', icon: <CalendarIcon />, roles: ['admin', 'principal', 'registrar'], badge: null },
        { path: '/substitute', label: 'Substitutes', icon: <ClipboardUserIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/learning-areas', label: 'Learning Areas', icon: <BookOpenIcon />, roles: ['admin'], badge: null },
      ]
    },
    {
      title: 'Academics',
      items: [
        { path: '/lesson-plan', label: 'Lesson Plans', icon: <ClipboardDocumentIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
        { path: '/assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
        { path: '/grades', label: 'Grade Entry', icon: <TableCellsIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
        { path: '/attendance', label: 'Attendance', icon: <CalendarDaysIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
      ]
    },
    {
      title: 'Reports & Forms',
      items: [
        { path: '/reports/form137', label: 'Form 137', icon: <DocumentTextIcon />, roles: ['admin', 'registrar', 'principal'], badge: null },
        { path: '/reports/form138', label: 'Form 138', icon: <DocumentTextIcon />, roles: ['admin', 'teacher', 'principal', 'registrar'], badge: null },
        { path: '/reports/school-forms', label: 'School Forms', icon: <ClipboardDocumentListIcon />, roles: ['admin', 'registrar', 'principal'], badge: null },
        { path: '/reports/elln', label: 'ELLN Assessment', icon: <BookOpenIcon />, roles: ['admin', 'teacher', 'principal'], badge: null },
      ]
    },
    {
      title: 'Financial',
      items: [
        { path: '/fee-structures', label: 'Fee Structures', icon: <CurrencyDollarIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/record-payment', label: 'Record Payment', icon: <CreditCardIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/receipts', label: 'Receipt Register', icon: <ClipboardDocumentCheckIcon />, roles: ['admin', 'registrar'], badge: null },
        { path: '/financial-reports', label: 'Financial Reports', icon: <ChartPieIcon />, roles: ['admin', 'registrar'], badge: null },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/school-management', label: 'School Management', icon: <BuildingOfficeIcon />, roles: ['superadmin'], badge: null },
        { path: '/settings', label: 'Settings', icon: <CogIcon />, roles: ['admin'], badge: null },
        { path: '/validation-results', label: 'Validation Results', icon: <ClipboardDocumentCheckIcon />, roles: ['admin'], badge: null },
        { path: '/teacher-validation', label: 'Account Validation', icon: <CheckBadgeIcon />, roles: ['teacher'], badge: null },
      ]
    }
  ];
  
  const studentNavItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon />, badge: null },
    { path: '/assignments', label: 'My Assignments', icon: <ClipboardDocumentCheckIcon />, badge: '3' },
    { path: '/grades', label: 'My Grades & Reports', icon: <ClipboardDocumentListIcon />, badge: null },
    { path: '/attendance', label: 'My Attendance', icon: <CalendarDaysIcon />, badge: null },
    { path: '/schedule', label: 'My Schedule', icon: <CalendarIcon />, badge: null },
  ];

  const parentNavItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon />, badge: null },
    { path: '/profile', label: 'My Profile', icon: <UserCircleIcon />, badge: null },
    { path: '/billing', label: 'Billing & Payments', icon: <CreditCardIcon />, badge: null },
    { path: '/announcements', label: 'Announcements', icon: <MegaphoneIcon />, badge: parentAnnouncementCount },
    { path: '/assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon />, badge: null },
    { path: '/grades', label: 'Grades & Reports', icon: <ClipboardDocumentListIcon />, badge: null },
    { path: '/attendance', label: 'Attendance', icon: <CalendarDaysIcon />, badge: null },
    { path: '/schedule', label: 'Schedule', icon: <CalendarIcon />, badge: null },
  ];

  const NavItem: React.FC<{ to: string, label: string, icon: React.ReactNode, badge?: string | null }> = ({ to, label, icon, badge }) => (
    <li className={`${isCollapsed ? 'px-1 group relative' : 'px-3'} mb-1`}>
      <NavLink
        to={to}
        end
        title={isCollapsed ? label : undefined}
        className={({ isActive }) =>
          `group/item relative flex items-center w-full h-9 px-3 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            {/* Clean active indicator */}
            {isActive && !isCollapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-blue-400 rounded-r"></span>
            )}
            
            {/* Icon */}
            <span className={`shrink-0 transition-transform duration-200 w-5 h-5 flex items-center justify-center ${
              isActive ? '' : 'group-hover/item:scale-105'
            } ${isCollapsed ? 'relative' : ''}`}>
              {icon}
              {/* Compact badge for collapsed state */}
              {isCollapsed && badge && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-3.5 px-1 text-[9px] font-bold bg-red-500 text-white rounded-full shadow-sm">
                  {badge}
                </span>
              )}
            </span>
            
            {/* Label */}
            <span className={`ml-3 text-sm font-medium transition-all duration-200 ${
              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}>
              {label}
            </span>
            
            {/* Badge for expanded state */}
            {!isCollapsed && badge && (
              <span className="ml-auto flex items-center justify-center min-w-[18px] h-4 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {badge}
              </span>
            )}
            
            {/* Clean tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 delay-300 z-50 whitespace-nowrap border border-gray-700">
                {label}
                {badge && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[14px] h-3 px-1 text-[9px] font-bold bg-red-500 text-white rounded-full">
                    {badge}
                  </span>
                )}
                {/* Simple arrow */}
                <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1 h-1 bg-gray-800 border-l border-t border-gray-700 rotate-45"></div>
              </div>
            )}
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
            <h3 className={`transition-all duration-200 ${
              isCollapsed 
                ? 'opacity-0 h-0 overflow-hidden' 
                : 'px-6 pt-3 pb-1 opacity-100'
            } text-xs font-semibold text-gray-400 uppercase tracking-wide`}>
              {group.title}
            </h3>
            {/* Clean divider for collapsed state */}
            {isCollapsed && visibleItems.length > 0 && (
              <div className="mx-3 my-1.5 h-px bg-gray-800"></div>
            )}
            {visibleItems.map(item => (
              <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} badge={item.badge} />
            ))}
          </React.Fragment>
        );
      });
    }
    if (session.type === 'student') {
      return studentNavItems.map(item => <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} badge={item.badge} />);
    }
    if (session.type === 'parent') {
      return parentNavItems.map(item => <NavItem key={item.path} to={item.path} label={item.label} icon={item.icon} badge={item.badge} />);
    }
    return null;
  };

  return (
    <nav className={`transition-all duration-300 ease-out bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-gray-800/50 text-white flex flex-col print:hidden sticky top-0 self-start h-screen overflow-visible shadow-xl ${isCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Modern Clean Header */}
      <div className="relative flex-shrink-0 border-b border-gray-800/60">
        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center py-3 px-2' : 'px-4 py-3'} h-14`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''} min-w-0 flex-1`}>
            <div className="relative flex-shrink-0 group">
              <DepEdLogo className={`transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-9 w-9'} object-contain`} />
              
              {/* Minimal tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-500 z-50 whitespace-nowrap border border-gray-700">
                  <div className="font-semibold text-xs">EduSync</div>
                  <div className="text-xs text-gray-400 truncate max-w-[120px]" title={schoolName}>{schoolName}</div>
                  {schoolYear && <div className="text-xs text-gray-500">SY {schoolYear}</div>}
                  {/* Simple arrow */}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45"></div>
                </div>
              )}
            </div>
            
            {/* Brand text - clean and minimal */}
            <div className={`flex flex-col min-w-0 flex-1 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 h-0 overflow-hidden' : 'opacity-100'}`}>
              <div className="text-sm font-bold text-white leading-tight mb-0.5">
                EduSync
              </div>
              <div className="text-xs text-gray-400 leading-tight flex items-center gap-1.5 truncate">
                <BuildingOfficeIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate" title={schoolName}>{schoolName}</span>
              </div>
              {schoolYear && (
                <div className="text-xs text-gray-500 leading-tight font-medium">SY {schoolYear}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Minimalist toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-50 w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition-all duration-200 border border-gray-700 hover:border-gray-600 group"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className={`transition-transform duration-300 w-3 h-3 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
            <ChevronRightIcon />
          </div>
        </button>
      </div>
      
      {/* Navigation Items */}
      <ul className="flex-1 py-2 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600">
        {renderNavItems()}
      </ul>
      
      {/* Clean Footer */}
      <div className={`flex-shrink-0 border-t border-gray-800/60 transition-all duration-200 ${isCollapsed ? 'p-2' : 'px-4 py-2'}`}>
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">&copy; 2025 EduSync</p>
          <p className={`text-xs text-gray-600 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100'}`}>
            School Information System
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;