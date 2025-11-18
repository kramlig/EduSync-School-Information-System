#!/usr/bin/env node
/**
 * Fix Missing SchoolId in Enrollment Applications
 * 
 * Updates all enrollment applications without a schoolId to use 'default'
 */

const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({projectId: 'edusync-sis'});
const db = admin.firestore();

async function fixMissingSchoolIds() {
  console.log('🔧 Fixing enrollment applications without schoolId...\n');
  
  const batch = db.batch();
  let count = 0;
  
  const snapshot = await db.collection('enrollmentApplications').get();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    if (!data.schoolId) {
      console.log(`Fixing: ${data.applicationNumber || doc.id} - Adding schoolId: default`);
      batch.update(doc.ref, { schoolId: 'default' });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`\n✅ Updated ${count} applications with schoolId: default`);
  } else {
    console.log('\n✅ All applications already have schoolId');
  }
  
  process.exit(0);
}

fixMissingSchoolIds().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
