/**
 * SF6 Service - Summarized Report on Promotion and Level of Proficiency
 * Official DepEd Form Service
 * 
 * Aggregates student promotion and proficiency data from grades/academic records
 */

import { supabase } from '../lib/supabase';
import type {
  SF6Filter,
  SF6SchoolSummary,
  SF6GradeSummary,
  SF6SectionSummary,
  PromotionStatus,
  ProficiencyLevel,
} from '../types/sf6Promotion';

/**
 * Calculate proficiency level based on general average
 * Based on DepEd Order No. 8, s. 2015 (K to 12 Grading System)
 */
function getProficiencyLevel(average: number): ProficiencyLevel {
  if (average >= 90) return 'advanced';
  if (average >= 85) return 'proficient';
  if (average >= 80) return 'approaching_proficiency';
  if (average >= 75) return 'developing';
  return 'beginning';
}

/**
 * Determine promotion status based on general average and completion
 */
function getPromotionStatus(average: number, hasIncomplete: boolean): PromotionStatus {
  if (hasIncomplete) return 'incomplete';
  if (average >= 75) return 'promoted'; // Passing grade is 75
  return 'retained';
}

/**
 * Get SF6 summary by grade level
 */
export async function getSF6ByGrade(filter: SF6Filter): Promise<SF6GradeSummary[]> {
  const { school_id, school_year, grading_period = 'final', grade_level } = filter;

  // Query students with their final grades
  let query = supabase
    .from('students')
    .select(`
      id,
      grade_level,
      gender,
      section_id,
      sections!inner(name)
    `)
    .eq('school_id', school_id)
    .eq('deleted_at', null);

  if (grade_level !== undefined) {
    query = query.eq('grade_level', grade_level);
  }

  const { data: students, error: studentsError } = await query;

  if (studentsError) throw studentsError;
  if (!students) return [];

  // Get grades for these students
  const studentIds = students.map(s => s.id);
  
  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .select('student_id, learning_area_id, final_grade')
    .in('student_id', studentIds)
    .eq('school_year', school_year)
    .eq('grading_period', grading_period);

  if (gradesError) throw gradesError;

  // Group by grade level
  const gradeLevels = [...new Set(students.map(s => s.grade_level))].sort((a, b) => a - b);
  
  const summaries: SF6GradeSummary[] = gradeLevels.map(level => {
    const levelStudents = students.filter(s => s.grade_level === level);
    const maleCount = levelStudents.filter(s => s.gender === 'male').length;
    const femaleCount = levelStudents.filter(s => s.gender === 'female').length;

    let promoted = 0;
    let retained = 0;
    let incomplete = 0;
    let advanced = 0;
    let proficient = 0;
    let approaching_proficiency = 0;
    let developing = 0;
    let beginning = 0;

    levelStudents.forEach(student => {
      const studentGrades = grades?.filter(g => g.student_id === student.id) || [];
      
      if (studentGrades.length === 0) {
        incomplete++;
        return;
      }

      // Calculate general average
      const validGrades = studentGrades.filter(g => g.final_grade !== null && g.final_grade >= 0);
      
      if (validGrades.length === 0) {
        incomplete++;
        return;
      }

      const average = validGrades.reduce((sum, g) => sum + (g.final_grade || 0), 0) / validGrades.length;
      const hasIncomplete = studentGrades.some(g => g.final_grade === null || g.final_grade < 0);

      const status = getPromotionStatus(average, hasIncomplete);
      const proficiency = getProficiencyLevel(average);

      // Count promotion status
      if (status === 'promoted') promoted++;
      else if (status === 'retained') retained++;
      else incomplete++;

      // Count proficiency level
      if (proficiency === 'advanced') advanced++;
      else if (proficiency === 'proficient') proficient++;
      else if (proficiency === 'approaching_proficiency') approaching_proficiency++;
      else if (proficiency === 'developing') developing++;
      else beginning++;
    });

    const totalLearners = levelStudents.length;
    const promotionRate = totalLearners > 0 ? (promoted / totalLearners) * 100 : 0;

    return {
      grade_level: level,
      total_learners: totalLearners,
      male_count: maleCount,
      female_count: femaleCount,
      promoted,
      retained,
      incomplete,
      advanced,
      proficient,
      approaching_proficiency,
      developing,
      beginning,
      promotion_rate: Math.round(promotionRate * 100) / 100,
    };
  });

  return summaries;
}

/**
 * Get SF6 summary by section
 */
