/**
 * Electronic Class Record (ECR) Service
 * 
 * Handles all ECR-related database operations:
 * - Activity management (CRUD)
 * - Score entry and retrieval
 * - Grade computation
 * - Weight configuration
 */

import { supabase } from '../lib/supabase';
import type {
  ECRActivity,
  ECRScore,
  ECRWeight,
  ECRComponentGrades,
  ECRClassRecord,
  ECRStudentRow,
  ECRActivityType,
  ECRQuarter,
  CreateECRActivityRequest,
  UpdateECRActivityRequest,
  BulkScoreEntry
} from '../types/ecr.types';

// ============================================
// Weight Management
// ============================================

/**
 * Get weights for a specific school/subject/grade combination
 */
export async function getECRWeights(
  schoolId: string,
  learningAreaId?: string,
  gradeLevel?: number
): Promise<{ wwWeight: number; ptWeight: number; qaWeight: number }> {
  const { data, error } = await supabase.rpc('get_ecr_weights', {
    p_school_id: schoolId,
    p_learning_area_id: learningAreaId || null,
    p_grade_level: gradeLevel || 7
  });

  if (error || !data || data.length === 0) {
    // Return DepEd defaults
    return { wwWeight: 30, ptWeight: 50, qaWeight: 20 };
  }

  return {
    wwWeight: data[0].ww_weight,
    ptWeight: data[0].pt_weight,
    qaWeight: data[0].qa_weight
  };
}

/**
 * Save custom weights for a school
 */
export async function saveECRWeights(
  schoolId: string,
  weights: {
    learningAreaId?: string;
    gradeLevelMin?: number;
    gradeLevelMax?: number;
    wwWeight: number;
    ptWeight: number;
    qaWeight: number;
  }
): Promise<ECRWeight | null> {
  const { data, error } = await supabase
    .from('ecr_weights')
    .upsert({
      school_id: schoolId,
      learning_area_id: weights.learningAreaId || null,
      grade_level_min: weights.gradeLevelMin || null,
      grade_level_max: weights.gradeLevelMax || null,
      ww_weight: weights.wwWeight,
      pt_weight: weights.ptWeight,
      qa_weight: weights.qaWeight,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'school_id,learning_area_id,grade_level_min,grade_level_max'
    })
    .select()
    .single();

  if (error) {
    console.error('[ECRService] Error saving weights:', error);
    return null;
  }

  return mapWeightFromDB(data);
}

// ============================================
// Activity Management
// ============================================

/**
 * Get all activities for a section/subject/quarter
 */
export async function getActivities(
  sectionId: string,
  learningAreaId: string,
  schoolYear: string,
  quarter: ECRQuarter
): Promise<ECRActivity[]> {
  const { data, error } = await supabase
    .from('ecr_activities')
    .select('*')
    .eq('section_id', sectionId)
    .eq('learning_area_id', learningAreaId)
    .eq('school_year', schoolYear)
    .eq('quarter', quarter)
    .is('deleted_at', null)
    .order('activity_type')
    .order('activity_number');

  if (error) {
    console.error('[ECRService] Error fetching activities:', error);
    return [];
  }

  return data.map(mapActivityFromDB);
}

/**
 * Create a new activity
 */
