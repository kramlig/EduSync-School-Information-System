/**
 * Substitute Assignments Service (PostgreSQL)
 * 
 * Service layer for CRUD operations on substitute_assignments table.
 * Follows multi-tenant architecture with school_id isolation.
 * 
 * @module substituteServicePostgreSQL
 */

import { supabase } from '../lib/supabase';
import type { SubstituteAssignment } from '../../types';

// ==================== Type Definitions ====================

/**
 * Database row structure (snake_case)
 */
interface SubstituteAssignmentRow {
  id: string;
  school_id: string;
  teacher_id: string;
  original_teacher_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  notes: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Extended SubstituteAssignment with optional PostgreSQL fields
 */
export interface SubstituteAssignmentExtended extends SubstituteAssignment {
  reason?: string;
  notes?: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ==================== Type Transformations ====================

/**
 * Transform database row to SubstituteAssignment type
 */
function transformRowToAssignment(row: SubstituteAssignmentRow): SubstituteAssignmentExtended {
  return {
    id: row.id,
    schoolId: row.school_id,
    teacherId: row.teacher_id,
    originalTeacherId: row.original_teacher_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason || undefined,
    notes: row.notes || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || undefined,
  };
}

/**
 * Transform SubstituteAssignment to database row format
 */
function transformAssignmentToRow(
  assignment: Partial<SubstituteAssignmentExtended>,
  schoolId: string
): Partial<SubstituteAssignmentRow> {
  const row: Partial<SubstituteAssignmentRow> = {
    school_id: schoolId,
  };

  if (assignment.teacherId !== undefined) row.teacher_id = assignment.teacherId;
  if (assignment.originalTeacherId !== undefined) row.original_teacher_id = assignment.originalTeacherId;
  if (assignment.startDate !== undefined) row.start_date = assignment.startDate;
  if (assignment.endDate !== undefined) row.end_date = assignment.endDate;
  if (assignment.reason !== undefined) row.reason = assignment.reason || null;
  if (assignment.notes !== undefined) row.notes = assignment.notes || null;
  if (assignment.status !== undefined) row.status = assignment.status;
  if (assignment.createdBy !== undefined) row.created_by = assignment.createdBy || null;

  return row;
}

// ==================== CRUD Operations ====================

/**
 * Fetch all substitute assignments for a school
 */
export async function fetchSubstituteAssignments(
  schoolId: string
): Promise<SubstituteAssignmentExtended[]> {
  const { data, error } = await supabase
    .from('substitute_assignments')
    .select('*')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('[SubstituteService] Error fetching assignments:', error);
    throw new Error(`Failed to fetch substitute assignments: ${error.message}`);
  }

  return (data || []).map(transformRowToAssignment);
}

/**
 * Fetch substitute assignments by status
 */
export async function fetchSubstituteAssignmentsByStatus(
  schoolId: string,
  status: 'pending' | 'active' | 'completed' | 'cancelled'
): Promise<SubstituteAssignmentExtended[]> {
  const { data, error } = await supabase
    .from('substitute_assignments')
    .select('*')
    .eq('school_id', schoolId)
    .eq('status', status)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('[SubstituteService] Error fetching by status:', error);
    throw new Error(`Failed to fetch assignments by status: ${error.message}`);
  }

  return (data || []).map(transformRowToAssignment);
}

/**
 * Fetch active substitute assignments (within date range)
 */
export async function fetchActiveSubstituteAssignments(
  schoolId: string
): Promise<SubstituteAssignmentExtended[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('substitute_assignments')
    .select('*')
    .eq('school_id', schoolId)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[SubstituteService] Error fetching active assignments:', error);
    throw new Error(`Failed to fetch active assignments: ${error.message}`);
  }

  return (data || []).map(transformRowToAssignment);
}

/**
 * Fetch substitute assignments for a specific teacher (as substitute)
 */
export async function fetchAssignmentsBySubstituteTeacher(
  schoolId: string,
  teacherId: string
): Promise<SubstituteAssignmentExtended[]> {
  const { data, error } = await supabase
    .from('substitute_assignments')
    .select('*')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('[SubstituteService] Error fetching by substitute:', error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }

  return (data || []).map(transformRowToAssignment);
}

/**
 * Fetch substitute assignments for a specific teacher (being replaced)
 */
