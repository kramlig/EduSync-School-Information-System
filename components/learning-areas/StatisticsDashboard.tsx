/**
 * StatisticsDashboard - K-12 Curriculum Statistics Display
 * 
 * Shows stats breakdown by education level, category, and track
 */

import React, { memo } from 'react';

interface Stats {
  total: number;
  elementary: number;
  juniorHigh: number;
  seniorHighCore: number;
  seniorHighSTEM: number;
  seniorHighABM: number;
  seniorHighHUMSS: number;
  seniorHighGAS: number;
  byCategory: {
    core: number;
    specialized: number;
    elective: number;
    tle: number;
    sports: number;
  };
  active: number;
  inactive: number;
}

interface StatisticsDashboardProps {
  stats: Stats;
}

const StatItem: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
  <div className="text-center">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</div>
  </div>
);

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = memo(({ stats }) => {
  return (
    <div className="mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-lg shadow-md border border-indigo-100 dark:border-slate-700">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Curriculum Statistics</h2>
      
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatItem value={stats.total} label="Total Subjects" color="text-indigo-600 dark:text-indigo-400" />
        <StatItem value={stats.elementary} label="Elementary" color="text-blue-600 dark:text-blue-400" />
        <StatItem value={stats.juniorHigh} label="Junior High" color="text-purple-600 dark:text-purple-400" />
        <StatItem value={stats.seniorHighCore} label="SHS Core" color="text-pink-600 dark:text-pink-400" />
        <StatItem value={stats.active} label="Active" color="text-green-600 dark:text-green-400" />
        <StatItem value={stats.inactive} label="Inactive" color="text-gray-600 dark:text-gray-400" />
      </div>
      
      {/* By Category */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">By Category</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-center text-sm">
          <div><span className="font-bold text-blue-600 dark:text-blue-400">{stats.byCategory.core}</span> Core</div>
          <div><span className="font-bold text-purple-600 dark:text-purple-400">{stats.byCategory.specialized}</span> Specialized</div>
          <div><span className="font-bold text-green-600 dark:text-green-400">{stats.byCategory.elective}</span> Elective</div>
          <div><span className="font-bold text-orange-600 dark:text-orange-400">{stats.byCategory.tle}</span> TLE</div>
          <div><span className="font-bold text-pink-600 dark:text-pink-400">{stats.byCategory.sports}</span> Sports</div>
        </div>
      </div>
      
      {/* SHS Tracks */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Senior High Tracks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
          <div><span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.seniorHighSTEM}</span> STEM</div>
          <div><span className="font-bold text-blue-600 dark:text-blue-400">{stats.seniorHighABM}</span> ABM</div>
          <div><span className="font-bold text-purple-600 dark:text-purple-400">{stats.seniorHighHUMSS}</span> HUMSS</div>
          <div><span className="font-bold text-pink-600 dark:text-pink-400">{stats.seniorHighGAS}</span> GAS</div>
        </div>
      </div>
    </div>
  );
});

StatisticsDashboard.displayName = 'StatisticsDashboard';

export default StatisticsDashboard;
export type { Stats };
