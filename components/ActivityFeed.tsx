import React from 'react';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, maxItems = 5 }) => {
  const displayedActivities = activities.slice(0, maxItems);

  const typeStyles = {
    info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
    success: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    error: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  };

  const iconColors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  if (displayedActivities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedActivities.map((activity) => (
        <div
          key={activity.id}
          className={`p-4 rounded-lg border-l-4 ${typeStyles[activity.type]}`}
        >
          <div className="flex items-start gap-3">
            {activity.icon && (
              <div className={`mt-1 ${iconColors[activity.type]}`}>
                {activity.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {activity.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {activity.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {activity.timestamp}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
