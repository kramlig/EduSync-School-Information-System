/**
 * useStudentHealthPostgreSQL Hook
 * 
 * Provides student health records data fetching and CRUD operations using PostgreSQL via Supabase.
 * Used for SF8 (Learner's Basic Health and Nutrition Report)
 * 
 * Features:
 * - Real-time health record subscriptions
 * - Filtering by school year, grade level, section, nutritional status
 * - Health statistics aggregation
 * - BMI calculation utilities
 * - CRUD operations (create, update, delete)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Type definitions for health records
export interface StudentHealthRecord {
  id: string;
  school_id: string;
  student_id: string;
  school_year: string;
  assessment_period: 'beginning' | 'end';
  assessment_date: string;
  
  // Physical measurements
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: 'Severely Wasted' | 'Wasted' | 'Normal' | 'Overweight' | 'Obese';
  nutritional_status?: 'Severely Wasted' | 'Wasted' | 'Normal' | 'Overweight' | 'Obese';
  
  // Health screening
  vision_screening?: string;
  hearing_screening?: string;
  skin_screening?: string;
  eyes_screening?: string;
  oral_health_screening?: string;
  
  // Menarche (female students)
  menarche_status?: 'Yes' | 'No' | 'N/A';
  menarche_age?: number;
  
  // Deworming
  deworming_1st_dose?: string;
  deworming_2nd_dose?: string;
  deworming_status?: 'Completed' | 'Partial' | 'Not Administered';
  
  // Immunization
  immunization_complete?: boolean;
  immunization_remarks?: string;
  
  // Feeding program
  feeding_program_enrolled?: boolean;
  feeding_program_type?: string;
  
  // Medical conditions
  has_disability?: boolean;
  disability_type?: string[];
  chronic_illness?: string[];
  allergies?: string[];
  
  // Remarks
  remarks?: string;
  
  // Assessed by
  assessed_by_id?: string;
  assessed_by_name?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  student?: {
    id: string;
    name: string;
    lrn: string;
    sex?: string;
    dateOfBirth?: string;
    grade_level?: number;
    section_id?: string;
    section_name?: string;
  };
}

export interface HealthRecordInput {
  school_id: string;
  student_id: string;
  school_year: string;
  assessment_period: 'beginning' | 'end';
  assessment_date: string;
  height_cm?: number;
  weight_kg?: number;
  vision_screening?: string;
  hearing_screening?: string;
  skin_screening?: string;
  eyes_screening?: string;
  oral_health_screening?: string;
  menarche_status?: string;
  menarche_age?: number;
  deworming_1st_dose?: string;
  deworming_2nd_dose?: string;
  deworming_status?: string;
  immunization_complete?: boolean;
  immunization_remarks?: string;
  feeding_program_enrolled?: boolean;
  feeding_program_type?: string;
  has_disability?: boolean;
  disability_type?: string[];
  chronic_illness?: string[];
  allergies?: string[];
  remarks?: string;
  assessed_by_id?: string;
  assessed_by_name?: string;
}

export interface HealthStatistics {
  total: number;
  assessed: number;
  notAssessed: number;
  byNutritionalStatus: {
    severely_wasted: number;
    wasted: number;
    normal: number;
    overweight: number;
    obese: number;
  };
  byDeworming: {
    completed: number;
    partial: number;
    not_administered: number;
  };
  byFeedingProgram: {
    enrolled: number;
    not_enrolled: number;
  };
  byVision: {
    normal: number;
    with_defect: number;
  };
  byHearing: {
    normal: number;
    with_defect: number;
  };
  byOralHealth: {
    no_cavities: number;
    with_cavities: number;
  };
  averageBMI: number;
  averageHeight: number;
  averageWeight: number;
}

interface UseStudentHealthOptions {
  schoolId?: string;
  schoolYear?: string;
  assessmentPeriod?: 'beginning' | 'end';
  gradeLevel?: number;
  sectionId?: string;
  nutritionalStatus?: string;
  includeStudentData?: boolean;
}

interface UseStudentHealthReturn {
  healthRecords: StudentHealthRecord[];
  loading: boolean;
  error: Error | null;
  statistics: HealthStatistics | null;
  
  // CRUD operations
  createHealthRecord: (record: HealthRecordInput) => Promise<StudentHealthRecord | null>;
  updateHealthRecord: (id: string, updates: Partial<HealthRecordInput>) => Promise<boolean>;
  deleteHealthRecord: (id: string) => Promise<boolean>;
  
  // Bulk operations
  bulkCreateHealthRecords: (records: HealthRecordInput[]) => Promise<{ success: number; failed: number }>;
  
  // Utilities
  calculateBMI: (heightCm: number, weightKg: number) => number;
  getBMICategory: (bmi: number, ageYears?: number) => string;
  refresh: () => Promise<void>;
}

// BMI calculation utilities
export const calculateBMI = (heightCm: number, weightKg: number): number => {
  if (!heightCm || !weightKg || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
};

// Get BMI category based on standard ranges
// Note: For more accurate child assessment, BMI-for-Age percentiles should be used
export const getBMICategory = (bmi: number, ageYears?: number): string => {
  if (!bmi || bmi <= 0) return 'Unknown';
  
  // For children (5-19 years), use simplified categories
  // A more accurate implementation would use WHO BMI-for-Age z-scores
  if (ageYears && ageYears < 19) {
    if (bmi < 14.0) return 'Severely Wasted';
    if (bmi < 17.0) return 'Wasted';
    if (bmi < 23.0) return 'Normal';
    if (bmi < 27.0) return 'Overweight';
    return 'Obese';
  }
  
  // Adult BMI categories
  if (bmi < 16.0) return 'Severely Wasted';
  if (bmi < 18.5) return 'Wasted';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Overweight';
  return 'Obese';
};

export const useStudentHealthPostgreSQL = (options: UseStudentHealthOptions = {}): UseStudentHealthReturn => {
  const {
    schoolId,
    schoolYear,
    assessmentPeriod,
    gradeLevel,
    sectionId,
    nutritionalStatus,
    includeStudentData = true
  } = options;

  const [healthRecords, setHealthRecords] = useState<StudentHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Calculate statistics from health records
  const statistics = useMemo((): HealthStatistics | null => {
    if (healthRecords.length === 0) return null;

    const assessed = healthRecords.filter(r => r.height_cm && r.weight_kg);
    const notAssessed = healthRecords.filter(r => !r.height_cm || !r.weight_kg);

    const byStatus = {
      severely_wasted: assessed.filter(r => r.nutritional_status === 'Severely Wasted').length,
      wasted: assessed.filter(r => r.nutritional_status === 'Wasted').length,
      normal: assessed.filter(r => r.nutritional_status === 'Normal').length,
      overweight: assessed.filter(r => r.nutritional_status === 'Overweight').length,
      obese: assessed.filter(r => r.nutritional_status === 'Obese').length,
    };

    const byDeworming = {
      completed: healthRecords.filter(r => r.deworming_status === 'Completed').length,
      partial: healthRecords.filter(r => r.deworming_status === 'Partial').length,
      not_administered: healthRecords.filter(r => r.deworming_status === 'Not Administered' || !r.deworming_status).length,
    };

    const byFeedingProgram = {
      enrolled: healthRecords.filter(r => r.feeding_program_enrolled).length,
      not_enrolled: healthRecords.filter(r => !r.feeding_program_enrolled).length,
    };

    const byVision = {
      normal: healthRecords.filter(r => r.vision_screening?.toLowerCase().includes('normal')).length,
      with_defect: healthRecords.filter(r => r.vision_screening?.toLowerCase().includes('defect')).length,
    };

    const byHearing = {
      normal: healthRecords.filter(r => r.hearing_screening?.toLowerCase().includes('normal')).length,
      with_defect: healthRecords.filter(r => r.hearing_screening?.toLowerCase().includes('defect')).length,
    };

    const byOralHealth = {
      no_cavities: healthRecords.filter(r => r.oral_health_screening?.toLowerCase().includes('no cav')).length,
      with_cavities: healthRecords.filter(r => 
        r.oral_health_screening?.toLowerCase().includes('with cav') || 
        r.oral_health_screening?.toLowerCase().includes('cavities')
      ).length,
    };

    const validBMIs = assessed.filter(r => r.bmi && r.bmi > 0);
    const averageBMI = validBMIs.length > 0 
      ? Math.round(validBMIs.reduce((sum, r) => sum + (r.bmi || 0), 0) / validBMIs.length * 100) / 100
      : 0;

    const validHeights = assessed.filter(r => r.height_cm && r.height_cm > 0);
    const averageHeight = validHeights.length > 0
      ? Math.round(validHeights.reduce((sum, r) => sum + (r.height_cm || 0), 0) / validHeights.length * 100) / 100
      : 0;

    const validWeights = assessed.filter(r => r.weight_kg && r.weight_kg > 0);
    const averageWeight = validWeights.length > 0
      ? Math.round(validWeights.reduce((sum, r) => sum + (r.weight_kg || 0), 0) / validWeights.length * 100) / 100
      : 0;

    return {
      total: healthRecords.length,
      assessed: assessed.length,
      notAssessed: notAssessed.length,
      byNutritionalStatus: byStatus,
      byDeworming,
      byFeedingProgram,
      byVision,
      byHearing,
      byOralHealth,
      averageBMI,
      averageHeight,
      averageWeight,
    };
  }, [healthRecords]);

  // Fetch health records
  const fetchHealthRecords = useCallback(async () => {
    if (!schoolId) {
      setHealthRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('student_health_records')
        .select(includeStudentData ? `
          *,
          student:students!inner(
            id,
            name,
            lrn,
            gender,
            date_of_birth,
            grade_level,
            section_id,
            sections!left(name)
          )
        ` : '*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (schoolYear) {
        query = query.eq('school_year', schoolYear);
      }

      if (assessmentPeriod) {
        query = query.eq('assessment_period', assessmentPeriod);
      }

      if (nutritionalStatus) {
        query = query.eq('nutritional_status', nutritionalStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (!isMountedRef.current) return;

      // Transform data and apply additional filters
      let records = (data || []).map((record: any) => ({
        ...record,
        student: record.student ? {
          id: record.student.id,
          name: record.student.name,
          lrn: record.student.lrn,
          sex: record.student.gender, // Map gender to sex for compatibility
          dateOfBirth: record.student.date_of_birth,
          grade_level: record.student.grade_level,
          section_id: record.student.section_id,
          section_name: record.student.sections?.name,
        } : undefined
      })) as StudentHealthRecord[];

      // Apply grade level filter (if student data is included)
      if (gradeLevel !== undefined && includeStudentData) {
        records = records.filter(r => r.student?.grade_level === gradeLevel);
      }

      // Apply section filter (if student data is included)
      if (sectionId && includeStudentData) {
        records = records.filter(r => r.student?.section_id === sectionId);
      }

      setHealthRecords(records);
    } catch (err) {
      console.error('Error fetching health records:', err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [schoolId, schoolYear, assessmentPeriod, gradeLevel, sectionId, nutritionalStatus, includeStudentData]);

  // Create health record
  const createHealthRecord = useCallback(async (record: HealthRecordInput): Promise<StudentHealthRecord | null> => {
    try {
      // Calculate BMI before inserting
      const bmi = record.height_cm && record.weight_kg 
        ? calculateBMI(record.height_cm, record.weight_kg)
        : null;
      
      const bmiCategory = bmi ? getBMICategory(bmi) : null;

      const { data, error: insertError } = await supabase
        .from('student_health_records')
        .insert({
          ...record,
          bmi,
          bmi_category: bmiCategory,
          nutritional_status: bmiCategory,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating health record:', insertError);
        return null;
      }

      // Refresh records
      await fetchHealthRecords();
      
      return data as StudentHealthRecord;
    } catch (err) {
      console.error('Error creating health record:', err);
      return null;
    }
  }, [fetchHealthRecords]);

  // Update health record
  const updateHealthRecord = useCallback(async (id: string, updates: Partial<HealthRecordInput>): Promise<boolean> => {
    try {
      // Recalculate BMI if height or weight changed
      let bmiUpdates: any = {};
      if (updates.height_cm !== undefined || updates.weight_kg !== undefined) {
        // Get existing record to merge values
        const { data: existing } = await supabase
          .from('student_health_records')
          .select('height_cm, weight_kg')
          .eq('id', id)
          .single();

        const height = updates.height_cm ?? existing?.height_cm;
        const weight = updates.weight_kg ?? existing?.weight_kg;

        if (height && weight) {
          const bmi = calculateBMI(height, weight);
          const bmiCategory = getBMICategory(bmi);
          bmiUpdates = {
            bmi,
            bmi_category: bmiCategory,
            nutritional_status: updates.nutritional_status || bmiCategory,
          };
        }
      }

      const { error: updateError } = await supabase
        .from('student_health_records')
        .update({
          ...updates,
          ...bmiUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating health record:', updateError);
        return false;
      }

      // Refresh records
      await fetchHealthRecords();
      
      return true;
    } catch (err) {
      console.error('Error updating health record:', err);
      return false;
    }
  }, [fetchHealthRecords]);

  // Delete health record
  const deleteHealthRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('student_health_records')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting health record:', deleteError);
        return false;
      }

      // Refresh records
      await fetchHealthRecords();
      
      return true;
    } catch (err) {
      console.error('Error deleting health record:', err);
      return false;
    }
  }, [fetchHealthRecords]);

  // Bulk create health records
  const bulkCreateHealthRecords = useCallback(async (records: HealthRecordInput[]): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize).map(record => {
        const bmi = record.height_cm && record.weight_kg 
          ? calculateBMI(record.height_cm, record.weight_kg)
          : null;
        const bmiCategory = bmi ? getBMICategory(bmi) : null;

        return {
          ...record,
          bmi,
          bmi_category: bmiCategory,
          nutritional_status: bmiCategory,
        };
      });

      const { data, error } = await supabase
        .from('student_health_records')
        .insert(batch)
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        failed += batch.length;
      } else {
        success += data?.length || 0;
        failed += batch.length - (data?.length || 0);
      }
    }

    // Refresh after bulk insert
    await fetchHealthRecords();

    return { success, failed };
  }, [fetchHealthRecords]);

  // Set up real-time subscription
  useEffect(() => {
    isMountedRef.current = true;
    
    fetchHealthRecords();

    // Set up real-time subscription
    if (schoolId) {
      channelRef.current = supabase
        .channel(`health_records_${schoolId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'student_health_records',
            filter: `school_id=eq.${schoolId}`,
          },
          () => {
            // Refresh on any change
            fetchHealthRecords();
          }
        )
        .subscribe();
    }

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [schoolId, schoolYear, assessmentPeriod, gradeLevel, sectionId, nutritionalStatus, fetchHealthRecords]);

  return {
    healthRecords,
    loading,
    error,
    statistics,
    createHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    bulkCreateHealthRecords,
    calculateBMI,
    getBMICategory,
    refresh: fetchHealthRecords,
  };
};

export default useStudentHealthPostgreSQL;
