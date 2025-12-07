/**
 * MarkLostModal - Modal for marking textbooks as lost or damaged
 */

import React, { useState } from 'react';
import { markTextbookLost } from '../../../services/textbookDistributionsService';
import type { MarkTextbookLostInput, TextbookDistributionWithDetails } from '../../../types/textbookDistributions';

interface MarkLostModalProps {
  distribution: TextbookDistributionWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const MarkLostModal: React.FC<MarkLostModalProps> = ({
  distribution,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amountCharged, setAmountCharged] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(amountCharged);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const input: MarkTextbookLostInput = {
        distribution_id: distribution.id,
        amount_charged: amount,
        remarks: remarks || undefined,
      };

      const result = await markTextbookLost(input);

      if (!result.success) {
        setError(result.error || 'Failed to mark textbook as lost');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error marking textbook as lost:', err);
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
            <h2 className="text-2xl font-bold text-gray-900">Mark Textbook Lost/Damaged</h2>
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2">Distribution Details</h3>
            <div className="text-sm text-red-800 space-y-1">
              <p>
                <strong>Student:</strong> {distribution.student.first_name} {distribution.student.last_name} (LRN: {distribution.student.lrn})
              </p>
              <p>
                <strong>Book:</strong> {distribution.book.title}
              </p>
              <p>
                <strong>Book Number:</strong> {distribution.book.book_number}
              </p>
              <p>
                <strong>Issued:</strong> {new Date(distribution.distributed_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Condition Issued:</strong> {distribution.condition_issued.charAt(0).toUpperCase() + distribution.condition_issued.slice(1)}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Important:</strong> Marking this textbook as lost/damaged will record a charge to the student. This action cannot be easily undone.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Charged */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Charge (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountCharged}
                onChange={(e) => setAmountCharged(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                aria-label="Amount to charge"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the replacement cost or damage charge for this textbook.
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks *
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the circumstances (lost, damaged, stolen, etc.) and any additional details..."
                aria-label="Remarks"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required: Explain why the textbook is being marked as lost/damaged.
              </p>
            </div>

            {/* Summary */}
            {amountCharged && parseFloat(amountCharged) > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Charge Summary</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Student Responsible:</strong> {distribution.student.first_name} {distribution.student.last_name}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₱{parseFloat(amountCharged).toFixed(2)}
                  </p>
                  <p>
                    <strong>Payment Status:</strong> Unpaid (default)
                  </p>
                </div>
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Mark as Lost/Damaged'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarkLostModal;
