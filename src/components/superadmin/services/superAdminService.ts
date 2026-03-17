/**
 * SuperAdmin Service
 * 
 * API calls for superadmin operations:
 * - Platform-wide statistics
 * - School CRUD operations
 * - Division CRUD operations
 * - User creation for any school/division
 */

import { supabase } from '../../../lib/supabase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../../../services/firestoreService';
import type { 
  School, 
  Division, 
  PlatformStats, 
  CreateSchoolInput,
  CreateDivisionInput,
  CreateUserInput,
} from '../types';

// ============================================================================
// PLATFORM STATISTICS
// ============================================================================

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    // Parallel queries for better performance
    const [schoolsResult, divisionsResult, studentsResult, teachersResult] = await Promise.all([
      supabase.from('schools').select('id, deleted_at', { count: 'exact' }),
      supabase.from('divisions').select('id', { count: 'exact' }),
      supabase.from('students').select('id', { count: 'exact' }).is('deleted_at', null),
      supabase.from('teachers').select('id', { count: 'exact' }).is('deleted_at', null),
    ]);

    // Count active schools (where deleted_at is null)
    const activeSchools = schoolsResult.data?.filter(s => s.deleted_at === null).length ?? 0;

    return {
      total_schools: schoolsResult.count ?? 0,
      total_divisions: divisionsResult.count ?? 0,
      total_students: studentsResult.count ?? 0,
      total_teachers: teachersResult.count ?? 0,
      active_schools: activeSchools,
    };
  } catch (error) {
    console.error('[SuperAdminService] Failed to get platform stats:', error);
    return {
      total_schools: 0,
      total_divisions: 0,
      total_students: 0,
      total_teachers: 0,
      active_schools: 0,
    };
  }
}

// ============================================================================
// SCHOOLS
// ============================================================================

/**
 * Get all schools with optional filtering
 */
export async function getAllSchools(filters?: {
  division?: string;
  status?: 'active' | 'inactive';
  search?: string;
}): Promise<School[]> {
  try {
    let query = supabase
      .from('schools')
      .select(`
        id,
        name,
        school_id_number,
        address,
        contact_phone,
        contact_email,
        principal_name,
        division,
        region,
        district,
        current_school_year,
        created_at,
        updated_at,
        deleted_at
      `)
      .order('name');

    // Apply filters
    if (filters?.division) {
      query = query.eq('division', filters.division);
    }
    if (filters?.status === 'active') {
      query = query.is('deleted_at', null);
    } else if (filters?.status === 'inactive') {
      query = query.not('deleted_at', 'is', null);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,school_id_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Enrich with counts and admin info
    const enrichedSchools = await Promise.all(
      (data || []).map(async (school: any) => {
        // Get counts - use users table for admin since role is there
        const [studentCount, teacherCount, adminInfo] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', school.id).is('deleted_at', null),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', school.id).is('deleted_at', null),
          supabase.from('users').select('email').eq('school_id', school.id).eq('role', 'admin').is('deleted_at', null).limit(1).maybeSingle(),
        ]);

        return {
          id: school.id,
          name: school.name,
          code: school.school_id_number, // Map to expected field name
          school_id_number: school.school_id_number,
          address: school.address,
          phone: school.contact_phone,
          email: school.contact_email,
          principal_name: school.principal_name,
          status: (school.deleted_at ? 'inactive' : 'active') as 'active' | 'inactive',
          division_id: null, // Not using UUID-based division_id
          division_name: school.division, // Use text division name directly
          region: school.region,
          district: school.district,
          current_school_year: school.current_school_year,
          created_at: school.created_at,
          updated_at: school.updated_at,
          student_count: studentCount.count ?? 0,
          teacher_count: teacherCount.count ?? 0,
          admin_email: adminInfo.data?.email,
          has_admin: !!adminInfo.data?.email,
        };
      })
    );

    return enrichedSchools;
  } catch (error) {
    console.error('[SuperAdminService] Failed to get schools:', error);
    throw error;
  }
}

/**
 * Create a new school with optional admin account
 */
