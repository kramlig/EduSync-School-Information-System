/**
 * Empty State Component
 * 
 * Displays when no substitute assignments are found.
 * Memoized to prevent unnecessary re-renders.
 */

import React from 'react';

interface EmptyStateProps {
  hasFilters: boolean;
  onAddClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ hasFilters, onAddClick }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-md">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
        {hasFilters ? 'No assignments found' : 'No substitute assignments yet'}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        {hasFilters 
          ? 'Try adjusting your search or filter criteria.'
          : 'Get started by creating your first substitute assignment.'
        }
      </p>
      {!hasFilters && (
        <button
          onClick={onAddClick}
          className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add First Assignment
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
