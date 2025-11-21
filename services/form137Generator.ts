/**
 * Form 137 Auto-Generator Service
 * 
 * AUTO-GENERATES Form 137 from existing system data
 * NO MANUAL DATA ENTRY NEEDED!
 * 
 * Data Sources (ALL FROM POSTGRESQL):
 * - students table (demographics, LRN)
 * - grades table (quarterly grades)
 * - attendance_records table (daily attendance)
 * - core_value_grades table (behavior ratings)
 * - sections table (grade level, adviser)
 */

import { supabase } from '../src/lib/supabase';
import type { Student, Grade, Section } from '../types';
import type { AcademicHistory, SubjectGrade, SchoolYearRecord } from '../components/forms/shared/FormTypes';
import { 
  computeFinalGrade, 
  computeGeneralAverage,
  determinePromotionStatus 
} from './gradingFormulas';
import { getCurrentSchoolYear } from './dateHelpers';
import { Form137Service } from './formsService';

interface GenerationOptions {
  studentId: string;
  schoolYear?: string;
  gradeLevel?: number;
  section?: string;
}

interface GenerationResult {
  success: boolean;
  data?: Omit<AcademicHistory, 'id'>;
  schoolYearData?: SchoolYearRecord;
  existingRecord?: AcademicHistory;
  isUpdate?: boolean; // true if adding year to existing record
  error?: string;
  warnings?: string[];
}

/**
 * Auto-generate Form 137 from existing system data
 * 
 * This pulls grades, attendance, and core values to create Form 137 automatically
 * Now creates SchoolYearRecord and checks for existing Form 137
 */
