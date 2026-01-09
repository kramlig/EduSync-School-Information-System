/**
 * Authentication Service (High-Level Standard)
 * 
 * This service provides enterprise-grade authentication with:
 * - Unified user lookup (single optimized query)
 * - Login audit logging
 * - Rate limiting protection
 * - Offline support with secure caching
 * - Type-safe user objects
 * - Division user detection (auto-redirects to /division)
 * 
 * Flow: Firebase Auth → Check Division Users → PostgreSQL (optimized function) → Session
 */

import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import type { AuthUser, StudentUser, ParentUser } from '../../types';
import { getDivisionUserByFirebaseUid } from './divisionService';
import type { DivisionUser } from '../types/division';

// =====================================================
// Types
// =====================================================

export type LoginType = 'staff' | 'student' | 'parent';
export type UserType = 'teacher' | 'student' | 'parent' | 'admin' | 'division';

// Division user auth type (returned when division user logs in)
export interface DivisionAuthUser extends DivisionUser {
  firebaseUid: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser | StudentUser | ParentUser | DivisionAuthUser;
  userType?: UserType;
  error?: LoginError;
}

export interface LoginError {
  code: string;
  message: string;
  isRateLimited?: boolean;
  blockedUntil?: Date;
  attemptsRemaining?: number;
}

export interface RateLimitCheck {
  isBlocked: boolean;
  blockReason?: string;
  blockedUntil?: Date;
  recentAttempts: number;
}

export interface UnifiedUserData {
  user_id: string;
  user_type: UserType;
  email: string;
  name: string;
  role: string;
  school_id: string;
  school_name: string;
  grade_level?: number;
  section_id?: string;
  contact_number?: string;
  employee_number?: string;
  position?: string;
  first_name?: string;
  last_name?: string;
}

// =====================================================
// Constants
// =====================================================

const CACHE_KEY = 'edusync_cached_user';
const CACHE_EXPIRY_DAYS = 7;
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const BLOCK_DURATION_MINUTES = 30;

// Role mapping for login type validation
const STAFF_ROLES = ['admin', 'principal', 'registrar', 'teacher', 'superadmin'];

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get device fingerprint (simplified version)
 */
function getDeviceFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// =====================================================
// Rate Limiting
// =====================================================

// Check if running in development/emulator mode
const isDevelopment = import.meta.env.DEV || 
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
  window.location.hostname === 'localhost';

/**
 * Check if user is rate limited
 * SKIPPED in development mode to prevent lockouts during testing
 */
export async function checkRateLimit(email: string): Promise<RateLimitCheck> {
  // Skip rate limiting in development to prevent lockouts
  if (isDevelopment) {
    console.log('[AuthService] ⚠️ Rate limiting SKIPPED (development mode)');
    return { isBlocked: false, recentAttempts: 0 };
  }
  
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_email: email.toLowerCase(),
      p_ip_address: null, // Could be enhanced with actual IP
      p_max_attempts: MAX_LOGIN_ATTEMPTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
      p_block_minutes: BLOCK_DURATION_MINUTES
    });

    if (error) {
      console.warn('[AuthService] Rate limit check failed:', error);
      // Fail open - allow login attempt
      return { isBlocked: false, recentAttempts: 0 };
    }

    const result = data?.[0];
    if (!result) {
      return { isBlocked: false, recentAttempts: 0 };
    }

    return {
      isBlocked: result.is_blocked,
      blockReason: result.block_reason,
      blockedUntil: result.blocked_until ? new Date(result.blocked_until) : undefined,
      recentAttempts: result.recent_attempts
    };
  } catch (err) {
    console.warn('[AuthService] Rate limit check error:', err);
    return { isBlocked: false, recentAttempts: 0 };
  }
}

// =====================================================
// Login Audit
// =====================================================

/**
 * Log login attempt for security auditing
 */
