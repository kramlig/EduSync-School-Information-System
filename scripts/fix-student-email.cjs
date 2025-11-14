const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

async function fixStudentEmail() {
  try {
    console.log('Updating Juan La Cruz email in students collection...');
    
    await db.collection('students').doc('W0nWibNkePGk63mwBjvU').update({
      email: 'juan.lacruz@student.local'  // Fix the space in email
    });
    
    console.log('✅ Email updated successfully');
    
    // Verify the update
    const doc = await db.collection('students').doc('W0nWibNkePGk63mwBjvU').get();
    console.log('✅ Verified email:', doc.data().email);
    console.log('✅ Section ID:', doc.data().sectionId);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

fixStudentEmail();
