/**
 * useGradesPostgreSQL Hook
 * 
 * Provides grade data fetching and CRUD operations using PostgreSQL via Supabase.
 * Designed to work alongside existing Firestore data during migration.
 * 
 * Features:
 * - Real-time grade subscriptions
 * - MAPEH composite grade support (JSONB)
 * - Filtering by student, learning area, section
 * - Grade update/create operations
 * - Automatic final grade calculation
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Type definitions (matching Firestore types)
interface SubGradeRecord {
  [component: string]: number;
}

interface Grade {
  id: string;
  schoolId: string;
  studentId: string;
  learningAreaId: string;
  q1?: number | SubGradeRecord;
  q2?: number | SubGradeRecord;
  q3?: number | SubGradeRecord;
  q4?: number | SubGradeRecord;
  finalGrade?: number;
  remarks?: 'Passed' | 'Failed';
}

interface UseGradesOptions {
  studentId?: string;
  learningAreaId?: string;
  sectionId?: string;
  schoolId?: string;
}

interface UseGradesReturn {
  grades: Grade[];
  loading: boolean;
  error: Error | null;
  updateGrade: (
    studentId: string,
    learningAreaId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    value: number | SubGradeRecord | undefined,
    component?: string
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useGradesPostgreSQL(options: UseGradesOptions = {}): UseGradesReturn {
  const { studentId, learningAreaId, sectionId, schoolId } = options;
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('grades')
        .select(`
          *,
          students!inner (
            id,
            section_id
          )
        `);

      // Apply filters
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (learningAreaId) {
        query = query.eq('learning_area_id', learningAreaId);
      }
      if (sectionId) {
        query = query.eq('students.section_id', sectionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform PostgreSQL data to match Firestore Grade interface
      const transformedGrades: Grade[] = (data || []).map(row => ({
        id: row.id,
        schoolId: row.school_id,
        studentId: row.student_id,
        learningAreaId: row.learning_area_id,
        q1: row.composite_grades?.q1 || row.q1,
        q2: row.composite_grades?.q2 || row.q2,
        q3: row.composite_grades?.q3 || row.q3,
        q4: row.composite_grades?.q4 || row.q4,
        finalGrade: row.final_grade || undefined,
        remarks: row.remarks || undefined
      }));

      setGrades(transformedGrades);
    } catch (err) {
      console.error('[useGradesPostgreSQL] Error fetching grades:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [studentId, learningAreaId, sectionId, schoolId]);

  // Initial fetch
  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('grades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades'
        },
        (payload) => {
          console.log('[useGradesPostgreSQL] Real-time update:', payload);
          fetchGrades(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGrades]);

  /**
   * Update or create a grade
   * 
   * @param studentId - Student ID
   * @param learningAreaId - Learning area ID
   * @param quarter - Quarter to update (q1, q2, q3, q4)
   * @param value - Grade value (number for regular, SubGradeRecord for MAPEH)
   * @param component - Optional: Specific MAPEH component (Music, Arts, PE, Health)
   */
  const updateGrade = useCallback(async (
    studentId: string,
    learningAreaId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    value: number | SubGradeRecord | undefined,
    component?: string
  ) => {
    try {
      // Find existing grade
      const { data: existing, error: fetchError } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId)
        .eq('learning_area_id', learningAreaId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
        throw fetchError;
      }

      const isComposite = typeof value === 'object' && value !== null;

      if (existing) {
        // Update existing grade
        const updates: any = {};

        if (isComposite) {
          // MAPEH composite grade - update JSONB
          const currentComposite = existing.composite_grades || {};
          updates.composite_grades = {
            ...currentComposite,
            [quarter]: value
          };
          // Clear simple grade value
          updates[quarter] = null;
        } else if (component) {
          // Single MAPEH component update
          const currentComposite = existing.composite_grades || {};
          const currentQuarter = currentComposite[quarter] || {};
          updates.composite_grades = {
            ...currentComposite,
            [quarter]: {
              ...currentQuarter,
              [component]: value
            }
          };
          updates[quarter] = null;
        } else {
          // Simple numeric grade
          updates[quarter] = value;
          // Clear composite if exists
          if (existing.composite_grades?.[quarter]) {
            const newComposite = { ...existing.composite_grades };
            delete newComposite[quarter];
            updates.composite_grades = Object.keys(newComposite).length > 0 ? newComposite : null;
          }
        }

        // Calculate final grade
        const q1 = quarter === 'q1' ? (isComposite ? calculateCompositeAverage(value as SubGradeRecord) : value) : (existing.composite_grades?.q1 ? calculateCompositeAverage(existing.composite_grades.q1) : existing.q1);
        const q2 = quarter === 'q2' ? (isComposite ? calculateCompositeAverage(value as SubGradeRecord) : value) : (existing.composite_grades?.q2 ? calculateCompositeAverage(existing.composite_grades.q2) : existing.q2);
        const q3 = quarter === 'q3' ? (isComposite ? calculateCompositeAverage(value as SubGradeRecord) : value) : (existing.composite_grades?.q3 ? calculateCompositeAverage(existing.composite_grades.q3) : existing.q3);
        const q4 = quarter === 'q4' ? (isComposite ? calculateCompositeAverage(value as SubGradeRecord) : value) : (existing.composite_grades?.q4 ? calculateCompositeAverage(existing.composite_grades.q4) : existing.q4);

        const quarterGrades = [q1, q2, q3, q4].filter((g): g is number => typeof g === 'number');
        if (quarterGrades.length > 0) {
          updates.final_grade = Math.round(
            quarterGrades.reduce((sum, g) => sum + g, 0) / quarterGrades.length
          );
          updates.remarks = updates.final_grade >= 75 ? 'Passed' : 'Failed';
        }

        const { error: updateError } = await supabase
          .from('grades')
          .update(updates)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new grade
        const newGrade: any = {
          student_id: studentId,
          learning_area_id: learningAreaId,
          school_id: schoolId || existing?.school_id, // Use existing or provided
        };

        if (isComposite) {
          newGrade.composite_grades = { [quarter]: value };
        } else {
          newGrade[quarter] = value;
        }

        // Initial final grade calculation
        const gradeValue = isComposite ? calculateCompositeAverage(value as SubGradeRecord) : value;
        if (typeof gradeValue === 'number') {
          newGrade.final_grade = Math.round(gradeValue);
          newGrade.remarks = gradeValue >= 75 ? 'Passed' : 'Failed';
        }

        const { error: insertError } = await supabase
          .from('grades')
          .insert([newGrade]);

        if (insertError) throw insertError;
      }

      // Refetch to get updated data
      await fetchGrades();
    } catch (err) {
      console.error('[useGradesPostgreSQL] Error updating grade:', err);
      throw err;
    }
  }, [fetchGrades, schoolId]);

  return {
    grades,
    loading,
    error,
    updateGrade,
    refetch: fetchGrades
  };
}

/**
 * Calculate average from MAPEH composite grade components
 */
function calculateCompositeAverage(subGrades: SubGradeRecord): number | undefined {
  const values = Object.values(subGrades).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}
