/**
 * PostgreSQL Hook: Core Values & Core Value Grades
 * Fetches core values and their grades from Supabase PostgreSQL
 * 
 * ARCHITECTURE: Core Values are GLOBAL (not per-school)
 * - The 4 DepEd Core Values (MAKA-DIYOS, MAKATAO, MAKAKALIKASAN, MAKABANSA) are shared by all schools
 * - Only core_value_grades are per-school (linked via student_id → school_id)
 * - This eliminates need to seed core values for each new school
 * 
 * OPTIMIZATION: Added skip parameter to defer expensive grade fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CoreValue, CoreValueGrade, CoreValueMarking } from '../../types';

export function useCoreValuesPostgreSQL(
  enabled: boolean, 
  schoolId?: string,
  skip?: boolean,  // Skip fetching grades for performance
  sectionId?: string  // Filter grades by section for performance
) {
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [coreValueGrades, setCoreValueGrades] = useState<CoreValueGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Expose refetch function
  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    if (!enabled || skip) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch core values - GLOBAL (no school_id filter needed)
        // Core values are shared across all schools (DepEd standard)
        const cvQuery = supabase.from('core_values').select('*').order('display_order');
        // NOTE: Removed school_id filter - core values are now global

        const { data: cvData, error: cvError } = await cvQuery;
        
        if (cvError) {
          console.error('[useCoreValuesPostgreSQL] Error fetching core values:', cvError);
          throw cvError;
        }

        // OPTIMIZATION: Skip fetching grades on initial load
        // Grades will be fetched when needed (e.g., when student row is expanded)
        let transformedCoreValueGrades: CoreValueGrade[] = [];
        
        if (!skip) {
          // Fetch core value grades
          let cvgQuery = supabase.from('core_value_grades').select('*, students!inner(section_id)');
          
          // Only filter by schoolId if it's a valid UUID (not "default")
          if (schoolId && schoolId !== 'default') {
            cvgQuery = cvgQuery.eq('school_id', schoolId);
          }
          
          // PERFORMANCE: Filter by section to reduce data transfer
          if (sectionId) {
            cvgQuery = cvgQuery.eq('students.section_id', sectionId);
          }

          const { data: cvgData, error: cvgError } = await cvgQuery;
          
          if (cvgError) {
            console.error('[useCoreValuesPostgreSQL] Error fetching core value grades:', cvgError);
            throw cvgError;
          }

          // Transform core value grades
          transformedCoreValueGrades = (cvgData || []).map((row: any) => {
            // Parse indicator_ratings JSONB
            // PostgreSQL format: {"q1": {"indicator1": "AO", "indicator2": "SO"}, "q2": {...}}
            const indicatorRatings = row.indicator_ratings || {};
            
            return {
              id: row.id,
              schoolId: row.school_id,
              studentId: row.student_id,
              coreValueId: row.core_value_id,
              schoolYear: row.school_year,
              // Use indicator_ratings JSONB for each quarter's behavioral indicators
              q1: indicatorRatings.q1 || {},
              q2: indicatorRatings.q2 || {},
              q3: indicatorRatings.q3 || {},
              q4: indicatorRatings.q4 || {},
              gradedBy: row.graded_by,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          });
        }

        if (!isMounted) return;

        // Transform core values (school_id column removed - core values are global)
        const transformedCoreValues: CoreValue[] = (cvData || []).map((row: any) => ({
          id: row.id,
          schoolId: null, // Core values are global, no school_id
          code: row.code,
          name: row.name,
          description: row.description,
          behaviors: row.indicators || [],
          displayOrder: row.display_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        setCoreValues(transformedCoreValues);
        setCoreValueGrades(transformedCoreValueGrades);
        
        // Debug: Log fetched data
        console.log('[useCoreValuesPostgreSQL] Raw cvData:', cvData);
        console.log('[useCoreValuesPostgreSQL] Transformed core values:', transformedCoreValues);
        console.log('[useCoreValuesPostgreSQL] Core values count:', transformedCoreValues.length);
        if (transformedCoreValues.length > 0) {
          console.log('[useCoreValuesPostgreSQL] First core value:', transformedCoreValues[0]);
          console.log('[useCoreValuesPostgreSQL] Behaviors/indicators:', transformedCoreValues[0].behaviors);
        }

      } catch (err) {
        console.error('[useCoreValuesPostgreSQL] Error:', err);
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [enabled, schoolId, refetchTrigger]);

  // Update a single core value grade (creates record if doesn't exist)
  const updateCoreValueGrade = useCallback(async (
    studentId: string,
    coreValueId: string,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    behavior: string,
    value: CoreValueMarking | ''
  ): Promise<void> => {
    try {
      // Find existing core value grade
      const { data: existingGrades, error: fetchError } = await supabase
        .from('core_value_grades')
        .select('*')
        .eq('student_id', studentId)
        .eq('core_value_id', coreValueId)
        .limit(1);

      if (fetchError) throw fetchError;

      if (!existingGrades || existingGrades.length === 0) {
        // Create new record
        const newIndicatorRatings = {
          [quarter]: { [behavior]: value }
        };

        const { data: inserted, error: insertError } = await supabase
          .from('core_value_grades')
          .insert({
            school_id: schoolId || 'default',
            student_id: studentId,
            core_value_id: coreValueId,
            school_year: '2024-2025',
            indicator_ratings: newIndicatorRatings
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update local state with new record
        if (inserted) {
          const indicatorRatings = inserted.indicator_ratings || {};
          const newGrade: CoreValueGrade = {
            id: inserted.id,
            schoolId: inserted.school_id,
            studentId: inserted.student_id,
            coreValueId: inserted.core_value_id,
            schoolYear: inserted.school_year,
            q1: indicatorRatings.q1 || {},
            q2: indicatorRatings.q2 || {},
            q3: indicatorRatings.q3 || {},
            q4: indicatorRatings.q4 || {},
            gradedBy: inserted.graded_by,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at
          };
          setCoreValueGrades(prev => [...prev, newGrade]);
        }
      } else {
        // Update existing record
        const existing = existingGrades[0];
        const currentRatings = existing.indicator_ratings || {};
        const currentQuarter = currentRatings[quarter] || {};

        const updatedRatings = {
          ...currentRatings,
          [quarter]: { ...currentQuarter, [behavior]: value }
        };

        const { error: updateError } = await supabase
          .from('core_value_grades')
          .update({ indicator_ratings: updatedRatings, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        // Update local state
        setCoreValueGrades(prev =>
          prev.map(g => {
            if (g.id === existing.id) {
              return {
                ...g,
                [quarter]: { ...(g[quarter] || {}), [behavior]: value },
                updatedAt: new Date().toISOString()
              };
            }
            return g;
          })
        );
      }

      console.log('[useCoreValuesPostgreSQL] Grade updated:', { studentId, coreValueId, quarter, behavior, value });
    } catch (err) {
      console.error('[useCoreValuesPostgreSQL] Error updating grade:', err);
      throw err;
    }
  }, [schoolId]);

  return {
    coreValues,
    coreValueGrades,
    loading,
    error,
    refetch,
    updateCoreValueGrade
  };
}
