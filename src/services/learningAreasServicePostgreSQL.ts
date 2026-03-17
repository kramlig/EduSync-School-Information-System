/**
 * Learning Areas Service (PostgreSQL)
 * 
 * Service layer for CRUD operations on learning_areas table.
 * Follows multi-tenant architecture with school_id isolation.
 */

import { supabase } from '../lib/supabase';
import type { LearningArea } from '../../types';

// ==================== Type Transformations ====================

/**
 * Database row structure (snake_case)
 */
interface LearningAreaRow {
  id: string;
  school_id: string;
  code: string;
  name: string;
  credits: number | null;
  category: 'core' | 'specialized' | 'elective' | 'tle' | 'sports' | null;
  grade_levels: number[];
  is_active: boolean;
  department: string | null;
  display_order: number;
  k_to_twelve_code: string | null;
  semester_based: boolean | null;
  semester: 1 | 2 | null;
  track_required: string[] | null;
  is_composite: boolean;
  components: string[] | null;
  prerequisite_id: string | null;
  description: string | null;
  hours_per_week: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to LearningArea type
 */
function transformRowToLearningArea(row: LearningAreaRow): LearningArea {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    credits: row.credits ?? 3, // Default to 3 if null (for old records)
    category: row.category || undefined,
    gradeLevel: row.grade_levels,
    isActive: row.is_active,
    department: row.department || undefined,
    order: row.display_order,
    kToTwelveCode: row.k_to_twelve_code || row.code || undefined, // Fallback to code field
    semesterBased: row.semester_based || undefined,
    semester: row.semester || undefined,
    trackRequired: row.track_required || undefined,
    isComposite: row.is_composite,
    components: row.components || undefined,
    subSubjects: row.components || undefined, // Alias for backward compatibility
    prerequisite: row.prerequisite_id || undefined,
    description: row.description || undefined,
    hoursPerWeek: row.hours_per_week || undefined,
  };
}

/**
 * Transform LearningArea to database row format
 */
function transformLearningAreaToRow(area: Partial<LearningArea>): Partial<LearningAreaRow> {
  // Generate code from name if not provided (for new records)
  const code = area.kToTwelveCode || 
    area.name?.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20) || 
    'UNKNOWN';
  
  return {
    code,
    name: area.name,
    credits: area.credits ?? null,
    category: area.category || null,
    grade_levels: area.gradeLevel,
    is_active: area.isActive,
    department: area.department || null,
    display_order: area.order || 0,
    k_to_twelve_code: area.kToTwelveCode || null,
    semester_based: area.semesterBased || null,
    semester: area.semester || null,
    track_required: area.trackRequired || null,
    is_composite: area.isComposite || false,
    components: area.components || area.subSubjects || null,
    prerequisite_id: area.prerequisite || null,
    description: area.description || null,
    hours_per_week: area.hoursPerWeek || null,
  };
}

// ==================== CRUD Operations ====================

/**
 * Fetch all learning areas for a school
 */
export async function fetchLearningAreas(schoolId: string): Promise<LearningArea[]> {
  const { data, error } = await supabase
    .from('learning_areas')
    .select('*')
    .eq('school_id', schoolId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error fetching learning areas:', error);
    throw error;
  }

  return (data || []).map(transformRowToLearningArea);
}

/**
 * Fetch a single learning area by ID
 */
export async function fetchLearningAreaById(areaId: string): Promise<LearningArea | null> {
  const { data, error } = await supabase
    .from('learning_areas')
    .select('*')
    .eq('id', areaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[learningAreasServicePostgreSQL] Error fetching learning area:', error);
    throw error;
  }

  return transformRowToLearningArea(data);
}

/**
 * Add a new learning area
 */
export async function addLearningArea(
  schoolId: string,
  areaData: Omit<LearningArea, 'id' | 'schoolId'>
): Promise<LearningArea> {
  const row = {
    school_id: schoolId,
    ...transformLearningAreaToRow(areaData),
  };

  const { data, error } = await supabase
    .from('learning_areas')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error adding learning area:', error);
    throw error;
  }

  return transformRowToLearningArea(data);
}

