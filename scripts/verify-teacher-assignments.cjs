#!/usr/bin/env node
/**
 * Verify Teacher Section Assignments
 * Checks if teacher@edusync-demo.ph has proper section assignments
 */

const projectId = 'edusync-staging';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  // Connect to staging (not emulator)
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  try {
    const teacherUID = '87YNvPlX90RaB2MWtQzKWiG5Osp2';
    
    console.log('\n🔍 VERIFYING TEACHER ASSIGNMENTS');
    console.log('═'.repeat(80));
    
    // 1. Check teacher document
    console.log('\n1️⃣  TEACHER DOCUMENT:');
    console.log('─'.repeat(80));
    const teacherDoc = await db.collection('teachers').doc(teacherUID).get();
    if (teacherDoc.exists) {
      const data = teacherDoc.data();
      console.log(`   ✅ Teacher exists: ${data.firstName} ${data.lastName}`);
      console.log(`   📧 Email: ${data.email}`);
      console.log(`   🏫 School ID: ${data.schoolId}`);
      console.log(`   📋 Role: ${data.role}`);
    } else {
      console.log('   ❌ Teacher document NOT FOUND!');
    }
    
    // 2. Check sections where teacher is adviser
    console.log('\n2️⃣  SECTIONS WHERE TEACHER IS ADVISER:');
    console.log('─'.repeat(80));
    const sectionsQuery = await db.collection('sections')
      .where('adviserId', '==', teacherUID)
      .get();
    
    if (sectionsQuery.empty) {
      console.log('   ❌ NO SECTIONS FOUND where adviserId = teacher UID');
    } else {
      console.log(`   ✅ Found ${sectionsQuery.size} sections`);
      for (const doc of sectionsQuery.docs) {
        const section = doc.data();
        console.log(`\n   📚 Section: ${doc.id}`);
        console.log(`      Name: ${section.name}`);
        console.log(`      Grade Level: ${section.gradeLevel}`);
        console.log(`      School ID: ${section.schoolId}`);
        console.log(`      Adviser ID: ${section.adviserId}`);
        
        // Count students in this section
        const studentsQuery = await db.collection('students')
          .where('sectionId', '==', doc.id)
          .get();
        console.log(`      👨‍🎓 Students: ${studentsQuery.size}`);
      }
    }
    
    // 3. Check class schedules where teacher teaches
    console.log('\n3️⃣  CLASS SCHEDULES WHERE TEACHER TEACHES:');
    console.log('─'.repeat(80));
    const schedulesQuery = await db.collection('classSchedules')
      .where('teacherId', '==', teacherUID)
      .get();
    
    if (schedulesQuery.empty) {
      console.log('   ℹ️  No class schedules (not required for adviser access)');
    } else {
      console.log(`   ✅ Found ${schedulesQuery.size} class schedules`);
    }
    
    // 4. Check students that teacher should be able to access
    console.log('\n4️⃣  STUDENTS ACCESSIBLE TO TEACHER:');
    console.log('─'.repeat(80));
    
    // Get all section IDs where teacher is adviser
    const sectionIds = sectionsQuery.docs.map(doc => doc.id);
    
    if (sectionIds.length > 0) {
      const studentsQuery = await db.collection('students')
        .where('schoolId', '==', 'default')
        .where('sectionId', 'in', sectionIds)
        .get();
      
      console.log(`   ✅ Total students in teacher's sections: ${studentsQuery.size}`);
      
      if (studentsQuery.size > 0) {
        console.log('\n   Sample students:');
        studentsQuery.docs.slice(0, 5).forEach(doc => {
          const student = doc.data();
          console.log(`      - ${student.firstName} ${student.lastName} (${doc.id}) - Section: ${student.sectionId}`);
        });
      }
    } else {
      console.log('   ❌ No sections assigned, so no students accessible');
    }
    
    // 5. Check grades for accessible students
    console.log('\n5️⃣  GRADES FOR ACCESSIBLE STUDENTS:');
    console.log('─'.repeat(80));
    
    if (sectionIds.length > 0) {
      const studentsQuery = await db.collection('students')
        .where('schoolId', '==', 'default')
        .where('sectionId', 'in', sectionIds)
        .get();
      
      const studentIds = studentsQuery.docs.map(doc => doc.id);
      
      if (studentIds.length > 0) {
        // Firestore 'in' query limited to 10 items
        const batchSize = 10;
        let totalGrades = 0;
        
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          const gradesQuery = await db.collection('grades')
            .where('studentId', 'in', batch)
            .get();
          totalGrades += gradesQuery.size;
        }
        
        console.log(`   ✅ Total grades for teacher's students: ${totalGrades}`);
      } else {
        console.log('   ℹ️  No students, so no grades');
      }
    } else {
      console.log('   ℹ️  No sections assigned, cannot check grades');
    }
    
    // 6. Summary
    console.log('\n6️⃣  SUMMARY:');
    console.log('═'.repeat(80));
    
    const hasAdvisedSections = sectionsQuery.size > 0;
    
    if (hasAdvisedSections) {
      console.log('   ✅ Teacher has section assignments');
      console.log('   ✅ Teacher should be able to access gradebook');
      console.log('\n   💡 If gradebook still shows "Loading...", the issue is likely:');
      console.log('      1. Frontend query logic filtering out these sections');
      console.log('      2. Firestore security rules blocking access');
      console.log('      3. useSchoolData hook not handling teacher role correctly');
    } else {
      console.log('   ❌ Teacher has NO section assignments');
      console.log('   ❌ Gradebook will show "Loading..." indefinitely');
      console.log('\n   🔧 Run: node scripts/assign-teacher-sections.cjs');
    }
    
    console.log('\n✅ Verification complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