export async function createActivity(
  schoolId: string,
  teacherId: string,
  request: CreateECRActivityRequest
): Promise<ECRActivity | null> {
  // Resolve teacherId if null/undefined — look up from school's teacher
  let resolvedTeacherId = teacherId;
  if (!resolvedTeacherId && schoolId) {
    console.warn('[ECRService] teacherId is null, resolving from school:', schoolId);
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .limit(1)
      .single();
    if (teacher) {
      resolvedTeacherId = teacher.id;
      console.log('[ECRService] Resolved teacherId:', resolvedTeacherId);
    } else {
      console.error('[ECRService] Could not resolve teacherId for school:', schoolId);
      return null;
    }
  }

  // Debug: Log the request data
  console.log('[ECRService] Creating activity with:', {
    schoolId,
    teacherId: resolvedTeacherId,
    quarter: request.quarter,
    quarterType: typeof request.quarter,
    request
  });

  const { data, error } = await supabase
    .from('ecr_activities')
    .insert({
      school_id: schoolId,
      teacher_id: resolvedTeacherId,
      section_id: request.sectionId,
      learning_area_id: request.learningAreaId,
      school_year: request.schoolYear,
      quarter: request.quarter,
      activity_type: request.activityType,
      activity_number: request.activityNumber,
      activity_name: request.activityName || null,
      description: request.description || null,
      max_score: request.maxScore,
      activity_date: request.activityDate || null,
      due_date: request.dueDate || null,
      is_published: false,
      is_locked: false
    })
    .select()
    .single();

  if (error) {
    // 409 = unique constraint conflict — activity already exists, return existing one
    if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
      console.warn('[ECRService] Activity already exists, fetching existing:', {
        activityType: request.activityType,
        activityNumber: request.activityNumber
      });
      const { data: existing } = await supabase
        .from('ecr_activities')
        .select('*')
        .eq('section_id', request.sectionId)
        .eq('learning_area_id', request.learningAreaId)
        .eq('school_year', request.schoolYear)
        .eq('quarter', request.quarter)
        .eq('activity_type', request.activityType)
        .eq('activity_number', request.activityNumber)
        .is('deleted_at', null)
        .single();
      if (existing) return mapActivityFromDB(existing);
    }
    console.error('[ECRService] Error creating activity:', error);
    return null;
  }

  return mapActivityFromDB(data);
}

/**
 * Update an activity
 */
export async function updateActivity(
  activityId: string,
  updates: UpdateECRActivityRequest
): Promise<ECRActivity | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (updates.activityName !== undefined) updateData.activity_name = updates.activityName;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.maxScore !== undefined) updateData.max_score = updates.maxScore;
  if (updates.activityDate !== undefined) updateData.activity_date = updates.activityDate;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;
  if (updates.isLocked !== undefined) updateData.is_locked = updates.isLocked;

  const { data, error } = await supabase
    .from('ecr_activities')
    .update(updateData)
    .eq('id', activityId)
    .select()
    .single();

  if (error) {
    console.error('[ECRService] Error updating activity:', error);
    return null;
  }

  return mapActivityFromDB(data);
}

/**
 * Delete an activity (soft delete)
 */
export async function deleteActivity(activityId: string): Promise<boolean> {
  const { error } = await supabase
    .from('ecr_activities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', activityId);

  if (error) {
    console.error('[ECRService] Error deleting activity:', error);
    return false;
  }

  return true;
}

// ============================================
// Score Management
// ============================================

/**
 * Get all scores for an activity
 */
export async function getScoresForActivity(activityId: string): Promise<ECRScore[]> {
  const { data, error } = await supabase
    .from('ecr_scores')
    .select('*')
    .eq('activity_id', activityId);

  if (error) {
    console.error('[ECRService] Error fetching scores:', error);
    return [];
  }

  return data.map(mapScoreFromDB);
}

/**
 * Get all scores for a student in a quarter
 */
export async function getScoresForStudent(
  studentId: string,
  sectionId: string,
  learningAreaId: string,
  schoolYear: string,
  quarter: ECRQuarter
): Promise<ECRScore[]> {
  const { data, error } = await supabase
    .from('ecr_scores')
    .select(`
      *,
      ecr_activities!inner(
        section_id,
        learning_area_id,
        school_year,
        quarter
      )
    `)
    .eq('student_id', studentId)
    .eq('ecr_activities.section_id', sectionId)
    .eq('ecr_activities.learning_area_id', learningAreaId)
    .eq('ecr_activities.school_year', schoolYear)
    .eq('ecr_activities.quarter', quarter);

  if (error) {
    console.error('[ECRService] Error fetching student scores:', error);
    return [];
  }

  return data.map(mapScoreFromDB);
}

/**
 * Save a single score
 */
export async function saveScore(
  activityId: string,
  studentId: string,
  rawScore: number | null,
  gradedBy: string,
  status: string = 'graded',
  remarks?: string
): Promise<ECRScore | null> {
  const { data, error } = await supabase
    .from('ecr_scores')
    .upsert({
      activity_id: activityId,
      student_id: studentId,
      raw_score: rawScore,
      status: rawScore !== null ? 'graded' : status,
      remarks: remarks || null,
      graded_by: gradedBy,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'activity_id,student_id'
    })
    .select()
    .single();

  if (error) {
    console.error('[ECRService] Error saving score:', error);
    return null;
  }

  return mapScoreFromDB(data);
}

