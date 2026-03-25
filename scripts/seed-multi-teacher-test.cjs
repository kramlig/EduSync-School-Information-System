#!/usr/bin/env node
/**
 * Seed Multi-Teacher × Multi-Section Test Scenario (Institutional Workspace)
 *
 * Mirrors real Philippine school setup:
 *
 *   SECTIONS: Grade 7 — Sampaguita (A), Ilang-Ilang (B), Rosal (C), Jasmine (D)
 *
 *   TEACHER A (personal-test@edusync.ph)
 *     - ADVISER of Section A (Sampaguita)
 *     - Teaches ENGLISH in Sections A, B, C, D
 *     - Teaches MATH in Sections A, B, C, D
 *
 *   TEACHER B (adviser-test@edusync.ph)
 *     - ADVISER of Section B (Ilang-Ilang)
 *     - Teaches FILIPINO in Sections A, B, C, D
 *     - Teaches AP in Sections A, B, C, D
 *
 *   TEACHER C (teacher-c@edusync.ph)
 *     - ADVISER of Section C (Rosal)
 *     - Teaches SCIENCE in Sections A, B, C, D
 *     - Teaches ESP in Sections A, B, C, D
 *
 *   TEACHER D (teacher-d@edusync.ph)
 *     - ADVISER of Section D (Jasmine)
 *     - Teaches TLE in Sections A, B, C, D
 *     - Teaches MAPEH in Sections A, B, C, D
 *
 *   Each section has 10 students (40 total)
 *   Grades seeded for Q1-Q4 across all subjects
 *
 * WHAT THIS TESTS:
 *   - Teacher A in Section A: can edit ENG+MATH grades, CAN edit Homeroom/Core Values (adviser)
 *   - Teacher A in Section B: can edit ENG+MATH grades only, CANNOT edit Homeroom/Core Values
 *   - Teacher B in Section B: can edit FIL+AP grades, CAN edit Homeroom/Core Values (adviser)
 *   - Teacher B in Section A: can edit FIL+AP grades only, CANNOT edit Homeroom/Core Values
 *
 * Login credentials (all use Demo123!):
 *   personal-test@edusync.ph  (Teacher A)
 *   adviser-test@edusync.ph   (Teacher B)
 *   teacher-c@edusync.ph      (Teacher C)
 *   teacher-d@edusync.ph      (Teacher D)
 *
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/seed-multi-teacher-test.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const PASSWORD = 'Demo123!';
const SCHOOL_YEAR = '2025-2026';
const GRADE_LEVEL = 7;
const SCHOOL_NAME = 'Multi-Teacher Demo School';

// ── Sections ─────────────────────────────────────────────
const SECTIONS = [
  { name: 'Sampaguita', label: 'A' },
  { name: 'Ilang-Ilang', label: 'B' },
  { name: 'Rosal', label: 'C' },
  { name: 'Jasmine', label: 'D' },
];

// ── Teachers ─────────────────────────────────────────────
// Each teacher: advises 1 section, teaches 2 subjects across ALL 4 sections
const TEACHERS = [
  {
    email: 'personal-test@edusync.ph',
    name: 'Juan Dela Cruz',
    adviserOf: 'Sampaguita',
    subjects: ['ENG', 'MATH'],
  },
  {
    email: 'adviser-test@edusync.ph',
    name: 'Maria Clara Santos',
    adviserOf: 'Ilang-Ilang',
    subjects: ['FIL', 'AP'],
  },
  {
    email: 'teacher-c@edusync.ph',
    name: 'Pedro Reyes Jr.',
    adviserOf: 'Rosal',
    subjects: ['SCI', 'ESP'],
  },
  {
    email: 'teacher-d@edusync.ph',
    name: 'Ana Marie Torres',
    adviserOf: 'Jasmine',
    subjects: ['EPP', 'MAPEH'],
  },
];

// ── Students (10 per section = 40 total) ─────────────────
const STUDENT_NAMES = [
  // Section A (Sampaguita)
  { first: 'Maria', last: 'Santos', mid: 'Cruz', gender: 'Female' },
  { first: 'Jose', last: 'Reyes', mid: 'Bautista', gender: 'Male' },
  { first: 'Ana', last: 'Garcia', mid: 'Mendoza', gender: 'Female' },
  { first: 'Carlos', last: 'Ramos', mid: 'Aquino', gender: 'Male' },
  { first: 'Rica', last: 'Torres', mid: null, gender: 'Female' },
  { first: 'Miguel', last: 'Flores', mid: 'Lim', gender: 'Male' },
  { first: 'Lia', last: 'Villanueva', mid: 'Tan', gender: 'Female' },
  { first: 'Marco', last: 'Delos Reyes', mid: 'Go', gender: 'Male' },
  { first: 'Jasmine', last: 'Navarro', mid: 'Sy', gender: 'Female' },
  { first: 'Daniel', last: 'Cruz', mid: 'Ong', gender: 'Male' },
  // Section B (Ilang-Ilang)
  { first: 'Sofia', last: 'Mercado', mid: 'Chua', gender: 'Female' },
  { first: 'Rafael', last: 'Hernandez', mid: null, gender: 'Male' },
  { first: 'Isabella', last: 'Lopez', mid: 'Rivera', gender: 'Female' },
  { first: 'Gabriel', last: 'Gonzales', mid: 'Tan', gender: 'Male' },
  { first: 'Patricia', last: 'Aguilar', mid: 'Santos', gender: 'Female' },
  { first: 'Andrei', last: 'Dela Pena', mid: 'Lim', gender: 'Male' },
  { first: 'Camille', last: 'Bautista', mid: null, gender: 'Female' },
  { first: 'Enrique', last: 'Soriano', mid: 'Yu', gender: 'Male' },
  { first: 'Bianca', last: 'Mendoza', mid: 'Tan', gender: 'Female' },
  { first: 'Joshua', last: 'Rivera', mid: 'Go', gender: 'Male' },
  // Section C (Rosal)
  { first: 'Angela', last: 'Tan', mid: 'Sy', gender: 'Female' },
  { first: 'Kevin', last: 'Lim', mid: 'Chua', gender: 'Male' },
  { first: 'Hannah', last: 'Go', mid: 'Ong', gender: 'Female' },
  { first: 'Jericho', last: 'Sy', mid: null, gender: 'Male' },
  { first: 'Alyssa', last: 'Chua', mid: 'Tan', gender: 'Female' },
  { first: 'Nathan', last: 'Ong', mid: 'Lim', gender: 'Male' },
  { first: 'Trisha', last: 'Yu', mid: 'Go', gender: 'Female' },
  { first: 'Mark', last: 'Aquino', mid: 'Santos', gender: 'Male' },
  { first: 'Denise', last: 'Fernandez', mid: null, gender: 'Female' },
  { first: 'James', last: 'De Leon', mid: 'Cruz', gender: 'Male' },
  // Section D (Jasmine)
  { first: 'Christine', last: 'Pascual', mid: 'Reyes', gender: 'Female' },
  { first: 'Ryan', last: 'Villanueva', mid: 'Tan', gender: 'Male' },
  { first: 'Michelle', last: 'Rodriguez', mid: null, gender: 'Female' },
  { first: 'Aaron', last: 'Santiago', mid: 'Lim', gender: 'Male' },
  { first: 'Nicole', last: 'Torres', mid: 'Go', gender: 'Female' },
  { first: 'Bryan', last: 'Castillo', mid: 'Sy', gender: 'Male' },
  { first: 'Katrina', last: 'Flores', mid: 'Chua', gender: 'Female' },
  { first: 'Luis', last: 'Garcia', mid: null, gender: 'Male' },
  { first: 'Samantha', last: 'Ramos', mid: 'Ong', gender: 'Female' },
  { first: 'Patrick', last: 'Santos', mid: 'Tan', gender: 'Male' },
];

function randomGrade() {
  return Math.random() < 0.7
    ? Math.round(75 + Math.random() * 23)
    : Math.round(60 + Math.random() * 14);
}

async function getOrCreateFirebaseUser(email, displayName) {
  try {
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    if (!getApps().length) {
      initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'edusync-sis' });
    }
    const auth = getAuth();
    try {
      const existing = await auth.getUserByEmail(email);
      console.log(`    Firebase: ${existing.uid} (existing)`);
      return existing.uid;
    } catch {
      const newUser = await auth.createUser({ email, password: PASSWORD, displayName, emailVerified: true });
      console.log(`    Firebase: ${newUser.uid} (created)`);
      return newUser.uid;
    }
  } catch {
    const crypto = require('crypto');
    const uid = 'mt-' + crypto.createHash('sha256').update(email).digest('hex').slice(0, 24);
    console.log(`    Firebase fallback UID: ${uid}`);
    return uid;
  }
}

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  console.log('\n🏫 SEED: MULTI-TEACHER × MULTI-SECTION (Real School Setup)');
  console.log('═'.repeat(65));
  console.log(`🏫 ${SCHOOL_NAME} — Grade ${GRADE_LEVEL}`);
  console.log(`📚 ${SECTIONS.length} sections: ${SECTIONS.map(s => s.name).join(', ')}`);
  console.log(`👨‍🏫 ${TEACHERS.length} teachers (each advises 1 section, teaches 2 subjects × 4 sections)`);
  console.log(`👨‍🎓 ${STUDENT_NAMES.length} students (10 per section)`);
  console.log('═'.repeat(65));

  // ── Step 1: Firebase Auth ──────────────────────────────
  console.log('\n📋 Step 1: Firebase Auth users');
  const firebaseUids = {};
  for (const t of TEACHERS) {
    console.log(`  ${t.name} (${t.email})`);
    firebaseUids[t.email] = await getOrCreateFirebaseUser(t.email, t.name);
  }

  // ── Step 2: School ─────────────────────────────────────
  console.log('\n📋 Step 2: School');
  let schoolId;
  const { data: existingSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('name', SCHOOL_NAME)
    .eq('type', 'institutional')
    .maybeSingle();

  if (existingSchool) {
    schoolId = existingSchool.id;
    console.log(`  ✅ Exists: ${schoolId}`);
  } else {
    const { data: newSchool, error } = await supabase
      .from('schools')
      .insert({
        name: SCHOOL_NAME,
        school_id_number: '400001',
        type: 'institutional',
        region: 'Region XI - Davao Region',
        division: 'Division of Davao City',
        district: 'Davao District I',
        address: '123 Demo Street, Davao City',
        tier: 'starter',
        current_school_year: SCHOOL_YEAR,
      })
      .select('id')
      .single();

    if (error) { console.error('❌ School:', error.message); process.exit(1); }
    schoolId = newSchool.id;
    console.log(`  ✅ Created: ${schoolId}`);
  }

  // ── Step 3: Sections ───────────────────────────────────
  console.log('\n📋 Step 3: Sections');
  const sectionMap = {}; // name → id
  for (const sec of SECTIONS) {
    const { data: existing } = await supabase
      .from('sections')
      .select('id')
      .eq('school_id', schoolId)
      .eq('name', sec.name)
      .eq('grade_level', GRADE_LEVEL)
      .maybeSingle();

    if (existing) {
      sectionMap[sec.name] = existing.id;
      console.log(`  ✅ ${sec.name} exists: ${existing.id}`);
    } else {
      const { data: newSec, error } = await supabase
        .from('sections')
        .insert({
          school_id: schoolId,
          name: sec.name,
          grade_level: GRADE_LEVEL,
          school_year: SCHOOL_YEAR,
          capacity: 40,
        })
        .select('id')
        .single();

      if (error) { console.error(`❌ Section ${sec.name}:`, error.message); process.exit(1); }
      sectionMap[sec.name] = newSec.id;
      console.log(`  ✅ ${sec.name} created: ${newSec.id}`);
    }
  }

  // ── Step 4: Teachers ───────────────────────────────────
  console.log('\n📋 Step 4: Teachers');
  const teacherMap = {}; // email → { id, ... }
  for (const t of TEACHERS) {
    const uid = firebaseUids[t.email];
    const { data: existing } = await supabase
      .from('teachers')
      .select('id')
      .eq('firebase_uid', uid)
      .maybeSingle();

    let teacherId;
    if (existing) {
      await supabase.from('teachers').update({
        school_id: schoolId, role: 'teacher', name: t.name,
        position: `Adviser - ${t.adviserOf} / ${t.subjects.join(', ')}`,
      }).eq('id', existing.id);
      teacherId = existing.id;
      console.log(`  ✅ ${t.name} exists: ${teacherId}`);
    } else {
      const nameParts = t.name.split(' ');
      const { data: newT, error } = await supabase
        .from('teachers')
        .insert({
          school_id: schoolId,
          firebase_uid: uid,
          email: t.email,
          name: t.name,
          first_name: nameParts[0],
          last_name: nameParts[nameParts.length - 1],
          role: 'teacher',
          position: `Adviser - ${t.adviserOf} / ${t.subjects.join(', ')}`,
        })
        .select('id')
        .single();

      if (error) { console.error(`❌ Teacher ${t.name}:`, error.message); process.exit(1); }
      teacherId = newT.id;
      console.log(`  ✅ ${t.name} created: ${teacherId}`);
    }
    teacherMap[t.email] = { id: teacherId, ...t };
  }

  // ── Step 5: Set advisers on sections ───────────────────
  console.log('\n📋 Step 5: Adviser assignments');
  for (const t of TEACHERS) {
    const sectionId = sectionMap[t.adviserOf];
    const teacherId = teacherMap[t.email].id;
    await supabase.from('sections').update({ adviser_id: teacherId }).eq('id', sectionId);
    console.log(`  ✅ ${t.name} → adviser of ${t.adviserOf}`);
  }

  // ── Step 6: Learning areas ─────────────────────────────
  console.log('\n📋 Step 6: Learning areas');
  let { data: learningAreas } = await supabase
    .from('learning_areas')
    .select('id, code, name')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('display_order');

  if (!learningAreas || learningAreas.length === 0) {
    console.log('  Seeding default Grade 7 areas...');
    const defaults = [
      { code: 'FIL', name: 'Filipino', display_order: 1 },
      { code: 'ENGLISH', name: 'English', display_order: 2 },
      { code: 'MATH', name: 'Mathematics', display_order: 3 },
      { code: 'SCI', name: 'Science', display_order: 4 },
      { code: 'AP', name: 'Araling Panlipunan', display_order: 5 },
      { code: 'ESP', name: 'Edukasyon sa Pagpapakatao', display_order: 6 },
      { code: 'TLE', name: 'Technology and Livelihood Education', display_order: 7 },
      { code: 'MAPEH', name: 'MAPEH', display_order: 8, is_composite: true },
    ];
    const rows = defaults.map(a => ({
      school_id: schoolId, code: a.code, name: a.name,
      display_order: a.display_order, grade_level: GRADE_LEVEL,
      is_active: true, is_composite: a.is_composite || false,
    }));
    const { data: inserted, error } = await supabase.from('learning_areas').insert(rows).select('id, code, name');
    if (error) { console.error('❌ Learning areas:', error.message); process.exit(1); }
    learningAreas = inserted;
  }
  const laMap = {};
  learningAreas.forEach(la => { laMap[la.code] = la; });
  console.log(`  ✅ ${learningAreas.length} areas: ${learningAreas.map(a => a.code).join(', ')}`);

  // ── Step 7: Teaching assignments ───────────────────────
  console.log('\n📋 Step 7: Teaching assignments');
  await supabase.from('teaching_assignments').delete().eq('school_id', schoolId).eq('school_year', SCHOOL_YEAR);

  const assignmentRows = [];
  const assignmentsJsonPerTeacher = {};

  for (const t of TEACHERS) {
    const teacherId = teacherMap[t.email].id;
    assignmentsJsonPerTeacher[t.email] = [];

    // Advisory assignment for their section
    assignmentRows.push({
      teacher_id: teacherId,
      school_id: schoolId,
      school_year: SCHOOL_YEAR,
      grade_level: GRADE_LEVEL,
      section_id: sectionMap[t.adviserOf],
      section_name: t.adviserOf,
      subject: 'Section Adviser',
      hours_per_week: 0,
      is_advisory: true,
    });

    // Subject assignments: each subject × ALL 4 sections
    for (const code of t.subjects) {
      const la = laMap[code];
      if (!la) { console.warn(`  ⚠️  Learning area ${code} not found, skipping`); continue; }

      for (const sec of SECTIONS) {
        assignmentRows.push({
          teacher_id: teacherId,
          school_id: schoolId,
          school_year: SCHOOL_YEAR,
          grade_level: GRADE_LEVEL,
          section_id: sectionMap[sec.name],
          section_name: sec.name,
          subject: la.name,
          hours_per_week: 4,
          is_advisory: false,
        });

        assignmentsJsonPerTeacher[t.email].push({
          gradeLevel: GRADE_LEVEL,
          learningAreaId: la.id,
          learningAreaName: la.name,
          sectionId: sectionMap[sec.name],
          sectionName: sec.name,
          schoolYear: SCHOOL_YEAR,
        });
      }
    }
  }

  for (let i = 0; i < assignmentRows.length; i += 50) {
    const batch = assignmentRows.slice(i, i + 50);
    const { error } = await supabase.from('teaching_assignments').insert(batch);
    if (error) console.warn(`  ⚠️  Batch ${Math.floor(i/50)+1}:`, error.message);
  }
  console.log(`  ✅ ${assignmentRows.length} teaching assignments`);

  // Update teachers.assignments JSONB
  for (const t of TEACHERS) {
    await supabase.from('teachers')
      .update({ assignments: assignmentsJsonPerTeacher[t.email] })
      .eq('id', teacherMap[t.email].id);
  }
  console.log('  ✅ Teacher JSONB assignments updated');

  // ── Step 8: Students ───────────────────────────────────
  console.log('\n📋 Step 8: Students (10 per section)');
  const allStudentIds = {};

  for (let si = 0; si < SECTIONS.length; si++) {
    const sec = SECTIONS[si];
    const sectionId = sectionMap[sec.name];
    const start = si * 10;
    const batch = STUDENT_NAMES.slice(start, start + 10);

    const studentRows = batch.map((s, i) => ({
      first_name: s.first,
      last_name: s.last,
      middle_name: s.mid,
      name: [s.first, s.mid, s.last].filter(Boolean).join(' '),
      lrn: `3002002000${String(start + i + 1).padStart(2, '0')}`,
      gender: s.gender,
      school_id: schoolId,
      section_id: sectionId,
      grade_level: GRADE_LEVEL,
      enrollment_status: 'enrolled',
      date_of_birth: `${2012 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    }));

    const { error } = await supabase
      .from('students')
      .upsert(studentRows, { onConflict: 'lrn', ignoreDuplicates: false });
    if (error) console.warn(`  ⚠️  Students ${sec.name}:`, error.message);

    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('section_id', sectionId);

    allStudentIds[sec.name] = (students || []).map(s => s.id);
    console.log(`  ✅ ${sec.name}: ${(students || []).length} students`);
  }

  // ── Step 9: Grades ─────────────────────────────────────
  console.log('\n📋 Step 9: Grades');
  await supabase.from('grades').delete().eq('school_id', schoolId).eq('school_year', SCHOOL_YEAR);

  let totalGrades = 0;
  for (const sec of SECTIONS) {
    const studentIds = allStudentIds[sec.name] || [];
    const gradeRows = [];

    for (const studentId of studentIds) {
      for (const la of learningAreas) {
        const q1 = randomGrade();
        const q2 = randomGrade();
        const q3 = Math.random() < 0.6 ? randomGrade() : null;
        const q4 = Math.random() < 0.3 ? randomGrade() : null;
        const quarters = [q1, q2, q3, q4].filter(g => g !== null);
        const finalGrade = quarters.length > 0
          ? Math.round(quarters.reduce((a, b) => a + b, 0) / quarters.length)
          : null;

        gradeRows.push({
          school_id: schoolId,
          student_id: studentId,
          learning_area_id: la.id,
          school_year: SCHOOL_YEAR,
          q1, q2, q3, q4,
          final_grade: finalGrade,
          remarks: finalGrade !== null ? (finalGrade >= 75 ? 'Passed' : 'Failed') : null,
        });
      }
    }

    for (let i = 0; i < gradeRows.length; i += 100) {
      const b = gradeRows.slice(i, i + 100);
      const { error } = await supabase.from('grades').insert(b);
      if (error) console.error(`  ❌ Grades ${sec.name}:`, error.message);
      else totalGrades += b.length;
    }
  }
  console.log(`  ✅ ${totalGrades} grade records`);

  // ── Summary ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(65));
  console.log('🎉 MULTI-TEACHER × MULTI-SECTION SEED COMPLETE!');
  console.log('═'.repeat(65));

  console.log('\n  TEACHER ASSIGNMENTS:');
  console.log('  ┌──────────────────────┬─────────────────┬──────────────────────────┐');
  console.log('  │ Teacher              │ Adviser Of      │ Teaches (all 4 sections) │');
  console.log('  ├──────────────────────┼─────────────────┼──────────────────────────┤');
  for (const t of TEACHERS) {
    const name = t.name.padEnd(20);
    const adv = t.adviserOf.padEnd(15);
    const subj = t.subjects.join(', ').padEnd(24);
    console.log(`  │ ${name} │ ${adv} │ ${subj} │`);
  }
  console.log('  └──────────────────────┴─────────────────┴──────────────────────────┘');

  console.log('\n  LOGIN ACCOUNTS (password: Demo123!):');
  for (const t of TEACHERS) {
    console.log(`    📧 ${t.email.padEnd(30)} → Adviser: ${t.adviserOf}, Teaches: ${t.subjects.join('+')}`);
  }

  console.log('\n  EXPECTED BEHAVIOR (Teacher A: personal-test@edusync.ph):');
  console.log('    Section Sampaguita (is adviser):');
  console.log('      ✅ Gradebook: ENGLISH+MATH editable, others read-only');
  console.log('      ✅ Homeroom Guidance: EDITABLE');
  console.log('      ✅ Core Values: EDITABLE');
  console.log('    Section Ilang-Ilang/Rosal/Jasmine (NOT adviser):');
  console.log('      ✅ Gradebook: ENGLISH+MATH editable, others read-only');
  console.log('      ❌ Homeroom Guidance: READ-ONLY');
  console.log('      ❌ Core Values: READ-ONLY');

  console.log(`\n  🆔 School ID: ${schoolId}`);
  console.log(`  📋 Sections: ${SECTIONS.map(s => `${s.name}=${sectionMap[s.name].slice(0,8)}…`).join(', ')}`);
  console.log('\n  → Login at http://localhost:5173/admin (Staff tab)\n');
}

main().catch(err => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
