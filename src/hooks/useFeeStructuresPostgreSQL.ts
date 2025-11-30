import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Query result cache
const queryCache = new Map<string, { data: FeeStructure[]; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes - fee structures change rarely

interface FeeStructure {
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
}

interface MiscFee {
  id: string;
  name: string;
  amount: number;
  required: boolean;
  description?: string;
}

interface LabFee {
  subject: string;
  amount: number;
}

interface InstallmentPlan {
  name: string;
  payments: number;
  description?: string;
}

interface UseFeeStructuresOptions {
  schoolId?: string;
  gradeLevel?: number;
  schoolYear?: string;
  track?: string;
  strand?: string;
}

export function useFeeStructuresPostgreSQL(options: UseFeeStructuresOptions = {}) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeeStructures = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = JSON.stringify(options);
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setFeeStructures(cached.data);
          setLoading(false);
          return;
        }

        // Build query
        let query = supabase
          .from('fee_structures')
          .select('*')
          .is('deleted_at', null)
          .eq('is_active', true);

        // Apply filters
        if (options.schoolId && options.schoolId !== 'default') {
          query = query.eq('school_id', options.schoolId);
        }
        if (options.gradeLevel !== undefined) {
          query = query.eq('grade_level', options.gradeLevel);
        }
        if (options.schoolYear) {
          query = query.eq('school_year', options.schoolYear);
        }
        if (options.track) {
          query = query.eq('track', options.track);
        }
        if (options.strand) {
          query = query.eq('strand', options.strand);
        }

        // Order by grade level, then school year
        query = query.order('grade_level', { ascending: true })
                     .order('school_year', { ascending: false });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Transform snake_case to camelCase
        const transformed: FeeStructure[] = (data || []).map(row => ({
          id: row.id,
          schoolId: row.school_id,
          gradeLevel: row.grade_level,
          schoolYear: row.school_year,
          track: row.track,
          strand: row.strand,
          tuitionAmount: parseFloat(row.tuition_amount) || 0,
          registrationFee: parseFloat(row.registration_fee) || 0,
          idFee: parseFloat(row.id_fee) || 0,
          insuranceFee: parseFloat(row.insurance_fee) || 0,
          miscFees: Array.isArray(row.misc_fees) ? row.misc_fees : [],
          labFees: Array.isArray(row.lab_fees) ? row.lab_fees : [],
          fullPaymentDiscount: parseFloat(row.full_payment_discount) || 0,
          quarterlyDiscount: parseFloat(row.quarterly_discount) || 0,
          monthlyDiscount: parseFloat(row.monthly_discount) || 0,
          allowInstallments: row.allow_installments !== false,
          installmentPlans: Array.isArray(row.installment_plans) ? row.installment_plans : [],
          isActive: row.is_active !== false,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by
        }));

        setFeeStructures(transformed);
        
        // Update cache
        queryCache.set(cacheKey, { data: transformed, timestamp: Date.now() });
        
      } catch (err) {
        console.error('[useFeeStructuresPostgreSQL] Error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeStructures();
  }, [options.schoolId, options.gradeLevel, options.schoolYear, options.track, options.strand]);

  /**
   * Create a new fee structure
   */
  const createFeeStructure = async (data: Partial<FeeStructure>): Promise<FeeStructure | null> => {
    try {
      const { data: inserted, error } = await supabase
        .from('fee_structures')
        .insert([{
          school_id: data.schoolId,
          grade_level: data.gradeLevel,
          school_year: data.schoolYear,
          track: data.track,
          strand: data.strand,
          tuition_amount: data.tuitionAmount,
          registration_fee: data.registrationFee,
          id_fee: data.idFee,
          insurance_fee: data.insuranceFee,
          misc_fees: data.miscFees,
          lab_fees: data.labFees,
          full_payment_discount: data.fullPaymentDiscount,
          quarterly_discount: data.quarterlyDiscount,
          monthly_discount: data.monthlyDiscount,
          allow_installments: data.allowInstallments,
          installment_plans: data.installmentPlans,
          created_by: data.createdBy
        }])
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      queryCache.clear();

      return inserted ? {
        id: inserted.id,
        schoolId: inserted.school_id,
        gradeLevel: inserted.grade_level,
        schoolYear: inserted.school_year,
        track: inserted.track,
        strand: inserted.strand,
        tuitionAmount: parseFloat(inserted.tuition_amount),
        registrationFee: parseFloat(inserted.registration_fee),
        idFee: parseFloat(inserted.id_fee),
        insuranceFee: parseFloat(inserted.insurance_fee),
        miscFees: inserted.misc_fees,
        labFees: inserted.lab_fees,
        fullPaymentDiscount: parseFloat(inserted.full_payment_discount),
        quarterlyDiscount: parseFloat(inserted.quarterly_discount),
        monthlyDiscount: parseFloat(inserted.monthly_discount),
        allowInstallments: inserted.allow_installments,
        installmentPlans: inserted.installment_plans,
        isActive: inserted.is_active,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
        createdBy: inserted.created_by
      } : null;
    } catch (err) {
      console.error('[useFeeStructuresPostgreSQL] Create error:', err);
      throw err;
    }
  };

  /**
   * Update an existing fee structure
   */
  const updateFeeStructure = async (id: string, data: Partial<FeeStructure>): Promise<void> => {
    try {
      const updateData: any = {};
      
      if (data.tuitionAmount !== undefined) updateData.tuition_amount = data.tuitionAmount;
      if (data.registrationFee !== undefined) updateData.registration_fee = data.registrationFee;
      if (data.idFee !== undefined) updateData.id_fee = data.idFee;
      if (data.insuranceFee !== undefined) updateData.insurance_fee = data.insuranceFee;
      if (data.miscFees !== undefined) updateData.misc_fees = data.miscFees;
      if (data.labFees !== undefined) updateData.lab_fees = data.labFees;
      if (data.fullPaymentDiscount !== undefined) updateData.full_payment_discount = data.fullPaymentDiscount;
      if (data.quarterlyDiscount !== undefined) updateData.quarterly_discount = data.quarterlyDiscount;
      if (data.monthlyDiscount !== undefined) updateData.monthly_discount = data.monthlyDiscount;
      if (data.allowInstallments !== undefined) updateData.allow_installments = data.allowInstallments;
      if (data.installmentPlans !== undefined) updateData.installment_plans = data.installmentPlans;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { error } = await supabase
        .from('fee_structures')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      queryCache.clear();
    } catch (err) {
      console.error('[useFeeStructuresPostgreSQL] Update error:', err);
      throw err;
    }
  };

  /**
   * Soft delete a fee structure
   */
  const deleteFeeStructure = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fee_structures')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      queryCache.clear();
    } catch (err) {
      console.error('[useFeeStructuresPostgreSQL] Delete error:', err);
      throw err;
    }
  };

  return { 
    feeStructures, 
    loading, 
    error,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure
  };
}
