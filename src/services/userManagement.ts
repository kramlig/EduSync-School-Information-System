/**
 * User Management Service
 * 
 * Provides functions for creating users with proper role assignment.
 * Works in conjunction with the autoOnboarding Cloud Function.
 * 
 * WORKFLOW:
 * 1. Create Firebase Auth user (get UID)
 * 2. Create PostgreSQL user record (users table)
 * 3. Create role-specific PostgreSQL record (teachers/students table)
 * 4. Create userRoles Firestore document with intended role
 * 5. Auto-onboarding Cloud Function fires (reads userRoles doc)
 * 6. Function sets custom claims from userRoles
 * 7. Wait for claims propagation
 * 8. Return success
 * 
 * This ensures complete user creation in both PostgreSQL (for data)
 * and Firebase (for auth + custom claims).
 */

import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreService';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'registrar' | 'superadmin';

interface CreateUserWithRoleParams {
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  displayName?: string;
  additionalData?: Record<string, any>;
}

export interface CreateUserWithRoleResult {
  success: boolean;
  userId?: string;
  postgresUserId?: string;
  userCredential?: UserCredential;
  error?: string;
  requiresReauth?: boolean; // True if admin session was lost
}

/**
 * Core function: Creates Firebase Auth user + PostgreSQL records + pre-sets role in userRoles collection
 * 
 * CRITICAL: Creates BOTH PostgreSQL records (for login) AND Firestore userRoles (for custom claims)
 * NOTE: Preserves admin session by re-authenticating after creating new user
 */
