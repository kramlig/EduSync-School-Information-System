/**
 * LearningAreaFormModal - Add/Edit Learning Area Form Modal
 * 
 * Handles both creation and editing of learning areas
 */

import React, { memo } from 'react';
import Modal from '../Modal';
import type { LearningArea } from '../../types';

type LearningAreaFormData = Omit<LearningArea, 'id' | 'schoolId'>;

interface LearningAreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: LearningAreaFormData;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const GRADE_GROUPS = [
  { label: 'Elementary:', grades: [1, 2, 3, 4, 5, 6] },
  { label: 'Junior High:', grades: [7, 8, 9, 10] },
  { label: 'Senior High:', grades: [11, 12] },
];

const LearningAreaFormModal: React.FC<LearningAreaFormModalProps> = memo(({
  isOpen,
  onClose,
  formData,
  isEditing,
  onInputChange,
  onSubmit,
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Edit Learning Area" : "Add New Learning Area"}
    >
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Learning Area Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              id="category"
              value={formData.category || 'core'}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="core">Core</option>
              <option value="specialized">Specialized</option>
              <option value="elective">Elective</option>
              <option value="tle">TLE</option>
              <option value="sports">Sports</option>
            </select>
          </div>

          {/* Credits */}
          <div>
            <label htmlFor="credits" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Credits <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="credits"
              id="credits"
              value={formData.credits}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              required
              min="1"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <input
              type="text"
              name="department"
              id="department"
              value={formData.department || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Language, STEM"
            />
          </div>

          {/* K-12 Code */}
          <div>
            <label htmlFor="kToTwelveCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              DepEd K-12 Code
            </label>
            <input
              type="text"
              name="kToTwelveCode"
              id="kToTwelveCode"
              value={formData.kToTwelveCode || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., FIL, ENG, MATH"
            />
          </div>

          {/* Grade Levels */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Grade Levels <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {GRADE_GROUPS.map(group => (
                <div key={group.label} className="flex flex-wrap gap-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-full">
                    {group.label}
                  </span>
                  {group.grades.map(grade => (
                    <label key={grade} className="flex items-center">
                      <input
                        type="checkbox"
                        value={grade}
                        checked={formData.gradeLevel?.includes(grade) || false}
                        onChange={onInputChange}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        Grade {grade}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Display Order
            </label>
            <input
              type="number"
              name="order"
              id="order"
              value={formData.order || 0}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              min="0"
            />
          </div>

          {/* Hours Per Week */}
          <div>
            <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Hours Per Week
            </label>
            <input
              type="number"
              name="hoursPerWeek"
              id="hoursPerWeek"
              value={formData.hoursPerWeek || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              min="1"
              placeholder="Optional"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description || ''}
              onChange={onInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="Brief description of the learning area"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {isEditing ? 'Update Learning Area' : 'Add Learning Area'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

LearningAreaFormModal.displayName = 'LearningAreaFormModal';

export default LearningAreaFormModal;
