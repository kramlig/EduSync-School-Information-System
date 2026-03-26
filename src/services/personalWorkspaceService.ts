/**
 * Personal Workspace Service
 *
 * Handles creation, lookup, and tier enforcement for personal workspaces.
 * Uses Supabase RPCs defined in scripts/migrations/001_personal_workspace.sql.
 */

import { supabase } from '../lib/supabase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from './firestoreService';

// ─── Types ───────────────────────────────────────────────

export type WorkspaceTier = 'free' | 'pro' | 'school';

export interface PersonalSignupData {
  fullName: string;
  email: string;
  password: string;
  schoolName: string;
  schoolIdNumber: string;
  division: string;
  region: string;
  district?: string;
  gradeLevel: number;
  sectionName: string;
}

export interface Subscription {
  id: string;
  tier: WorkspaceTier;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  maxStudents: number;
  maxTeachingSections: number;
  maxAdvisorySections: number;
  maxDownloadsPerDay: number;
  currentPeriodEnd: string | null;
}

export interface PersonalWorkspace {
  schoolId: string;
  schoolName: string;
  teacherId: string;
  teacherName: string;
  tier: WorkspaceTier;
}

export interface WorkspaceCreationResult {
  school_id: string;
  teacher_id: string;
  section_id: string;
  subscription_id: string;
}

// ─── Auth: Create Account ────────────────────────────────

/**
 * Register a new personal workspace user via email/password.
 * 1. Create Firebase Auth user
 * 2. Call Supabase RPC to create virtual school + teacher + section + subscription
 * 3. Return session data for login
 */
export async function signupPersonal(data: PersonalSignupData): Promise<{
  firebaseUid: string;
  workspace: WorkspaceCreationResult;
}> {
  // 1. Create Firebase Auth user
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const firebaseUid = cred.user.uid;

  try {
    // 2. Create workspace atomically in PostgreSQL
    const workspace = await createPersonalWorkspace(firebaseUid, data);
    return { firebaseUid, workspace };
  } catch (err) {
    // If workspace creation fails, delete the Firebase user to keep things consistent
    try { await cred.user.delete(); } catch { /* best effort */ }
    throw err;
  }
}

/**
 * Sign up with Google, then create workspace.
 * If user already has a workspace, returns it instead of creating.
 */
export async function signupWithGoogle(
  profile: Omit<PersonalSignupData, 'email' | 'password' | 'fullName'>
): Promise<{
  firebaseUid: string;
  workspace: WorkspaceCreationResult | PersonalWorkspace;
  isExisting: boolean;
}> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const firebaseUid = cred.user.uid;
  const email = cred.user.email!;
  const fullName = cred.user.displayName || email.split('@')[0];

  // Check if workspace already exists
  const existing = await getPersonalWorkspace(firebaseUid);
  if (existing) {
    return { firebaseUid, workspace: existing, isExisting: true };
  }

  const workspace = await createPersonalWorkspace(firebaseUid, {
    ...profile,
    fullName,
    email,
    password: '', // not used for Google auth
  });
  return { firebaseUid, workspace, isExisting: false };
}

// ─── Workspace CRUD ──────────────────────────────────────

async function createPersonalWorkspace(
  firebaseUid: string,
  data: PersonalSignupData
): Promise<WorkspaceCreationResult> {
  const { data: result, error } = await supabase.rpc('create_personal_workspace', {
    p_firebase_uid: firebaseUid,
    p_email: data.email,
    p_full_name: data.fullName,
    p_school_name: data.schoolName,
    p_school_id_number: data.schoolIdNumber,
    p_division: data.division,
    p_region: data.region,
    p_district: data.district || null,
    p_grade_level: data.gradeLevel,
    p_section_name: data.sectionName,
    p_school_year: getCurrentSchoolYear(),
  });

  if (error) {
    throw new Error(`Failed to create workspace: ${error.message}`);
  }

  return result as WorkspaceCreationResult;
}

export async function getPersonalWorkspace(
  firebaseUid: string
): Promise<PersonalWorkspace | null> {
  const { data, error } = await supabase.rpc('get_personal_workspace', {
    p_firebase_uid: firebaseUid,
  });

  if (error || !data) return null;

  return {
    schoolId: data.school_id,
    schoolName: data.school_name,
    teacherId: data.teacher_id,
    teacherName: data.teacher_name,
    tier: data.tier,
  };
}

// ─── Subscription ────────────────────────────────────────

