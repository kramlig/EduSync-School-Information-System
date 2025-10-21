import React from 'react';

interface BehaviorDistributionChartProps {
  data: {
    label: string;
    count: number;
    color: string;
    icon: string;
  }[];
  title?: string;
}

const BehaviorDistributionChart: React.FC<BehaviorDistributionChartProps> = ({ 
  data, 
  title = 'Core Values Assessment Distribution' 
}) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{title}</h3>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            {/* Header with icon and label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-800 dark:text-white">
                  {item.count}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                  {total > 0 ? `${Math.round((item.count / total) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  background: item.color,
                  minWidth: item.count > 0 ? '0.75rem' : '0'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Total Assessed:</span>
            <span className="ml-2 font-bold text-slate-800 dark:text-white">{total}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-600 dark:text-slate-400">Unassessed:</span>
            <span className="ml-2 font-bold text-slate-800 dark:text-white">
              {data.find(d => d.label === 'Total Students')?.count 
                ? data.find(d => d.label === 'Total Students')!.count - total 
                : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorDistributionChart;
