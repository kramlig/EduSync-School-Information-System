/**
 * useSubstituteAssignmentsPostgreSQL Hook
 * 
 * React hook for managing substitute assignments with PostgreSQL backend.
 * Provides CRUD operations with polling for real-time updates.
 * 
 * IMPORTANT: Feature flag hooks should be memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  fetchSubstituteAssignments,
  addSubstituteAssignment as addAssignmentService,
  updateSubstituteAssignment as updateAssignmentService,
  deleteSubstituteAssignment as deleteAssignmentService,
  bulkDeleteSubstituteAssignments as bulkDeleteService,
  getSubstituteStatistics,
  checkScheduleConflicts,
  type SubstituteAssignmentExtended,
} from '../services/substituteServicePostgreSQL';

// ==================== Types ====================

interface UseSubstituteAssignmentsResult {
  // Data
  assignments: SubstituteAssignmentExtended[];
  loading: boolean;
  error: string | null;
  
  // Statistics
  stats: {
    total: number;
    active: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  
  // CRUD Operations
  addAssignment: (assignment: Omit<SubstituteAssignmentExtended, 'id' | 'schoolId'>) => Promise<SubstituteAssignmentExtended | null>;
  updateAssignment: (id: string, updates: Partial<SubstituteAssignmentExtended>) => Promise<SubstituteAssignmentExtended | null>;
  deleteAssignment: (id: string) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<{ deleted: number; failed: number }>;
  
  // Utilities
  checkConflicts: (teacherId: string, startDate: string, endDate: string, excludeId?: string) => Promise<SubstituteAssignmentExtended[]>;
  refetch: () => Promise<void>;
}

// ==================== Constants ====================

const POLLING_INTERVAL = 30000; // 30 seconds

// ==================== Hook Implementation ====================

export function useSubstituteAssignmentsPostgreSQL(): UseSubstituteAssignmentsResult {
  const { schoolId } = useSchoolContext();

  // State - must be in consistent order
  const [assignments, setAssignments] = useState<SubstituteAssignmentExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  // Refs - must be in consistent order
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const errorCountRef = useRef(0); // Track consecutive errors to prevent log spam

  // ==================== Fetch Functions ====================

  const fetchData = useCallback(async () => {
    if (!schoolId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      const [assignmentsData, statsData] = await Promise.all([
        fetchSubstituteAssignments(schoolId),
        getSubstituteStatistics(schoolId),
      ]);

      if (mountedRef.current) {
        setAssignments(assignmentsData);
        setStats(statsData);
        setError(null);
        errorCountRef.current = 0; // Reset error count on success
      }
    } catch (err) {
      if (mountedRef.current) {
        errorCountRef.current += 1;
        // Only log error once to prevent spam
        if (errorCountRef.current === 1) {
          const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
          setError(message);
          console.error('[useSubstituteAssignments] Fetch error:', err);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [schoolId]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // ==================== CRUD Operations ====================

  const addAssignment = useCallback(
    async (assignment: Omit<SubstituteAssignmentExtended, 'id' | 'schoolId'>): Promise<SubstituteAssignmentExtended | null> => {
      if (!schoolId) {
        setError('No school selected');
        return null;
      }

      try {
        const newAssignment = await addAssignmentService(schoolId, assignment);
        
        if (mountedRef.current) {
          setAssignments(prev => [newAssignment, ...prev]);
          // Update stats
          const newStats = await getSubstituteStatistics(schoolId);
          setStats(newStats);
        }
        
        return newAssignment;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add assignment';
        if (mountedRef.current) {
          setError(message);
        }
        console.error('[useSubstituteAssignments] Add error:', err);
        return null;
      }
    },
    [schoolId]
  );

  const updateAssignment = useCallback(
    async (id: string, updates: Partial<SubstituteAssignmentExtended>): Promise<SubstituteAssignmentExtended | null> => {
      if (!schoolId) {
        setError('No school selected');
        return null;
      }

      try {
        const updated = await updateAssignmentService(id, schoolId, updates);
        
        if (mountedRef.current) {
          setAssignments(prev =>
            prev.map(a => (a.id === id ? updated : a))
          );
          // Update stats
          const newStats = await getSubstituteStatistics(schoolId);
          setStats(newStats);
        }
        
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update assignment';
        if (mountedRef.current) {
          setError(message);
        }
        console.error('[useSubstituteAssignments] Update error:', err);
        return null;
      }
    },
    [schoolId]
  );

  const deleteAssignment = useCallback(
    async (id: string): Promise<boolean> => {
      if (!schoolId) {
        setError('No school selected');
        return false;
      }

      try {
        await deleteAssignmentService(id, schoolId);
        
        if (mountedRef.current) {
          setAssignments(prev => prev.filter(a => a.id !== id));
          // Update stats
          const newStats = await getSubstituteStatistics(schoolId);
          setStats(newStats);
        }
        
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete assignment';
        if (mountedRef.current) {
          setError(message);
        }
        console.error('[useSubstituteAssignments] Delete error:', err);
        return false;
      }
    },
    [schoolId]
  );

  const bulkDelete = useCallback(
    async (ids: string[]): Promise<{ deleted: number; failed: number }> => {
      if (!schoolId) {
        setError('No school selected');
        return { deleted: 0, failed: ids.length };
      }

      try {
        const result = await bulkDeleteService(ids, schoolId);
        
        if (mountedRef.current && result.deleted > 0) {
          setAssignments(prev => prev.filter(a => !ids.includes(a.id)));
          // Update stats
          const newStats = await getSubstituteStatistics(schoolId);
          setStats(newStats);
        }
        
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to bulk delete';
        if (mountedRef.current) {
          setError(message);
        }
        console.error('[useSubstituteAssignments] Bulk delete error:', err);
        return { deleted: 0, failed: ids.length };
      }
    },
    [schoolId]
  );

  // ==================== Utilities ====================

  const checkConflicts = useCallback(
    async (
      teacherId: string,
      startDate: string,
      endDate: string,
      excludeId?: string
    ): Promise<SubstituteAssignmentExtended[]> => {
      if (!schoolId) return [];

      try {
        return await checkScheduleConflicts(schoolId, teacherId, startDate, endDate, excludeId);
      } catch (err) {
        console.error('[useSubstituteAssignments] Conflict check error:', err);
        return [];
      }
    },
    [schoolId]
  );

  // ==================== Effects ====================

  // Initial fetch and polling setup
  useEffect(() => {
    mountedRef.current = true;
    
    // Only fetch if we have a schoolId
    if (schoolId) {
      fetchData();
    } else {
      setLoading(false);
    }

    // Setup polling - only poll if no error and we have schoolId
    pollingRef.current = setInterval(() => {
      if (mountedRef.current && schoolId && !error) {
        fetchData();
      }
    }, POLLING_INTERVAL);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [schoolId]); // Remove fetchData from deps to prevent re-creation

  return {
    assignments,
    loading,
    error,
    stats,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    bulkDelete,
    checkConflicts,
    refetch,
  };
}

export default useSubstituteAssignmentsPostgreSQL;
