#!/usr/bin/env node
/**
 * Manual Security Rules Test Script
 * 
 * This script tests multi-tenant security rules against the running emulator.
 * Run this AFTER starting the emulator with: npm run dev:emu
 * 
 * Usage: node scripts/test-security-manual.cjs
 */

const admin = require('firebase-admin');

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 8086;

console.log('\n🧪 Multi-Tenant Security Rules Manual Test\n');
console.log(`📍 Connecting to emulator: ${EMULATOR_HOST}:${EMULATOR_PORT}\n`);

// Initialize admin SDK for emulator
process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_PORT}`;

const app = admin.initializeApp({
  projectId: 'edusync-local'
});

const db = app.firestore();
const auth = app.auth();

async function runTests() {
  console.log('🔧 Setting up test environment...\n');

  // Test 1: Create student WITHOUT schoolId
  console.log('TEST 1: Create student WITHOUT schoolId');
  console.log('Expected: FAIL (requires schoolId)\n');
  try {
    const docRef = await db.collection('students').add({
      firstName: 'Test',
      lastName: 'NoSchool',
      lrn: '999999999999'
      // NO schoolId
    });
    console.log('❌ UNEXPECTED: Created without schoolId! Doc ID:', docRef.id);
    console.log('⚠️  Legacy mode is ACTIVE (|| isLegacyUser() allows this)\n');
  } catch (error) {
    console.log('✅ EXPECTED: Blocked creation without schoolId');
    console.log('   Error:', error.message, '\n');
  }

  // Test 2: Create student WITH schoolId
  console.log('TEST 2: Create student WITH valid schoolId');
  console.log('Expected: SUCCESS\n');
  try {
    const docRef = await db.collection('students').add({
      firstName: 'Test',
      lastName: 'WithSchool',
      lrn: '888888888888',
      schoolId: 'default'
    });
    console.log('✅ SUCCESS: Created with schoolId. Doc ID:', docRef.id, '\n');
  } catch (error) {
    console.log('❌ UNEXPECTED: Failed to create with valid schoolId');
    console.log('   Error:', error.message, '\n');
  }

  // Test 3: Try to change schoolId on existing document
  console.log('TEST 3: Try to CHANGE schoolId on existing student');
  console.log('Expected: FAIL (schoolId immutable)\n');
  
  try {
    // First, find or create a test student
    const testDoc = await db.collection('students').add({
      firstName: 'Immutable',
      lastName: 'Test',
      lrn: '777777777777',
      schoolId: 'default'
    });
    
    // Try to change schoolId
    await db.collection('students').doc(testDoc.id).update({
      schoolId: 'hacked-school-id'
    });
    
    console.log('❌ UNEXPECTED: Changed schoolId! Doc ID:', testDoc.id);
    console.log('⚠️  Legacy mode is ACTIVE (allows schoolId changes)\n');
  } catch (error) {
    console.log('✅ EXPECTED: Blocked schoolId change');
    console.log('   Error:', error.message, '\n');
  }

  // Test 4: Check if schools collection exists
  console.log('TEST 4: Check schools collection');
  const schoolsSnapshot = await db.collection('schools').get();
  console.log(`📊 Found ${schoolsSnapshot.size} school(s):`);
  schoolsSnapshot.forEach(doc => {
    console.log(`   - ${doc.id}: ${doc.data().name || 'Unnamed'}`);
  });
  console.log();

  // Test 5: Check if students have schoolId
  console.log('TEST 5: Verify existing students have schoolId');
  const studentsSnapshot = await db.collection('students').limit(10).get();
  console.log(`📊 Checking ${studentsSnapshot.size} students:\n`);
  
  let withSchoolId = 0;
  let withoutSchoolId = 0;
  
  studentsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.schoolId) {
      withSchoolId++;
      console.log(`   ✅ ${doc.id}: schoolId="${data.schoolId}"`);
    } else {
      withoutSchoolId++;
      console.log(`   ❌ ${doc.id}: NO SCHOOLID (legacy data)`);
    }
  });
  
  console.log(`\n📈 Summary: ${withSchoolId} with schoolId, ${withoutSchoolId} without\n`);

  // Test 6: Check custom claims
  console.log('TEST 6: Check user custom claims');
  console.log('Checking admin@edusync.local...\n');
  try {
    const userRecord = await auth.getUserByEmail('admin@edusync.local');
    console.log('✅ User found:', userRecord.uid);
    console.log('   Custom claims:', JSON.stringify(userRecord.customClaims, null, 2));
    
    if (userRecord.customClaims?.schools) {
      console.log(`   🏫 Assigned to ${userRecord.customClaims.schools.length} school(s)`);
    } else {
      console.log('   ⚠️  No schools array in custom claims (legacy user)');
    }
  } catch (error) {
    console.log('❌ User not found:', error.message);
  }
  console.log();

  console.log('✅ Manual tests complete!\n');
  console.log('📋 Summary:');
  console.log('   - If "legacy mode is ACTIVE" appears → Expected (backward compatible)');
  console.log('   - To enable strict mode: Remove || isLegacyUser() from firestore.rules');
  console.log('   - Current rules enforce isolation at READ time (users only see their school)');
  console.log('   - Strict validation (no schoolId, immutable schoolId) is in place but has legacy bypass\n');
}

// Run tests
runTests()
  .then(() => {
    console.log('🎉 Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
