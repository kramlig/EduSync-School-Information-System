#!/usr/bin/env node
/**
 * Seed Script: Enrique Orencia Elementary School
 * 
 * Creates in Supabase PostgreSQL + Firebase Auth:
 *   - School row in `schools`
 *   - Admin Firebase Auth account  + `teachers` row (role='admin')
 *   - Teacher Firebase Auth account + `teachers` row (Mr. Wayne Mercado, adviser)
 *   - Section: Grade 5 - Mercado in `sections`
 *   - Teaching assignment (advisory) in `teaching_assignments`
 *   - 37 students from the Nutritional Status Report in `students`
 *
 * Prerequisites:
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
 *
 * Usage:
 *   node scripts/seed-orencia-school.cjs
 *   node scripts/seed-orencia-school.cjs --dry-run     # preview only
 */

const { createClient } = require('@supabase/supabase-js');

// ── Config ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('\nSet it with:');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('  node scripts/seed-orencia-school.cjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ── Constants ────────────────────────────────────────────────────────
const SCHOOL_YEAR = '2025-2026';

// ── School ───────────────────────────────────────────────────────────
const SCHOOL_DATA = {
  name: 'Enrique Orencia Elementary School',
  school_id_number: 'DepEd-EOES-001',
  region: 'Region XI - Davao Region',
  division: 'Davao Oriental',
  district: 'Governor Generoso North',
  address: 'Governor Generoso, Davao Oriental',
  contact_email: 'eoes@deped.gov.ph',
  contact_phone: '',
  principal_name: '',
  current_school_year: SCHOOL_YEAR,
  settings: {
    features: {
      enrollment: { enabled: true },
      grading: { enabled: true },
      attendance: { enabled: true },
      reports: { enabled: true },
      financial: { enabled: false }
    },
    grading: { passingGrade: 75, quarters: 4 }
  }
};

// ── Auth accounts (Firebase Auth + teachers table) ───────────────────
const ACCOUNTS = [
  {
    email: 'admin@eoes.edusync.ph',
    password: 'Admin123!',
    displayName: 'EOES Admin',
    role: 'admin',
    first_name: 'EOES',
    last_name: 'Admin',
    employee_number: 'A-EOES-001',
    specialization: 'Administration'
  },
  {
    email: 'wayne.mercado@eoes.edusync.ph',
    password: 'Teacher123!',
    displayName: 'Wayne Mercado',
    role: 'teacher',
    first_name: 'Wayne',
    last_name: 'Mercado',
    employee_number: 'T-EOES-001',
    specialization: 'General Education'
  }
];

