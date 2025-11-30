/**
 * Schedule Service for PostgreSQL/Supabase
 * 
 * Handles all CRUD operations for class schedules, including:
 * - Academic class schedules (section-specific, teacher-assigned)
 * - Extracurricular activities (school-wide, grade-level)
 * - Multi-day events support
 * - Conflict detection
 */

import { supabase } from '../lib/supabase';

export interface ClassSchedule {
  id: string;
  school_id: string;
  title: string;
  type: 'academic' | 'extracurricular';
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  end_day_of_week?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  start_time: string; // TIME format "HH:MM:SS"
  end_time: string;
  scope: 'section' | 'gradeLevel' | 'all';
  
  // Optional fields based on scope/type
  section_id?: string;
  learning_area_id?: string;
  teacher_id?: string;
  grade_level?: number;
  room?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface ScheduleFilters {
  school_id: string;
  section_id?: string;
  teacher_id?: string;
  grade_level?: number;
  day_of_week?: ClassSchedule['day_of_week'];
  type?: 'academic' | 'extracurricular';
  scope?: 'section' | 'gradeLevel' | 'all';
}

/**
 * Fetch class schedules with filters
 */
export async function fetchClassSchedules(filters: ScheduleFilters): Promise<ClassSchedule[]> {
  try {
    let query = supabase
      .from('class_schedules')
      .select('*')
      .eq('school_id', filters.school_id)
      .is('deleted_at', null);

    // Apply optional filters
    if (filters.section_id) {
      query = query.eq('section_id', filters.section_id);
    }

    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id);
    }

    if (filters.grade_level !== undefined) {
      query = query.eq('grade_level', filters.grade_level);
    }

    if (filters.day_of_week) {
      query = query.eq('day_of_week', filters.day_of_week);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.scope) {
      query = query.eq('scope', filters.scope);
    }

    // Order by day and time
    query = query.order('day_of_week', { ascending: true });
    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[scheduleServicePostgreSQL] Fetch error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[scheduleServicePostgreSQL] fetchClassSchedules error:', error);
    throw error;
  }
}

/**
 * Add a new class schedule
 */
export async function addClassSchedule(
  schedule: Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<ClassSchedule> {
  try {
    // Validate required fields
    if (!schedule.school_id || !schedule.title || !schedule.day_of_week || !schedule.start_time || !schedule.end_time) {
      throw new Error('Missing required fields: school_id, title, day_of_week, start_time, end_time');
    }

    // Validate scope-specific requirements
    if (schedule.scope === 'section' && !schedule.section_id) {
      throw new Error('section_id is required when scope is "section"');
    }
    if (schedule.scope === 'gradeLevel' && !schedule.grade_level) {
      throw new Error('grade_level is required when scope is "gradeLevel"');
    }
    if (schedule.type === 'academic' && (!schedule.learning_area_id || !schedule.teacher_id)) {
      throw new Error('learning_area_id and teacher_id are required for academic schedules');
    }

    const { data, error } = await supabase
      .from('class_schedules')
      .insert([schedule])
      .select()
      .single();

    if (error) {
      console.error('[scheduleServicePostgreSQL] Insert error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[scheduleServicePostgreSQL] addClassSchedule error:', error);
    throw error;
  }
}

/**
 * Update an existing class schedule
 */
export async function updateClassSchedule(
  id: string,
  updates: Partial<Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>
): Promise<ClassSchedule> {
  try {
    const { data, error } = await supabase
      .from('class_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[scheduleServicePostgreSQL] Update error:', error);
      throw error;
    }

    if (!data) {
      throw new Error(`Schedule with id ${id} not found`);
    }

    return data;
  } catch (error) {
    console.error('[scheduleServicePostgreSQL] updateClassSchedule error:', error);
    throw error;
  }
}

/**
 * Delete a class schedule (soft delete)
 */
export async function deleteClassSchedule(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('class_schedules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[scheduleServicePostgreSQL] Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[scheduleServicePostgreSQL] deleteClassSchedule error:', error);
    throw error;
  }
}

/**
 * Check for schedule conflicts
 * Returns true if there's a conflict, false otherwise
 */
