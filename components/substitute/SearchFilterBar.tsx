/**
 * Search and Filter Bar
 * 
 * Component for searching and filtering substitute assignments.
 * Memoized to prevent unnecessary re-renders.
 */

import React from 'react';

type StatusFilter = 'all' | 'active' | 'scheduled' | 'completed';

interface SearchFilterBarProps {
  searchTerm: string;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = React.memo(({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Search by teacher name
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search substitute or original teacher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
          />
        </div>
        <div className="md:w-64">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Filter by status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className="w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
          >
            <option value="all">All Assignments</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
});

SearchFilterBar.displayName = 'SearchFilterBar';

export default SearchFilterBar;
