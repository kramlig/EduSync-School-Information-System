/**
 * SummaryCardSkeleton - Skeleton loader for summary cards
 * 
 * Provides a shimmer effect placeholder for summary statistics cards
 */

import React from 'react';

interface SummaryCardSkeletonProps {
  count?: number;
}

const SummaryCardSkeleton: React.FC<SummaryCardSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${Math.min(count, 5)} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse"
        >
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-8 w-16 bg-slate-300 dark:bg-slate-600 rounded" />
        </div>
      ))}
    </div>
  );
};

export default SummaryCardSkeleton;
