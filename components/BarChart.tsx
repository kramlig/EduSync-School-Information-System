import React from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = max > 0 ? (item.value / max) * 100 : 0;
        const barColor = item.color || 'bg-indigo-500';
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
              {item.label}
            </div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-8 relative overflow-hidden">
              <div 
                className={`${barColor} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${percentage}%` }}
              >
                <span className="text-white text-xs font-bold">{item.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
