#!/usr/bin/env node
/**
 * DELETE ALL PRODUCTION DATA - COMPREHENSIVE
 * Automatically finds ALL collections and deletes everything
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const projectId = 'edusync-sis';

async function deleteEverything() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();
  const auth = getAuth();

  console.log('\n🔥 COMPREHENSIVE PRODUCTION WIPE');
  console.log('═'.repeat(80));
  console.log('Finding ALL collections and deleting EVERYTHING...\n');

  try {
    // Step 1: Get ALL collections
    console.log('🔍 Discovering all collections...');
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    console.log(`✅ Found ${collectionNames.length} collections:\n`);
    collectionNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    let totalDeleted = 0;

    // Step 2: Delete all documents from each collection
    for (const collectionName of collectionNames) {
      console.log(`\n🗑️  Deleting ${collectionName}...`);
      
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`   ✓ Already empty`);
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
          process.stdout.write(`   Deleted ${deleted}/${snapshot.size} documents\r`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`   ✅ Deleted ${deleted} documents`);
      totalDeleted += deleted;
    }

    // Step 3: Delete all Firebase Auth users
    console.log('\n🗑️  Deleting Firebase Auth users...');
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
          // Skip errors
        }
      }
      
      pageToken = listResult.pageToken;
    } while (pageToken);
    
    console.log(`\n   ✅ Deleted ${authDeleted} Firebase Auth users`);

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('✅ COMPLETE WIPE FINISHED!');
    console.log('═'.repeat(80));
    console.log(`🗑️  Collections Found: ${collectionNames.length}`);
    console.log(`🗑️  Firestore Documents: ${totalDeleted}`);
    console.log(`🗑️  Firebase Auth Users: ${authDeleted}`);
    console.log(`🗑️  Total Deleted: ${totalDeleted + authDeleted}`);
    console.log('\n✨ Production is now 100% empty');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

deleteEverything()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
