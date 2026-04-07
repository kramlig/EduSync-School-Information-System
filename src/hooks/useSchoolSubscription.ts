/**
 * useSchoolSubscription — Hook for institutional school subscription state.
 *
 * Returns current plan, limits, trial status, and capacity checks.
 * Memoized to prevent re-render loops (per copilot-instructions.md).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  getSchoolSubscription,
  getSchoolPlanLimits,
  isTrialExpired,
  trialDaysRemaining,
} from '../services/schoolSubscriptionService';
import type {
  SchoolSubscription,
  SchoolPlan,
  SchoolPlanLimits,
} from '../services/schoolSubscriptionService';
import { supabase } from '../lib/supabase';

interface SchoolSubscriptionState {
  loading: boolean;
  subscription: SchoolSubscription | null;
  plan: SchoolPlan;
  limits: SchoolPlanLimits;
  isTrialExpired: boolean;
  trialDaysLeft: number | null;
  /** Refresh subscription data */
  refresh: () => void;
}

interface UsageCounts {
  students: number;
  teachers: number;
  sections: number;
}

interface CapacityCheck {
  loading: boolean;
  usage: UsageCounts;
  canAddStudents: boolean;
  canAddTeachers: boolean;
  canAddSections: boolean;
  studentsRemaining: number;
  teachersRemaining: number;
  sectionsRemaining: number;
}

/**
 * Core subscription hook — fetches and caches the school subscription.
 */
export function useSchoolSubscription(): SchoolSubscriptionState {
  const { schoolId } = useSchoolContext();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!schoolId || schoolId === 'default') {
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const sub = await getSchoolSubscription(schoolId);
        if (!cancelled) setSubscription(sub);
      } catch (err) {
        console.error('[useSchoolSubscription] Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [schoolId, refreshCounter]);

  // Memoize to prevent infinite loops
  const plan: SchoolPlan = useMemo(
    () => subscription?.plan ?? 'trial',
    [subscription]
  );

  const limits = useMemo(
    () => getSchoolPlanLimits(plan),
    [plan]
  );

  const trialExpired = useMemo(
    () => isTrialExpired(subscription),
    [subscription]
  );

  const trialDaysLeft = useMemo(
    () => trialDaysRemaining(subscription),
    [subscription]
  );

  const refresh = useCallback(
    () => setRefreshCounter(c => c + 1),
    []
  );

  return useMemo(() => ({
    loading,
    subscription,
    plan,
    limits,
    isTrialExpired: trialExpired,
    trialDaysLeft: trialDaysLeft,
    refresh,
  }), [loading, subscription, plan, limits, trialExpired, trialDaysLeft, refresh]);
}

/**
 * Capacity check hook — queries current usage counts and compares to limits.
 * Use this before creating students, teachers, or sections.
 */
export function useSchoolCapacity(): CapacityCheck {
  const { schoolId } = useSchoolContext();
  const { limits, loading: subLoading } = useSchoolSubscription();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageCounts>({ students: 0, teachers: 0, sections: 0 });

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      if (!schoolId || schoolId === 'default') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [studentsRes, teachersRes, sectionsRes] = await Promise.all([
          supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .is('deleted_at', null),
          supabase
            .from('teachers')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .is('deleted_at', null),
          supabase
            .from('sections')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .is('deleted_at', null),
        ]);

        if (!cancelled) {
          setUsage({
            students: studentsRes.count ?? 0,
            teachers: teachersRes.count ?? 0,
            sections: sectionsRes.count ?? 0,
          });
        }
      } catch (err) {
        console.error('[useSchoolCapacity] Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCounts();
    return () => { cancelled = true; };
  }, [schoolId]);

  return useMemo(() => ({
    loading: loading || subLoading,
    usage,
    canAddStudents: usage.students < limits.maxStudents,
    canAddTeachers: usage.teachers < limits.maxTeachers,
    canAddSections: usage.sections < limits.maxSections,
    studentsRemaining: Math.max(0, limits.maxStudents - usage.students),
    teachersRemaining: Math.max(0, limits.maxTeachers - usage.teachers),
    sectionsRemaining: Math.max(0, limits.maxSections - usage.sections),
  }), [loading, subLoading, usage, limits]);
}
