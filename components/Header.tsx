
import React from 'react';
import { WifiIcon, WifiSlashIcon } from './icons';

interface HeaderProps {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isOnline, setIsOnline }) => {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="text-xl font-semibold text-slate-800 dark:text-white">School Information System</div>
      <div className="flex items-center space-x-4">
        <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-amber-500'}`}>
          {isOnline ? 'Online' : 'Offline Mode'}
        </span>
        <label htmlFor="online-toggle" className="relative inline-flex items-center cursor-pointer">
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
