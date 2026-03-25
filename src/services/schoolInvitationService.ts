/**
 * schoolInvitationService — Handles school invitation & migration flows.
 *
 * Allows personal workspace teachers to accept invitations from
 * institutional schools and optionally migrate their data.
 */

import { supabase } from '../lib/supabase';

export interface InvitationInfo {
  success: boolean;
  error?: string;
  invite_code?: string;
  school_name?: string;
  expires_at?: string;
}

export interface AcceptResult {
  success: boolean;
  error?: string;
  teacher_id?: string;
  school_id?: string;
  school_name?: string;
  role?: string;
  has_personal_data?: boolean;
}

export interface PendingInvitation {
  id: string;
  school_id: string;
  invite_code: string;
  school_name: string;
  invited_by_name: string;
  role: string;
  expires_at: string;
  created_at: string;
}

export type DataAction = 'import' | 'archive' | 'delete';

/**
 * Validate a school invitation code and return school info.
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  school_name?: string;
  role?: string;
  restricted_email?: string;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('school_invitations')
    .select('school_id, role, invited_email, expires_at, max_uses, use_count, schools(name)')
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'pending')
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired invitation code' };
  }

  const now = new Date();
  if (new Date(data.expires_at) < now) {
    return { valid: false, error: 'This invitation has expired' };
  }

  if (data.use_count >= data.max_uses) {
    return { valid: false, error: 'This invitation has already been used' };
  }

  const schoolRecord = data.schools as any;
  return {
    valid: true,
    school_name: schoolRecord?.name || 'Unknown School',
    role: data.role,
    restricted_email: data.invited_email || undefined,
  };
}

/**
 * Accept a school invitation. Creates teacher record in the school
 * and optionally records a migration intent for personal data.
 */
export async function acceptInvitation(
  inviteCode: string,
  firebaseUid: string,
  teacherName: string,
  teacherEmail: string,
  dataAction: DataAction = 'archive'
): Promise<AcceptResult> {
  const { data, error } = await supabase.rpc('accept_school_invitation', {
    p_invite_code: inviteCode,
    p_firebase_uid: firebaseUid,
    p_teacher_name: teacherName,
    p_teacher_email: teacherEmail,
    p_data_action: dataAction,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as AcceptResult;
}

/**
 * Check if user has any pending invitations (matched by email).
 */
export async function getPendingInvitations(
  email: string
): Promise<PendingInvitation[]> {
  const { data } = await supabase
    .from('school_invitations')
    .select('id, school_id, invite_code, role, expires_at, created_at, schools(name)')
    .eq('invited_email', email.toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (!data) return [];

  return data.map((inv: any) => ({
    id: inv.id,
    school_id: inv.school_id,
    invite_code: inv.invite_code,
    school_name: inv.schools?.name || 'Unknown School',
    invited_by_name: '',
    role: inv.role,
    expires_at: inv.expires_at,
    created_at: inv.created_at,
  }));
}

/**
 * Get the invitation link for sharing.
 */
export function getInviteLink(code: string): string {
  return `${window.location.origin}/personal/join?code=${code}`;
}

/**
 * Copy invite link to clipboard.
 */
export async function copyInviteLink(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getInviteLink(code));
    return true;
  } catch {
    return false;
  }
}
