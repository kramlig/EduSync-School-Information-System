/**
 * DivisionDashboardSkeleton - Full page skeleton loader for division report dashboards
 * 
 * Provides a comprehensive skeleton for SF5/SF6/SF7 report pages
 * with proper visual structure matching the actual content.
 */

import React from 'react';

interface DivisionDashboardSkeletonProps {
  /** Number of summary cards to show */
  summaryCards?: number;
  /** Whether to show view mode tabs */
  showViewModes?: boolean;
  /** Whether to show filter dropdowns */
  showFilters?: boolean;
  /** Number of table columns */
  tableColumns?: number;
}

const DivisionDashboardSkeleton: React.FC<DivisionDashboardSkeletonProps> = ({
  summaryCards = 4,
  showViewModes = true,
  showFilters = true,
  tableColumns = 6,
}) => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-80 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-60" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-28" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-28" />
        </div>
      </div>

      {/* Summary Cards skeleton */}
      <div className={`grid grid-cols-2 lg:grid-cols-${summaryCards} gap-4`}>
        {Array.from({ length: summaryCards }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-24" />
              </div>
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* View modes and filters skeleton */}
      {(showViewModes || showFilters) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {showViewModes && (
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-24" />
              ))}
            </div>
          )}
          {showFilters && (
            <div className="flex gap-2">
              <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-36" />
            </div>
          )}
        </div>
      )}

      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex gap-4">
          {Array.from({ length: tableColumns }).map((_, i) => (
            <div
              key={`header-${i}`}
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"
              style={{ maxWidth: i === 0 ? '180px' : '100px' }}
            />
          ))}
        </div>
        {/* Table rows */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="px-6 py-4 flex gap-4">
              {Array.from({ length: tableColumns }).map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"
                  style={{
                    maxWidth: colIndex === 0 ? '180px' : '100px',
                    opacity: 1 - rowIndex * 0.08,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DivisionDashboardSkeleton;
