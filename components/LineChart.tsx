import React from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, height = 150, color = 'indigo' }) => {
  if (data.length === 0) return <div className="text-slate-500 text-sm">No data available</div>;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || maxValue || 1; // Use maxValue if all values are the same

  const points = data.map((item, index) => {
    // Handle single data point case (avoid division by zero)
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    // For single point or same values, center at 50% height
    const y = range === maxValue ? 50 : 100 - (((item.value - minValue) / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  const colorClasses = {
    indigo: 'stroke-indigo-500',
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    red: 'stroke-red-500',
  }[color] || 'stroke-indigo-500';

  const fillClasses = {
    indigo: 'fill-indigo-100 dark:fill-indigo-900/30',
    green: 'fill-green-100 dark:fill-green-900/30',
    blue: 'fill-blue-100 dark:fill-blue-900/30',
    red: 'fill-red-100 dark:fill-red-900/30',
  }[color] || 'fill-indigo-100 dark:fill-indigo-900/30';

  return (
    <div>
      <svg viewBox="0 0 100 100" className="w-full" style={{ height: `${height}px` }}>
        {/* Area under line */}
        <polygon
          points={`0,100 ${points} 100,100`}
          className={fillClasses}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          className={colorClasses}
          strokeWidth="2"
        />
        {/* Data points */}
        {data.map((item, index) => {
          // Handle single data point case (avoid division by zero)
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          // For single point or same values, center at 50% height
          const y = range === maxValue ? 50 : 100 - (((item.value - minValue) / range) * 100);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={data.length === 1 ? "4" : "2"}
              className={colorClasses.replace('stroke', 'fill')}
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
        {data.map((item, index) => (
          <span key={index} className="truncate">{item.label}</span>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
