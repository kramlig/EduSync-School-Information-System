/**
 * TableSkeleton - Skeleton loader for table content
 * 
 * Provides a shimmer effect placeholder while data is loading,
 * improving perceived performance and user experience.
 */

import React from 'react';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  columns, 
  rows = 5, 
  showHeader = true 
}) => {
  return (
    <div className="animate-pulse">
      {showHeader && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div 
              key={`header-${i}`} 
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"
              style={{ maxWidth: i === 0 ? '150px' : i === columns - 1 ? '80px' : '120px' }}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-4 py-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"
                style={{ 
                  maxWidth: colIndex === 0 ? '150px' : colIndex === columns - 1 ? '80px' : '120px',
                  opacity: 1 - (rowIndex * 0.1)
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
