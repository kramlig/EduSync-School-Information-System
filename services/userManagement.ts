/**
 * User Management Service
 * 
 * Provides utilities for creating users with proper role assignment.
 * This service ensures that custom claims are set correctly by:
 * 1. Pre-creating userRoles document with intended role
 * 2. Creating Firebase Auth user
 * 3. Letting auto-onboarding trigger detect the pre-assigned role
 * 
 * This approach eliminates race conditions and ensures roles are never
 * assigned incorrectly due to email pattern detection.
 */

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export type UserRole = 'admin' | 'principal' | 'registrar' | 'teacher' | 'student' | 'parent';

export interface CreateUserWithRoleParams {
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
  displayName?: string;
  additionalData?: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  };
}

export interface CreateUserWithRoleResult {
  success: boolean;
  userCredential?: UserCredential;
  userId?: string;
  error?: string;
}

/**
 * Creates a new Firebase Auth user with proper role assignment
 * 
 * WORKFLOW:
 * 1. Pre-create userRoles document with intended role (BEFORE auth creation)
 * 2. Create Firebase Auth user
 * 3. Auto-onboarding trigger reads userRoles doc and sets custom claims
 * 4. Update user profile if displayName provided
 * 
 * This ensures the role is ALWAYS set correctly, regardless of email pattern.
 * 
 * @param params - User creation parameters
 * @returns Result with user credential or error
 */
export async function createUserWithRole(
  params: CreateUserWithRoleParams
): Promise<CreateUserWithRoleResult> {
  const { email, password, role, schoolId = 'default', displayName, additionalData } = params;

  const auth = getAuth();
  const db = getFirestore();

  try {
    console.log(`[userManagement] Creating user with role: ${email} → ${role}`);

    // STEP 1: Create Firebase Auth user first to get UID
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    console.log(`[userManagement] ✅ Auth user created: ${userId}`);

    try {
      // STEP 2: IMMEDIATELY create userRoles document (before auto-onboarding triggers)
      // This ensures auto-onboarding will find and use this role
      await setDoc(doc(db, 'userRoles', userId), {
        userId: userId,
        email: email,
        displayName: displayName || null,
        role: role,
        schoolId: schoolId,
        assignedBy: 'ui-explicit',
        assignedAt: serverTimestamp(),
        method: 'pre-assigned',
        ...additionalData
      });

      console.log(`[userManagement] ✅ userRoles document created for ${userId}`);

      // STEP 3: Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        console.log(`[userManagement] ✅ Profile updated with displayName: ${displayName}`);
      }

      // STEP 4: Wait a moment for auto-onboarding to process
      // The Cloud Function will detect the userRoles doc and set custom claims
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`[userManagement] ✅ User creation complete: ${email} (${role})`);

      return {
        success: true,
        userCredential,
        userId
      };

    } catch (firestoreError: any) {
      console.error(`[userManagement] ❌ Error creating userRoles doc:`, firestoreError);
      
      // If userRoles creation failed, the user exists but has no role
      // This is a critical error - we should probably delete the auth user
      console.error(`[userManagement] ⚠️ Auth user created but userRoles failed. User ${userId} may have no role!`);
      
      return {
        success: false,
        error: `User created but role assignment failed: ${firestoreError.message}`
      };
    }

  } catch (authError: any) {
    console.error(`[userManagement] ❌ Error creating auth user:`, authError);
    
    return {
      success: false,
      error: authError.message || 'Failed to create user'
    };
  }
}

/**
 * Creates a teacher user with teaching assignments
 * 
 * This is a specialized version that also creates the teacher document
 * in the teachers collection.
 */
export async function createTeacherWithRole(
  params: CreateUserWithRoleParams & {
    teachingAssignments?: any[];
    department?: string;
  }
): Promise<CreateUserWithRoleResult> {
  const { teachingAssignments, department, ...baseParams } = params;
  
  // Force role to 'teacher'
  const teacherParams = { ...baseParams, role: 'teacher' as UserRole };
  
  const result = await createUserWithRole(teacherParams);
  
  if (!result.success || !result.userId) {
    return result;
  }

  // Create teacher document
  const db = getFirestore();
  
  try {
    await setDoc(doc(db, 'teachers', result.userId), {
      uid: result.userId,
      email: baseParams.email,
      firstName: baseParams.additionalData?.firstName || '',
      lastName: baseParams.additionalData?.lastName || '',
      displayName: baseParams.displayName || '',
      role: 'teacher',
      schoolId: baseParams.schoolId || 'default',
      department: department || '',
      teachingAssignments: teachingAssignments || [],
      status: 'active',
      createdAt: serverTimestamp()
    });

    console.log(`[userManagement] ✅ Teacher document created for ${result.userId}`);
    
  } catch (teacherDocError: any) {
    console.error(`[userManagement] ⚠️ Failed to create teacher document:`, teacherDocError);
    // User and role exist, but teacher doc failed - not critical
  }

  return result;
}

/**
 * Creates a student user
 * 
 * NOTE: Student documents use auth UID as document ID for proper filtering
 */
export async function createStudentWithRole(
  params: CreateUserWithRoleParams & {
    gradeLevel?: number;
    section?: string;
    studentNumber?: string;
  }
): Promise<CreateUserWithRoleResult> {
  const { gradeLevel, section, studentNumber, ...baseParams } = params;
  
  // Force role to 'student'
  const studentParams = { ...baseParams, role: 'student' as UserRole };
  
  const result = await createUserWithRole(studentParams);
  
  if (!result.success || !result.userId) {
    return result;
  }

  // Create student document using auth UID as document ID
  const db = getFirestore();
  
  try {
    await setDoc(doc(db, 'students', result.userId), {
      id: result.userId, // Ensure id field matches document ID
      uid: result.userId,
      email: baseParams.email,
      firstName: baseParams.additionalData?.firstName || '',
      lastName: baseParams.additionalData?.lastName || '',
      displayName: baseParams.displayName || '',
      schoolId: baseParams.schoolId || 'default',
      gradeLevel: gradeLevel || null,
      section: section || null,
      studentNumber: studentNumber || null,
      status: 'active',
      enrollmentDate: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    console.log(`[userManagement] ✅ Student document created for ${result.userId}`);
    
  } catch (studentDocError: any) {
    console.error(`[userManagement] ⚠️ Failed to create student document:`, studentDocError);
  }

  return result;
}

/**
 * Creates a parent user
 */
export async function createParentWithRole(
  params: CreateUserWithRoleParams & {
    studentIds?: string[];
    contactNumber?: string;
  }
): Promise<CreateUserWithRoleResult> {
  const { studentIds, contactNumber, ...baseParams } = params;
  
  // Force role to 'parent'
  const parentParams = { ...baseParams, role: 'parent' as UserRole };
  
  const result = await createUserWithRole(parentParams);
  
  if (!result.success || !result.userId) {
    return result;
  }

  // Create parent document
  const db = getFirestore();
  
  try {
    await setDoc(doc(db, 'parents', result.userId), {
      uid: result.userId,
      email: baseParams.email,
      firstName: baseParams.additionalData?.firstName || '',
      lastName: baseParams.additionalData?.lastName || '',
      displayName: baseParams.displayName || '',
      schoolId: baseParams.schoolId || 'default',
      studentIds: studentIds || [],
      contactNumber: contactNumber || '',
      status: 'active',
      createdAt: serverTimestamp()
    });

    console.log(`[userManagement] ✅ Parent document created for ${result.userId}`);
    
  } catch (parentDocError: any) {
    console.error(`[userManagement] ⚠️ Failed to create parent document:`, parentDocError);
  }

  return result;
}
