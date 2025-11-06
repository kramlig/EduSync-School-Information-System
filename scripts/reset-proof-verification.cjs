#!/usr/bin/env node
/**
 * Reset payment proof verification status for testing
 */

const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

async function resetProofVerification() {
  console.log('🔄 Resetting payment proof verification...\n');

  try {
    const proofsSnapshot = await db.collection('paymentProofs')
      .where('studentId', '==', 'student-0001')
      .get();

    if (proofsSnapshot.empty) {
      console.log('No payment proofs found for Juan Garcia');
      return;
    }

    console.log(`Found ${proofsSnapshot.docs.length} payment proofs. Resetting to PENDING...\n`);

    for (const doc of proofsSnapshot.docs) {
      const data = doc.data();
      console.log(`Resetting: ${doc.id}`);
      console.log(`  Amount: ₱${data.amount}`);
      console.log(`  Current Status: ${data.status}`);
      
      await doc.ref.update({
        status: 'pending',
        verifiedBy: admin.firestore.FieldValue.delete(),
        verifiedByName: admin.firestore.FieldValue.delete(),
        verifiedAt: admin.firestore.FieldValue.delete()
      });
      
      console.log(`  ✅ Reset to PENDING\n`);
    }

    console.log('✨ All payment proofs reset!');
    console.log('\n📋 Now you can:');
    console.log('   1. Refresh the Payment Recording page');
    console.log('   2. Search for Juan Garcia');
    console.log('   3. Click "Verify" on a payment proof');
    console.log('   4. It will automatically record the payment!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetProofVerification()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
