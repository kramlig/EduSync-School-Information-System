#!/usr/bin/env node
/**
 * Setup Beta Teacher: John Lex Doromal (Brad)
 * School: Sigaboy Central Elem School
 * 
 * Creates:
 * 1. School in PostgreSQL (if not exists)
 * 2. Firebase Auth account
 * 3. Teacher record in PostgreSQL (with firebase_uid for login)
 * 
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-key"
 *   node scripts/setup-beta-teacher-brad.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// New Supabase project
const SUPABASE_URL = 'https://ojahhzdibhfrjazgwvfw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('\nSet it with:');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('  node scripts/setup-beta-teacher-brad.cjs');
  process.exit(1);
}

// ── Teacher details ──
const TEACHER = {
  email: 'johnlex.doromal002@deped.gov.ph',
  password: 'EduSync@2025!',
  displayName: 'John Lex Doromal',
  firstName: 'John Lex',
  lastName: 'Doromal',
  role: 'admin', // school admin so he can manage the school & invite others
};

const SCHOOL = {
  name: 'Sigaboy Central Elementary School',
  type: 'institutional',
  tier: 'school',
  school_type: 'elementary',
  division: 'Division of Davao Oriental',
  region: 'Region XI - Davao Region',
  district: 'Governor Generoso District',
  current_school_year: '2025-2026',
  settings: {
    schoolYear: '2025-2026',
    currentQuarter: 'Q4',
    gradingSystem: 'weighted',
    features: {
      enrollment: { enabled: true },
      grading: { enabled: true },
      coreValues: { enabled: true },
      financial: { enabled: false },
      reports: { enabled: true },
    },
  },
};

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  // PRODUCTION Firebase
  delete process.env.FIRESTORE_EMULATOR_HOST;
  initializeApp({ projectId: 'edusync-sis' });
  const auth = getAuth();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log('\n👨‍🏫 SETUP BETA TEACHER: John Lex Doromal');
  console.log('═'.repeat(60));
  console.log('📍 Firebase: edusync-sis (PRODUCTION)');
  console.log('📍 Supabase: ojahhzdibhfrjazgwvfw (PRODUCTION)');
  console.log('═'.repeat(60));

  try {
    // ════════════════════════════════════════
    // STEP 1: Create / find school
    // ════════════════════════════════════════
    console.log('\n1️⃣  School: ' + SCHOOL.name);

    // Check if school already exists by name
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id, name')
      .ilike('name', `%Sigaboy%`)
      .maybeSingle();

    let schoolId;
    if (existingSchool) {
      schoolId = existingSchool.id;
      console.log(`   ⚠️  School already exists (ID: ${schoolId})`);
    } else {
      const { data: newSchool, error: schoolErr } = await supabase
        .from('schools')
        .insert({
          name: SCHOOL.name,
          type: SCHOOL.type,
          tier: SCHOOL.tier,
          school_type: SCHOOL.school_type,
          division: SCHOOL.division,
          region: SCHOOL.region,
          district: SCHOOL.district,
          current_school_year: SCHOOL.current_school_year,
          settings: SCHOOL.settings,
          contact_email: TEACHER.email,
        })
        .select('id')
        .single();

      if (schoolErr) throw new Error('School insert failed: ' + schoolErr.message);
      schoolId = newSchool.id;
      console.log(`   ✅ School created (ID: ${schoolId})`);
    }

    // ════════════════════════════════════════
    // STEP 2: Firebase Auth
    // ════════════════════════════════════════
    console.log('\n2️⃣  Firebase Auth: ' + TEACHER.email);

    let firebaseUid;
    try {
      const existing = await auth.getUserByEmail(TEACHER.email);
      firebaseUid = existing.uid;
      console.log(`   ⚠️  Auth user already exists (UID: ${firebaseUid})`);
      await auth.updateUser(firebaseUid, {
        password: TEACHER.password,
        displayName: TEACHER.displayName,
        emailVerified: true,
      });
      console.log('   ✅ Password & display name updated');
    } catch (err) {
      const newUser = await auth.createUser({
        email: TEACHER.email,
        password: TEACHER.password,
        displayName: TEACHER.displayName,
        emailVerified: true,
      });
      firebaseUid = newUser.uid;
      console.log(`   ✅ Created (UID: ${firebaseUid})`);
    }

    // Set custom claims
    await auth.setCustomUserClaims(firebaseUid, {
      role: TEACHER.role,
      schoolId: schoolId,
    });
    console.log(`   ✅ Custom claims set (role: ${TEACHER.role}, schoolId: ${schoolId})`);

    // ════════════════════════════════════════
    // STEP 3: PostgreSQL teacher record
    // ════════════════════════════════════════
    console.log('\n3️⃣  PostgreSQL teachers table');

    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (existingTeacher) {
      console.log(`   ⚠️  Teacher already exists (ID: ${existingTeacher.id})`);
      // Update just in case
      await supabase
        .from('teachers')
        .update({
          school_id: schoolId,
          email: TEACHER.email,
          name: TEACHER.displayName,
          first_name: TEACHER.firstName,
          last_name: TEACHER.lastName,
          role: TEACHER.role,
        })
        .eq('id', existingTeacher.id);
      console.log('   ✅ Updated existing record');
    } else {
      const { data: newTeacher, error: tErr } = await supabase
        .from('teachers')
        .insert({
          school_id: schoolId,
          firebase_uid: firebaseUid,
          email: TEACHER.email,
          name: TEACHER.displayName,
          first_name: TEACHER.firstName,
          last_name: TEACHER.lastName,
          role: TEACHER.role,
        })
        .select('id')
        .single();

      if (tErr) throw new Error('Teacher insert failed: ' + tErr.message);
      console.log(`   ✅ Created (ID: ${newTeacher.id})`);
    }

    // ════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('✅ BETA TEACHER ACCOUNT READY');
    console.log('═'.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Email:    ${TEACHER.email}`);
    console.log(`   Password: ${TEACHER.password}`);
    console.log(`   Role:     ${TEACHER.role} (school administrator)`);
    console.log(`   School:   ${SCHOOL.name}`);
    console.log(`   UID:      ${firebaseUid}`);
    console.log(`   School ID: ${schoolId}`);
    console.log('\n🔗 Login at: https://edusync.ph');
    console.log('   Use the "Staff" tab → Enter credentials');
    console.log('\n💡 As admin, Brad can:');
    console.log('   - Manage teachers, students, sections');
    console.log('   - Access grading, enrollment, DepEd forms');
    console.log('   - Invite other teachers to the school\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

run();
