#!/usr/bin/env node
/**
 * DELETE ALL PRODUCTION FIRESTORE DATA
 * 
 * WARNING: This deletes EVERYTHING from production!
 * Use for fresh start only.
 * 
 * Date: November 17, 2025
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const projectId = 'edusync-sis';

async function deleteAllProduction() {
  // Ensure we're NOT using emulator
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();
  const auth = getAuth();

  console.log('\n🔥 DELETE ALL PRODUCTION DATA');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log(`❌ DELETE: EVERYTHING - Complete wipe`);
  console.log('═'.repeat(80));
  console.log('\n⚠️  WARNING: This cannot be undone!\n');

  try {
    const collectionsToDelete = [
      'schools',
      'students',
      'teachers',
      'sections',
      'grades',
      'studentGrades',
      'coreValues',
      'coreValueGrades',
      'attendance',
      'learningAreas',
      'assignments',
      'announcements',
      'lessonPlans',
      'parents',
      'users',
      'userRoles',
      'enrollments',
      'payments',
      'forms'
    ];

    let totalDeleted = 0;

    // Step 1: Delete all Firestore collections
    for (const collectionName of collectionsToDelete) {
      console.log(`\n🔍 Deleting ${collectionName}...`);
      
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`   ℹ️  Empty collection`);
        continue;
      }

      let batch = db.batch();
      let batchCount = 0;
      let deleted = 0;
      const MAX_BATCH = 500;

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        deleted++;

        if (batchCount >= MAX_BATCH) {
          await batch.commit();
          console.log(`   💾 Deleted batch of ${batchCount} documents`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
        console.log(`   💾 Deleted final batch of ${batchCount} documents`);
      }

      console.log(`   ✅ ${collectionName}: Deleted ${deleted} documents`);
      totalDeleted += deleted;
    }

    // Step 2: Delete all Firebase Auth users
    console.log('\n🔍 Deleting Firebase Auth users...');
    let authDeleted = 0;
    let pageToken;
    
    do {
      const listResult = await auth.listUsers(1000, pageToken);
      
      for (const user of listResult.users) {
        try {
          await auth.deleteUser(user.uid);
          authDeleted++;
          process.stdout.write(`   Deleted ${authDeleted} users\r`);
        } catch (error) {
          console.error(`\n   ⚠️  Failed to delete user ${user.email}:`, error.message);
        }
      }
      
      pageToken = listResult.pageToken;
    } while (pageToken);
    
    console.log(`\n   ✅ Deleted ${authDeleted} Firebase Auth users`);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ COMPLETE WIPE FINISHED!');
    console.log('═'.repeat(80));
    console.log(`🗑️  Firestore Documents Deleted: ${totalDeleted}`);
    console.log(`🗑️  Firebase Auth Users Deleted: ${authDeleted}`);
    console.log(`🗑️  Total Deleted: ${totalDeleted + authDeleted}`);
    console.log('\n✨ Production Firestore is now completely empty');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

deleteAllProduction()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
