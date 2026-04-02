/**
 * useECR - React Hook for Electronic Class Record
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * Provides:
 * - Class record loading with real-time updates
 * - Activity CRUD operations
 * - Score entry with optimistic updates
 * - Grade computation triggers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ECRService } from '../services/ecrService';
import type {
  ECRActivity,
  ECRClassRecord,
  ECRActivityType,
  ECRQuarter,
  CreateECRActivityRequest,
  UpdateECRActivityRequest,
  BulkScoreEntry
} from '../types/ecr.types';

// ============================================
// Types
// ============================================

interface UseECROptions {
  sectionId: string;
  learningAreaId: string;
  schoolYear: string;
  quarter: ECRQuarter;
  teacherId: string;
  schoolId: string;
}

interface UseECRReturn {
  // Data
  classRecord: ECRClassRecord | null;
  loading: boolean;
  error: string | null;
  
  // Activity operations
  createActivity: (request: Omit<CreateECRActivityRequest, 'sectionId' | 'learningAreaId' | 'schoolYear' | 'quarter'>) => Promise<ECRActivity | null>;
  updateActivity: (activityId: string, updates: UpdateECRActivityRequest) => Promise<boolean>;
  deleteActivity: (activityId: string) => Promise<boolean>;
  
  // Score operations
  saveScore: (activityId: string, studentId: string, score: number | null, remarks?: string) => Promise<boolean>;
  saveScoresBulk: (activityId: string, scores: BulkScoreEntry[]) => Promise<boolean>;
  
  // Grade operations
  recomputeGrades: (studentId: string) => Promise<boolean>;
  recomputeAllGrades: () => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

// ============================================
// Main Hook
// ============================================

export function useECR(options: UseECROptions): UseECRReturn {
  const { sectionId, learningAreaId, schoolYear, quarter, teacherId: rawTeacherId, schoolId } = options;

  // Resolve teacherId from session if undefined (personal workspace edge case)
  const [resolvedTeacherId, setResolvedTeacherId] = useState<string>(rawTeacherId || '');
  useEffect(() => {
    if (rawTeacherId) {
      setResolvedTeacherId(rawTeacherId);
      return;
    }
    if (!schoolId) return;
    // Fallback: look up teacher from school
    console.warn('[useECR] teacherId is empty, resolving from school:', schoolId);
    supabase
      .from('teachers')
      .select('id')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.id) {
          console.log('[useECR] Resolved teacherId:', data.id);
          setResolvedTeacherId(data.id);
        }
      });
  }, [rawTeacherId, schoolId]);

  const teacherId = resolvedTeacherId;
  
  const [classRecord, setClassRecord] = useState<ECRClassRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize options to prevent infinite loops
  const optionsKey = useMemo(
    () => `${sectionId}-${learningAreaId}-${schoolYear}-${quarter}`,
    [sectionId, learningAreaId, schoolYear, quarter]
  );

  // Load class record
  const loadClassRecord = useCallback(async () => {
    if (!sectionId || !learningAreaId || !schoolYear || !quarter) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await ECRService.getClassRecord(sectionId, learningAreaId, schoolYear, quarter);
      setClassRecord(data);
    } catch (err) {
      console.error('[useECR] Error loading class record:', err);
      setError(err instanceof Error ? err.message : 'Failed to load class record');
    } finally {
      setLoading(false);
    }
  }, [sectionId, learningAreaId, schoolYear, quarter]);

  // Initial load and subscription
  useEffect(() => {
    loadClassRecord();

    // Subscribe to activity changes
    const activitiesChannel = supabase
      .channel(`ecr_activities_${optionsKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ecr_activities',
          filter: `section_id=eq.${sectionId}`
        },
        () => {
          // Reload class record when activities change
          loadClassRecord();
        }
      )
      .subscribe();

    // Removed ecr_scores realtime subscription — scores don't have section_id column,
    // so unfiltered listening was causing excessive egress. Score updates are handled
    // via optimistic UI updates. Manual refresh via loadClassRecord() when needed.

    return () => {
      supabase.removeChannel(activitiesChannel);
    };
  }, [optionsKey, loadClassRecord, sectionId]);

  // Activity operations
  const createActivity = useCallback(
    async (request: Omit<CreateECRActivityRequest, 'sectionId' | 'learningAreaId' | 'schoolYear' | 'quarter'>) => {
      try {
        const fullRequest: CreateECRActivityRequest = {
          ...request,
          sectionId,
          learningAreaId,
          schoolYear,
          quarter
        };
        
        const activity = await ECRService.createActivity(schoolId, teacherId, fullRequest);
        
        if (activity) {
          // Optimistic update - avoid duplicates
          setClassRecord(prev => {
            if (!prev) return prev;
            const activities = { ...prev.activities };
            const key = activity.activityType.toLowerCase() as 'ww' | 'pt' | 'qa';
            // Only add if not already present
            if (!activities[key].some(a => a.id === activity.id)) {
              activities[key] = [...activities[key], activity];
            }
            return { ...prev, activities };
          });
        }
        
        return activity;
      } catch (err) {
        console.error('[useECR] Error creating activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to create activity');
        return null;
      }
    },
    [sectionId, learningAreaId, schoolYear, quarter, schoolId, teacherId]
  );

  const updateActivity = useCallback(
    async (activityId: string, updates: UpdateECRActivityRequest) => {
      try {
        const updated = await ECRService.updateActivity(activityId, updates);
        if (updated) {
          await loadClassRecord();
        }
        return !!updated;
      } catch (err) {
        console.error('[useECR] Error updating activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to update activity');
        return false;
      }
    },
    [loadClassRecord]
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      try {
        const success = await ECRService.deleteActivity(activityId);
        if (success) {
          await loadClassRecord();
        }
        return success;
      } catch (err) {
        console.error('[useECR] Error deleting activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete activity');
        return false;
      }
    },
    [loadClassRecord]
  );

  // Score operations
  const saveScore = useCallback(
    async (activityId: string, studentId: string, score: number | null, remarks?: string) => {
      try {
        const saved = await ECRService.saveScore(activityId, studentId, score, teacherId, 'graded', remarks);
        
        if (saved) {
          // Optimistic update with recomputation
          setClassRecord(prev => {
            if (!prev) return prev;
            
            const transmute = (pct: number) => {
              if (pct <= 0) return 60;
              if (pct >= 100) return 100;
              return Math.round((60 + pct * 0.4) * 100) / 100;
            };

            const students = prev.students.map(s => {
              if (s.studentId !== studentId) return s;
              
              const updatedScores = { ...s.scores, [activityId]: saved };
              
              // Recompute totals from raw scores
              const computeComp = (acts: typeof prev.activities.ww) => {
                let total = 0, max = 0;
                for (const act of acts) {
                  const sc = updatedScores[act.id];
                  if (sc && sc.rawScore != null) {
                    total += sc.rawScore;
                    max += act.maxScore;
                  }
                }
                const pct = max > 0 ? (total / max) * 100 : 0;
                return { total, max, pct, transmuted: transmute(pct) };
              };

              const ww = computeComp(prev.activities.ww);
              const pt = computeComp(prev.activities.pt);
              const qa = computeComp(prev.activities.qa);

              const wwWtd = Math.round(ww.transmuted * prev.weights.ww / 100 * 100) / 100;
              const ptWtd = Math.round(pt.transmuted * prev.weights.pt / 100 * 100) / 100;
              const qaWtd = Math.round(qa.transmuted * prev.weights.qa / 100 * 100) / 100;

              return {
                ...s,
                scores: updatedScores,
                wwTotal: ww.total, wwMax: ww.max, wwPercentage: ww.pct, wwTransmuted: ww.transmuted,
                ptTotal: pt.total, ptMax: pt.max, ptPercentage: pt.pct, ptTransmuted: pt.transmuted,
                qaTotal: qa.total, qaMax: qa.max, qaPercentage: qa.pct, qaTransmuted: qa.transmuted,
                wwWeighted: wwWtd, ptWeighted: ptWtd, qaWeighted: qaWtd,
                quarterlyGrade: Math.round(wwWtd + ptWtd + qaWtd)
              };
            });
            
            return { ...prev, students };
          });
        }
        
        return !!saved;
      } catch (err) {
        console.error('[useECR] Error saving score:', err);
        setError(err instanceof Error ? err.message : 'Failed to save score');
        return false;
      }
    },
    [teacherId]
  );

  const saveScoresBulk = useCallback(
    async (activityId: string, scores: BulkScoreEntry[]) => {
      try {
        const success = await ECRService.saveScoresBulk(activityId, scores, teacherId);
        if (success) {
          await loadClassRecord();
        }
        return success;
      } catch (err) {
        console.error('[useECR] Error bulk saving scores:', err);
        setError(err instanceof Error ? err.message : 'Failed to save scores');
        return false;
      }
    },
    [teacherId, loadClassRecord]
  );

  // Grade operations
  const recomputeGrades = useCallback(
    async (studentId: string) => {
      try {
        const result = await ECRService.computeStudentGrades(
          studentId,
          sectionId,
          learningAreaId,
          schoolYear,
          quarter
        );
        
        if (result) {
          await loadClassRecord();
        }
        
        return !!result;
      } catch (err) {
        console.error('[useECR] Error recomputing grades:', err);
        setError(err instanceof Error ? err.message : 'Failed to compute grades');
        return false;
      }
    },
    [sectionId, learningAreaId, schoolYear, quarter, loadClassRecord]
  );

  const recomputeAllGrades = useCallback(async () => {
    if (!classRecord) return false;
    
    try {
      const promises = classRecord.students.map(s =>
        ECRService.computeStudentGrades(
          s.studentId,
          sectionId,
          learningAreaId,
          schoolYear,
          quarter
        )
      );
      
      await Promise.all(promises);
      await loadClassRecord();
      return true;
    } catch (err) {
      console.error('[useECR] Error recomputing all grades:', err);
      setError(err instanceof Error ? err.message : 'Failed to compute grades');
      return false;
    }
  }, [classRecord, sectionId, learningAreaId, schoolYear, quarter, loadClassRecord]);

  return {
    classRecord,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    saveScore,
    saveScoresBulk,
    recomputeGrades,
    recomputeAllGrades,
    refresh: loadClassRecord
  };
}

// ============================================
// Helper Hooks
// ============================================

/**
 * Hook for managing ECR activity modals
 */
