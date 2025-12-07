/**
 * SF7 - School Personnel Assignment List and Basic Profile
 * Official DepEd Form Types
 * 
 * This is the CORRECT SF7 as per official DepEd documentation.
 * Tracks school personnel profiles, teaching assignments, and ancillary responsibilities.
 */

export type EmploymentStatus = 'permanent' | 'temporary' | 'substitute' | 'contract' | 'volunteer';
export type PositionType = 'teacher_i' | 'teacher_ii' | 'teacher_iii' | 'master_teacher_i' | 'master_teacher_ii' | 
                           'principal_i' | 'principal_ii' | 'principal_iii' | 'principal_iv' |
                           'head_teacher_i' | 'head_teacher_ii' | 'head_teacher_iii' |
                           'other';

/**
 * Teaching assignment for a specific subject/grade
 */
export interface TeachingAssignment {
  id: string;
  teacher_id: string;
  school_id: string;
  school_year: string;
  grade_level: number;
  section_id?: string;
  section_name?: string;
  subject: string;
  hours_per_week: number;
  is_advisory: boolean; // Class adviser
  created_at: string;
  updated_at: string;
}

/**
 * Ancillary/additional responsibilities
 */
export interface AncillaryResponsibility {
  id: string;
  teacher_id: string;
  school_id: string;
  school_year: string;
  responsibility: string; // e.g., "Literacy Coordinator", "Subject Area Coordinator"
  description?: string;
  hours_per_week?: number;
  created_at: string;
  updated_at: string;
}

/**
 * SF7 Personnel record (extends teacher data)
 */
export interface SF7PersonnelRecord {
  // Basic info (from teachers table)
  id: string;
  employee_number?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  sex?: 'M' | 'F'; // Gender for official form
  
  // Position info
  position: PositionType;
  employment_status: EmploymentStatus;
  date_hired?: string;
  
  // Educational background
  highest_education?: string; // "bachelors", "masters", "doctorate"
  major_specialization?: string;
  specialization?: string; // Main subject area
  
  // Professional info
  prc_license_number?: string;
  prc_license_expiry?: string;
  
  // Current assignments
  teaching_assignments: TeachingAssignment[];
  ancillary_responsibilities: AncillaryResponsibility[];
  
  // Computed
  total_teaching_hours: number;
  advisory_section?: string;
}

/**
 * SF7 Summary statistics
 */
export interface SF7Summary {
  school_id: string;
  school_year: string;
  
  // Personnel counts
  total_personnel: number;
  by_position: Record<PositionType, number>;
  by_employment_status: Record<EmploymentStatus, number>;
  
  // Teaching load
  total_teaching_hours: number;
  average_teaching_load: number;
  
  // Qualifications
  with_masters: number;
  with_doctorate: number;
  with_prc_license: number;
}

/**
 * Filter options for SF7 queries
 */
export interface SF7Filter {
  school_id: string;
  school_year: string;
  position?: PositionType;
  employment_status?: EmploymentStatus;
  grade_level?: number;
  search?: string; // name, employee number
}

/**
 * Input for creating teaching assignment
 */
export interface CreateTeachingAssignmentInput {
  teacher_id: string;
  school_id: string;
  school_year: string;
  grade_level: number;
  section_id?: string;
  subject: string;
  hours_per_week: number;
  is_advisory: boolean;
}

/**
 * Input for creating ancillary responsibility
 */
export interface CreateAncillaryResponsibilityInput {
  teacher_id: string;
  school_id: string;
  school_year: string;
  responsibility: string;
  description?: string;
  hours_per_week?: number;
}

/**
 * PDF generation options for SF7
 */
export interface SF7PDFOptions {
  school_id: string;
  school_id_number?: string; // DepEd School ID (e.g., 123456)
  school_name: string;
  school_year: string;
  region?: string;
  division?: string;
  district?: string;
  personnel: SF7PersonnelRecord[];
  summary: SF7Summary;
  principal_name?: string;
}