export async function checkScheduleConflict(
  schedule: Omit<ClassSchedule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  excludeId?: string
): Promise<{ hasConflict: boolean; conflictReason?: string }> {
  try {
    // Fetch schedules for the same school and day (optimized query)
    let query = supabase
      .from('class_schedules')
      .select('*')
      .eq('school_id', schedule.school_id)
      .is('deleted_at', null);
    
    // Filter by day to reduce dataset (day_of_week OR end_day_of_week must match)
    // This significantly reduces the data we need to check
    const checkDay = schedule.day_of_week;
    query = query.or(`day_of_week.eq.${checkDay},end_day_of_week.eq.${checkDay}`);
    
    const { data: existingSchedules, error } = await query;

    if (error) throw error;

    if (!existingSchedules || existingSchedules.length === 0) {
      return { hasConflict: false };
    }

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const checkStartDay = schedule.day_of_week;
    const checkEndDay = schedule.end_day_of_week || schedule.day_of_week;
    const checkStartTime = timeToMinutes(schedule.start_time);
    const checkEndTime = timeToMinutes(schedule.end_time);
    const checkStartDayIndex = DAYS.indexOf(checkStartDay);
    const checkEndDayIndex = DAYS.indexOf(checkEndDay);

    for (const existing of existingSchedules) {
      // Skip if this is the same schedule being updated
      if (excludeId && existing.id === excludeId) continue;

      const existingStartDay = existing.day_of_week;
      const existingEndDay = existing.end_day_of_week || existing.day_of_week;
      const existingStartTime = timeToMinutes(existing.start_time);
      const existingEndTime = timeToMinutes(existing.end_time);
      const existingStartDayIndex = DAYS.indexOf(existingStartDay);
      const existingEndDayIndex = DAYS.indexOf(existingEndDay);

      // Check if days overlap
      const daysOverlap = !(checkEndDayIndex < existingStartDayIndex || checkStartDayIndex > existingEndDayIndex);
      if (!daysOverlap) continue;

      // Check if times overlap
      const timesOverlap = !(checkEndTime <= existingStartTime || checkStartTime >= existingEndTime);
      if (!timesOverlap) continue;

      // Check for resource conflicts
      // Same section conflict
      if (schedule.section_id && existing.section_id && schedule.section_id === existing.section_id) {
        return { 
          hasConflict: true, 
          conflictReason: 'Section already has a class at that time' 
        };
      }

      // Same teacher conflict
      if (schedule.teacher_id && existing.teacher_id && schedule.teacher_id === existing.teacher_id) {
        return { 
          hasConflict: true, 
          conflictReason: 'Teacher has a conflicting class at that time' 
        };
      }

      // Same grade level conflict (for grade-level scope)
      if (schedule.scope === 'gradeLevel' && existing.scope === 'gradeLevel' && 
          schedule.grade_level === existing.grade_level) {
        return { 
          hasConflict: true, 
          conflictReason: 'Grade level already has an activity at that time' 
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('[scheduleServicePostgreSQL] checkScheduleConflict error:', error);
    throw error;
  }
}

/**
 * Get schedule statistics for a school
 */
export async function getScheduleStatistics(schoolId: string): Promise<{
  total: number;
  byType: { academic: number; extracurricular: number };
  byScope: { section: number; gradeLevel: number; all: number };
  byDay: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from('class_schedules')
      .select('type, scope, day_of_week')
      .eq('school_id', schoolId)
      .is('deleted_at', null);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byType: { academic: 0, extracurricular: 0 },
      byScope: { section: 0, gradeLevel: 0, all: 0 },
      byDay: {} as Record<string, number>
    };

    if (data) {
      for (const schedule of data) {
        // Count by type
        if (schedule.type === 'academic') stats.byType.academic++;
        if (schedule.type === 'extracurricular') stats.byType.extracurricular++;

        // Count by scope
        if (schedule.scope === 'section') stats.byScope.section++;
        if (schedule.scope === 'gradeLevel') stats.byScope.gradeLevel++;
        if (schedule.scope === 'all') stats.byScope.all++;

        // Count by day
        const day = schedule.day_of_week;
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      }
    }

    return stats;
  } catch (error) {
    console.error('[scheduleServicePostgreSQL] getScheduleStatistics error:', error);
    throw error;
  }
}
