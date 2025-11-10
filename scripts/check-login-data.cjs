#!/usr/bin/env node
/**
 * Check if login test accounts exist in the emulator
 * This bypasses security rules using the Admin SDK with proper auth
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize without credentials for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

const app = initializeApp({
  projectId: 'edusync-local'
});

const db = getFirestore(app);

async function checkLoginAccounts() {
  console.log('🔍 Checking login test accounts in emulator...\n');
  
  const testAccounts = [
    { email: 'admin-school1@test.com', collection: 'teachers' },
    { email: 'admin-school2@test.com', collection: 'teachers' },
    { email: 'teacher-multi@test.com', collection: 'teachers' },
    { email: 'superadmin@test.com', collection: 'teachers' },
    { email: 'parent-school1@test.com', collection: 'parents' },
  ];
  
  for (const account of testAccounts) {
    try {
      const snapshot = await db.collection(account.collection)
        .where('email', '==', account.email)
        .get();
      
      if (snapshot.empty) {
        console.log(`❌ NOT FOUND: ${account.email} in ${account.collection}`);
      } else {
        const doc = snapshot.docs[0];
        const data = doc.data();
        console.log(`✅ FOUND: ${account.email}`);
        console.log(`   Collection: ${account.collection}`);
        console.log(`   Document ID: ${doc.id}`);
        console.log(`   Name: ${data.firstName} ${data.lastName}`);
        console.log(`   School ID: ${data.schoolId || 'N/A'}`);
        console.log(`   Role: ${data.role || 'N/A'}\n`);
      }
    } catch (err) {
      console.error(`❌ ERROR checking ${account.email}:`, err.message, '\n');
    }
  }
  
  // Also count total documents
  console.log('📊 Document counts:');
  try {
    const teachers = await db.collection('teachers').get();
    console.log(`   Teachers: ${teachers.size}`);
    
    const parents = await db.collection('parents').get();
    console.log(`   Parents: ${parents.size}`);
    
    const students = await db.collection('students').get();
    console.log(`   Students: ${students.size}`);
    
    const schools = await db.collection('schools').get();
    console.log(`   Schools: ${schools.size}\n`);
  } catch (err) {
    console.error('❌ Error counting documents:', err.message);
  }
  
  process.exit(0);
}

checkLoginAccounts().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
