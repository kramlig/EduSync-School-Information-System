/**
 * SuperAdmin Module Types
 */

export type SuperAdminTab = 'schools' | 'divisions' | 'users' | 'system';

export interface School {
  id: string;
  name: string;
  code?: string;
  school_id_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  principal_name?: string;
  status: 'active' | 'inactive';
  division_id?: string | null;
  division_name?: string;
  region?: string;
  district?: string;
  current_school_year?: string;
  created_at: string;
  updated_at?: string;
  // Computed
  student_count?: number;
  teacher_count?: number;
  admin_email?: string;
  has_admin?: boolean;
}

export interface Division {
  id: string;
  name: string;
  code?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  superintendent_name?: string;
  is_active: boolean;
  created_at: string;
  // Computed
  school_count?: number;
  user_count?: number;
}

export interface CreateSchoolInput {
  name: string;
  code?: string;
  school_id_number?: string;
  school_type?: 'elementary' | 'high_school' | 'senior_high' | 'integrated';
  address?: string;
  phone?: string;
  email?: string;
  principal_name?: string;
  division_id?: string;
  region?: string;
  district?: string;
  current_school_year?: string;
  // Admin account (optional)
  admin_email?: string;
  admin_password?: string;
}

export interface CreateDivisionInput {
  name: string;
  code?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  superintendent_name?: string;
  // Admin account (optional)
  admin_email?: string;
  admin_password?: string;
  admin_name?: string;
}

export interface CreateUserInput {
  target_type: 'school' | 'division';
  target_id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  // Additional data based on role
  additional_data?: Record<string, any>;
}

export interface SchoolAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
  school_id: string;
}

export interface DivisionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  division_id: string;
}

// Stats
export interface PlatformStats {
  total_schools: number;
  total_divisions: number;
  total_students: number;
  total_teachers: number;
  active_schools: number;
}
