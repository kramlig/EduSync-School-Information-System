#!/usr/bin/env node
/**
 * CHECK TEACHER ASSIGNMENTS - Production E2E
 * Verifies that teacher-demo@edusync.ph has the assignments array
 */

const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';

async function checkTeacherAssignments() {
  // Ensure we're NOT using emulator
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const auth = getAuth();
  const db = getFirestore();

  console.log('\n🔍 CHECKING TEACHER ASSIGNMENTS');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('═'.repeat(80));

  try {
    // Get teacher by email
    const email = 'teacher-demo@edusync.ph';
    console.log(`\n1️⃣  Looking for teacher: ${email}`);
    
    const userRecord = await auth.getUserByEmail(email);
    console.log(`   ✅ Found in Auth: UID ${userRecord.uid}`);
    
    // Get teacher document
    const teacherDoc = await db.collection('teachers').doc(userRecord.uid).get();
    
    if (!teacherDoc.exists) {
      console.log('   ❌ Teacher document not found!');
      return;
    }
    
    const teacherData = teacherDoc.data();
    console.log(`   ✅ Teacher document found`);
    console.log(`   📧 Email: ${teacherData.email}`);
    console.log(`   👤 Name: ${teacherData.firstName} ${teacherData.lastName}`);
    console.log(`   🏫 School ID: ${teacherData.schoolId}`);
    
    // Check for assignments array
    console.log(`\n2️⃣  Checking assignments array...`);
    if (teacherData.assignments && Array.isArray(teacherData.assignments)) {
      console.log(`   ✅ Has assignments array with ${teacherData.assignments.length} items`);
      
      if (teacherData.assignments.length > 0) {
        console.log(`\n   📚 Sample assignments:`);
        teacherData.assignments.slice(0, 3).forEach((assignment, idx) => {
          console.log(`      ${idx + 1}. Section: ${assignment.sectionId}`);
          console.log(`         Subject: ${assignment.subjectId}`);
          if (assignment.gradeLevel) console.log(`         Grade: ${assignment.gradeLevel}`);
        });
      }
    } else {
      console.log(`   ❌ NO ASSIGNMENTS ARRAY FOUND!`);
      console.log(`   🔧 This will cause infinite loading in gradebook!`);
    }
    
    // Check sections where teacher is adviser
    console.log(`\n3️⃣  Checking adviser sections...`);
    const sectionsSnapshot = await db.collection('sections')
      .where('adviserUid', '==', userRecord.uid)
      .get();
    
    console.log(`   Found ${sectionsSnapshot.size} sections where teacher is adviser`);
    
    sectionsSnapshot.forEach(doc => {
      const section = doc.data();
      console.log(`   - ${section.sectionName} (Grade ${section.gradeLevel})`);
    });
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

checkTeacherAssignments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
