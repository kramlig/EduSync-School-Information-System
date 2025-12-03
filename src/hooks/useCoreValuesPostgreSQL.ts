/**
 * PostgreSQL Hook: Core Values & Core Value Grades
 * Fetches core values and their grades from Supabase PostgreSQL
 * 
 * OPTIMIZATION: Added skip parameter to defer expensive grade fetching
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CoreValue, CoreValueGrade } from '../../types';

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

        // Fetch core values
        let cvQuery = supabase.from('core_values').select('*').order('display_order');
        // Only filter by schoolId if it's a valid UUID (not "default")
        if (schoolId && schoolId !== 'default') {
          cvQuery = cvQuery.eq('school_id', schoolId);
        }

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

        // Transform core values
        const transformedCoreValues: CoreValue[] = (cvData || []).map((row: any) => ({
          id: row.id,
          schoolId: row.school_id,
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
        
        // Debug: Show sample data
        if (transformedCoreValues.length > 0) {
        }
        if (transformedCoreValueGrades.length > 0) {
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

  return {
    coreValues,
    coreValueGrades,
    loading,
    error,
    refetch
  };
}
