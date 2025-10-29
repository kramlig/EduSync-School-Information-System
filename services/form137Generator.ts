/**
 * Form 137 Auto-Generator Service
 * 
 * AUTO-GENERATES Form 137 from existing system data
 * NO MANUAL DATA ENTRY NEEDED!
 * 
 * Data Sources:
 * - students collection (demographics, LRN)
 * - grades collection (quarterly grades)
 * - attendanceRecords collection (daily attendance)
 * - coreValueGrades collection (behavior ratings)
 * - sections collection (grade level, adviser)
 */

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';
import type { Student, Grade, CoreValueGrade, AttendanceRecord, Section, LearningArea, CoreValue, CoreValueMarking } from '../types';
import type { AcademicHistory, SubjectGrade, SchoolYearRecord, CoreValuesRecord } from '../components/forms/shared/FormTypes';
import { 
  computeFinalGrade, 
  computeGeneralAverage,
  determinePromotionStatus 
} from './gradingFormulas';
import { getCurrentSchoolYear } from './dateHelpers';
import { Form137Service } from './formsService';

const db = getFirestoreInstance();

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
    
    // Step 1: Get student profile
    const studentDoc = await getDoc(doc(db, 'students', options.studentId));
    if (!studentDoc.exists()) {
      return {
        success: false,
        error: 'Student not found'
      };
    }
    
    const student = { id: studentDoc.id, ...studentDoc.data() } as Student;

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

    // Step 2: Get student's section
    let sectionData: Section | null = null;
    let adviserName = '';
    
    if (student.sectionId) {
      const sectionDoc = await getDoc(doc(db, 'sections', student.sectionId));
      if (sectionDoc.exists()) {
        sectionData = { id: sectionDoc.id, ...sectionDoc.data() } as Section;
        
        // Get adviser name
        if (sectionData.adviserId) {
          const adviserDoc = await getDoc(doc(db, 'teachers', sectionData.adviserId));
          if (adviserDoc.exists()) {
            adviserName = adviserDoc.data().name || '';
          }
        }
      }
    }
    
    if (!sectionData) {
      warnings.push('No section assignment found');
    }

    // Step 3: Get quarterly grades
    const gradesRef = collection(db, 'grades');
    const gradesQuery = query(gradesRef, where('studentId', '==', options.studentId));
    const gradesSnapshot = await getDocs(gradesQuery);
    const grades = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));

    if (grades.length === 0) {
      warnings.push('No grades found for this student');
    }
    
    // Step 4: Get learning areas for names
    const learningAreasRef = collection(db, 'learningAreas');
    const learningAreasSnapshot = await getDocs(learningAreasRef);
    const learningAreasMap = new Map<string, string>();
    learningAreasSnapshot.docs.forEach(doc => {
      const data = doc.data() as LearningArea;
      learningAreasMap.set(doc.id, data.name);
    });

    // Step 5: Transform grades to Form 137 format
    const subjectGrades = transformGradesToForm137(grades, learningAreasMap);

    // Step 6: Get attendance
    const attendanceRef = collection(db, 'attendanceRecords');
    const attendanceQuery = query(attendanceRef, where('studentId', '==', options.studentId));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    let daysPresent = 0;
    let totalDays = 0;
    
    if (!attendanceSnapshot.empty) {
      const attendanceRecord = attendanceSnapshot.docs[0].data() as AttendanceRecord;
      const dailyStatus = attendanceRecord.dailyStatus || {};
      
      // Count attendance for the school year
      Object.entries(dailyStatus).forEach(([date, status]) => {
        const recordDate = new Date(date);
        const [startYear] = schoolYear.split('-').map(Number);
        const yearMatches = recordDate.getFullYear() === startYear || 
                           recordDate.getFullYear() === startYear + 1;
        
        if (yearMatches) {
          totalDays++;
          if (status === 'P') daysPresent++;
        }
      });
    }
    
    if (totalDays === 0) {
      warnings.push('No attendance records found');
      totalDays = 200; // Default school days
    }

    // Step 7: Get core values
    const coreValuesGradesRef = collection(db, 'coreValueGrades');
    const coreValuesQuery = query(coreValuesGradesRef, where('studentId', '==', options.studentId));
    const coreValuesSnapshot = await getDocs(coreValuesQuery);
    
    // Get core value names
    const coreValuesRef = collection(db, 'coreValues');
    const coreValuesCollSnapshot = await getDocs(coreValuesRef);
    const coreValuesMap = new Map<string, CoreValue>();
    coreValuesCollSnapshot.docs.forEach(doc => {
      coreValuesMap.set(doc.id, { id: doc.id, ...doc.data() } as CoreValue);
    });
    
    const observedValues: Record<string, 'SO' | 'AO' | 'RO' | 'NO'> = {};
    
    coreValuesSnapshot.docs.forEach(doc => {
      const cvGrade = doc.data() as CoreValueGrade;
      const coreValue = coreValuesMap.get(cvGrade.coreValueId);
      
      if (coreValue) {
        // Get most recent quarter's marking (Q4 > Q3 > Q2 > Q1)
        const q4 = cvGrade.q4;
        const q3 = cvGrade.q3;
        const q2 = cvGrade.q2;
        const q1 = cvGrade.q1;
        
        // Get the first behavior marking from the most recent quarter
        const latestQuarter = q4 || q3 || q2 || q1;
        if (latestQuarter && typeof latestQuarter === 'object') {
          const firstBehavior = Object.keys(latestQuarter)[0];
          if (firstBehavior) {
            const marking = latestQuarter[firstBehavior];
            observedValues[coreValue.name] = marking as 'SO' | 'AO' | 'RO' | 'NO';
          }
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
        studentName: student.name,
        lrn: student.lrn || '',
        birthDate: student.dateOfBirth || '',
        birthPlace: student.placeOfBirth || '',
        parentGuardian: student.guardianName || '',
        
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
  // Group grades by learning area
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
    
    // Get the grade record (should be one per student per subject)
    const gradeRecord = subjectGradesList[0];
    
    // Extract quarterly grades (handle both number and SubGradeRecord)
    const q1 = typeof gradeRecord.q1 === 'number' ? gradeRecord.q1 : 0;
    const q2 = typeof gradeRecord.q2 === 'number' ? gradeRecord.q2 : 0;
    const q3 = typeof gradeRecord.q3 === 'number' ? gradeRecord.q3 : 0;
    const q4 = typeof gradeRecord.q4 === 'number' ? gradeRecord.q4 : 0;
    
    // Compute final grade (renamed from finalRating for consistency)
    const finalGrade = gradeRecord.finalGrade || computeFinalGrade(q1, q2, q3, q4);
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

