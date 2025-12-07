/**
 * SF7: Facilities Management Service
 * 
 * Handles all database operations for school buildings, rooms, facilities,
 * and maintenance tracking.
 */

import { supabase } from '../lib/supabase';
import type {
  Facility,
  FacilityMaintenanceLog,
  FacilityWithMaintenanceCounts,
  CreateFacilityInput,
  UpdateFacilityInput,
  CreateMaintenanceLogInput,
  UpdateMaintenanceLogInput,
  SF7Filter,
  MaintenanceFilter,
  SF7Summary,
  FacilityConditionReport,
  FacilityCondition,
  FacilityType,
  FacilityStatus,
} from '../types/facilities';

// ============================================================================
// FACILITY CRUD OPERATIONS
// ============================================================================

/**
 * Get facilities with optional filtering
 */
export async function getFacilities(filter: SF7Filter): Promise<Facility[]> {
  let query = supabase
    .from('facilities')
    .select('*')
    .eq('school_id', filter.school_id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (filter.facility_type) {
    query = query.eq('facility_type', filter.facility_type);
  }

  if (filter.condition) {
    query = query.eq('condition', filter.condition);
  }

  if (filter.status) {
    query = query.eq('status', filter.status);
  }

  if (filter.building_name) {
    query = query.eq('building_name', filter.building_name);
  }

  if (filter.assigned_to) {
    query = query.eq('assigned_to', filter.assigned_to);
  }

  if (filter.search) {
    query = query.or(
      `name.ilike.%${filter.search}%,` +
      `room_number.ilike.%${filter.search}%,` +
      `primary_use.ilike.%${filter.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Facilities] Error fetching facilities:', error);
    throw new Error(`Failed to fetch facilities: ${error.message}`);
  }

  return data || [];
}

/**
 * Get facilities with maintenance counts
 */
export async function getFacilitiesWithMaintenanceCounts(
  filter: SF7Filter
): Promise<FacilityWithMaintenanceCounts[]> {
  const facilities = await getFacilities(filter);

  // Get maintenance counts for each facility
  const facilitiesWithCounts = await Promise.all(
    facilities.map(async (facility) => {
      const { count: totalCount } = await supabase
        .from('facility_maintenance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', facility.id)
        .is('deleted_at', null);

      const { count: pendingCount } = await supabase
        .from('facility_maintenance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', facility.id)
        .eq('status', 'pending')
        .is('deleted_at', null);

      const { data: lastMaintenanceData } = await supabase
        .from('facility_maintenance_logs')
        .select('*')
        .eq('facility_id', facility.id)
        .is('deleted_at', null)
        .order('completed_date', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      return {
        ...facility,
        maintenance_count: totalCount || 0,
        pending_maintenance: pendingCount || 0,
        last_maintenance: lastMaintenanceData || undefined,
      };
    })
  );

  return facilitiesWithCounts;
}

/**
 * Get single facility by ID
 */
export async function getFacilityById(id: string): Promise<Facility | null> {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('[Facilities] Error fetching facility:', error);
    return null;
  }

  return data;
}

/**
 * Create new facility
 */
export async function createFacility(input: CreateFacilityInput): Promise<Facility> {
  const { data, error } = await supabase
    .from('facilities')
    .insert({
      ...input,
      equipment: input.equipment || [],
      amenities: input.amenities || [],
      accessibility_features: input.accessibility_features || [],
      photos: input.photos || [],
      fire_exit_access: input.fire_exit_access ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Facilities] Error creating facility:', error);
    throw new Error(`Failed to create facility: ${error.message}`);
  }

  return data;
}

/**
 * Update facility
 */
export async function updateFacility(input: UpdateFacilityInput): Promise<Facility> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('facilities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Facilities] Error updating facility:', error);
    throw new Error(`Failed to update facility: ${error.message}`);
  }

  return data;
}

/**
 * Delete facility (soft delete)
 */
export async function deleteFacility(id: string): Promise<void> {
  const { error } = await supabase
    .from('facilities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[Facilities] Error deleting facility:', error);
    throw new Error(`Failed to delete facility: ${error.message}`);
  }
}

// ============================================================================
// MAINTENANCE LOG OPERATIONS
// ============================================================================

/**
 * Get maintenance logs with optional filtering
 */
export async function getMaintenanceLogs(filter: MaintenanceFilter): Promise<FacilityMaintenanceLog[]> {
  let query = supabase
    .from('facility_maintenance_logs')
    .select('*')
    .eq('school_id', filter.school_id)
    .is('deleted_at', null)
    .order('reported_date', { ascending: false });

  if (filter.facility_id) {
    query = query.eq('facility_id', filter.facility_id);
  }

  if (filter.maintenance_type) {
    query = query.eq('maintenance_type', filter.maintenance_type);
  }

  if (filter.status) {
    query = query.eq('status', filter.status);
  }

  if (filter.priority) {
    query = query.eq('priority', filter.priority);
  }

  if (filter.date_from) {
    query = query.gte('reported_date', filter.date_from);
  }

  if (filter.date_to) {
    query = query.lte('reported_date', filter.date_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Facilities] Error fetching maintenance logs:', error);
    throw new Error(`Failed to fetch maintenance logs: ${error.message}`);
  }

  return data || [];
}

/**
 * Create maintenance log
 */
export async function createMaintenanceLog(
  input: CreateMaintenanceLogInput
): Promise<FacilityMaintenanceLog> {
  const { data, error } = await supabase
    .from('facility_maintenance_logs')
    .insert({
      ...input,
      status: 'pending',
      priority: input.priority || 'normal',
      photos: [],
      documents: [],
    })
    .select()
    .single();

  if (error) {
    console.error('[Facilities] Error creating maintenance log:', error);
    throw new Error(`Failed to create maintenance log: ${error.message}`);
  }

  return data;
}

/**
 * Update maintenance log
 */
export async function updateMaintenanceLog(
  input: UpdateMaintenanceLogInput
): Promise<FacilityMaintenanceLog> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('facility_maintenance_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Facilities] Error updating maintenance log:', error);
    throw new Error(`Failed to update maintenance log: ${error.message}`);
  }

  return data;
}

/**
 * Complete maintenance log
 */
export async function completeMaintenanceLog(
  id: string,
  completedDate: string,
  cost?: number
): Promise<FacilityMaintenanceLog> {
  const updates: Partial<FacilityMaintenanceLog> = {
    status: 'completed',
    completed_date: completedDate,
  };

  if (cost !== undefined) {
    updates.cost = cost;
  }

  const { data, error } = await supabase
    .from('facility_maintenance_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Facilities] Error completing maintenance log:', error);
    throw new Error(`Failed to complete maintenance log: ${error.message}`);
  }

  // Update facility's last_maintenance_date
  if (data) {
    await supabase
      .from('facilities')
      .update({ last_maintenance_date: completedDate })
      .eq('id', data.facility_id);
  }

  return data;
}

// ============================================================================
// SUMMARY & STATISTICS
// ============================================================================

/**
 * Get SF7 summary statistics
 */
export async function getSF7Summary(schoolId: string): Promise<SF7Summary> {
  const facilities = await getFacilities({ school_id: schoolId });

  // Basic totals
  const totalFacilities = facilities.length;
  const totalClassrooms = facilities.filter(f => f.facility_type === 'classroom').length;
  const totalLaboratories = facilities.filter(f => f.facility_type === 'laboratory').length;
  const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);
  const totalAreaSqm = facilities.reduce((sum, f) => sum + (f.area_sqm || 0), 0);
  const totalValue = facilities.reduce((sum, f) => sum + (f.estimated_value || f.acquisition_cost || 0), 0);

  // By condition
  const conditionCounts = new Map<FacilityCondition, number>();
  facilities.forEach(f => {
    conditionCounts.set(f.condition, (conditionCounts.get(f.condition) || 0) + 1);
  });

  const byCondition = Array.from(conditionCounts.entries()).map(([condition, count]) => ({
    condition,
    count,
    percentage: (count / totalFacilities) * 100,
  }));

  // By type
  const typeCounts = new Map<FacilityType, { count: number; capacity: number; area: number }>();
  facilities.forEach(f => {
    const existing = typeCounts.get(f.facility_type) || { count: 0, capacity: 0, area: 0 };
    typeCounts.set(f.facility_type, {
      count: existing.count + 1,
      capacity: existing.capacity + (f.capacity || 0),
      area: existing.area + (f.area_sqm || 0),
    });
  });

  const byType = Array.from(typeCounts.entries()).map(([type, stats]) => ({
    type,
    count: stats.count,
    total_capacity: stats.capacity,
    total_area: stats.area,
  }));

  // By status
  const statusCounts = new Map<FacilityStatus, number>();
  facilities.forEach(f => {
    statusCounts.set(f.status, (statusCounts.get(f.status) || 0) + 1);
  });

  const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Maintenance statistics
  const { data: maintenanceLogs } = await supabase
    .from('facility_maintenance_logs')
    .select('*')
    .eq('school_id', schoolId)
    .is('deleted_at', null);

  const logs = maintenanceLogs || [];
  const maintenanceStats = {
    total_maintenance: logs.length,
    pending: logs.filter(l => l.status === 'pending').length,
    in_progress: logs.filter(l => l.status === 'in_progress').length,
    completed: logs.filter(l => l.status === 'completed').length,
    total_cost: logs.reduce((sum, l) => sum + (l.cost || 0), 0),
  };

  // Safety statistics
  const safetyStats = {
    with_fire_exit: facilities.filter(f => f.fire_exit_access).length,
    accessible_facilities: facilities.filter(f => f.accessibility_features.length > 0).length,
    with_hazards: facilities.filter(f => f.safety_hazards && f.safety_hazards.trim().length > 0).length,
  };

  return {
    total_facilities: totalFacilities,
    total_classrooms: totalClassrooms,
    total_laboratories: totalLaboratories,
    total_capacity: totalCapacity,
    total_area_sqm: totalAreaSqm,
    total_value: totalValue,
    by_condition: byCondition,
    by_type: byType,
    by_status: byStatus,
    maintenance_stats: maintenanceStats,
    safety_stats: safetyStats,
  };
}

/**
 * Get facility condition report by type
 */
export async function getFacilityConditionReport(schoolId: string): Promise<FacilityConditionReport[]> {
  const facilities = await getFacilities({ school_id: schoolId });

  const reportMap = new Map<FacilityType, FacilityConditionReport>();

  facilities.forEach(facility => {
    if (!reportMap.has(facility.facility_type)) {
      reportMap.set(facility.facility_type, {
        facility_type: facility.facility_type,
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        needs_repair: 0,
        condemned: 0,
        total: 0,
      });
    }

    const report = reportMap.get(facility.facility_type)!;
    report.total++;

    switch (facility.condition) {
      case 'excellent':
        report.excellent++;
        break;
      case 'good':
        report.good++;
        break;
      case 'fair':
        report.fair++;
        break;
      case 'poor':
        report.poor++;
        break;
      case 'needs_repair':
        report.needs_repair++;
        break;
      case 'condemned':
        report.condemned++;
        break;
    }
  });

  return Array.from(reportMap.values());
}

/**
 * Get unique building names for filtering
 */
export async function getBuildingNames(schoolId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('facilities')
    .select('building_name')
    .eq('school_id', schoolId)
    .not('building_name', 'is', null)
    .is('deleted_at', null);

  if (error) {
    console.error('[Facilities] Error fetching building names:', error);
    return [];
  }

  const uniqueNames = [...new Set(data.map(f => f.building_name).filter(Boolean))] as string[];
  return uniqueNames.sort();
}
