/**
 * Firestore Security Rules Tests
 * 
 * Tests the security rules defined in firestore.rules
 * Uses Firebase Emulator Suite for testing
 */

const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

let testEnv;

// Initialize test environment before all tests
async function setup() {
  console.log('Setting up Firestore Rules Test Environment...');
  
  testEnv = await initializeTestEnvironment({
    projectId: 'emu-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || 'localhost',
      port: parseInt(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || '8086')
    }
  });

  console.log('✓ Test environment initialized');
}

// Cleanup after all tests
async function teardown() {
  console.log('Cleaning up test environment...');
  if (testEnv) {
    await testEnv.cleanup();
  }
  console.log('✓ Cleanup complete');
}

// Run a single test
async function runTest(name, testFn) {
  try {
    await testFn();
    console.log(`✓ ${name}`);
    return { name, status: 'PASSED' };
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    return { name, status: 'FAILED', error: error.message };
  }
}

// Main test suite
async function runTests() {
  const results = [];

  // Test 1: Unauthenticated users cannot read students
  results.push(await runTest('Unauthenticated users cannot read students', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('students').doc('test-student').get());
  }));

  // Test 2: Authenticated users can read students
  results.push(await runTest('Authenticated users can read students', async () => {
    const authedDb = testEnv.authenticatedContext('user-123', { role: 'teacher' }).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('students').doc('test-student').set({
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        schoolId: 'school-1'
      });
    });
    await assertSucceeds(authedDb.collection('students').doc('test-student').get());
  }));

  // Test 3: Teachers can read their own profile
  results.push(await runTest('Teachers can read their own profile', async () => {
    const teacherId = 'teacher-123';
    const teacherDb = testEnv.authenticatedContext(teacherId, { role: 'teacher' }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('teachers').doc(teacherId).set({
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria@school.com'
      });
    });
    
    await assertSucceeds(teacherDb.collection('teachers').doc(teacherId).get());
  }));

  // Test 4: Authenticated users can read teacher profiles (directory lookup)
  results.push(await runTest('Authenticated users can read teacher profiles', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-123', { role: 'teacher' }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('teachers').doc('other-teacher').set({
        firstName: 'Pedro',
        lastName: 'Reyes'
      });
    });
    
    await assertSucceeds(teacherDb.collection('teachers').doc('other-teacher').get());
  }));

  // Test 5: Admins can read all teachers
  results.push(await runTest('Admins can read all teachers', async () => {
    const adminDb = testEnv.authenticatedContext('admin-123', { role: 'admin' }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('teachers').doc('any-teacher').set({
        firstName: 'Any',
        lastName: 'Teacher'
      });
    });
    
    await assertSucceeds(adminDb.collection('teachers').doc('any-teacher').get());
  }));

  // Test 6: Parents can only read their own data
  results.push(await runTest('Parents can only read their own data', async () => {
    const parentId = 'parent-123';
    const parentDb = testEnv.authenticatedContext(parentId, { role: 'parent' }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('parents').doc(parentId).set({
        firstName: 'Ana',
        lastName: 'Garcia'
      });
    });
    
    await assertSucceeds(parentDb.collection('parents').doc(parentId).get());
    await assertFails(parentDb.collection('parents').doc('other-parent').get());
  }));

  // Test 7: Unauthenticated users cannot read teachers (auth required)
  results.push(await runTest('Unauthenticated users cannot read teachers', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('teachers').doc('login-teacher').set({
        email: 'teacher@school.com'
      });
    });
    
    await assertFails(unauthedDb.collection('teachers').doc('login-teacher').get());
  }));

  // Test 8: Settings are readable by authenticated users
  results.push(await runTest('Settings are readable by authenticated users', async () => {
    const authedDb = testEnv.authenticatedContext('user-123', { role: 'teacher' }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('settings').doc('school').set({
        schoolName: 'Test School'
      });
    });
    
    await assertSucceeds(authedDb.collection('settings').doc('school').get());
  }));

  return results;
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('Firestore Security Rules Tests');
  console.log('='.repeat(60));
  console.log('');

  try {
    await setup();
    console.log('');
    console.log('Running tests...');
    console.log('-'.repeat(60));
    
    const results = await runTests();
    
    console.log('-'.repeat(60));
    console.log('');
    console.log('Test Results:');
    console.log('-'.repeat(60));
    
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('');
    
    if (failed > 0) {
      console.log('Failed tests:');
      results.filter(r => r.status === 'FAILED').forEach(r => {
        console.log(`  - ${r.name}`);
        console.log(`    ${r.error}`);
      });
      process.exit(1);
    } else {
      console.log('✓ All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  } finally {
    await teardown();
  }
}

// Run tests
main();
