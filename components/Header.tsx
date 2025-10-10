import React, { useMemo } from 'react';
import { WifiIcon, WifiSlashIcon, ChevronDownIcon } from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';

interface HeaderProps {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onLogout: () => void;
  schoolData: SchoolDataHook;
  selectedChildId: string | null;
  setSelectedChildId: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isOnline, setIsOnline, session, onLogout, schoolData, selectedChildId, setSelectedChildId }) => {
  const userRole = session.type === 'staff' ? (session.user as AuthUser).role : session.type;
  
  const parentChildren = useMemo(() => {
    if (session.type === 'parent') {
        const parentUser = session.user as ParentUser;
        return schoolData.students.filter(s => parentUser.studentIds.includes(s.id));
    }
    return [];
  }, [session, schoolData.students]);

  const selectedChildName = useMemo(() => {
    return parentChildren.find(c => c.id === selectedChildId)?.name;
  }, [parentChildren, selectedChildId]);

  return (
    <header className="flex-shrink-0 flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden">
      <div className="flex items-center">
        <div className="text-xl font-semibold text-slate-800 dark:text-white">EduSync</div>
        <div className="hidden md:block ml-6 text-sm text-slate-500 dark:text-slate-400">Welcome, <span className="font-semibold text-slate-700 dark:text-slate-200">{session.user.name}</span> (<span className="capitalize">{userRole}</span>)</div>
      </div>
      <div className="flex items-center space-x-4">
        {session.type === 'parent' && parentChildren.length > 0 && (
            <div className="relative">
                <select 
                    value={selectedChildId ?? ''}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="appearance-none w-full md:w-48 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-3 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {parentChildren.map(child => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                    <ChevronDownIcon />
                </div>
            </div>
        )}
        <button onClick={onLogout} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Logout</button>
        {session.type === 'staff' && (
          <>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600"></div>
            <label htmlFor="online-toggle" className="relative inline-flex items-center cursor-pointer" title="Toggle Offline Mode">
              <input 
                type="checkbox" 
                id="online-toggle" 
                className="sr-only peer" 
                checked={isOnline} 
                onChange={() => setIsOnline(!isOnline)} 
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              {isOnline ? <WifiIcon className="ml-2 text-green-500"/> : <WifiSlashIcon className="ml-2 text-amber-500"/>}
            </label>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;