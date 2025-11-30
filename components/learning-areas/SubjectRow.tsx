/**
 * SubjectRow - Individual learning area row component
 * 
 * Displays subject info with edit/delete actions for admins
 */

import React, { memo } from 'react';
import type { LearningArea } from '../../types';
import { TrashIcon, PencilIcon } from '../icons';

interface SubjectRowProps {
  subject: LearningArea;
  onEdit: (subject: LearningArea) => void;
  onDelete: (subject: LearningArea) => void;
  isAdmin: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

/** Category badge color mapping */
const CATEGORY_STYLES: Record<string, string> = {
  core: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  specialized: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  elective: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  tle: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  sports: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

const SubjectRow: React.FC<SubjectRowProps> = memo(({ 
  subject, 
  onEdit, 
  onDelete, 
  isAdmin, 
  isSelected, 
  onToggleSelect 
}) => {
  const categoryStyle = CATEGORY_STYLES[subject.category || 'core'] || CATEGORY_STYLES.core;

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {isAdmin && onToggleSelect && (
        <label className="mr-4 flex items-center" title={`Select ${subject.name}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(subject.id)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            aria-label={`Select ${subject.name}`}
          />
        </label>
      )}
      
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-medium text-slate-900 dark:text-white">
            {subject.name}
          </h3>
          
          {subject.kToTwelveCode && (
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">
              {subject.kToTwelveCode}
            </span>
          )}
          
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryStyle}`}>
            {(subject.category || 'core').toUpperCase()}
          </span>
          
          {subject.isActive === false && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              INACTIVE
            </span>
          )}
        </div>
        
        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Grades {subject.gradeLevel?.join(', ') || 'N/A'} • {subject.credits} credit{subject.credits !== 1 ? 's' : ''}
          {subject.department && ` • ${subject.department}`}
        </div>
        
        {subject.description && (
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">
            {subject.description}
          </div>
        )}
      </div>
      
      {isAdmin && (
        <div className="flex items-center gap-2 ml-4">
          <button 
            onClick={() => onEdit(subject)} 
            className="flex items-center gap-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors font-semibold text-xs"
            aria-label={`Edit ${subject.name}`}
          >
            <PencilIcon /><span>Edit</span>
          </button>
          <button 
            onClick={() => onDelete(subject)} 
            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors font-semibold text-xs"
            aria-label={`Delete ${subject.name}`}
          >
            <TrashIcon /><span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
});

SubjectRow.displayName = 'SubjectRow';

export default SubjectRow;
