/**
 * billingServicePostgreSQL.ts - PostgreSQL Financial/Billing Service
 * 
 * Migrated from Firestore to PostgreSQL/Supabase
 * 
 * Handles all billing operations:
 * - Generate billing statements
 * - Record payments with BIR-compliant receipts
 * - Calculate balances with precise decimal arithmetic
 * - Fee structure management
 * 
 * CRITICAL: All monetary calculations use PostgreSQL's DECIMAL type
 * to avoid floating-point errors.
 * 
 * BIR COMPLIANCE: Receipt numbering follows OR-YYYY-NNNNN format
 * with sequential numbering per school per year.
 */

import { supabase } from '../lib/supabase';

// ==========================================
// TYPES
// ==========================================

export interface FeeStructure {
  id: string;
  schoolId: string;
  gradeLevel: number;
  schoolYear: string;
  track?: string;
  strand?: string;
  tuitionAmount: number;
  registrationFee: number;
  idFee: number;
  insuranceFee: number;
  miscFees: MiscFee[];
  labFees: LabFee[];
  fullPaymentDiscount: number;
  quarterlyDiscount: number;
  monthlyDiscount: number;
  allowInstallments: boolean;
  installmentPlans: InstallmentPlan[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  totalRequired?: number;
  totalOptional?: number;
  paymentOptions?: {
    fullPayment: { enabled: boolean; discount: number };
    quarterly: { enabled: boolean; numberOfPayments: number };
    monthly: { enabled: boolean; numberOfPayments: number };
  };
}

export interface MiscFee {
  id: string;
  name: string;
  amount: number;
  required: boolean;
  description?: string;
}

export interface LabFee {
  subject: string;
  amount: number;
}

export interface InstallmentPlan {
  name: string;
  payments: number;
  description?: string;
}

export interface StudentLedger {
  id: string;
  schoolId: string;
  studentId: string;
  schoolYear: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  charges: Charge[];
  payments: LedgerPayment[];
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overdue';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Charge {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface LedgerPayment {
  id: string;
  date: string;
  amount: number;
  receiptNumber: string;
  paymentMethod: string;
}

export interface Receipt {
  id: string;
  schoolId?: string;
  receiptNumber: string;
  studentId: string;
  studentName?: string;
  schoolYear?: string;
  paymentId?: string;
  paymentDate?: string;
  date?: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'maya' | 'card' | 'online';
  checkNumber?: string;
  bankName?: string;
  referenceNumber?: string;
  description?: string;
  notes?: string;
  receivedBy?: string;
  receivedByName?: string;
  previousBalance?: number;
  amountPaid?: number;
  newBalance?: number;
  schoolInfo?: any;
  issuedBy?: string;
  isVoided: boolean;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingStatement {
  id: string;
  schoolId: string;
  studentId: string;
  schoolYear: string;
  statementDate: string;
  previousBalance: number;
  newCharges: number;
  paymentsReceived: number;
  currentBalance: number;
  lineItems: any[];
  dueDate?: string;
  minimumPayment?: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid';
  sentAt?: string;
  viewedAt?: string;
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// FEE STRUCTURES
// ==========================================

/**
 * Get fee structure by grade level and school year
 */
export async function getFeeStructureByGradeAndYear(
  schoolId: string,
  gradeLevel: number,
  schoolYear: string,
  track?: string,
  strand?: string
): Promise<FeeStructure | null> {
  try {
    let query = supabase
      .from('fee_structures')
      .select('*')
      .eq('school_id', schoolId)
      .eq('grade_level', gradeLevel)
      .eq('school_year', schoolYear)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (track) {
      query = query.eq('track', track);
    }
    if (strand) {
      query = query.eq('strand', strand);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return transformFeeStructure(data);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get fee structure error:', err);
    throw err;
  }
}

/**
 * Get all fee structures for a school
 */
export async function getFeeStructures(schoolId: string): Promise<FeeStructure[]> {
  try {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('grade_level', { ascending: true })
      .order('school_year', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformFeeStructure);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get fee structures error:', err);
    throw err;
  }
}

/**
 * Get fee structure by ID
 */
export async function getFeeStructureById(id: string): Promise<FeeStructure | null> {
  try {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return transformFeeStructure(data);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get fee structure by ID error:', err);
    throw err;
  }
}

/**
 * Save (create or update) fee structure
 */
export async function saveFeeStructure(
  feeStructure: Partial<FeeStructure> & { schoolId: string }
): Promise<string> {
  try {
    const dataToSave = {
      school_id: feeStructure.schoolId,
      grade_level: feeStructure.gradeLevel,
      school_year: feeStructure.schoolYear,
      track: feeStructure.track,
      strand: feeStructure.strand,
      tuition_amount: feeStructure.tuitionAmount,
      registration_fee: feeStructure.registrationFee,
      id_fee: feeStructure.idFee,
      insurance_fee: feeStructure.insuranceFee,
      misc_fees: feeStructure.miscFees,
      lab_fees: feeStructure.labFees,
      full_payment_discount: feeStructure.fullPaymentDiscount,
      quarterly_discount: feeStructure.quarterlyDiscount,
      monthly_discount: feeStructure.monthlyDiscount,
      allow_installments: feeStructure.allowInstallments,
      installment_plans: feeStructure.installmentPlans,
      is_active: feeStructure.isActive !== false,
      created_by: feeStructure.createdBy
    };

    if (feeStructure.id) {
      // Update existing
      const { error } = await supabase
        .from('fee_structures')
        .update(dataToSave)
        .eq('id', feeStructure.id);

      if (error) throw error;
      return feeStructure.id;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('fee_structures')
        .insert([dataToSave])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    }
  } catch (err) {
    console.error('[billingServicePostgreSQL] Save fee structure error:', err);
    throw err;
  }
}

// ==========================================
// STUDENT LEDGERS
// ==========================================

/**
 * Get or create student ledger for a school year
 */
export async function getStudentLedger(
  studentId: string,
  schoolYear: string
): Promise<StudentLedger | null> {
  try {
    const { data, error } = await supabase
      .from('student_ledgers')
      .select('id, school_id, student_id, school_year, total_charges, total_payments, balance, charges, payments, payment_status, last_payment_date, last_payment_amount, notes, created_at, updated_at')
      .eq('student_id', studentId)
      .eq('school_year', schoolYear)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return transformStudentLedger(data);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get student ledger error:', err);
    throw err;
  }
}

/**
 * Initialize student ledger with fee structure
 */
export async function initializeStudentLedger(
  schoolId: string,
  studentId: string,
  schoolYear: string,
  feeStructureId: string,
  _gradeLevel: number
): Promise<string> {
  try {
    // Get fee structure
    const feeStructure = await getFeeStructureById(feeStructureId);
    if (!feeStructure) {
      throw new Error('Fee structure not found');
    }

    // Create initial charges
    const charges: Charge[] = [];
    const timestamp = new Date().toISOString();

    // Tuition
    if (feeStructure.tuitionAmount > 0) {
      charges.push({
        id: `charge_tuition_${Date.now()}`,
        date: timestamp.split('T')[0],
        description: 'Tuition Fee',
        amount: feeStructure.tuitionAmount,
        category: 'tuition'
      });
    }

    // Registration
    if (feeStructure.registrationFee > 0) {
      charges.push({
        id: `charge_reg_${Date.now()}`,
        date: timestamp.split('T')[0],
        description: 'Registration Fee',
        amount: feeStructure.registrationFee,
        category: 'registration'
      });
    }

    // ID Fee
    if (feeStructure.idFee > 0) {
      charges.push({
        id: `charge_id_${Date.now()}`,
        date: timestamp.split('T')[0],
        description: 'ID Fee',
        amount: feeStructure.idFee,
        category: 'other'
      });
    }

    // Insurance
    if (feeStructure.insuranceFee > 0) {
      charges.push({
        id: `charge_insurance_${Date.now()}`,
        date: timestamp.split('T')[0],
        description: 'Insurance Fee',
        amount: feeStructure.insuranceFee,
        category: 'other'
      });
    }

    // Required misc fees
    feeStructure.miscFees?.forEach((miscFee, index) => {
      if (miscFee.required) {
        charges.push({
          id: `charge_misc_${index}_${Date.now()}`,
          date: timestamp.split('T')[0],
          description: miscFee.name,
          amount: miscFee.amount,
          category: 'misc'
        });
      }
    });

    const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);

    // Create ledger
    const { data, error } = await supabase
      .from('student_ledgers')
      .insert([{
        school_id: schoolId,
        student_id: studentId,
        school_year: schoolYear,
        total_charges: totalCharges,
        total_payments: 0,
        balance: totalCharges,
        charges,
        payments: [],
        payment_status: 'unpaid'
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('[billingServicePostgreSQL] Student ledger initialized:', data.id);
    return data.id;
  } catch (err) {
    console.error('[billingServicePostgreSQL] Initialize ledger error:', err);
    throw err;
  }
}

/**
 * Add a charge to student ledger
 */
export async function addCharge(
  ledgerId: string,
  charge: Charge
): Promise<void> {
  try {
    // Get current ledger
    const { data: currentLedger, error: fetchError } = await supabase
      .from('student_ledgers')
      .select('charges, total_charges, total_payments')
      .eq('id', ledgerId)
      .single();

    if (fetchError) throw fetchError;

    const charges = [...(currentLedger.charges || []), charge];
    const totalCharges = parseFloat(currentLedger.total_charges) + charge.amount;
    const balance = totalCharges - parseFloat(currentLedger.total_payments || 0);

    const { error: updateError } = await supabase
      .from('student_ledgers')
      .update({
        charges,
        total_charges: totalCharges,
        balance,
        payment_status: balance <= 0 ? 'paid' : balance < totalCharges ? 'partial' : 'unpaid'
      })
      .eq('id', ledgerId);

    if (updateError) throw updateError;
  } catch (err) {
    console.error('[billingServicePostgreSQL] Add charge error:', err);
    throw err;
  }
}

// ==========================================
// RECEIPTS & PAYMENTS
// ==========================================

/**
 * Generate next receipt number in BIR-compliant format (OR-YYYY-NNNNN)
 */
export async function generateReceiptNumber(schoolId: string, year?: number): Promise<string> {
  try {
    const currentYear = year || new Date().getFullYear();
    const prefix = `OR-${currentYear}-`;

    // Get the last receipt for this year
    const { data, error } = await supabase
      .from('receipts')
      .select('receipt_number')
      .eq('school_id', schoolId)
      .like('receipt_number', `${prefix}%`)
      .order('receipt_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastReceipt = data[0].receipt_number;
      const lastNumber = parseInt(lastReceipt.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    // Pad to 5 digits
    const paddedNumber = nextNumber.toString().padStart(5, '0');
    return `${prefix}${paddedNumber}`;
  } catch (err) {
    console.error('[billingServicePostgreSQL] Generate receipt number error:', err);
    throw err;
  }
}

/**
 * Record a payment and generate receipt
 * 
 * BIR COMPLIANCE: Generates sequential receipt numbers per school
 */
export async function recordPayment(
  schoolId: string,
  studentId: string,
  schoolYear: string,
  amount: number,
  paymentMethod: Receipt['paymentMethod'],
  issuedBy: string,
  options: {
    checkNumber?: string;
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
  } = {}
): Promise<Receipt> {
  try {
    // Get student ledger
    const ledger = await getStudentLedger(studentId, schoolYear);
    if (!ledger) {
      throw new Error('Student ledger not found. Initialize ledger first.');
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(schoolId);
    const paymentDate = options.paymentDate || new Date().toISOString().split('T')[0];

    // Create receipt
    const receiptData: any = {
      school_id: schoolId,
      student_id: studentId,
      ledger_id: ledger.id,
      receipt_number: receiptNumber,
      receipt_date: paymentDate,
      amount,
      payment_method: paymentMethod,
      check_number: options.checkNumber,
      reference_number: options.referenceNumber,
      notes: options.notes,
      status: 'valid'
    };

    // Only include recorded_by if issuedBy is a valid UUID (PostgreSQL user ID)
    // Firebase Auth UIDs are not valid UUIDs and will be rejected
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (issuedBy && uuidRegex.test(issuedBy)) {
      receiptData.recorded_by = issuedBy;
    }
    // Otherwise, leave recorded_by as NULL (allowed by schema)

    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert([receiptData])
      .select()
      .single();

    if (receiptError) throw receiptError;

    // Fetch student info for the receipt
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', studentId)
      .single();

    // Fetch school info for the receipt
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('name, region, division, contact_phone, contact_email, settings')
      .eq('id', schoolId)
      .single();

    if (schoolError) {
      console.warn('[billingServicePostgreSQL] Failed to fetch school info:', schoolError);
    } else {
      console.log('[billingServicePostgreSQL] School info fetched:', school);
    }

    // Enrich receipt with student name, school year, and school info
    // The created_at timestamp will be used for displaying the time
    const enrichedReceipt = {
      ...receipt,
      student_name: student ? `${student.first_name} ${student.last_name}` : 'N/A',
      school_year: schoolYear,
      school_info: school ? {
        name: school.name,
        region: school.region,
        division: school.division,
        district: school.settings?.district || null, // Extract from settings JSONB
        contact_phone: school.contact_phone,
        contact_email: school.contact_email,
        tin: school.settings?.tin || null // Extract from settings JSONB
      } : null
    };

    // Update ledger with payment
    const ledgerPayment: LedgerPayment = {
      id: receipt.id,
      date: paymentDate,
      amount,
      receiptNumber,
      paymentMethod
    };

    const payments = [...ledger.payments, ledgerPayment];
    const totalPayments = ledger.totalPayments + amount;
    const balance = ledger.totalCharges - totalPayments;
    const paymentStatus = balance <= 0 ? 'paid' : balance < ledger.totalCharges ? 'partial' : 'unpaid';

    const { error: updateError } = await supabase
      .from('student_ledgers')
      .update({
        payments,
        total_payments: totalPayments,
        balance,
        payment_status: paymentStatus
      })
      .eq('id', ledger.id);

    if (updateError) throw updateError;

    console.log('[billingServicePostgreSQL] Payment recorded:', receiptNumber);

    return transformReceipt(enrichedReceipt);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Record payment error:', err);
    throw err;
  }
}

/**
 * Void a receipt (BIR compliance - never delete receipts)
 */
/**
 * Void a receipt (for BIR compliance and audit trail)
 * 
 * @param receiptId - Receipt UUID
 * @param firebaseUid - Firebase Auth UID of the user voiding the receipt
 * @param voidReason - Reason for voiding
 */
export async function voidReceipt(
  receiptId: string,
  firebaseUid: string,
  voidReason: string
): Promise<void> {
  try {
    // Option A Architecture: Look up teacher directly by firebase_uid (no users table)
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .is('deleted_at', null)
      .single();

    if (teacherError || !teacher) {
      console.warn('[billingServicePostgreSQL] Teacher not found for firebase_uid:', firebaseUid);
      // Proceed without teacher reference (voided_by can be NULL)
    }

    const { error } = await supabase
      .from('receipts')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: teacher?.id || null, // Use teacher ID, or NULL if not found
        void_reason: voidReason
      })
      .eq('id', receiptId);

    if (error) throw error;

    console.log('[billingServicePostgreSQL] Receipt voided:', receiptId, 'by teacher:', teacher?.id || 'unknown');
  } catch (err) {
    console.error('[billingServicePostgreSQL] Void receipt error:', err);
    throw err;
  }
}

/**
 * Get receipt by ID
 */
export async function getReceipt(receiptId: string): Promise<Receipt | null> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return transformReceipt(data);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get receipt error:', err);
    throw err;
  }
}

/**
 * Get all receipts for a student
 */
export async function getStudentReceipts(
  studentId: string,
  _schoolYear?: string
): Promise<Receipt[]> {
  try {
    let query = supabase
      .from('receipts')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('receipt_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(transformReceipt);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get student receipts error:', err);
    throw err;
  }
}

// ==========================================
// BILLING STATEMENTS
// ==========================================

/**
 * Generate billing statement for a student
 */
export async function generateBillingStatement(
  schoolId: string,
  studentId: string,
  schoolYear: string,
  dueDate?: string
): Promise<BillingStatement> {
  try {
    const ledger = await getStudentLedger(studentId, schoolYear);
    if (!ledger) {
      throw new Error('Student ledger not found');
    }

    const statementDate = new Date().toISOString().split('T')[0];

    const statementData = {
      school_id: schoolId,
      student_id: studentId,
      ledger_id: ledger.id,
      statement_date: statementDate,
      school_year: schoolYear,
      previous_balance: 0,
      new_charges: ledger.totalCharges,
      payments_received: ledger.totalPayments,
      current_balance: ledger.balance,
      line_items: [...ledger.charges, ...ledger.payments],
      due_date: dueDate,
      status: 'sent',
      sent_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('billing_statements')
      .insert([statementData])
      .select()
      .single();

    if (error) throw error;

    return transformBillingStatement(data);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Generate billing statement error:', err);
    throw err;
  }
}

/**
 * Get billing statement by ID
 */
export async function getBillingStatement(id: string): Promise<BillingStatement | null> {
  try {
    const { data, error } = await supabase
      .from('billing_statements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return transformBillingStatement(data);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get billing statement error:', err);
    throw err;
  }
}

/**
 * Get all billing statements for a student
 */
export async function getStudentBillingStatements(
  studentId: string,
  schoolYear?: string
): Promise<BillingStatement[]> {
  try {
    let query = supabase
      .from('billing_statements')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null);

    if (schoolYear) {
      query = query.eq('school_year', schoolYear);
    }

    query = query.order('statement_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(transformBillingStatement);
  } catch (err) {
    console.error('[billingServicePostgreSQL] Get student billing statements error:', err);
    throw err;
  }
}

// ==========================================
// HELPER FUNCTIONS - Transform DB to App Types
// ==========================================

function transformFeeStructure(row: any): FeeStructure {
  const tuitionAmount = parseFloat(row.tuition_amount) || 0;
  const registrationFee = parseFloat(row.registration_fee) || 0;
  const idFee = parseFloat(row.id_fee) || 0;
  const insuranceFee = parseFloat(row.insurance_fee) || 0;
  const miscFees = row.misc_fees || [];
  const labFees = row.lab_fees || [];
  
  // Calculate total required (tuition + required misc fees + fixed fees)
  const totalRequired = tuitionAmount + 
    registrationFee + 
    idFee + 
    insuranceFee +
    miscFees.filter((f: any) => f.required).reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0);
  
  // Calculate total optional (optional misc fees + lab fees)
  const totalOptional = 
    miscFees.filter((f: any) => !f.required).reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0) +
    labFees.reduce((sum: number, f: any) => sum + (parseFloat(f.amount) || 0), 0);
  
  return {
    id: row.id,
    schoolId: row.school_id,
    gradeLevel: row.grade_level,
    schoolYear: row.school_year,
    track: row.track,
    strand: row.strand,
    tuitionAmount,
    registrationFee,
    idFee,
    insuranceFee,
    miscFees,
    labFees,
    fullPaymentDiscount: parseFloat(row.full_payment_discount) || 0,
    quarterlyDiscount: parseFloat(row.quarterly_discount) || 0,
    monthlyDiscount: parseFloat(row.monthly_discount) || 0,
    allowInstallments: row.allow_installments !== false,
    installmentPlans: row.installment_plans || [],
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    // Computed fields for UI compatibility
    totalRequired,
    totalOptional,
    paymentOptions: {
      fullPayment: {
        enabled: true,
        discount: parseFloat(row.full_payment_discount) || 0
      },
      quarterly: {
        enabled: row.allow_installments !== false,
        numberOfPayments: 4
      },
      monthly: {
        enabled: row.allow_installments !== false,
        numberOfPayments: 10
      }
    }
  };
}

function transformStudentLedger(row: any): StudentLedger {
  return {
    id: row.id,
    schoolId: row.school_id,
    studentId: row.student_id,
    schoolYear: row.school_year,
    totalCharges: parseFloat(row.total_charges) || 0,
    totalPayments: parseFloat(row.total_payments) || 0,
    balance: parseFloat(row.balance) || 0,
    charges: row.charges || [],
    payments: row.payments || [],
    paymentStatus: row.payment_status,
    lastPaymentDate: row.last_payment_date,
    lastPaymentAmount: row.last_payment_amount ? parseFloat(row.last_payment_amount) : undefined,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function transformReceipt(row: any): Receipt {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    
    // Transaction Details
    studentId: row.student_id,
    studentName: row.student_name || 'N/A',
    schoolYear: row.school_year || '2023-2024',
    paymentId: row.id,
    
    // Payment Information
    date: row.created_at, // Use created_at timestamp which includes date and time
    amount: parseFloat(row.amount) || 0,
    paymentMethod: row.payment_method,
    checkNumber: row.check_number,
    bankName: row.bank_name,
    referenceNumber: row.reference_number,
    
    // Payment For
    description: row.notes || `Payment for ${row.school_year || '2023-2024'}`,
    
    // Issued By
    receivedBy: row.recorded_by || '',
    receivedByName: row.recorded_by_name || 'Staff',
    
    // Balance Information
    previousBalance: 0,
    amountPaid: parseFloat(row.amount) || 0,
    newBalance: 0,
    
    // School Information (passed through from enrichment)
    schoolInfo: row.school_info,
    
    // Status
    isVoided: row.status === 'voided',
    voidedAt: row.voided_at,
    voidedBy: row.voided_by,
    voidReason: row.void_reason,
    
    // Metadata
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function transformBillingStatement(row: any): BillingStatement {
  return {
    id: row.id,
    schoolId: row.school_id,
    studentId: row.student_id,
    schoolYear: row.school_year,
    statementDate: row.statement_date,
    previousBalance: parseFloat(row.previous_balance) || 0,
    newCharges: parseFloat(row.new_charges) || 0,
    paymentsReceived: parseFloat(row.payments_received) || 0,
    currentBalance: parseFloat(row.current_balance) || 0,
    lineItems: row.line_items || [],
    dueDate: row.due_date,
    minimumPayment: row.minimum_payment ? parseFloat(row.minimum_payment) : undefined,
    status: row.status,
    sentAt: row.sent_at,
    viewedAt: row.viewed_at,
    pdfUrl: row.pdf_url,
    pdfGeneratedAt: row.pdf_generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
