/**
 * PaymentRecording - Staff interface for recording student payments
 * 
 * Features:
 * - Student search by name or LRN
 * - Current ledger display
 * - Payment form with multiple payment methods
 * - Receipt generation and preview
 * - Print functionality
 */

import React, { useState, useEffect } from 'react';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import type { Student, StudentLedger, Receipt, AuthUser, PaymentProof } from '../types';
import { 
  getStudentLedger, 
  recordPayment
} from '../src/services/billingService';
import { printReceipt } from '../src/services/receiptPDFGenerator';
import { PrinterIcon } from './icons';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useOnlineStatus, getOfflineMessage } from '../src/services/connectionService';

interface PaymentRecordingProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser; type: 'staff' };
}

type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'maya' | 'card' | 'online';

const PaymentRecording: React.FC<PaymentRecordingProps> = ({ schoolData, session }) => {
  const { students, settings, loading } = schoolData;
  
  // Online status
  const isOnline = useOnlineStatus();
  
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
  
  // Payment proofs state
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);

  const currentSchoolYear = settings.schoolYear || '2024-2025';

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

  // Load student ledger
  const loadLedger = async (student: Student) => {
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
      
      // Load payment proofs for this student
      await loadPaymentProofs(student.id);
    } catch (err) {
      console.error('Error loading ledger:', err);
      setError('Failed to load student ledger');
    } finally {
      setLoadingLedger(false);
    }
  };
  
  // Load payment proofs for student
  const loadPaymentProofs = async (studentId: string) => {
    try {
      setLoadingProofs(true);
      const db = getFirestoreInstance();
      
      const proofsQuery = query(
        collection(db, 'paymentProofs'),
        where('studentId', '==', studentId)
      );
      
      const proofsSnapshot = await getDocs(proofsQuery);
      const proofsData = proofsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentProof[];
      
      // Sort by uploadedAt in memory (newest first)
      proofsData.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      setPaymentProofs(proofsData);
      console.log(`Loaded ${proofsData.length} payment proofs for student ${studentId}`, proofsData);
    } catch (err) {
      console.error('Error loading payment proofs:', err);
    } finally {
      setLoadingProofs(false);
    }
  };

  // Verify payment proof
  const handleVerifyProof = async (proof: PaymentProof) => {
    if (!proof.amount || proof.amount <= 0) {
      alert('Cannot verify: Payment proof has no amount specified.');
      return;
    }

    const shouldRecordPayment = confirm(
      `Verify payment proof for ${formatCurrency(proof.amount)}?\n\n` +
      `This will:\n` +
      `1. Mark the proof as VERIFIED\n` +
      `2. Automatically RECORD the payment in the ledger\n` +
      `3. Update the student's balance\n\n` +
      `Payment Method: ${proof.paymentMethod || 'Not specified'}\n` +
      `Reference: ${proof.referenceNumber || 'None'}\n\n` +
      `Click OK to proceed, Cancel to abort.`
    );

    if (!shouldRecordPayment) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const db = getFirestoreInstance();
      
      // 1. Verify the proof
      const proofRef = doc(db, 'paymentProofs', proof.id);
      await updateDoc(proofRef, {
        status: 'verified',
        verifiedBy: session.user.id,
        verifiedByName: session.user.name || 'Staff',
        verifiedAt: new Date().toISOString()
      });

      // 2. Record the payment automatically
      if (ledger && selectedStudent) {
        // Build payment data according to Payment interface
        // Only include fields with values (no undefined)
        const paymentData: any = {
          date: proof.paymentDate || new Date().toISOString().split('T')[0],
          amount: proof.amount,
          method: (proof.paymentMethod as any) || 'cash',
          notes: `Auto-recorded from verified payment proof (${proof.fileName})`
        };

        // Only add optional fields if they have values
        if (proof.referenceNumber) {
          paymentData.referenceNumber = proof.referenceNumber;
        }

        await recordPayment(
          selectedStudent.id,
          currentSchoolYear,
          paymentData,
          session.user.id,
          session.user.name || 'Staff'
        );

        // Reload ledger to show updated balance
        await loadLedger(selectedStudent);
      }

      setSuccess(`Payment proof verified and ${formatCurrency(proof.amount)} payment recorded successfully!`);
      
      // Reload payment proofs
      if (selectedStudent) {
        await loadPaymentProofs(selectedStudent.id);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error verifying payment proof:', err);
      setError('Failed to verify payment proof and record payment: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessing(false);
    }
  };

  // Reject payment proof
  const handleRejectProof = async (proof: PaymentProof) => {
    const reason = prompt('Enter reason for rejection:');
    
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      const db = getFirestoreInstance();
      const proofRef = doc(db, 'paymentProofs', proof.id);
      
      await updateDoc(proofRef, {
        status: 'rejected',
        verifiedBy: session.user.id,
        verifiedByName: session.user.name || 'Staff',
        verifiedAt: new Date().toISOString(),
        rejectionReason: reason.trim()
      });

      setSuccess('Payment proof rejected');
      
      // Reload payment proofs
      if (selectedStudent) {
        await loadPaymentProofs(selectedStudent.id);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting payment proof:', err);
      setError('Failed to reject payment proof');
    }
  };

  // Reset form
  const resetForm = () => {
    setAmount(0);
    setPaymentMethod('cash');
    setCheckNumber('');
    setBankName('');
    setReferenceNumber('');
    setNotes('');
    setShowPaymentForm(false);
    setGeneratedReceipt(null);
    setShowReceiptPreview(false);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStudent(null);
    setLedger(null);
    setSearchTerm('');
    setSearchResults([]);
    resetForm();
    setError(null);
    setSuccess(null);
  };

  // Handle payment submission
  const handleSubmitPayment = async () => {
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

      // Build payment data
      const paymentData = {
        amount,
        method: paymentMethod,
        date: new Date().toISOString(),
        ...(checkNumber && { checkNumber }),
        ...(bankName && { bankName }),
        ...(referenceNumber && { referenceNumber }),
        receivedBy: session.user.id,
        receivedByName: session.user.name,
        notes: notes || undefined,
        description: `Payment for ${currentSchoolYear}${notes ? ` - ${notes}` : ''}`
      };

      // Record payment and generate receipt
      const receipt = await recordPayment(
        selectedStudent.id,
        currentSchoolYear,
        paymentData as any, // Type cast for now - will be fixed in service
        session.user.id,
        session.user.name
      );

      setGeneratedReceipt(receipt);
      setShowReceiptPreview(true);
      setSuccess(`Payment recorded successfully! Receipt #${receipt.receiptNumber}`);
      
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
  };

  // Print receipt using PDF generator
  const handlePrintReceipt = () => {
    if (generatedReceipt && selectedStudent && schoolData.settings) {
      printReceipt(generatedReceipt, selectedStudent, schoolData.settings);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
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

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{success}</span>
          {generatedReceipt && (
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <PrinterIcon /> Print Receipt
            </button>
          )}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Offline Warning */}
      {!isOnline && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong className="font-medium">Offline Mode - View Only</strong>
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                {getOfflineMessage('PAYMENT')}
              </p>
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
                    LRN: {student.lrn} • Section: {student.sectionId}
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
                  <p>Section: {selectedStudent.sectionId}</p>
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
                            {payment.method.toUpperCase().replace('_', ' ')}
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

          {/* Payment Proofs Section */}
          {selectedStudent && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Uploaded Payment Proofs</h3>
                {loadingProofs && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
              </div>

              {paymentProofs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payment proofs uploaded yet</p>
              ) : (
                <div className="space-y-4">
                  {paymentProofs.map((proof) => (
                    <div key={proof.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">{proof.fileName}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              proof.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              proof.status === 'verified' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {proof.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="font-medium text-gray-700">Upload Date</p>
                              <p>{new Date(proof.uploadedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', month: 'short', day: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                              })}</p>
                            </div>
                            
                            {proof.amount && (
                              <div>
                                <p className="font-medium text-gray-700">Amount</p>
                                <p className="text-green-600 font-semibold">{formatCurrency(proof.amount)}</p>
                              </div>
                            )}
                            
                            {proof.paymentDate && (
                              <div>
                                <p className="font-medium text-gray-700">Payment Date</p>
                                <p>{new Date(proof.paymentDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            
                            {proof.paymentMethod && (
                              <div>
                                <p className="font-medium text-gray-700">Payment Method</p>
                                <p className="capitalize">{proof.paymentMethod}</p>
                              </div>
                            )}
                            
                            {proof.referenceNumber && (
                              <div>
                                <p className="font-medium text-gray-700">Reference Number</p>
                                <p className="font-mono text-xs">{proof.referenceNumber}</p>
                              </div>
                            )}
                          </div>
                          
                          {proof.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                              <p className="font-medium text-gray-700 mb-1">Notes:</p>
                              <p>{proof.notes}</p>
                            </div>
                          )}
                          
                          {proof.status === 'verified' && proof.verifiedByName && (
                            <div className="mt-3 text-sm text-green-600">
                              ✓ Verified by {proof.verifiedByName} on {new Date(proof.verifiedAt!).toLocaleDateString()}
                            </div>
                          )}
                          
                          {proof.status === 'rejected' && proof.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                              <p className="font-medium">Rejected:</p>
                              <p>{proof.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <a
                            href={proof.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors text-center"
                          >
                            View File
                          </a>
                          
                          {proof.status === 'pending' && (
                            <>
                              <button
                                disabled={!isOnline}
                                className={`px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleVerifyProof(proof)}
                              >
                                Verify
                              </button>
                              <button
                                disabled={!isOnline}
                                className={`px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleRejectProof(proof)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  disabled={!isOnline || processing || amount <= 0 || amount > ledger.balance}
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
