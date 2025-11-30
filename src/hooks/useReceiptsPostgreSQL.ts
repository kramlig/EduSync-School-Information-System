import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Receipt {
  id: string;
  schoolId: string;
  receiptNumber: string;
  studentId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'maya' | 'card' | 'online';
  checkNumber?: string;
  referenceNumber?: string;
  notes?: string;
  issuedBy: string;
  isVoided: boolean;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseReceiptsOptions {
  schoolId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  includeVoided?: boolean;
}

export function useReceiptsPostgreSQL(options: UseReceiptsOptions = {}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from('receipts')
          .select('*')
          .is('deleted_at', null);

        // Apply filters
        if (options.schoolId && options.schoolId !== 'default') {
          query = query.eq('school_id', options.schoolId);
        }
        if (options.studentId) {
          query = query.eq('student_id', options.studentId);
        }
        if (options.startDate) {
          query = query.gte('receipt_date', options.startDate);
        }
        if (options.endDate) {
          query = query.lte('receipt_date', options.endDate);
        }
        if (options.paymentMethod) {
          query = query.eq('payment_method', options.paymentMethod);
        }
        if (!options.includeVoided) {
          query = query.eq('status', 'valid');
        }

        query = query.order('receipt_number', { ascending: false });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Transform to camelCase
        const transformed: Receipt[] = (data || []).map(row => ({
          id: row.id,
          schoolId: row.school_id,
          receiptNumber: row.receipt_number,
          studentId: row.student_id,
          paymentDate: row.receipt_date, // Use receipt_date from database
          amount: parseFloat(row.amount) || 0,
          paymentMethod: row.payment_method,
          checkNumber: row.check_number,
          referenceNumber: row.reference_number,
          notes: row.notes,
          issuedBy: row.issued_by || row.recorded_by, // recorded_by is the correct column name
          isVoided: row.status === 'voided',
          voidedAt: row.voided_at,
          voidedBy: row.voided_by,
          voidReason: row.void_reason,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        setReceipts(transformed);
      } catch (err) {
        console.error('[useReceiptsPostgreSQL] Error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [
    options.schoolId,
    options.studentId,
    options.startDate,
    options.endDate,
    options.paymentMethod,
    options.includeVoided
  ]);

  /**
   * Generate next receipt number in BIR-compliant format (OR-YYYY-NNNNN)
   */
  const generateReceiptNumber = async (schoolId: string): Promise<string> => {
    try {
      const currentYear = new Date().getFullYear();
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
      console.error('[useReceiptsPostgreSQL] Generate receipt number error:', err);
      throw err;
    }
  };

  /**
   * Create a new receipt with auto-generated receipt number
   */
  const createReceipt = async (data: Partial<Receipt>): Promise<Receipt | null> => {
    try {
      if (!data.schoolId) throw new Error('School ID is required');

      // Generate receipt number
      const receiptNumber = await generateReceiptNumber(data.schoolId);

      const { data: inserted, error } = await supabase
        .from('receipts')
        .insert([{
          school_id: data.schoolId,
          receipt_number: receiptNumber,
          student_id: data.studentId,
          payment_date: data.paymentDate || new Date().toISOString().split('T')[0],
          amount: data.amount,
          payment_method: data.paymentMethod,
          check_number: data.checkNumber,
          reference_number: data.referenceNumber,
          notes: data.notes,
          issued_by: data.issuedBy,
          is_voided: false
        }])
        .select()
        .single();

      if (error) throw error;

      return inserted ? {
        id: inserted.id,
        schoolId: inserted.school_id,
        receiptNumber: inserted.receipt_number,
        studentId: inserted.student_id,
        paymentDate: inserted.payment_date,
        amount: parseFloat(inserted.amount),
        paymentMethod: inserted.payment_method,
        checkNumber: inserted.check_number,
        referenceNumber: inserted.reference_number,
        notes: inserted.notes,
        issuedBy: inserted.issued_by,
        isVoided: inserted.is_voided,
        voidedAt: inserted.voided_at,
        voidedBy: inserted.voided_by,
        voidReason: inserted.void_reason,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at
      } : null;
    } catch (err) {
      console.error('[useReceiptsPostgreSQL] Create error:', err);
      throw err;
    }
  };

  /**
   * Void a receipt (BIR compliance requires voided receipts to remain in records)
   */
  const voidReceipt = async (
    id: string,
    voidedBy: string,
    voidReason: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('receipts')
        .update({
          is_voided: true,
          voided_at: new Date().toISOString(),
          voided_by: voidedBy,
          void_reason: voidReason
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[useReceiptsPostgreSQL] Void error:', err);
      throw err;
    }
  };

  /**
   * Get receipt statistics for a date range
   */
  const getReceiptStats = async (
    schoolId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalReceipts: number;
    totalAmount: number;
    voidedReceipts: number;
    voidedAmount: number;
    byPaymentMethod: Record<string, { count: number; amount: number }>;
  }> => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('school_id', schoolId)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .is('deleted_at', null);

      if (error) throw error;

      const stats = {
        totalReceipts: 0,
        totalAmount: 0,
        voidedReceipts: 0,
        voidedAmount: 0,
        byPaymentMethod: {} as Record<string, { count: number; amount: number }>
      };

      data?.forEach(row => {
        const amount = parseFloat(row.amount) || 0;
        
        if (row.is_voided) {
          stats.voidedReceipts++;
          stats.voidedAmount += amount;
        } else {
          stats.totalReceipts++;
          stats.totalAmount += amount;

          const method = row.payment_method;
          if (!stats.byPaymentMethod[method]) {
            stats.byPaymentMethod[method] = { count: 0, amount: 0 };
          }
          stats.byPaymentMethod[method].count++;
          stats.byPaymentMethod[method].amount += amount;
        }
      });

      return stats;
    } catch (err) {
      console.error('[useReceiptsPostgreSQL] Get stats error:', err);
      throw err;
    }
  };

  return {
    receipts,
    loading,
    error,
    generateReceiptNumber,
    createReceipt,
    voidReceipt,
    getReceiptStats
  };
}
