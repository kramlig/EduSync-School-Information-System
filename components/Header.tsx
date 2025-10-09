import React from 'react';
import { WifiIcon, WifiSlashIcon } from './icons';
import type { AuthUser } from '../types';

interface HeaderProps {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  authUser: AuthUser;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isOnline, setIsOnline, authUser, onLogout }) => {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden">
      <div className="flex items-center">
        <div className="text-xl font-semibold text-slate-800 dark:text-white">EduSync</div>
        <div className="hidden md:block ml-6 text-sm text-slate-500 dark:text-slate-400">Welcome, <span className="font-semibold text-slate-700 dark:text-slate-200">{authUser.name}</span> (<span className="capitalize">{authUser.role}</span>)</div>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={onLogout} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Logout</button>
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
      </div>
    </header>
  );
};

export default Header;