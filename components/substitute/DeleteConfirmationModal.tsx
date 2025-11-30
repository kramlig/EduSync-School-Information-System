/**
 * Delete Confirmation Modal
 * 
 * Modal for confirming deletion of substitute assignments.
 * Memoized to prevent unnecessary re-renders.
 */

import React from 'react';
import Modal from '../Modal';
import type { Teacher } from '../../types';

interface DeleteModalProps {
  isOpen: boolean;
  assignmentId: string | null;
  substituteTeacher: Teacher | undefined;
  originalTeacher: Teacher | undefined;
  dateRange: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = React.memo(({
  isOpen,
  assignmentId,
  substituteTeacher,
  originalTeacher,
  dateRange,
  onClose,
  onConfirm,
}) => {
  if (!assignmentId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🗑️ Confirm Deletion">
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
        </div>
        
        {/* Assignment Details */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Assignment to Delete:</h4>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <p>
              <span className="font-medium">Substitute:</span>{' '}
              {substituteTeacher?.name ?? 'Unknown'}
            </p>
            <p>
              <span className="font-medium">Replacing:</span>{' '}
              {originalTeacher?.name ?? 'Unknown'}
            </p>
            <p>
              <span className="font-medium">Period:</span>{' '}
              {dateRange}
            </p>
          </div>
        </div>
        
        {/* Warning Message */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">
            <span className="font-bold">Warning:</span> This action cannot be undone. 
            The substitute assignment will be permanently removed from the system.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
          >
            🗑️ Delete Assignment
          </button>
        </div>
      </div>
    </Modal>
  );
});

DeleteConfirmationModal.displayName = 'DeleteConfirmationModal';

export default DeleteConfirmationModal;
