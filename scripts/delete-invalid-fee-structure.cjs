#!/usr/bin/env node
/**
 * Delete invalid fee structure
 */

const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

async function deleteInvalidStructure() {
  const id = 'LndntEfqZSEXYrSxazJT';
  
  console.log(`🗑️  Deleting invalid fee structure: ${id}`);
  
  await db.collection('feeStructures').doc(id).delete();
  
  console.log('✅ Deleted');
}

deleteInvalidStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
