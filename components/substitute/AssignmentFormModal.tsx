/**
 * Substitute Assignment Form Modal
 * 
 * Form for creating and editing substitute assignments.
 * Memoized to prevent unnecessary re-renders.
 */

import React, { useMemo } from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import type { Teacher } from '../../types';

interface FormData {
  teacherId: string;
  originalTeacherId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
}

interface AssignmentFormModalProps {
  isOpen: boolean;
  isEdit: boolean;
  formData: FormData;
  formError: string | null;
  teachers: Teacher[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const getDuration = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '1 day';
  if (diffDays < 7) return `${diffDays + 1} days`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? '1 week' : `${weeks} weeks`;
};

const AssignmentFormModal: React.FC<AssignmentFormModalProps> = React.memo(({
  isOpen,
  isEdit,
  formData,
  formError,
  teachers,
  onClose,
  onSubmit,
  onInputChange,
  onSelectChange,
}) => {
  // Memoize teacher options
  const teacherOptions = useMemo(() => 
    teachers
      .filter(t => t.role === 'teacher')
      .map(t => ({ 
        value: t.id, 
        label: t.name || 'Unknown Teacher'
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
  , [teachers]);

  const isFormValid = formData.teacherId && formData.originalTeacherId && 
    formData.startDate && formData.endDate && !formError;
  
  const duration = formData.startDate && formData.endDate 
    ? getDuration(formData.startDate, formData.endDate) 
    : null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEdit ? '✏️ Edit Substitute Assignment' : '➕ Add Substitute Assignment'}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Teacher Selection Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">👥</span>
            <h4 className="font-semibold text-slate-800 dark:text-white">Teacher Assignment</h4>
          </div>
          
          <div>
            <label htmlFor="teacherId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Substitute Teacher <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="teacherId"
              name="teacherId"
              value={formData.teacherId}
              onChange={(value) => onSelectChange('teacherId', value)}
              options={teacherOptions}
              placeholder="Search for a substitute teacher..."
              icon="👤"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Who will be filling in during this period? ({teacherOptions.length} teachers available)
            </p>
          </div>
          
          <div>
            <label htmlFor="originalTeacherId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teacher to Replace <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="originalTeacherId"
              name="originalTeacherId"
              value={formData.originalTeacherId}
              onChange={(value) => onSelectChange('originalTeacherId', value)}
              options={teacherOptions}
              placeholder="Search for the teacher to replace..."
              icon="🎓"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Which teacher's classes will be covered?
            </p>
          </div>
        </div>

        {/* Date Selection Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📅</span>
            <h4 className="font-semibold text-slate-800 dark:text-white">Assignment Period</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="startDate" 
                id="startDate" 
                value={formData.startDate} 
                onChange={onInputChange} 
                className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all" 
                required 
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                First day of substitution
              </p>
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="endDate" 
                id="endDate" 
                value={formData.endDate} 
                onChange={onInputChange}
                min={formData.startDate}
                className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all" 
                required 
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Last day of substitution
              </p>
            </div>
          </div>
          
          {duration && !formError && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Duration:</span> {duration}
              </p>
            </div>
          )}
        </div>

        {/* Optional Notes Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📝</span>
            <h4 className="font-semibold text-slate-800 dark:text-white">Additional Details (Optional)</h4>
          </div>
          
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Substitution
            </label>
            <select
              name="reason"
              id="reason"
              value={formData.reason || ''}
              onChange={onInputChange}
              className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">Select a reason...</option>
              <option value="sick_leave">Sick Leave</option>
              <option value="vacation">Vacation</option>
              <option value="training">Training/Professional Development</option>
              <option value="personal">Personal Leave</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes || ''}
              onChange={onInputChange}
              rows={3}
              placeholder="Any additional notes about this assignment..."
              className="block w-full rounded-lg border-slate-300 dark:border-slate-600 shadow-sm dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Error Display */}
        {formError && (
          <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-2 border-red-200 dark:border-red-800" role="alert">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <span className="font-bold block mb-1">Validation Error</span>
                <span>{formError}</span>
              </div>
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {isFormValid && (
          <div className="p-3 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span className="font-medium">Form is ready to submit!</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={!isFormValid}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isEdit ? '💾 Save Changes' : '➕ Add Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

AssignmentFormModal.displayName = 'AssignmentFormModal';

export default AssignmentFormModal;
