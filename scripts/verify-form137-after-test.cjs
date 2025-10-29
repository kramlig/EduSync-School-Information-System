/**
 * Verification Script - Check if Form 137 was created
 */

// Force production mode
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = '';

const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  projectId: 'edusync-sis',
});

const db = admin.firestore();

async function verifyCreation() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ Verifying Form 137 Creation                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Load test data
    if (!fs.existsSync('test-student-data.json')) {
      console.log('❌ No test data found. Run setup-manual-test.cjs first.');
      return;
    }
    
    const testData = JSON.parse(fs.readFileSync('test-student-data.json', 'utf8'));
    console.log(`📋 Test Student: ${testData.studentName}`);
    console.log(`   Student ID: ${testData.studentId}`);
    console.log(`   Record deleted at: ${testData.deletedAt}`);
    console.log('');
    
    // Check if Form 137 exists now
    console.log('🔍 Checking for Form 137 record...');
    const snapshot = await db.collection('academicHistory')
      .where('studentId', '==', testData.studentId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ NO FORM 137 FOUND!');
      console.log('');
      console.log('This means:');
      console.log('  - The save did not complete');
      console.log('  - OR there was an error during save');
      console.log('  - OR you haven\'t completed the manual test yet');
      console.log('');
    } else {
      const record = snapshot.docs[0].data();
      console.log('✅ FORM 137 FOUND!');
      console.log('');
      console.log(`📊 Record Details:`);
      console.log(`   Document ID: ${snapshot.docs[0].id}`);
      console.log(`   Student Name: ${record.studentName}`);
      console.log(`   Number of Years: ${record.schoolYears.length}`);
      console.log(`   School Years:`);
      record.schoolYears.forEach((year, idx) => {
        console.log(`      ${idx + 1}. ${year.schoolYear} - Grade ${year.gradeLevel}`);
        console.log(`         Subjects: ${year.grades.length}`);
        console.log(`         General Average: ${year.generalAverage}`);
      });
      console.log('');
      console.log('✅ Test Result: Form 137 was successfully created!');
      console.log('');
      console.log('If you saw "No Academic Record Found" in the browser,');
      console.log('this confirms the issue is with the UI loading, not the save.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyCreation()
  .then(() => {
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