/**
 * Save multiple scores at once (bulk entry)
 */
export async function saveScoresBulk(
  activityId: string,
  scores: BulkScoreEntry[],
  gradedBy: string
): Promise<boolean> {
  const records = scores.map(s => ({
    activity_id: activityId,
    student_id: s.studentId,
    raw_score: s.rawScore,
    status: s.rawScore !== null ? 'graded' : (s.status || 'pending'),
    remarks: s.remarks || null,
    graded_by: gradedBy,
    graded_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('ecr_scores')
    .upsert(records, {
      onConflict: 'activity_id,student_id'
    });

  if (error) {
    console.error('[ECRService] Error bulk saving scores:', error);
    return false;
  }

  return true;
}

// ============================================
// Grade Computation
// ============================================

/**
 * Compute and cache grades for a student
 * Also syncs the quarterly grade to the main grades table
 */
export async function computeStudentGrades(
  studentId: string,
  sectionId: string,
  learningAreaId: string,
  schoolYear: string,
  quarter: ECRQuarter
): Promise<ECRComponentGrades | null> {
  const { error } = await supabase.rpc('compute_ecr_grades', {
    p_student_id: studentId,
    p_section_id: sectionId,
    p_learning_area_id: learningAreaId,
    p_school_year: schoolYear,
    p_quarter: quarter
  });

  if (error) {
    console.error('[ECRService] Error computing grades:', error);
    return null;
  }

  // Sync the computed quarterly grade to the main grades table
  // This ensures grades/overview and Form 138 show ECR-computed grades
  const { error: syncError } = await supabase.rpc('sync_ecr_to_grades', {
    p_student_id: studentId,
    p_learning_area_id: learningAreaId,
    p_school_year: schoolYear,
    p_quarter: quarter
  });

  if (syncError) {
    console.error('[ECRService] Error syncing to grades table:', syncError);
    // Don't fail the entire operation, just log the error
  } else {
    console.log(`[ECRService] Synced ${quarter} grade to grades table for student ${studentId}`);
  }

  // Fetch the cached component grades
  const { data: cached, error: cacheError } = await supabase
    .from('ecr_component_grades')
    .select('*')
    .eq('student_id', studentId)
    .eq('learning_area_id', learningAreaId)
    .eq('school_year', schoolYear)
    .eq('quarter', quarter)
    .single();

  if (cacheError) {
    console.error('[ECRService] Error fetching cached grades:', cacheError);
    return null;
  }

  return mapComponentGradesFromDB(cached);
}

/**
 * Get cached component grades for a student
 */
export async function getComponentGrades(
  studentId: string,
  learningAreaId: string,
  schoolYear: string,
  quarter: ECRQuarter
): Promise<ECRComponentGrades | null> {
  const { data, error } = await supabase
    .from('ecr_component_grades')
    .select('*')
    .eq('student_id', studentId)
    .eq('learning_area_id', learningAreaId)
    .eq('school_year', schoolYear)
    .eq('quarter', quarter)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Not found is OK
      console.error('[ECRService] Error fetching component grades:', error);
    }
    return null;
  }

  return mapComponentGradesFromDB(data);
}

// ============================================
// Class Record (Full View)
// ============================================

/**
 * Get complete class record for a section/subject/quarter
 */
export async function getClassRecord(
  sectionId: string,
  learningAreaId: string,
  schoolYear: string,
  quarter: ECRQuarter
): Promise<ECRClassRecord | null> {
  // Get section and subject info
  const [sectionResult, subjectResult] = await Promise.all([
    supabase.from('sections').select('*, teachers(id, name), schools(id, name, school_id_number)').eq('id', sectionId).single(),
    supabase.from('learning_areas').select('id, name, code').eq('id', learningAreaId).single()
  ]);

  if (sectionResult.error || subjectResult.error) {
    console.error('[ECRService] Error fetching section/subject:', sectionResult.error || subjectResult.error);
    return null;
  }

  const section = sectionResult.data;
  const subject = subjectResult.data;

  // Get weights
  const weights = await getECRWeights(section.school_id, learningAreaId, section.grade_level);

  // Get activities
  const activities = await getActivities(sectionId, learningAreaId, schoolYear, quarter);

  // Get students in section
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, first_name, last_name, lrn')
    .eq('section_id', sectionId)
    .eq('enrollment_status', 'enrolled')
    .is('deleted_at', null)
    .order('last_name')
    .order('first_name');

  if (studentsError) {
    console.error('[ECRService] Error fetching students:', studentsError);
    return null;
  }

  // Get all scores for all activities
  const activityIds = activities.map(a => a.id);
  const { data: allScores, error: scoresError } = await supabase
    .from('ecr_scores')
    .select('*')
    .in('activity_id', activityIds);

  if (scoresError) {
    console.error('[ECRService] Error fetching scores:', scoresError);
    return null;
  }

  // Helper: DepEd transmutation (0% → 60, 100% → 100, linear)
  const transmute = (pct: number): number => {
    if (pct <= 0) return 60;
    if (pct >= 100) return 100;
    return Math.round((60 + pct * 0.4) * 100) / 100;
  };

  // Build activity lookup by type for client-side computation
  const wwActivities = activities.filter(a => a.activityType === 'WW');
  const ptActivities = activities.filter(a => a.activityType === 'PT');
  const qaActivities = activities.filter(a => a.activityType === 'QA');

  // Build student rows with client-side computation
  const studentRows: ECRStudentRow[] = students.map(student => {
    const studentScores = allScores?.filter(s => s.student_id === student.id) || [];
    const scoresMap: Record<string, ECRScore> = {};
    studentScores.forEach(s => {
      scoresMap[s.activity_id] = mapScoreFromDB(s);
    });

    // Client-side computation from raw scores
    const computeComponent = (acts: ECRActivity[]) => {
      let total = 0, max = 0;
      for (const act of acts) {
        const score = studentScores.find(s => s.activity_id === act.id && s.status === 'graded');
        if (score && score.raw_score != null) {
          total += Number(score.raw_score);
          max += Number(act.maxScore);
        }
      }
      const pct = max > 0 ? (total / max) * 100 : 0;
      return { total, max, pct, transmuted: transmute(pct) };
    };

    const ww = computeComponent(wwActivities);
    const pt = computeComponent(ptActivities);
    const qa = computeComponent(qaActivities);

    const wwWtd = Math.round(ww.transmuted * weights.wwWeight / 100 * 100) / 100;
    const ptWtd = Math.round(pt.transmuted * weights.ptWeight / 100 * 100) / 100;
    const qaWtd = Math.round(qa.transmuted * weights.qaWeight / 100 * 100) / 100;
    const quarterlyGrade = Math.round(wwWtd + ptWtd + qaWtd);

    return {
      studentId: student.id,
      studentName: `${student.last_name}, ${student.first_name}`,
      lrn: student.lrn || '',
      scores: scoresMap,
      
      wwTotal: ww.total,
      wwMax: ww.max,
      wwPercentage: ww.pct,
      wwTransmuted: ww.transmuted,
      
      ptTotal: pt.total,
      ptMax: pt.max,
      ptPercentage: pt.pct,
      ptTransmuted: pt.transmuted,
      
      qaTotal: qa.total,
      qaMax: qa.max,
      qaPercentage: qa.pct,
      qaTransmuted: qa.transmuted,
      
      wwWeighted: wwWtd,
      ptWeighted: ptWtd,
      qaWeighted: qaWtd,
      
      quarterlyGrade
    };
  });

  // Calculate class statistics
  const gradedStudents = studentRows.filter(s => s.quarterlyGrade > 0);
  const grades = gradedStudents.map(s => s.quarterlyGrade);

  const stats = {
    totalStudents: studentRows.length,
    gradedCount: gradedStudents.length,
    classAverage: grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0,
    passingCount: grades.filter(g => g >= 75).length,
    passingRate: grades.length > 0 ? Math.round((grades.filter(g => g >= 75).length / grades.length) * 100) : 0,
    highestGrade: grades.length > 0 ? Math.max(...grades) : 0,
    lowestGrade: grades.length > 0 ? Math.min(...grades) : 0
  };

  return {
    sectionId,
    sectionName: section.name,
    gradeLevel: section.grade_level || 0,
    learningAreaId,
    learningAreaName: subject.name,
    learningAreaCode: subject.code || subject.name, // Use code, fallback to name
    schoolId: section.school_id,
    schoolName: section.schools?.name || '',
    schoolIdNumber: section.schools?.school_id_number || '', // Official DepEd school ID
    schoolYear,
    quarter,
    teacherId: section.teachers?.id || '',
    teacherName: section.teachers?.name || '',
    
    weights: {
      ww: weights.wwWeight,
      pt: weights.ptWeight,
      qa: weights.qaWeight
    },
    
    activities: {
      ww: activities.filter(a => a.activityType === 'WW'),
      pt: activities.filter(a => a.activityType === 'PT'),
      qa: activities.filter(a => a.activityType === 'QA')
    },
    
    students: studentRows,
    stats
  };
}

// ============================================
// Mapping Functions
// ============================================

function mapWeightFromDB(data: Record<string, unknown>): ECRWeight {
  return {
    id: data.id as string,
    schoolId: data.school_id as string,
    learningAreaId: data.learning_area_id as string | null,
    gradeLevelMin: data.grade_level_min as number | null,
    gradeLevelMax: data.grade_level_max as number | null,
    wwWeight: data.ww_weight as number,
    ptWeight: data.pt_weight as number,
    qaWeight: data.qa_weight as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string
  };
}

function mapActivityFromDB(data: Record<string, unknown>): ECRActivity {
  return {
    id: data.id as string,
    schoolId: data.school_id as string,
    teacherId: data.teacher_id as string,
    sectionId: data.section_id as string,
    learningAreaId: data.learning_area_id as string,
    schoolYear: data.school_year as string,
    quarter: data.quarter as ECRQuarter,
    activityType: data.activity_type as ECRActivityType,
    activityNumber: data.activity_number as number,
    activityName: data.activity_name as string | null,
    description: data.description as string | null,
    maxScore: data.max_score as number,
    activityDate: data.activity_date as string | null,
    dueDate: data.due_date as string | null,
    isPublished: data.is_published as boolean,
    isLocked: data.is_locked as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    deletedAt: data.deleted_at as string | null
  };
}

function mapScoreFromDB(data: Record<string, unknown>): ECRScore {
  return {
    id: data.id as string,
    activityId: data.activity_id as string,
    studentId: data.student_id as string,
    rawScore: data.raw_score as number | null,
    status: data.status as ECRScore['status'],
    remarks: data.remarks as string | null,
    gradedBy: data.graded_by as string | null,
    gradedAt: data.graded_at as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string
  };
}

function mapComponentGradesFromDB(data: Record<string, unknown>): ECRComponentGrades {
  return {
    id: data.id as string,
    schoolId: data.school_id as string,
    studentId: data.student_id as string,
    sectionId: data.section_id as string,
    learningAreaId: data.learning_area_id as string,
    schoolYear: data.school_year as string,
    quarter: data.quarter as ECRQuarter,
    
    wwTotalScore: data.ww_total_score as number,
    wwMaxScore: data.ww_max_score as number,
    wwPercentage: data.ww_percentage as number,
    wwTransmuted: data.ww_transmuted as number,
    wwWeighted: data.ww_weighted as number,
    
    ptTotalScore: data.pt_total_score as number,
    ptMaxScore: data.pt_max_score as number,
    ptPercentage: data.pt_percentage as number,
    ptTransmuted: data.pt_transmuted as number,
    ptWeighted: data.pt_weighted as number,
    
    qaTotalScore: data.qa_total_score as number,
    qaMaxScore: data.qa_max_score as number,
    qaPercentage: data.qa_percentage as number,
    qaTransmuted: data.qa_transmuted as number,
    qaWeighted: data.qa_weighted as number,
    
    quarterlyGrade: data.quarterly_grade as number,
    lastComputedAt: data.last_computed_at as string,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string
  };
}

// Export service object for cleaner imports
export const ECRService = {
  // Weights
  getWeights: getECRWeights,
  saveWeights: saveECRWeights,
  
  // Activities
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  
  // Scores
  getScoresForActivity,
  getScoresForStudent,
  saveScore,
  saveScoresBulk,
  
  // Grades
  computeStudentGrades,
  getComponentGrades,
  
  // Class Record
  getClassRecord
};

export default ECRService;
