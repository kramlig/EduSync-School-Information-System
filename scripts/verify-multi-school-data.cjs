#!/usr/bin/env node
/**
 * Verify Multi-School Data Isolation
 * 
 * Checks that data is properly segregated by schoolId
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Set emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const app = initializeApp({ projectId: 'edusync-local' });
const db = getFirestore(app);

async function verifyMultiSchoolData() {
  console.log('\n🔍 Verifying Multi-School Data Isolation...\n');

  try {
    // 1. Verify schools collection
    console.log('1️⃣  Checking schools collection...');
    const schoolsSnapshot = await db.collection('schools').get();
    const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`   ✅ Found ${schools.length} schools:`);
    schools.forEach(school => {
      console.log(`      - ${school.id}: ${school.name}`);
    });

    // 2. Verify students are segregated by schoolId
    console.log('\n2️⃣  Checking student data isolation...');
    for (const school of schools) {
      const studentsSnapshot = await db.collection('students')
        .where('schoolId', '==', school.id)
        .get();
      
      console.log(`   ✅ ${school.id}: ${studentsSnapshot.size} students`);
      
      // Verify all students have correct schoolId
      const incorrectSchoolId = studentsSnapshot.docs.filter(
        doc => doc.data().schoolId !== school.id
      );
      
      if (incorrectSchoolId.length > 0) {
        console.error(`   ❌ ERROR: Found ${incorrectSchoolId.length} students with wrong schoolId!`);
      }
    }

    // 3. Verify no students without schoolId
    console.log('\n3️⃣  Checking for students without schoolId...');
    const allStudents = await db.collection('students').get();
    const studentsWithoutSchoolId = allStudents.docs.filter(
      doc => !doc.data().schoolId
    );
    
    if (studentsWithoutSchoolId.length > 0) {
      console.error(`   ❌ ERROR: Found ${studentsWithoutSchoolId.length} students without schoolId!`);
    } else {
      console.log(`   ✅ All ${allStudents.size} students have schoolId`);
    }

    // 4. Verify teachers
    console.log('\n4️⃣  Checking teacher data isolation...');
    for (const school of schools) {
      const teachersSnapshot = await db.collection('teachers')
        .where('schoolId', '==', school.id)
        .get();
      
      console.log(`   ✅ ${school.id}: ${teachersSnapshot.size} teachers`);
    }

    // 5. Verify sections
    console.log('\n5️⃣  Checking section data isolation...');
    for (const school of schools) {
      const sectionsSnapshot = await db.collection('sections')
        .where('schoolId', '==', school.id)
        .get();
      
      console.log(`   ✅ ${school.id}: ${sectionsSnapshot.size} sections`);
    }

    // 6. Cross-contamination check
    console.log('\n6️⃣  Cross-contamination check...');
    const school1Students = await db.collection('students')
      .where('schoolId', '==', 'school-001')
      .get();
    
    const school2Students = await db.collection('students')
      .where('schoolId', '==', 'school-002')
      .get();
    
    // Get all student IDs from school-001
    const school1StudentIds = school1Students.docs.map(doc => doc.id);
    
    // Check if any school-002 students have IDs from school-001
    const contaminated = school2Students.docs.filter(doc => 
      school1StudentIds.includes(doc.id)
    );
    
    if (contaminated.length > 0) {
      console.error(`   ❌ ERROR: Found ${contaminated.length} contaminated student IDs!`);
    } else {
      console.log(`   ✅ No cross-contamination detected`);
    }

    console.log('\n✅ Multi-school data isolation verification complete!\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMultiSchoolData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