export async function createUserWithRole(
  params: CreateUserWithRoleParams,
  adminCredentials?: { email: string; password: string } // Optional: to restore admin session
): Promise<CreateUserWithRoleResult> {
  let userCredential: UserCredential | null = null;
  const auth = getAuth();
  
  // Save current admin user info before creating new user
  const currentAdminUser = auth.currentUser;
  const currentAdminEmail = currentAdminUser?.email;
  
  try {
    const db = getFirestoreInstance();
    
    console.log(`[UserManagement] Creating user with role: ${params.role}`, {
      email: params.email,
      schoolId: params.schoolId || 'default'
    });
    console.log(`[UserManagement] Current admin: ${currentAdminEmail}`);
    
    // Step 1: Create Firebase Auth user
    // WARNING: This will sign in as the new user automatically!
    userCredential = await createUserWithEmailAndPassword(
      auth,
      params.email,
      params.password
    );
    
    const uid = userCredential.user.uid;
    console.log(`[UserManagement] ✅ Created auth user: ${uid}`);
    
    // Step 2: Get or create school UUID (required for PostgreSQL foreign keys)
    console.log(`[UserManagement] 🔍 Step 2: Looking up school...`);
    const schoolUuid = await getSchoolUuid(params.schoolId || 'default');
    console.log(`[UserManagement] 📋 School UUID result:`, schoolUuid);
    
    if (!schoolUuid) {
      throw new Error(`School not found in PostgreSQL: ${params.schoolId}. Make sure schools table has data.`);
    }
    
    // Step 3: Create PostgreSQL user record (required for login)
    console.log(`[UserManagement] 🔍 Step 3: Creating users table record...`);
    console.log(`[UserManagement] 📋 Insert data:`, {
      school_id: schoolUuid,
      firebase_uid: uid,
      email: params.email,
      role: params.role,
      name: params.displayName || params.email
    });
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        school_id: schoolUuid,
        firebase_uid: uid,
        email: params.email,
        role: params.role,
        name: params.displayName || params.email
      })
      .select()
      .single();
    
    if (userError) {
      console.error('[UserManagement] ❌ Failed to create PostgreSQL user:', userError);
      console.error('[UserManagement] ❌ Error details:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint
      });
      throw new Error(`Database error: ${userError.message}`);
    }
    
    console.log(`[UserManagement] ✅ Created PostgreSQL user record:`, userData);
    
    // Step 4: Create userRoles Firestore document (for custom claims)
    // This ensures the onUserCreated trigger reads our intended role (PRIORITY 1)
    const userRoleRef = doc(db, 'userRoles', uid);
    
    // Filter out undefined values from additionalData (Firestore doesn't accept undefined)
    const cleanAdditionalData: Record<string, any> = {};
    if (params.additionalData) {
      for (const [key, value] of Object.entries(params.additionalData)) {
        if (value !== undefined) {
          cleanAdditionalData[key] = value;
        }
      }
    }
    
    const userRoleData = {
      role: params.role,
      schoolId: params.schoolId || 'default',
      email: params.email,
      displayName: params.displayName || null,
      createdAt: serverTimestamp(),
      createdBy: 'system',
      assignmentMethod: 'explicit-ui',
      ...cleanAdditionalData
    };
    
    await setDoc(userRoleRef, userRoleData);
    console.log(`[UserManagement] ✅ Created userRoles doc with role: ${params.role}`);
    
    // Step 5: Wait for Cloud Function to process and set custom claims
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    
    console.log(`[UserManagement] ✅ User creation complete`);
    
    // Step 6: Restore admin session if credentials provided
    // createUserWithEmailAndPassword automatically signs in as the new user
    // We need to sign back in as the admin
    let sessionRestored = false;
    if (adminCredentials) {
      try {
        console.log(`[UserManagement] 🔄 Restoring admin session: ${adminCredentials.email}`);
        await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
        console.log(`[UserManagement] ✅ Admin session restored`);
        sessionRestored = true;
      } catch (restoreError: any) {
        console.error('[UserManagement] ⚠️ Could not restore admin session:', restoreError);
        // Return error indicating session lost - user was created but admin is locked out
        return {
          success: true,
          userId: uid,
          postgresUserId: userData.id,
          userCredential,
          requiresReauth: true,
          error: `User created successfully but could not restore your admin session: ${restoreError.message || 'Invalid password'}. Please log out and log back in.`
        };
      }
    } else {
      console.warn('[UserManagement] ⚠️ No admin credentials provided - user is now signed in as the new user!');
    }
    
    return {
      success: true,
      userId: uid,
      postgresUserId: userData.id,
      userCredential,
      requiresReauth: !sessionRestored // Flag to indicate admin needs to re-login
    };
    
  } catch (error: any) {
    console.error('[UserManagement] ❌ Error creating user with role:', error);
    
    // Try to restore admin session even on error
    if (adminCredentials) {
      try {
        await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
        console.log('[UserManagement] Admin session restored after error');
      } catch (restoreError) {
        console.error('[UserManagement] Could not restore admin session:', restoreError);
      }
    }
    
    // Cleanup: Delete Firebase Auth user if PostgreSQL creation failed
    if (userCredential) {
      try {
        await userCredential.user.delete();
        console.log('[UserManagement] Rolled back Firebase Auth user');
      } catch (cleanupError) {
        console.error('[UserManagement] Failed to cleanup Firebase user:', cleanupError);
      }
    }
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to create user';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak (minimum 6 characters)';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Helper: Get school UUID from schoolId string
 */
async function getSchoolUuid(schoolId: string): Promise<string | null> {
  console.log('[UserManagement] 🔍 Looking up school UUID for:', schoolId);
  
  try {
    // Try to find by school_id_number first (don't use .single() to avoid 406)
    console.log('[UserManagement] 🔍 Trying school_id_number match...');
    let { data: schoolsByNumber, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_id_number, name')
      .eq('school_id_number', schoolId)
      .is('deleted_at', null)
      .limit(1);
    
    if (schoolError) {
      console.log('[UserManagement] ⚠️ school_id_number query error:', schoolError.message);
    }
    
    if (schoolsByNumber && schoolsByNumber.length > 0) {
      console.log('[UserManagement] ✅ Found school by school_id_number:', schoolsByNumber[0]);
      return schoolsByNumber[0].id;
    }
    
    // Fallback: If schoolId is already a UUID, verify it exists
    if (schoolId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('[UserManagement] 🔍 Checking if UUID exists:', schoolId);
      const { data: schoolById } = await supabase
        .from('schools')
        .select('id')
        .eq('id', schoolId)
        .is('deleted_at', null)
        .limit(1);
      
      if (schoolById && schoolById.length > 0) {
        console.log('[UserManagement] ✅ schoolId is valid UUID:', schoolId);
        return schoolId;
      }
    }
    
    // Last resort: Get first school (for development)
    console.log('[UserManagement] 🔍 Falling back to first school...');
    const { data: allSchools, error: firstSchoolError } = await supabase
      .from('schools')
      .select('id, school_id_number, name')
      .is('deleted_at', null)
      .limit(1);
    
    if (firstSchoolError) {
      console.error('[UserManagement] ❌ First school query error:', firstSchoolError);
    }
    
    if (allSchools && allSchools.length > 0) {
      console.log('[UserManagement] ✅ Using first school:', allSchools[0]);
      return allSchools[0].id;
    }
    
    console.error('[UserManagement] ❌ No schools found in database!');
    return null;
  } catch (err) {
    console.error('[UserManagement] ❌ Error fetching school UUID:', err);
    return null;
  }
}

/**
 * Create parent account with automatic role assignment
 * Used for: Parent self-registration
 */
export async function createParentWithRole(
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    studentIds: string[];
    contactNumber?: string;
  }
): Promise<CreateUserWithRoleResult> {
  console.log('[UserManagement] Creating parent account', {
    email: params.email,
    studentIds: params.studentIds
  });
  
  return createUserWithRole({
    ...params,
    role: 'parent',
    additionalData: {
      ...params.additionalData,
      studentIds: params.studentIds,
      contactNumber: params.contactNumber
    }
  });
}

/**
 * Create teacher account with automatic role assignment
 * Used for: Admin creating teacher accounts
 */
export async function createTeacherWithRole(
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    contactNumber?: string;
  },
  adminCredentials?: { email: string; password: string }
): Promise<CreateUserWithRoleResult> {
  console.log('[UserManagement] Creating teacher account', {
    email: params.email,
    schoolId: params.schoolId
  });
  
  const result = await createUserWithRole({
    ...params,
    role: 'teacher',
    additionalData: {
      ...params.additionalData,
      firstName: params.firstName,
      lastName: params.lastName,
      middleName: params.middleName,
      contactNumber: params.contactNumber
    }
  }, adminCredentials);
  
  // If base creation succeeded, create teachers table record
  if (result.success && result.userId && result.postgresUserId) {
    console.log('[UserManagement] 🔍 Step 4: Creating teachers table record...');
    
    try {
      const schoolUuid = await getSchoolUuid(params.schoolId || 'default');
      
      const teacherName = params.displayName || 
        [params.firstName, params.middleName, params.lastName]
          .filter(Boolean)
          .join(' ') || 
        params.email;
      
      // CRITICAL: firebase_uid is required for login query!
      const teacherInsertData = {
        school_id: schoolUuid,
        user_id: result.postgresUserId,
        firebase_uid: result.userId,  // ← Firebase Auth UID for login lookup
        email: params.email,          // ← Email for fallback lookup
        name: teacherName,
        employee_number: `TEMP-${Date.now()}`,
        specialization: null,
        role: 'teacher'
      };
      
      console.log('[UserManagement] 📋 Teachers insert data:', teacherInsertData);
      
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert(teacherInsertData)
        .select()
        .single();
      
      if (teacherError) {
        console.error('[UserManagement] ❌ Failed to create teacher record:', teacherError);
        console.error('[UserManagement] ❌ Teacher error details:', {
          code: teacherError.code,
          message: teacherError.message,
          details: teacherError.details,
          hint: teacherError.hint
        });
        throw new Error(`Failed to create teacher profile: ${teacherError.message}`);
      }
      
      console.log(`[UserManagement] ✅ Created teacher record:`, teacherData);
    } catch (teacherError: any) {
      console.error('[UserManagement] ❌ Teacher record creation failed:', teacherError);
      // Rollback: Delete the users record and Firebase Auth user
      if (result.userCredential) {
        try {
          await result.userCredential.user.delete();
          await supabase.from('users').delete().eq('id', result.postgresUserId);
          console.log('[UserManagement] Rolled back user and auth records');
        } catch (cleanupErr) {
          console.error('[UserManagement] Cleanup failed:', cleanupErr);
        }
      }
      
      return {
        success: false,
        error: teacherError.message || 'Failed to create teacher profile'
      };
    }
  }
  
  return result;
}

