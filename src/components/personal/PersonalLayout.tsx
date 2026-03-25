/**
 * PersonalLayout — Shell layout for /personal/* routes.
 *
 * Provides sidebar, header (with logout), and an <Outlet> for child routes.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PersonalSidebar from './PersonalSidebar';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface Props {
  userName: string;
  tier: string;
  onLogout: () => void;
}

const PersonalLayout: React.FC<Props> = ({ userName, tier, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      <PersonalSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        tier={tier}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {userName}
            </span>
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {tier}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign out
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PersonalLayout;