/**
 * Update an existing learning area
 */
export async function updateLearningArea(
  areaId: string,
  updates: Partial<LearningArea>
): Promise<LearningArea> {
  const row = transformLearningAreaToRow(updates);

  const { data, error } = await supabase
    .from('learning_areas')
    .update(row)
    .eq('id', areaId)
    .select()
    .single();

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error updating learning area:', error);
    throw error;
  }

  return transformRowToLearningArea(data);
}

/**
 * Delete a learning area (soft delete by setting isActive = false)
 */
export async function deleteLearningArea(areaId: string): Promise<void> {
  // Soft delete: Set is_active = false
  const { error } = await supabase
    .from('learning_areas')
    .update({ is_active: false })
    .eq('id', areaId);

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error deleting learning area:', error);
    throw error;
  }
}

/**
 * Hard delete a learning area (permanent removal)
 * Use with caution - only for cleanup or admin purposes
 */
export async function hardDeleteLearningArea(areaId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_areas')
    .delete()
    .eq('id', areaId);

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error hard deleting learning area:', error);
    throw error;
  }
}

/**
 * Bulk delete learning areas (soft delete)
 */
export async function bulkDeleteLearningAreas(areaIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('learning_areas')
    .update({ is_active: false })
    .in('id', areaIds);

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error bulk deleting learning areas:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted learning area
 */
export async function restoreLearningArea(areaId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_areas')
    .update({ is_active: true })
    .eq('id', areaId);

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error restoring learning area:', error);
    throw error;
  }
}

/**
 * Fetch learning areas by category
 */
export async function fetchLearningAreasByCategory(
  schoolId: string,
  category: 'core' | 'specialized' | 'elective' | 'tle' | 'sports'
): Promise<LearningArea[]> {
  const { data, error } = await supabase
    .from('learning_areas')
    .select('*')
    .eq('school_id', schoolId)
    .eq('category', category)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error fetching learning areas by category:', error);
    throw error;
  }

  return (data || []).map(transformRowToLearningArea);
}

/**
 * Fetch learning areas by grade level
 */
export async function fetchLearningAreasByGradeLevel(
  schoolId: string,
  gradeLevel: number
): Promise<LearningArea[]> {
  const { data, error } = await supabase
    .from('learning_areas')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .contains('grade_levels', [gradeLevel])
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error fetching learning areas by grade level:', error);
    throw error;
  }

  return (data || []).map(transformRowToLearningArea);
}

/**
 * Fetch learning areas by SHS track
 */
export async function fetchLearningAreasByTrack(
  schoolId: string,
  track: string
): Promise<LearningArea[]> {
  const { data, error } = await supabase
    .from('learning_areas')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .contains('track_required', [track])
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error fetching learning areas by track:', error);
    throw error;
  }

  return (data || []).map(transformRowToLearningArea);
}

// ==================== School Type Helper ====================

export type SchoolType = 'elementary' | 'high_school' | 'senior_high' | 'integrated' | null;

/**
 * Fetch the school_type for a given school
 */
export async function fetchSchoolType(schoolId: string): Promise<SchoolType> {
  const { data, error } = await supabase
    .from('schools')
    .select('school_type')
    .eq('id', schoolId)
    .single();

  if (error || !data) return null;
  return (data.school_type as SchoolType) || null;
}

// ==================== Default Learning Areas ====================

interface DefaultSubject {
  code: string;
  name: string;
  gradeLevels: number[];
  category: 'core' | 'specialized' | 'elective' | 'tle' | 'sports';
  order: number;
  isComposite?: boolean;
  components?: string[];
}

