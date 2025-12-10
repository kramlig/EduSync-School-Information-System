/**
 * Division Types - TypeScript interfaces for Division-Level Access
 * 
 * These types support the Division-level access feature that enables
 * DepEd Division personnel to access aggregated data across multiple schools.
 * 
 * Hierarchy: Region → Division → District → School
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

// =====================================================
// DIVISION ENTITY
// =====================================================

/**
 * Division - Represents a DepEd Division Office
 * 
 * A Division is a geographic administrative unit that manages
 * multiple schools. It's headed by a Schools Division Superintendent (SDS).
 */
export interface Division {
  id: string;
  
  // Identification
  code: string;           // Unique code, e.g., "DIV-ZAMBOANGA-CITY"
  name: string;           // Full name, e.g., "Division of Zamboanga City"
  
  // Hierarchy
  region: string;         // e.g., "Region IX - Zamboanga Peninsula"
  region_code?: string;   // e.g., "REG-IX"
  
  // Contact Information
  address?: string;
  city?: string;
  province?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Leadership
  superintendent_name?: string;       // Schools Division Superintendent
  asst_superintendent_name?: string;
  
  // Configuration
  settings: DivisionSettings;
  
  // Status
  is_active: boolean;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Division Settings - Configurable options for a Division
 */
export interface DivisionSettings {
  // School Year Configuration
  schoolYearStart?: 'June' | 'August' | 'September';
  
  // Reporting
  reportingDeadlines?: {
    sf1_monthly?: number;     // Day of month for SF1
    sf2_monthly?: number;     // Day of month for SF2
    sf7_yearly?: string;      // Date for SF7 (e.g., "June-30")
  };
  
  // Enabled Modules (what division can access)
  enabledModules?: DivisionModule[];
  
  // Branding
  customBranding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  
  // Additional settings
  [key: string]: unknown;
}

/**
 * Available modules for division-level access
 * NOTE: Only implemented modules are included. Add more as features are built.
 */
export type DivisionModule = 
  | 'sf1_enrollment'       // School Form 1 - Enrollment
  | 'sf5_promotion'        // School Form 5 - Promotion
  | 'sf6_summary'          // School Form 6 - Enrollment Summary
  | 'sf7_personnel'        // School Form 7 - Personnel
  | 'reports_consolidated' // More Reports
  | 'school_management';   // School Management

// =====================================================
// DIVISION USER ENTITY
// =====================================================

/**
 * Division User Roles
 */
export type DivisionUserRole = 
  | 'division_admin'        // Full access to all division features
  | 'division_supervisor'   // Read access + can view reports
  | 'division_data_manager' // Can manage data consolidation
  | 'psds'                  // Public Schools District Supervisor
  | 'eps';                  // Education Program Supervisor

/**
 * Permission Actions
 */
export type PermissionAction = 'read' | 'write' | 'delete' | 'export' | 'generate';

/**
 * Module Permissions - Maps modules to allowed actions
 */
export interface ModulePermissions {
  schools?: PermissionAction[];
  personnel?: PermissionAction[];
  enrollment?: PermissionAction[];
  attendance?: PermissionAction[];
  grades?: PermissionAction[];
  reports?: PermissionAction[];
  settings?: PermissionAction[];
  users?: PermissionAction[];
}

/**
 * Division User - A user with division-level access
 * 
 * These are DepEd personnel who can view data across multiple schools
 * within their assigned division.
 */
export interface DivisionUser {
  id: string;
  
  // Links
  division_id: string;
  user_id?: string | null;    // Optional link to main users table
  
  // User Info
  firebase_uid?: string;
  email: string;
  name: string;
  
  // Role & Permissions
  role: DivisionUserRole;
  permissions: ModulePermissions;
  
  // District Assignment (for PSDS)
  assigned_district_id?: string | null;
  assigned_district_ids?: string[];
  
  // School-Level Access Restriction
  accessible_school_ids?: string[];  // Empty = all schools in division
  
  // Contact
  contact_phone?: string;
  position_title?: string;
  
  // Status
  is_active: boolean;
  last_login_at?: string | null;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Division User with expanded relations
 */
export interface DivisionUserExpanded extends DivisionUser {
  division?: Division;
  assigned_district?: District;
  schools?: SchoolSummary[];
}

// =====================================================
// DISTRICT ENTITY
// =====================================================

/**
 * District - A subdivision of a Division managed by a PSDS
 */
export interface District {
  id: string;
  
  // Links
  division_id: string;
  
  // Identification
  code: string;           // e.g., "DIST-ZC-WEST"
  name: string;           // e.g., "West District"
  
  // PSDS Info
  psds_name?: string;
  psds_contact?: string;
  
  // Geographic
  barangays?: string[];
  
  // Status
  is_active: boolean;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * District with expanded relations
 */
export interface DistrictExpanded extends District {
  division?: Division;
  schools?: SchoolSummary[];
  school_count?: number;
}

// =====================================================
// SUPPORTING TYPES
// =====================================================

/**
 * School Summary - Lightweight school info for listings
 */
export interface SchoolSummary {
  id: string;
  name: string;
  school_id_number?: string;
  district?: string;
  address?: string;
  principal_name?: string;
  student_count?: number;
  teacher_count?: number;
  school_type?: 'elementary' | 'high_school' | 'senior_high' | 'integrated' | string;
}

/**
 * Division Context Data - What's available in DivisionContext
 */
export interface DivisionContextData {
  // Current division user (null if not a division user)
  divisionUser: DivisionUser | null;
  
