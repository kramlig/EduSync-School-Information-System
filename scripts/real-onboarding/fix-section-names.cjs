/**
 * Fix: Add missing 'name' field to sections
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

async function fixSectionNames() {
  console.log('\n🔧 FIXING SECTION NAMES\n');
  
  const sectionsSnap = await db.collection('sections').get();
  const batch = db.batch();
  
  for (const doc of sectionsSnap.docs) {
    const section = doc.data();
    
    // Add 'name' field if missing (use sectionName)
    if (!section.name && section.sectionName) {
      batch.update(db.collection('sections').doc(doc.id), {
        name: section.sectionName
      });
      console.log(`✅ ${section.displayName}: Added name="${section.sectionName}"`);
    }
  }
  
  await batch.commit();
  
  console.log('\n✅ Section names fixed!\n');
}

fixSectionNames().catch(console.error);
