import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDownIcon, WifiIcon, WifiSlashIcon, BellIcon, Bars3Icon, XMarkIcon } from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataState } from '../hooks/useSchoolData';
import { useFirestoreSyncStatus } from '../hooks/useFirestoreSyncStatus';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import SchoolSwitcher from './SchoolSwitcher';

interface HeaderProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onLogout: () => void;
  students: SchoolDataState['students'];
  schoolYear?: string;
  schoolName?: string;
  parentSelectedChildId?: string | null;
  onParentChildChange?: (id: string) => void;
  unreadCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  session, 
  onLogout, 
  students, 
  schoolYear,
  schoolName, 
  parentSelectedChildId, 
  onParentChildChange, 
  unreadCount = 0
}) => {
  const userRole = session.type === 'staff' ? (session.user as AuthUser).role : session.type;
  
  // State for parent's selected child view
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const parentChildren = useMemo(() => {
    if (session.type === 'parent') {
        const parentUser = session.user as ParentUser;
        return students.filter(s => parentUser.studentIds.includes(s.id));
    }
    return [];
  }, [session, students]);

  // Initialize internal selected child only when uncontrolled and needed
  useEffect(() => {
    if (session.type !== 'parent') return;
    if (parentSelectedChildId != null) return; // controlled mode
    if (!selectedChildId && parentChildren.length > 0) {
      setSelectedChildId(parentChildren[0].id);
    }
    // If current selection is no longer valid, reset to first child
    if (selectedChildId && !parentChildren.some(c => c.id === selectedChildId)) {
      setSelectedChildId(parentChildren[0]?.id ?? null);
    }
  }, [session, parentSelectedChildId, parentChildren, selectedChildId]);



  // Online status and sync monitoring
  const { isOnline, wasOffline } = useOnlineStatus();
  const { hasPendingWrites, pendingCount } = useFirestoreSyncStatus();

  // DEBUG: Log online status
  console.log('[Header] Online status:', { isOnline, wasOffline, navigatorOnline: navigator.onLine });

  // Role badge colors
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200';
      case 'teacher': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200';
      case 'parent': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';
      case 'student': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
    }
  };

  // NOTE: Clear cache function removed - users should not manually clear cache in production
  // Firestore handles sync automatically. If needed for debugging, use browser DevTools.

  return (
    <>
      <header className="sticky top-0 z-40 flex-shrink-0 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
        {/* Left: User Info */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          {/* School Name (for single-school or when SchoolSwitcher hidden) */}
          {schoolName && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-xs truncate">{schoolName}</span>
            </div>
          )}
          
          {/* User info */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{session.user.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(userRole)}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
            {schoolYear && <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">SY {schoolYear}</span>}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* School Switcher (for multi-school users) */}
          <SchoolSwitcher />
          
          {/* Online/Offline Status with Pending Writes */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              isOnline 
                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
            }`}
            title={isOnline ? 'Online' : 'Offline Mode - Changes will sync when connection is restored'}
            role="status"
            aria-live="polite"
          >
            {isOnline ? (
              <WifiIcon className="h-3.5 w-3.5" />
            ) : (
              <WifiSlashIcon className="h-3.5 w-3.5 animate-pulse" />
            )}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            {!isOnline && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-700 rounded-full text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </div>

          {/* Parent Child Selector */}
          {session.type === 'parent' && parentChildren.length > 0 && (
            <div className="relative">
              <select
                value={(parentSelectedChildId ?? selectedChildId) ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (onParentChildChange) {
                    onParentChildChange(id);
                  } else {
                    setSelectedChildId(id);
                  }
                }}
                className="appearance-none w-36 md:w-44 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                aria-label="Select child"
              >
                {parentChildren.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600 dark:text-slate-300">
                <ChevronDownIcon />
              </div>
            </div>
          )}

          {/* Notification Bell */}
          {unreadCount > 0 && (
            <button
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label={`${unreadCount} unread notifications`}
              title={`${unreadCount} unread notifications`}
            >
              <BellIcon />
              <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>

          {/* Sync Status Indicator (Desktop) */}
          {hasPendingWrites && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full border border-orange-200 dark:border-orange-800">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Syncing ({pendingCount})</span>
            </div>
          )}
          {!hasPendingWrites && wasOffline && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full border border-green-200 dark:border-green-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All changes saved</span>
            </div>
          )}

          {/* Logout (Desktop) */}
          <button 
            onClick={onLogout} 
            className="hidden lg:inline-block px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-lg z-30 print:hidden">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex-1">
                <div className="font-semibold text-slate-800 dark:text-white">{session.user.name}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(userRole)}`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                  {schoolYear && <span className="text-xs text-slate-500 dark:text-slate-400">SY {schoolYear}</span>}
                  {schoolName && <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{schoolName}</span>}
                </div>
              </div>
            </div>
            
            {/* Sync Status Indicator (Mobile) */}
            {hasPendingWrites && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-md border border-orange-200 dark:border-orange-800">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Syncing {pendingCount} changes...</span>
              </div>
            )}
            {!hasPendingWrites && wasOffline && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All changes saved</span>
              </div>
            )}

            <button
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
              className="w-full px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;