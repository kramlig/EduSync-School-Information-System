/**
 * DepEd Forms: SF5 & SF5-K Type Definitions
 * Promotion and Proficiency Records
 * 
 * IMPORTANT: These types match the PostgreSQL schema exactly.
 * Do not modify without updating the database schema.
 */

/**
 * Kindergarten proficiency development levels (SF5-K)
 * Based on DepEd K to 12 Kindergarten Curriculum Guide
 */
export type ProficiencyLevel = 'developing' | 'emerging' | 'advancing';

/**
 * Promotion status for all students
 */
export type PromotionStatus = 'promoted' | 'retained' | 'pending' | 'graduated' | 'transferred';

/**
 * Grading periods
 */
export type GradingPeriod = '1st_quarter' | '2nd_quarter' | '3rd_quarter' | '4th_quarter' | 'final';

/**
 * Main promotion record interface
 * Used for both SF5 (ES/JHS/SHS) and SF5-K (Kindergarten)
 */
export interface PromotionRecord {
  id: string;
  school_id: string;
  
  // References
  student_id: string;
  section_id: string | null;
  
  // Period
  school_year: string;
  grading_period: GradingPeriod | null;
  
  // Grade Level
  current_grade_level: number;
  
  // Proficiency Levels (SF5-K - Kindergarten only)
  socio_emotional_dev: ProficiencyLevel | null;
  physical_motor_dev: ProficiencyLevel | null;
  cognitive_dev: ProficiencyLevel | null;
  language_literacy_dev: ProficiencyLevel | null;
  
  // General Average (SF5 - ES/JHS/SHS only)
  general_average: number | null;
  
  // Promotion Decision
  promotion_status: PromotionStatus;
  
  // Next Grade/Section (if promoted)
  next_grade_level: number | null;
  next_section_id: string | null;
  
  // Remarks
  remarks: string | null;
  attendance_days_present: number | null;
  attendance_days_absent: number | null;
  
  // Recorded By
  recorded_by: string | null;
  approved_by: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Kindergarten proficiency domains (SF5-K specific)
 */
export interface KindergartenProficiency {
  socio_emotional_dev: ProficiencyLevel;
  physical_motor_dev: ProficiencyLevel;
  cognitive_dev: ProficiencyLevel;
  language_literacy_dev: ProficiencyLevel;
}

/**
 * Request to create a promotion record
 */
export interface CreatePromotionRecordRequest {
  school_id: string;
  student_id: string;
  section_id?: string;
  school_year: string;
  grading_period: GradingPeriod;
  current_grade_level: number;
  
  // For Kindergarten (SF5-K)
  proficiency?: KindergartenProficiency;
  
  // For ES/JHS/SHS (SF5)
  general_average?: number;
  
  promotion_status: PromotionStatus;
  next_grade_level?: number;
  next_section_id?: string;
  remarks?: string;
  attendance_days_present?: number;
  attendance_days_absent?: number;
  recorded_by?: string;
  approved_by?: string;
}

/**
 * Promotion record with joined student data
 */
export interface PromotionRecordWithStudent extends PromotionRecord {
  student: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    lrn: string;
    gender: string;
  };
  section: {
    id: string;
    name: string;
    grade_level: number;
  } | null;
}

/**
 * Summary statistics for SF6 (Promotion Summary Report)
 */
export interface PromotionSummary {
  school_year: string;
  grade_level: number;
  total_students: number;
  promoted: number;
  retained: number;
  pending: number;
  graduated: number;
  transferred: number;
  promotion_rate: number; // Percentage
  retention_rate: number; // Percentage
}

/**
 * Auto-generation request from grades
 */
export interface GeneratePromotionRecordsRequest {
  school_id: string;
  school_year: string;
  grade_level?: number;
  section_id?: string;
  grading_period: GradingPeriod;
}

/**
 * Auto-generation result
 */
export interface GeneratePromotionRecordsResult {
  success: boolean;
  records_created: number;
  records_updated: number;
  errors: Array<{
    student_id: string;
    student_name: string;
    error: string;
  }>;
}

/**
 * SF5 PDF generation request
 */
export interface GenerateSF5PDFRequest {
  school_id: string;
  school_year: string;
  grade_level: number;
  section_id?: string;
  include_pending?: boolean;
}

/**
 * SF5-K PDF generation request
 */
export interface GenerateSF5KPDFRequest {
  school_id: string;
  school_year: string;
  section_id?: string;
}

/**
 * Filter options for promotion records list
 */
export interface PromotionRecordsFilter {
  school_id: string;
  school_year: string;
  grade_level?: number;
  section_id?: string;
  promotion_status?: PromotionStatus;
  grading_period?: GradingPeriod;
}