export function useECRActivityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ECRActivity | null>(null);
  const [activityType, setActivityType] = useState<ECRActivityType>('WW');
  const [presetActivityNumber, setPresetActivityNumber] = useState<number | undefined>(undefined);

  const openCreate = useCallback((type: ECRActivityType, activityNumber?: number) => {
    setActivityType(type);
    setEditingActivity(null);
    setPresetActivityNumber(activityNumber);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((activity: ECRActivity) => {
    setActivityType(activity.activityType);
    setEditingActivity(activity);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingActivity(null);
    setPresetActivityNumber(undefined);
  }, []);

  return {
    isOpen,
    editingActivity,
    activityType,
    isEditing: !!editingActivity,
    presetActivityNumber,
    openCreate,
    openEdit,
    close
  };
}

/**
 * Hook for managing selected quarter
 */
export function useQuarterSelector(defaultQuarter: ECRQuarter = 'Q1') {
  const [quarter, setQuarter] = useState<ECRQuarter>(defaultQuarter);

  const quarters = useMemo(
    () => [
      { value: 'Q1' as ECRQuarter, label: 'Quarter 1' },
      { value: 'Q2' as ECRQuarter, label: 'Quarter 2' },
      { value: 'Q3' as ECRQuarter, label: 'Quarter 3' },
      { value: 'Q4' as ECRQuarter, label: 'Quarter 4' }
    ],
    []
  );

  return {
    quarter,
    setQuarter,
    quarters
  };
}

export default useECR;
