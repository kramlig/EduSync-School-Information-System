/**
 * DepEd Forms - TypeScript Type Definitions
 * 
 * This file contains all type definitions for DepEd-compliant forms
 * including Form 137, Form 138, School Forms (SF1, SF2, SF9), and ELLN Assessment.
 */

// ============================================================================
// FORM 137 - PERMANENT RECORD
// ============================================================================

export interface AcademicHistory {
  id: string;
  studentId: string;
  lrn?: string; // Learner Reference Number
  studentName: string;
  birthDate?: string;
  birthPlace?: string;
  parentGuardian?: string;
  
  schoolYear: string; // Format: "2024-2025"
  gradeLevel: number; // 0 = Kinder, 1-12 = Grade levels
  section: string;
  adviserName: string;
  schoolName: string;
  schoolId: string;
  
  // Quarterly grades per subject
  subjects: SubjectGrade[];
  
  // General average
  generalAverage: number;
  
  // Attendance
  daysOfSchool: number;
  daysPresent: number;
  
  // Promotion status
  promotionStatus: 'PROMOTED' | 'RETAINED' | 'CONDITIONAL';
  remarks?: string; // Additional remarks/notes
  
  // Core values (behavior)
  coreValues?: {
    behavior?: Record<string, number>; // e.g., { "Respect": 95, "Excellence": 92 }
    observedValues?: Record<string, ObservedValue>; // e.g., { "Respect": "SO", "Excellence": "AO" }
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface QuarterGrade {
  ww?: number; // Written Work
  pt?: number; // Performance Task
  qa?: number; // Quarterly Assessment
  finalGrade: number; // Computed quarterly grade
}

export interface SubjectGrade {
  learningAreaId: string;
  learningAreaName: string;
  q1?: number | QuarterGrade; // Can be just final grade or detailed breakdown
  q2?: number | QuarterGrade;
  q3?: number | QuarterGrade;
  q4?: number | QuarterGrade;
  finalRating: number; // Final average for the school year
  remarks: 'Passed' | 'Failed';
}

export type ObservedValue = 'SO' | 'AO' | 'RO' | 'NO';
// SO = Strongly Observed, AO = Always Observed, RO = Regularly Observed, NO = Not Observed

// ============================================================================
// FORM 138 - REPORT CARD
// ============================================================================

export interface ReportCard {
  id: string;
  studentId: string;
  schoolYear: string;
  gradeLevel: number;
  section: string;
  adviser: string;
  
  // Academic grades
  subjects: SubjectGrade[];
  generalAverage: number;
  
  // Core values (quarterly)
  coreValuesQuarterly: {
    q1: Record<string, ObservedValue>;
    q2: Record<string, ObservedValue>;
    q3: Record<string, ObservedValue>;
    q4: Record<string, ObservedValue>;
  };
  
  // Attendance (quarterly)
  attendanceQuarterly: {
    q1: { present: number; absent: number };
    q2: { present: number; absent: number };
    q3: { present: number; absent: number };
    q4: { present: number; absent: number };
  };
  
  // Remarks and notes
  teacherRemarks?: string;
  parentSignature?: string;
  parentSignatureDate?: string;
  
  // Metadata
  generatedAt: string;
  generatedBy: string;
}

// ============================================================================
// SCHOOL FORMS (SF1, SF2, SF9)
// ============================================================================

export interface SchoolForm {
  id: string;
  formType: 'SF1' | 'SF2' | 'SF9';
  schoolYear: string;
  schoolId: string;
  schoolName: string;
  
  // SF1: Enrollment data
  enrollmentData?: EnrollmentData;
  
  // SF2: Attendance data
  attendanceData?: AttendanceData;
  
  // SF9: Promotion data
  promotionData?: PromotionData;
  
  // Metadata
  preparedBy: string;
  preparedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  generatedAt: string;
  status: 'draft' | 'finalized' | 'submitted';
  submittedToEBEIS?: string; // Date submitted
}

export interface EnrollmentData {
  reportDate: string; // Date when report was generated
  month: string; // "September", "October", etc.
  
  // By grade level
  byGradeLevel: Record<number, { male: number; female: number; total: number }>;
  
  // By age
  byAge: Record<number, number>; // Age → Count
  
  // Transfer students
  transferredIn: number;
  transferredOut: number;
  
  // Totals
  totalMale: number;
  totalFemale: number;
  totalEnrollment: number;
}

export interface AttendanceData {
  month: string; // "September", "October", etc.
  schoolYear: string;
  
  // By section
  bySection: Record<string, {
    sectionName: string;
    gradeLevel: number;
    enrollment: number;
    totalDaysPresent: number;
    totalDaysAbsent: number;
    attendanceRate: number; // Percentage
  }>;
  
  // School-wide summary
  totalEnrollment: number;
  totalDaysPresent: number;
  totalDaysAbsent: number;
  schoolWideRate: number; // Percentage
  
  // Highlights
  highestAttendanceSection?: string;
  lowestAttendanceSection?: string;
  perfectAttendanceCount: number; // Students with 100% attendance
}

export interface PromotionData {
  endOfSchoolYear: string; // "2024-2025"
  
  // By grade level
  byGradeLevel: Record<number, {
    gradeLevel: number;
    enrolled: number;
    promoted: number;
    retained: number;
    dropped: number;
    promotionRate: number; // Percentage
  }>;
  
  // School-wide summary
  totalEnrolled: number;
  totalPromoted: number;
  totalRetained: number;
  totalDropped: number;
  schoolWidePromotionRate: number; // Percentage
  
  // Graduates (Grade 6, 10, 12)
  grade6Graduates?: number;
  grade10Graduates?: number;
  grade12Graduates?: number;
  totalGraduates: number;
}

// ============================================================================
// ELLN ASSESSMENT (K-3)
// ============================================================================

export interface ELLNAssessment {
  id: string;
  studentId: string;
  studentName: string;
  gradeLevel: 0 | 1 | 2 | 3; // Kinder to Grade 3 only
  schoolYear: string;
  quarter: 'q1' | 'q2' | 'q3' | 'q4';
  
  // Literacy domains (0-100 scores)
  literacy: {
    oralLanguage: number;
    phonologicalAwareness: number;
    bookAndPrintKnowledge: number;
    alphabetKnowledge: number;
    phonics: number;
    comprehension: number;
  };
  
  // Numeracy domains (0-100 scores)
  numeracy: {
    numberSense: number;
    measurement: number;
    geometry: number;
    patterns: number;
    dataAnalysis: number;
  };
  
  // Overall scores (calculated)
  literacyScore: number; // Average of literacy domains
  numeracyScore: number; // Average of numeracy domains
  overallScore: number; // Average of literacy and numeracy
  
  // Proficiency level (based on overall score)
  proficiencyLevel: ProficiencyLevel;
  
  // Assessor information
  assessedBy: string;
  assessedByName: string;
  assessmentDate: string;
  
  // Notes and observations
  notes?: string;
  recommendations?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export type ProficiencyLevel = 
  | 'Beginning'          // 0-49
  | 'Developing'         // 50-64
  | 'Approaching'        // 65-79
  | 'Proficient'         // 80-89
  | 'Advanced';          // 90-100

// ============================================================================
// GRADING UTILITIES
// ============================================================================

export interface GradingConfig {
  gradeLevel: number;
  passingGrade: number; // Typically 75
  transmutationTable?: TransmutationTable;
}

export interface TransmutationTable {
  gradeLevel: number;
  mappings: Array<{
    rawMin: number;
    rawMax: number;
    transmutedGrade: number;
  }>;
}

// ============================================================================
// FORM GENERATION OPTIONS
// ============================================================================

export interface Form137GenerateOptions {
  studentId: string;
  includeAllYears?: boolean; // Include all school years or just one
  schoolYearFilter?: string; // If specified, only include this school year
  format: 'pdf' | 'preview';
}

export interface Form138GenerateOptions {
  studentId: string;
  schoolYear: string;
  quarter?: 'q1' | 'q2' | 'q3' | 'q4' | 'final'; // 'final' = all 4 quarters
  format: 'pdf' | 'preview';
  includeSignatures?: boolean;
}

export interface SchoolFormGenerateOptions {
  formType: 'SF1' | 'SF2' | 'SF9';
  schoolYear: string;
  month?: string; // For SF1 and SF2
  format: 'pdf' | 'csv' | 'preview';
}

export interface BatchGenerateOptions {
  studentIds: string[];
  formType: 'form137' | 'form138';
  format: 'pdf' | 'zip'; // 'zip' = multiple PDFs in one ZIP file
  schoolYear?: string; // For Form 138
  quarter?: 'q1' | 'q2' | 'q3' | 'q4' | 'final'; // For Form 138
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// EBEIS EXPORT
// ============================================================================

export interface EBEISExportData {
  formType: 'SF1' | 'SF2' | 'SF9';
  schoolYear: string;
  schoolId: string;
  data: any[]; // CSV rows
  generatedAt: string;
  format: 'csv';
}

// ============================================================================
// FORM STATUS
// ============================================================================

export interface FormGenerationStatus {
  formType: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number; // 0-100
  message?: string;
  result?: {
    filename: string;
    url?: string;
    size?: number;
  };
  error?: string;
}
