/**
 * useSupabase Hook
 * 
 * Custom hook for fetching data from Supabase PostgreSQL.
 * Replaces useSchoolData hook with real-time subscriptions.
 * 
 * Features:
 * - Real-time updates via Supabase subscriptions
 * - Loading states
 * - Error handling
 * - Automatic cleanup
 * 
 * Example Usage:
 * ```typescript
 * const { students, loading, error } = useSupabase('students', {
 *   filters: { grade_level: 1 },
 *   orderBy: 'last_name'
 * });
 * ```
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseOptions {
  filters?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  select?: string; // Custom SELECT clause (e.g., '*, sections(name)')
}

interface UseSupabaseResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch data from Supabase with real-time subscriptions
 */
export function useSupabase<T = any>(
  tableName: string,
  options: UseSupabaseOptions = {}
): UseSupabaseResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from(tableName)
        .select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      setData((result as T[]) || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup real-time subscription
    const channel: RealtimeChannel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          // Refetch data when changes occur
          fetchData();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Fetch students with section and grades data
 * Example of a specialized hook
 * 
 * DEPRECATED: Use useStudentsPostgreSQL from './useStudentsPostgreSQL' for better type safety
 */
export function useStudents(gradeLevel?: number) {
  return useSupabase('students', {
    select: '*, sections(name, grade_level), grades(*, learning_areas(name))',
    filters: gradeLevel ? { grade_level: gradeLevel } : undefined,
    orderBy: 'last_name',
  });
}

/**
 * Fetch grades with student and learning area data
 * 
 * DEPRECATED: Use useGradesPostgreSQL from './useGradesPostgreSQL' for better type safety
 */
export function useGrades(studentId?: string) {
  return useSupabase('grades', {
    select: '*, students(name), learning_areas(name, code, is_composite, components)',
    filters: studentId ? { student_id: studentId } : undefined,
  });
}

/**
 * Fetch sections with adviser and student count
 * 
 * DEPRECATED: Use useSectionsPostgreSQL from './useSectionsPostgreSQL' for better type safety
 */
export function useSections() {
  return useSupabase('sections', {
    select: '*, teachers(first_name, last_name), students(count)',
    orderBy: 'grade_level',
  });
}

// Re-export specialized PostgreSQL hooks for convenience
export { useGradesPostgreSQL } from './useGradesPostgreSQL';
export { useStudentsPostgreSQL } from './useStudentsPostgreSQL';
export { useSectionsPostgreSQL } from './useSectionsPostgreSQL';
export { useCoreValuesPostgreSQL } from './useCoreValuesPostgreSQL';
export { useAttendancePostgreSQL } from './useAttendancePostgreSQL';

// Re-export supabase client
export { supabase };

export default useSupabase;
