/**
 * Division Service - Supabase operations for Division-Level Access
 * 
 * This service provides CRUD operations for divisions, division users,
 * and districts. It's used by the DivisionContext and division management
 * components.
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 * @see src/types/division.ts
 */

import { supabase } from '../lib/supabase';
import type {
  Division,
  DivisionUser,
  DivisionUserExpanded,
  District,
  DistrictExpanded,
  SchoolSummary,
  CreateDivisionInput,
  UpdateDivisionInput,
  CreateDivisionUserInput,
  UpdateDivisionUserInput,
  CreateDistrictInput,
  UpdateDistrictInput,
} from '../types/division';
import { DEFAULT_PERMISSIONS_BY_ROLE } from '../types/division';

// =====================================================
// DIVISION OPERATIONS
// =====================================================

/**
 * Get all active divisions
 */
export const getDivisions = async (): Promise<Division[]> => {
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('[DivisionService] Error fetching divisions:', error);
    throw new Error(`Failed to fetch divisions: ${error.message}`);
  }

  return data || [];
};

/**
 * Get division by ID
 */
export const getDivisionById = async (id: string): Promise<Division | null> => {
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DivisionService] Error fetching division:', error);
    throw new Error(`Failed to fetch division: ${error.message}`);
  }

  return data;
};

/**
 * Get division by code
 */
export const getDivisionByCode = async (code: string): Promise<Division | null> => {
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .eq('code', code)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DivisionService] Error fetching division by code:', error);
    throw new Error(`Failed to fetch division: ${error.message}`);
  }

  return data;
};

/**
 * Create a new division
 */
export const createDivision = async (input: CreateDivisionInput): Promise<Division> => {
  const { data, error } = await supabase
    .from('divisions')
    .insert({
      ...input,
      settings: input.settings || {},
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[DivisionService] Error creating division:', error);
    throw new Error(`Failed to create division: ${error.message}`);
  }

  return data;
};

/**
 * Update a division
 */
export const updateDivision = async (input: UpdateDivisionInput): Promise<Division> => {
  const { id, ...updateData } = input;

  const { data, error } = await supabase
    .from('divisions')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DivisionService] Error updating division:', error);
    throw new Error(`Failed to update division: ${error.message}`);
  }

  return data;
};

/**
 * Soft delete a division
 */
export const deleteDivision = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('divisions')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', id);

  if (error) {
    console.error('[DivisionService] Error deleting division:', error);
    throw new Error(`Failed to delete division: ${error.message}`);
  }
};

// =====================================================
// DIVISION USER OPERATIONS
// =====================================================

/**
 * Get all users in a division
 */
export const getDivisionUsers = async (divisionId: string): Promise<DivisionUser[]> => {
  const { data, error } = await supabase
    .from('division_users')
    .select('*')
    .eq('division_id', divisionId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('[DivisionService] Error fetching division users:', error);
    throw new Error(`Failed to fetch division users: ${error.message}`);
  }

  return data || [];
};

/**
 * Get division user by ID
 */
export const getDivisionUserById = async (id: string): Promise<DivisionUserExpanded | null> => {
  const { data, error } = await supabase
    .from('division_users')
    .select(`
      *,
      division:divisions(*),
      assigned_district:districts(*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DivisionService] Error fetching division user:', error);
    throw new Error(`Failed to fetch division user: ${error.message}`);
  }

  return data;
};

/**
 * Get division user by Firebase UID
 */
export const getDivisionUserByFirebaseUid = async (
  firebaseUid: string
): Promise<DivisionUser | null> => {
  const { data, error } = await supabase
    .from('division_users')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DivisionService] Error fetching division user by UID:', error);
    throw new Error(`Failed to fetch division user: ${error.message}`);
  }

  return data;
};

/**
 * Create a new division user
 */
export const createDivisionUser = async (input: CreateDivisionUserInput): Promise<DivisionUser> => {
  // Apply default permissions if not provided
  const permissions = input.permissions || DEFAULT_PERMISSIONS_BY_ROLE[input.role];

  const { data, error } = await supabase
    .from('division_users')
    .insert({
      ...input,
      permissions,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[DivisionService] Error creating division user:', error);
    throw new Error(`Failed to create division user: ${error.message}`);
  }

  return data;
};

/**
 * Update a division user
 */
export const updateDivisionUser = async (input: UpdateDivisionUserInput): Promise<DivisionUser> => {
  const { id, ...updateData } = input;

  const { data, error } = await supabase
    .from('division_users')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DivisionService] Error updating division user:', error);
    throw new Error(`Failed to update division user: ${error.message}`);
  }

  return data;
};

/**
 * Soft delete a division user
 */
export const deleteDivisionUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('division_users')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', id);

  if (error) {
    console.error('[DivisionService] Error deleting division user:', error);
    throw new Error(`Failed to delete division user: ${error.message}`);
  }
};

/**
 * Update division user's last login timestamp
 */
export const updateDivisionUserLastLogin = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('division_users')
    .update({
      last_login_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[DivisionService] Error updating last login:', error);
    // Don't throw - this is not critical
  }
};

// =====================================================
// DISTRICT OPERATIONS
// =====================================================

/**
 * Get all districts in a division
 */
export const getDistrictsByDivision = async (divisionId: string): Promise<District[]> => {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('division_id', divisionId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('[DivisionService] Error fetching districts:', error);
    throw new Error(`Failed to fetch districts: ${error.message}`);
  }

  return data || [];
};

/**
 * Get district by ID with school count
 */
export const getDistrictById = async (id: string): Promise<DistrictExpanded | null> => {
  const { data, error } = await supabase
    .from('districts')
    .select(`
      *,
      division:divisions(*),
      schools(id, name, school_id_number, address, principal_name)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DivisionService] Error fetching district:', error);
    throw new Error(`Failed to fetch district: ${error.message}`);
  }

  return {
    ...data,
    school_count: data.schools?.length || 0,
  };
};