/**
 * Create student account with automatic role assignment
 * Used for: Admin/Registrar creating student accounts during enrollment
 */
export async function createStudentWithRole(
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    lrn: string;
    sectionId?: string;
    gradeLevel?: number;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    birthdate?: string;
  },
  adminCredentials?: { email: string; password: string }
): Promise<CreateUserWithRoleResult> {
  console.log('[UserManagement] Creating student account', {
    email: params.email,
    lrn: params.lrn,
    schoolId: params.schoolId
  });
  
  const result = await createUserWithRole({
    ...params,
    role: 'student',
    additionalData: {
      ...params.additionalData,
      lrn: params.lrn,
      sectionId: params.sectionId,
      gradeLevel: params.gradeLevel,
      firstName: params.firstName,
      lastName: params.lastName,
      middleName: params.middleName,
      birthdate: params.birthdate
    }
  }, adminCredentials);
  
  // If base creation succeeded, create students table record
  if (result.success && result.userId && result.postgresUserId) {
    try {
      const schoolUuid = await getSchoolUuid(params.schoolId || 'default');
      
      console.log('[UserManagement] 📋 Creating students table record:', {
        school_id: schoolUuid,
        user_id: result.postgresUserId,
        firebase_uid: result.userId,
        email: params.email,
        lrn: params.lrn,
        grade_level: params.gradeLevel
      });
      
      // CRITICAL: firebase_uid and email are required for login query!
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          school_id: schoolUuid,
          user_id: result.postgresUserId,
          firebase_uid: result.userId,  // ← Firebase Auth UID for login lookup
          email: params.email,          // ← Email for fallback lookup
          lrn: params.lrn,
          name: `${params.firstName || ''} ${params.lastName || ''}`.trim() || 'Student',
          first_name: params.firstName || '',
          middle_name: params.middleName || null,
          last_name: params.lastName || '',
          grade_level: params.gradeLevel || 7,
          section_id: params.sectionId || null,
          gender: 'Male', // Default - should be from form
          date_of_birth: params.birthdate || '2010-01-01' // Default - should be from form
        })
        .select()
        .single();
      
      if (studentError) {
        console.error('[UserManagement] ❌ Failed to create student record:', {
          error: studentError,
          code: studentError.code,
          message: studentError.message,
          details: studentError.details,
          hint: studentError.hint
        });
        throw new Error(`Failed to create student profile: ${studentError.message || studentError.code || 'Unknown error'}`);
      }
      
      console.log(`[UserManagement] ✅ Created student record: ${studentData.id}`);
    } catch (studentError: any) {
      console.error('[UserManagement] ❌ Student record creation failed:', studentError);
      // Note: Can't delete Firebase user after admin session restored - just log it
      // The Firebase user exists but won't be usable without the students record
      console.warn('[UserManagement] ⚠️ Firebase user may be orphaned (cannot delete after admin session restored)');
      
      // Try to clean up PostgreSQL records at least
      if (result.postgresUserId) {
        try {
          await supabase.from('users').delete().eq('id', result.postgresUserId);
          console.log('[UserManagement] Rolled back PostgreSQL user record');
        } catch (cleanupErr) {
          console.error('[UserManagement] PostgreSQL cleanup failed:', cleanupErr);
        }
      }
      
      return {
        success: false,
        error: studentError.message || 'Failed to create student profile'
      };
    }
  }
  
  return result;
}