export async function getSF6BySection(filter: SF6Filter): Promise<SF6SectionSummary[]> {
  const { school_id, school_year, grading_period = 'final', section_id } = filter;

  // Query students with their sections
  let query = supabase
    .from('students')
    .select(`
      id,
      grade_level,
      gender,
      section_id,
      sections!inner(id, name, teacher_id, teachers(first_name, last_name))
    `)
    .eq('school_id', school_id)
    .eq('deleted_at', null);

  if (section_id) {
    query = query.eq('section_id', section_id);
  }

  const { data: students, error: studentsError } = await query;

  if (studentsError) throw studentsError;
  if (!students) return [];

  // Get grades
  const studentIds = students.map(s => s.id);
  
  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .select('student_id, learning_area_id, final_grade')
    .in('student_id', studentIds)
    .eq('school_year', school_year)
    .eq('grading_period', grading_period);

  if (gradesError) throw gradesError;

  // Group by section
  const sectionIds = [...new Set(students.map(s => s.section_id))];
  
  const summaries: SF6SectionSummary[] = sectionIds.map(secId => {
    const sectionStudents = students.filter(s => s.section_id === secId);
    const firstStudent = sectionStudents[0];
    const section = firstStudent.sections as any;
    const teacher = section?.teachers as any;
    
    const maleCount = sectionStudents.filter(s => s.gender === 'male').length;
    const femaleCount = sectionStudents.filter(s => s.gender === 'female').length;

    let promoted = 0;
    let retained = 0;
    let incomplete = 0;
    let advanced = 0;
    let proficient = 0;
    let approaching_proficiency = 0;
    let developing = 0;
    let beginning = 0;

    sectionStudents.forEach(student => {
      const studentGrades = grades?.filter(g => g.student_id === student.id) || [];
      
      if (studentGrades.length === 0) {
        incomplete++;
        return;
      }

      const validGrades = studentGrades.filter(g => g.final_grade !== null && g.final_grade >= 0);
      
      if (validGrades.length === 0) {
        incomplete++;
        return;
      }

      const average = validGrades.reduce((sum, g) => sum + (g.final_grade || 0), 0) / validGrades.length;
      const hasIncomplete = studentGrades.some(g => g.final_grade === null || g.final_grade < 0);

      const status = getPromotionStatus(average, hasIncomplete);
      const proficiency = getProficiencyLevel(average);

      if (status === 'promoted') promoted++;
      else if (status === 'retained') retained++;
      else incomplete++;

      if (proficiency === 'advanced') advanced++;
      else if (proficiency === 'proficient') proficient++;
      else if (proficiency === 'approaching_proficiency') approaching_proficiency++;
      else if (proficiency === 'developing') developing++;
      else beginning++;
    });

    const totalLearners = sectionStudents.length;
    const promotionRate = totalLearners > 0 ? (promoted / totalLearners) * 100 : 0;
    const adviserName = teacher ? `${teacher.first_name} ${teacher.last_name}` : undefined;

    return {
      section_id: secId,
      section_name: section?.name || 'Unknown Section',
      grade_level: firstStudent.grade_level,
      total_learners: totalLearners,
      male_count: maleCount,
      female_count: femaleCount,
      promoted,
      retained,
      incomplete,
      advanced,
      proficient,
      approaching_proficiency,
      developing,
      beginning,
      promotion_rate: Math.round(promotionRate * 100) / 100,
      adviser_name: adviserName,
    };
  });

  return summaries.sort((a, b) => {
    if (a.grade_level !== b.grade_level) return a.grade_level - b.grade_level;
    return a.section_name.localeCompare(b.section_name);
  });
}

/**
 * Get complete SF6 school summary
 */
export async function getSF6SchoolSummary(filter: SF6Filter): Promise<SF6SchoolSummary> {
  const [byGrade, bySection] = await Promise.all([
    getSF6ByGrade(filter),
    getSF6BySection(filter),
  ]);

  // Calculate overall totals
  const totalLearners = byGrade.reduce((sum, g) => sum + g.total_learners, 0);
  const totalMale = byGrade.reduce((sum, g) => sum + g.male_count, 0);
  const totalFemale = byGrade.reduce((sum, g) => sum + g.female_count, 0);
  const totalPromoted = byGrade.reduce((sum, g) => sum + g.promoted, 0);
  const totalRetained = byGrade.reduce((sum, g) => sum + g.retained, 0);
  const totalIncomplete = byGrade.reduce((sum, g) => sum + g.incomplete, 0);
  
  const totalAdvanced = byGrade.reduce((sum, g) => sum + (g.advanced || 0), 0);
  const totalProficient = byGrade.reduce((sum, g) => sum + (g.proficient || 0), 0);
  const totalApproaching = byGrade.reduce((sum, g) => sum + (g.approaching_proficiency || 0), 0);
  const totalDeveloping = byGrade.reduce((sum, g) => sum + (g.developing || 0), 0);
  const totalBeginning = byGrade.reduce((sum, g) => sum + (g.beginning || 0), 0);

  const overallPromotionRate = totalLearners > 0 ? (totalPromoted / totalLearners) * 100 : 0;

  return {
    school_id: filter.school_id,
    school_year: filter.school_year,
    grading_period: filter.grading_period || 'final',
    total_learners: totalLearners,
    total_male: totalMale,
    total_female: totalFemale,
    total_promoted: totalPromoted,
    total_retained: totalRetained,
    total_incomplete: totalIncomplete,
    overall_promotion_rate: Math.round(overallPromotionRate * 100) / 100,
    total_advanced: totalAdvanced,
    total_proficient: totalProficient,
    total_approaching_proficiency: totalApproaching,
    total_developing: totalDeveloping,
    total_beginning: totalBeginning,
    by_grade: byGrade,
    by_section: bySection,
  };
}
