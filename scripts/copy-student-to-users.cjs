const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

async function copyStudentFieldsToUsers() {
  try {
    const studentId = 'W0nWibNkePGk63mwBjvU';
    
    console.log('Fetching student data...');
    const studentDoc = await db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      console.log('❌ Student not found');
      return;
    }
    
    const studentData = studentDoc.data();
    console.log('Student sectionId:', studentData.sectionId);
    console.log('Student gradeLevel:', studentData.gradeLevel);
    console.log('Student name:', studentData.name);
    
    // Update users document with essential student fields
    console.log('\nUpdating users collection...');
    await db.collection('users').doc(studentId).update({
      sectionId: studentData.sectionId,
      gradeLevel: studentData.gradeLevel,
      name: studentData.name
    });
    
    console.log('✅ Users document updated');
    
    // Verify
    const userDoc = await db.collection('users').doc(studentId).get();
    const userData = userDoc.data();
    console.log('\nVerification:');
    console.log('  - Email:', userData.email);
    console.log('  - Role:', userData.role);
    console.log('  - SectionId:', userData.sectionId);
    console.log('  - GradeLevel:', userData.gradeLevel);
    console.log('  - Name:', userData.name);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

copyStudentFieldsToUsers();
