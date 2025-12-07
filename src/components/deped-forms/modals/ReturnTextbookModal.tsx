/**
 * ReturnTextbookModal - Modal for marking textbooks as returned
 */

import React, { useState } from 'react';
import { returnTextbook } from '../../../services/textbookDistributionsService';
import type { ReturnTextbookInput, BookCondition, TextbookDistributionWithDetails } from '../../../types/textbookDistributions';

interface ReturnTextbookModalProps {
  distribution: TextbookDistributionWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const ReturnTextbookModal: React.FC<ReturnTextbookModalProps> = ({
  distribution,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [actualReturnDate, setActualReturnDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [conditionReturned, setConditionReturned] = useState<BookCondition>('good');
  const [remarks, setRemarks] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const input: ReturnTextbookInput = {
        distribution_id: distribution.id,
        actual_return_date: actualReturnDate,
        condition_returned: conditionReturned,
        remarks: remarks || undefined,
      };

      const result = await returnTextbook(input);

      if (!result.success) {
        setError(result.error || 'Failed to return textbook');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error returning textbook:', err);
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Return Textbook</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Distribution Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Distribution Details</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Student:</strong> {distribution.student.first_name} {distribution.student.last_name} (LRN: {distribution.student.lrn})
              </p>
              <p>
                <strong>Book:</strong> {distribution.book.title}
              </p>
              <p>
                <strong>Issued:</strong> {new Date(distribution.distributed_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Condition Issued:</strong> {distribution.condition_issued.charAt(0).toUpperCase() + distribution.condition_issued.slice(1)}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Date *
              </label>
              <input
                type="date"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                aria-label="Return date"
              />
            </div>

            {/* Condition Returned */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Returned *
              </label>
              <select
                value={conditionReturned}
                onChange={(e) => setConditionReturned(e.target.value as BookCondition)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                aria-label="Condition returned"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Compare to issued condition: <strong>{distribution.condition_issued}</strong>
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes about the return condition, damages, etc."
                aria-label="Remarks"
              />
            </div>

            {/* Warning for condition downgrade */}
            {conditionReturned === 'damaged' || 
             (conditionReturned === 'poor' && ['excellent', 'good', 'fair'].includes(distribution.condition_issued)) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> Book condition has deteriorated. Consider adding remarks about the damage.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Mark as Returned'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnTextbookModal;
