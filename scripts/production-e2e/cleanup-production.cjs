#!/usr/bin/env node
/**
 * CLEAN UP PRODUCTION FIRESTORE
 * 
 * Deletes ALL data EXCEPT demo-e2e-testing school
 * 
 * WARNING: This will delete data from production!
 * Only demo-e2e-testing data will be retained.
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';
const KEEP_SCHOOL_ID = 'demo-e2e-testing';

async function cleanupProduction() {
  // Ensure we're NOT using emulator
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n🧹 PRODUCTION FIRESTORE CLEANUP');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log(`✅ KEEP: ${KEEP_SCHOOL_ID}`);
  console.log(`❌ DELETE: All other schools and orphaned data`);
  console.log('═'.repeat(80));

  try {
    const collectionsToClean = [
      'schools',
      'students',
      'teachers',
      'sections',
      'grades',
      'coreValues',
      'coreValueGrades',
      'attendance',
      'learningAreas',
      'assignments',
      'announcements',
      'lessonPlans',
      'parents',
      'users'
    ];

    let totalDeleted = 0;
    let totalKept = 0;

    for (const collectionName of collectionsToClean) {
      console.log(`\n🔍 Cleaning ${collectionName}...`);
      
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`   ℹ️  Empty collection`);
        continue;
      }

      let batch = db.batch();
      let batchCount = 0;
      let deleted = 0;
      let kept = 0;
      const MAX_BATCH = 500;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Keep if schoolId matches OR if it's the demo school document itself
        if (data.schoolId === KEEP_SCHOOL_ID || doc.id === KEEP_SCHOOL_ID) {
          kept++;
          continue;
        }

        // Delete everything else
        batch.delete(doc.ref);
        batchCount++;
        deleted++;

        if (batchCount >= MAX_BATCH) {
          await batch.commit();
          console.log(`   💾 Deleted batch of ${batchCount} documents`);
          batch = db.batch(); // Create new batch
          batchCount = 0;
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
        console.log(`   💾 Deleted final batch of ${batchCount} documents`);
      }

      console.log(`   ✅ ${collectionName}: Deleted ${deleted}, Kept ${kept}`);
      totalDeleted += deleted;
      totalKept += kept;
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`🗑️  Total Deleted: ${totalDeleted}`);
    console.log(`✅ Total Kept (demo-e2e-testing): ${totalKept}`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

cleanupProduction()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
