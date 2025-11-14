/**
 * Fix Missing SchoolIDs
 * 
 * This script adds schoolId='default' to all students that are missing the schoolId field.
 * This is needed because old student documents don't have the schoolId field.
 */

const admin = require('firebase-admin');

// Ensure we're NOT connecting to emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

async function fixMissingSchoolIds() {
  console.log('🔧 Fixing students with missing schoolId...\n');
  
  try {
    const studentsSnapshot = await db.collection('students').get();
    
    const batch = db.batch();
    let fixedCount = 0;
    
    studentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // If schoolId is missing, set it to 'default'
      if (!data.schoolId) {
        console.log(`  • Adding schoolId='default' to: ${data.name} (${doc.id})`);
        batch.update(doc.ref, { schoolId: 'default' });
        fixedCount++;
      }
    });
    
    if (fixedCount === 0) {
      console.log('✅ All students already have schoolId set!');
      process.exit(0);
    }
    
    console.log(`\n📝 Updating ${fixedCount} students...`);
    await batch.commit();
    
    console.log(`✅ Successfully added schoolId='default' to ${fixedCount} students!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixMissingSchoolIds();