/**
 * Create admin account with automatic role assignment
 * Used for: SuperAdmin creating school administrators
 */
export async function createAdminWithRole(
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    firstName?: string;
    lastName?: string;
  }
): Promise<CreateUserWithRoleResult> {
  console.log('[UserManagement] Creating admin account', {
    email: params.email,
    schoolId: params.schoolId
  });
  
  return createUserWithRole({
    ...params,
    role: 'admin',
    additionalData: {
      ...params.additionalData,
      firstName: params.firstName,
      lastName: params.lastName
    }
  });
}

/**
 * Create registrar account with automatic role assignment
 * Used for: Admin creating registrar accounts
 * Note: Uses 'teacher' role in PostgreSQL (enum constraint), but 'registrar' in Firestore for custom claims
 */
export async function createRegistrarWithRole(
  params: Omit<CreateUserWithRoleParams, 'role'> & {
    firstName?: string;
    lastName?: string;
  },
  adminCredentials?: { email: string; password: string }
): Promise<CreateUserWithRoleResult> {
  console.log('[UserManagement] Creating registrar account', {
    email: params.email,
    schoolId: params.schoolId
  });
  
  // Use 'teacher' role for PostgreSQL (enum constraint)
  // But set 'registrar' in Firestore userRoles for custom claims
  const result = await createUserWithRole({
    ...params,
    role: 'teacher', // PostgreSQL enum only has: admin, teacher, student, parent
    additionalData: {
      ...params.additionalData,
      firstName: params.firstName,
      lastName: params.lastName,
      actualRole: 'registrar' // Store actual role for reference
    }
  }, adminCredentials);
  
  // Override the Firestore userRoles document to have 'registrar' role for custom claims
  if (result.success && result.userId) {
    try {
      const db = getFirestoreInstance();
      const userRoleRef = doc(db, 'userRoles', result.userId);
      await setDoc(userRoleRef, {
        role: 'registrar', // This is what Cloud Function reads for custom claims
        schoolId: params.schoolId || 'default',
        email: params.email,
        displayName: params.displayName || null,
        createdAt: serverTimestamp(),
        createdBy: 'system',
        assignmentMethod: 'explicit-ui'
      }, { merge: true });
      console.log('[UserManagement] ✅ Updated userRoles with registrar role');
    } catch (err) {
      console.warn('[UserManagement] Could not update userRoles for registrar:', err);
    }
  }
  
  // For registrars, also create a teachers table record (registrars are staff)
  if (result.success && result.userId && result.postgresUserId) {
    try {
      const schoolUuid = await getSchoolUuid(params.schoolId || 'default');
      
      const registrarName = params.displayName || 
        [params.firstName, params.lastName].filter(Boolean).join(' ') || 
        params.email;
      
      // CRITICAL: firebase_uid and email are required for login query!
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          school_id: schoolUuid,
          user_id: result.postgresUserId,
          firebase_uid: result.userId,  // ← Firebase Auth UID for login lookup
          email: params.email,          // ← Email for fallback lookup
          name: registrarName,
          employee_number: `REG-${Date.now()}`,
          specialization: 'Registrar',
          role: 'registrar'
        })
        .select()
        .single();
      
      if (teacherError) {
        console.error('[UserManagement] ❌ Failed to create registrar record:', teacherError);
        throw new Error(`Failed to create registrar profile: ${teacherError.message}`);
      }
      
      console.log(`[UserManagement] ✅ Created registrar record: ${teacherData.id}`);
    } catch (registrarError: any) {
      console.error('[UserManagement] ❌ Registrar record creation failed:', registrarError);
      // Rollback: Delete the users record and Firebase Auth user
      if (result.userCredential) {
        try {
          await result.userCredential.user.delete();
          await supabase.from('users').delete().eq('id', result.postgresUserId);
          console.log('[UserManagement] Rolled back user and auth records');
        } catch (cleanupErr) {
          console.error('[UserManagement] Cleanup failed:', cleanupErr);
        }
      }
      
      return {
        success: false,
        error: registrarError.message || 'Failed to create registrar profile'
      };
    }
  }
  
  return result;
}