export async function getUserSubscription(
  firebaseUid: string
): Promise<Subscription | null> {
  const { data, error } = await supabase.rpc('get_user_subscription', {
    p_firebase_uid: firebaseUid,
  });

  if (error || !data) return null;

  return {
    id: data.id,
    tier: data.tier,
    status: data.status,
    maxStudents: data.max_students,
    maxTeachingSections: data.max_teaching_sections,
    maxAdvisorySections: data.max_advisory_sections,
    maxDownloadsPerDay: data.max_downloads_per_day,
    currentPeriodEnd: data.current_period_end,
  };
}

// ─── Tier Enforcement ────────────────────────────────────

export interface WorkspaceLimits {
  tier: WorkspaceTier;
  maxStudents: number;
  maxTeachingSections: number;
  maxAdvisorySections: number;
  maxDownloadsPerDay: number;
  isPersonal: boolean;
}

const FREE_LIMITS: WorkspaceLimits = {
  tier: 'free',
  maxStudents: 50,
  maxTeachingSections: 1,
  maxAdvisorySections: 1,
  maxDownloadsPerDay: 10,
  isPersonal: true,
};

const PRO_LIMITS: WorkspaceLimits = {
  tier: 'pro',
  maxStudents: 99999,
  maxTeachingSections: 99999,
  maxAdvisorySections: 2,
  maxDownloadsPerDay: 99999,
  isPersonal: true,
};

const SCHOOL_LIMITS: WorkspaceLimits = {
  tier: 'school',
  maxStudents: 99999,
  maxTeachingSections: 99999,
  maxAdvisorySections: 99999,
  maxDownloadsPerDay: 99999,
  isPersonal: false,
};

export function getLimitsForTier(tier: WorkspaceTier, isPersonal: boolean): WorkspaceLimits {
  if (!isPersonal) return SCHOOL_LIMITS;
  if (tier === 'pro') return PRO_LIMITS;
  return FREE_LIMITS;
}

export function limitsFromSubscription(sub: Subscription | null, isPersonal: boolean): WorkspaceLimits {
  if (!isPersonal) return SCHOOL_LIMITS;
  if (!sub) return FREE_LIMITS;
  return {
    tier: sub.tier,
    maxStudents: sub.maxStudents,
    maxTeachingSections: sub.maxTeachingSections,
    maxAdvisorySections: sub.maxAdvisorySections,
    maxDownloadsPerDay: sub.maxDownloadsPerDay,
    isPersonal: true,
  };
}

// ─── Self-Assignment (ECR Support) ───────────────────────

/**
 * Create a teaching assignment for the personal workspace owner.
 * This is the self-assignment pattern that aligns personal workspace
 * data with institutional workspace so ECR queries work identically.
 */
export async function createPersonalTeachingAssignment(params: {
  schoolId: string;
  teacherId: string;
  sectionId: string;
  learningAreaId: string;
  gradeLevel?: number;
  isAdvisory?: boolean;
  schoolYear?: string;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_personal_teaching_assignment', {
    p_school_id: params.schoolId,
    p_teacher_id: params.teacherId,
    p_section_id: params.sectionId,
    p_learning_area_id: params.learningAreaId,
    p_grade_level: params.gradeLevel ?? 6,
    p_is_advisory: params.isAdvisory ?? false,
    p_school_year: params.schoolYear ?? getCurrentSchoolYear(),
  });

  if (error) {
    console.error('[personalWorkspaceService] createPersonalTeachingAssignment error:', error);
    return null;
  }
  return data as string;
}

/**
 * Auto-assign all active learning areas for a grade level to a section.
 * Used when a personal workspace teacher creates a new section.
 */
export async function autoAssignPersonalSection(params: {
  schoolId: string;
  teacherId: string;
  sectionId: string;
  gradeLevel?: number;
  schoolYear?: string;
}): Promise<number> {
  const { data, error } = await supabase.rpc('auto_assign_personal_section', {
    p_school_id: params.schoolId,
    p_teacher_id: params.teacherId,
    p_section_id: params.sectionId,
    p_grade_level: params.gradeLevel ?? 6,
    p_school_year: params.schoolYear ?? getCurrentSchoolYear(),
  });

  if (error) {
    console.error('[personalWorkspaceService] autoAssignPersonalSection error:', error);
    return 0;
  }
  return (data as number) || 0;
}

/**
 * Check if ECR is enabled for a personal workspace subscription.
 * Free tier = Quick Grade only; Pro = ECR enabled.
 */
export async function isECREnabled(firebaseUid: string): Promise<boolean> {
  const sub = await getUserSubscription(firebaseUid);
  if (!sub) return false;
  return sub.tier === 'pro' || sub.tier === 'school';
}

// ─── Helpers ─────────────────────────────────────────────

function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}
