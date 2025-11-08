#!/usr/bin/env node
/**
 * Multi-School Test Data Seeding Script
 * 
 * Creates test data for multiple schools to validate multi-tenant isolation.
 * 
 * Schools Created:
 * - school-001: Primary Elementary School (10 teachers, 100 students)
 * - school-002: Secondary High School (8 teachers, 80 students)
 * - default: Legacy/Default School (5 teachers, 50 students)
 * 
 * Test Users Created:
 * - Single-school admin (school-001)
 * - Multi-school teacher (school-001 + school-002)
 * - Single-school parent (school-001, inherited from child)
 * 
 * Usage:
 *   node scripts/seed-multi-school.cjs --useEmulator=true
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true;
  else acc[k] = v || true;
  return acc;
}, {});

const useEmulator = String(args.useEmulator || '').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || process.env.GCLOUD_PROJECT || 'edusync-local';

// Set emulator environment variables BEFORE initializing Firebase
if (useEmulator) {
  const emuHost = args.emuHost || '127.0.0.1';
  const emuPort = args.emuPort || '8086';
  const authPort = args.authPort || '9100';
  
  process.env.FIRESTORE_EMULATOR_HOST = `${emuHost}:${emuPort}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${emuHost}:${authPort}`;
  
  console.log('🔧 Multi-School Test Data Seeder');
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Use Emulator: ${useEmulator}`);
  console.log(`   Firestore Emulator: ${emuHost}:${emuPort}`);
  console.log(`   Auth Emulator: ${emuHost}:${authPort}`);
} else {
  console.log('🔧 Multi-School Test Data Seeder');
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Use Emulator: ${useEmulator}`);
}

// Initialize Firebase Admin
const app = initializeApp({ projectId });
const db = getFirestore(app);
const auth = getAuth(app);

// Helper functions
function randomId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia'];
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Castillo', 'Ramos'];

// School configurations
const schools = [
  {
    id: 'school-001',
    name: 'Sampaguita Elementary School',
    shortName: 'SES',
    address: '123 Education Ave, Manila, Metro Manila',
    principalName: 'Dr. Antonio Santos',
    numTeachers: 10,
    numStudents: 100
  },
  {
    id: 'school-002',
    name: 'Mabuhay High School',
    shortName: 'MHS',
    address: '456 Learning St, Quezon City, Metro Manila',
    principalName: 'Dr. Maria Reyes',
    numTeachers: 8,
    numStudents: 80
  },
  {
    id: 'default',
    name: 'Default School',
    shortName: 'Default',
    address: '789 Legacy Rd, Makati, Metro Manila',
    principalName: 'Principal Administrator',
    numTeachers: 5,
    numStudents: 50
  }
];

async function main() {
  console.log('\\n📚 Starting multi-school data seeding...\\n');

  try {
    // Step 1: Create schools collection
    console.log('1️⃣  Creating schools collection...');
    for (const school of schools) {
      await db.collection('schools').doc(school.id).set({
        id: school.id,
        name: school.name,
        shortName: school.shortName,
        address: school.address,
        principalName: school.principalName,
        schoolYear: '2024-2025',
        createdAt: new Date().toISOString()
      }, { merge: true });
      console.log(`   ✅ Created school: ${school.name} (${school.id})`);
    }

    // Step 2: Create test users with custom claims
    console.log('\\n2️⃣  Creating test users with custom claims...');
    
    const testUsers = [
      {
        email: 'admin-school1@test.com',
        password: 'TestPass123!',
        displayName: 'Admin School 1',
        customClaims: {
          role: 'admin',
          schoolId: 'school-001',
          schoolIds: ['school-001']
        }
      },
      {
        email: 'teacher-multi@test.com',
        password: 'TestPass123!',
        displayName: 'Multi-School Teacher',
        customClaims: {
          role: 'teacher',
          schoolId: 'school-001',
          schoolIds: ['school-001', 'school-002']
        }
      },
      {
        email: 'admin-school2@test.com',
        password: 'TestPass123!',
        displayName: 'Admin School 2',
        customClaims: {
          role: 'admin',
          schoolId: 'school-002',
          schoolIds: ['school-002']
        }
      },
      {
        email: 'superadmin@test.com',
        password: 'TestPass123!',
        displayName: 'Super Admin',
        customClaims: {
          role: 'admin',
          schoolId: 'default',
          schoolIds: ['default'],
          isSuperAdmin: true
        }
      }
    ];

    for (const user of testUsers) {
      try {
        // Try to create user
        const userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName
        });
        
        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, user.customClaims);
        
        console.log(`   ✅ Created user: ${user.email} (${user.customClaims.role})`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          // User exists, update claims
          const existingUser = await auth.getUserByEmail(user.email);
          await auth.setCustomUserClaims(existingUser.uid, user.customClaims);
          console.log(`   ♻️  Updated claims for existing user: ${user.email}`);
        } else {
          console.error(`   ❌ Error creating user ${user.email}:`, error.message);
        }
      }
    }

    // Step 3: Create teachers for each school
    console.log('\\n3️⃣  Creating teachers for each school...');
    const teachersBySchool = {};
    
    for (const school of schools) {
      teachersBySchool[school.id] = [];
      
      for (let i = 0; i < school.numTeachers; i++) {
        const teacherId = randomId('teacher');
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        
        await db.collection('teachers').doc(teacherId).set({
          id: teacherId,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${school.id}.edu.ph`,
          role: i === 0 ? 'principal' : 'teacher',
          schoolId: school.id,
          schoolIds: [school.id], // Single school by default
          createdAt: new Date().toISOString()
        });
        
        teachersBySchool[school.id].push(teacherId);
      }
      
      console.log(`   ✅ Created ${school.numTeachers} teachers for ${school.name}`);
    }

    // Step 4: Create sections for each school
    console.log('\\n4️⃣  Creating sections for each school...');
    const sectionsBySchool = {};
    const gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    const sectionNames = ['A', 'B', 'C'];
    
    for (const school of schools) {
      sectionsBySchool[school.id] = [];
      
      for (const gradeLevel of gradeLevels) {
        for (const sectionName of sectionNames) {
          const sectionId = randomId('section');
          const adviserId = pick(teachersBySchool[school.id]);
          
          await db.collection('sections').doc(sectionId).set({
            id: sectionId,
            name: `${gradeLevel} - ${sectionName}`,
            gradeLevel,
            adviserId,
            schoolId: school.id,
            schoolYear: '2024-2025',
            createdAt: new Date().toISOString()
          });
          
          sectionsBySchool[school.id].push(sectionId);
        }
      }
      
      console.log(`   ✅ Created ${sectionsBySchool[school.id].length} sections for ${school.name}`);
    }

    // Step 5: Create students for each school
    console.log('\\n5️⃣  Creating students for each school...');
    const studentsBySchool = {};
    
    for (const school of schools) {
      studentsBySchool[school.id] = [];
      
      for (let i = 0; i < school.numStudents; i++) {
        const studentId = randomId('student');
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        const sectionId = pick(sectionsBySchool[school.id]);
        
        // Generate unique LRN for each school
        const lrn = `${school.id === 'school-001' ? '1' : school.id === 'school-002' ? '2' : '9'}${String(i).padStart(11, '0')}`;
        
        await db.collection('students').doc(studentId).set({
          id: studentId,
          firstName,
          lastName,
          lrn,
          sectionId,
          schoolId: school.id,
          status: 'active',
          createdAt: new Date().toISOString()
        });
        
        studentsBySchool[school.id].push({ id: studentId, lrn });
      }
      
      console.log(`   ✅ Created ${school.numStudents} students for ${school.name}`);
    }

    // Step 6: Create test parent for school-001
    console.log('\\n6️⃣  Creating test parent...');
    const testParentEmail = 'parent-school1@test.com';
    const testStudent = studentsBySchool['school-001'][0];
    
    try {
      const parentUser = await auth.createUser({
        email: testParentEmail,
        password: 'TestPass123!',
        displayName: 'Parent School 1'
      });
      
      await auth.setCustomUserClaims(parentUser.uid, {
        role: 'parent',
        schoolId: 'school-001',
        schoolIds: ['school-001']
      });
      
      await db.collection('parents').doc(parentUser.uid).set({
        id: parentUser.uid,
        email: testParentEmail,
        firstName: 'Parent',
        lastName: 'School1',
        schoolId: 'school-001', // Inherited from child
        studentIds: [testStudent.id],
        createdAt: new Date().toISOString()
      });
      
      console.log(`   ✅ Created parent: ${testParentEmail} (linked to student LRN: ${testStudent.lrn})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`   ♻️  Parent user already exists: ${testParentEmail}`);
      } else {
        console.error(`   ❌ Error creating parent:`, error.message);
      }
    }

    // Summary
    console.log('\\n📊 Seeding Summary:');
    console.log(`   ✅ Schools: ${schools.length}`);
    console.log(`   ✅ Test users: ${testUsers.length + 1} (4 staff + 1 parent)`);
    for (const school of schools) {
      console.log(`   ✅ ${school.name}:`);
      console.log(`      - Teachers: ${school.numTeachers}`);
      console.log(`      - Sections: ${sectionsBySchool[school.id].length}`);
      console.log(`      - Students: ${school.numStudents}`);
    }
    
    console.log('\\n✅ Multi-school test data seeding complete!\\n');
    console.log('🧪 Test Credentials:');
    console.log('   Admin (School 1): admin-school1@test.com / TestPass123!');
    console.log('   Admin (School 2): admin-school2@test.com / TestPass123!');
    console.log('   Multi-School Teacher: teacher-multi@test.com / TestPass123!');
    console.log('   Super Admin: superadmin@test.com / TestPass123!');
    console.log('   Parent (School 1): parent-school1@test.com / TestPass123!');
    console.log(`   Parent's Child LRN: ${studentsBySchool['school-001'][0].lrn}\\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
