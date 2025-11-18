#!/usr/bin/env node
/**
 * DELETE ORPHANED SUBCOLLECTIONS
 * Uses collection group queries to find and delete orphaned data
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';

async function deleteOrphans() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n🔍 DELETE ORPHANED SUBCOLLECTIONS');
  console.log('═'.repeat(80));

  try {
    // Query collection group for 'courses'
    console.log('\n🔍 Searching for orphaned "courses" documents...');
    const coursesQuery = db.collectionGroup('courses');
    const coursesSnapshot = await coursesQuery.get();
    
    console.log(`Found ${coursesSnapshot.size} documents in "courses" collection group`);
    
    if (!coursesSnapshot.empty) {
      console.log('\nDeleting...');
      let deleted = 0;
      
      for (const doc of coursesSnapshot.docs) {
        console.log(`   Deleting: ${doc.ref.path}`);
        await doc.ref.delete();
        deleted++;
      }
      
      console.log(`\n✅ Deleted ${deleted} orphaned course documents`);
    }
    
    // Also check for the parent school_123 document
    console.log('\n🔍 Checking for school_123 document...');
    const schoolRef = db.collection('schools').doc('school_123');
    const schoolDoc = await schoolRef.get();
    
    if (schoolDoc.exists) {
      console.log('Found school_123, deleting...');
      await schoolRef.delete();
      console.log('✅ Deleted school_123');
    } else {
      console.log('school_123 does not exist');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ORPHAN CLEANUP COMPLETE!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    throw error;
  }
}

deleteOrphans()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