export async function fetchAssignmentsByOriginalTeacher(
  schoolId: string,
  teacherId: string
): Promise<SubstituteAssignmentExtended[]> {
  const { data, error } = await supabase
    .from('substitute_assignments')
    .select('*')
    .eq('school_id', schoolId)
    .eq('original_teacher_id', teacherId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('[SubstituteService] Error fetching by original teacher:', error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }

  return (data || []).map(transformRowToAssignment);
}

/**
 * Add a new substitute assignment
 */
export async function addSubstituteAssignment(
  schoolId: string,
  assignment: Omit<SubstituteAssignmentExtended, 'id' | 'schoolId'>
): Promise<SubstituteAssignmentExtended> {
  const row = transformAssignmentToRow(assignment, schoolId);

  const { data, error } = await supabase
    .from('substitute_assignments')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[SubstituteService] Error adding assignment:', error);
    throw new Error(`Failed to add substitute assignment: ${error.message}`);
  }

  return transformRowToAssignment(data);
}

/**
 * Update an existing substitute assignment
 */
export async function updateSubstituteAssignment(
  assignmentId: string,
  schoolId: string,
  updates: Partial<SubstituteAssignmentExtended>
): Promise<SubstituteAssignmentExtended> {
  // Don't include schoolId in the row transformation - it's used for WHERE clause
  const row = transformAssignmentToRow(updates, schoolId);
  // Remove school_id from updates to avoid constraint issues
  delete row.school_id;

  const { data, error } = await supabase
    .from('substitute_assignments')
    .update(row)
    .eq('id', assignmentId)
    .eq('school_id', schoolId)
    .select()
    .single();

  if (error) {
    console.error('[SubstituteService] Error updating assignment:', error);
    throw new Error(`Failed to update substitute assignment: ${error.message}`);
  }

  return transformRowToAssignment(data);
}

/**
 * Delete a substitute assignment
 */
export async function deleteSubstituteAssignment(
  assignmentId: string,
  schoolId: string
): Promise<void> {
  const { error } = await supabase
    .from('substitute_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('school_id', schoolId);

  if (error) {
    console.error('[SubstituteService] Error deleting assignment:', error);
    throw new Error(`Failed to delete substitute assignment: ${error.message}`);
  }
}

/**
 * Bulk delete substitute assignments
 */
export async function bulkDeleteSubstituteAssignments(
  assignmentIds: string[],
  schoolId: string
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < assignmentIds.length; i += batchSize) {
    const batch = assignmentIds.slice(i, i + batchSize);

    const { error, count } = await supabase
      .from('substitute_assignments')
      .delete()
      .in('id', batch)
      .eq('school_id', schoolId);

    if (error) {
      console.error('[SubstituteService] Batch delete error:', error);
      failed += batch.length;
    } else {
      deleted += count || batch.length;
    }
  }

  return { deleted, failed };
}

// ==================== Statistics ====================

/**
 * Get substitute assignment statistics for a school
 */
export async function getSubstituteStatistics(schoolId: string): Promise<{
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all assignments for the school
  const { data, error } = await supabase
    .from('substitute_assignments')
    .select('start_date, end_date, status')
    .eq('school_id', schoolId);

  if (error) {
    console.error('[SubstituteService] Error fetching statistics:', error);
    return { total: 0, active: 0, scheduled: 0, completed: 0, cancelled: 0 };
  }

  const assignments = data || [];
  let active = 0;
  let scheduled = 0;
  let completed = 0;
  let cancelled = 0;

  for (const a of assignments) {
    if (a.status === 'cancelled') {
      cancelled++;
    } else if (today >= a.start_date && today <= a.end_date) {
      active++;
    } else if (today < a.start_date) {
      scheduled++;
    } else {
      completed++;
    }
  }

  return {
    total: assignments.length,
    active,
    scheduled,
    completed,
    cancelled,
  };
}

/**
 * Check for scheduling conflicts
 */
export async function checkScheduleConflicts(
  schoolId: string,
  teacherId: string,
  startDate: string,
  endDate: string,
  excludeAssignmentId?: string
): Promise<SubstituteAssignmentExtended[]> {
  let query = supabase
    .from('substitute_assignments')
    .select('*')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)
    .not('status', 'eq', 'cancelled')
    // Check for overlapping dates
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (excludeAssignmentId) {
    query = query.not('id', 'eq', excludeAssignmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[SubstituteService] Error checking conflicts:', error);
    return [];
  }

  // Filter for actual overlaps
  return (data || [])
    .filter(a => {
      const aStart = a.start_date;
      const aEnd = a.end_date;
      return startDate <= aEnd && endDate >= aStart;
    })
    .map(transformRowToAssignment);
}
