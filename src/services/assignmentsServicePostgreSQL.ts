/**
 * assignmentsServicePostgreSQL - PostgreSQL Assignments Service
 * 
 * Manages assignments and student assignment grades in PostgreSQL
 * 
 * PostgreSQL Migration: ✅ COMPLETE (Nov 27, 2025)
 * - Replaces Firestore assignments and studentAssignmentGrades collections
 * - Uses assignments and student_assignment_grades tables
 * - Full CRUD operations with multi-tenant support
 */

import { supabase } from '../lib/supabase';
import type { Assignment, StudentAssignmentGrade } from '../../types';

// PostgreSQL row interfaces
interface AssignmentRow {
  id: string;
  school_id: string;
  section_id: string;
  learning_area_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number | null;
  created_at: string;
  updated_at: string;
}

interface StudentAssignmentGradeRow {
  id: string;
  school_id: string;
  assignment_id: string;
  student_id: string;
  score: number | null;
  submission_date: string | null;
  file_path: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert PostgreSQL row to Assignment type
 */
function rowToAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    schoolId: row.school_id,
    sectionId: row.section_id,
    learningAreaId: row.learning_area_id,
    title: row.title,
    description: row.description || '',
    totalPoints: row.max_score || 100,
    dueDate: row.due_date ? row.due_date.split('T')[0] : ''
  };
}

/**
 * Convert PostgreSQL row to StudentAssignmentGrade type
 */
function rowToGrade(row: StudentAssignmentGradeRow): StudentAssignmentGrade {
  return {
    id: row.id,
    schoolId: row.school_id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    score: row.score,
    submissionDate: row.submission_date,
    filePath: row.file_path,
    feedback: row.feedback
  };
}

// ==========================================
// ASSIGNMENTS CRUD
// ==========================================

/**
 * Fetch all assignments for a school
 */
export async function fetchAssignments(schoolId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('due_date', { ascending: false });

  if (error) {
    console.error('[assignmentsServicePostgreSQL] Error fetching assignments:', error);
    throw error;
  }

  return (data || []).map(rowToAssignment);
}

/**
 * Add new assignment
 * @param teacherFirebaseUid - Firebase UID of the teacher/admin (will be converted to PostgreSQL UUID)
 */
export async function addAssignment(
  schoolId: string,
  teacherFirebaseUid: string,
  assignment: Omit<Assignment, 'id' | 'schoolId'>
): Promise<Assignment> {
  // Option A Architecture: Query teachers directly by firebase_uid (no users table)
  const { data: teachers } = await supabase
    .from('teachers')
    .select('id')
    .eq('firebase_uid', teacherFirebaseUid)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .limit(1);

  let teacherId: string;

  if (teachers && teachers.length > 0) {
    // Found teacher record - use it
    teacherId = teachers[0].id;
  } else {
    // No teacher record (probably admin) - get first teacher from school as fallback
    console.warn('[assignmentsServicePostgreSQL] User is not a teacher (probably admin), using fallback teacher');
    
    const { data: fallbackTeachers, error: fallbackError } = await supabase
      .from('teachers')
      .select('id')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .limit(1);

    if (fallbackError || !fallbackTeachers || fallbackTeachers.length === 0) {
      console.error('[assignmentsServicePostgreSQL] No teachers found in school:', fallbackError);
      throw new Error('No teachers available. Please create a teacher account first or assign yourself as a teacher.');
    }

    teacherId = fallbackTeachers[0].id;
    console.log('[assignmentsServicePostgreSQL] Using fallback teacher:', teacherId);
  }

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      school_id: schoolId,
      section_id: assignment.sectionId,
      learning_area_id: assignment.learningAreaId,
      teacher_id: teacherId, // Use PostgreSQL UUID
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.dueDate,
      max_score: assignment.totalPoints
    })
    .select()
    .single();

  if (error) {
    console.error('[assignmentsServicePostgreSQL] Error adding assignment:', error);
    throw error;
  }

  return rowToAssignment(data);
}

