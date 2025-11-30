/**
 * useLessonPlansPostgreSQL - PostgreSQL Lesson Plans Hook
 * 
 * Manages lesson plans from PostgreSQL
 * Migrated from Firestore: November 28, 2025
 * 
 * Features:
 * - Fetches from lesson_plans table
 * - Full CRUD operations
 * - Real-time polling every 30 seconds (silent updates)
 * - Filtering by section, learning area, date range
 * - Multi-tenant isolation via school_id
 */

import { useState, useEffect, useCallback } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import type { LessonPlan } from '../../types';
import * as lessonPlansService from '../services/lessonPlansServicePostgreSQL';

interface UseLessonPlansPostgreSQLResult {
  lessonPlans: LessonPlan[];
  loading: boolean;
  error: string | null;
  addLessonPlan: (lessonPlan: Omit<LessonPlan, 'id' | 'schoolId'>) => Promise<void>;
  updateLessonPlan: (lessonPlan: LessonPlan) => Promise<void>;
  deleteLessonPlan: (lessonPlanId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage lesson plans from PostgreSQL
 */
export function useLessonPlansPostgreSQL(): UseLessonPlansPostgreSQLResult {
  const { schoolId } = useSchoolContext();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lesson plans
  const fetchData = useCallback(async (showLoading = false) => {
    if (!schoolId || schoolId === 'default') {
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on initial load, not on polling updates
      if (showLoading) {
        setLoading(true);
      }

      const data = await lessonPlansService.fetchLessonPlans(schoolId);
      setLessonPlans(data);
      setError(null);
    } catch (err) {
      console.error('[useLessonPlansPostgreSQL] Error fetching data:', err);
      setError('Failed to load lesson plans');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [schoolId]);

  // Initial fetch and polling
  useEffect(() => {
    // Initial fetch with loading indicator
    fetchData(true);

    // Poll every 30 seconds (silently, no loading indicator)
    const interval = setInterval(() => fetchData(false), 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // CRUD operations
  const addLessonPlan = useCallback(
    async (lessonPlan: Omit<LessonPlan, 'id' | 'schoolId'>) => {
      if (!schoolId) throw new Error('No school ID');

      const newLessonPlan = await lessonPlansService.addLessonPlan(
        schoolId,
        lessonPlan
      );

      // Optimistically update local state
      setLessonPlans(prev => [newLessonPlan, ...prev]);
    },
    [schoolId]
  );

  const updateLessonPlan = useCallback(
    async (lessonPlan: LessonPlan) => {
      await lessonPlansService.updateLessonPlan(lessonPlan);

      // Optimistically update local state
      setLessonPlans(prev =>
        prev.map(lp => (lp.id === lessonPlan.id ? lessonPlan : lp))
      );
    },
    []
  );

  const deleteLessonPlan = useCallback(
    async (lessonPlanId: string) => {
      await lessonPlansService.deleteLessonPlan(lessonPlanId);

      // Optimistically update local state
      setLessonPlans(prev => prev.filter(lp => lp.id !== lessonPlanId));
    },
    []
  );

  return {
    lessonPlans,
    loading,
    error,
    addLessonPlan,
    updateLessonPlan,
    deleteLessonPlan,
    refetch: () => fetchData(true) // Manual refetch shows loading
  };
}
