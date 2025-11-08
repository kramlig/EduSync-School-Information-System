/**
 * SchoolContext - Multi-Tenant School Isolation Context
 * 
 * CRITICAL: This context provides the current user's schoolId to all components.
 * All Firestore queries MUST use this schoolId to filter data and enforce 
 * multi-tenant isolation.
 * 
 * Purpose:
 * - Store current user's schoolId from custom claims
 * - Provide schoolId to all child components via context
 * - Enable school-scoped data filtering across the application
 * - Support multi-school users (teachers, admins with multiple schoolIds)
 * 
 * Migration Note:
 * This is Phase 1 Week 2 of the multi-tenant migration plan.
 * See: docs/architecture/MULTI_TENANT_MIGRATION_PLAN.md
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../services/firestoreService';
import type { User } from 'firebase/auth';

/**
 * SchoolContext Data Structure
 */
interface SchoolContextData {
  /**
   * Current active schoolId for the user
   * - For single-school users: their one schoolId
   * - For multi-school users: the currently selected schoolId
   * - null if user is not authenticated or has no school assignment
   */
  schoolId: string | null;
  
  /**
   * All schoolIds the user has access to
   * - For most users: single-item array with their one school
   * - For multi-school teachers/admins: array of all their schools
   * - Empty array if user has no school assignments
   */
  schoolIds: string[];
  
  /**
   * User's role from custom claims
   * - admin, principal, registrar, teacher, parent, student
   * - null if user is not authenticated or claims not loaded
   */
  role: string | null;
  
  /**
   * Whether the user is a super admin (cross-school access)
   * - Super admins can access all schools
   * - Used for system administration only
   */
  isSuperAdmin: boolean;
  
  /**
   * Loading state - true while fetching custom claims
   */
  loading: boolean;
  
  /**
   * Switch active school (for multi-school users)
   * @param schoolId - The schoolId to switch to (must be in schoolIds array)
   */
  setActiveSchool: (schoolId: string) => void;
}

/**
 * Default context value (used when no provider exists)
 */
const defaultContextValue: SchoolContextData = {
  schoolId: null,
  schoolIds: [],
  role: null,
  isSuperAdmin: false,
  loading: true,
  setActiveSchool: () => {
    console.warn('[SchoolContext] setActiveSchool called outside of SchoolContextProvider');
  },
};

/**
 * SchoolContext - React Context for school data
 */
const SchoolContext = createContext<SchoolContextData>(defaultContextValue);

/**
 * SchoolContextProvider Props
 */
interface SchoolContextProviderProps {
  children: ReactNode;
}

/**
 * SchoolContextProvider - Provider component for SchoolContext
 * 
 * Usage:
 * ```tsx
 * <SchoolContextProvider>
 *   <App />
 * </SchoolContextProvider>
 * ```
 * 
 * This provider:
 * 1. Listens to Firebase Auth state changes
 * 2. Fetches custom claims when user logs in
 * 3. Extracts schoolId, schoolIds, role from custom claims
 * 4. Makes this data available to all child components
 */
export const SchoolContextProvider: React.FC<SchoolContextProviderProps> = ({ children }) => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolIds, setSchoolIds] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        // User logged out - clear all school context
        console.log('[SchoolContext] User logged out - clearing context');
        setSchoolId(null);
        setSchoolIds([]);
        setRole(null);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's custom claims (contains schoolId, role, etc.)
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh
        const claims = idTokenResult.claims;

        console.log('[SchoolContext] Custom claims loaded:', {
          role: claims.role,
          schoolId: claims.schoolId,
          schoolIds: claims.schoolIds,
          isSuperAdmin: claims.isSuperAdmin,
        });

        // Extract school data from custom claims
        const userRole = (claims.role as string) || null;
        const userSchoolId = (claims.schoolId as string) || null;
        const userSchoolIds = (claims.schoolIds as string[]) || [];
        const userIsSuperAdmin = (claims.isSuperAdmin as boolean) || false;

        // Set context state
        setRole(userRole);
        setIsSuperAdmin(userIsSuperAdmin);
        setSchoolIds(userSchoolIds);
        
        // Set active schoolId
        // Priority: claims.schoolId > first schoolIds > null
        if (userSchoolId) {
          setSchoolId(userSchoolId);
        } else if (userSchoolIds.length > 0) {
          setSchoolId(userSchoolIds[0]);
        } else {
          setSchoolId(null);
          console.warn('[SchoolContext] User has no school assignment!', user.email);
        }

        setLoading(false);
      } catch (error) {
        console.error('[SchoolContext] Failed to load custom claims:', error);
        // On error, clear context but don't block app
        setSchoolId(null);
        setSchoolIds([]);
        setRole(null);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Switch active school (for multi-school users)
   */
  const setActiveSchool = (newSchoolId: string) => {
    if (!schoolIds.includes(newSchoolId)) {
      console.error('[SchoolContext] Cannot switch to school not in schoolIds:', newSchoolId);
      return;
    }

    console.log('[SchoolContext] Switching active school:', schoolId, '→', newSchoolId);
    setSchoolId(newSchoolId);
    
    // Persist active school to localStorage (for page refreshes)
    localStorage.setItem('edusync_active_school', newSchoolId);
  };

  // Restore active school from localStorage on mount (for multi-school users)
  useEffect(() => {
    if (schoolIds.length > 1 && schoolId === null) {
      const savedSchoolId = localStorage.getItem('edusync_active_school');
      if (savedSchoolId && schoolIds.includes(savedSchoolId)) {
        console.log('[SchoolContext] Restoring active school from localStorage:', savedSchoolId);
        setSchoolId(savedSchoolId);
      }
    }
  }, [schoolIds, schoolId]);

  const contextValue: SchoolContextData = {
    schoolId,
    schoolIds,
    role,
    isSuperAdmin,
    loading,
    setActiveSchool,
  };

  return (
    <SchoolContext.Provider value={contextValue}>
      {children}
    </SchoolContext.Provider>
  );
};

/**
 * useSchoolContext Hook - Access school context in components
 * 
 * Usage:
 * ```tsx
 * const { schoolId, role, isSuperAdmin } = useSchoolContext();
 * 
 * // Use schoolId in Firestore queries
 * const studentsQuery = query(
 *   collection(db, 'students'),
 *   where('schoolId', '==', schoolId)
 * );
 * ```
 * 
 * IMPORTANT: All components using Firestore queries MUST use this hook
 * to get the current schoolId and filter data appropriately.
 */
export const useSchoolContext = (): SchoolContextData => {
  const context = useContext(SchoolContext);
  
  if (context === defaultContextValue) {
    console.warn('[SchoolContext] useSchoolContext used outside SchoolContextProvider - using defaults');
  }
  
  return context;
};

export default SchoolContext;