// ── Students from Nutritional Status Report ──────────────────────────
// Grade 5 - Mercado, SY 2025-2026, Date of Weighing: June 16, 2025
const RAW_STUDENTS = [
  { no: 1,  name: 'AMORA, XHANDER I.',               bday: '2013-10-20', sex: 'Male' },
  { no: 2,  name: 'APAY, DANIEL JHON A.',             bday: null,         sex: 'Male' },
  { no: 3,  name: 'BANGA, RANDIL B.',                  bday: '2014-11-15', sex: 'Male' },
  { no: 4,  name: 'BENALUAK, MARK JOHN D.',           bday: '2015-04-20', sex: 'Male' },
  { no: 5,  name: 'BIBO, JHON CARLO L.',              bday: null,         sex: 'Male' },
  { no: 6,  name: 'BURIAS, DIONESIO III D.',          bday: '2015-07-10', sex: 'Male' },
  { no: 7,  name: 'CAJEGAS, LUKE NATHANIEL',          bday: null,         sex: 'Male' },
  { no: 8,  name: 'CONLAYAN, AIKEL S.',               bday: '2015-07-10', sex: 'Male' },
  { no: 9,  name: 'ISIDRO, DAVE C.',                  bday: null,         sex: 'Male' },
  { no: 10, name: 'JUNGAO, PRINCE RODE L.',           bday: '2015-06-13', sex: 'Male' },
  { no: 11, name: 'LIBANON, EMIL GEORG.',             bday: '2015-12-16', sex: 'Male' },
  { no: 12, name: 'MASLOG, JHON ANGELO E.',           bday: null,         sex: 'Male' },
  { no: 13, name: 'PACATANG, JAREED O.',              bday: null,         sex: 'Male' },
  { no: 14, name: 'PERPETUA, DANIEL P.',              bday: '2014-12-20', sex: 'Male' },
  { no: 15, name: 'PLENOS, LIAM NYGEL',               bday: '2015-05-14', sex: 'Male' },
  { no: 16, name: 'RULONA, ENREY PAUL G.',            bday: null,         sex: 'Male' },
  { no: 17, name: 'SALANG, SHINSUE L.',               bday: null,         sex: 'Male' },
  { no: 18, name: 'SATOJETO, JONEL L.',               bday: '2015-01-25', sex: 'Male' },
  { no: 19, name: 'SOLO, JOHN RENZ O.',               bday: '2014-09-16', sex: 'Male' },
  { no: 20, name: 'TANO, LOUDZ CYRIL C.',             bday: null,         sex: 'Male' },
  { no: 21, name: 'VALENZONA, HEROISM H.',            bday: null,         sex: 'Male' },
  { no: 22, name: 'AGACITA, CZARINA AKEMI N.',        bday: null,         sex: 'Female' },
  { no: 23, name: 'ANTONINO, SOFIA CLAUDETTE',        bday: '2015-02-07', sex: 'Female' },
  { no: 24, name: 'BAGAYO, NICOLE A.',                bday: '2014-09-10', sex: 'Female' },
  { no: 25, name: 'BARDA, HANGEL HERA M.',            bday: '2015-01-20', sex: 'Female' },
  { no: 26, name: 'DE GUZMAN, PRINCESS EDEN M.',      bday: null,         sex: 'Female' },
  { no: 27, name: 'DULZA, KHIANNA MILES',             bday: '2015-05-24', sex: 'Female' },
  { no: 28, name: 'MACASAMBA, ALEXSA S.',              bday: '2015-01-05', sex: 'Female' },
  { no: 29, name: 'MANIQUEZ, JENELYN D.',             bday: '2015-10-24', sex: 'Female' },
  { no: 30, name: 'MEHANG, HANEFA A.',                bday: null,         sex: 'Female' },
  { no: 31, name: 'MIQUE, YZAH M.',                   bday: '2014-10-18', sex: 'Female' },
  { no: 32, name: 'OLASIMAN, SHANE T.',               bday: '2014-12-14', sex: 'Female' },
  { no: 33, name: 'PANAY, JANUELAH S.',               bday: '2015-01-28', sex: 'Female' },
  { no: 34, name: 'PANDIAN, IVE JAY L.',              bday: '2015-03-01', sex: 'Female' },
  { no: 35, name: 'REGODON, JONALYN F.',              bday: '2014-09-06', sex: 'Female' },
  { no: 36, name: 'TOGONON, MARY JOY',                bday: '2015-08-21', sex: 'Female' },
  { no: 37, name: 'CABALLES, MELISA',                 bday: '2015-08-03', sex: 'Female' },
];

// ── Helpers ──────────────────────────────────────────────────────────
function parseName(raw) {
  const parts = raw.split(',').map(s => s.trim());
  const lastName = parts[0] || '';
  const rest = parts[1] || '';
  const restParts = rest.split(/\s+/);
  let firstName = rest;
  let middleName = '';
  if (restParts.length > 1) {
    const last = restParts[restParts.length - 1];
    if (/^[A-Z]\.$/.test(last)) {
      middleName = last;
      firstName = restParts.slice(0, -1).join(' ');
    }
  }
  return { firstName, middleName, lastName };
}

