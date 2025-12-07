/**
 * SF7: School Building and Facilities Inventory Types
 * 
 * Type definitions for facilities management, maintenance tracking,
 * and SF7 report generation.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type FacilityType = 
  | 'building'
  | 'classroom'
  | 'laboratory'
  | 'library'
  | 'office'
  | 'sports'
  | 'restroom'
  | 'cafeteria'
  | 'auditorium'
  | 'other';

export type FacilityCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'needs_repair'
  | 'condemned';

export type FacilityStatus = 
  | 'operational'
  | 'under_repair'
  | 'under_construction'
  | 'closed'
  | 'demolished';

export type MaintenanceType = 
  | 'routine'
  | 'repair'
  | 'emergency'
  | 'inspection'
  | 'renovation';

export type MaintenanceStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type MaintenancePriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export type ConstructionType = 
  | 'concrete'
  | 'wood'
  | 'mixed'
  | 'steel'
  | 'other';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Facility {
  id: string;
  school_id: string;
  
  // Basic Information
  name: string;
  facility_type: FacilityType;
  building_name?: string;
  floor_number?: number;
  room_number?: string;
  
  // Capacity & Dimensions
  capacity?: number;
  area_sqm?: number;
  
  // Condition & Status
  condition: FacilityCondition;
  status: FacilityStatus;
  
  // Equipment & Amenities
  equipment: string[]; // ['chairs (40)', 'tables (20)', 'whiteboard (1)']
  amenities: string[]; // ['AC', 'projector', 'wifi', 'speakers']
  
  // Usage & Assignment
  primary_use?: string;
  assigned_to?: string; // Teacher ID or department name
  
  // Maintenance & Inspection
  last_inspection_date?: string;
  next_inspection_date?: string;
  last_maintenance_date?: string;
  maintenance_notes?: string;
  
  // Construction Details
  year_constructed?: number;
  year_renovated?: number;
  construction_type?: ConstructionType;
  
  // Safety & Compliance
  fire_exit_access: boolean;
  accessibility_features: string[]; // ['ramp', 'elevator', 'wheelchair_accessible']
  safety_hazards?: string;
  
  // Financial
  acquisition_cost?: number;
  estimated_value?: number;
  
  // Additional Info
  remarks?: string;
  photos: string[]; // URLs to photos
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface FacilityMaintenanceLog {
  id: string;
  facility_id: string;
  school_id: string;
  
  // Maintenance Details
  maintenance_type: MaintenanceType;
  description: string;
  issue_reported?: string;
  
  // Dates
  reported_date: string;
  scheduled_date?: string;
  completed_date?: string;
  
  // Cost & Personnel
  cost?: number;
  vendor?: string;
  performed_by?: string;
  
  // Status
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  
  // Attachments
  photos: string[];
  documents: string[];
  
  remarks?: string;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ============================================================================
// EXTENDED INTERFACES (with joins)
// ============================================================================

export interface FacilityWithMaintenanceCounts extends Facility {
  maintenance_count: number;
  pending_maintenance: number;
  last_maintenance?: FacilityMaintenanceLog;
}

// ============================================================================
// INPUT TYPES (for create/update operations)
// ============================================================================

export interface CreateFacilityInput {
  school_id: string;
  name: string;
  facility_type: FacilityType;
  building_name?: string;
  floor_number?: number;
  room_number?: string;
  capacity?: number;
  area_sqm?: number;
  condition: FacilityCondition;
  status: FacilityStatus;
  equipment?: string[];
  amenities?: string[];
  primary_use?: string;
  assigned_to?: string;
  last_inspection_date?: string;
  next_inspection_date?: string;
  year_constructed?: number;
  year_renovated?: number;
  construction_type?: ConstructionType;
  fire_exit_access?: boolean;
  accessibility_features?: string[];
  safety_hazards?: string;
  acquisition_cost?: number;
  estimated_value?: number;
  remarks?: string;
  photos?: string[];
}

export interface UpdateFacilityInput extends Partial<CreateFacilityInput> {
  id: string;
}

export interface CreateMaintenanceLogInput {
  facility_id: string;
  school_id: string;
  maintenance_type: MaintenanceType;
  description: string;
  issue_reported?: string;
  reported_date: string;
  scheduled_date?: string;
  cost?: number;
  vendor?: string;
  performed_by?: string;
  priority?: MaintenancePriority;
  remarks?: string;
}

export interface UpdateMaintenanceLogInput extends Partial<CreateMaintenanceLogInput> {
  id: string;
  completed_date?: string;
  status?: MaintenanceStatus;
}

// ============================================================================
// QUERY/FILTER TYPES
// ============================================================================

export interface SF7Filter {
  school_id: string;
  facility_type?: FacilityType;
  condition?: FacilityCondition;
  status?: FacilityStatus;
  building_name?: string;
  assigned_to?: string;
  search?: string; // Search by name, room number, primary use
}

export interface MaintenanceFilter {
  school_id: string;
  facility_id?: string;
  maintenance_type?: MaintenanceType;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// SUMMARY/STATISTICS TYPES
// ============================================================================

export interface SF7Summary {
  total_facilities: number;
  total_classrooms: number;
  total_laboratories: number;
  total_capacity: number;
  total_area_sqm: number;
  total_value: number;
  
  // By Condition
  by_condition: {
    condition: FacilityCondition;
    count: number;
    percentage: number;
  }[];
  
  // By Type
  by_type: {
    type: FacilityType;
    count: number;
    total_capacity: number;
    total_area: number;
  }[];
  
  // By Status
  by_status: {
    status: FacilityStatus;
    count: number;
  }[];
  
  // Maintenance Statistics
  maintenance_stats: {
    total_maintenance: number;
    pending: number;
    in_progress: number;
    completed: number;
    total_cost: number;
  };
  
  // Safety & Compliance
  safety_stats: {
    with_fire_exit: number;
    accessible_facilities: number;
    with_hazards: number;
  };
}

export interface FacilityConditionReport {
  facility_type: FacilityType;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  needs_repair: number;
  condemned: number;
  total: number;
}

// ============================================================================
// PDF GENERATION TYPES
// ============================================================================

export interface SF7PDFOptions {
  schoolInfo: {
    name: string;
    schoolId: string;
    division: string;
    region: string;
    district?: string;
  };
  reportDate: string;
  filters?: {
    facility_type?: string;
    condition?: string;
    status?: string;
  };
  facilities: Facility[];
  summary: SF7Summary;
  preparedBy: string;
  certifiedBy?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface FacilityUtilization {
  facility_id: string;
  facility_name: string;
  capacity: number;
  current_occupancy: number;
  utilization_rate: number; // percentage
}

export interface MaintenanceCostAnalysis {
  facility_id: string;
  facility_name: string;
  total_maintenance_cost: number;
  routine_cost: number;
  repair_cost: number;
  emergency_cost: number;
  last_12_months_cost: number;
}
