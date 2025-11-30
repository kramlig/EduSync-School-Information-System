/**
 * Substitute Statistics Dashboard
 * 
 * Displays key metrics for substitute assignments.
 * Memoized to prevent unnecessary re-renders.
 */

import React from 'react';

interface StatisticsDashboardProps {
  stats: {
    total: number;
    active: number;
    scheduled: number;
    completed: number;
  };
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ 
  label, 
  value, 
  icon, 
  gradient, 
  textColor 
}) => (
  <div className={`${gradient} rounded-lg p-5 text-white shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`${textColor} text-sm font-medium`}>{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-5xl opacity-80">{icon}</div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = React.memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Assignments"
        value={stats.total}
        icon="👥"
        gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
        textColor="text-indigo-100"
      />
      <StatCard
        label="Active Now"
        value={stats.active}
        icon="✓"
        gradient="bg-gradient-to-br from-green-500 to-green-600"
        textColor="text-green-100"
      />
      <StatCard
        label="Scheduled"
        value={stats.scheduled}
        icon="📅"
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        textColor="text-blue-100"
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon="✔"
        gradient="bg-gradient-to-br from-slate-500 to-slate-600"
        textColor="text-slate-100"
      />
    </div>
  );
});

StatisticsDashboard.displayName = 'StatisticsDashboard';

export default StatisticsDashboard;
