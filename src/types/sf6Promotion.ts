/**
 * SF6 - Summarized Report on Promotion and Level of Proficiency
 * Official DepEd Form Types
 * 
 * This is the CORRECT SF6 form as per official DepEd documentation.
 * It summarizes promotion status and proficiency levels by end of semester/school year.
 */

export type PromotionStatus = 'promoted' | 'retained' | 'incomplete';
export type ProficiencyLevel = 'advanced' | 'proficient' | 'approaching_proficiency' | 'developing' | 'beginning';

/**
 * SF6 Summary by Grade Level
 */
export interface SF6GradeSummary {
  grade_level: number;
  section_name?: string;
  
  // Total learners
  total_learners: number;
  male_count: number;
  female_count: number;
  
  // Promotion Status
  promoted: number;
  retained: number;
  incomplete: number;
  
  // Proficiency Levels (ES/JHS)
  advanced?: number;
  proficient?: number;
  approaching_proficiency?: number;
  developing?: number;
  beginning?: number;
  
  // Promotion Rate
  promotion_rate: number;
}

/**
 * SF6 Summary by Section
 */
export interface SF6SectionSummary extends SF6GradeSummary {
  section_id: string;
  section_name: string;
  adviser_name?: string;
}

/**
 * Overall SF6 Summary for School
 */
export interface SF6SchoolSummary {
  school_id: string;
  school_year: string;
  grading_period: string; // 'final' or 'sem1'/'sem2' for SHS
  
  // Overall totals
  total_learners: number;
  total_male: number;
  total_female: number;
  
  // Overall promotion
  total_promoted: number;
  total_retained: number;
  total_incomplete: number;
  overall_promotion_rate: number;
  
  // Overall proficiency
  total_advanced?: number;
  total_proficient?: number;
  total_approaching_proficiency?: number;
  total_developing?: number;
  total_beginning?: number;
  
  // Breakdown by grade
  by_grade: SF6GradeSummary[];
  
  // Breakdown by section
  by_section: SF6SectionSummary[];
}

/**
 * Filter options for SF6 queries
 */
export interface SF6Filter {
  school_id: string;
  school_year: string;
  grading_period?: string; // 'final', 'sem1', 'sem2'
  grade_level?: number;
  section_id?: string;
}

/**
 * PDF generation options for SF6
 */
export interface SF6PDFOptions {
  school_id: string;
  school_name: string;
  school_year: string;
  grading_period: string;
  region?: string;
  division?: string;
  district?: string;
  summary: SF6SchoolSummary;
  principal_name?: string;
  registrar_name?: string;
}
