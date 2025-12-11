/**
 * useSchedulePostgreSQL Hook
 * 
 * React hook for managing class schedules with PostgreSQL backend.
 * Provides real-time data with 30-second polling and comprehensive error handling.
 * 
 * IMPORTANT: Memoize feature flags to prevent infinite render loops
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchClassSchedules,
  addClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
  checkScheduleConflict,
  getScheduleStatistics,
  ClassSchedule
} from '../services/scheduleServicePostgreSQL';

/**
 * Helper: Transform PostgreSQL snake_case to Firestore camelCase
 */
function transformToFirestore(schedule: ClassSchedule): any {
  return {
    id: schedule.id,
    schoolId: schedule.school_id,
    title: schedule.title,
    type: schedule.type,
    dayOfWeek: schedule.day_of_week,
    endDayOfWeek: schedule.end_day_of_week,
    startTime: schedule.start_time?.substring(0, 5) || '08:00', // "HH:MM:SS" -> "HH:MM"
    endTime: schedule.end_time?.substring(0, 5) || '09:00',
    scope: schedule.scope,
    sectionId: schedule.section_id,
    learningAreaId: schedule.learning_area_id,
    teacherId: schedule.teacher_id,
    gradeLevel: schedule.grade_level,
    room: schedule.room
  };
}

/**
 * Helper: Transform Firestore camelCase to PostgreSQL snake_case
 */
function transformToPostgres(schedule: any): any {
  if (!schedule) {
    console.error('[transformToPostgres] Schedule is undefined or null');
    return {};
  }
  
  return {
    school_id: schedule.schoolId || schedule.school_id,
    title: schedule.title,
    type: schedule.type,
    scope: schedule.scope,
    day_of_week: schedule.dayOfWeek || schedule.day_of_week,
    start_time: schedule.startTime || schedule.start_time,
    end_time: schedule.endTime || schedule.end_time,
    end_day_of_week: schedule.endDayOfWeek || schedule.end_day_of_week,
    section_id: schedule.sectionId || schedule.section_id,
    learning_area_id: schedule.learningAreaId || schedule.learning_area_id,
    teacher_id: schedule.teacherId || schedule.teacher_id,
    grade_level: schedule.gradeLevel || schedule.grade_level,
    room: schedule.room
  };
}

interface UseScheduleOptions {
  schoolId?: string;
  sectionId?: string;
  teacherId?: string;
  gradeLevel?: number;
  dayOfWeek?: ClassSchedule['day_of_week'];
  type?: 'academic' | 'extracurricular';
  scope?: 'section' | 'gradeLevel' | 'all';
  enablePolling?: boolean;
  pollingInterval?: number; // milliseconds (default: 30000)
}

interface UseScheduleReturn {
  schedules: ClassSchedule[];
  loading: boolean;
  error: Error | null;
  
