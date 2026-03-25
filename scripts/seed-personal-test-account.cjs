#!/usr/bin/env node
/**
 * Seed a Personal Workspace test account with students, grades, attendance.
 *
 * Creates:
 *   1. Firebase Auth user (personal-test@edusync.ph / Demo123!)
 *   2. Personal workspace via Supabase RPC (school, teacher, section, subscription)
 *   3. 15 sample students
 *   4. Grades for all students across learning areas (Q1–Q4)
 *   5. Attendance records for the current month
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_ROLE_KEY env var (or set inline below)
 *   - Firebase Auth emulator running, OR Firebase Admin creds for prod
 *
 * Usage:
 *   # With emulator:
 *   set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
 *   set SUPABASE_SERVICE_ROLE_KEY=<key>
 *   node scripts/seed-personal-test-account.cjs
 *
 *   # Without emulator (uses firebase login session):
 *   set SUPABASE_SERVICE_ROLE_KEY=<key>
 *   node scripts/seed-personal-test-account.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const TEST_EMAIL = 'personal-test@edusync.ph';
const TEST_PASSWORD = 'Demo123!';
const TEST_NAME = 'Juan Dela Cruz';
const SCHOOL_NAME = 'Demo Personal School';
const SECTION_NAME = 'Section A';
const GRADE_LEVEL = 7;
const SCHOOL_YEAR = '2025-2026';

const SAMPLE_STUDENTS = [
  { first_name: 'Maria', last_name: 'Santos', middle_name: 'Cruz', lrn: '100100100001', gender: 'Female' },
  { first_name: 'Jose', last_name: 'Reyes', middle_name: 'Bautista', lrn: '100100100002', gender: 'Male' },
  { first_name: 'Ana', last_name: 'Garcia', middle_name: 'Mendoza', lrn: '100100100003', gender: 'Female' },
  { first_name: 'Carlos', last_name: 'Ramos', middle_name: 'Aquino', lrn: '100100100004', gender: 'Male' },
  { first_name: 'Rica', last_name: 'Torres', middle_name: null, lrn: '100100100005', gender: 'Female' },
  { first_name: 'Miguel', last_name: 'Flores', middle_name: 'Lim', lrn: '100100100006', gender: 'Male' },
  { first_name: 'Lia', last_name: 'Villanueva', middle_name: 'Tan', lrn: '100100100007', gender: 'Female' },
  { first_name: 'Marco', last_name: 'Delos Reyes', middle_name: 'Go', lrn: '100100100008', gender: 'Male' },
  { first_name: 'Jasmine', last_name: 'Navarro', middle_name: 'Sy', lrn: '100100100009', gender: 'Female' },
  { first_name: 'Daniel', last_name: 'Cruz', middle_name: 'Ong', lrn: '100100100010', gender: 'Male' },
  { first_name: 'Sofia', last_name: 'Mercado', middle_name: 'Chua', lrn: '100100100011', gender: 'Female' },
  { first_name: 'Rafael', last_name: 'Hernandez', middle_name: null, lrn: '100100100012', gender: 'Male' },
  { first_name: 'Isabella', last_name: 'Lopez', middle_name: 'Rivera', lrn: '100100100013', gender: 'Female' },
  { first_name: 'Gabriel', last_name: 'Gonzales', middle_name: 'Tan', lrn: '100100100014', gender: 'Male' },
  { first_name: 'Patricia', last_name: 'Aguilar', middle_name: 'Santos', lrn: '100100100015', gender: 'Female' },
];

function randomGrade() {
  // Weighted toward passing: 70% chance 75–98, 30% chance 60–74
  return Math.random() < 0.7
    ? Math.round(75 + Math.random() * 23)
    : Math.round(60 + Math.random() * 14);
}

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var.');
    console.log('Set it with:');
    console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
    console.log('Then run again.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log('\n🏫 SEED PERSONAL WORKSPACE TEST ACCOUNT');
  console.log('═'.repeat(60));
  console.log(`📧 Email:    ${TEST_EMAIL}`);
  console.log(`🔑 Password: ${TEST_PASSWORD}`);
  console.log(`🏫 School:   ${SCHOOL_NAME}`);
  console.log(`📚 Grade:    ${GRADE_LEVEL} — ${SECTION_NAME}`);
  console.log('═'.repeat(60));

  // ── Step 1: Create Firebase Auth user ──────────────────
  let firebaseUid;
  try {
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    if (!getApps().length) {
      initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'edusync-sis' });
    }
    const auth = getAuth();

    // Try to get existing user first
    try {
      const existing = await auth.getUserByEmail(TEST_EMAIL);
      firebaseUid = existing.uid;
      console.log(`✅ Firebase Auth user already exists: ${firebaseUid}`);
    } catch {
      const newUser = await auth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: TEST_NAME,
        emailVerified: true,
      });
      firebaseUid = newUser.uid;
      console.log(`✅ Firebase Auth user created: ${firebaseUid}`);
    }
  } catch (err) {
    console.error('⚠️  Firebase Admin SDK not available, generating a deterministic UID...');
    // Fallback: generate a consistent UID from the email (for testing without Firebase)
    const crypto = require('crypto');
    firebaseUid = 'personal-test-' + crypto.createHash('sha256').update(TEST_EMAIL).digest('hex').slice(0, 20);
    console.log(`   Using UID: ${firebaseUid}`);
  }

  // ── Step 2: Check if workspace already exists ──────────
  const { data: existingSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_uid', firebaseUid)
    .eq('type', 'personal')
    .maybeSingle();

  let schoolId, teacherId, sectionId;

  if (existingSchool) {
    console.log(`✅ Workspace already exists (school_id: ${existingSchool.id}). Reusing.`);
    schoolId = existingSchool.id;

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('school_id', schoolId)
      .eq('firebase_uid', firebaseUid)
      .single();
    teacherId = teacher?.id;

    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('school_id', schoolId)
      .single();
    sectionId = section?.id;
  } else {
    // Call the RPC to create workspace
    const { data: ws, error: wsErr } = await supabase.rpc('create_personal_workspace', {
      p_firebase_uid: firebaseUid,
      p_email: TEST_EMAIL,
      p_full_name: TEST_NAME,
      p_school_name: SCHOOL_NAME,
      p_school_id_number: '300001',
      p_division: 'Division of Davao City',
      p_region: 'Region XI',
      p_district: 'Davao District I',
      p_grade_level: GRADE_LEVEL,
      p_school_type: 'high_school',
      p_section_name: SECTION_NAME,
      p_school_year: SCHOOL_YEAR,
    });

    if (wsErr) {
      console.error('❌ Failed to create workspace:', wsErr.message);
      process.exit(1);
    }

    schoolId = ws.school_id;
    teacherId = ws.teacher_id;
    sectionId = ws.section_id;
    console.log(`✅ Workspace created (school_id: ${schoolId})`);
  }

  // ── Step 3: Seed students ──────────────────────────────
  const studentRows = SAMPLE_STUDENTS.map((s, i) => ({
    first_name: s.first_name,
    last_name: s.last_name,
    middle_name: s.middle_name,
    name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' '),
    lrn: s.lrn,
    gender: s.gender,
    school_id: schoolId,
    section_id: sectionId,
    grade_level: GRADE_LEVEL,
    enrollment_status: 'enrolled',
    date_of_birth: `${2012 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }));

  // Upsert by LRN to be idempotent
  const { data: insertedStudents, error: sErr } = await supabase
    .from('students')
    .upsert(studentRows, { onConflict: 'lrn', ignoreDuplicates: false })
    .select('id, first_name, last_name, lrn');

  if (sErr) {
    console.error('❌ Student seed error:', sErr.message);
    // Try to continue — students may already exist
  }

  // Fetch all students for this school (in case upsert didn't return them all)
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('school_id', schoolId);

  console.log(`✅ ${(allStudents || []).length} students in workspace`);

  // ── Step 4: Get learning areas ─────────────────────────
  const { data: learningAreas } = await supabase
    .from('learning_areas')
    .select('id, code, name, is_composite')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('display_order');

  if (!learningAreas || learningAreas.length === 0) {
    console.log('⚠️  No learning areas found. They should auto-seed via trigger.');
    console.log('   Try again after the auto-seed trigger fires, or run the app once.');
  } else {
    console.log(`✅ ${learningAreas.length} learning areas found: ${learningAreas.map(a => a.code || a.name).join(', ')}`);
  }

  // ── Step 5: Seed grades ────────────────────────────────
  if (allStudents && learningAreas && learningAreas.length > 0) {
    const gradeRows = [];
    for (const student of allStudents) {
      for (const area of learningAreas) {
        const q1 = randomGrade();
        const q2 = randomGrade();
        // Q3 and Q4: ~60% chance of having a grade (simulating in-progress year)
        const q3 = Math.random() < 0.6 ? randomGrade() : null;
        const q4 = Math.random() < 0.3 ? randomGrade() : null;

        const quarters = [q1, q2, q3, q4].filter(g => g !== null);
        const finalGrade = quarters.length > 0
          ? Math.round(quarters.reduce((a, b) => a + b, 0) / quarters.length)
          : null;
        const remarks = finalGrade !== null ? (finalGrade >= 75 ? 'Passed' : 'Failed') : null;

        gradeRows.push({
          school_id: schoolId,
          student_id: student.id,
          learning_area_id: area.id,
          school_year: SCHOOL_YEAR,
          q1, q2, q3, q4,
          final_grade: finalGrade,
          remarks,
        });
      }
    }

    // Delete existing grades for this school/year first (idempotent re-run)
    await supabase
      .from('grades')
      .delete()
      .eq('school_id', schoolId)
      .eq('school_year', SCHOOL_YEAR);

    // Insert in batches of 100
    let inserted = 0;
    for (let i = 0; i < gradeRows.length; i += 100) {
      const batch = gradeRows.slice(i, i + 100);
      const { error: gErr } = await supabase.from('grades').insert(batch);
      if (gErr) {
        console.error(`❌ Grade batch ${Math.floor(i / 100) + 1} error:`, gErr.message);
      } else {
        inserted += batch.length;
      }
    }
    console.log(`✅ ${inserted} grade records seeded`);
  }

  // ── Step 6: Seed attendance (current month) ────────────
  if (allStudents) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const attendanceRows = [];
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Excused'];

    for (let day = 1; day <= now.getDate(); day++) {
      const date = new Date(year, month, day);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const student of allStudents) {
        attendanceRows.push({
          school_id: schoolId,
          student_id: student.id,
          section_id: sectionId,
          date: date.toISOString().split('T')[0],
          status: statuses[Math.floor(Math.random() * statuses.length)],
        });
      }
    }

    // Delete existing attendance for idempotent re-run
    await supabase
      .from('attendance_records')
      .delete()
      .eq('school_id', schoolId);

    // Insert in batches
    let attInserted = 0;
    for (let i = 0; i < attendanceRows.length; i += 200) {
      const batch = attendanceRows.slice(i, i + 200);
      const { error: aErr } = await supabase.from('attendance_records').insert(batch);
      if (aErr) {
        console.error(`❌ Attendance batch error:`, aErr.message);
      } else {
        attInserted += batch.length;
      }
    }
    console.log(`✅ ${attInserted} attendance records seeded`);
  }

  // ── Summary ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 PERSONAL WORKSPACE SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log(`\n  📧 Login:     ${TEST_EMAIL}`);
  console.log(`  🔑 Password:  ${TEST_PASSWORD}`);
  console.log(`  🏫 School:    ${SCHOOL_NAME}`);
  console.log(`  📚 Grade ${GRADE_LEVEL} — ${SECTION_NAME}`);
  console.log(`  👨‍🏫 Teacher:   ${TEST_NAME}`);
  console.log(`  👨‍🎓 Students:  ${(allStudents || []).length}`);
  console.log(`  📊 Subjects:  ${(learningAreas || []).length}`);
  console.log(`  🆔 School ID: ${schoolId}`);
  console.log(`  🔥 Firebase:  ${firebaseUid}`);
  console.log('\n  → Open http://localhost:5173 and log in to test!\n');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