export async function generateForm137FromSystemData(options: GenerationOptions): Promise<GenerationResult> {
  const warnings: string[] = [];
  
  try {
    const schoolYear = options.schoolYear || getCurrentSchoolYear();
    
    // Step 1: Get student profile from PostgreSQL
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', options.studentId)
      .single();
    
    if (studentError || !studentData) {
      return {
        success: false,
        error: 'Student not found'
      };
    }
    
    const student = studentData as Student;

    // Step 1.5: Check if Form 137 already exists for this student
    const existingRecord = await Form137Service.getByStudentId(options.studentId);
    const isUpdate = existingRecord !== null;

    // If updating, check if this school year already exists in the record
    if (isUpdate && existingRecord) {
      const yearExists = existingRecord.schoolYears.some((yr: SchoolYearRecord) => yr.schoolYear === schoolYear);
      if (yearExists) {
        warnings.push(`School year ${schoolYear} already exists in this student's Form 137. This will update the existing year.`);
      }
    }

    // Step 2: Get student's section from PostgreSQL
    let sectionData: Section | null = null;
    let adviserName = '';
    
    if (student.sectionId) {
      const { data: section } = await supabase
        .from('sections')
        .select('*')
        .eq('id', student.sectionId)
        .single();
      
      if (section) {
        sectionData = section as Section;
        
        // Get adviser name from PostgreSQL
        if (sectionData.adviserId) {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('name')
            .eq('id', sectionData.adviserId)
            .single();
          
          if (teacher) {
            adviserName = teacher.name || '';
          }
        }
      }
    }
    
    if (!sectionData) {
      warnings.push('No section assignment found');
    }

    // Step 3: Get quarterly grades from PostgreSQL
    const { data: gradesData } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', options.studentId);
    
    const grades = (gradesData || []).map(g => ({
      id: g.id,
      studentId: g.student_id,
      learningAreaId: g.learning_area_id,
      quarter: g.quarter,
      grade: g.grade,
      schoolYear: g.school_year
    })) as Grade[];

    if (grades.length === 0) {
      warnings.push('No grades found for this student');
    }
    
    // Step 4: Get learning areas for names from PostgreSQL
    const { data: learningAreasData } = await supabase
      .from('learning_areas')
      .select('id, name, code')
      .is('deleted_at', null);
    
    const learningAreasMap = new Map<string, string>();
    (learningAreasData || []).forEach(la => {
      learningAreasMap.set(la.id, la.name);
    });

    // Step 5: Transform grades to Form 137 format
    const subjectGrades = transformGradesToForm137(grades, learningAreasMap);

    // Step 6: Get attendance from PostgreSQL
    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', options.studentId);
    
    let daysPresent = 0;
    let totalDays = 0;
    
    if (attendanceData && attendanceData.length > 0) {
      // Count attendance for the school year
      attendanceData.forEach((record: any) => {
        const recordDate = new Date(record.date);
        const [startYear] = schoolYear.split('-').map(Number);
        const yearMatches = recordDate.getFullYear() === startYear || 
                           recordDate.getFullYear() === startYear + 1;
        
        if (yearMatches) {
          totalDays++;
          if (record.status === 'Present') daysPresent++;
        }
      });
    }
    
    if (totalDays === 0) {
      warnings.push('No attendance records found');
      totalDays = 200; // Default school days
    }

    // Step 7: Get core values from PostgreSQL
    const { data: coreValuesGradesData } = await supabase
      .from('core_value_grades')
      .select('*')
      .eq('student_id', options.studentId);
    
    // Get core value names from PostgreSQL
    const { data: coreValuesData } = await supabase
      .from('core_values')
      .select('id, name, code')
      .is('deleted_at', null);
    
    const coreValuesMap = new Map<string, { name: string; code: string }>();
    (coreValuesData || []).forEach(cv => {
      coreValuesMap.set(cv.id, { name: cv.name, code: cv.code });
    });
    
    const observedValues: Record<string, 'SO' | 'AO' | 'RO' | 'NO'> = {};
    
    (coreValuesGradesData || []).forEach((cvGrade: any) => {
      const coreValue = coreValuesMap.get(cvGrade.core_value_id);
      
      if (coreValue) {
        // Get most recent quarter's marking from indicator_ratings JSONB
        const indicatorRatings = cvGrade.indicator_ratings || {};
        const q4 = indicatorRatings.q4 || cvGrade.q4;
        const q3 = indicatorRatings.q3 || cvGrade.q3;
        const q2 = indicatorRatings.q2 || cvGrade.q2;
        const q1 = indicatorRatings.q1 || cvGrade.q1;
        
        // Get the first behavior marking from the most recent quarter
        const latestQuarter = q4 || q3 || q2 || q1;
        if (latestQuarter && typeof latestQuarter === 'object') {
          const firstBehavior = Object.keys(latestQuarter)[0];
          if (firstBehavior) {
            const marking = latestQuarter[firstBehavior];
            observedValues[coreValue.name] = marking as 'SO' | 'AO' | 'RO' | 'NO';
          }
        } else if (typeof latestQuarter === 'string') {
          // Fallback for direct rating (e.g., q1: "AO")
          observedValues[coreValue.name] = latestQuarter as 'SO' | 'AO' | 'RO' | 'NO';
        }
      }
    });

    // Step 8: Calculate general average and promotion status
    const finalGrades = subjectGrades.map(sg => sg.finalGrade).filter(r => r > 0);
    const generalAverage = finalGrades.length > 0 ? computeGeneralAverage(finalGrades) : 0;
    const promotionStatus = determinePromotionStatus(generalAverage);

    // Step 9: Create SchoolYearRecord for this year
    const now = new Date().toISOString();
    const currentSchoolName = 'Your School Name'; // TODO: Get from school settings
    const currentSchoolId = 'SCH001'; // TODO: Get from school settings
    
    const schoolYearData: SchoolYearRecord = {
      schoolYear,
      gradeLevel: sectionData?.gradeLevel || options.gradeLevel || 7,
      section: sectionData?.name || options.section || '',
      adviserName: adviserName,
      schoolName: currentSchoolName,
      schoolId: currentSchoolId,
      
      grades: subjectGrades,
      generalAverage,
      promotionStatus: promotionStatus as 'Promoted' | 'Retained' | 'Conditional',
      
      daysOfSchool: totalDays,
      daysPresent: daysPresent,
      
      coreValues: [
        ...Object.entries(observedValues).map(([valueName, marking]) => ({
          valueName,
          rating: marking as 'SO' | 'AO' | 'RO' | 'NO'
        }))
      ],
      
      remarks: warnings.length > 0 ? `Auto-generated with warnings: ${warnings.join(', ')}` : 'Auto-generated from system data',
      
      recordedBy: 'system-auto-generator',
      recordedAt: now
    };

    // Step 10: Return different data structure based on whether this is new or update
    if (isUpdate && existingRecord) {
      // This is adding a year to an existing Form 137
      return {
        success: true,
        schoolYearData,
        existingRecord,
        isUpdate: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } else {
      // This is creating a new Form 137 with first year
      const newForm137: Omit<AcademicHistory, 'id'> = {
        studentId: student.id,
        studentName: student.name || `${student.first_name} ${student.last_name}`,
        lrn: student.lrn || '',
        birthDate: student.date_of_birth || student.dateOfBirth || '',
        birthPlace: student.place_of_birth || student.placeOfBirth || '',
        parentGuardian: student.guardianName || student.guardian_name || '',
        
        currentSchoolName: 'Your School Name', // TODO: Get from school settings
        currentSchoolId: 'SCH001', // TODO: Get from school settings
        
        schoolYears: [schoolYearData], // First year entry
        
        createdBy: 'system-auto-generator',
        updatedBy: 'system-auto-generator',
        createdAt: now,
        updatedAt: now
      };

      return {
        success: true,
        data: newForm137,
        schoolYearData,
        isUpdate: false,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

  } catch (error: any) {
    console.error('Error generating Form 137:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate Form 137'
    };
  }
}

/**
 * Transform Grade objects into Form 137 SubjectGrade format
 */
function transformGradesToForm137(
  grades: Grade[],
  learningAreasMap: Map<string, string>
): SubjectGrade[] {
  // Group grades by learning area (PostgreSQL has one record per student per subject per year)
  const gradesBySubject = new Map<string, Grade[]>();
  
  grades.forEach(grade => {
    const learningAreaId = grade.learningAreaId;
    if (!gradesBySubject.has(learningAreaId)) {
      gradesBySubject.set(learningAreaId, []);
    }
    gradesBySubject.get(learningAreaId)!.push(grade);
  });
  
  // Transform each subject's grades
  const subjectGrades: SubjectGrade[] = [];
  
  gradesBySubject.forEach((subjectGradesList, learningAreaId) => {
    const learningAreaName = learningAreasMap.get(learningAreaId) || learningAreaId;
    
    // Get the grade record (PostgreSQL: one record per student per subject per year)
    const gradeRecord = subjectGradesList[0];
    
    // PostgreSQL grades already have q1, q2, q3, q4 as numbers (not objects)
    const q1 = gradeRecord.q1 || 0;
    const q2 = gradeRecord.q2 || 0;
    const q3 = gradeRecord.q3 || 0;
    const q4 = gradeRecord.q4 || 0;
    
    // Use final_grade from PostgreSQL or compute it
    const finalGrade = gradeRecord.final_grade || gradeRecord.finalGrade || computeFinalGrade(q1, q2, q3, q4);
    const remarks: 'Passed' | 'Failed' = finalGrade >= 75 ? 'Passed' : 'Failed';
    
    subjectGrades.push({
      learningAreaId,
      learningAreaName,
      q1,
      q2,
      q3,
      q4,
      finalGrade,
      remarks
    });
  });
  
  return subjectGrades;
}

/**
 * Batch generate Form 137 for multiple students
 */
export async function batchGenerateForm137(
  studentIds: string[],
  schoolYear?: string
): Promise<{
  successful: number;
  failed: number;
  results: GenerationResult[];
}> {
  const results: GenerationResult[] = [];
  let successful = 0;
  let failed = 0;
  
  for (const studentId of studentIds) {
    const result = await generateForm137FromSystemData({ studentId, schoolYear });
    results.push(result);
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }
  
  return { successful, failed, results };
}

