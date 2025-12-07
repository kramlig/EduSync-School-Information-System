#!/usr/bin/env node
/**
 * CREATE DEMO ACCOUNTS FOR DIVISION OFFICE PRESENTATION
 * Syncs to both Firebase Auth AND PostgreSQL
 * 
 * Usage:
 *   node scripts/create-demo-accounts-postgresql.cjs
 *   node scripts/create-demo-accounts-postgresql.cjs --project=staging
 *   node scripts/create-demo-accounts-postgresql.cjs --dry-run  # Show SQL only
 * 
 * Demo Accounts Created:
 * - 1 Admin (Principal)
 * - 1 Registrar
 * - 4 Teachers (Grade 1-6 advisers)
 * - 4 Students (different grade levels)
 * - 4 Parents (linked to students)
 * 
 * Passwords:
 * - Admin: "admin123"
 * - Teachers: "teacher123"
 * - Students: "student123"
 * - Parents: "parent123"
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION =====
const args = process.argv.slice(2);
const projectArg = args.find(arg => arg.startsWith('--project='));
const dryRun = args.includes('--dry-run');
const projectAlias = projectArg ? projectArg.split('=')[1] : 'production';

const PROJECT_MAP = {
  'production': 'edusync-sis',
  'staging': 'edusync-staging',
  'edusync-sis': 'edusync-sis',
  'edusync-staging': 'edusync-staging'
};

const PROJECT_ID = PROJECT_MAP[projectAlias] || 'edusync-sis';

console.log('🎭 CREATE DEMO ACCOUNTS FOR POSTGRESQL');
console.log('='.repeat(80));
console.log(`🎯 Target Project: ${PROJECT_ID}`);
console.log(`📝 Dry Run: ${dryRun ? 'YES (SQL only)' : 'NO (will create Firebase accounts)'}`);
console.log('='.repeat(80));

// Clear emulator environment variables (force production)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

const auth = admin.auth();

// ===== DEMO ACCOUNTS DEFINITION =====

const DEMO_ACCOUNTS = {
  admins: [
    {
      email: 'principal.demo@edusync.edu.ph',
      password: 'admin123',
      name: 'Dr. Maria Clara Santos',
      first_name: 'Maria Clara',
      last_name: 'Santos',
      role: 'admin',
      position: 'School Principal',
      employee_number: 'DEMO-001'
    },
    {
      email: 'registrar.demo@edusync.edu.ph',
      password: 'admin123',
      name: 'Juan Carlos Reyes',
      first_name: 'Juan Carlos',
      last_name: 'Reyes',
      role: 'registrar',
      position: 'School Registrar',
      employee_number: 'DEMO-002'
    }
  ],
  teachers: [
    {
      email: 'teacher1.demo@edusync.edu.ph',
      password: 'teacher123',
      name: 'Ana Marie Cruz',
      first_name: 'Ana Marie',
      last_name: 'Cruz',
      role: 'teacher',
      position: 'Teacher I',
      employee_number: 'DEMO-101',
      grade_level: 1
    },
    {
      email: 'teacher2.demo@edusync.edu.ph',
      password: 'teacher123',
      name: 'Roberto Garcia',
      first_name: 'Roberto',
      last_name: 'Garcia',
      role: 'teacher',
      position: 'Teacher II',
      employee_number: 'DEMO-102',
      grade_level: 2
    },
    {
      email: 'teacher3.demo@edusync.edu.ph',
      password: 'teacher123',
      name: 'Elena Fernandez',
      first_name: 'Elena',
      last_name: 'Fernandez',
      role: 'teacher',
      position: 'Teacher III',
      employee_number: 'DEMO-103',
      grade_level: 3
    },
    {
      email: 'teacher4.demo@edusync.edu.ph',
      password: 'teacher123',
      name: 'Michael Villanueva',
      first_name: 'Michael',
      last_name: 'Villanueva',
      role: 'teacher',
      position: 'Master Teacher I',
      employee_number: 'DEMO-104',
      grade_level: 6
    }
  ],
  students: [
    {
      email: 'student1.demo@edusync.edu.ph',
      password: 'student123',
      first_name: 'Sofia',
      last_name: 'Dela Cruz',
      lrn: '100000000001',
      grade_level: 1,
      gender: 'Female',
      birth_date: '2017-03-15'
    },
    {
      email: 'student2.demo@edusync.edu.ph',
      password: 'student123',
      first_name: 'Miguel',
      last_name: 'Santos',
      lrn: '100000000002',
      grade_level: 1,
      gender: 'Male',
      birth_date: '2017-06-22'
    },
    {
      email: 'student3.demo@edusync.edu.ph',
      password: 'student123',
      first_name: 'Isabella',
      last_name: 'Reyes',
      lrn: '100000000003',
      grade_level: 3,
      gender: 'Female',
      birth_date: '2015-09-10'
    },
    {
      email: 'student4.demo@edusync.edu.ph',
      password: 'student123',
      first_name: 'Gabriel',
      last_name: 'Garcia',
      lrn: '100000000004',
      grade_level: 6,
      gender: 'Male',
      birth_date: '2012-01-28'
    }
  ],
  parents: [
    {
      email: 'parent1.demo@edusync.edu.ph',
      password: 'parent123',
      name: 'Rosa Dela Cruz',
      contact_number: '09171234567',
      relationship: 'Mother',
      student_email: 'student1.demo@edusync.edu.ph'
    },
    {
      email: 'parent2.demo@edusync.edu.ph',
      password: 'parent123',
      name: 'Pedro Santos',
      contact_number: '09181234568',
      relationship: 'Father',
      student_email: 'student2.demo@edusync.edu.ph'
    },
    {
      email: 'parent3.demo@edusync.edu.ph',
      password: 'parent123',
      name: 'Carmen Reyes',
      contact_number: '09191234569',
      relationship: 'Mother',
      student_email: 'student3.demo@edusync.edu.ph'
    },
    {
      email: 'parent4.demo@edusync.edu.ph',
      password: 'parent123',
      name: 'Jose Garcia',
      contact_number: '09201234570',
      relationship: 'Father',
      student_email: 'student4.demo@edusync.edu.ph'
    }
  ]
};

// ===== HELPER FUNCTIONS =====

async function createOrGetAuthAccount(email, password, displayName) {
  if (dryRun) {
    return { uid: `DRY_RUN_${email.replace(/[^a-z0-9]/gi, '_')}` };
  }
  
  try {
    const existingUser = await auth.getUserByEmail(email);
    console.log(`   ℹ️  Already exists: ${email} (${existingUser.uid})`);
    return existingUser;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true
      });
      console.log(`   ✅ Created: ${email} (${userRecord.uid})`);
      return userRecord;
    }
    throw error;
  }
}

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return str.replace(/'/g, "''");
}

function generateSQL(createdAccounts) {
  let sql = `-- =====================================================
-- Demo Accounts Sync Migration (PostgreSQL)
-- Generated: ${new Date().toISOString()}
-- =====================================================
-- 
-- Run this in Supabase SQL Editor after Firebase accounts are created
--
-- =====================================================

-- Get the school ID to use for demo accounts
DO $$
DECLARE
    v_school_id UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools WHERE deleted_at IS NULL LIMIT 1;
    
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'No school found. Please create a school first.';
    END IF;
    
    RAISE NOTICE 'Using school_id: %', v_school_id;
END $$;

-- =====================================================
-- TEACHERS (Admins + Teachers)
-- =====================================================

`;

  const allTeachers = [...createdAccounts.admins, ...createdAccounts.teachers];
  
  for (const teacher of allTeachers) {
    sql += `-- ${teacher.name} (${teacher.role})
INSERT INTO teachers (
    id, school_id, firebase_uid, email, name, first_name, last_name, 
    role, position, employee_number, phone, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    '${escapeSQL(teacher.firebase_uid)}',
    '${escapeSQL(teacher.email)}',
    '${escapeSQL(teacher.name)}',
    '${escapeSQL(teacher.first_name)}',
    '${escapeSQL(teacher.last_name)}',
    '${escapeSQL(teacher.role)}',
    '${escapeSQL(teacher.position || '')}',
    '${escapeSQL(teacher.employee_number || '')}',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM teachers WHERE email = '${escapeSQL(teacher.email)}' OR firebase_uid = '${escapeSQL(teacher.firebase_uid)}'
);

-- Update existing teacher if firebase_uid changed
UPDATE teachers 
SET firebase_uid = '${escapeSQL(teacher.firebase_uid)}',
    role = '${escapeSQL(teacher.role)}',
    updated_at = NOW()
WHERE email = '${escapeSQL(teacher.email)}' AND (firebase_uid IS NULL OR firebase_uid != '${escapeSQL(teacher.firebase_uid)}');

`;
  }

  sql += `
-- =====================================================
-- STUDENTS
-- =====================================================

`;

  for (const student of createdAccounts.students) {
    sql += `-- ${student.first_name} ${student.last_name} (Grade ${student.grade_level})
INSERT INTO students (
    id, school_id, firebase_uid, email, first_name, last_name,
    lrn, grade_level, gender, birth_date, enrollment_status, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    '${escapeSQL(student.firebase_uid)}',
    '${escapeSQL(student.email)}',
    '${escapeSQL(student.first_name)}',
    '${escapeSQL(student.last_name)}',
    '${escapeSQL(student.lrn)}',
    ${student.grade_level},
    '${escapeSQL(student.gender)}',
    '${student.birth_date}',
    'enrolled',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE email = '${escapeSQL(student.email)}' OR firebase_uid = '${escapeSQL(student.firebase_uid)}' OR lrn = '${escapeSQL(student.lrn)}'
);

-- Update existing student if firebase_uid changed
UPDATE students 
SET firebase_uid = '${escapeSQL(student.firebase_uid)}',
    updated_at = NOW()
WHERE email = '${escapeSQL(student.email)}' AND (firebase_uid IS NULL OR firebase_uid != '${escapeSQL(student.firebase_uid)}');

`;
  }

  sql += `
-- =====================================================
-- PARENTS
-- =====================================================

`;

  for (const parent of createdAccounts.parents) {
    sql += `-- ${parent.name} (${parent.relationship})
INSERT INTO parents (
    id, school_id, firebase_uid, email, name, contact_number, relationship, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM schools WHERE deleted_at IS NULL LIMIT 1),
    '${escapeSQL(parent.firebase_uid)}',
    '${escapeSQL(parent.email)}',
    '${escapeSQL(parent.name)}',
    '${escapeSQL(parent.contact_number)}',
    '${escapeSQL(parent.relationship)}',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM parents WHERE email = '${escapeSQL(parent.email)}' OR firebase_uid = '${escapeSQL(parent.firebase_uid)}'
);

-- Update existing parent if firebase_uid changed
UPDATE parents 
SET firebase_uid = '${escapeSQL(parent.firebase_uid)}',
    updated_at = NOW()
WHERE email = '${escapeSQL(parent.email)}' AND (firebase_uid IS NULL OR firebase_uid != '${escapeSQL(parent.firebase_uid)}');

`;
  }

  sql += `
-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Demo Teachers' as type, COUNT(*) as count FROM teachers WHERE email LIKE '%demo@edusync%';
SELECT 'Demo Students' as type, COUNT(*) as count FROM students WHERE email LIKE '%demo@edusync%';
SELECT 'Demo Parents' as type, COUNT(*) as count FROM parents WHERE email LIKE '%demo@edusync%';

-- Test the login function with a demo account
-- SELECT * FROM get_user_by_firebase_uid('paste_firebase_uid_here');
`;

  return sql;
}

// ===== MAIN EXECUTION =====

async function main() {
  console.log('\n📋 Demo Accounts to Create:\n');
  console.log(`   👔 Admins/Staff: ${DEMO_ACCOUNTS.admins.length}`);
  console.log(`   👨‍🏫 Teachers: ${DEMO_ACCOUNTS.teachers.length}`);
  console.log(`   👨‍🎓 Students: ${DEMO_ACCOUNTS.students.length}`);
  console.log(`   👨‍👩‍👧 Parents: ${DEMO_ACCOUNTS.parents.length}`);
  console.log(`   📊 Total: ${DEMO_ACCOUNTS.admins.length + DEMO_ACCOUNTS.teachers.length + DEMO_ACCOUNTS.students.length + DEMO_ACCOUNTS.parents.length}`);
  console.log('');
  
  const createdAccounts = {
    admins: [],
    teachers: [],
    students: [],
    parents: []
  };
  
  // Create Admin accounts
  console.log('👔 Creating Admin accounts...');
  for (const admin of DEMO_ACCOUNTS.admins) {
    const userRecord = await createOrGetAuthAccount(admin.email, admin.password, admin.name);
    createdAccounts.admins.push({ ...admin, firebase_uid: userRecord.uid });
  }
  
  // Create Teacher accounts
  console.log('\n👨‍🏫 Creating Teacher accounts...');
  for (const teacher of DEMO_ACCOUNTS.teachers) {
    const userRecord = await createOrGetAuthAccount(teacher.email, teacher.password, teacher.name);
    createdAccounts.teachers.push({ ...teacher, firebase_uid: userRecord.uid });
  }
  
  // Create Student accounts
  console.log('\n👨‍🎓 Creating Student accounts...');
  for (const student of DEMO_ACCOUNTS.students) {
    const displayName = `${student.first_name} ${student.last_name}`;
    const userRecord = await createOrGetAuthAccount(student.email, student.password, displayName);
    createdAccounts.students.push({ ...student, firebase_uid: userRecord.uid });
  }
  
  // Create Parent accounts
  console.log('\n👨‍👩‍👧 Creating Parent accounts...');
  for (const parent of DEMO_ACCOUNTS.parents) {
    const userRecord = await createOrGetAuthAccount(parent.email, parent.password, parent.name);
    createdAccounts.parents.push({ ...parent, firebase_uid: userRecord.uid });
  }
  
  // Generate SQL migration
  console.log('\n📝 Generating PostgreSQL sync script...');
  const sql = generateSQL(createdAccounts);
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241206_sync_demo_accounts.sql');
  fs.writeFileSync(migrationPath, sql);
  console.log(`   ✅ SQL saved to: ${migrationPath}`);
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('✅ DEMO ACCOUNTS CREATED!');
  console.log('='.repeat(80));
  
  console.log('\n📋 CREDENTIALS SUMMARY:\n');
  
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 👔 ADMIN ACCOUNTS                                               │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const a of createdAccounts.admins) {
    console.log(`│ ${a.name.padEnd(30)} ${a.role.padEnd(12)} │`);
    console.log(`│ 📧 ${a.email.padEnd(45)} │`);
    console.log(`│ 🔑 ${a.password.padEnd(45)} │`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
  }
  
  console.log('│ 👨‍🏫 TEACHER ACCOUNTS                                             │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const t of createdAccounts.teachers) {
    console.log(`│ ${t.name.padEnd(30)} Grade ${t.grade_level}        │`);
    console.log(`│ 📧 ${t.email.padEnd(45)} │`);
    console.log(`│ 🔑 ${t.password.padEnd(45)} │`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
  }
  
  console.log('│ 👨‍🎓 STUDENT ACCOUNTS                                             │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const s of createdAccounts.students) {
    console.log(`│ ${(s.first_name + ' ' + s.last_name).padEnd(30)} Grade ${s.grade_level}        │`);
    console.log(`│ 📧 ${s.email.padEnd(45)} │`);
    console.log(`│ 🔑 ${s.password.padEnd(45)} │`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
  }
  
  console.log('│ 👨‍👩‍👧 PARENT ACCOUNTS                                              │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const p of createdAccounts.parents) {
    console.log(`│ ${p.name.padEnd(30)} ${p.relationship.padEnd(12)} │`);
    console.log(`│ 📧 ${p.email.padEnd(45)} │`);
    console.log(`│ 🔑 ${p.password.padEnd(45)} │`);
    console.log('├─────────────────────────────────────────────────────────────────┤');
  }
  console.log('└─────────────────────────────────────────────────────────────────┘');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('─'.repeat(60));
  console.log(`1. Run the SQL in Supabase SQL Editor:`);
  console.log(`   ${migrationPath}\n`);
  console.log(`2. Test login at your app URL with:`);
  console.log(`   📧 principal.demo@edusync.edu.ph`);
  console.log(`   🔑 admin123\n`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
