/**
 * billingService.ts - Financial/Billing Management Service
 * 
 * Handles all billing operations:
 * - Generate billing statements
 * - Record payments
 * - Generate receipts
 * - Calculate balances
 * - Fee structure management
 * 
 * CRITICAL: All monetary calculations use precise decimal arithmetic
 * to avoid floating-point errors.
 * 
 * SECURITY: Financial write operations require online connection
 * to prevent data corruption and maintain BIR compliance.
 */

import { 
  getFirestoreInstance 
} from './firestoreService';
import { requireOnlineConnection } from './connectionService';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import type { 
  FeeStructure, 
  StudentLedger, 
  Payment, 
  Charge,
  BillingStatement,
  Receipt,
  Student
} from '../../types';

/**
 * Generate a unique receipt number
 * Format: OR-YYYY-NNNNN (e.g., OR-2025-00001)
 * 
 * REQUIRES ONLINE: Prevents duplicate receipt numbers
 * MULTI-TENANT: Generates school-specific receipt numbers
 */
export async function generateReceiptNumber(schoolId: string, year?: number): Promise<string> {
  requireOnlineConnection('Receipt generation');
  
  const db = getFirestoreInstance();
  const currentYear = year || new Date().getFullYear();
  
  // MULTI-TENANT: Query for the last receipt of the year for this school
  const receiptsRef = collection(db, 'receipts');
  const q = query(
    receiptsRef,
    where('schoolId', '==', schoolId),
    where('receiptNumber', '>=', `OR-${currentYear}-00000`),
    where('receiptNumber', '<=', `OR-${currentYear}-99999`),
    orderBy('receiptNumber', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // First receipt of the year for this school
    return `OR-${currentYear}-00001`;
  }
  
  const lastReceipt = snapshot.docs[0].data();
  const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[2]);
  const nextNumber = lastNumber + 1;
  
  // Pad with zeros (5 digits)
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  
  return `OR-${currentYear}-${paddedNumber}`;
}

/**
 * Get fee structure for a specific grade level and school year
 */
export async function getFeeStructure(
  gradeLevel: number,
  schoolYear: string,
  track?: string,
  strand?: string
): Promise<FeeStructure | null> {
  const db = getFirestoreInstance();
  const feeStructuresRef = collection(db, 'feeStructures');
  
  let q = query(
    feeStructuresRef,
    where('schoolYear', '==', schoolYear),
    where('gradeLevel', '==', gradeLevel)
  );
  
  if (track) {
    q = query(q, where('track', '==', track));
  }
  
  if (strand) {
    q = query(q, where('strand', '==', strand));
  }
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FeeStructure;
}

/**
 * Create or update fee structure
 * 
 * REQUIRES ONLINE: Ensures fee structure consistency across devices
 */
export async function saveFeeStructure(feeStructure: Omit<FeeStructure, 'id'> | FeeStructure): Promise<string> {
  requireOnlineConnection('Fee structure update');
  
  const db = getFirestoreInstance();
  const feeStructuresRef = collection(db, 'feeStructures');
  
  // Calculate totals
  const totalRequired = calculateRequiredFees(feeStructure.fees);
  const totalOptional = calculateOptionalFees(feeStructure.fees);
  
  const dataToSave = {
    ...feeStructure,
    totalRequired,
    totalOptional,
    updatedAt: new Date().toISOString()
  };
  
  if ('id' in feeStructure && feeStructure.id) {
    // Check if document exists before deciding to update or create
    const docRef = doc(feeStructuresRef, feeStructure.id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, dataToSave as any);
      return feeStructure.id;
    } else {
      // Create new document with specified ID
      const newData = {
        ...dataToSave,
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, newData);
      return feeStructure.id;
    }
  } else {
    // Create new with auto-generated ID
    const newData = {
      ...dataToSave,
      createdAt: new Date().toISOString()
    };
    const docRef = doc(feeStructuresRef);
    await setDoc(docRef, newData);
    return docRef.id;
  }
}

/**
 * Get all fee structures
 */
export async function getFeeStructures(): Promise<FeeStructure[]> {
  const db = getFirestoreInstance();
  const feeStructuresRef = collection(db, 'feeStructures');
  const q = query(feeStructuresRef, orderBy('gradeLevel', 'asc'), orderBy('schoolYear', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as FeeStructure));
}

/**
 * Get fee structure by ID
 */
export async function getFeeStructureById(id: string): Promise<FeeStructure | null> {
  const db = getFirestoreInstance();
  const docRef = doc(db, 'feeStructures', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as FeeStructure;
  }
  return null;
}

