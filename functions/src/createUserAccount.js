/**
 * Create User Account Cloud Function
 * 
 * This function creates user accounts using Firebase Admin SDK.
 * Unlike the client SDK, the Admin SDK does NOT automatically sign in as the new user.
 * 
 * Benefits:
 * - Admin stays logged in (no session hijacking)
 * - No need to ask for admin password
 * - Atomic operation (all or nothing)
 * - Better security (creation logic on server)
 * - Custom claims set immediately
 * 
 * Usage:
 *   const result = await httpsCallable(functions, 'createUserAccount')({
 *     email: 'user@example.com',
 *     password: 'password123',
 *     role: 'teacher',
 *     schoolId: 'school-uuid-or-id',
 *     userData: { firstName: 'John', lastName: 'Doe', ... }
 *   });
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Supabase client with service role key (bypasses RLS)
let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }
  
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
  
  return supabase;
}

// Valid roles for the system
const VALID_ROLES = ['admin', 'teacher', 'student', 'parent', 'registrar', 'superadmin'];

/**
 * Get school UUID from school_id_number or verify UUID exists
 * Returns null if no school found (allows graceful degradation)
 */
async function getSchoolUuid(supabase, schoolId) {
  console.log('[createUserAccount] Looking up school:', schoolId);
  
  // Handle placeholder values - go straight to fallback
  if (!schoolId || schoolId === 'default' || schoolId === 'undefined' || schoolId === 'null') {
    console.log('[createUserAccount] Placeholder schoolId detected, using first available school');
    const { data: firstSchool } = await supabase
      .from('schools')
      .select('id, name')
      .is('deleted_at', null)
      .limit(1);
    
    if (firstSchool && firstSchool.length > 0) {
      console.log('[createUserAccount] Using first school:', firstSchool[0].name, '(', firstSchool[0].id, ')');
      return firstSchool[0].id;
    }
    return null;
  }
  
  // Try to find by school_id_number first
  let { data: schoolsByNumber } = await supabase
    .from('schools')
    .select('id, school_id_number, name')
    .eq('school_id_number', schoolId)
    .is('deleted_at', null)
    .limit(1);
  
  if (schoolsByNumber && schoolsByNumber.length > 0) {
    console.log('[createUserAccount] Found school by school_id_number:', schoolsByNumber[0].id);
    return schoolsByNumber[0].id;
  }
  
  // Check if schoolId is already a UUID
  if (schoolId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const { data: schoolById } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .is('deleted_at', null)
      .limit(1);
    
    if (schoolById && schoolById.length > 0) {
      console.log('[createUserAccount] Verified UUID exists:', schoolId);
      return schoolId;
    }
  }
  
  // Fallback: Get first school
  const { data: allSchools } = await supabase
    .from('schools')
    .select('id, name')
    .is('deleted_at', null)
    .limit(1);
  
  if (allSchools && allSchools.length > 0) {
    console.log('[createUserAccount] Using first school:', allSchools[0].id);
    return allSchools[0].id;
  }
  
  // No schools found - return null and let caller handle gracefully
  console.log('[createUserAccount] ❌ No schools found in PostgreSQL database!');
  console.log('[createUserAccount] This could mean Supabase connection failed or schools table is empty.');
  return null;
}

/**
 * Create User Account - Callable Cloud Function
 * 
 * @param {object} data - The user data
 * @param {string} data.email - User's email address
 * @param {string} data.password - User's password (min 6 chars)
 * @param {string} data.role - User's role (teacher, student, registrar, etc.)
 * @param {string} data.schoolId - School ID (UUID or school_id_number)
 * @param {object} data.userData - Role-specific data (firstName, lastName, lrn, etc.)
 * @param {object} context - Firebase context with auth info
 */