const ELEMENTARY_DEFAULTS: DefaultSubject[] = [
  { code: 'MTB', name: 'Mother Tongue', gradeLevels: [1, 2, 3], category: 'core', order: 1 },
  { code: 'FIL', name: 'Filipino', gradeLevels: [1, 2, 3, 4, 5, 6], category: 'core', order: 2 },
  { code: 'ENG', name: 'English', gradeLevels: [1, 2, 3, 4, 5, 6], category: 'core', order: 3 },
  { code: 'MATH', name: 'Mathematics', gradeLevels: [1, 2, 3, 4, 5, 6], category: 'core', order: 4 },
  { code: 'SCI', name: 'Science', gradeLevels: [3, 4, 5, 6], category: 'core', order: 5 },
  { code: 'AP', name: 'Araling Panlipunan', gradeLevels: [1, 2, 3, 4, 5, 6], category: 'core', order: 6 },
  { code: 'ESP', name: 'Edukasyon sa Pagpapakatao', gradeLevels: [1, 2, 3, 4, 5, 6], category: 'core', order: 7 },
  { code: 'EPP', name: 'EPP/TLE', gradeLevels: [4, 5, 6], category: 'tle', order: 8 },
  { code: 'MAPEH', name: 'MAPEH', gradeLevels: [1, 2, 3, 4, 5, 6], category: 'core', order: 9, isComposite: true, components: ['Music', 'Arts', 'Physical Education', 'Health'] },
];

const SECONDARY_DEFAULTS: DefaultSubject[] = [
  { code: 'FIL', name: 'Filipino', gradeLevels: [7, 8, 9, 10], category: 'core', order: 1 },
  { code: 'ENG', name: 'English', gradeLevels: [7, 8, 9, 10], category: 'core', order: 2 },
  { code: 'MATH', name: 'Mathematics', gradeLevels: [7, 8, 9, 10], category: 'core', order: 3 },
  { code: 'SCI', name: 'Science', gradeLevels: [7, 8, 9, 10], category: 'core', order: 4 },
  { code: 'AP', name: 'Araling Panlipunan', gradeLevels: [7, 8, 9, 10], category: 'core', order: 5 },
  { code: 'ESP', name: 'Edukasyon sa Pagpapakatao', gradeLevels: [7, 8, 9, 10], category: 'core', order: 6 },
  { code: 'TLE', name: 'Technology and Livelihood Education', gradeLevels: [7, 8, 9, 10], category: 'tle', order: 7 },
  { code: 'MAPEH', name: 'MAPEH', gradeLevels: [7, 8, 9, 10], category: 'core', order: 8, isComposite: true, components: ['Music', 'Arts', 'Physical Education', 'Health'] },
];

/**
 * Seed default DepEd learning areas for a school based on its type.
 * Returns the newly created learning areas.
 */
export async function seedDefaultLearningAreas(
  schoolId: string,
  schoolType: SchoolType
): Promise<LearningArea[]> {
  let subjects: DefaultSubject[] = [];

  if (schoolType === 'elementary') {
    subjects = ELEMENTARY_DEFAULTS;
  } else if (schoolType === 'high_school') {
    subjects = SECONDARY_DEFAULTS;
  } else if (schoolType === 'integrated') {
    subjects = [...ELEMENTARY_DEFAULTS, ...SECONDARY_DEFAULTS.map((s, i) => ({
      ...s,
      code: `${s.code}-SEC`,
      order: ELEMENTARY_DEFAULTS.length + i + 1,
    }))];
  } else {
    // Default to elementary if unknown
    subjects = ELEMENTARY_DEFAULTS;
  }

  const rows = subjects.map(s => ({
    school_id: schoolId,
    code: s.code,
    name: s.name,
    grade_levels: s.gradeLevels,
    category: s.category,
    display_order: s.order,
    is_active: true,
    is_composite: s.isComposite || false,
    components: s.components || null,
  }));

  const { data, error } = await supabase
    .from('learning_areas')
    .insert(rows)
    .select();

  if (error) {
    console.error('[learningAreasServicePostgreSQL] Error seeding default learning areas:', error);
    throw error;
  }

  return (data || []).map(transformRowToLearningArea);
}
