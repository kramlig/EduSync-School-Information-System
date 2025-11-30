/**
 * Assignment Card Component
 * 
 * Displays a single substitute assignment with teacher info, dates, and actions.
 * Memoized to prevent unnecessary re-renders.
 */

import React from 'react';
import { PencilIcon, TrashIcon } from '../icons';
import type { Teacher } from '../../types';

interface AssignmentStatus {
  text: string;
  color: string;
  icon: string;
}

interface AssignmentCardProps {
  id: string;
  substituteTeacher: Teacher | undefined;
  originalTeacher: Teacher | undefined;
  dateRange: string;
  duration: string;
  status: AssignmentStatus;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = React.memo(({
  id,
  substituteTeacher,
  originalTeacher,
  dateRange,
  duration,
  status,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xl">
              👤
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {substituteTeacher?.name ?? 'Unknown Teacher'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Replacing: {originalTeacher?.name ?? 'Unknown'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">📅</span>
              <span className="text-slate-600 dark:text-slate-300">{dateRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Duration:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{duration}</span>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.color} flex items-center gap-1`}>
              <span>{status.icon}</span>
              {status.text}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button 
            onClick={() => onEdit(id)} 
            className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors flex items-center gap-1"
            title="Edit assignment"
          >
            <PencilIcon />
          </button>
          <button 
            onClick={() => onDelete(id)} 
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
            title="Delete assignment"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
});

AssignmentCard.displayName = 'AssignmentCard';

export default AssignmentCard;
