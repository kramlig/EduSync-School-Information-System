/**
 * SF4 - Monthly Learner Movement & Attendance Report Types
 * Official DepEd Form for tracking student enrollment changes
 */

export type MovementType = 
  | 'enrolled'
  | 'transferred_in'
  | 'transferred_out'
  | 'dropped'
  | 'promoted'
  | 'retained'
  | 'graduated'
  | 'completed';

export interface StudentMovement {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  lrn?: string;
  grade_level: number;
  section_id?: string;
  section_name?: string;
  
  movement_type: MovementType;
  movement_date: string; // ISO date string
  school_year: string;
  month: string; // Format: 'YYYY-MM'
  
  previous_school?: string;
  destination_school?: string;
  reason?: string;
  remarks?: string;
  
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyEnrollmentSnapshot {
  id: string;
  school_id: string;
  school_year: string;
  month: string; // Format: 'YYYY-MM'
  grade_level: number;
  section_id?: string;
  section_name?: string;
  
  beginning_enrollment: number;
  transferred_in: number;
  transferred_out: number;
  dropped: number;
  ending_enrollment: number;
  
  total_school_days: number;
  total_absences: number;
  attendance_rate: number;
  
  snapshot_date: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SF4Filter {
  school_id: string;
  school_year: string;
  month: string; // Format: 'YYYY-MM'
  grade_level?: number;
  section_id?: string;
  movement_type?: MovementType;
}

export interface SF4Summary {
  school_id: string;
  school_year: string;
  month: string;
  
  total_beginning_enrollment: number;
  total_transferred_in: number;
  total_transferred_out: number;
  total_dropped: number;
  total_ending_enrollment: number;
  
  by_grade_level: {
    grade_level: number;
    beginning_enrollment: number;
    transferred_in: number;
    transferred_out: number;
    dropped: number;
    ending_enrollment: number;
  }[];
  
  by_gender: {
    male: {
      beginning: number;
      transferred_in: number;
      transferred_out: number;
      dropped: number;
      ending: number;
    };
    female: {
      beginning: number;
      transferred_in: number;
      transferred_out: number;
      dropped: number;
      ending: number;
    };
  };
  
  attendance_summary: {
    total_school_days: number;
    total_absences: number;
    average_attendance_rate: number;
  };
}

export interface CreateMovementRequest {
  school_id: string;
  student_id: string;
  movement_type: MovementType;
  movement_date: string;
  school_year: string;
  previous_school?: string;
  destination_school?: string;
  reason?: string;
  remarks?: string;
}

export interface GenerateMonthlySnapshotRequest {
  school_id: string;
  school_year: string;
  month: string; // Format: 'YYYY-MM'
  grade_level?: number; // If omitted, generates for all grades
}

export interface SF4PDFOptions {
  schoolInfo: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
    district: string;
  };
  schoolYear: string;
  month: string; // Format: 'YYYY-MM' or 'Month YYYY' display
  gradeLevel?: number;
  section?: {
    id: string;
    name: string;
    grade_level: number;
  };
  snapshot: MonthlyEnrollmentSnapshot | null;
  movements: StudentMovement[];
  summary: SF4Summary;
  preparedBy: string;
}