  // Current division (null if not a division user)
  division: Division | null;
  
  // Is the user logged in as a division user?
  isDivisionUser: boolean;
  
  // List of accessible schools
  accessibleSchools: SchoolSummary[];
  
  // List of unique districts from accessible schools
  availableDistricts: string[];
  
  // Currently selected district (for filtering)
  selectedDistrict: string | null;
  
  // Currently selected school (for filtering)
  selectedSchoolId: string | null;
  
  // Schools filtered by selected district
  filteredSchools: SchoolSummary[];
  
  // Currently selected school year (for filtering data)
  schoolYear: string;
  
  // Available school years to select from
  availableSchoolYears: string[];
  
  // Currently selected quarter (for filtering data)
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  
  // Currently selected school level (for filtering Elementary vs JHS vs SHS)
  schoolLevel: 'ALL' | 'ELEMENTARY' | 'JUNIOR HIGH SCHOOL' | 'SENIOR HIGH SCHOOL';
  
  // Loading state
  loading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  selectDistrict: (district: string | null) => void;
  selectSchool: (schoolId: string | null) => void;
  setSchoolYear: (schoolYear: string) => void;
  setQuarter: (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') => void;
  setSchoolLevel: (level: 'ALL' | 'ELEMENTARY' | 'JUNIOR HIGH SCHOOL' | 'SENIOR HIGH SCHOOL') => void;
  refreshSchools: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Permission helpers
  hasPermission: (module: keyof ModulePermissions, action: PermissionAction) => boolean;
  canAccessSchool: (schoolId: string) => boolean;
}

// =====================================================
// API/FORM TYPES
// =====================================================

/**
 * Create Division Input
 */
export interface CreateDivisionInput {
  code: string;
  name: string;
  region: string;
  region_code?: string;
  address?: string;
  city?: string;
  province?: string;
  contact_email?: string;
  contact_phone?: string;
  superintendent_name?: string;
  asst_superintendent_name?: string;
  settings?: Partial<DivisionSettings>;
}

/**
 * Update Division Input
 */
export interface UpdateDivisionInput extends Partial<CreateDivisionInput> {
  id: string;
  is_active?: boolean;
}

/**
 * Create Division User Input
 */
export interface CreateDivisionUserInput {
  division_id: string;
  email: string;
  name: string;
  role: DivisionUserRole;
  permissions?: ModulePermissions;
  assigned_district_id?: string;
  contact_phone?: string;
  position_title?: string;
}

/**
 * Update Division User Input
 */
export interface UpdateDivisionUserInput extends Partial<CreateDivisionUserInput> {
  id: string;
  is_active?: boolean;
}

/**
 * Create District Input
 */
export interface CreateDistrictInput {
  division_id: string;
  code: string;
  name: string;
  psds_name?: string;
  psds_contact?: string;
  barangays?: string[];
}

/**
 * Update District Input
 */
export interface UpdateDistrictInput extends Partial<CreateDistrictInput> {
  id: string;
  is_active?: boolean;
}

// =====================================================
// DEFAULT VALUES
// =====================================================

/**
 * Default permissions by role
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<DivisionUserRole, ModulePermissions> = {
  division_admin: {
    schools: ['read', 'write', 'delete'],
    personnel: ['read', 'write', 'export'],
    enrollment: ['read', 'write', 'export'],
    attendance: ['read', 'export'],
    grades: ['read', 'export'],
    reports: ['read', 'generate', 'export'],
    settings: ['read', 'write'],
    users: ['read', 'write', 'delete'],
  },
  division_supervisor: {
    schools: ['read'],
    personnel: ['read'],
    enrollment: ['read'],
    attendance: ['read'],
    grades: ['read'],
    reports: ['read', 'generate'],
    settings: [],
    users: [],
  },
  division_data_manager: {
    schools: ['read'],
    personnel: ['read', 'export'],
    enrollment: ['read', 'write', 'export'],
    attendance: ['read', 'export'],
    grades: ['read', 'export'],
    reports: ['read', 'generate', 'export'],
    settings: [],
    users: [],
  },
  psds: {
    schools: ['read'],
    personnel: ['read'],
    enrollment: ['read'],
    attendance: ['read'],
    grades: ['read'],
    reports: ['read'],
    settings: [],
    users: [],
  },
  eps: {
    schools: ['read'],
    personnel: ['read'],
    enrollment: ['read'],
    attendance: ['read'],
    grades: ['read'],
    reports: ['read'],
    settings: [],
    users: [],
  },
};

/**
 * Role display names
 */
export const DIVISION_ROLE_DISPLAY_NAMES: Record<DivisionUserRole, string> = {
  division_admin: 'Division Administrator',
  division_supervisor: 'Division Supervisor',
  division_data_manager: 'Data Manager',
  psds: 'Public Schools District Supervisor (PSDS)',
  eps: 'Education Program Supervisor (EPS)',
};

/**
 * Module display names
 */
export const MODULE_DISPLAY_NAMES: Record<keyof ModulePermissions, string> = {
  schools: 'School Management',
  personnel: 'Personnel (SF7)',
  enrollment: 'Enrollment (SF1/SF2)',
  attendance: 'Attendance',
  grades: 'Grades',
  reports: 'Reports',
  settings: 'Settings',
  users: 'User Management',
};