export async function logLoginAttempt(
  email: string,
  status: 'success' | 'failed' | 'blocked',
  loginType: LoginType,
  options?: {
    firebaseUid?: string;
    userType?: UserType;
    schoolId?: string;
    errorCode?: string;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    await supabase.rpc('log_login_attempt', {
      p_email: email.toLowerCase(),
      p_firebase_uid: options?.firebaseUid || null,
      p_user_type: options?.userType || null,
      p_school_id: options?.schoolId || null,
      p_login_status: status,
      p_login_type: loginType,
      p_login_method: 'email_password',
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_error_code: options?.errorCode || null,
      p_error_message: options?.errorMessage || null
    });
  } catch (err) {
    // Don't fail login if audit logging fails
    console.warn('[AuthService] Failed to log login attempt:', err);
  }
}

// =====================================================
// User Lookup (Optimized Single Query)
// =====================================================

/**
 * Get user by Firebase UID using optimized PostgreSQL function
 * Single query across teachers, students, and parents tables
 */
export async function getUserByFirebaseUID(firebaseUid: string): Promise<UnifiedUserData | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_by_firebase_uid', {
      p_firebase_uid: firebaseUid
    });

    if (error) {
      console.error('[AuthService] User lookup error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as UnifiedUserData;
  } catch (err) {
    console.error('[AuthService] User lookup exception:', err);
    return null;
  }
}

/**
 * Fallback: Legacy sequential query (if RPC function doesn't exist)
 * Option A (Role-Centric): Check superadmins → teachers → students → parents
 * Note: division_users is checked separately in the main login flow
 */
async function getUserByFirebaseUIDLegacy(firebaseUid: string): Promise<UnifiedUserData | null> {
  // 1. Try superadmins first (platform level)
  const { data: superadmin } = await supabase
    .from('superadmins')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .is('deleted_at', null)
    .eq('is_active', true)
    .maybeSingle();

  if (superadmin) {
    return {
      user_id: superadmin.id,
      user_type: 'superadmin',
      email: superadmin.email,
      name: superadmin.name,
      role: 'superadmin',
      school_id: null,
      school_name: '',
      contact_number: null,
      employee_number: null,
      position: null,
      first_name: superadmin.name?.split(' ')[0] || '',
      last_name: superadmin.name?.split(' ').slice(1).join(' ') || ''
    };
  }

  // 2. Try teachers (school staff: admin, principal, registrar, teacher)
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(name)')
    .eq('firebase_uid', firebaseUid)
    .is('deleted_at', null)
    .maybeSingle();

  if (teacher) {
    return {
      user_id: teacher.id,
      user_type: 'teacher',
      email: teacher.email,
      name: teacher.name,
      role: teacher.role || 'teacher',
      school_id: teacher.school_id,
      school_name: teacher.schools?.name || '',
      contact_number: teacher.phone,
      employee_number: teacher.employee_number,
      position: teacher.position,
      first_name: teacher.first_name,
      last_name: teacher.last_name
    };
  }

  // 3. Try students
  const { data: student } = await supabase
    .from('students')
    .select('*, schools(name)')
    .eq('firebase_uid', firebaseUid)
    .is('deleted_at', null)
    .maybeSingle();

  if (student) {
    return {
      user_id: student.id,
      user_type: 'student',
      email: student.email,
      name: `${student.first_name} ${student.last_name}`.trim(),
      role: 'student',
      school_id: student.school_id,
      school_name: student.schools?.name || '',
      grade_level: student.grade_level,
      section_id: student.section_id,
      contact_number: student.contact_number,
      first_name: student.first_name,
      last_name: student.last_name
    };
  }

  // 4. Try parents
  const { data: parent } = await supabase
    .from('parents')
    .select('*, schools(name)')
    .eq('firebase_uid', firebaseUid)
    .is('deleted_at', null)
    .maybeSingle();

  if (parent) {
    return {
      user_id: parent.id,
      user_type: 'parent',
      email: parent.email,
      name: parent.name,
      role: 'parent',
      school_id: parent.school_id,
      school_name: parent.schools?.name || '',
      contact_number: parent.contact_number
    };
  }

  return null;
}

// =====================================================
// Session Caching (Offline Support)
// =====================================================

interface CachedSession {
  email: string;
  loginType: LoginType;
  userData: AuthUser | StudentUser | ParentUser;
  firebaseUid: string;
  cachedAt: number;
  deviceFingerprint: string;
}

/**
 * Cache user session for offline login
 */
