/**
 * DepEd Forms - TypeScript Type Definitions
 * 
 * This file contains all type definitions for DepEd-compliant forms
 * including Form 137, Form 138, School Forms (SF1, SF2, SF9), and ELLN Assessment.
 */

// ============================================================================
// FORM 137 - PERMANENT RECORD (CUMULATIVE)
// ============================================================================

/**
 * School Transfer Record
 * Tracks when student transfers between schools
 */
export interface SchoolTransferRecord {
  fromSchoolName: string;
  fromSchoolId?: string;
  toSchoolName: string;
  toSchoolId?: string;
  transferDate: string;
  gradeLevel: number;
  reasonForTransfer?: string;
  documentsTransferred?: string[]; // List of document types transferred
  receivedBy?: string; // Name of receiving school official
  transferCertificateNumber?: string;
}

/**
 * Health Record
 * Basic health information for the student
 */
export interface HealthRecord {
  schoolYear: string;
  dateOfExamination?: string;
  height?: number; // in cm
  weight?: number; // in kg
  bmi?: number;
  nutritionalStatus?: 'Normal' | 'Wasted' | 'Severely Wasted' | 'Overweight' | 'Obese';
  visionScreening?: 'Normal' | 'Defective';
  hearingScreening?: 'Normal' | 'Defective';
  dentalStatus?: 'Good' | 'Fair' | 'Poor';
  immunizationComplete?: boolean;
  medicalConditions?: string; // Chronic conditions, allergies, etc.
  remarks?: string;
  examinedBy?: string; // School nurse/doctor name
}

/**
 * Extracurricular Activity
 * Clubs, sports, competitions, awards, etc.
 */
export interface ExtracurricularActivity {
  schoolYear: string;
  activityType: 'Club' | 'Sport' | 'Competition' | 'Award' | 'Community Service' | 'Leadership' | 'Other';
  activityName: string;
  role?: string; // President, Member, Team Captain, etc.
  achievementLevel?: 'School' | 'Division' | 'Regional' | 'National' | 'International';
  award?: string; // 1st Place, Gold Medal, etc.
  dateAchieved?: string;
  description?: string;
}

/**
 * Eligibility Record
 * For admission to high school or senior high school
 */
export interface EligibilityRecord {
  eligibleForJuniorHigh?: boolean;
  eligibleForSeniorHigh?: boolean;
  eligibilityDate?: string;
  
  // Elementary Completion
  elementaryCompletionCertificate?: string; // Certificate number
  elementaryCompletionDate?: string;
  
  // Junior High Completion
  juniorHighCompletionCertificate?: string;
  juniorHighCompletionDate?: string;
  
  // Special Programs
  specialProgramEligibility?: string[]; // STEM, ABM, HUMSS, etc.
  honorsEligibility?: string; // With Honors, With High Honors, With Highest Honors
  
  // PEPT/ALS (Philippine Educational Placement Test / Alternative Learning System)
  peptRating?: number;
  peptPassingDate?: string;
  alsRating?: string;
  alsCompletionDate?: string;
  
  remarks?: string;
}

/**
 * Certification Record
 * Official certification by school officials
 */
export interface CertificationRecord {
  certifiedBy?: string; // Principal name
  certifiedByPosition?: string; // Position title
  certifiedBySignature?: string; // Signature image URL or data
  certificationDate?: string;
  
  registrarName?: string;
  registrarSignature?: string;
  registrarDate?: string;
  
  schoolSealImage?: string; // School seal image URL or data
  
  certificationText?: string; // Custom certification statement
}

/**
 * Amendment Record
 * Tracks corrections and updates to the permanent record
 */
export interface AmendmentRecord {
  amendmentDate: string;
  amendedBy: string; // User who made the change
  amendedByPosition?: string;
  approvedBy?: string; // Principal or authorized official
  approvalDate?: string;
  
  fieldAmended: string; // Which field was changed
  oldValue: string; // Previous value
  newValue: string; // New value
  reasonForAmendment: string;
  supportingDocuments?: string[]; // References to supporting documents
}

/**
 * Form 137 - Learner's Permanent Academic Record
 * ONE record per student containing ALL school years
 */
export interface AcademicHistory {
  id: string;
  studentId: string;
  lrn?: string; // Learner Reference Number
  studentName: string;
  birthDate?: string;
  birthPlace?: string;
  
  // Family Background (Complete)
  motherName?: string;
  motherOccupation?: string;
  fatherName?: string;
  fatherOccupation?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContactNumber?: string;
  parentGuardian?: string; // Legacy field for backward compatibility
  
  // Additional Student Info
  sex?: 'Male' | 'Female';
  age?: number;
  motherTongue?: string; // MTB-MLE requirement
  religion?: string;
  indigenousPeople?: string; // IP affiliation if applicable
  
  // Address Information
  completeAddress?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  
  // School information (can change if student transfers)
  currentSchoolName: string;
  currentSchoolId: string;
  
  // Transfer History
  transferHistory?: SchoolTransferRecord[];
  
  // Health Records
  healthRecords?: HealthRecord[];
  
  // Extracurricular Activities
  extracurricularActivities?: ExtracurricularActivity[];
  
  // Eligibility Information
  eligibility?: EligibilityRecord;
  
  // Certification/Verification
  certification?: CertificationRecord;
  
  // Document Verification
  documentReferenceNumber?: string; // Unique identifier for verification
  qrCodeData?: string; // QR code for digital verification
  
  // Amendment History
  amendments?: AmendmentRecord[];
  
  // Array of academic years - ONE entry per school year
  schoolYears: SchoolYearRecord[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * ONE school year entry in Form 137
 * This is what gets added each year
 */
export interface SchoolYearRecord {
  schoolYear: string; // Format: "2024-2025"
  gradeLevel: number; // 0 = Kinder, 1-12 = Grade levels
  section: string;
  adviserName: string;
  schoolName: string; // May differ if student transferred
  schoolId: string;
  
  // Senior High School specific (Grades 11-12)
  track?: 'Academic' | 'Technical-Vocational-Livelihood' | 'Sports' | 'Arts and Design';
  strand?: 'STEM' | 'ABM' | 'HUMSS' | 'GAS' | 'TVL' | 'Sports' | 'Arts';
  specializationSubject?: string; // For TVL strand
  
  // Quarterly grades per subject for THIS year
  grades: SubjectGrade[];
  
  // General average for THIS year
  generalAverage: number;
  
  // Attendance for THIS year
  daysOfSchool: number;
  daysPresent: number;
  
  // Promotion status for THIS year
  promotionStatus: 'Promoted' | 'Retained' | 'Conditional';
  remarks?: string;
  
  // Core values for THIS year
  coreValues?: CoreValuesRecord[];
  
  // When this year's data was added/updated
  recordedAt: string;
  recordedBy: string;
}

/**
 * Core values assessment for one school year
 */
export interface CoreValuesRecord {
  valueName: string; // e.g., "Maka-Diyos", "Makatao"
  rating: ObservedValue; // SO, AO, RO, NO
  quarter?: 1 | 2 | 3 | 4; // Optional: if tracked per quarter
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
  finalGrade: number; // Final average for the school year
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
