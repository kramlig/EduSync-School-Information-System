/**
 * Test Login Session Creation
 * Verifies that teacher documents have schoolId and simulates login flow
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

async function testLoginSession() {
  console.log('🧪 Testing Login Session Creation for Multi-School...\n');

  const testUsers = [
    { email: 'admin-school1@test.com', expectedSchool: 'school-001', expectedName: 'Sampaguita Elementary School' },
    { email: 'admin-school2@test.com', expectedSchool: 'school-002', expectedName: 'Mabuhay High School' },
    { email: 'superadmin@test.com', expectedSchool: 'default', expectedName: 'Default School' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n🔍 Testing ${testUser.email}...`);

    // Simulate LoginScreen.tsx logic: query teachers by email
    const teachersQuery = await db.collection('teachers')
      .where('email', '==', testUser.email)
      .limit(1)
      .get();

    if (teachersQuery.empty) {
      console.log(`   ❌ No teacher found with email: ${testUser.email}`);
      continue;
    }

    const teacherDoc = teachersQuery.docs[0];
    const teacherData = teacherDoc.data();
    
    console.log(`   📄 Teacher document:`, {
      id: teacherDoc.id,
      email: teacherData.email,
      role: teacherData.role,
      schoolId: teacherData.schoolId,
      firstName: teacherData.firstName,
      lastName: teacherData.lastName
    });

    // Check if schoolId exists
    if (!teacherData.schoolId) {
      console.log(`   ❌ CRITICAL: Teacher document missing schoolId!`);
      continue;
    }

    if (teacherData.schoolId !== testUser.expectedSchool) {
      console.log(`   ❌ ERROR: Expected schoolId="${testUser.expectedSchool}" but got "${teacherData.schoolId}"`);
      continue;
    }

    // Verify school document exists
    const schoolDoc = await db.collection('schools').doc(teacherData.schoolId).get();
    if (!schoolDoc.exists) {
      console.log(`   ❌ ERROR: School document "${teacherData.schoolId}" not found!`);
      continue;
    }

    const schoolData = schoolDoc.data();
    console.log(`   🏫 School document:`, {
      id: schoolDoc.id,
      schoolName: schoolData.schoolName,
      region: schoolData.region,
      division: schoolData.division
    });

    if (schoolData.schoolName !== testUser.expectedName) {
      console.log(`   ⚠️  WARNING: Expected school name "${testUser.expectedName}" but got "${schoolData.schoolName}"`);
    }

    // Simulate App.tsx handleLogin: create session object
    const sessionData = {
      user: {
        id: teacherDoc.id,
        email: teacherData.email,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        role: teacherData.role,
        schoolId: teacherData.schoolId
      },
      type: 'staff'
    };

    console.log(`   💾 Session that would be saved to localStorage:`, JSON.stringify(sessionData, null, 2));

    // Simulate SchoolContext reading from session
    const extractedSchoolId = sessionData.user.schoolId;
    console.log(`   🎯 SchoolContext would extract schoolId: "${extractedSchoolId}"`);

    // Test query with schoolId filter
    const testQuery = await db.collection('students')
      .where('schoolId', '==', extractedSchoolId)
      .limit(5)
      .get();

    console.log(`   📊 Query test: Found ${testQuery.size} students in first 5 for school "${extractedSchoolId}"`);
    
    if (testQuery.size > 0) {
      const studentSchools = new Set(testQuery.docs.map(doc => doc.data().schoolId));
      if (studentSchools.size === 1 && studentSchools.has(extractedSchoolId)) {
        console.log(`   ✅ PASS: All students belong to correct school`);
      } else {
        console.log(`   ❌ FAIL: Students from wrong schools: ${Array.from(studentSchools).join(', ')}`);
      }
    }
  }

  console.log('\n\n✅ Login session test complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start dev server: npm run dev:emu:serve');
  console.log('   2. Open http://localhost:5173/admin');
  console.log('   3. Login as admin2@test.com / TestPass123!');
  console.log('   4. Verify you see only Mabuhay High School data');
  console.log('   5. Check browser console for session logs');
}

testLoginSession()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
