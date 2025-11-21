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
import { supabase } from '../lib/supabase';
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
  // SchoolContextProvider mounted
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolIds, setSchoolIds] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // CRITICAL FIX: Instead of using Firebase Auth custom claims (which don't exist for anonymous auth),
    // read schoolId from the session stored in localStorage by the login flow.
    // This ensures multi-tenant isolation works with the current authentication architecture.
    
    const loadSchoolIdFromSession = async () => {
      try {
        const sessionStr = localStorage.getItem('edusync_session');
        if (!sessionStr) {
          console.log('[SchoolContext] No session found - clearing context');
          setSchoolId(null);
          setSchoolIds([]);
          setRole(null);
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }
        
        const session = JSON.parse(sessionStr);
        const user = session.user;
        
        if (!user) {
          console.log('[SchoolContext] Invalid session - clearing context');
          setSchoolId(null);
          setSchoolIds([]);
          setRole(null);
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }
        
        // Extract school data from the user object (comes from Firestore teacher/student/parent document)
        const userSchoolId = user.schoolId || null;
        const userSchoolIds = user.schoolIds || (userSchoolId ? [userSchoolId] : []);
        const userRole = user.role || null;
        const userIsSuperAdmin = user.isSuperAdmin || false;
        
        console.log('[SchoolContext] School context loaded from session:', {
          role: userRole,
          schoolId: userSchoolId,
          schoolIds: userSchoolIds,
          isSuperAdmin: userIsSuperAdmin,
        });
        
        setRole(userRole);
        setSchoolIds(userSchoolIds);
        setIsSuperAdmin(userIsSuperAdmin);
        
        // Set active schoolId
        // Priority: user.schoolId > first schoolIds > query PostgreSQL for default school
        // BUT: Replace "default" string with proper UUID from PostgreSQL
        if (userSchoolId && userSchoolId !== 'default') {
          console.log('[SchoolContext] Using user.schoolId:', userSchoolId);
          setSchoolId(userSchoolId);
        } else if (userSchoolIds.length > 0 && userSchoolIds[0] !== 'default') {
          console.log('[SchoolContext] Using user.schoolIds[0]:', userSchoolIds[0]);
          setSchoolId(userSchoolIds[0]);
        } else {
          // FALLBACK: Query PostgreSQL for the default school UUID
          console.warn('[SchoolContext] User schoolId is "default" or missing - fetching proper UUID from PostgreSQL');
          
          const { data: schools, error } = await supabase
            .from('schools')
            .select('id')
            .limit(1);
          
          console.log('[SchoolContext] PostgreSQL schools query result:', { schools, error });
          
          if (error || !schools || schools.length === 0) {
            console.error('[SchoolContext] Failed to fetch default school:', error);
            // Ultimate fallback - use 'default' string (will cause errors but at least visible)
            console.warn('[SchoolContext] ⚠️ Setting schoolId to "default" - PostgreSQL queries will fail!');
            setSchoolId('default');
          } else {
            const defaultSchoolId = schools[0].id;
            console.log('[SchoolContext] ✅ Using school UUID from PostgreSQL:', defaultSchoolId);
            setSchoolId(defaultSchoolId);
            
            // Update the session to use the proper UUID
            const updatedUser = { ...user, schoolId: defaultSchoolId };
            localStorage.setItem('edusync_session', JSON.stringify(updatedUser));
            console.log('[SchoolContext] ✅ Updated session with proper schoolId');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('[SchoolContext] Error loading session:', error);
        setSchoolId(null);
        setSchoolIds([]);
        setRole(null);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    };
    
    // Load immediately on mount
    loadSchoolIdFromSession();
    
    // Listen for storage changes (when login saves session to localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edusync_session' && e.newValue) {
        console.log('[SchoolContext] Session storage changed - reloading context');
        loadSchoolIdFromSession();
      }
    };
    
    // For same-window changes (storage event doesn't fire in same window)
    const handleCustomStorageChange = () => {
      console.log('[SchoolContext] Custom storage event - reloading context');
      loadSchoolIdFromSession();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('edusync-session-updated', handleCustomStorageChange);
    
    // Also subscribe to Firebase Auth state changes for logout detection
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
      
      // User logged in - reload from session
      setTimeout(() => loadSchoolIdFromSession(), 100); // Small delay to ensure localStorage is written
    });

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('edusync-session-updated', handleCustomStorageChange);
    };
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
