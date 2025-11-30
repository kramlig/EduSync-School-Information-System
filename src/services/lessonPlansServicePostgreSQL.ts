/**
 * Lesson Plans Service (PostgreSQL)
 * 
 * Provides CRUD operations for lesson plans using PostgreSQL via Supabase
 * Migrated from Firestore: November 28, 2025
 * 
 * Features:
 * - Fetch lesson plans by school, section, learning area, date range
 * - Create, update, delete lesson plans
 * - Multi-tenant isolation via school_id
 * - Support for resources and assignment linking
 */

import { supabase } from '../lib/supabase';
import type { LessonPlan, LessonResource } from '../../types';

// ============================================================================
// FETCH OPERATIONS
// ============================================================================

/**
 * Fetch all lesson plans for a school
 * @param schoolId - School UUID
 * @returns Array of lesson plans
 */
export async function fetchLessonPlans(schoolId: string): Promise<LessonPlan[]> {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('school_id', schoolId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[lessonPlansService] Error fetching lesson plans:', error);
    throw new Error(`Failed to fetch lesson plans: ${error.message}`);
  }

  return (data || []).map(transformFromDB);
}

/**
 * Fetch lesson plans by section
 */
export async function fetchLessonPlansBySection(
  schoolId: string,
  sectionId: string
): Promise<LessonPlan[]> {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('school_id', schoolId)
    .eq('section_id', sectionId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[lessonPlansService] Error fetching lesson plans by section:', error);
    throw new Error(`Failed to fetch lesson plans: ${error.message}`);
  }

  return (data || []).map(transformFromDB);
}

/**
 * Fetch lesson plans by section and learning area
 */
export async function fetchLessonPlansBySectionAndArea(
  schoolId: string,
  sectionId: string,
  learningAreaId: string
): Promise<LessonPlan[]> {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('school_id', schoolId)
    .eq('section_id', sectionId)
    .eq('learning_area_id', learningAreaId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[lessonPlansService] Error fetching lesson plans:', error);
    throw new Error(`Failed to fetch lesson plans: ${error.message}`);
  }

  return (data || []).map(transformFromDB);
}

/**
 * Fetch lesson plans by date range
 */
export async function fetchLessonPlansByDateRange(
  schoolId: string,
  startDate: string,
  endDate: string
): Promise<LessonPlan[]> {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('school_id', schoolId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('[lessonPlansService] Error fetching lesson plans by date:', error);
    throw new Error(`Failed to fetch lesson plans: ${error.message}`);
  }

  return (data || []).map(transformFromDB);
}

// ============================================================================
// CREATE, UPDATE, DELETE OPERATIONS
// ============================================================================

/**
 * Add a new lesson plan
 */
export async function addLessonPlan(
  schoolId: string,
  lessonPlan: Omit<LessonPlan, 'id' | 'schoolId'>
): Promise<LessonPlan> {
  const dbData = {
    school_id: schoolId,
    section_id: lessonPlan.sectionId,
    learning_area_id: lessonPlan.learningAreaId,
    date: lessonPlan.date,
    title: lessonPlan.title,
    objectives: lessonPlan.objectives || [],
    activities: lessonPlan.activities || [],
    materials: lessonPlan.materials || [],
    assessment: lessonPlan.assessment || [],
    resources: lessonPlan.resources || [],
    assignment_ids: lessonPlan.assignmentIds || []
  };

  const { data, error } = await supabase
    .from('lesson_plans')
    .insert([dbData])
    .select()
    .single();

  if (error) {
    console.error('[lessonPlansService] Error adding lesson plan:', error);
    throw new Error(`Failed to add lesson plan: ${error.message}`);
  }

  return transformFromDB(data);
}

/**
 * Update an existing lesson plan
 */
export async function updateLessonPlan(lessonPlan: LessonPlan): Promise<void> {
  const dbData = {
    section_id: lessonPlan.sectionId,
    learning_area_id: lessonPlan.learningAreaId,
    date: lessonPlan.date,
    title: lessonPlan.title,
    objectives: lessonPlan.objectives || [],
    activities: lessonPlan.activities || [],
    materials: lessonPlan.materials || [],
    assessment: lessonPlan.assessment || [],
    resources: lessonPlan.resources || [],
    assignment_ids: lessonPlan.assignmentIds || []
  };

  const { error } = await supabase
    .from('lesson_plans')
    .update(dbData)
    .eq('id', lessonPlan.id);

  if (error) {
    console.error('[lessonPlansService] Error updating lesson plan:', error);
    throw new Error(`Failed to update lesson plan: ${error.message}`);
  }
}

/**
 * Delete a lesson plan
 */
export async function deleteLessonPlan(lessonPlanId: string): Promise<void> {
  const { error } = await supabase
    .from('lesson_plans')
    .delete()
    .eq('id', lessonPlanId);

  if (error) {
    console.error('[lessonPlansService] Error deleting lesson plan:', error);
    throw new Error(`Failed to delete lesson plan: ${error.message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform PostgreSQL row to LessonPlan interface
 */
function transformFromDB(row: any): LessonPlan {
  return {
    id: row.id,
    schoolId: row.school_id,
    sectionId: row.section_id,
    learningAreaId: row.learning_area_id,
    date: row.date,
    title: row.title,
    objectives: row.objectives || [],
    activities: row.activities || [],
    materials: row.materials || [],
    assessment: row.assessment || [],
    resources: (row.resources || []) as LessonResource[],
    assignmentIds: row.assignment_ids || []
  };
}
