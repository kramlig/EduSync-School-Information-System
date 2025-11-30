/**
 * PaymentRecording - PostgreSQL-backed Payment Recording System
 * 
 * Features:
 * - Student search by name, LRN, or ID with section name display
 * - Real-time ledger display with current balance
 * - Multiple payment methods (cash, check, bank transfer, e-wallets)
 * - BIR-compliant official receipt generation with auto-numbering
 * - Receipt preview and print functionality (PDF generator)
 * 
 * Migration Status: ✅ Fully migrated to PostgreSQL (Nov 2025)
 * Database: Supabase PostgreSQL with automatic receipt numbering
 * 
 * Performance Optimizations:
 * - useCallback: loadLedger, resetForm, clearSelection, handleSubmitPayment, handlePrintReceipt, formatCurrency, formatDate
 * - useMemo: currentSchoolYear, paymentMethods
 * - Removed all Firestore dependencies and offline features
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import type { Student, StudentLedger, Receipt, AuthUser } from '../types';
import { 
  getStudentLedger, 
  recordPayment
} from '../src/services/billingServicePostgreSQL';
import { printReceipt } from '../src/services/receiptPDFGenerator';
import { PrinterIcon } from './icons';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';

interface PaymentRecordingProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser; type: 'staff' };
}

type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'maya' | 'card' | 'online';

const PaymentRecording: React.FC<PaymentRecordingProps> = ({ schoolData, session }) => {
  const { settings, loading } = schoolData;
  const { schoolId } = useSchoolContext();
  const { students } = useStudentsPostgreSQL({ schoolId, includeSection: true });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Ledger state
  const [ledger, setLedger] = useState<StudentLedger | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  
  // Payment form state
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  // Memoize to prevent unnecessary recalculations
  const currentSchoolYear = useMemo(() => settings.schoolYear || '2024-2025', [settings.schoolYear]);

  // Memoized payment method options
  const paymentMethods = useMemo<{ value: PaymentMethod; label: string }[]>(() => [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'gcash', label: 'GCash' },
    { value: 'maya', label: 'Maya (PayMaya)' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'online', label: 'Online Payment' }
  ], []);

  // Memoized helper functions
  const formatCurrency = useCallback((amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₱0.00';
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Search students
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = students.filter(student => 
      (student.id?.toLowerCase().includes(term) || false) ||  // Search by ID
      (student.firstName?.toLowerCase().includes(term) || false) ||
      (student.lastName?.toLowerCase().includes(term) || false) ||
      (student.lrn?.toLowerCase().includes(term) || false) ||
      (`${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(term))
    ).slice(0, 10); // Limit to 10 results

    console.log(`Found ${results.length} students matching "${searchTerm}"`, results);
    setSearchResults(results);
  }, [searchTerm, students]);

  // Load student ledger (optimized with useCallback)
  const loadLedger = useCallback(async (student: Student) => {
    try {
      setLoadingLedger(true);
      setError(null);
      setSelectedStudent(student);
      
      const studentLedger = await getStudentLedger(student.id, currentSchoolYear);
      setLedger(studentLedger);
      
      if (!studentLedger) {
        setError('No billing ledger found for this student. Please initialize their ledger first.');
      } else {
        setShowPaymentForm(true);
        // Pre-fill amount with current balance
        setAmount(studentLedger.balance);
      }
    } catch (err) {
      console.error('Error loading ledger:', err);
      setError('Failed to load student ledger');
    } finally {
      setLoadingLedger(false);
    }
  }, [currentSchoolYear]);

  // Reset form (optimized with useCallback)
  // Note: Does NOT clear generatedReceipt - that's cleared when closing success modal
  const resetForm = useCallback(() => {
    setAmount(0);
    setPaymentMethod('cash');
    setCheckNumber('');
    setBankName('');
    setReferenceNumber('');
    setNotes('');
    setShowPaymentForm(false);
    // Don't clear generatedReceipt here - it's needed for the Print button
    // It will be cleared when the success modal is closed
    setShowReceiptPreview(false);
  }, []);

  // Clear selection (optimized with useCallback)
  const clearSelection = useCallback(() => {
    setSelectedStudent(null);
    setLedger(null);
    setSearchTerm('');
    setSearchResults([]);
    resetForm();
    setError(null);
    setSuccess(null);
  }, [resetForm]);

  // Handle payment submission (optimized with useCallback)
  const handleSubmitPayment = useCallback(async () => {
    if (!selectedStudent || !ledger) {
      setError('No student selected');
      return;
    }

    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    if (amount > ledger.balance) {
      setError(`Payment amount cannot exceed balance of ₱${ledger.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      // Record payment and generate receipt
      const receipt = await recordPayment(
        schoolId,
        selectedStudent.id,
        currentSchoolYear,
        amount,
        paymentMethod,
        session.user.id,
        {
          checkNumber,
          referenceNumber,
          notes,
          paymentDate: new Date().toISOString().split('T')[0]
        }
      );

      setGeneratedReceipt(receipt);
      setShowReceiptPreview(true);
      setSuccess(`Payment recorded successfully! Receipt #${receipt.receiptNumber}`);
      
      console.log('[PaymentRecording] Receipt generated:', receipt);
      
      // Reload ledger
      const updatedLedger = await getStudentLedger(selectedStudent.id, currentSchoolYear);
      setLedger(updatedLedger);
      
      // Clear form but keep student selected
      resetForm();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Failed to record payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [selectedStudent, ledger, amount, schoolId, currentSchoolYear, paymentMethod, session.user.id, checkNumber, referenceNumber, notes, resetForm]);

  // Print receipt using PDF generator (optimized with useCallback)
  const handlePrintReceipt = useCallback(() => {
    if (generatedReceipt && selectedStudent && schoolData.settings) {
      printReceipt(generatedReceipt, selectedStudent, schoolData.settings);
    }
  }, [generatedReceipt, selectedStudent, schoolData.settings]);

  if (loading || !schoolId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Recording</h1>
        <p className="text-gray-600 mt-2">Record student payments and generate official receipts</p>
      </div>

      {/* Success Modal - Improved UX: Non-dismissible backdrop, prominent Print button */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              {/* Success Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Recorded Successfully!</h3>
                <p className="text-gray-600 text-lg">
                  {success}
                </p>
                {generatedReceipt && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Official Receipt Number</p>
                    <p className="text-2xl font-bold text-blue-600">{generatedReceipt.receiptNumber}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Print is PRIMARY, Done is SECONDARY */}
              <div className="flex flex-col gap-3">
                {generatedReceipt && (
                  <button
                    onClick={handlePrintReceipt}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-lg hover:shadow-xl"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print/Download Receipt
                  </button>
                )}
                <button
                  onClick={() => { setSuccess(null); setGeneratedReceipt(null); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  {generatedReceipt ? 'Skip Print (Close)' : 'Close'}
                </button>
              </div>

              {/* Helper Text */}
              {generatedReceipt && (
                <p className="mt-4 text-xs text-center text-gray-500">
                  💡 Tip: In the print dialog, choose "Save as PDF" to download the receipt
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setError(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Error</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    {error}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Search */}
      {!selectedStudent && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search Student</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name or LRN
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter student name or LRN..."
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded max-h-96 overflow-y-auto">
              {searchResults.map((student) => (
                <button
                  key={student.id}
                  onClick={() => loadLedger(student)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    LRN: {student.lrn}{student.sectionName ? ` • Section: ${student.sectionName}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching "{searchTerm}"
            </div>
          )}

          {searchTerm.length < 2 && (
            <div className="text-center py-8 text-gray-500">
              Enter at least 2 characters to search
            </div>
          )}
        </div>
      )}

      {/* Selected Student & Ledger */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <div className="space-y-1 text-blue-100">
                  <p>LRN: {selectedStudent.lrn}</p>
                  {selectedStudent.sectionName && <p>Section: {selectedStudent.sectionName}</p>}
                  <p>School Year: {currentSchoolYear}</p>
                </div>
              </div>
              <button
                onClick={clearSelection}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded transition-colors"
              >
                ✕ Clear
              </button>
            </div>

            {ledger && (
              <div className="mt-6 pt-6 border-t border-white border-opacity-30">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-100">Total Charges</p>
                    <p className="text-2xl font-bold">{formatCurrency(ledger.charges.reduce((sum, c) => sum + c.amount, 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Total Payments</p>
                    <p className="text-2xl font-bold">{formatCurrency(ledger.payments.reduce((sum, p) => sum + p.amount, 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Current Balance</p>
                    <p className="text-3xl font-bold">{formatCurrency(ledger.balance)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loadingLedger && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Ledger Details */}
          {ledger && !loadingLedger && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Charges Breakdown */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Charges Breakdown</h3>
                <div className="space-y-3">
                  {ledger.charges.map((charge) => (
                    <div key={charge.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{charge.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(charge.date)}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(charge.amount)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 font-bold text-lg">
                    <span>Total Charges</span>
                    <span className="text-blue-600">{formatCurrency(ledger.charges.reduce((sum, c) => sum + c.amount, 0))}</span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
                {ledger.payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No payments recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {ledger.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.method ? payment.method.toUpperCase().replace('_', ' ') : 'CASH'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 font-bold text-lg">
                      <span>Total Paid</span>
                      <span className="text-green-600">{formatCurrency(ledger.payments.reduce((sum, p) => sum + p.amount, 0))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && ledger && ledger.balance > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Record New Payment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (₱) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max={ledger.balance}
                    step="0.01"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Balance: {formatCurrency(ledger.balance)}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="gcash">GCash</option>
                    <option value="maya">Maya</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {paymentMethod === 'check' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check Number
                      </label>
                      <input
                        type="text"
                        value={checkNumber}
                        onChange={(e) => setCheckNumber(e.target.value)}
                        placeholder="Enter check number"
                        className="w-full border border-gray-300 rounded px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter bank name"
                        className="w-full border border-gray-300 rounded px-4 py-2"
                      />
                    </div>
                  </>
                )}

                {(paymentMethod === 'bank_transfer' || paymentMethod === 'gcash' || 
                  paymentMethod === 'maya' || paymentMethod === 'online') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter reference number"
                      className="w-full border border-gray-300 rounded px-4 py-2"
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or description..."
                    rows={3}
                    className="w-full border border-gray-300 rounded px-4 py-2"
                  />
                </div>
              </div>

              {/* Payment Preview */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Balance:</span>
                    <span className="font-semibold">{formatCurrency(ledger.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="font-semibold text-green-600">-{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-bold text-gray-900">New Balance:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(Math.max(0, ledger.balance - amount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleSubmitPayment}
                  disabled={processing || amount <= 0 || amount > ledger.balance}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Processing...' : 'Record Payment & Generate Receipt'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Balance Fully Paid Message */}
          {ledger && ledger.balance === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">✓</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Balance Fully Paid</h3>
              <p className="text-green-700">
                This student has no outstanding balance for {currentSchoolYear}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && generatedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Official Receipt</h2>
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Receipt Content */}
              <div className="border-2 border-gray-300 rounded-lg p-8 mb-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">{settings.schoolName || 'School Name'}</h3>
                  <p className="text-sm text-gray-600">School Address</p>
                  <p className="text-sm text-gray-600">Official Receipt</p>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Receipt No.:</p>
                      <p className="font-bold text-lg">{generatedReceipt.receiptNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date:</p>
                      <p className="font-semibold">{formatDate(generatedReceipt.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Received from:</span>
                    <span className="font-semibold">{generatedReceipt.studentName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(generatedReceipt.amount)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Payment for:</span>
                    <span>{generatedReceipt.description}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Payment Method:</span>
                    <span className="uppercase">CASH</span>
                  </div>
                  {generatedReceipt.referenceNumber && (
                    <div className="flex">
                      <span className="w-32 text-gray-600">Reference No.:</span>
                      <span>{generatedReceipt.referenceNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6 pt-4 border-t border-gray-300">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Previous Balance:</p>
                      <p className="font-semibold">{formatCurrency(generatedReceipt.previousBalance)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Amount Paid:</p>
                      <p className="font-semibold text-green-600">{formatCurrency(generatedReceipt.amountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">New Balance:</p>
                      <p className="font-bold text-lg">{formatCurrency(generatedReceipt.newBalance)}</p>
                    </div>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-gray-600">Received by:</p>
                  <p className="font-semibold">{generatedReceipt.receivedByName}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  <p>This serves as your official receipt</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <PrinterIcon /> Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRecording;
