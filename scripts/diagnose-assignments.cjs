const admin = require('firebase-admin');

const projectId = 'edusync-sis';

admin.initializeApp({
  projectId: projectId,
});

const db = admin.firestore();

async function diagnoseAssignments() {
  try {
    console.log('Diagnosing Assignments and Students...\n');
    
    // Get one assignment
    const assignmentsSnapshot = await db.collection('assignments').limit(1).get();
    
    if (assignmentsSnapshot.empty) {
      console.log('❌ No assignments found!');
      process.exit(1);
    }
    
    const assignment = assignmentsSnapshot.docs[0];
    const assignmentData = assignment.data();
    
    console.log('📋 Sample Assignment:');
    console.log(`   ID: ${assignment.id}`);
    console.log(`   Title: ${assignmentData.title}`);
    console.log(`   Section ID: ${assignmentData.sectionId}`);
    console.log(`   Learning Area ID: ${assignmentData.learningAreaId}\n`);
    
    // Get students in that section
    const studentsSnapshot = await db.collection('students')
      .where('sectionId', '==', assignmentData.sectionId)
      .limit(5)
      .get();
    
    console.log(`👥 Students in Section ${assignmentData.sectionId}:`);
    console.log(`   Total found: ${studentsSnapshot.size}\n`);
    
    if (studentsSnapshot.empty) {
      console.log('❌ No students found in this section!');
      
      // Check if ANY students exist
      const allStudentsSnapshot = await db.collection('students').limit(5).get();
      console.log(`\n📊 Total students in database (sample): ${allStudentsSnapshot.size}`);
      
      if (!allStudentsSnapshot.empty) {
        console.log('\n   Sample students and their sections:');
        allStudentsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${data.name} (${doc.id}): sectionId = ${data.sectionId || 'NONE'}`);
        });
      }
    } else {
      studentsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.name} (ID: ${doc.id})`);
      });
    }
    
    // Check the section
    const sectionDoc = await db.collection('sections').doc(assignmentData.sectionId).get();
    console.log(`\n🏫 Section ${assignmentData.sectionId}:`);
    if (sectionDoc.exists) {
      const sectionData = sectionDoc.data();
      console.log(`   Name: ${sectionData.name}`);
      console.log(`   Grade Level: ${sectionData.gradeLevel}`);
      console.log(`   Adviser: ${sectionData.adviserId}`);
    } else {
      console.log('   ❌ Section does NOT exist in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

diagnoseAssignments();
