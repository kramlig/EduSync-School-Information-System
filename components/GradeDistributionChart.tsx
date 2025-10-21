import React from 'react';

interface GradeDistributionChartProps {
  data: {
    range: string;
    count: number;
    color: string;
  }[];
  title?: string;
}

const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data, title = 'Grade Distribution' }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{title}</h3>
      
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-20 text-sm font-medium text-slate-700 dark:text-slate-300">
              {item.range}
            </div>
            
            {/* Bar */}
            <div className="flex-1 relative h-8 bg-slate-100 dark:bg-slate-700 rounded">
              <div
                className="h-full rounded transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  background: item.color,
                  minWidth: item.count > 0 ? '2rem' : '0'
                }}
              >
                <span className="text-sm font-bold text-white drop-shadow">
                  {item.count}
                </span>
              </div>
            </div>
            
            {/* Percentage */}
            <div className="w-16 text-sm text-slate-600 dark:text-slate-400 text-right">
              {data.reduce((sum, d) => sum + d.count, 0) > 0
                ? `${Math.round((item.count / data.reduce((sum, d) => sum + d.count, 0)) * 100)}%`
                : '0%'}
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Total Students:</span>
          <span className="font-bold text-slate-800 dark:text-white">
            {data.reduce((sum, d) => sum + d.count, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GradeDistributionChart;
