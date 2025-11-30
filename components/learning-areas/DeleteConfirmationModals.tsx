/**
 * DeleteConfirmationModals - Delete confirmation modals for Learning Areas
 * 
 * Includes single delete and bulk delete confirmation modals
 */

import React, { memo } from 'react';
import Modal from '../Modal';
import type { LearningArea } from '../../types';

// ==================== Single Delete Modal ====================

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: LearningArea | null;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteModalProps> = memo(({
  isOpen,
  onClose,
  area,
  onConfirm,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
    <p className="text-slate-700 dark:text-slate-300">
      Are you sure you want to delete the learning area{' '}
      <span className="font-bold">{area?.name}</span>? 
      This will also delete all associated grades for all students. 
      This action cannot be undone.
    </p>
    <div className="flex justify-end space-x-2 mt-6">
      <button
        onClick={onClose}
        className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete Learning Area
      </button>
    </div>
  </Modal>
));

DeleteConfirmationModal.displayName = 'DeleteConfirmationModal';

// ==================== Bulk Delete Modal ====================

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  learningAreas: LearningArea[];
  onConfirm: () => void;
}

export const BulkDeleteConfirmationModal: React.FC<BulkDeleteModalProps> = memo(({
  isOpen,
  onClose,
  selectedIds,
  learningAreas,
  onConfirm,
}) => {
  const selectedAreas = Array.from(selectedIds)
    .map(id => learningAreas.find(a => a.id === id))
    .filter(Boolean) as LearningArea[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Delete Confirmation">
      <p className="mb-4 text-slate-700 dark:text-slate-300">
        Are you sure you want to delete{' '}
        <span className="font-bold">
          {selectedIds.size} learning area{selectedIds.size !== 1 ? 's' : ''}
        </span>?
        This will also delete all associated grades for all students in these subjects.
      </p>
      
      {/* Selected items list */}
      <div className="mb-4 max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Subjects to be deleted:
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          {selectedAreas.map(area => (
            <li key={area.id}>
              • {area.name} ({area.kToTwelveCode || 'No code'})
            </li>
          ))}
        </ul>
      </div>
      
      <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-4">
        ⚠️ This action cannot be undone!
      </p>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete {selectedIds.size} Subject{selectedIds.size !== 1 ? 's' : ''}
        </button>
      </div>
    </Modal>
  );
});

BulkDeleteConfirmationModal.displayName = 'BulkDeleteConfirmationModal';
