/**
 * ParentBilling - Billing and payment information for parents
 * 
 * Shows:
 * - Current balance and payment status
 * - Payment history with receipts
 * - Billing statements per quarter
 * - Payment schedule and due dates
 * - Download receipts functionality
 * 
 * IMPORTANT: Parents can only view their own children's billing data.
 * All financial calculations are read-only for parents.
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import type { ParentUser, BillingStatement, Receipt, PaymentProof } from '../types';
import { 
  getStudentLedger, 
  getStudentBillingStatements, 
  getStudentReceipts 
} from '../src/services/billingService';
import { downloadReceipt } from '../src/services/receiptPDFGenerator';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { storage } from '../src/services/firestoreService';
import { useOnlineStatus } from '../src/services/connectionService';
import { DocumentArrowUpIcon, TrashIcon } from './icons';

interface ParentBillingProps {
  schoolData: SchoolDataHook;
  session: { user: ParentUser; type: 'parent' };
  selectedChildId?: string | null;
}

type TabType = 'overview' | 'statements' | 'payments' | 'receipts';

const ParentBilling: React.FC<ParentBillingProps> = ({ 
  schoolData, 
  session, 
  selectedChildId 
}) => {
  const { students, sections } = schoolData;
  const parent = session.user;
  const { schoolId } = useSchoolContext();

  // Online status
  const isOnline = useOnlineStatus();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<{
    balance: number;
    totalCharges: number;
    totalPayments: number;
    status: string;
    dueDate?: string;
    statements: BillingStatement[];
    receipts: Receipt[];
  } | null>(null);
  
  // Payment proof upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadAmount, setUploadAmount] = useState<string>('');
  const [uploadPaymentDate, setUploadPaymentDate] = useState<string>('');
  const [uploadPaymentMethod, setUploadPaymentMethod] = useState<string>('');
  const [uploadReferenceNumber, setUploadReferenceNumber] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);

  // Get linked children
  const linkedChildren = useMemo(() => {
    return students.filter(s => parent.studentIds.includes(s.id));
  }, [students, parent.studentIds]);

  // Get selected student (or first child)
  const selectedStudent = useMemo(() => {
    if (selectedChildId) {
      return linkedChildren.find(s => s.id === selectedChildId);
    }
    return linkedChildren[0];
  }, [linkedChildren, selectedChildId]);

  // Get student section for grade level
  const studentSection = useMemo(() => {
    if (!selectedStudent?.sectionId) return null;
    return sections.find(s => s.id === selectedStudent.sectionId) || null;
  }, [selectedStudent, sections]);

  // Current school year (hardcoded for now, should come from settings)
  const currentSchoolYear = '2024-2025';

  // Load billing data
  useEffect(() => {
    if (!selectedStudent) {
      setLoading(false);
      return;
    }

    const loadBillingData = async () => {
      setLoading(true);
      try {
        // Get student ledger
        const ledger = await getStudentLedger(selectedStudent.id, currentSchoolYear);
        
        if (!ledger) {
          // No billing data yet
          setBillingData({
            balance: 0,
            totalCharges: 0,
            totalPayments: 0,
            status: 'No billing records',
            statements: [],
            receipts: []
          });
          setLoading(false);
          return;
        }

        // Get billing statements
        const statements = await getStudentBillingStatements(
          selectedStudent.id,
          currentSchoolYear
        );

        // Get receipts
        const receipts = await getStudentReceipts(
          selectedStudent.id,
          currentSchoolYear
        );

        setBillingData({
          balance: ledger.balance,
          totalCharges: ledger.totalCharges,
          totalPayments: ledger.totalPayments,
          status: ledger.status,
          dueDate: ledger.dueDate,
          statements,
          receipts
        });
      } catch (error) {
        console.error('[ParentBilling] Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [selectedStudent, currentSchoolYear]);

  // Load payment proofs
  useEffect(() => {
    if (!selectedStudent) return;
    loadPaymentProofs();
  }, [selectedStudent, schoolId]);

  const loadPaymentProofs = async () => {
    if (!selectedStudent || !schoolId) {
      console.warn('[ParentBilling] No selectedStudent or schoolId - skipping payment proofs query');
      return;
    }
    
    setLoadingProofs(true);
    try {
      const db = getFirestoreInstance();
      const proofsQuery = query(
        collection(db, 'paymentProofs'),
        where('schoolId', '==', schoolId),
        where('studentId', '==', selectedStudent.id)
      );
      const proofsSnapshot = await getDocs(proofsQuery);
      const proofsData = proofsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentProof[];
      
      // Sort by upload date (newest first)
      proofsData.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setPaymentProofs(proofsData);
    } catch (error) {
      console.error('Error loading payment proofs:', error);
    } finally {
      setLoadingProofs(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selectedStudent) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const db = getFirestoreInstance();
      
      // Upload file to Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(
        storage,
        `payment-proofs/${selectedStudent.id}/${timestamp}_${selectedFile.name}`
      );
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      // Build document object, only including optional fields if they have values
      const paymentProofData: any = {
        studentId: selectedStudent.id,
        fileName: selectedFile.name,
        fileURL: downloadURL,
        fileType: selectedFile.type as 'image/jpeg' | 'image/png' | 'application/pdf',
        fileSize: selectedFile.size,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
        uploadedBy: parent.id
      };

      // Only add optional fields if they have values
      if (uploadAmount && uploadAmount.trim()) {
        paymentProofData.amount = parseFloat(uploadAmount);
      }
      if (uploadPaymentDate && uploadPaymentDate.trim()) {
        paymentProofData.paymentDate = uploadPaymentDate;
      }
      if (uploadPaymentMethod && uploadPaymentMethod.trim()) {
        paymentProofData.paymentMethod = uploadPaymentMethod;
      }
      if (uploadReferenceNumber && uploadReferenceNumber.trim()) {
        paymentProofData.referenceNumber = uploadReferenceNumber;
      }
      if (uploadNotes && uploadNotes.trim()) {
        paymentProofData.notes = uploadNotes;
      }

      await addDoc(collection(db, 'paymentProofs'), {
        ...paymentProofData,
        schoolId: schoolId || 'default'
      });

      setUploadSuccess('Payment proof uploaded successfully! Staff will verify it soon.');
      
      // Reset form
      setSelectedFile(null);
      setUploadAmount('');
      setUploadPaymentDate('');
      setUploadPaymentMethod('');
      setUploadReferenceNumber('');
      setUploadNotes('');
      
      // Reload proofs
      await loadPaymentProofs();

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      setUploadError('Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProof = async (proof: PaymentProof) => {
    if (!confirm('Are you sure you want to delete this payment proof?')) return;

    try {
      const db = getFirestoreInstance();
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'paymentProofs', proof.id));
      
      // Delete from Storage
      const storageRef = ref(storage, proof.fileURL);
      await deleteObject(storageRef);

      setUploadSuccess('Payment proof deleted successfully');
      await loadPaymentProofs();

      setTimeout(() => setUploadSuccess(null), 2000);
    } catch (error) {
      console.error('Error deleting payment proof:', error);
      setUploadError('Failed to delete payment proof');
      setTimeout(() => setUploadError(null), 3000);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (!selectedStudent) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
          💰 Billing & Payments
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-yellow-800 dark:text-yellow-300">
            No children linked to your account. Please contact the school registrar.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
          💰 Billing & Payments
        </h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        💰 Billing & Payments
      </h1>

      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Offline Mode - Viewing Cached Data</p>
            <p className="text-sm mt-1">You're viewing previously loaded billing information. Upload payment proof requires internet connection.</p>
          </div>
        </div>
      )}

      {/* Student Selector (if multiple children) */}
      {linkedChildren.length > 1 && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Viewing billing for:
          </label>
          <div className="flex flex-wrap gap-2">
            {linkedChildren.map(child => {
              const childSection = sections.find(s => s.id === child.sectionId);
              return (
                <button
                  key={child.id}
                  onClick={() => {
                    // Note: selectedChildId should be managed by parent component
                    // This is just for display
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStudent.id === child.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {child.name}
                  {childSection && (
                    <span className="ml-2 text-xs opacity-75">
                      Grade {childSection.gradeLevel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Student Info Card */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{selectedStudent.name}</h2>
            <p className="text-blue-100">
              {studentSection ? `Grade ${studentSection.gradeLevel} - ${studentSection.name}` : 'No section assigned'}
            </p>
            <p className="text-blue-100 text-sm">
              School Year: {currentSchoolYear}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100 mb-1">Current Balance</p>
            <p className="text-4xl font-bold">
              {billingData ? formatCurrency(billingData.balance) : '₱0.00'}
            </p>
            {billingData && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(billingData.status)}`}>
                {billingData.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            {[
              { id: 'overview' as TabType, label: '📊 Overview', icon: '📊' },
              { id: 'statements' as TabType, label: '📄 Statements', icon: '📄' },
              { id: 'payments' as TabType, label: '💳 Payments', icon: '💳' },
              { id: 'receipts' as TabType, label: '🧾 Receipts', icon: '🧾' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label.split(' ')[1]}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && billingData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Charges</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(billingData.totalCharges)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(billingData.totalPayments)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Balance Due</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(billingData.balance)}
                  </p>
                </div>
              </div>

              {/* Due Date Warning */}
              {billingData.balance > 0 && billingData.dueDate && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">⏰</span>
                    <div>
                      <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Payment Due Date
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-400">
                        {formatDate(billingData.dueDate)}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                        Please settle your balance before the due date to avoid late payment penalties.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  💡 How to Pay
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                  <li className="flex items-start">
                    <span className="mr-2">1️⃣</span>
                    <span>Visit the school cashier during office hours (Mon-Fri, 8AM-5PM)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2️⃣</span>
                    <span>Bring your Official Receipt number for reference</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3️⃣</span>
                    <span>Payment methods: Cash, Check, GCash, Bank Transfer</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4️⃣</span>
                    <span>Ask for official receipt after payment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">5️⃣</span>
                    <span>Upload your payment proof (receipt/screenshot) below for verification</span>
                  </li>
                </ul>
              </div>

              {/* Upload Payment Proof Section */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-800 dark:text-green-300">
                    📤 Upload Payment Proof
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    disabled={!isOnline}
                    className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <DocumentArrowUpIcon />
                    Upload Proof
                  </button>
                </div>
                
                {/* Success/Error Messages */}
                {uploadSuccess && (
                  <div className="mb-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded">
                    {uploadSuccess}
                  </div>
                )}
                {uploadError && (
                  <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded">
                    {uploadError}
                  </div>
                )}

                {/* Uploaded Proofs */}
                {loadingProofs ? (
                  <p className="text-sm text-green-700 dark:text-green-400">Loading payment proofs...</p>
                ) : paymentProofs.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-700 dark:text-green-400 mb-2">Your uploaded payment proofs:</p>
                    {paymentProofs.map(proof => (
                      <div
                        key={proof.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {proof.fileName}
                            </p>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                proof.status === 'verified'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : proof.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}
                            >
                              {proof.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Uploaded: {formatDate(proof.uploadedAt)}
                            {proof.amount && ` • Amount: ${formatCurrency(proof.amount)}`}
                            {proof.referenceNumber && ` • Ref: ${proof.referenceNumber}`}
                          </p>
                          {proof.status === 'verified' && proof.verifiedByName && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              ✓ Verified by {proof.verifiedByName} on {formatDate(proof.verifiedAt!)}
                            </p>
                          )}
                          {proof.status === 'rejected' && proof.rejectionReason && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              ✗ Rejected: {proof.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={proof.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            View
                          </a>
                          {proof.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteProof(proof)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    No payment proofs uploaded yet. Click "Upload Proof" to submit your payment receipt.
                  </p>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Recent Activity
                </h3>
                {billingData.receipts.length > 0 ? (
                  <div className="space-y-2">
                    {billingData.receipts.slice(0, 5).map(receipt => (
                      <div
                        key={receipt.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">💳</span>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              Payment Received
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(receipt.date)} • OR #{receipt.receiptNumber}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(receipt.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                    No payment records yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Statements Tab */}
          {activeTab === 'statements' && billingData && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                View your billing statements for each quarter
              </p>
              {billingData.statements.length > 0 ? (
                billingData.statements.map(statement => (
                  <div
                    key={statement.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {statement.term} Statement
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Generated: {formatDate(statement.generatedAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(statement.status)}`}>
                        {statement.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Subtotal</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(statement.subtotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Balance</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(statement.balance)}
                        </p>
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      📄 View Full Statement
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No billing statements available
                </p>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && billingData && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                History of all payments made for this school year
              </p>
              {billingData.receipts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Receipt #</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {billingData.receipts.map(receipt => (
                        <tr key={receipt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                            {formatDate(receipt.date)}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                            {receipt.receiptNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {receipt.description}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400 text-right">
                            {formatCurrency(receipt.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white text-right">
                            {formatCurrency(receipt.newBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No payment history available
                </p>
              )}
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === 'receipts' && billingData && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Download and print your official receipts
              </p>
              {billingData.receipts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {billingData.receipts.map(receipt => (
                    <div
                      key={receipt.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono font-semibold text-slate-900 dark:text-white">
                            {receipt.receiptNumber}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(receipt.date)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(receipt.status)}`}>
                          {receipt.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {receipt.description}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        {formatCurrency(receipt.amount)}
                      </p>
                      <button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        onClick={() => {
                          const student = students.find(s => s.id === selectedChildId);
                          if (student && schoolData.settings) {
                            downloadReceipt(receipt, student, schoolData.settings);
                          }
                        }}
                      >
                        📥 Download Receipt
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No receipts available for download
                </p>
              )}
            </div>
          )}

          {/* No Data State */}
          {!billingData && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💰</span>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                No Billing Records
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Billing information for {selectedStudent.name} is not yet available.
                <br />
                Please contact the school registrar for more information.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Payment Proof Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Upload Payment Proof
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Upload a photo or screenshot of your payment receipt
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Image/PDF *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Accepted formats: JPG, PNG, PDF (max 5MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  placeholder="e.g., 5000.00"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={uploadPaymentDate}
                  onChange={(e) => setUploadPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={uploadPaymentMethod}
                  onChange={(e) => setUploadPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Online Banking">Online Banking</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={uploadReferenceNumber}
                  onChange={(e) => setUploadReferenceNumber(e.target.value)}
                  placeholder="Transaction/Reference number (if applicable)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Any additional information about this payment"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {uploadError && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded">
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded">
                  {uploadSuccess}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                disabled={uploading}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadProof}
                disabled={!isOnline || !selectedFile || uploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon />
                    Upload Proof
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentBilling;