function cacheUserSession(
  email: string,
  loginType: LoginType,
  userData: AuthUser | StudentUser | ParentUser,
  firebaseUid: string
): void {
  const session: CachedSession = {
    email: email.toLowerCase(),
    loginType,
    userData,
    firebaseUid,
    cachedAt: Date.now(),
    deviceFingerprint: getDeviceFingerprint()
  };
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[AuthService] Failed to cache session:', err);
  }
}

/**
 * Get cached session for offline login
 */
function getCachedSession(email: string, loginType: LoginType): CachedSession | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const session: CachedSession = JSON.parse(cached);
    
    // Validate email and login type
    if (session.email !== email.toLowerCase() || session.loginType !== loginType) {
      return null;
    }
    
    // Check expiry
    const cacheAge = Date.now() - session.cachedAt;
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (cacheAge > maxAge) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // Validate device fingerprint (prevent session theft)
    if (session.deviceFingerprint !== getDeviceFingerprint()) {
      console.warn('[AuthService] Device fingerprint mismatch');
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Clear cached session
 */
export function clearCachedSession(): void {
  localStorage.removeItem(CACHE_KEY);
}

// =====================================================
// Main Login Function
// =====================================================

/**
 * Authenticate user with Firebase Auth and fetch profile from PostgreSQL
 * 
 * Features:
 * - Rate limiting protection
 * - Audit logging
 * - Unified user lookup
 * - Offline fallback
 * - Type-safe responses
 */
export async function login(
  email: string,
  password: string,
  loginType: LoginType
): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('[AuthService] 🔵 Login attempt:', { email: normalizedEmail, loginType });
  
  // Step 1: Check rate limit
  const rateLimit = await checkRateLimit(normalizedEmail);
  
  if (rateLimit.isBlocked) {
    console.log('[AuthService] ⛔ Rate limited:', rateLimit);
    
    await logLoginAttempt(normalizedEmail, 'blocked', loginType, {
      errorCode: 'RATE_LIMITED',
      errorMessage: rateLimit.blockReason
    });
    
    return {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many failed attempts. Please try again in ${Math.ceil((rateLimit.blockedUntil!.getTime() - Date.now()) / 60000)} minutes.`,
        isRateLimited: true,
        blockedUntil: rateLimit.blockedUntil
      }
    };
  }
  
  // Step 2: Authenticate with Firebase Auth
  let firebaseUser: FirebaseUser;
  
  try {
    console.log('[AuthService] Step 2: Firebase Auth...');
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    firebaseUser = userCredential.user;
    console.log('[AuthService] ✅ Firebase Auth successful');
  } catch (authError: any) {
    console.error('[AuthService] ❌ Firebase Auth failed:', authError);
    
    // Offline fallback
    if (!navigator.onLine) {
      const cached = getCachedSession(normalizedEmail, loginType);
      if (cached) {
        console.log('[AuthService] 📴 Using cached session (offline)');
        return {
          success: true,
          user: cached.userData,
          userType: getTypeFromUser(cached.userData)
        };
      }
      
      return {
        success: false,
        error: {
          code: 'OFFLINE_NO_CACHE',
          message: 'You are offline. First login requires internet connection.'
        }
      };
    }
    
    // Log failed attempt
    await logLoginAttempt(normalizedEmail, 'failed', loginType, {
      errorCode: authError.code || 'AUTH_FAILED',
      errorMessage: authError.message
    });
    
    // User-friendly error messages
    let message = 'Invalid email or password.';
    if (authError.code === 'auth/user-not-found') {
      message = 'No account found with this email.';
    } else if (authError.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    } else if (authError.code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please try again later.';
    }
    
    return {
      success: false,
      error: {
        code: authError.code || 'AUTH_FAILED',
        message,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - rateLimit.recentAttempts - 1
      }
    };
  }
  
  // Step 3a: Check if user is a SUPERADMIN (from Firebase token claims)
  // Superadmin doesn't have a PostgreSQL record - they're stored in Firebase only
  if (loginType === 'staff') {
    console.log('[AuthService] Step 3a: Checking for Superadmin...');
    try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      const claims = tokenResult.claims;
      
      if (claims.role === 'superadmin' || claims.isSuperAdmin === true) {
        console.log('[AuthService] ✅ Superadmin found via Firebase claims');
        
        // Build superadmin user object from claims
        const superAdminUser: AuthUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || normalizedEmail,
          name: firebaseUser.displayName || 'Super Admin',
          role: 'superadmin',
          schoolId: 'default', // Superadmin can access all schools
          firebaseUid: firebaseUser.uid,
        };
        
        // Log success
        await logLoginAttempt(normalizedEmail, 'success', loginType, {
          firebaseUid: firebaseUser.uid,
          userType: 'superadmin',
          errorMessage: 'Superadmin login via Firebase claims'
        });
        
        // Cache session
        cacheUserSession(normalizedEmail, loginType, superAdminUser, firebaseUser.uid);
        
        return {
          success: true,
          user: superAdminUser,
          userType: 'staff'
        };
      }
    } catch (claimsError) {
      console.log('[AuthService] Could not read Firebase claims, continuing...');
    }
  }
  
  // Step 3b: Check if user is a Division user (auto-redirect to /division)
  // This check runs for staff logins only
  if (loginType === 'staff') {
    console.log('[AuthService] Step 3b: Checking for Division user...');
    try {
      const divisionUser = await getDivisionUserByFirebaseUid(firebaseUser.uid);
      if (divisionUser) {
        console.log('[AuthService] ✅ Division user found:', divisionUser.email, 'Role:', divisionUser.role);
        
        // Log success for division user
        await logLoginAttempt(normalizedEmail, 'success', loginType, {
          firebaseUid: firebaseUser.uid,
          userType: 'division',
          errorMessage: `Division: ${divisionUser.division_id}`
        });
        
        // Return division user with special type
        const divisionAuthUser: DivisionAuthUser = {
          ...divisionUser,
          firebaseUid: firebaseUser.uid
        };
        
        return {
          success: true,
          user: divisionAuthUser,
          userType: 'division'
        };
      }
    } catch (divisionError) {
      // Non-fatal: just means user is not a division user
      console.log('[AuthService] Not a division user, continuing to school lookup...');
    }
  }
  
  // Step 4: Fetch user data from PostgreSQL (optimized single query)
  console.log('[AuthService] Step 4: PostgreSQL lookup...');
  
  let userData = await getUserByFirebaseUID(firebaseUser.uid);
  
  // Fallback to legacy query if function doesn't exist
  if (!userData) {
    console.log('[AuthService] Trying legacy lookup...');
    userData = await getUserByFirebaseUIDLegacy(firebaseUser.uid);
  }
  
  if (!userData) {
    console.error('[AuthService] ❌ No user found in PostgreSQL');
    
    await logLoginAttempt(normalizedEmail, 'failed', loginType, {
      firebaseUid: firebaseUser.uid,
      errorCode: 'USER_NOT_FOUND',
      errorMessage: 'No user record in PostgreSQL'
    });
    
    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `No ${loginType} account found. Please contact your administrator.`
      }
    };
  }
  
  console.log('[AuthService] ✅ User found:', userData.user_type, userData.email);
  
  // Step 4: Validate role matches login type
  const expectedRoles = loginType === 'staff' ? STAFF_ROLES : [loginType];
  const userRole = userData.role.toLowerCase();
  
  if (!expectedRoles.includes(userRole) && !expectedRoles.includes(userData.user_type)) {
    const roleToTabMap: Record<string, string> = {
      'admin': 'Staff',
      'principal': 'Staff',
      'registrar': 'Staff',
      'teacher': 'Staff',
      'superadmin': 'Staff',
      'student': 'Student',
      'parent': 'Parent'
    };
    const correctTab = roleToTabMap[userRole] || roleToTabMap[userData.user_type] || 'correct';
    
    await logLoginAttempt(normalizedEmail, 'failed', loginType, {
      firebaseUid: firebaseUser.uid,
      userType: userData.user_type,
      schoolId: userData.school_id,
      errorCode: 'ROLE_MISMATCH',
      errorMessage: `Expected ${loginType}, got ${userData.user_type}`
    });
    
    return {
      success: false,
      error: {
        code: 'ROLE_MISMATCH',
        message: `Please use the ${correctTab} login tab.`
      }
    };
  }
  
  // Step 5: Build typed user object
  const user = buildUserObject(userData, firebaseUser.uid);
  
  // Step 6: Cache session and log success
  cacheUserSession(normalizedEmail, loginType, user, firebaseUser.uid);
  
  await logLoginAttempt(normalizedEmail, 'success', loginType, {
    firebaseUid: firebaseUser.uid,
    userType: userData.user_type,
    schoolId: userData.school_id
  });
  
  console.log('[AuthService] ✅ Login successful');
  
  return {
    success: true,
    user,
    userType: userData.user_type
  };
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Build typed user object from unified data
 */
function buildUserObject(
  data: UnifiedUserData,
  firebaseUid: string
): AuthUser | StudentUser | ParentUser {
  const base = {
    id: data.user_id,
    postgresqlId: data.user_id,
    firebaseUid,
    email: data.email,
    name: data.name,
    schoolId: data.school_id
  };
  
  switch (data.user_type) {
    case 'student':
      return {
        ...base,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        role: 'student',
        gradeLevel: data.grade_level,
        sectionId: data.section_id,
        contactNumber: data.contact_number,
        enrollmentDate: new Date().toISOString() // Default to now if not available
      } as StudentUser;
      
    case 'parent':
      return {
        ...base,
        role: 'parent',
        contactNumber: data.contact_number,
        studentIds: [], // Will be populated separately if needed
        children: [] // Legacy field
      } as unknown as ParentUser;
      
    default: // teacher/admin/etc
      return {
        ...base,
        role: data.role,
        contactNumber: data.contact_number,
        employeeNumber: data.employee_number,
        position: data.position
      } as AuthUser;
  }
}

/**
 * Get user type from user object
 */
function getTypeFromUser(user: AuthUser | StudentUser | ParentUser): UserType {
  if ('gradeLevel' in user || 'enrollmentDate' in user) return 'student';
  if ('studentIds' in user || 'children' in user) return 'parent';
  if ('role' in user) {
    const authUser = user as AuthUser;
    if (STAFF_ROLES.includes(authUser.role || '')) return authUser.role as UserType;
  }
  return 'teacher';
}

// =====================================================
// Sign Out
// =====================================================

/**
 * Sign out user from Firebase and clear cached session
 */
export async function signOut(): Promise<void> {
  try {
    const auth = getAuth();
    await firebaseSignOut(auth);
    clearCachedSession();
    console.log('[AuthService] ✅ Signed out');
  } catch (err) {
    console.error('[AuthService] Sign out error:', err);
    throw err;
  }
}

// =====================================================
// Session Validation
// =====================================================

/**
 * Check if current session is valid
 */
export async function validateSession(): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return false;
    
    // Verify user still exists in PostgreSQL
    const userData = await getUserByFirebaseUID(user.uid);
    return userData !== null;
  } catch {
    return false;
  }
}

// =====================================================
// Login Statistics (Admin Dashboard)
// =====================================================

export interface LoginStats {
  totalLogins: number;
  failedLogins: number;
  blockedAttempts: number;
  uniqueUsers: number;
  loginsByType: Record<string, number>;
}

/**
 * Get login statistics for admin dashboard
 */
export async function getLoginStats(
  schoolId: string,
  days: number = 30
): Promise<LoginStats | null> {
  try {
    const { data, error } = await supabase
      .from('login_audit')
      .select('login_status, login_type, firebase_uid')
      .eq('school_id', schoolId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    
    const stats: LoginStats = {
      totalLogins: data.filter(r => r.login_status === 'success').length,
      failedLogins: data.filter(r => r.login_status === 'failed').length,
      blockedAttempts: data.filter(r => r.login_status === 'blocked').length,
      uniqueUsers: new Set(data.filter(r => r.firebase_uid).map(r => r.firebase_uid)).size,
      loginsByType: {}
    };
    
    data.forEach(r => {
      stats.loginsByType[r.login_type] = (stats.loginsByType[r.login_type] || 0) + 1;
    });
    
    return stats;
  } catch (err) {
    console.error('[AuthService] Failed to get login stats:', err);
    return null;
  }
}
