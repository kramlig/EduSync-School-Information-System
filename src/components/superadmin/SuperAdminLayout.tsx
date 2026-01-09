/**
 * SuperAdminLayout - Main layout with tab navigation
 * 
 * Provides the main container and tab navigation for the SuperAdmin module.
 * 
 * Features:
 * - Tab navigation (Schools, Divisions, Global Users, System)
 * - Platform-wide statistics summary
 * - Responsive design with dark mode support
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  BuildingOffice2Icon, 
  BuildingLibraryIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { SuperAdminTab, PlatformStats } from './types';
import { getPlatformStats } from './services/superAdminService';

// Lazy load tabs
const SchoolsTab = lazy(() => import('./tabs/SchoolsTab'));
const DivisionsTab = lazy(() => import('./tabs/DivisionsTab'));
const GlobalUsersTab = lazy(() => import('./tabs/GlobalUsersTab'));

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const TABS: { id: SuperAdminTab; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'schools', 
    label: 'Schools', 
    icon: <BuildingOffice2Icon className="w-5 h-5" />,
    description: 'Manage all schools across divisions'
  },
  { 
    id: 'divisions', 
    label: 'Divisions', 
    icon: <BuildingLibraryIcon className="w-5 h-5" />,
    description: 'Manage DepEd divisions'
  },
  { 
    id: 'users', 
    label: 'Global Users', 
    icon: <UsersIcon className="w-5 h-5" />,
    description: 'Create users for any school or division'
  },
  { 
    id: 'system', 
    label: 'System', 
    icon: <Cog6ToothIcon className="w-5 h-5" />,
    description: 'Platform-wide settings'
  },
];

// ============================================================================
// LOADING COMPONENT
// ============================================================================

const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
);

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SuperAdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('schools');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load platform stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await getPlatformStats();
        setStats(data);
      } catch (error) {
        console.error('[SuperAdminLayout] Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // Render active tab content
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'schools':
        return <SchoolsTab />;
      case 'divisions':
        return <DivisionsTab />;
      case 'users':
        return <GlobalUsersTab />;
      case 'system':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
            <Cog6ToothIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              System Settings
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Platform-wide configuration coming soon
            </p>
          </div>
        );
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                SuperAdmin Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Platform administration and management
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              SuperAdmin Mode
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard 
            label="Total Schools" 
            value={stats?.total_schools ?? 0}
            icon={<BuildingOffice2Icon className="w-5 h-5 text-blue-600" />}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard 
            label="Active Schools" 
            value={stats?.active_schools ?? 0}
            icon={<ChartBarIcon className="w-5 h-5 text-green-600" />}
            color="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard 
            label="Divisions" 
            value={stats?.total_divisions ?? 0}
            icon={<BuildingLibraryIcon className="w-5 h-5 text-purple-600" />}
            color="bg-purple-100 dark:bg-purple-900/30"
          />
          <StatCard 
            label="Students" 
            value={stats?.total_students ?? 0}
            icon={<UsersIcon className="w-5 h-5 text-amber-600" />}
            color="bg-amber-100 dark:bg-amber-900/30"
          />
          <StatCard 
            label="Teachers" 
            value={stats?.total_teachers ?? 0}
            icon={<UsersIcon className="w-5 h-5 text-cyan-600" />}
            color="bg-cyan-100 dark:bg-cyan-900/30"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-1 -mb-px" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }
                `}
                title={tab.description}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<TabLoader />}>
          {renderTabContent}
        </Suspense>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
