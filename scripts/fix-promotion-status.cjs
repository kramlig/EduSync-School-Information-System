/**
 * Fix Promotion Status Capitalization
 * 
 * Changes 'PROMOTED' to 'Promoted' in all Form 137 records
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

async function fixPromotionStatus() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ Fixing Promotion Status Capitalization                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const allRecords = await db.collection('academicHistory').get();
    
    console.log(`📊 Total Form 137 Records: ${allRecords.size}`);
    console.log('');
    
    const batch = db.batch();
    let updateCount = 0;
    
    allRecords.forEach(doc => {
      const data = doc.data();
      let needsUpdate = false;
      
      if (data.schoolYears && Array.isArray(data.schoolYears)) {
        const updatedYears = data.schoolYears.map(year => {
          if (year.promotionStatus === 'PROMOTED') {
            needsUpdate = true;
            return { ...year, promotionStatus: 'Promoted' };
          }
          return year;
        });
        
        if (needsUpdate) {
          console.log(`Fixing: ${data.studentName}`);
          batch.update(doc.ref, { 
            schoolYears: updatedYears,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
        }
      }
    });
    
    if (updateCount > 0) {
      console.log('');
      console.log('Committing updates...');
      await batch.commit();
      console.log('');
      console.log(`✅ Fixed ${updateCount} record(s)`);
    } else {
      console.log('✅ No records need fixing - all use proper capitalization');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPromotionStatus()
  .then(() => {
    console.log('');
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
