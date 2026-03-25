/**
 * PersonalSidebar — Left navigation for personal workspace.
 *
 * Simplified version of the main Sidebar with only features
 * relevant to individual teachers.
 */

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  HeartIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import UpgradeModal from './UpgradeModal';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  tier: string;
}

const NAV_ITEMS = [
  { to: '/personal', icon: HomeIcon, label: 'Dashboard', end: true },
  { to: '/personal/students', icon: UserGroupIcon, label: 'My Students' },
  { to: '/personal/grades', icon: AcademicCapIcon, label: 'Gradebook' },
  { to: '/personal/attendance', icon: CalendarDaysIcon, label: 'Attendance' },
  { to: '/personal/core-values', icon: HeartIcon, label: 'Core Values' },
  { to: '/personal/homeroom-guidance', icon: BookOpenIcon, label: 'Homeroom Guidance' },
  { to: '/personal/forms', icon: DocumentTextIcon, label: 'Generate Forms' },
  { to: '/personal/analytics', icon: ChartBarIcon, label: 'Analytics' },
  { to: '/personal/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

const PersonalSidebar: React.FC<Props> = ({ collapsed, onToggle, tier }) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const location = useLocation();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-200 dark:border-slate-700">
        {!collapsed && (
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">
            My Workspace
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
        >
          {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={() =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(to, end)
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade CTA for free tier */}
      {tier === 'free' && !collapsed && (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-1.5 mb-1">
            <SparklesIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Upgrade to Pro</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
            Unlimited students, sections & downloads
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="w-full py-1 px-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            View Plans
          </button>
          <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={tier} />
        </div>
      )}
    </aside>
  );
};

export default PersonalSidebar;
