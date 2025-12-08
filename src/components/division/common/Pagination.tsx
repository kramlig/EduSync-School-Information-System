/**
 * Pagination - Reusable pagination component for division tables
 * 
 * Features:
 * - Page navigation with Previous/Next buttons
 * - Shows current page range and total count
 * - Page size selector
 * - Responsive design
 */

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  loading = false,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (total === 0 && !loading) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700">
      {/* Info */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {loading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            Showing <span className="font-medium">{startItem.toLocaleString()}</span> to{' '}
            <span className="font-medium">{endItem.toLocaleString()}</span> of{' '}
            <span className="font-medium">{total.toLocaleString()}</span> results
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              className="px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages || 1}</span>
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
