import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, WifiIcon, WifiSlashIcon, BellIcon, ArrowPathIcon, Bars3Icon, XMarkIcon } from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataState } from '../hooks/useSchoolData';

interface HeaderProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onLogout: () => void;
  students: SchoolDataState['students'];
  schoolYear?: string;
  parentSelectedChildId?: string | null;
  onParentChildChange?: (id: string) => void;
  onSyncClick?: (scope: 'auto' | 'students' | 'teachers' | 'grades' | 'coreValues' | 'coreValueGrades' | 'attendance' | 'sections' | 'assignments' | 'lessonPlans' | 'announcements' | 'classSchedules' | 'parents' | 'all') => void;
  unreadCount?: number;
  lastSyncTime?: Date | null;
  isSyncing?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  session, 
  onLogout, 
  students, 
  schoolYear, 
  parentSelectedChildId, 
  onParentChildChange, 
  onSyncClick,
  unreadCount = 0,
  lastSyncTime,
  isSyncing = false
}) => {
  const userRole = session.type === 'staff' ? (session.user as AuthUser).role : session.type;
  
  // State for parent's selected child view
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncMenuOpen, setSyncMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const syncMenuRef = useRef<HTMLDivElement>(null);

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

  // Close sync menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (syncMenuRef.current && !syncMenuRef.current.contains(e.target as Node)) {
        setSyncMenuOpen(false);
      }
    };
    if (syncMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [syncMenuOpen]);

  // Simple online indicator using navigator.onLine; can be replaced by a prop later
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

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

  // Format last sync time
  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return 'Over a day ago';
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const clearLocalCache = () => {
    try {
      const req = indexedDB.deleteDatabase('EduSyncDB');
      req.onsuccess = () => {
        showToastNotification('Local cache cleared! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      };
      req.onerror = () => {
        showToastNotification('Failed to clear cache. See console.');
        // eslint-disable-next-line no-console
        console.error('Error deleting IndexedDB');
      };
      req.onblocked = () => showToastNotification('Cache delete blocked. Close other tabs and try again.');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Cache clear threw:', e);
      showToastNotification('Unexpected error clearing cache.');
    }
  };

  const handleSyncClick = (scope: any) => {
    setSyncMenuOpen(false);
    if (onSyncClick) {
      onSyncClick(scope);
      showToastNotification(`Syncing ${scope}...`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex-shrink-0 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
        {/* Left: User Info */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
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
          {/* Online/Offline Status */}
          <div 
            className={`hidden sm:flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${isOnline ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'}`}
            title={lastSyncTime ? `Last synced: ${getLastSyncText()}` : 'No sync data'}
          >
            {isOnline ? <WifiIcon className="h-3.5 w-3.5 mr-1" /> : <WifiSlashIcon className="h-3.5 w-3.5 mr-1" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
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

          {/* Sync Menu */}
          {onSyncClick && (
            <div className="relative hidden sm:block" ref={syncMenuRef}>
              <button
                onClick={() => setSyncMenuOpen(!syncMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${isSyncing ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400'}`}
                aria-label="Sync data"
                aria-expanded={syncMenuOpen}
              >
                <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Sync</span>
              </button>
              {syncMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  <div className="py-1 text-sm max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      Sync Options
                    </div>
                    {['auto','announcements','grades','coreValues','coreValueGrades','attendance','assignments','lessonPlans','classSchedules','students','teachers','sections','parents','all'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleSyncClick(s)} 
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {s === 'auto' ? '🔄 Auto Sync' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clear Cache (Desktop only) */}
          <button 
            onClick={clearLocalCache} 
            title="Clear Local Cache" 
            className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-slate-600 hover:border-red-400 rounded-md transition-colors"
            aria-label="Clear local cache"
          >
            Clear Cache
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>

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
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(userRole)}`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                  {schoolYear && <span className="text-xs text-slate-500 dark:text-slate-400">SY {schoolYear}</span>}
                </div>
              </div>
            </div>
            
            {lastSyncTime && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Last synced: {getLastSyncText()}
              </div>
            )}

            {onSyncClick && (
              <button
                onClick={() => { handleSyncClick('auto'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <ArrowPathIcon className={isSyncing ? 'animate-spin' : ''} />
                Sync Now
              </button>
            )}

            <button
              onClick={() => { clearLocalCache(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Clear Cache
            </button>

            <button
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
              className="w-full px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in-down">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;