/**
 * Create a new district
 */
export const createDistrict = async (input: CreateDistrictInput): Promise<District> => {
  const { data, error } = await supabase
    .from('districts')
    .insert({
      ...input,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[DivisionService] Error creating district:', error);
    throw new Error(`Failed to create district: ${error.message}`);
  }

  return data;
};

/**
 * Update a district
 */
export const updateDistrict = async (input: UpdateDistrictInput): Promise<District> => {
  const { id, ...updateData } = input;

  const { data, error } = await supabase
    .from('districts')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DivisionService] Error updating district:', error);
    throw new Error(`Failed to update district: ${error.message}`);
  }

  return data;
};

/**
 * Soft delete a district
 */
export const deleteDistrict = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('districts')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', id);

  if (error) {
    console.error('[DivisionService] Error deleting district:', error);
    throw new Error(`Failed to delete district: ${error.message}`);
  }
};

// =====================================================
// SCHOOL QUERIES (Division-scoped)
// =====================================================

/**
 * Get all schools in a division
 */
export const getSchoolsByDivision = async (divisionId: string): Promise<SchoolSummary[]> => {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, school_id_number, district, address, principal_name')
    .eq('division_id', divisionId)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('[DivisionService] Error fetching schools by division:', error);
    throw new Error(`Failed to fetch schools: ${error.message}`);
  }

  return data || [];
};

/**
 * Get all schools in a district
 */
export const getSchoolsByDistrict = async (districtId: string): Promise<SchoolSummary[]> => {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, school_id_number, district, address, principal_name')
    .eq('district_id', districtId)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('[DivisionService] Error fetching schools by district:', error);
    throw new Error(`Failed to fetch schools: ${error.message}`);
  }

  return data || [];
};

/**
 * Get schools accessible by a division user
 * (Based on their role and assigned districts/schools)
 */
export const getAccessibleSchools = async (divisionUser: DivisionUser): Promise<SchoolSummary[]> => {
  // If user has specific school IDs assigned
  if (divisionUser.accessible_school_ids && divisionUser.accessible_school_ids.length > 0) {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, school_id_number, district, address, principal_name')
      .in('id', divisionUser.accessible_school_ids)
      .is('deleted_at', null)
      .order('name');

    if (error) throw new Error(`Failed to fetch schools: ${error.message}`);
    return data || [];
  }

  // If PSDS with assigned districts
  if (divisionUser.role === 'psds') {
    const districtIds = divisionUser.assigned_district_ids?.length 
      ? divisionUser.assigned_district_ids 
      : divisionUser.assigned_district_id 
        ? [divisionUser.assigned_district_id]
        : [];

    if (districtIds.length === 0) {
      return []; // PSDS without districts has no access
    }

    const { data, error } = await supabase
      .from('schools')
      .select('id, name, school_id_number, district, address, principal_name')
      .in('district_id', districtIds)
      .is('deleted_at', null)
      .order('name');

    if (error) throw new Error(`Failed to fetch schools: ${error.message}`);
    return data || [];
  }

  // Default: All schools in division
  return getSchoolsByDivision(divisionUser.division_id);
};

// =====================================================
// AGGREGATION QUERIES
// =====================================================

/**
 * Get division statistics (school count, student count, etc.)
 */
export const getDivisionStats = async (divisionId: string): Promise<{
  schoolCount: number;
  districtCount: number;
  studentCount: number;
  teacherCount: number;
}> => {
  // Get counts in parallel
  const [
    schoolsResult,
    districtsResult,
    studentsResult,
    teachersResult,
  ] = await Promise.all([
    supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('division_id', divisionId)
      .is('deleted_at', null),
    supabase
      .from('districts')
      .select('id', { count: 'exact', head: true })
      .eq('division_id', divisionId)
      .is('deleted_at', null),
    // Students - join through schools
    supabase
      .from('students')
      .select('id, schools!inner(division_id)', { count: 'exact', head: true })
      .eq('schools.division_id', divisionId)
      .is('deleted_at', null),
    // Teachers - join through schools
    supabase
      .from('teachers')
      .select('id, schools!inner(division_id)', { count: 'exact', head: true })
      .eq('schools.division_id', divisionId)
      .is('deleted_at', null),
  ]);

  return {
    schoolCount: schoolsResult.count || 0,
    districtCount: districtsResult.count || 0,
    studentCount: studentsResult.count || 0,
    teacherCount: teachersResult.count || 0,
  };
};

/**
 * Assign a school to a division
 */
export const assignSchoolToDivision = async (
  schoolId: string, 
  divisionId: string,
  districtId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .update({
      division_id: divisionId,
      district_id: districtId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schoolId);

  if (error) {
    console.error('[DivisionService] Error assigning school to division:', error);
    throw new Error(`Failed to assign school: ${error.message}`);
  }
};

/**
 * Remove school from division
 */
export const removeSchoolFromDivision = async (schoolId: string): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .update({
      division_id: null,
      district_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schoolId);

  if (error) {
    console.error('[DivisionService] Error removing school from division:', error);
    throw new Error(`Failed to remove school: ${error.message}`);
  }
};