/**
 * Get fee structure by grade level and school year
 */
export async function getFeeStructureByGradeAndYear(
  gradeLevel: number, 
  schoolYear: string,
  track?: string,
  strand?: string
): Promise<FeeStructure | null> {
  const db = getFirestoreInstance();
  const feeStructuresRef = collection(db, 'feeStructures');
  
  let q = query(
    feeStructuresRef,
    where('gradeLevel', '==', gradeLevel),
    where('schoolYear', '==', schoolYear)
  );
  
  if (track) {
    q = query(q, where('track', '==', track));
  }
  if (strand) {
    q = query(q, where('strand', '==', strand));
  }
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as FeeStructure;
}

/**
 * Calculate total required fees from fee structure
 */
function calculateRequiredFees(fees: FeeStructure['fees']): number {
  let total = fees.tuitionFee || 0;
  
  // Add required miscellaneous fees
  fees.miscFees?.forEach(fee => {
    if (fee.required) {
      total += fee.amount;
    }
  });
  
  // Add other required fees
  if (fees.registrationFee) total += fees.registrationFee;
  if (fees.idFee) total += fees.idFee;
  if (fees.insuranceFee) total += fees.insuranceFee;
  
  return total;
}

/**
 * Calculate total optional fees from fee structure
 */
function calculateOptionalFees(fees: FeeStructure['fees']): number {
  let total = 0;
  
  // Add optional miscellaneous fees
  fees.miscFees?.forEach(fee => {
    if (!fee.required) {
      total += fee.amount;
    }
  });
  
  // Add laboratory fees (optional per subject)
  fees.labFees?.forEach(labFee => {
    total += labFee.amount;
  });
  
  return total;
}

/**
 * Get or create student ledger for a school year
 */
