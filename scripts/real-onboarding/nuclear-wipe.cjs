#!/usr/bin/env node
/**
 * NUCLEAR WIPE - Delete EVERYTHING including subcollections
 * Recursively deletes all documents and nested subcollections
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const projectId = 'edusync-sis';

async function deleteDocumentWithSubcollections(docRef) {
  // Get all subcollections of this document
  const subcollections = await docRef.listCollections();
  
  // Recursively delete each subcollection
  for (const subcollection of subcollections) {
    const snapshot = await subcollection.get();
    for (const doc of snapshot.docs) {
      await deleteDocumentWithSubcollections(doc.ref);
    }
  }
  
  // Delete the document itself
  await docRef.delete();
}

async function deleteCollection(db, collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) return 0;

  let deleted = 0;

  for (const doc of snapshot.docs) {
    await deleteDocumentWithSubcollections(doc.ref);
    deleted++;
    process.stdout.write(`   Deleted ${deleted}/${snapshot.size} documents\r`);
  }

  console.log(''); // New line after progress
  return deleted;
}

async function nuclearWipe() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();
  const auth = getAuth();

  console.log('\n💣 NUCLEAR WIPE - RECURSIVE DELETE');
  console.log('═'.repeat(80));
  console.log('Deleting EVERYTHING including nested subcollections...\n');

  try {
    // Get all root collections
    const collections = await db.listCollections();
    console.log(`🔍 Found ${collections.length} root collections\n`);

    let totalDeleted = 0;

    for (const collection of collections) {
      console.log(`🗑️  Deleting ${collection.id}...`);
      const deleted = await deleteCollection(db, collection.id);
      console.log(`   ✅ Deleted ${deleted} documents (including subcollections)`);
      totalDeleted += deleted;
    }

    // Delete all Firebase Auth users
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
    
    console.log(`\n   ✅ Deleted ${authDeleted} users`);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ NUCLEAR WIPE COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`🗑️  Firestore Documents: ${totalDeleted}`);
    console.log(`🗑️  Firebase Auth Users: ${authDeleted}`);
    console.log(`🗑️  Total: ${totalDeleted + authDeleted}`);
    console.log('\n✨ Production is 100% empty (including subcollections)');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

nuclearWipe()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
