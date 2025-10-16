// Simple idempotency test script for local emulator
// Usage: set FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 && node idem-test.cjs

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  // Initialize admin app (will talk to emulator if FIRESTORE_EMULATOR_HOST is set)
  initializeApp();
  const db = getFirestore();

  const collection = 'users';
  const idemKey = 'test-idem-' + Date.now();
  const targetDocId = idemKey; // deterministic for this test
  const targetRef = db.doc(`${collection}/${targetDocId}`);
  const idemRef = db.doc(`_sync_idempotency/${idemKey}`);

  console.log('Starting idempotency test');
  console.log('idemKey:', idemKey);

  async function flushOnce(run) {
    console.log('\nFlush attempt', run);
    await db.runTransaction(async (tx) => {
      const idemSnap = await tx.get(idemRef);
      if (idemSnap.exists) {
        console.log('Transaction: idem record exists, skipping write');
        return;
      }
      console.log('Transaction: idem missing, writing target doc');
      tx.set(targetRef, { name: 'Idem Test ' + run, createdAt: Date.now() });
      tx.set(idemRef, { appliedAt: Date.now(), run });
    });
    const docSnap = await targetRef.get();
    const idemSnap = await idemRef.get();
    console.log('Post-flush: target exists=', docSnap.exists, 'idem exists=', idemSnap.exists);
  }

  await flushOnce(1);
  await flushOnce(2);

  console.log('\nTest complete. Document content:');
  const final = await targetRef.get();
  console.log(final.data());
}

main().catch(err => { console.error(err); process.exit(1); });
