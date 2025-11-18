#!/usr/bin/env node
/**
 * MANUAL DELETE - Delete specific document with subcollections
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';

async function deleteDocumentRecursively(docRef) {
  // Delete all subcollections first
  const subcollections = await docRef.listCollections();
  
  for (const subcollection of subcollections) {
    console.log(`   Found subcollection: ${subcollection.id}`);
    const subDocs = await subcollection.get();
    
    for (const subDoc of subDocs.docs) {
      console.log(`      Deleting: ${subcollection.id}/${subDoc.id}`);
      await deleteDocumentRecursively(subDoc.ref);
    }
  }
  
  // Delete the document itself
  await docRef.delete();
}

async function manualDelete() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n🎯 MANUAL DELETE - school_123');
  console.log('═'.repeat(80));

  try {
    const docRef = db.collection('schools').doc('school_123');
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ Document does not exist!');
      return;
    }
    
    console.log('✅ Found school_123');
    console.log('\nDeleting recursively...\n');
    
    await deleteDocumentRecursively(docRef);
    
    console.log('\n✅ Deleted school_123 and all subcollections');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

manualDelete()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
