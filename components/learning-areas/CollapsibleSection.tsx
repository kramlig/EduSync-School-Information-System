/**
 * CollapsibleSection - Expandable section with localStorage persistence
 * 
 * Used in Learning Areas Management to group subjects by education level
 */

import React, { useState, memo } from 'react';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = memo(({ 
  title, 
  count, 
  defaultExpanded = false, 
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(`learning-area-section-${title}`);
    return saved !== null ? saved === 'true' : defaultExpanded;
  });

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`learning-area-section-${title}`, String(newState));
  };

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={toggleExpanded}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-expanded={isExpanded ? "true" : "false"}
        aria-controls={`section-${title.replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-semibold">
            {count} subject{count !== 1 ? 's' : ''}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div 
          id={`section-${title.replace(/\s+/g, '-')}`}
          className="divide-y divide-slate-200 dark:divide-slate-700"
        >
          {children}
        </div>
      )}
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

export default CollapsibleSection;
