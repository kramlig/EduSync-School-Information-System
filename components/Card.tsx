
import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  loading?: boolean;
  color?: 'indigo' | 'green' | 'red' | 'yellow' | 'blue';
}

const Card: React.FC<CardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  onClick,
  loading = false,
  color = 'indigo'
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300',
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
  };

  const trendClasses = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-500 dark:text-slate-400'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-full w-12 h-12 mr-4"></div>
        <div className="flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className={`${colorClasses[color]} p-3 rounded-full mr-4`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">{title}</h4>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
          {trend && (
            <span className={`text-sm font-semibold ${trendClasses[trend]}`}>
              {trendIcons[trend]} {trendValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