function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Main ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('🏫 Seeding Enrique Orencia Elementary School');
  console.log(`📍 Supabase: ${SUPABASE_URL}`);
  console.log(`📋 School Year: ${SCHOOL_YEAR}`);
  if (DRY_RUN) console.log('⚠️  DRY RUN — no data will be written\n');
  else console.log('');

  // ────────────────────────────────────────────────────────────────────
  // 1. Create school
  // ────────────────────────────────────────────────────────────────────
  console.log('1️⃣  Creating school...');
  let schoolId;

  if (!DRY_RUN) {
    // Check if school already exists
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('school_id_number', SCHOOL_DATA.school_id_number)
      .single();

    if (existing) {
      schoolId = existing.id;
      console.log(`   ⚠️  School already exists (ID: ${schoolId}), reusing`);
    } else {
      const { data, error } = await supabase
        .from('schools')
        .insert([SCHOOL_DATA])
        .select()
        .single();
      if (error) throw new Error(`School insert failed: ${error.message}`);
      schoolId = data.id;
      console.log(`   ✅ ${data.name} (ID: ${schoolId})`);
    }
  } else {
    schoolId = '<dry-run-school-id>';
    console.log(`   [DRY] Would create: ${SCHOOL_DATA.name}`);
  }

  // ────────────────────────────────────────────────────────────────────
  // 2. Create Firebase Auth accounts + teachers rows
  // ────────────────────────────────────────────────────────────────────
  console.log('\n2️⃣  Creating accounts (Firebase Auth + PostgreSQL)...');

  let firebaseAvailable = false;
  let auth;
  try {
    const adminApp = require('firebase-admin/app');
    const adminAuth = require('firebase-admin/auth');
    // Only init if not already initialized
    try { adminApp.initializeApp({ projectId: 'edusync-sis' }); } catch (_) { /* already init */ }
    auth = adminAuth.getAuth();
    firebaseAvailable = true;
  } catch (_) {
    console.log('   ⚠️  firebase-admin not available, skipping Auth account creation');
    console.log('   📄 Will still create teacher rows in PostgreSQL\n');
  }

  const teacherIds = {}; // email -> teacher row id

  for (const acct of ACCOUNTS) {
    let firebaseUid = `seed_${acct.email.replace(/[@.]/g, '_')}`;

    // Firebase Auth
    if (firebaseAvailable && !DRY_RUN) {
      try {
        const existing = await auth.getUserByEmail(acct.email);
        firebaseUid = existing.uid;
        console.log(`   ⚠️  Auth: ${acct.email} already exists (UID: ${firebaseUid})`);
      } catch (_) {
        const newUser = await auth.createUser({
          email: acct.email,
          password: acct.password,
          displayName: acct.displayName,
          emailVerified: true
        });
        firebaseUid = newUser.uid;
        console.log(`   ✅ Auth: ${acct.email} (UID: ${firebaseUid})`);
      }

      await auth.setCustomUserClaims(firebaseUid, {
        role: acct.role,
        schoolId: schoolId
      });
    } else if (DRY_RUN) {
      console.log(`   [DRY] Would create Auth: ${acct.email} (${acct.role})`);
    }

    // PostgreSQL teachers table
    if (!DRY_RUN) {
      const { data: existingTeacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', acct.email)
        .single();

      if (existingTeacher) {
        teacherIds[acct.email] = existingTeacher.id;
        console.log(`   ⚠️  Teacher row: ${acct.email} already exists (ID: ${existingTeacher.id})`);
      } else {
        const { data, error } = await supabase
          .from('teachers')
          .insert([{
            school_id: schoolId,
            firebase_uid: firebaseUid,
            email: acct.email,
            name: acct.displayName,
            first_name: acct.first_name,
            last_name: acct.last_name,
            role: acct.role,
            employee_number: acct.employee_number,
            specialization: acct.specialization
          }])
          .select()
          .single();
        if (error) throw new Error(`Teacher insert failed for ${acct.email}: ${error.message}`);
        teacherIds[acct.email] = data.id;
        console.log(`   ✅ Teacher: ${data.name} (${acct.role}) — ID: ${data.id}`);
      }
    } else {
      teacherIds[acct.email] = '<dry-run-teacher-id>';
      console.log(`   [DRY] Would insert teacher: ${acct.displayName} (${acct.role})`);
    }
  }

  const mercadoTeacherId = teacherIds['wayne.mercado@eoes.edusync.ph'];

  // ────────────────────────────────────────────────────────────────────
  // 3. Create section
  // ────────────────────────────────────────────────────────────────────
  console.log('\n3️⃣  Creating section: Grade 5 - Mercado...');
  let sectionId;

  if (!DRY_RUN) {
    const { data: existingSec } = await supabase
      .from('sections')
      .select('id')
      .eq('school_id', schoolId)
      .eq('name', 'Mercado')
      .eq('grade_level', 5)
      .eq('school_year', SCHOOL_YEAR)
      .single();

    if (existingSec) {
      sectionId = existingSec.id;
      console.log(`   ⚠️  Section already exists (ID: ${sectionId})`);
    } else {
      const { data, error } = await supabase
        .from('sections')
        .insert([{
          school_id: schoolId,
          name: 'Mercado',
          grade_level: 5,
          school_year: SCHOOL_YEAR,
          adviser_id: mercadoTeacherId,
          capacity: 45
        }])
        .select()
        .single();
      if (error) throw new Error(`Section insert failed: ${error.message}`);
      sectionId = data.id;
      console.log(`   ✅ Grade 5 - Mercado (ID: ${sectionId})`);
    }
  } else {
    sectionId = '<dry-run-section-id>';
    console.log('   [DRY] Would create: Grade 5 - Mercado');
  }

  // ────────────────────────────────────────────────────────────────────
  // 4. Create teaching assignment (advisory)
  // ────────────────────────────────────────────────────────────────────
  console.log('\n4️⃣  Creating teaching assignment (advisory)...');
  if (!DRY_RUN) {
    const { data: existingAssign } = await supabase
      .from('teaching_assignments')
      .select('id')
      .eq('teacher_id', mercadoTeacherId)
      .eq('section_id', sectionId)
      .eq('is_advisory', true)
      .single();

    if (existingAssign) {
      console.log(`   ⚠️  Assignment already exists (ID: ${existingAssign.id})`);
    } else {
      const { data, error } = await supabase
        .from('teaching_assignments')
        .insert([{
          teacher_id: mercadoTeacherId,
          school_id: schoolId,
          school_year: SCHOOL_YEAR,
          grade_level: 5,
          section_id: sectionId,
          subject: 'All Subjects (Advisory)',
          is_advisory: true
        }])
        .select()
        .single();
      if (error) {
        console.log(`   ⚠️  Assignment insert skipped: ${error.message}`);
      } else {
        console.log(`   ✅ Advisory assignment (ID: ${data.id})`);
      }
    }
  } else {
    console.log('   [DRY] Would create advisory assignment for Mr. Mercado');
  }

  // ────────────────────────────────────────────────────────────────────
  // 5. Create 37 students
  // ────────────────────────────────────────────────────────────────────
  console.log(`\n5️⃣  Creating ${RAW_STUDENTS.length} students...`);

  const studentRows = RAW_STUDENTS.map(r => {
    const { firstName, middleName, lastName } = parseName(r.name);
    const fName = toTitleCase(firstName);
    const lName = toTitleCase(lastName);
    const fullName = middleName ? `${fName} ${middleName} ${lName}` : `${fName} ${lName}`;
    const paddedNo = String(r.no).padStart(4, '0');
    const lrn = `1200${SCHOOL_YEAR.replace('-', '').slice(0, 4)}${paddedNo}`;

    return {
      school_id: schoolId,
      lrn,
      name: fullName,
      first_name: fName,
      middle_name: middleName || null,
      last_name: lName,
      gender: r.sex,
      date_of_birth: r.bday || '2015-01-01', // placeholder for missing DOB
      section_id: sectionId,
      grade_level: 5,
      enrollment_status: 'enrolled',
      address: 'Governor Generoso, Davao Oriental'
    };
  });

  if (!DRY_RUN) {
    const { data, error } = await supabase
      .from('students')
      .insert(studentRows)
      .select('id, name, lrn, gender');

    if (error) throw new Error(`Students insert failed: ${error.message}`);

    console.log(`   ✅ Inserted ${data.length} students\n`);

    // Summary table
    console.log('  ┌─────┬──────────────────────────────────┬──────────────────┬────────┐');
    console.log('  │  #  │ Student Name                     │ LRN              │ Sex    │');
    console.log('  ├─────┼──────────────────────────────────┼──────────────────┼────────┤');
    data.forEach((s, i) => {
      const no = String(i + 1).padStart(2, ' ');
      const nm = (s.name || '').padEnd(32);
      const lrn = (s.lrn || '').padEnd(16);
      const sex = (s.gender || '').padEnd(6);
      console.log(`  │ ${no}  │ ${nm} │ ${lrn} │ ${sex} │`);
    });
    console.log('  └─────┴──────────────────────────────────┴──────────────────┴────────┘');
  } else {
    console.log(`   [DRY] Would insert ${studentRows.length} students`);
    studentRows.forEach(s => console.log(`     - ${s.name} (${s.lrn}) — ${s.gender}`));
  }

  // ────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅ SEED COMPLETE — Enrique Orencia Elementary School');
  console.log('═'.repeat(60));
  console.log(`\n📌 Login credentials:`);
  console.log(`   Admin:   admin@eoes.edusync.ph / Admin123!`);
  console.log(`   Teacher: wayne.mercado@eoes.edusync.ph / Teacher123!`);
  console.log(`\n📋 Data summary:`);
  console.log(`   School:   ${SCHOOL_DATA.name}`);
  console.log(`   District: Governor Generoso North`);
  console.log(`   Division: Davao Oriental`);
  console.log(`   Region:   Region XI - Davao Region`);
  console.log(`   Section:  Grade 5 - Mercado (adviser: Mr. Wayne Mercado)`);
  console.log(`   Students: ${RAW_STUDENTS.length}`);
  console.log(`   SY:       ${SCHOOL_YEAR}\n`);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
