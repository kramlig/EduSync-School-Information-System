#!/usr/bin/env node
/**
 * Delete all grades and reseed from scratch
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  initializeApp({ projectId });
  const db = getFirestore();
  
  console.log('\n🗑️  Deleting all existing grades...\n');

  const snapshot = await db.collection('grades').get();
  console.log(`Found ${snapshot.size} grades to delete`);

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`   ✓ Deleted ${count} grades...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Deleted ${count} grades total\n`);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
