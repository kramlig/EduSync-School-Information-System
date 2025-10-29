/**
 * Manual Test Script - Form 137 Creation Issue
 * 
 * This script will:
 * 1. Delete one Form 137 record
 * 2. Provide manual testing instructions
 * 3. Check if the record appears after creation
 */

// Force production mode
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = '';

const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis',
});

console.log('✅ Firebase Admin initialized (production: edusync-sis)');
console.log('');

const db = admin.firestore();

async function setupManualTest() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ Manual Test Setup - Form 137 Creation Issue              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Find a student with Form 137
    const allRecords = await db.collection('academicHistory').limit(1).get();
    
    if (allRecords.empty) {
      console.log('❌ No Form 137 records found to delete');
      return;
    }
    
    const recordToDelete = allRecords.docs[0];
    const data = recordToDelete.data();
    
    console.log(`📋 Selected Record to Delete:`);
    console.log(`   Student: ${data.studentName}`);
    console.log(`   Student ID: ${data.studentId}`);
    console.log(`   Years: ${data.schoolYears.length}`);
    console.log(`   Document ID: ${recordToDelete.id}`);
    console.log('');
    
    // Delete it
    console.log('🗑️  Deleting record...');
    await recordToDelete.ref.delete();
    console.log('✅ Record deleted successfully!');
    console.log('');
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║ MANUAL TEST INSTRUCTIONS                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`1. Open browser: http://localhost:5173/forms/137`);
    console.log('');
    console.log(`2. Find student: ${data.studentName}`);
    console.log('');
    console.log(`3. Click "Generate Form 137" button for this student`);
    console.log('');
    console.log(`4. Wait for preview modal to appear`);
    console.log('');
    console.log(`5. Click "Confirm & Save" button`);
    console.log('');
    console.log(`6. Observe what happens:`);
    console.log(`   a) Does it navigate to /forms/137/${data.studentId}?`);
    console.log(`   b) Does it show "No Academic Record Found" OR actual Form 137?`);
    console.log(`   c) How long does it take to load?`);
    console.log('');
    console.log('7. Run this verification script after testing:');
    console.log('   node scripts/verify-form137-after-test.cjs');
    console.log('');
    
    // Save test data for verification
    require('fs').writeFileSync(
      'test-student-data.json',
      JSON.stringify({
        studentId: data.studentId,
        studentName: data.studentName,
        deletedAt: new Date().toISOString()
      }, null, 2)
    );
    
    console.log('💾 Test data saved to: test-student-data.json');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupManualTest()
  .then(() => {
    console.log('✅ Manual test setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
