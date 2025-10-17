import React from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: 'indigo' | 'green' | 'blue' | 'red' | 'yellow';
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  color = 'indigo',
  label
}) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    indigo: 'stroke-indigo-500',
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    red: 'stroke-red-500',
    yellow: 'stroke-yellow-500',
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={colorClasses[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-slate-800 dark:fill-white transform rotate-90"
          style={{ transformOrigin: 'center' }}
        >
          {Math.round(percentage)}%
        </text>
      </svg>
      {label && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
      )}
    </div>
  );
};

export default ProgressRing;
