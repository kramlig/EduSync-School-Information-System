/**
 * Learning Areas Hook (PostgreSQL)
 * 
 * React hook for managing learning areas with PostgreSQL backend.
 * Provides real-time updates via polling and CRUD operations.
 * 
 * IMPORTANT: Memoized to prevent infinite render loops
 */

import { useState, useEffect, useCallback } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import type { LearningArea } from '../../types';
import {
  fetchLearningAreas,
  addLearningArea as addLearningAreaService,
  updateLearningArea as updateLearningAreaService,
  deleteLearningArea as deleteLearningAreaService,
  bulkDeleteLearningAreas as bulkDeleteLearningAreasService,
  fetchSchoolType,
  seedDefaultLearningAreas,
} from '../services/learningAreasServicePostgreSQL';

interface UseLearningAreasOptions {
  /**
   * Enable/disable automatic polling for updates
   * @default true
   */
  enablePolling?: boolean;
  
  /**
   * Polling interval in milliseconds
   * @default 30000 (30 seconds)
   */
  pollingInterval?: number;

  /**
   * Only show loading on initial fetch, not on polling updates
   * @default true
   */
  conditionalLoading?: boolean;
}

const DEFAULT_OPTIONS: UseLearningAreasOptions = {
  enablePolling: true,
  pollingInterval: 30000, // 30 seconds - learning areas change rarely
  conditionalLoading: true,
};

export function useLearningAreasPostgreSQL(options: UseLearningAreasOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { schoolId } = useSchoolContext();
  
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ==================== Fetch Learning Areas ====================
  
  const loadLearningAreas = useCallback(async (showLoading = true) => {
    if (!schoolId) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const areas = await fetchLearningAreas(schoolId);
      setLearningAreas(areas);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      console.error('[useLearningAreasPostgreSQL] Error fetching learning areas:', err);
      setError(err as Error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [schoolId, isInitialLoad]);

  // ==================== Initial Load ====================
  
  useEffect(() => {
    loadLearningAreas(true);
  }, [loadLearningAreas]);

  // ==================== Polling for Updates ====================
  
  useEffect(() => {
    if (!mergedOptions.enablePolling || !schoolId) return;

    const intervalId = setInterval(() => {
      // Silent update on poll - don't show loading spinner
      const showLoading = !mergedOptions.conditionalLoading;
      loadLearningAreas(showLoading);
    }, mergedOptions.pollingInterval);

    return () => clearInterval(intervalId);
  }, [mergedOptions.enablePolling, mergedOptions.pollingInterval, mergedOptions.conditionalLoading, schoolId, loadLearningAreas]);

  // ==================== CRUD Operations ====================

  /**
   * Add a new learning area
   */
  const addLearningAreaHandler = useCallback(
    async (areaData: Omit<LearningArea, 'id' | 'schoolId'>) => {
      if (!schoolId) throw new Error('School ID is required');

      try {
        const newArea = await addLearningAreaService(schoolId, areaData);
        setLearningAreas(prev => [...prev, newArea].sort((a, b) => (a.order || 0) - (b.order || 0)));
        return newArea;
      } catch (err) {
        console.error('[useLearningAreasPostgreSQL] Error adding learning area:', err);
        throw err;
      }
    },
    [schoolId]
  );

  /**
   * Update an existing learning area
   */
  const updateLearningAreaHandler = useCallback(
    async (areaId: string, updates: Partial<LearningArea>) => {
      try {
        const updatedArea = await updateLearningAreaService(areaId, updates);
        setLearningAreas(prev =>
          prev.map(area => (area.id === areaId ? updatedArea : area))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        );
        return updatedArea;
      } catch (err) {
        console.error('[useLearningAreasPostgreSQL] Error updating learning area:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Delete a learning area (soft delete)
   */
  const deleteLearningAreaHandler = useCallback(
    async (areaId: string) => {
      try {
        await deleteLearningAreaService(areaId);
        // Remove from local state after soft delete
        setLearningAreas(prev => prev.filter(area => area.id !== areaId));
      } catch (err) {
        console.error('[useLearningAreasPostgreSQL] Error deleting learning area:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Bulk delete learning areas (soft delete)
   */
  const bulkDeleteLearningAreasHandler = useCallback(
    async (areaIds: string[]) => {
      try {
        await bulkDeleteLearningAreasService(areaIds);
        // Remove from local state after bulk soft delete
        setLearningAreas(prev => prev.filter(area => !areaIds.includes(area.id)));
      } catch (err) {
        console.error('[useLearningAreasPostgreSQL] Error bulk deleting learning areas:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Manually refresh learning areas
   */
  const refresh = useCallback(() => {
    loadLearningAreas(true);
  }, [loadLearningAreas]);

  /**
   * Seed default DepEd learning areas based on school type
   */
  const seedDefaults = useCallback(async () => {
    if (!schoolId) throw new Error('School ID is required');
    try {
      setLoading(true);
      const schoolType = await fetchSchoolType(schoolId);
      const newAreas = await seedDefaultLearningAreas(schoolId, schoolType);
      setLearningAreas(newAreas.sort((a, b) => (a.order || 0) - (b.order || 0)));
      return newAreas;
    } catch (err) {
      console.error('[useLearningAreasPostgreSQL] Error seeding defaults:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  return {
    learningAreas,
    loading,
    error,
    addLearningArea: addLearningAreaHandler,
    updateLearningArea: updateLearningAreaHandler,
    deleteLearningArea: deleteLearningAreaHandler,
    bulkDeleteLearningAreas: bulkDeleteLearningAreasHandler,
    refresh,
    seedDefaults,
  };
}
