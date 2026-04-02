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
import { seedDefaultLearningAreas } from './learningAreasServicePostgreSQL';

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
  // Direct table inserts instead of RPC (create_personal_workspace function may not exist in DB)
  const schoolYear = getCurrentSchoolYear();
  const schoolType = data.gradeLevel <= 6 ? 'elementary' : data.gradeLevel <= 10 ? 'high_school' : 'senior_high';

  // 1. Create school
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .insert({
      name: data.schoolName,
      school_id_number: data.schoolIdNumber || null,
      region: data.region,
      division: data.division,
      district: data.district || null,
      type: 'personal',
      school_type: schoolType,
      owner_uid: firebaseUid,
      current_school_year: schoolYear,
    })
    .select('id')
    .single();

  if (schoolErr || !school) {
    throw new Error(`Failed to create school: ${schoolErr?.message || 'unknown error'}`);
  }

  // 2. Create teacher
  const nameParts = data.fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const { data: teacher, error: teacherErr } = await supabase
    .from('teachers')
    .insert({
      school_id: school.id,
      firebase_uid: firebaseUid,
      email: data.email,
      name: data.fullName,
      first_name: firstName,
      last_name: lastName,
      role: 'teacher',
    })
    .select('id')
    .single();

  if (teacherErr || !teacher) {
    throw new Error(`Failed to create teacher: ${teacherErr?.message || 'unknown error'}`);
  }

  // 3. Create section
  const { data: section, error: sectionErr } = await supabase
    .from('sections')
    .insert({
      school_id: school.id,
      name: data.sectionName,
      grade_level: data.gradeLevel,
      school_year: schoolYear,
      adviser_id: teacher.id,
    })
    .select('id')
    .single();

  if (sectionErr || !section) {
    throw new Error(`Failed to create section: ${sectionErr?.message || 'unknown error'}`);
  }

  // 4. Create free subscription (non-fatal — app defaults to free tier if no subscription row)
  let subscriptionId = '';
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .insert({
        user_id: firebaseUid,
        tier: 'free',
        status: 'active',
        max_students: 50,
        max_teaching_sections: 1,
        max_advisory_sections: 1,
        max_downloads_per_day: 10,
      })
      .select('id')
      .single();
    subscriptionId = subscription?.id || '';
  } catch (err) {
    console.warn('[personalWorkspaceService] Subscription creation skipped (RLS):', err);
  }

  // 5. Seed default learning areas
  try {
    await seedDefaultLearningAreas(school.id, 'elementary');
  } catch (err) {
    console.warn('[personalWorkspaceService] Learning area seeding failed (non-fatal):', err);
  }

  return {
    school_id: school.id,
    teacher_id: teacher.id,
    section_id: section.id,
    subscription_id: subscriptionId,
  };
}

export async function getPersonalWorkspace(
  firebaseUid: string
): Promise<PersonalWorkspace | null> {
  // Direct queries instead of RPC (get_personal_workspace function may not exist in DB)
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, name')
    .eq('owner_uid', firebaseUid)
    .eq('type', 'personal')
    .maybeSingle();

  if (schoolError || !school) return null;

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, name')
    .eq('school_id', school.id)
    .eq('firebase_uid', firebaseUid)
    .maybeSingle();

  return {
    schoolId: school.id,
    schoolName: school.name,
    teacherId: teacher?.id || '',
    teacherName: teacher?.name || '',
    tier: 'free',
  };
}

// ─── Subscription ────────────────────────────────────────

export async function getUserSubscription(
  firebaseUid: string
): Promise<Subscription | null> {
  // Direct query instead of RPC (get_user_subscription function may not exist in DB)
  try {
    // Find the teacher record for this firebase user
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .is('deleted_at', null)
      .maybeSingle();

    if (!teacher) return null;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', teacher.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!data) return null;

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
  } catch {
    return null;
  }
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
  // Fetch learning area name for the required 'subject' column
  const { data: la } = await supabase
    .from('learning_areas')
    .select('name')
    .eq('id', params.learningAreaId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('teaching_assignments')
    .insert({
      school_id: params.schoolId,
      teacher_id: params.teacherId,
      section_id: params.sectionId,
      learning_area_id: params.learningAreaId,
      subject: la?.name || 'Unknown',
      grade_level: params.gradeLevel ?? 6,
      is_advisory: params.isAdvisory ?? false,
      school_year: params.schoolYear ?? getCurrentSchoolYear(),
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[personalWorkspaceService] createPersonalTeachingAssignment error:', error);
    return null;
  }
  return data?.id || null;
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
  // Direct queries instead of RPC
  const gl = params.gradeLevel ?? 6;
  const sy = params.schoolYear ?? getCurrentSchoolYear();

  // Fetch active learning areas for this grade (include name for 'subject' column)
  const { data: areas } = await supabase
    .from('learning_areas')
    .select('id, name')
    .eq('school_id', params.schoolId)
    .eq('is_active', true)
    .contains('grade_levels', [gl]);

  if (!areas || areas.length === 0) return 0;

  // Create teaching assignments for each
  const rows = areas.map(la => ({
    school_id: params.schoolId,
    teacher_id: params.teacherId,
    section_id: params.sectionId,
    learning_area_id: la.id,
    subject: la.name,
    grade_level: gl,
    school_year: sy,
    is_advisory: false,
    is_active: true,
  }));

  const { data: inserted, error } = await supabase
    .from('teaching_assignments')
    .insert(rows)
    .select('id');

  if (error) {
    console.error('[personalWorkspaceService] autoAssignPersonalSection error:', error);
    return 0;
  }
  return inserted?.length || 0;
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
