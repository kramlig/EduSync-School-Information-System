/**
 * DivisionContext - Division-Level Access Context
 * 
 * This context provides division-level user data and permissions to components.
 * It enables DepEd Division personnel to access aggregated data across multiple
 * schools within their assigned division.
 * 
 * Features:
 * - Detects if the logged-in user is a division user
 * - Provides division and user data
 * - Lists accessible schools based on role and assignments
 * - Provides permission checking utilities
 * - Supports school selection for filtering
 * 
 * Usage:
 * ```tsx
 * const { 
 *   isDivisionUser, 
 *   division, 
 *   accessibleSchools,
 *   hasPermission 
 * } = useDivisionContext();
 * 
 * if (isDivisionUser) {
 *   // Show division-level dashboard
 * }
 * ```
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by context object reference changes.
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 * @see src/types/division.ts
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  ReactNode 
} from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../services/firestoreService';
import type { User } from 'firebase/auth';
import type {
  Division,
  DivisionUser,
  DivisionContextData,
  SchoolSummary,
  ModulePermissions,
  PermissionAction,
} from '../types/division';

// =====================================================
// HELPER: Get current school year
// =====================================================

const getCurrentSchoolYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  // Philippine school year starts in August
  // If we're in Jan-July, we're in the second half of SY (previous year - current year)
  // If we're in Aug-Dec, we're in the first half of SY (current year - next year)
  if (month < 7) { // Jan (0) to July (6)
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
};

const getAvailableSchoolYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  // Provide current SY plus 2 previous years
  return [
    `${currentYear}-${currentYear + 1}`,     // Current or upcoming
    `${currentYear - 1}-${currentYear}`,     // Previous
    `${currentYear - 2}-${currentYear - 1}`, // 2 years ago
  ];
};

// =====================================================
// HELPER: Get current quarter
// =====================================================

const getCurrentQuarter = (): 'Q1' | 'Q2' | 'Q3' | 'Q4' => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  
  // Philippine school year: Aug-Oct=Q1, Nov-Jan=Q2, Feb-Apr=Q3, May-Jul=Q4
  if (month >= 7 && month <= 9) return 'Q1';  // Aug, Sep, Oct
  if (month >= 10 || month === 0) return 'Q2'; // Nov, Dec, Jan
  if (month >= 1 && month <= 3) return 'Q3';   // Feb, Mar, Apr
  return 'Q4'; // May, Jun, Jul
};

// =====================================================
// DEFAULT CONTEXT VALUE
// =====================================================

const defaultContextValue: DivisionContextData = {
  divisionUser: null,
  division: null,
  isDivisionUser: false,
  accessibleSchools: [],
  availableDistricts: [],
  selectedDistrict: null,
  selectedSchoolId: null,
  filteredSchools: [],
  schoolYear: getCurrentSchoolYear(),
  availableSchoolYears: getAvailableSchoolYears(),
  quarter: getCurrentQuarter(),
  loading: true,
  error: null,
  selectDistrict: () => {
    console.warn('[DivisionContext] selectDistrict called outside of DivisionContextProvider');
  },
  selectSchool: () => {
    console.warn('[DivisionContext] selectSchool called outside of DivisionContextProvider');
  },
  setSchoolYear: () => {
    console.warn('[DivisionContext] setSchoolYear called outside of DivisionContextProvider');
  },
  setQuarter: () => {
    console.warn('[DivisionContext] setQuarter called outside of DivisionContextProvider');
  },
  refreshSchools: async () => {
    console.warn('[DivisionContext] refreshSchools called outside of DivisionContextProvider');
  },
  refreshData: async () => {
    console.warn('[DivisionContext] refreshData called outside of DivisionContextProvider');
  },
  hasPermission: () => false,
  canAccessSchool: () => false,
};

// =====================================================
// CONTEXT
// =====================================================

const DivisionContext = createContext<DivisionContextData>(defaultContextValue);

// =====================================================
// PROVIDER PROPS
// =====================================================

interface DivisionContextProviderProps {
  children: ReactNode;
}

// =====================================================
// PROVIDER COMPONENT
// =====================================================

/**
 * DivisionContextProvider - Provider component for DivisionContext
 * 
 * This provider:
 * 1. Listens to Firebase Auth state changes
 * 2. Checks if user exists in division_users table
 * 3. Fetches division and accessible schools
 * 4. Provides permission utilities
 */
