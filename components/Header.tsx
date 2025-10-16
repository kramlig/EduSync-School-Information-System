import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDownIcon, WifiIcon, WifiSlashIcon } from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataState } from '../hooks/useSchoolData';

interface HeaderProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onLogout: () => void;
  schoolName: string;
  students: SchoolDataState['students'];
  schoolYear?: string;
  parentSelectedChildId?: string | null;
  onParentChildChange?: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ session, onLogout, schoolName, students, schoolYear, parentSelectedChildId, onParentChildChange }) => {
  const userRole = session.type === 'staff' ? (session.user as AuthUser).role : session.type;
  
  // State for parent's selected child view
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

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

  // Simple online indicator using navigator.onLine; can be replaced by a prop later
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const clearLocalCache = () => {
    try {
      const req = indexedDB.deleteDatabase('EduSyncDB');
      req.onsuccess = () => {
        alert('Local cache cleared. The app will reload to fetch fresh data.');
        window.location.reload();
      };
      req.onerror = () => {
        alert('Failed to clear local cache. See console for details.');
        // eslint-disable-next-line no-console
        console.error('Error deleting IndexedDB');
      };
      req.onblocked = () => alert('Cache delete blocked. Close other tabs with this app open and try again.');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Cache clear threw:', e);
      alert('Unexpected error clearing cache.');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden">
      <div className="flex items-center min-w-0">
        <div className="truncate text-xl font-semibold text-slate-800 dark:text-white" title={schoolName}>EduSync</div>
        <div className="hidden md:block ml-6 text-sm text-slate-500 dark:text-slate-400">Welcome, <span className="font-semibold text-slate-700 dark:text-slate-200">{session.user.name}</span> (<span className="capitalize">{userRole}</span>{schoolYear ? ` • SY ${schoolYear}` : ''})</div>
      </div>
      <div className="flex items-center gap-3 md:gap-5">
        <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors ${isOnline ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'}`}>
          {isOnline ? <WifiIcon className="h-4 w-4 mr-1.5" /> : <WifiSlashIcon className="h-4 w-4 mr-1.5" />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>
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
              className="appearance-none w-40 md:w-48 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
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
        <button onClick={clearLocalCache} title="Clear Local Cache" className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-300 dark:border-slate-600 rounded px-2 py-1">Clear Cache</button>
        <button onClick={onLogout} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Logout</button>
      </div>
    </header>
  );
};

export default Header;