/**
 * Update existing assignment
 */
export async function updateAssignment(assignment: Assignment): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .update({
      section_id: assignment.sectionId,
      learning_area_id: assignment.learningAreaId,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.dueDate,
      max_score: assignment.totalPoints,
      updated_at: new Date().toISOString()
    })
    .eq('id', assignment.id);

  if (error) {
    console.error('[assignmentsServicePostgreSQL] Error updating assignment:', error);
    throw error;
  }
}

/**
 * Delete assignment (soft delete)
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', assignmentId);

  if (error) {
    console.error('[assignmentsServicePostgreSQL] Error deleting assignment:', error);
    throw error;
  }
}

// ==========================================
// STUDENT ASSIGNMENT GRADES CRUD
// ==========================================

/**
 * Fetch all grades for a school
 */
export async function fetchStudentAssignmentGrades(schoolId: string): Promise<StudentAssignmentGrade[]> {
  const { data, error } = await supabase
    .from('student_assignment_grades')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    console.error('[assignmentsServicePostgreSQL] Error fetching grades:', error);
    throw error;
  }

  return (data || []).map(rowToGrade);
}

/**
 * Update or insert student assignment grade
 */
export async function updateAssignmentGrade(
  schoolId: string,
  studentId: string,
  assignmentId: string,
  score: number | null,
  feedback: string | null
): Promise<void> {
  // Check if grade exists (use maybeSingle to avoid 406 error when not found)
  const { data: existing, error: checkError } = await supabase
    .from('student_assignment_grades')
    .select('id')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .maybeSingle();

  if (checkError) {
    console.error('[assignmentsServicePostgreSQL] Error checking for existing grade:', checkError);
    throw checkError;
  }

  if (existing) {
    // Update existing grade
    const { error } = await supabase
      .from('student_assignment_grades')
      .update({
        score,
        feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[assignmentsServicePostgreSQL] Error updating grade:', error);
      throw error;
    }
  } else {
    // Insert new grade
    const { error } = await supabase
      .from('student_assignment_grades')
      .insert({
        school_id: schoolId,
        student_id: studentId,
        assignment_id: assignmentId,
        score,
        feedback
      });

    if (error) {
      console.error('[assignmentsServicePostgreSQL] Error inserting grade:', error);
      throw error;
    }
  }
}

/**
 * Submit assignment (student submission)
 */
export async function submitAssignment(
  schoolId: string,
  studentId: string,
  assignmentId: string,
  filePath: string
): Promise<void> {
  // Check if submission exists
  const { data: existing, error: checkError } = await supabase
    .from('student_assignment_grades')
    .select('id')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking for existing submission:', checkError);
    throw checkError;
  }

  const submissionDate = new Date().toISOString();

  if (existing) {
    // Update existing submission
    const { error } = await supabase
      .from('student_assignment_grades')
      .update({
        submission_date: submissionDate,
        file_path: filePath,
        updated_at: submissionDate
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[assignmentsServicePostgreSQL] Error updating submission:', error);
      throw error;
    }
  } else {
    // Insert new submission
    const { error } = await supabase
      .from('student_assignment_grades')
      .insert({
        school_id: schoolId,
        student_id: studentId,
        assignment_id: assignmentId,
        submission_date: submissionDate,
        file_path: filePath,
        score: null,
        feedback: null
      });

    if (error) {
      console.error('[assignmentsServicePostgreSQL] Error inserting submission:', error);
      throw error;
    }
  }
}

/**
 * Fetch grades for a specific student
 */
export async function fetchStudentGrades(
  schoolId: string,
  studentId: string
): Promise<StudentAssignmentGrade[]> {
  const { data, error } = await supabase
    .from('student_assignment_grades')
    .select('*')
    .eq('school_id', schoolId)
    .eq('student_id', studentId);

  if (error) {
    console.error('[assignmentsServicePostgreSQL] Error fetching student grades:', error);
    throw error;
  }

  return (data || []).map(rowToGrade);
}