exports.createUserAccount = functions.https.onCall(async (data, context) => {
  const startTime = Date.now();
  
  // =========================================================================
  // AUTHENTICATION & AUTHORIZATION
  // =========================================================================
  
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create user accounts'
    );
  }
  
  // Get caller's custom claims to verify they're an admin
  let callerClaims;
  try {
    const callerRecord = await auth.getUser(context.auth.uid);
    callerClaims = callerRecord.customClaims || {};
  } catch (err) {
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify your permissions'
    );
  }
  
  // Only admins can create users
  const callerRole = callerClaims.role;
  if (!['admin', 'superadmin'].includes(callerRole)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can create user accounts'
    );
  }
  
  // =========================================================================
  // VALIDATE INPUT
  // =========================================================================
  
  const { email, password, role, schoolId, userData } = data;
  
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }
  
  if (!role || !VALID_ROLES.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }
  
  if (!schoolId) {
    throw new functions.https.HttpsError('invalid-argument', 'School ID is required');
  }
  
  console.log(`[createUserAccount] Creating ${role} account for ${email} (requested by ${context.auth.uid})`);
  
  // =========================================================================
  // CREATE USER
  // =========================================================================
  
  let firebaseUid = null;
  let postgresUserId = null;
  let hasPostgresSchool = false;
  let schoolUuid = null;
  
  try {
    const supabase = getSupabaseClient();
    
    // Step 1: Get school UUID (may be null if no PostgreSQL schools exist)
    console.log(`[createUserAccount] Calling getSchoolUuid with schoolId: "${schoolId}"`);
    schoolUuid = await getSchoolUuid(supabase, schoolId);
    hasPostgresSchool = schoolUuid !== null;
    console.log(`[createUserAccount] School lookup result: UUID=${schoolUuid}, hasPostgresSchool=${hasPostgresSchool}`);
    
    if (!hasPostgresSchool) {
      // FAIL if no school found - we NEED PostgreSQL for login to work
      throw new Error(`School not found in database for schoolId="${schoolId}". Cannot create user without a valid school. Please sign out and sign back in if you recently updated your account.`);
    }
    
    // Step 2: Create Firebase Auth user (Admin SDK - NO session hijacking!)
    console.log('[createUserAccount] Creating Firebase Auth user...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: userData?.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || email,
      emailVerified: false
    });
    
    firebaseUid = userRecord.uid;
    console.log(`[createUserAccount] ✅ Created Firebase Auth user: ${firebaseUid}`);
    
    // Step 3: Set custom claims IMMEDIATELY (no waiting for trigger)
    console.log('[createUserAccount] Setting custom claims...');
    await auth.setCustomUserClaims(firebaseUid, {
      role: role,
      schoolId: schoolId
    });
    console.log(`[createUserAccount] ✅ Set custom claims: role=${role}, schoolId=${schoolId}`);
    
    // Step 4: Create PostgreSQL records directly in role-specific tables (NO users table!)
    if (hasPostgresSchool) {
      // Create directly in teachers/students table - NO intermediate users table
      if (role === 'teacher' || role === 'registrar' || role === 'admin') {
        console.log('[createUserAccount] Creating teachers table record...');
        const { data: teacherRow, error: teacherError } = await supabase
          .from('teachers')
          .insert({
            school_id: schoolUuid,
            firebase_uid: firebaseUid,
            email: email,
            role: role,
            name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || email,
            first_name: userData?.firstName || '',
            middle_name: userData?.middleName || null,
            last_name: userData?.lastName || '',
            contact_number: userData?.contactNumber || null,
            employment_status: 'Active'
          })
          .select()
          .single();
        
        if (teacherError) {
          throw new Error(`Failed to create teacher record: ${teacherError.message}`);
        }
        postgresUserId = teacherRow.id;
        console.log(`[createUserAccount] ✅ Created teachers record: ${postgresUserId}`);
        
      } else if (role === 'student') {
        console.log('[createUserAccount] Creating students table record...');
        const { data: studentRow, error: studentError } = await supabase
          .from('students')
          .insert({
            school_id: schoolUuid,
            firebase_uid: firebaseUid,
            email: email,
            lrn: userData?.lrn,
            name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Student',
            first_name: userData?.firstName || '',
            middle_name: userData?.middleName || null,
            last_name: userData?.lastName || '',
            grade_level: userData?.gradeLevel || 7,
            section_id: userData?.sectionId || null,
            gender: userData?.gender || 'Male',
            date_of_birth: userData?.birthdate || '2010-01-01'
          })
          .select()
          .single();
        
        if (studentError) {
          throw new Error(`Failed to create student record: ${studentError.message}`);
        }
        postgresUserId = studentRow.id;
        console.log(`[createUserAccount] ✅ Created students record: ${postgresUserId}`);
        
      } else if (role === 'parent') {
        console.log('[createUserAccount] Creating parents table record...');
        const { data: parentRow, error: parentError } = await supabase
          .from('parents')
          .insert({
            school_id: schoolUuid,
            firebase_uid: firebaseUid,
            email: email,
            name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Parent',
            contact_number: userData?.contactNumber || null
          })
          .select()
          .single();
        
        if (parentError) {
          throw new Error(`Failed to create parent record: ${parentError.message}`);
        }
        postgresUserId = parentRow.id;
        console.log(`[createUserAccount] ✅ Created parents record: ${postgresUserId}`);
      }
    } else {
      console.log('[createUserAccount] ⏭️ Skipping PostgreSQL records (no school found)');
    }
    
    // Success! (No Firestore userRoles - we query PostgreSQL directly now)
    const duration = Date.now() - startTime;
    console.log(`[createUserAccount] ✅ User creation complete in ${duration}ms`);
    
    return {
      success: true,
      userId: firebaseUid,
      postgresUserId: postgresUserId,
      email: email,
      role: role,
      schoolId: schoolUuid,
      postgresLinked: hasPostgresSchool,
      message: hasPostgresSchool 
        ? `Successfully created ${role} account for ${email}`
        : `Created ${role} account (Firebase only - no PostgreSQL school found)`
    };
    
  } catch (error) {
    console.error('[createUserAccount] ❌ Error:', error);
    
    // Rollback: Delete Firebase Auth user if created
    if (firebaseUid) {
      try {
        await auth.deleteUser(firebaseUid);
        console.log('[createUserAccount] Rolled back Firebase Auth user');
      } catch (rollbackErr) {
        console.error('[createUserAccount] Failed to rollback Firebase user:', rollbackErr);
      }
    }
    
    // Rollback: Delete PostgreSQL record if created (from role-specific table)
    if (postgresUserId && hasPostgresSchool) {
      try {
        const supabase = getSupabaseClient();
        // Try to delete from all role tables (only one will match)
        await supabase.from('teachers').delete().eq('id', postgresUserId);
        await supabase.from('students').delete().eq('id', postgresUserId);
        await supabase.from('parents').delete().eq('id', postgresUserId);
        console.log('[createUserAccount] Rolled back PostgreSQL record');
      } catch (rollbackErr) {
        console.error('[createUserAccount] Failed to rollback PostgreSQL record:', rollbackErr);
      }
    }
    
    // Convert to appropriate error
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'An account with this email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new functions.https.HttpsError('invalid-argument', 'Password is too weak');
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create user account');
  }
});
