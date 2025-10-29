/**
 * Delete Old Form 137 Records
 * 
 * Removes old per-year structure Form 137 records
 * Run this before testing the new cumulative structure
 */

// Force production mode - disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = '';

const admin = require('firebase-admin');

// Initialize with production credentials
admin.initializeApp({
  projectId: 'edusync-sis',
});

console.log('✅ Firebase Admin initialized (production: edusync-sis)');
console.log('');

const db = admin.firestore();

async function deleteOldForm137Records() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Delete Old Form 137 Records                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get all Form 137 records
    const snapshot = await db.collection('academicHistory').get();
    
    console.log(`📊 Total Form 137 Records: ${snapshot.size}`);
    console.log('');
    
    if (snapshot.empty) {
      console.log('ℹ️  No records to delete');
      return;
    }
    
    const toDelete = [];
    const toKeep = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.schoolYears && Array.isArray(data.schoolYears)) {
        // New structure - keep
        toKeep.push({
          id: doc.id,
          student: data.studentName
        });
      } else {
        // Old structure - delete
        toDelete.push({
          id: doc.id,
          student: data.studentName,
          schoolYear: data.schoolYear
        });
      }
    });
    
    console.log(`✅ Records to KEEP (new structure): ${toKeep.length}`);
    console.log(`🗑️  Records to DELETE (old structure): ${toDelete.length}`);
    console.log('');
    
    if (toDelete.length === 0) {
      console.log('✅ No old records to delete - all good!');
      return;
    }
    
    console.log('Deleting old records:');
    const batch = db.batch();
    
    for (const record of toDelete) {
      console.log(`   Deleting: ${record.student} - ${record.schoolYear} (${record.id})`);
      const docRef = db.collection('academicHistory').doc(record.id);
      batch.delete(docRef);
    }
    
    console.log('');
    console.log('Committing batch delete...');
    await batch.commit();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Old Records Deleted Successfully!                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Deleted ${toDelete.length} old structure record(s)`);
    console.log(`Kept ${toKeep.length} new structure record(s)`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error deleting records:', error.message);
    console.error(error);
  }
}

async function main() {
  await deleteOldForm137Records();
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Cleanup Complete                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ You can now test the new Form 137 implementation!');
  console.log('   Go to the Dashboard and use Auto-Generate to create');
  console.log('   Form 137s with the new cumulative structure.');
  console.log('');
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
