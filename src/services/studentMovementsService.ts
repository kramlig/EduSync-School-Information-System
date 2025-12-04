/**
 * Student Movements Service
 * Handles SF4 (Monthly Learner Movement & Attendance Report) operations
 */

import { supabase } from '../lib/supabase';
import type {
  StudentMovement,
  MonthlyEnrollmentSnapshot,
  SF4Filter,
  SF4Summary,
  CreateMovementRequest,
  GenerateMonthlySnapshotRequest,
} from '../types/studentMovements';

/**
 * Get student movements for a specific month/year
 */
export async function getStudentMovements(filter: SF4Filter): Promise<StudentMovement[]> {
  let query = supabase
    .from('student_movements')
    .select('*')
    .eq('school_id', filter.school_id)
    .eq('school_year', filter.school_year)
    .eq('month', filter.month)
    .order('movement_date', { ascending: true });

  if (filter.grade_level !== undefined) {
    query = query.eq('grade_level', filter.grade_level);
  }

  if (filter.section_id) {
    query = query.eq('section_id', filter.section_id);
  }

  if (filter.movement_type) {
    query = query.eq('movement_type', filter.movement_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching student movements:', error);
    throw new Error(`Failed to fetch student movements: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new student movement record
 */
export async function createStudentMovement(
  request: CreateMovementRequest,
  createdBy: { id: string; name: string }
): Promise<StudentMovement> {
  // Fetch student details
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, last_name, lrn, grade_level, section_id, sections(name)')
    .eq('id', request.student_id)
    .single();

  if (studentError || !student) {
    throw new Error('Student not found');
  }

  const month = request.movement_date.substring(0, 7); // Extract YYYY-MM

  const movement: Partial<StudentMovement> = {
    school_id: request.school_id,
    student_id: request.student_id,
    student_name: `${student.first_name} ${student.last_name}`,
    lrn: student.lrn,
    grade_level: student.grade_level,
    section_id: student.section_id,
    section_name: (student.sections as any)?.name,
    movement_type: request.movement_type,
    movement_date: request.movement_date,
    school_year: request.school_year,
    month,
    previous_school: request.previous_school,
    destination_school: request.destination_school,
    reason: request.reason,
    remarks: request.remarks,
    created_by: createdBy.id,
    created_by_name: createdBy.name,
  };

  const { data, error } = await supabase
    .from('student_movements')
    .insert(movement)
    .select()
    .single();

  if (error) {
    console.error('Error creating student movement:', error);
    throw new Error(`Failed to create student movement: ${error.message}`);
  }

  return data;
}

/**
 * Get monthly enrollment snapshot
 */
export async function getMonthlySnapshot(
  schoolId: string,
  schoolYear: string,
  month: string,
  gradeLevel?: number,
  sectionId?: string
): Promise<MonthlyEnrollmentSnapshot | null> {
  let query = supabase
    .from('monthly_enrollment_snapshots')
    .select('*')
    .eq('school_id', schoolId)
    .eq('school_year', schoolYear)
    .eq('month', month);

  if (gradeLevel !== undefined) {
    query = query.eq('grade_level', gradeLevel);
  }

  if (sectionId) {
    query = query.eq('section_id', sectionId);
    
    // If section is specified, expect single result
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching monthly snapshot:', error);
      throw new Error(`Failed to fetch monthly snapshot: ${error.message}`);
    }

    return data;
  } else {
    // If no section specified, return first result or null
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('Error fetching monthly snapshot:', error);
      throw new Error(`Failed to fetch monthly snapshot: ${error.message}`);
    }

    return data;
  }
}

/**
 * Generate monthly enrollment snapshot
 * Calculates enrollment statistics based on movements
 */
export async function generateMonthlySnapshot(
  request: GenerateMonthlySnapshotRequest,
  createdBy: { id: string; name: string }
): Promise<MonthlyEnrollmentSnapshot[]> {
  const { school_id, school_year, month, grade_level } = request;

  // Get all sections for the school (or specific grade if provided)
  let sectionsQuery = supabase
    .from('sections')
    .select('id, name, grade_level')
    .eq('school_id', school_id)
    .eq('school_year', school_year);

  if (grade_level !== undefined) {
    sectionsQuery = sectionsQuery.eq('grade_level', grade_level);
  }

  const { data: sections, error: sectionsError } = await sectionsQuery;

  if (sectionsError) {
    throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
  }

  const snapshots: MonthlyEnrollmentSnapshot[] = [];

  for (const section of sections || []) {
    // Get beginning enrollment (students enrolled before this month)
    const { count: beginning } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', school_id)
      .eq('section_id', section.id)
      .eq('enrollment_status', 'enrolled')
      .lt('created_at', `${month}-01`);

    // Get movements for this month
    const { data: movements } = await supabase
      .from('student_movements')
      .select('movement_type')
      .eq('school_id', school_id)
      .eq('school_year', school_year)
      .eq('month', month)
      .eq('section_id', section.id);

    const transferred_in = movements?.filter((m: any) => m.movement_type === 'transferred_in').length || 0;
    const transferred_out = movements?.filter((m: any) => m.movement_type === 'transferred_out').length || 0;
    const dropped = movements?.filter((m: any) => m.movement_type === 'dropped').length || 0;

    const beginning_enrollment = beginning || 0;
    const ending_enrollment = beginning_enrollment + transferred_in - transferred_out - dropped;

    // TODO: Implement attendance tracking when attendance table is created
    // For now, use placeholder values
    const schoolDays = 0;
    const absences = 0;
    const attendance_rate = 0;

    const snapshot: Partial<MonthlyEnrollmentSnapshot> = {
      school_id,
      school_year,
      month,
      grade_level: section.grade_level,
      section_id: section.id,
      section_name: section.name,
      beginning_enrollment,
      transferred_in,
      transferred_out,
      dropped,
      ending_enrollment,
      total_school_days: schoolDays,
      total_absences: absences,
      attendance_rate: Math.round(attendance_rate * 100) / 100,
      snapshot_date: new Date().toISOString().split('T')[0],
      created_by: createdBy.id,
      created_by_name: createdBy.name,
    };

    // Delete existing snapshot for this combination (if any)
    await supabase
      .from('monthly_enrollment_snapshots')
      .delete()
      .eq('school_id', school_id)
      .eq('school_year', school_year)
      .eq('month', month)
      .eq('grade_level', section.grade_level)
      .eq('section_id', section.id);

    // Insert new snapshot
    const { data, error } = await supabase
      .from('monthly_enrollment_snapshots')
      .insert(snapshot)
      .select()
      .single();

    if (error) {
      console.error('Error creating snapshot:', error);
      continue;
    }

    if (data) {
      snapshots.push(data);
    }
  }

  return snapshots;
}

/**
 * Get SF4 summary statistics
 */
export async function getSF4Summary(
  schoolId: string,
  schoolYear: string,
  month: string,
  gradeLevel?: number
): Promise<SF4Summary> {
  let query = supabase
    .from('monthly_enrollment_snapshots')
    .select('*')
    .eq('school_id', schoolId)
    .eq('school_year', schoolYear)
    .eq('month', month);

  if (gradeLevel !== undefined) {
    query = query.eq('grade_level', gradeLevel);
  }

  const { data: snapshots, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch snapshots: ${error.message}`);
  }

  const total_beginning_enrollment = snapshots?.reduce((sum: number, s: any) => sum + s.beginning_enrollment, 0) || 0;
  const total_transferred_in = snapshots?.reduce((sum: number, s: any) => sum + s.transferred_in, 0) || 0;
  const total_transferred_out = snapshots?.reduce((sum: number, s: any) => sum + s.transferred_out, 0) || 0;
  const total_dropped = snapshots?.reduce((sum: number, s: any) => sum + s.dropped, 0) || 0;
  const total_ending_enrollment = snapshots?.reduce((sum: number, s: any) => sum + s.ending_enrollment, 0) || 0;

  // Group by grade level
  const gradeMap = new Map<number, typeof snapshots[0]>();
  snapshots?.forEach((s: any) => {
    const existing = gradeMap.get(s.grade_level);
    if (existing) {
      existing.beginning_enrollment += s.beginning_enrollment;
      existing.transferred_in += s.transferred_in;
      existing.transferred_out += s.transferred_out;
      existing.dropped += s.dropped;
      existing.ending_enrollment += s.ending_enrollment;
    } else {
      gradeMap.set(s.grade_level, { ...s });
    }
  });

  const by_grade_level = Array.from(gradeMap.values()).map(s => ({
    grade_level: s.grade_level,
    beginning_enrollment: s.beginning_enrollment,
    transferred_in: s.transferred_in,
    transferred_out: s.transferred_out,
    dropped: s.dropped,
    ending_enrollment: s.ending_enrollment,
  }));

  // Get gender breakdown (requires joining with students table)
  const { data: students } = await supabase
    .from('students')
    .select('gender')
    .eq('school_id', schoolId)
    .eq('enrollment_status', 'enrolled');

  const maleCount = students?.filter((s: any) => s.gender === 'Male').length || 0;
  const femaleCount = students?.filter((s: any) => s.gender === 'Female').length || 0;

  const by_gender = {
    male: {
      beginning: Math.round(total_beginning_enrollment * (maleCount / (maleCount + femaleCount || 1))),
      transferred_in: Math.round(total_transferred_in * (maleCount / (maleCount + femaleCount || 1))),
      transferred_out: Math.round(total_transferred_out * (maleCount / (maleCount + femaleCount || 1))),
      dropped: Math.round(total_dropped * (maleCount / (maleCount + femaleCount || 1))),
      ending: Math.round(total_ending_enrollment * (maleCount / (maleCount + femaleCount || 1))),
    },
    female: {
      beginning: Math.round(total_beginning_enrollment * (femaleCount / (maleCount + femaleCount || 1))),
      transferred_in: Math.round(total_transferred_in * (femaleCount / (maleCount + femaleCount || 1))),
      transferred_out: Math.round(total_transferred_out * (femaleCount / (maleCount + femaleCount || 1))),
      dropped: Math.round(total_dropped * (femaleCount / (maleCount + femaleCount || 1))),
      ending: Math.round(total_ending_enrollment * (femaleCount / (maleCount + femaleCount || 1))),
    },
  };

  const avg_attendance_rate = snapshots?.length 
    ? snapshots.reduce((sum: number, s: any) => sum + s.attendance_rate, 0) / snapshots.length 
    : 0;

  return {
    school_id: schoolId,
    school_year: schoolYear,
    month,
    total_beginning_enrollment,
    total_transferred_in,
    total_transferred_out,
    total_dropped,
    total_ending_enrollment,
    by_grade_level,
    by_gender,
    attendance_summary: {
      total_school_days: snapshots?.[0]?.total_school_days || 0,
      total_absences: snapshots?.reduce((sum: number, s: any) => sum + s.total_absences, 0) || 0,
      average_attendance_rate: Math.round(avg_attendance_rate * 100) / 100,
    },
  };
}