export async function createSchool(input: CreateSchoolInput): Promise<{ school_id: string; admin_uid?: string }> {
  try {
    // 1. Create school in PostgreSQL
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: input.name,
        code: input.code,
        school_id_number: input.school_id_number,
        school_type: input.school_type || null,
        address: input.address,
        phone: input.phone,
        email: input.email,
        principal_name: input.principal_name,
        division_id: input.division_id || null,
        region: input.region,
        district: input.district,
        current_school_year: input.current_school_year || '2025-2026',
        status: 'active',
      })
      .select()
      .single();

    if (schoolError) throw schoolError;

    const school_id = schoolData.id;
    let admin_uid: string | undefined;

    // 2. Create admin account if credentials provided
    if (input.admin_email && input.admin_password) {
      admin_uid = await createUserForSchool({
        school_id,
        email: input.admin_email,
        password: input.admin_password,
        role: 'admin',
        name: `${input.name} Admin`,
      });
    }

    return { school_id, admin_uid };
  } catch (error) {
    console.error('[SuperAdminService] Failed to create school:', error);
    throw error;
  }
}

/**
 * Update school information
 */
export async function updateSchool(school_id: string, updates: Partial<School>): Promise<void> {
  try {
    const { error } = await supabase
      .from('schools')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', school_id);

    if (error) throw error;
  } catch (error) {
    console.error('[SuperAdminService] Failed to update school:', error);
    throw error;
  }
}

// ============================================================================
// DIVISIONS
// ============================================================================

/**
 * Get all divisions
 */
export async function getAllDivisions(): Promise<Division[]> {
  try {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .order('name');

    if (error) throw error;

    // Enrich with counts
    const enrichedDivisions = await Promise.all(
      (data || []).map(async (division) => {
        const [schoolCount, userCount] = await Promise.all([
          supabase.from('schools').select('id', { count: 'exact', head: true }).eq('division_id', division.id),
          supabase.from('division_users').select('id', { count: 'exact', head: true }).eq('division_id', division.id),
        ]);

        return {
          ...division,
          school_count: schoolCount.count ?? 0,
          user_count: userCount.count ?? 0,
        };
      })
    );

    return enrichedDivisions;
  } catch (error) {
    console.error('[SuperAdminService] Failed to get divisions:', error);
    throw error;
  }
}

/**
 * Create a new division
 */
export async function createDivision(input: CreateDivisionInput): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('divisions')
      .insert({
        name: input.name,
        code: input.code,
        region: input.region,
        address: input.address,
        phone: input.phone,
        email: input.email,
        superintendent_name: input.superintendent_name,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    
    const divisionId = data.id;

    // Create admin account if provided
    if (input.admin_email && input.admin_password) {
      try {
        await createUserForDivision({
          division_id: divisionId,
          email: input.admin_email,
          password: input.admin_password,
          name: input.admin_name || 'Division Admin',
          role: 'division_admin',
        });
        console.log('[SuperAdminService] Division admin created:', input.admin_email);
      } catch (adminError) {
        console.error('[SuperAdminService] Failed to create division admin:', adminError);
        // Don't fail the whole operation, just log the error
      }
    }

    return divisionId;
  } catch (error) {
    console.error('[SuperAdminService] Failed to create division:', error);
    throw error;
  }
}

// ============================================================================
// USER CREATION
// ============================================================================

/**
 * Create a user for a specific school
 * Option A (Role-Centric): Insert directly to teachers table with firebase_uid
 */
export async function createUserForSchool(params: {
  school_id: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'registrar' | 'principal';
  name: string;
}): Promise<string> {
  const auth = getAuth();
  const db = getFirestoreInstance();
  
  // Save current user to restore session
  const currentUser = auth.currentUser;
  const currentUserEmail = currentUser?.email;
  
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const uid = userCredential.user.uid;

    // 2. Create teacher record directly (Option A: Role-Centric)
    // All school staff (admin, teacher, registrar, principal) go to teachers table
    const nameParts = params.name.split(' ');
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        firebase_uid: uid,
        school_id: params.school_id,
        email: params.email,
        name: params.name,
        role: params.role,
        first_name: nameParts[0] || params.name,
        last_name: nameParts.slice(1).join(' ') || '',
      });

    if (teacherError) {
      console.error('[SuperAdminService] Teacher record creation failed:', teacherError);
      throw teacherError;
    }

    // 3. Create userRoles Firestore document for custom claims
    const userRoleRef = doc(db, 'userRoles', uid);
    await setDoc(userRoleRef, {
      uid,
      email: params.email,
      role: params.role,
      schoolId: params.school_id,
      displayName: params.name,
      createdAt: serverTimestamp(),
      createdBy: currentUserEmail || 'superadmin',
    });

    console.log(`[SuperAdminService] ✅ Created user ${params.email} with role ${params.role} for school ${params.school_id}`);
    
    return uid;
  } catch (error: any) {
    console.error('[SuperAdminService] Failed to create user for school:', error);
    throw new Error(error.message || 'Failed to create user');
  }
}

