/**
 * Promotion Records Service - PostgreSQL
 * Handles SF5 and SF5-K data operations
 * 
 * IMPORTANT: Memoize all feature flag calls to prevent infinite loops
 */

import { supabase } from '../lib/supabase';
import type {
  PromotionRecord,
  PromotionRecordWithStudent,
  CreatePromotionRecordRequest,
  PromotionRecordsFilter,
  PromotionSummary,
  GeneratePromotionRecordsRequest,
  GeneratePromotionRecordsResult,
  PromotionStatus
} from '../types/promotionRecords';
import { 
  calculatePromotionStatus, 
  determineNextGradeLevel,
  type QuarterlyGrade 
} from '../utils/promotionCalculator';

/**
 * Calculate average from composite grade components (MAPEH)
 * Format: {"Music": 85, "Arts": 90, "PE": 88, "Health": 92}
 */
function calculateCompositeAverage(compositeQuarter: Record<string, number>): number | null {
  if (!compositeQuarter || typeof compositeQuarter !== 'object') return null;
  
  const values = Object.values(compositeQuarter).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return null;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100; // Round to 2 decimals
}

/**
 * Fetch promotion records with optional filters
 */
export async function getPromotionRecords(
  filter: PromotionRecordsFilter
): Promise<PromotionRecordWithStudent[]> {
  let query = supabase
    .from('promotion_records')
    .select(`
      *,
      student:students!student_id (
        id,
        first_name,
        middle_name,
        last_name,
        lrn,
        gender
      ),
      section:sections!section_id (
        id,
        name,
        grade_level
      )
    `)
    .eq('school_id', filter.school_id)
    .eq('school_year', filter.school_year);

  if (filter.grade_level !== undefined) {
    query = query.eq('current_grade_level', filter.grade_level);
  }

  if (filter.section_id) {
    query = query.eq('section_id', filter.section_id);
  }

  if (filter.promotion_status) {
    query = query.eq('promotion_status', filter.promotion_status);
  }

  if (filter.grading_period) {
    query = query.eq('grading_period', filter.grading_period);
  }

  const { data, error } = await query.order('current_grade_level', { ascending: true });

  if (error) {
    console.error('Error fetching promotion records:', error);
    throw new Error(`Failed to fetch promotion records: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single promotion record by ID
 */
export async function getPromotionRecord(id: string): Promise<PromotionRecordWithStudent | null> {
  const { data, error } = await supabase
    .from('promotion_records')
    .select(`
      *,
      student:students!student_id (
        id,
        first_name,
        middle_name,
        last_name,
        lrn,
        gender
      ),
      section:sections!section_id (
        id,
        name,
        grade_level
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching promotion record:', error);
    return null;
  }

  return data;
}

/**
 * Create a new promotion record
 */
export async function createPromotionRecord(
  record: CreatePromotionRecordRequest
): Promise<PromotionRecord> {
  const insertData: any = {
    school_id: record.school_id,
    student_id: record.student_id,
    section_id: record.section_id || null,
    school_year: record.school_year,
    grading_period: record.grading_period,
    current_grade_level: record.current_grade_level,
    promotion_status: record.promotion_status,
    next_grade_level: record.next_grade_level || null,
    next_section_id: record.next_section_id || null,
    remarks: record.remarks || null,
    attendance_days_present: record.attendance_days_present || null,
    attendance_days_absent: record.attendance_days_absent || null,
    recorded_by: record.recorded_by || null,
    approved_by: record.approved_by || null,
  };

  // Add Kindergarten proficiency if provided (SF5-K)
  if (record.proficiency) {
    insertData.socio_emotional_dev = record.proficiency.socio_emotional_dev;
    insertData.physical_motor_dev = record.proficiency.physical_motor_dev;
    insertData.cognitive_dev = record.proficiency.cognitive_dev;
    insertData.language_literacy_dev = record.proficiency.language_literacy_dev;
  }

  // Add general average if provided (SF5)
  if (record.general_average !== undefined) {
    insertData.general_average = record.general_average;
  }

  const { data, error } = await supabase
    .from('promotion_records')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating promotion record:', error);
    throw new Error(`Failed to create promotion record: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing promotion record
 */
export async function updatePromotionRecord(
  id: string,
  updates: Partial<CreatePromotionRecordRequest>
): Promise<PromotionRecord> {
  const updateData: any = {};

  if (updates.promotion_status) updateData.promotion_status = updates.promotion_status;
  if (updates.next_grade_level !== undefined) updateData.next_grade_level = updates.next_grade_level;
  if (updates.next_section_id !== undefined) updateData.next_section_id = updates.next_section_id;
  if (updates.remarks !== undefined) updateData.remarks = updates.remarks;
  if (updates.attendance_days_present !== undefined) updateData.attendance_days_present = updates.attendance_days_present;
  if (updates.attendance_days_absent !== undefined) updateData.attendance_days_absent = updates.attendance_days_absent;
  if (updates.approved_by !== undefined) updateData.approved_by = updates.approved_by;

  // Update proficiency if provided
  if (updates.proficiency) {
    updateData.socio_emotional_dev = updates.proficiency.socio_emotional_dev;
    updateData.physical_motor_dev = updates.proficiency.physical_motor_dev;
    updateData.cognitive_dev = updates.proficiency.cognitive_dev;
    updateData.language_literacy_dev = updates.proficiency.language_literacy_dev;
  }

  // Update general average if provided
  if (updates.general_average !== undefined) {
    updateData.general_average = updates.general_average;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('promotion_records')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promotion record:', error);
    throw new Error(`Failed to update promotion record: ${error.message}`);
  }

  return data;
}

/**
 * Delete a promotion record
 */
export async function deletePromotionRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('promotion_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion record:', error);
    throw new Error(`Failed to delete promotion record: ${error.message}`);
  }
}

/**
 * Get promotion summary for SF6 report
 */
export async function getPromotionSummary(
  schoolId: string,
  schoolYear: string,
  gradeLevel?: number
): Promise<PromotionSummary[]> {
  let query = supabase
    .from('promotion_records')
    .select('current_grade_level, promotion_status')
    .eq('school_id', schoolId)
    .eq('school_year', schoolYear)
    .eq('grading_period', 'final');

  if (gradeLevel !== undefined) {
    query = query.eq('current_grade_level', gradeLevel);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching promotion summary:', error);
    throw new Error(`Failed to fetch promotion summary: ${error.message}`);
  }

  // Aggregate by grade level
  const summaryMap = new Map<number, PromotionSummary>();

  data?.forEach((record: any) => {
    const grade = record.current_grade_level;
    
    if (!summaryMap.has(grade)) {
      summaryMap.set(grade, {
        school_year: schoolYear,
        grade_level: grade,
        total_students: 0,
        promoted: 0,
        retained: 0,
        pending: 0,
        graduated: 0,
        transferred: 0,
        promotion_rate: 0,
        retention_rate: 0,
      });
    }

    const summary = summaryMap.get(grade)!;
    summary.total_students++;

    switch (record.promotion_status as PromotionStatus) {
      case 'promoted':
        summary.promoted++;
        break;
      case 'retained':
        summary.retained++;
        break;
      case 'pending':
        summary.pending++;
        break;
      case 'graduated':
        summary.graduated++;
        break;
      case 'transferred':
        summary.transferred++;
        break;
    }
  });

  // Calculate rates
  const summaries = Array.from(summaryMap.values());
  summaries.forEach((summary) => {
    if (summary.total_students > 0) {
      summary.promotion_rate = ((summary.promoted + summary.graduated) / summary.total_students) * 100;
      summary.retention_rate = (summary.retained / summary.total_students) * 100;
    }
  });

  return summaries.sort((a, b) => a.grade_level - b.grade_level);
}

/**
 * Auto-generate promotion records from existing grades
 * This is the core logic for SF5 and SF5-K auto-generation
 */
export async function generatePromotionRecords(
  request: GeneratePromotionRecordsRequest,
  onLog?: (message: string) => void  // Add callback for logging
): Promise<GeneratePromotionRecordsResult> {
  const result: GeneratePromotionRecordsResult = {
    success: true,
    records_created: 0,
    records_updated: 0,
    errors: [],
  };

  const log = (msg: string) => {
    console.log(msg);
    if (onLog) onLog(msg);
  };

  log(`Auto-generating promotion records: Grade ${request.grade_level || 'All'}, SY ${request.school_year}...`);

  try {
    // Fetch students and sections separately (workaround for schema cache issues)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, middle_name, last_name, lrn, section_id, grade_level')
      .eq('school_id', request.school_id)
      .eq('enrollment_status', 'enrolled');

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    if (!students || students.length === 0) {
      return { ...result, success: false, errors: [{ student_id: '', student_name: '', error: 'No students found' }] };
    }

    // Apply filters
    let filteredStudents = students;
    if (request.grade_level !== undefined) {
      filteredStudents = students.filter(s => s.grade_level === request.grade_level);
    }
    if (request.section_id) {
      filteredStudents = filteredStudents.filter(s => s.section_id === request.section_id);
    }

    log(`Processing ${filteredStudents.length} student(s)...`);

    if (filteredStudents.length === 0) {
      return { ...result, success: false, errors: [{ student_id: '', student_name: '', error: 'No students found matching criteria' }] };
    }

    // For each student, fetch grades and calculate promotion status
    for (const student of filteredStudents) {
      try {
        const studentName = `${student.first_name} ${student.last_name}`;
        const gradeLevel = student.grade_level;

        // Check if record already exists
        const { data: existingRecords } = await supabase
          .from('promotion_records')
          .select('id')
          .eq('student_id', student.id)
          .eq('school_year', request.school_year)
          .eq('grading_period', request.grading_period);

        const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

        // Fetch grades for this student (with quarterly data + composite_grades for MAPEH)
        // Note: Removed school_year filter as grades might not have it populated yet
        const { data: grades, error: gradesError } = await supabase
          .from('grades')
          .select('q1, q2, q3, q4, final_grade, learning_area_id, school_year, composite_grades')
          .eq('student_id', student.id);
          // Removed: .eq('school_year', request.school_year);

        if (gradesError) {
          result.errors.push({
            student_id: student.id,
            student_name: studentName,
            error: `Failed to fetch grades: ${gradesError.message}`,
          });
          continue;
        }

        // Process grades: Handle composite subjects (MAPEH) by calculating quarterly averages
        const processedGrades = grades?.map(g => {
          // If it has composite_grades (MAPEH), calculate quarterly averages
          if (g.composite_grades && typeof g.composite_grades === 'object') {
            const comp = g.composite_grades as any;
            const avgQ1 = comp.q1 ? calculateCompositeAverage(comp.q1) : null;
            const avgQ2 = comp.q2 ? calculateCompositeAverage(comp.q2) : null;
            const avgQ3 = comp.q3 ? calculateCompositeAverage(comp.q3) : null;
            const avgQ4 = comp.q4 ? calculateCompositeAverage(comp.q4) : null;
            
            return {
              ...g,
              q1: avgQ1,
              q2: avgQ2,
              q3: avgQ3,
              q4: avgQ4,
            };
          }
          return g;
        }) || [];
        
        // Validate grades exist
        if (!processedGrades || processedGrades.length === 0) {
          log(`[${studentName}] No grades found - skipping`);
          continue;
        }

        // Calculate promotion status using quarterly grades
        let generalAverage: number | null = null;
        let promotionStatus: PromotionStatus = 'pending';
        let nextGradeLevel: number | null = null;
        let remarks: string | null = null;

        // Calculate promotion status using DepEd Order 8 rules
        const calculation = calculatePromotionStatus(processedGrades as QuarterlyGrade[]);
        generalAverage = calculation.general_average;
        
        if (calculation.can_finalize) {
          const gradeDecision = determineNextGradeLevel(gradeLevel, calculation.status);
          promotionStatus = gradeDecision.actualStatus;
          nextGradeLevel = gradeDecision.nextGradeLevel;
          
          log(`[${studentName}] ✅ ${promotionStatus.toUpperCase()} - Avg: ${generalAverage?.toFixed(2)}, Next: Grade ${nextGradeLevel || 'N/A'}`);
          
          // Mark conditional promotion in remarks
          if (calculation.is_conditional) {
            remarks = 'CONDITIONAL: Requires remedial classes in failed learning areas';
          }
        } else {
          promotionStatus = 'pending';
          log(`[${studentName}] ⏸️ PENDING - ${calculation.reason}`);
        }

        // Prepare record data
        const recordData: CreatePromotionRecordRequest = {
          school_id: request.school_id,
          student_id: student.id,
          section_id: student.section_id || undefined,
          school_year: request.school_year,
          grading_period: request.grading_period,
          current_grade_level: gradeLevel,
          general_average: generalAverage || undefined,
          promotion_status: promotionStatus,
          next_grade_level: nextGradeLevel || undefined,
          remarks: remarks || undefined,
        };

        if (existing) {
          // Update existing record
          await updatePromotionRecord(existing.id, recordData);
          result.records_updated++;
        } else {
          // Create new record
          await createPromotionRecord(recordData);
          result.records_created++;
        }
      } catch (error) {
        result.errors.push({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push({
      student_id: '',
      student_name: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return result;
}

/**
 * Recalculate promotion status for a specific student
 * Useful for updating individual records when grades change
 */
export async function recalculatePromotionStatus(
  promotionRecordId: string
): Promise<{ success: boolean; error?: string; calculation?: any }> {
  try {
    // Fetch the promotion record
    const { data: record, error: recordError } = await supabase
      .from('promotion_records')
      .select('*')
      .eq('id', promotionRecordId)
      .single();

    if (recordError || !record) {
      return { success: false, error: 'Promotion record not found' };
    }

    // Fetch student's quarterly grades
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('q1, q2, q3, q4, final_grade, learning_area_id')
      .eq('student_id', record.student_id)
      .eq('school_year', record.school_year);

    if (gradesError) {
      return { success: false, error: `Failed to fetch grades: ${gradesError.message}` };
    }

    if (!grades || grades.length === 0) {
      return { success: false, error: 'No grades found for student' };
    }

    // Calculate promotion status
    const calculation = calculatePromotionStatus(grades as QuarterlyGrade[]);

    // Only update if quarters are complete
    if (!calculation.can_finalize) {
      return {
        success: false,
        error: calculation.reason,
        calculation
      };
    }

    // Determine next grade level
    const gradeDecision = determineNextGradeLevel(
      record.current_grade_level,
      calculation.status
    );

    // Update the record
    const { error: updateError } = await supabase
      .from('promotion_records')
      .update({
        general_average: calculation.general_average,
        promotion_status: gradeDecision.actualStatus,
        next_grade_level: gradeDecision.nextGradeLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', promotionRecordId);

    if (updateError) {
      return { success: false, error: `Failed to update record: ${updateError.message}` };
    }

    return {
      success: true,
      calculation: {
        ...calculation,
        final_status: gradeDecision.actualStatus,
        next_grade: gradeDecision.nextGradeLevel
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk recalculate promotion statuses for all students in a school year
 * Useful for end-of-year processing when all quarters are complete
 */
export async function recalculateAllPromotionStatuses(
  schoolId: string,
  schoolYear: string,
  gradingPeriod: 'final' = 'final'
): Promise<{
  success: boolean;
  updated: number;
  pending: number;
  errors: Array<{ student_id: string; error: string }>;
}> {
  const result = {
    success: true,
    updated: 0,
    pending: 0,
    errors: [] as Array<{ student_id: string; error: string }>
  };

  try {
    // Fetch all promotion records for the school year
    const { data: records, error: recordsError } = await supabase
      .from('promotion_records')
      .select('id, student_id, current_grade_level, school_year')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .eq('grading_period', gradingPeriod);

    if (recordsError) {
      return { ...result, success: false, errors: [{ student_id: '', error: recordsError.message }] };
    }

    if (!records || records.length === 0) {
      return result;
    }

    // Process each record
    for (const record of records) {
      const recalcResult = await recalculatePromotionStatus(record.id);
      
      if (recalcResult.success) {
        result.updated++;
      } else if (recalcResult.error?.includes('quarters')) {
        // Still pending - quarters not complete
        result.pending++;
      } else {
        result.errors.push({
          student_id: record.student_id,
          error: recalcResult.error || 'Unknown error'
        });
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push({
      student_id: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return result;
}
