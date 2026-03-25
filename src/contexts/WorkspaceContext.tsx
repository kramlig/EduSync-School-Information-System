/**
 * WorkspaceContext — Provides workspace-awareness to the entire app.
 *
 * Wraps SchoolContext with personal-workspace concepts:
 *  • Is the user in a personal workspace or an institutional school?
 *  • What tier are they on (free / pro / school)?
 *  • What limits apply (students, sections, downloads)?
 *
 * Components that need tier gating import `useWorkspace()`.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useSchoolContext } from './SchoolContext';
import {
  getUserSubscription,
  getPersonalWorkspace,
  limitsFromSubscription,
} from '../services/personalWorkspaceService';
import type {
  WorkspaceLimits,
  Subscription,
  PersonalWorkspace,
  WorkspaceTier,
} from '../services/personalWorkspaceService';

// ─── Context shape ───────────────────────────────────────

interface WorkspaceContextData {
  /** True while subscription/workspace data is loading. */
  loading: boolean;
  /** Is this a personal workspace (vs. institutional school)? */
  isPersonal: boolean;
  /** Current tier: free | pro | school */
  tier: WorkspaceTier;
  /** Numeric limits for the current tier/subscription. */
  limits: WorkspaceLimits;
  /** Active subscription record (null for school-plan users or Tier 0). */
  subscription: Subscription | null;
  /** Personal workspace metadata (null for institutional). */
  workspace: PersonalWorkspace | null;
  /** Force a refetch of subscription/workspace data. */
  refresh: () => void;
}

const defaultValue: WorkspaceContextData = {
  loading: true,
  isPersonal: false,
  tier: 'school',
  limits: {
    tier: 'school',
    maxStudents: 99999,
    maxTeachingSections: 99999,
    maxAdvisorySections: 99999,
    maxDownloadsPerDay: 99999,
    isPersonal: false,
  },
  subscription: null,
  workspace: null,
  refresh: () => {},
};

const WorkspaceContext = createContext<WorkspaceContextData>(defaultValue);

// ─── Provider ────────────────────────────────────────────

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { schoolId } = useSchoolContext();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [workspace, setWorkspace] = useState<PersonalWorkspace | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        // Read session to get firebase UID
        const sessionStr = localStorage.getItem('edusync_session');
        if (!sessionStr) {
          setWorkspace(null);
          setSubscription(null);
          setLoading(false);
          return;
        }

        const session = JSON.parse(sessionStr);
        const firebaseUid = session.user?.firebaseUid || session.user?.firebase_uid;

        if (!firebaseUid) {
          // Institutional user — no personal workspace
          setWorkspace(null);
          setSubscription(null);
          setLoading(false);
          return;
        }

        const [ws, sub] = await Promise.all([
          getPersonalWorkspace(firebaseUid),
          getUserSubscription(firebaseUid),
        ]);

        if (!cancelled) {
          setWorkspace(ws);
          setSubscription(sub);
        }
      } catch (err) {
        console.error('[WorkspaceContext] Error loading workspace:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [schoolId, refreshCounter]);

  const isPersonal = workspace !== null;
  const tier: WorkspaceTier = isPersonal ? (subscription?.tier || 'free') : 'school';

  // Memoize to prevent infinite loops (per copilot-instructions.md)
  const limits = useMemo(
    () => limitsFromSubscription(subscription, isPersonal),
    [subscription, isPersonal]
  );

  const value = useMemo<WorkspaceContextData>(
    () => ({
      loading,
      isPersonal,
      tier,
      limits,
      subscription,
      workspace,
      refresh: () => setRefreshCounter(c => c + 1),
    }),
    [loading, isPersonal, tier, limits, subscription, workspace]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextData {
  return useContext(WorkspaceContext);
}

export default WorkspaceContext;
