import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StudentLedger {
  id: string;
  schoolId: string;
  studentId: string;
  schoolYear: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  charges: Charge[];
  payments: Payment[];
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overdue';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Charge {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  receiptNumber: string;
  paymentMethod: string;
}

interface UseStudentLedgersOptions {
  schoolId?: string;
  studentId?: string;
  schoolYear?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid' | 'overdue';
}

export function useStudentLedgersPostgreSQL(options: UseStudentLedgersOptions = {}) {
  const [ledgers, setLedgers] = useState<StudentLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from('student_ledgers')
          .select('*')
          .is('deleted_at', null);

        // Apply filters
        if (options.schoolId && options.schoolId !== 'default') {
          query = query.eq('school_id', options.schoolId);
        }
        if (options.studentId) {
          query = query.eq('student_id', options.studentId);
        }
        if (options.schoolYear) {
          query = query.eq('school_year', options.schoolYear);
        }
        if (options.paymentStatus) {
          query = query.eq('payment_status', options.paymentStatus);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Transform to camelCase
        const transformed: StudentLedger[] = (data || []).map(row => ({
          id: row.id,
          schoolId: row.school_id,
          studentId: row.student_id,
          schoolYear: row.school_year,
          totalCharges: parseFloat(row.total_charges) || 0,
          totalPayments: parseFloat(row.total_payments) || 0,
          balance: parseFloat(row.balance) || 0,
          charges: Array.isArray(row.charges) ? row.charges : [],
          payments: Array.isArray(row.payments) ? row.payments : [],
          paymentStatus: row.payment_status,
          lastPaymentDate: row.last_payment_date,
          lastPaymentAmount: row.last_payment_amount ? parseFloat(row.last_payment_amount) : undefined,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        setLedgers(transformed);
      } catch (err) {
        console.error('[useStudentLedgersPostgreSQL] Error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedgers();
  }, [options.schoolId, options.studentId, options.schoolYear, options.paymentStatus]);

  /**
   * Create a new student ledger
   */
  const createLedger = async (data: Partial<StudentLedger>): Promise<StudentLedger | null> => {
    try {
      const { data: inserted, error } = await supabase
        .from('student_ledgers')
        .insert([{
          school_id: data.schoolId,
          student_id: data.studentId,
          school_year: data.schoolYear,
          total_charges: data.totalCharges || 0,
          total_payments: data.totalPayments || 0,
          balance: data.balance || 0,
          charges: data.charges || [],
          payments: data.payments || [],
          payment_status: data.paymentStatus || 'unpaid',
          notes: data.notes
        }])
        .select()
        .single();

      if (error) throw error;

      return inserted ? {
        id: inserted.id,
        schoolId: inserted.school_id,
        studentId: inserted.student_id,
        schoolYear: inserted.school_year,
        totalCharges: parseFloat(inserted.total_charges),
        totalPayments: parseFloat(inserted.total_payments),
        balance: parseFloat(inserted.balance),
        charges: inserted.charges,
        payments: inserted.payments,
        paymentStatus: inserted.payment_status,
        lastPaymentDate: inserted.last_payment_date,
        lastPaymentAmount: inserted.last_payment_amount ? parseFloat(inserted.last_payment_amount) : undefined,
        notes: inserted.notes,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at
      } : null;
    } catch (err) {
      console.error('[useStudentLedgersPostgreSQL] Create error:', err);
      throw err;
    }
  };

  /**
   * Add a charge to a ledger
   */
  const addCharge = async (ledgerId: string, charge: Charge): Promise<void> => {
    try {
      // Fetch current ledger
    const { data: currentLedger, error: fetchError } = await supabase
      .from('student_ledgers')
      .select('charges, total_charges, total_payments, balance')
      .eq('id', ledgerId)
      .single();

    if (fetchError) throw fetchError;

    const charges = [...(currentLedger.charges || []), charge];
    const totalCharges = parseFloat(currentLedger.total_charges) + charge.amount;
    const balance = totalCharges - parseFloat(currentLedger.total_payments || '0');      const { error: updateError } = await supabase
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
      console.error('[useStudentLedgersPostgreSQL] Add charge error:', err);
      throw err;
    }
  };

  /**
   * Record a payment on a ledger
   */
  const recordPayment = async (ledgerId: string, payment: Payment): Promise<void> => {
    try {
      // Fetch current ledger
      const { data: currentLedger, error: fetchError } = await supabase
        .from('student_ledgers')
        .select('payments, total_payments, total_charges, balance')
        .eq('id', ledgerId)
        .single();

      if (fetchError) throw fetchError;

      const payments = [...(currentLedger.payments || []), payment];
      const totalPayments = parseFloat(currentLedger.total_payments || 0) + payment.amount;
      const balance = parseFloat(currentLedger.total_charges) - totalPayments;

      const { error: updateError } = await supabase
        .from('student_ledgers')
        .update({
          payments,
          total_payments: totalPayments,
          balance,
          last_payment_date: payment.date,
          last_payment_amount: payment.amount,
          payment_status: balance <= 0 ? 'paid' : balance < parseFloat(currentLedger.total_charges) ? 'partial' : 'unpaid'
        })
        .eq('id', ledgerId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('[useStudentLedgersPostgreSQL] Record payment error:', err);
      throw err;
    }
  };

  /**
   * Update ledger notes
   */
  const updateNotes = async (ledgerId: string, notes: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('student_ledgers')
        .update({ notes })
        .eq('id', ledgerId);

      if (error) throw error;
    } catch (err) {
      console.error('[useStudentLedgersPostgreSQL] Update notes error:', err);
      throw err;
    }
  };

  /**
   * Soft delete a ledger
   */
  const deleteLedger = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('student_ledgers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[useStudentLedgersPostgreSQL] Delete error:', err);
      throw err;
    }
  };

  return {
    ledgers,
    loading,
    error,
    createLedger,
    addCharge,
    recordPayment,
    updateNotes,
    deleteLedger
  };
}