export const DivisionContextProvider: React.FC<DivisionContextProviderProps> = ({ children }) => {
  // State
  const [divisionUser, setDivisionUser] = useState<DivisionUser | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [accessibleSchools, setAccessibleSchools] = useState<SchoolSummary[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // School year state - persisted in localStorage
  const [schoolYear, setSchoolYearState] = useState<string>(() => {
    // Try to restore from localStorage, otherwise use current SY
    const stored = localStorage.getItem('division_school_year');
    const available = getAvailableSchoolYears();
    if (stored && available.includes(stored)) {
      return stored;
    }
    return getCurrentSchoolYear();
  });
  
  // Quarter state - persisted in localStorage
  const [quarter, setQuarterState] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(() => {
    const stored = localStorage.getItem('division_quarter') as 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
    if (stored && ['Q1', 'Q2', 'Q3', 'Q4'].includes(stored)) {
      return stored;
    }
    return getCurrentQuarter();
  });
  
  // Available school years
  const availableSchoolYears = useMemo(() => getAvailableSchoolYears(), []);
  
  // Derive unique districts from accessible schools
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    accessibleSchools.forEach(school => {
      if (school.district) {
        districts.add(school.district);
      }
    });
    return Array.from(districts).sort();
  }, [accessibleSchools]);
  
  // Filter schools by selected district
  const filteredSchools = useMemo(() => {
    if (!selectedDistrict) return accessibleSchools;
    return accessibleSchools.filter(s => s.district === selectedDistrict);
  }, [accessibleSchools, selectedDistrict]);
  
  // Setter that also persists to localStorage
  const setSchoolYear = useCallback((sy: string) => {
    setSchoolYearState(sy);
    localStorage.setItem('division_school_year', sy);
  }, []);
  
  // Quarter setter that also persists to localStorage
  const setQuarter = useCallback((q: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setQuarterState(q);
    localStorage.setItem('division_quarter', q);
  }, []);

  // =====================================================
  // FETCH DIVISION USER
  // =====================================================

  const fetchDivisionUser = useCallback(async (firebaseUid: string): Promise<DivisionUser | null> => {
    try {
      console.log('[DivisionContext] Fetching division user for Firebase UID:', firebaseUid);
      
      const { data, error: fetchError } = await supabase
        .from('division_users')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors on no results

      if (fetchError) {
        // Log full error details for debugging
        console.error('[DivisionContext] Error fetching division user:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
        });
        
        // 406 Not Acceptable often means RLS issue or missing headers
        if (fetchError.code === '406' || fetchError.message?.includes('406')) {
          console.error('[DivisionContext] 406 Error - Check if RLS is disabled on division_users table');
        }
        
        return null;
      }

      if (!data) {
        console.log('[DivisionContext] User is not a division user (no record found)');
        return null;
      }

      console.log('[DivisionContext] Division user found:', data.name, data.role);
      return data as DivisionUser;
    } catch (err) {
      console.error('[DivisionContext] Exception fetching division user:', err);
      return null;
    }
  }, []);

  // =====================================================
  // FETCH DIVISION
  // =====================================================

  const fetchDivision = useCallback(async (divisionId: string): Promise<Division | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('divisions')
        .select('*')
        .eq('id', divisionId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        console.error('[DivisionContext] Error fetching division:', fetchError);
        return null;
      }

      return data as Division;
    } catch (err) {
      console.error('[DivisionContext] Exception fetching division:', err);
      return null;
    }
  }, []);

  // =====================================================
  // FETCH ACCESSIBLE SCHOOLS
  // =====================================================

  const fetchAccessibleSchools = useCallback(async (user: DivisionUser): Promise<SchoolSummary[]> => {
    try {
      // Join districts table to get the district name
      let query = supabase
        .from('schools')
        .select(`
          id, 
          name, 
          school_id_number, 
          address, 
          principal_name,
          district_id,
          districts:district_id (
            id,
            name
          )
        `)
        .is('deleted_at', null)
        .order('name');

      // If user has specific school IDs assigned, filter to those
      if (user.accessible_school_ids && user.accessible_school_ids.length > 0) {
        query = query.in('id', user.accessible_school_ids);
      } 
      // If PSDS with assigned district(s)
      else if (user.role === 'psds') {
        if (user.assigned_district_ids && user.assigned_district_ids.length > 0) {
          query = query.in('district_id', user.assigned_district_ids);
        } else if (user.assigned_district_id) {
          query = query.eq('district_id', user.assigned_district_id);
        } else {
          // PSDS without district - no schools
          return [];
        }
      }
      // Default: All schools in the division
      else {
        query = query.eq('division_id', user.division_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[DivisionContext] Error fetching accessible schools:', fetchError);
        return [];
      }

      // Transform data to include district name from the joined districts table
      const schools: SchoolSummary[] = (data || []).map((school: any) => ({
        id: school.id,
        name: school.name,
        school_id_number: school.school_id_number,
        address: school.address,
        principal_name: school.principal_name,
        // Use the district name from the joined districts table
        district: school.districts?.name || null,
      }));

      return schools;
    } catch (err) {
      console.error('[DivisionContext] Exception fetching accessible schools:', err);
      return [];
    }
  }, []);

  // =====================================================
  // LOAD DIVISION DATA
  // =====================================================

  const loadDivisionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current Firebase user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('[DivisionContext] No Firebase user - clearing division context');
        setDivisionUser(null);
        setDivision(null);
        setAccessibleSchools([]);
        setSelectedSchoolId(null);
        setLoading(false);
        return;
      }

      // Check if user is a division user
      const user = await fetchDivisionUser(currentUser.uid);
      
      if (!user) {
        // Not a division user - clear context
        setDivisionUser(null);
        setDivision(null);
        setAccessibleSchools([]);
        setSelectedSchoolId(null);
        setLoading(false);
        return;
      }

      console.log('[DivisionContext] Division user found:', user.name, user.role);
      setDivisionUser(user);

      // Fetch division details
      const divisionData = await fetchDivision(user.division_id);
      if (divisionData) {
        console.log('[DivisionContext] Division loaded:', divisionData.name);
        setDivision(divisionData);
      }

      // Fetch accessible schools
      const schools = await fetchAccessibleSchools(user);
      console.log('[DivisionContext] Accessible schools:', schools.length);
      setAccessibleSchools(schools);

      // Restore selected school from localStorage
      const savedSchoolId = localStorage.getItem('edusync_division_selected_school');
      if (savedSchoolId && schools.some(s => s.id === savedSchoolId)) {
        setSelectedSchoolId(savedSchoolId);
      }

      setLoading(false);
    } catch (err) {
      console.error('[DivisionContext] Error loading division data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load division data');
      setLoading(false);
    }
  }, [fetchDivisionUser, fetchDivision, fetchAccessibleSchools]);

  // =====================================================
  // AUTH STATE LISTENER
  // =====================================================

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;

    const doLoad = async () => {
      if (hasLoaded) return;
      hasLoaded = true;
      
      // Only load if component is still mounted
      if (isMounted) {
        await loadDivisionData();
      }
    };

    // Load immediately
    doLoad();

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (!isMounted) return;
      
      if (!user) {
        console.log('[DivisionContext] User logged out - clearing context');
        setDivisionUser(null);
        setDivision(null);
        setAccessibleSchools([]);
        setSelectedSchoolId(null);
        setLoading(false);
        return;
      }

      // User logged in - reload (but only if we haven't loaded yet for this user)
      if (!hasLoaded) {
        doLoad();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run once on mount

  // =====================================================
  // ACTIONS
  // =====================================================

  /**
   * Select a district for filtering (or null for all districts)
   * When a district is selected, clear the school selection if it's not in that district
   */
  const selectDistrict = useCallback((district: string | null) => {
    setSelectedDistrict(district);
    
    // If selecting a district, check if current school is in that district
    if (district && selectedSchoolId) {
      const currentSchool = accessibleSchools.find(s => s.id === selectedSchoolId);
      if (currentSchool && currentSchool.district !== district) {
        // Clear school selection since it's not in the selected district
        setSelectedSchoolId(null);
        localStorage.removeItem('edusync_division_selected_school');
      }
    }

    // Persist to localStorage
    if (district) {
      localStorage.setItem('edusync_division_selected_district', district);
    } else {
      localStorage.removeItem('edusync_division_selected_district');
    }
  }, [accessibleSchools, selectedSchoolId]);

  /**
   * Select a school for filtering (or null for all schools)
   */
  const selectSchool = useCallback((schoolId: string | null) => {
    if (schoolId && !accessibleSchools.some(s => s.id === schoolId)) {
      console.warn('[DivisionContext] Cannot select inaccessible school:', schoolId);
      return;
    }

    setSelectedSchoolId(schoolId);
    
    // If selecting a school, also set its district
    if (schoolId) {
      const school = accessibleSchools.find(s => s.id === schoolId);
      if (school?.district && school.district !== selectedDistrict) {
        setSelectedDistrict(school.district);
        localStorage.setItem('edusync_division_selected_district', school.district);
      }
    }

    // Persist to localStorage
    if (schoolId) {
      localStorage.setItem('edusync_division_selected_school', schoolId);
    } else {
      localStorage.removeItem('edusync_division_selected_school');
    }
  }, [accessibleSchools, selectedDistrict]);

  /**
   * Refresh accessible schools list
   */
  const refreshSchools = useCallback(async () => {
    if (!divisionUser) return;

    const schools = await fetchAccessibleSchools(divisionUser);
    setAccessibleSchools(schools);
  }, [divisionUser, fetchAccessibleSchools]);

  /**
   * Refresh all division data (division, user, schools)
   */
  const refreshData = useCallback(async () => {
    await loadDivisionData();
  }, [loadDivisionData]);

  // =====================================================
  // PERMISSION HELPERS
  // =====================================================

  /**
   * Check if user has permission for a module/action
   */
  const hasPermission = useCallback((
    module: keyof ModulePermissions, 
    action: PermissionAction
  ): boolean => {
    if (!divisionUser || !divisionUser.permissions) {
      return false;
    }

    const modulePermissions = divisionUser.permissions[module];
    if (!modulePermissions) {
      return false;
    }

    return modulePermissions.includes(action);
  }, [divisionUser]);

  /**
   * Check if user can access a specific school
   */
  const canAccessSchool = useCallback((schoolId: string): boolean => {
    if (!divisionUser) {
      return false;
    }

    // Check if school is in accessible list
    return accessibleSchools.some(s => s.id === schoolId);
  }, [divisionUser, accessibleSchools]);

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  // Memoize to prevent infinite render loops
  const contextValue = useMemo<DivisionContextData>(() => ({
    divisionUser,
    division,
    isDivisionUser: !!divisionUser,
    accessibleSchools,
    availableDistricts,
    selectedDistrict,
    selectedSchoolId,
    filteredSchools,
    schoolYear,
    availableSchoolYears,
    quarter,
    loading,
    error,
    selectDistrict,
    selectSchool,
    setSchoolYear,
    setQuarter,
    refreshSchools,
    refreshData,
    hasPermission,
    canAccessSchool,
  }), [
    divisionUser,
    division,
    accessibleSchools,
    availableDistricts,
    selectedDistrict,
    selectedSchoolId,
    filteredSchools,
    schoolYear,
    availableSchoolYears,
    quarter,
    loading,
    error,
    selectDistrict,
    selectSchool,
    setSchoolYear,
    setQuarter,
    refreshSchools,
    refreshData,
    hasPermission,
    canAccessSchool,
  ]);

  return (
    <DivisionContext.Provider value={contextValue}>
      {children}
    </DivisionContext.Provider>
  );
};

