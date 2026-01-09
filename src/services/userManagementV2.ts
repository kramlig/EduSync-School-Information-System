/**
 * User Management Service v2 - Cloud Function Based
 * 
 * Uses Firebase Cloud Function with Admin SDK to create users.
 * This approach does NOT hijack the admin's session.
 * 
 * Benefits:
 * - No admin password required
 * - Admin stays logged in during user creation
 * - Atomic operations on server-side
 * - Better error handling
 * - Custom claims set immediately
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getApp } from 'firebase/app';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'registrar' | 'superadmin';

interface CreateUserParams {
  email: string;
  password: string;
  role: UserRole;
  schoolId: string;
  userData?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    contactNumber?: string;
    lrn?: string;
    gradeLevel?: number;
    sectionId?: string;
    birthdate?: string;
    gender?: string;
  };
}

interface CreateUserResult {
  success: boolean;
  userId?: string;
  postgresUserId?: string;
  email?: string;
  role?: string;
  message?: string;
  error?: string;
}

interface CloudFunctionResponse {
  success: boolean;
  userId?: string;
  postgresUserId?: string;
  email?: string;
  role?: string;
  message?: string;
}

/**
 * Create user account via Cloud Function
 * This is the primary method - admin session is preserved
 */
export async function createUserViaCloudFunction(params: CreateUserParams): Promise<CreateUserResult> {
  console.log('[UserManagement v2] Creating user via Cloud Function', {
    email: params.email,
    role: params.role,
    schoolId: params.schoolId
  });

  try {
    const functions = getFunctions(getApp());
    const createUserAccount = httpsCallable<CreateUserParams, CloudFunctionResponse>(
      functions, 
      'createUserAccount'
    );
    
    const result: HttpsCallableResult<CloudFunctionResponse> = await createUserAccount(params);
    
    console.log('[UserManagement v2] Cloud Function result:', result.data);
    
    if (result.data.success) {
      return {
        success: true,
        userId: result.data.userId,
        postgresUserId: result.data.postgresUserId,
        email: result.data.email,
        role: result.data.role,
        message: result.data.message
      };
    } else {
      return {
        success: false,
        error: 'User creation failed'
      };
    }
  } catch (error: any) {
    console.error('[UserManagement v2] Cloud Function error:', error);
    
    // Extract error message from Firebase Functions error
    let errorMessage = 'Failed to create user account';
    
    if (error.code === 'functions/already-exists') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'functions/permission-denied') {
      errorMessage = 'You do not have permission to create user accounts';
    } else if (error.code === 'functions/unauthenticated') {
      errorMessage = 'You must be logged in to create user accounts';
    } else if (error.code === 'functions/invalid-argument') {
      errorMessage = error.message || 'Invalid input data';
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
 * Create teacher account
 */
export async function createTeacher(params: {
  email: string;
  password: string;
  schoolId: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  contactNumber?: string;
  displayName?: string;
}): Promise<CreateUserResult> {
  return createUserViaCloudFunction({
    email: params.email,
    password: params.password,
    role: 'teacher',
    schoolId: params.schoolId,
    userData: {
      displayName: params.displayName || `${params.firstName || ''} ${params.lastName || ''}`.trim(),
      firstName: params.firstName,
      lastName: params.lastName,
      middleName: params.middleName,
      contactNumber: params.contactNumber
    }
  });
}

/**
 * Create student account
 */
export async function createStudent(params: {
  email: string;
  password: string;
  schoolId: string;
  lrn: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gradeLevel?: number;
  sectionId?: string;
  birthdate?: string;
  gender?: string;
  displayName?: string;
}): Promise<CreateUserResult> {
  return createUserViaCloudFunction({
    email: params.email,
    password: params.password,
    role: 'student',
    schoolId: params.schoolId,
    userData: {
      displayName: params.displayName || `${params.firstName || ''} ${params.lastName || ''}`.trim(),
      firstName: params.firstName,
      lastName: params.lastName,
      middleName: params.middleName,
      lrn: params.lrn,
      gradeLevel: params.gradeLevel,
      sectionId: params.sectionId,
      birthdate: params.birthdate,
      gender: params.gender
    }
  });
}

/**
 * Create registrar account
 */
export async function createRegistrar(params: {
  email: string;
  password: string;
  schoolId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}): Promise<CreateUserResult> {
  return createUserViaCloudFunction({
    email: params.email,
    password: params.password,
    role: 'registrar',
    schoolId: params.schoolId,
    userData: {
      displayName: params.displayName || `${params.firstName || ''} ${params.lastName || ''}`.trim(),
      firstName: params.firstName,
      lastName: params.lastName
    }
  });
}

/**
 * Create admin account
 */
export async function createAdmin(params: {
  email: string;
  password: string;
  schoolId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}): Promise<CreateUserResult> {
  return createUserViaCloudFunction({
    email: params.email,
    password: params.password,
    role: 'admin',
    schoolId: params.schoolId,
    userData: {
      displayName: params.displayName || `${params.firstName || ''} ${params.lastName || ''}`.trim(),
      firstName: params.firstName,
      lastName: params.lastName
    }
  });
}