/**
 * Create a user for a specific division
 */
export async function createUserForDivision(params: {
  division_id: string;
  email: string;
  password: string;
  role: 'division_admin' | 'division_supervisor' | 'division_data_manager' | 'psds' | 'eps';
  name: string;
  assigned_district_id?: string;
}): Promise<string> {
  const auth = getAuth();
  const db = getFirestoreInstance();
  
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const uid = userCredential.user.uid;

    // 2. Get default permissions for role
    const defaultPermissions = getDefaultPermissionsForDivisionRole(params.role);

    // 3. Create division_users record
    const { error: divUserError } = await supabase
      .from('division_users')
      .insert({
        firebase_uid: uid,
        division_id: params.division_id,
        email: params.email,
        name: params.name,
        role: params.role,
        permissions: defaultPermissions,
        assigned_district_id: params.assigned_district_id || null,
        is_active: true,
      });

    if (divUserError) {
      console.error('[SuperAdminService] Division user creation failed:', divUserError);
      throw divUserError;
    }

    // 4. Create userRoles Firestore document for tracking
    const userRoleRef = doc(db, 'userRoles', uid);
    await setDoc(userRoleRef, {
      uid,
      email: params.email,
      role: 'division_user',
      divisionId: params.division_id,
      divisionRole: params.role,
      displayName: params.name,
      createdAt: serverTimestamp(),
      createdBy: 'superadmin',
    });

    console.log(`[SuperAdminService] ✅ Created division user ${params.email} with role ${params.role}`);
    
    return uid;
  } catch (error: any) {
    console.error('[SuperAdminService] Failed to create division user:', error);
    throw new Error(error.message || 'Failed to create division user');
  }
}

/**
 * Get default permissions for division role
 */
function getDefaultPermissionsForDivisionRole(role: string): Record<string, string[]> {
  const permissions: Record<string, Record<string, string[]>> = {
    division_admin: {
      schools: ['read', 'write', 'delete', 'export'],
      personnel: ['read', 'write', 'delete', 'export'],
      enrollment: ['read', 'write', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: ['read', 'write'],
      users: ['read', 'write', 'delete'],
    },
    division_supervisor: {
      schools: ['read', 'export'],
      personnel: ['read', 'export'],
      enrollment: ['read', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: ['read'],
      users: ['read'],
    },
    division_data_manager: {
      schools: ['read', 'write', 'export'],
      personnel: ['read', 'export'],
      enrollment: ['read', 'write', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: ['read'],
      users: ['read'],
    },
    psds: {
      schools: ['read', 'export'],
      personnel: ['read', 'export'],
      enrollment: ['read', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: ['read'],
      users: ['read'],
    },
    eps: {
      schools: ['read', 'export'],
      personnel: ['read', 'export'],
      enrollment: ['read', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: ['read'],
      users: ['read'],
    },
  };

  return permissions[role] || permissions.division_supervisor;
}

/**
 * Generic user creation handler
 */
export async function createUser(input: CreateUserInput): Promise<string> {
  if (input.target_type === 'school') {
    return createUserForSchool({
      school_id: input.target_id,
      email: input.email,
      password: input.password,
      role: input.role as 'admin' | 'teacher' | 'registrar' | 'principal',
      name: input.name,
    });
  } else {
    return createUserForDivision({
      division_id: input.target_id,
      email: input.email,
      password: input.password,
      role: input.role as 'division_admin' | 'division_supervisor' | 'division_data_manager' | 'psds' | 'eps',
      name: input.name,
      assigned_district_id: input.additional_data?.assigned_district_id,
    });
  }
}
