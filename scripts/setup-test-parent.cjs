#!/usr/bin/env node
/**
 * Setup test parent account with Juan Garcia as child
 */

const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

async function setupTestParent() {
  console.log('🔧 Setting up test parent account...\n');

  try {
    // Step 1: Find or create test parent
    console.log('Step 1: Finding/creating parent account...');
    const parentEmail = 'parent1@example.com';
    
    let parentDoc = await db.collection('users')
      .where('email', '==', parentEmail)
      .get();

    let parentId;
    if (parentDoc.empty) {
      console.log('Creating new parent account...');
      const parentRef = await db.collection('users').add({
        email: parentEmail,
        firstName: 'Test',
        lastName: 'Parent',
        role: 'parent',
        isActive: true,
        createdAt: new Date().toISOString()
      });
      parentId = parentRef.id;
      console.log(`✅ Created parent: ${parentId}`);
    } else {
      parentId = parentDoc.docs[0].id;
      console.log(`✅ Found existing parent: ${parentId}`);
    }

    // Step 2: Link Juan Garcia to this parent
    console.log('\nStep 2: Linking Juan Garcia to parent...');
    const studentSnapshot = await db.collection('students')
      .where('firstName', '==', 'Juan')
      .where('lastName', '==', 'Garcia')
      .get();

    if (studentSnapshot.empty) {
      console.error('❌ Juan Garcia not found!');
      process.exit(1);
    }

    const studentId = studentSnapshot.docs[0].id;
    const studentData = studentSnapshot.docs[0].data();

    // Update student with parent info
    await db.collection('students').doc(studentId).update({
      parentId: parentId,
      parentEmail: parentEmail,
      parentName: 'Test Parent'
    });

    console.log(`✅ Linked ${studentData.firstName} ${studentData.lastName} to parent`);

    // Step 3: Verify billing ledger exists
    console.log('\nStep 3: Verifying billing ledger...');
    const ledgerId = `${studentId}_2024-2025`;
    const ledgerDoc = await db.collection('studentLedgers').doc(ledgerId).get();

    if (ledgerDoc.exists) {
      const ledger = ledgerDoc.data();
      console.log(`✅ Billing ledger exists`);
      console.log(`   Balance: ₱${ledger.balance.toFixed(2)}`);
      console.log(`   Total Charges: ₱${ledger.totalCharges.toFixed(2)}`);
      console.log(`   Total Payments: ₱${ledger.totalPayments.toFixed(2)}`);
    } else {
      console.log('⚠️  No billing ledger found - tests may fail');
    }

    console.log('\n✨ SUCCESS! Test parent account ready');
    console.log('\n📋 Test Credentials:');
    console.log(`   Email: ${parentEmail}`);
    console.log(`   Password: password`);
    console.log(`   Child: ${studentData.firstName} ${studentData.lastName}`);
    console.log('\n📝 Now Playwright tests should work for parent portal!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupTestParent()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