  // CRUD operations
  addSchedule: (schedule: Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<ClassSchedule>;
  updateSchedule: (id: string, updates: Partial<ClassSchedule>) => Promise<ClassSchedule>;
  deleteSchedule: (id: string) => Promise<void>;
  
  // Utilities
  checkConflict: (schedule: Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>, excludeId?: string) => Promise<{ hasConflict: boolean; conflictReason?: string }>;
  refreshSchedules: () => Promise<void>;
  
  // Statistics
  statistics: {
    total: number;
    byType: { academic: number; extracurricular: number };
    byScope: { section: number; gradeLevel: number; all: number };
    byDay: Record<string, number>;
  } | null;
}

/**
 * Hook for managing class schedules with PostgreSQL
 */
export function useSchedulePostgreSQL(options: UseScheduleOptions = {}): UseScheduleReturn {
  const {
    schoolId,
    sectionId,
    teacherId,
    gradeLevel,
    dayOfWeek,
    type,
    scope,
    enablePolling = true,
    pollingInterval = 30000
  } = options;

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [statistics, setStatistics] = useState<UseScheduleReturn['statistics']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track errors to prevent console spam
  const errorCountRef = useRef(0);
  const lastErrorMessageRef = useRef<string>('');

  /**
   * Fetch schedules from PostgreSQL
   */
  const fetchSchedules = useCallback(async () => {
    console.log('[useSchedulePostgreSQL] 🔍 fetchSchedules called with:', { 
      schoolId, 
      sectionId, 
      teacherId, 
      gradeLevel,
      hasSchoolId: !!schoolId 
    });
    
    if (!schoolId) {
      console.warn('[useSchedulePostgreSQL] ⚠️ No schoolId provided, skipping fetch');
      console.trace('[useSchedulePostgreSQL] Stack trace for missing schoolId');
      setLoading(false);
      return;
    }

    try {
      const filters = {
        school_id: schoolId,
        ...(sectionId && { section_id: sectionId }),
        ...(teacherId && { teacher_id: teacherId }),
        ...(gradeLevel !== undefined && { grade_level: gradeLevel }),
        ...(dayOfWeek && { day_of_week: dayOfWeek }),
        ...(type && { type }),
        ...(scope && { scope })
      };

      const data = await fetchClassSchedules(filters);
      
      // Transform PostgreSQL data to match Firestore format
      // PostgreSQL returns TIME as "HH:MM:SS", but SchedulerView expects "HH:MM"
      const transformedData = data.map(schedule => ({
        ...schedule,
        // Convert snake_case to camelCase for Firestore compatibility
        id: schedule.id,
        schoolId: schedule.school_id,
        title: schedule.title,
        type: schedule.type,
        dayOfWeek: schedule.day_of_week,
        endDayOfWeek: schedule.end_day_of_week,
        startTime: schedule.start_time?.substring(0, 5) || '08:00', // "HH:MM:SS" -> "HH:MM"
        endTime: schedule.end_time?.substring(0, 5) || '09:00',
        scope: schedule.scope,
        sectionId: schedule.section_id,
        learningAreaId: schedule.learning_area_id,
        teacherId: schedule.teacher_id,
        gradeLevel: schedule.grade_level,
        room: schedule.room
      }));
      
      setSchedules(transformedData as any);
      
      // Reset error tracking on success
      errorCountRef.current = 0;
      lastErrorMessageRef.current = '';
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedules';
      
      // Only log error once to prevent spam
      if (lastErrorMessageRef.current !== errorMessage) {
        console.error('[useSchedulePostgreSQL] Error fetching schedules:', err);
        lastErrorMessageRef.current = errorMessage;
        errorCountRef.current = 1;
      } else {
        errorCountRef.current++;
      }
      
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [schoolId, sectionId, teacherId, gradeLevel, dayOfWeek, type, scope]);

  /**
   * Fetch schedule statistics
   */
  const fetchStatistics = useCallback(async () => {
    if (!schoolId) return;

    try {
      const stats = await getScheduleStatistics(schoolId);
      setStatistics(stats);
    } catch (err) {
      console.error('[useSchedulePostgreSQL] Error fetching statistics:', err);
    }
  }, [schoolId]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchSchedules();
    fetchStatistics();
  }, [fetchSchedules, fetchStatistics]);

  /**
   * Polling for real-time updates
   */
  useEffect(() => {
    if (!enablePolling || !schoolId) return;

    const interval = setInterval(() => {
      fetchSchedules();
      fetchStatistics();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, schoolId, pollingInterval, fetchSchedules, fetchStatistics]);

  /**
   * Add a new schedule
   */
  const addSchedule = useCallback(
    async (schedule: Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<ClassSchedule> => {
      try {
        if (!schoolId) {
          throw new Error('schoolId is required to add a schedule');
        }

        // Transform camelCase (Firestore format) to snake_case (PostgreSQL format)
        // Handle both Firestore format (camelCase) and PostgreSQL format (snake_case)
        const scheduleForPostgres: any = {
          school_id: schoolId,
          title: schedule.title,
          type: schedule.type,
          scope: schedule.scope,
          day_of_week: (schedule as any).dayOfWeek || (schedule as any).day_of_week,
          start_time: (schedule as any).startTime || (schedule as any).start_time,
          end_time: (schedule as any).endTime || (schedule as any).end_time,
          end_day_of_week: (schedule as any).endDayOfWeek || (schedule as any).end_day_of_week,
          section_id: (schedule as any).sectionId || (schedule as any).section_id,
          learning_area_id: (schedule as any).learningAreaId || (schedule as any).learning_area_id,
          teacher_id: (schedule as any).teacherId || (schedule as any).teacher_id,
          grade_level: (schedule as any).gradeLevel || (schedule as any).grade_level,
          room: (schedule as any).room
        };

        const newSchedule = await addClassSchedule(scheduleForPostgres);
        
        // Transform response back to camelCase (Firestore format)
        const transformedSchedule = {
          id: newSchedule.id,
          schoolId: newSchedule.school_id,
          title: newSchedule.title,
          type: newSchedule.type,
          dayOfWeek: newSchedule.day_of_week,
          endDayOfWeek: newSchedule.end_day_of_week,
          startTime: newSchedule.start_time?.substring(0, 5) || '08:00',
          endTime: newSchedule.end_time?.substring(0, 5) || '09:00',
          scope: newSchedule.scope,
          sectionId: newSchedule.section_id,
          learningAreaId: newSchedule.learning_area_id,
          teacherId: newSchedule.teacher_id,
          gradeLevel: newSchedule.grade_level,
          room: newSchedule.room
        };
        
        // Optimistic update
        setSchedules(prev => [...prev, transformedSchedule as any]);
        
        // Refresh data
        await Promise.all([fetchSchedules(), fetchStatistics()]);
        
        return transformedSchedule as any;
      } catch (err) {
        console.error('[useSchedulePostgreSQL] Error adding schedule:', err);
        throw err;
      }
    },
    [schoolId, fetchSchedules, fetchStatistics]
  );

  /**
   * Update an existing schedule
   */
  const updateSchedule = useCallback(
    async (id: string, updates: Partial<ClassSchedule>): Promise<ClassSchedule> => {
      try {
        console.log('[useSchedulePostgreSQL] 🔄 Updating schedule:', { id, updates });
        
        if (!updates || Object.keys(updates).length === 0) {
          throw new Error('No updates provided');
        }
        
        const updatesForPostgres = transformToPostgres(updates);
        console.log('[useSchedulePostgreSQL] Transformed updates:', updatesForPostgres);
        
        const updatedSchedule = await updateClassSchedule(id, updatesForPostgres);
        const transformedSchedule = transformToFirestore(updatedSchedule);
        
        // Optimistic update
        setSchedules(prev => prev.map(s => s.id === id ? transformedSchedule : s));
        await Promise.all([fetchSchedules(), fetchStatistics()]);
        
        return transformedSchedule;
      } catch (err) {
        console.error('[useSchedulePostgreSQL] Error updating schedule:', err);
        throw err;
      }
    },
    [fetchSchedules, fetchStatistics]
  );

  /**
   * Delete a schedule
   */
  const deleteSchedule = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteClassSchedule(id);
        
        // Optimistic update
        setSchedules(prev => prev.filter(s => s.id !== id));
        
        // Refresh data
        await Promise.all([fetchSchedules(), fetchStatistics()]);
      } catch (err) {
        console.error('[useSchedulePostgreSQL] Error deleting schedule:', err);
        throw err;
      }
    },
    [fetchSchedules, fetchStatistics]
  );

  /**
   * Check for schedule conflicts
   */
  const checkConflict = useCallback(
    async (
      schedule: Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
      excludeId?: string
    ): Promise<{ hasConflict: boolean; conflictReason?: string }> => {
      try {
        if (!schoolId) {
          throw new Error('schoolId is required to check conflicts');
        }

        const scheduleWithSchoolId = {
          ...schedule,
          school_id: schoolId
        };

        return await checkScheduleConflict(scheduleWithSchoolId, excludeId);
      } catch (err) {
        console.error('[useSchedulePostgreSQL] Error checking conflict:', err);
        throw err;
      }
    },
    [schoolId]
  );

  return {
    schedules,
    loading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    checkConflict,
    refreshSchedules: fetchSchedules,
    statistics
  };
}