// =====================================================
// HOOKS
// =====================================================

/**
 * useDivisionContext Hook - Access division context in components
 * 
 * Usage:
 * ```tsx
 * const { 
 *   isDivisionUser, 
 *   division, 
 *   accessibleSchools,
 *   hasPermission,
 *   selectSchool 
 * } = useDivisionContext();
 * 
 * // Check if user is from division
 * if (isDivisionUser) {
 *   // Show division dashboard
 * }
 * 
 * // Check permissions
 * if (hasPermission('reports', 'generate')) {
 *   // Show generate button
 * }
 * ```
 */
export const useDivisionContext = (): DivisionContextData => {
  const context = useContext(DivisionContext);

  if (context === defaultContextValue) {
    console.warn('[DivisionContext] useDivisionContext used outside DivisionContextProvider');
  }

  return context;
};

/**
 * useDivisionPermission Hook - Check a specific permission
 * 
 * Usage:
 * ```tsx
 * const canGenerateReports = useDivisionPermission('reports', 'generate');
 * ```
 */
export const useDivisionPermission = (
  module: keyof ModulePermissions,
  action: PermissionAction
): boolean => {
  const { hasPermission } = useDivisionContext();
  return useMemo(() => hasPermission(module, action), [hasPermission, module, action]);
};

/**
 * useIsDivisionUser Hook - Quick check if current user is a division user
 * 
 * Usage:
 * ```tsx
 * const isDivisionUser = useIsDivisionUser();
 * ```
 */
export const useIsDivisionUser = (): boolean => {
  const { isDivisionUser } = useDivisionContext();
  return isDivisionUser;
};

export default DivisionContext;