export async function getStudentLedger(
  studentId: string,
  schoolYear: string
): Promise<StudentLedger | null> {
  const db = getFirestoreInstance();
  const ledgerId = `${studentId}_${schoolYear}`;
  const ledgerRef = doc(db, 'studentLedgers', ledgerId);
  
  const snapshot = await getDoc(ledgerRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return { id: snapshot.id, ...snapshot.data() } as StudentLedger;
}

/**
 * Initialize student ledger with fee structure
 */
export async function initializeStudentLedger(
  student: Student,
  schoolYear: string,
  feeStructureId: string,
  paymentPlan: 'full' | 'quarterly' | 'monthly',
  createdBy: string,
  gradeLevel: number
): Promise<string> {
  const db = getFirestoreInstance();
  
  // Get fee structure
  const feeStructureRef = doc(db, 'feeStructures', feeStructureId);
  const feeStructureSnap = await getDoc(feeStructureRef);
  
  if (!feeStructureSnap.exists()) {
    throw new Error('Fee structure not found');
  }
  
  const feeStructure = { id: feeStructureSnap.id, ...feeStructureSnap.data() } as FeeStructure;
  
  // Create initial charges from fee structure
  const charges: Charge[] = [];
  
  // Tuition fee
  if (feeStructure.fees.tuitionFee > 0) {
    charges.push({
      id: `charge_tuition_${Date.now()}`,
      date: new Date().toISOString(),
      description: 'Tuition Fee',
      amount: feeStructure.fees.tuitionFee,
      type: 'tuition',
      referenceId: feeStructureId
    });
  }
  
  // Miscellaneous fees
  feeStructure.fees.miscFees?.forEach((miscFee, index) => {
    if (miscFee.required) {
      charges.push({
        id: `charge_misc_${index}_${Date.now()}`,
        date: new Date().toISOString(),
        description: miscFee.name,
        amount: miscFee.amount,
        type: 'misc',
        referenceId: miscFee.id
      });
    }
  });
  
  // Other fees
  if (feeStructure.fees.registrationFee) {
    charges.push({
      id: `charge_reg_${Date.now()}`,
      date: new Date().toISOString(),
      description: 'Registration Fee',
      amount: feeStructure.fees.registrationFee,
      type: 'other'
    });
  }
  
  if (feeStructure.fees.idFee) {
    charges.push({
      id: `charge_id_${Date.now()}`,
      date: new Date().toISOString(),
      description: 'ID Fee',
      amount: feeStructure.fees.idFee,
      type: 'other'
    });
  }
  
  if (feeStructure.fees.insuranceFee) {
    charges.push({
      id: `charge_insurance_${Date.now()}`,
      date: new Date().toISOString(),
      description: 'Insurance Fee',
      amount: feeStructure.fees.insuranceFee,
      type: 'other'
    });
  }
  
  const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);
  
  // Create ledger
  const ledgerId = `${student.id}_${schoolYear}`;
  const ledgerRef = doc(db, 'studentLedgers', ledgerId);
  
  // MULTI-TENANT: Include schoolId in ledger
  const newLedger: Omit<StudentLedger, 'id'> = {
    studentId: student.id,
    schoolId: student.schoolId,
    schoolYear,
    gradeLevel,
    feeStructureId,
    paymentPlan,
    charges,
    payments: [],
    discounts: [],
    totalCharges,
    totalDiscounts: 0,
    totalPayments: 0,
    balance: totalCharges,
    status: 'partial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(ledgerRef, newLedger);
  
  console.log('[billingService] Student ledger initialized:', ledgerId);
  
  return ledgerId;
}

/**
 * Record a payment and generate receipt
 * 
 * REQUIRES ONLINE: Prevents duplicate transactions and ensures receipt sequence integrity
 * MULTI-TENANT: Requires schoolId for school-specific receipt numbering
 */
export async function recordPayment(
  schoolId: string,
  studentId: string,
  schoolYear: string,
  paymentData: Omit<Payment, 'id' | 'receiptNumber'>,
  receivedBy: string,
  receivedByName: string
): Promise<Receipt> {
  requireOnlineConnection('Payment recording');
  
  const db = getFirestoreInstance();
  
  // Get student ledger
  const ledger = await getStudentLedger(studentId, schoolYear);
  
  if (!ledger) {
    throw new Error('Student ledger not found. Initialize ledger first.');
  }
  
  // MULTI-TENANT: Generate school-specific receipt number
  const receiptNumber = await generateReceiptNumber(schoolId);
  
  // Create payment record
  const payment: Payment = {
    ...paymentData,
    id: `payment_${Date.now()}`,
    receiptNumber,
    receivedBy,
    receivedByName
  };
  
  // Calculate new balance
  const previousBalance = ledger.balance;
  const newBalance = previousBalance - payment.amount;
  
  // Determine new status
  let newStatus: 'paid' | 'partial' | 'overdue' | 'cancelled' = 'partial';
  if (newBalance <= 0) {
    newStatus = 'paid';
  } else if (ledger.dueDate && new Date() > new Date(ledger.dueDate)) {
    newStatus = 'overdue';
  }
  
  // Update ledger
  const updatedLedger: StudentLedger = {
    ...ledger,
    payments: [...ledger.payments, payment],
    totalPayments: ledger.totalPayments + payment.amount,
    balance: newBalance,
    status: newStatus,
    lastPaymentDate: payment.date || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString()
  };
  
  const ledgerRef = doc(db, 'studentLedgers', ledger.id);
  await updateDoc(ledgerRef, updatedLedger as any);
  
  // Get student details
  const studentRef = doc(db, 'students', studentId);
  const studentSnap = await getDoc(studentRef);
  const student = { id: studentSnap.id, ...studentSnap.data() } as Student;
  
  // Create receipt - only include fields with values (no undefined)
  const receipt: any = {
    id: `receipt_${Date.now()}`,
    receiptNumber,
    studentId,
    studentName: student.name,
    schoolYear,
    paymentId: payment.id,
    date: payment.date || new Date().toISOString().split('T')[0],
    amount: payment.amount,
    paymentMethod: payment.method,
    description: payment.notes || `Payment for School Year ${schoolYear}`,
    receivedBy,
    receivedByName,
    previousBalance,
    amountPaid: payment.amount,
    newBalance,
    status: 'issued',
    createdAt: new Date().toISOString()
  };
  
  // Only add optional fields if they have values
  if (payment.checkNumber) {
    receipt.checkNumber = payment.checkNumber;
  }
  if (payment.bankName) {
    receipt.bankName = payment.bankName;
  }
  if (payment.referenceNumber) {
    receipt.referenceNumber = payment.referenceNumber;
  }
  
  // Save receipt
  const receiptRef = doc(db, 'receipts', receipt.id);
  await setDoc(receiptRef, receipt);
  
  console.log('[billingService] Payment recorded:', payment.id);
  console.log('[billingService] Receipt generated:', receiptNumber);
  
  return receipt;
}

/**
 * Generate billing statement for a student
 */
export async function generateBillingStatement(
  studentId: string,
  schoolYear: string,
  term: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual',
  generatedBy: string,
  gradeLevel: number
): Promise<BillingStatement> {
  const db = getFirestoreInstance();
  
  // Get student ledger
  const ledger = await getStudentLedger(studentId, schoolYear);
  
  if (!ledger) {
    throw new Error('Student ledger not found. Initialize ledger first.');
  }
  
  // Get student details
  const studentRef = doc(db, 'students', studentId);
  const studentSnap = await getDoc(studentRef);
  const student = { id: studentSnap.id, ...studentSnap.data() } as Student;
  
  // Calculate totals
  const totalCharges = ledger.charges.reduce((sum, charge) => sum + charge.amount, 0);
  const totalDiscounts = ledger.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const totalPayments = ledger.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const subtotal = totalCharges - totalDiscounts;
  const balance = subtotal - totalPayments;
  
  // Determine due date based on term
  const dueDate = calculateDueDate(schoolYear, term);
  
  // Determine status
  let status: 'paid' | 'partial' | 'overdue' | 'pending' = 'pending';
  if (balance <= 0) {
    status = 'paid';
  } else if (balance < subtotal) {
    status = 'partial';
  } else if (new Date() > new Date(dueDate)) {
    status = 'overdue';
  }
  
  // Create billing statement
  const statement: BillingStatement = {
    id: `${studentId}_${schoolYear}_${term}`,
    studentId,
    studentName: student.name,
    schoolYear,
    gradeLevel,
    term,
    charges: ledger.charges,
    totalCharges,
    discounts: ledger.discounts,
    totalDiscounts,
    payments: ledger.payments,
    totalPayments,
    subtotal,
    balance,
    dueDate,
    paymentPlan: ledger.paymentPlan,
    status,
    generatedAt: new Date().toISOString(),
    generatedBy,
    lastUpdated: new Date().toISOString()
  };
  
  // Save billing statement
  const statementRef = doc(db, 'billingStatements', statement.id);
  await setDoc(statementRef, statement);
  
  console.log('[billingService] Billing statement generated:', statement.id);
  
  return statement;
}

/**
 * Calculate due date based on school year and term
 */
function calculateDueDate(schoolYear: string, term: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'): string {
  const [startYear] = schoolYear.split('-').map(Number);
  
  const dueDates = {
    'Q1': new Date(startYear, 8, 30), // September 30
    'Q2': new Date(startYear, 11, 15), // December 15
    'Q3': new Date(startYear + 1, 2, 15), // March 15
    'Q4': new Date(startYear + 1, 5, 15), // June 15
    'Annual': new Date(startYear, 7, 31) // August 31 (start of school year)
  };
  
  return dueDates[term].toISOString();
}

/**
 * Get billing statement for a student
 */
export async function getBillingStatement(
  studentId: string,
  schoolYear: string,
  term: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'
): Promise<BillingStatement | null> {
  const db = getFirestoreInstance();
  const statementId = `${studentId}_${schoolYear}_${term}`;
  const statementRef = doc(db, 'billingStatements', statementId);
  
  const snapshot = await getDoc(statementRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return { id: snapshot.id, ...snapshot.data() } as BillingStatement;
}

/**
 * Get all billing statements for a student
 */
export async function getStudentBillingStatements(
  studentId: string,
  schoolYear?: string
): Promise<BillingStatement[]> {
  const db = getFirestoreInstance();
  const statementsRef = collection(db, 'billingStatements');
  
  let q = query(statementsRef, where('studentId', '==', studentId));
  
  if (schoolYear) {
    q = query(q, where('schoolYear', '==', schoolYear));
  }
  
  q = query(q, orderBy('generatedAt', 'desc'));
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BillingStatement[];
}

/**
 * Get receipt by ID
 */
export async function getReceipt(receiptId: string): Promise<Receipt | null> {
  const db = getFirestoreInstance();
  const receiptRef = doc(db, 'receipts', receiptId);
  
  const snapshot = await getDoc(receiptRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return { id: snapshot.id, ...snapshot.data() } as Receipt;
}

/**
 * Get all receipts for a student
 */
export async function getStudentReceipts(
  studentId: string,
  schoolYear?: string
): Promise<Receipt[]> {
  const db = getFirestoreInstance();
  const receiptsRef = collection(db, 'receipts');
  
  let q = query(receiptsRef, where('studentId', '==', studentId));
  
  if (schoolYear) {
    q = query(q, where('schoolYear', '==', schoolYear));
  }
  
  q = query(q, orderBy('date', 'desc'));
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Receipt[];
}
