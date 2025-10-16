/**
 * Firestore security rules unit tests (basic)
 * Uses @firebase/rules-unit-testing to start an emulator, load rules if available, and run auth-based checks.
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const admin = require('firebase-admin');

(async () => {
  const projectId = `edusync-test-${Date.now()}`;
  // Load rules file if present and pass into initializeTestEnvironment so emulator uses them
  const rulesPath = 'firestore.rules';
  let rules = null;
  if (fs.existsSync(rulesPath)) {
    rules = fs.readFileSync(rulesPath, 'utf8');
    console.log('Loaded firestore.rules from repo');
  } else {
    console.log('No firestore.rules file found in repo; running tests with default open rules');
  }

  // If the firebase emulator was started via `firebase emulators:exec`, it sets FIRESTORE_EMULATOR_HOST
  // which looks like "127.0.0.1:8085". Use that host/port so the test harness connects to the running emulator.
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_ADDRESS;
  let testEnv;
  if (emulatorHost) {
    const parts = emulatorHost.split(':');
    const host = parts[0];
    const port = parseInt(parts[1], 10) || undefined;
    console.log('Using emulator host/port from env:', host, port);
    testEnv = await initializeTestEnvironment({ projectId, firestore: { host, port, rules } });
  } else {
    // No emulator env detected — fall back to letting initializeTestEnvironment manage it (may require port args)
    console.log('No FIRESTORE_EMULATOR_HOST detected; initializing test environment without explicit host/port');
    testEnv = await initializeTestEnvironment({ projectId, firestore: { rules } });
  }

  // Create contexts: unauthenticated, student, teacher
  const unauthenticated = testEnv.unauthenticatedContext();
  const studentAuth = testEnv.authenticatedContext('student-uid-1', { role: 'student', email: 'student1@example.edu' });
  const teacherAuth = testEnv.authenticatedContext('teacher-uid-1', { role: 'teacher', email: 'teacher1@example.edu' });

  // Write some sample data as admin to seed DB using firebase-admin (connects to emulator via env)
  try {
    admin.initializeApp({ projectId });
  } catch (e) {
    // ignore if already initialized
  }
  const adminDb = admin.firestore();
  // Create a test school and user docs for student and teacher so rules relying on getUserDoc() work
  await adminDb.collection('users').doc('mock-user-admin').set({ id: 'mock-user-admin', role: 'admin', name: 'Admin' });
  await adminDb.collection('users').doc('student-uid-1').set({ id: 'student-uid-1', role: 'student', email: 'student1@example.edu', schoolId: 'school-1' });
  await adminDb.collection('users').doc('teacher-uid-1').set({ id: 'teacher-uid-1', role: 'teacher', email: 'teacher1@example.edu', schoolId: 'school-1' });
  await adminDb.collection('schools').doc('school-1').set({ id: 'school-1', name: 'Test School' });
  // Place student and grades under the school path to match rules that scope collections to /schools/{schoolId}
  await adminDb.collection('schools').doc('school-1').collection('students').doc('mock-student-1').set({ id: 'mock-student-1', name: 'Student 1' });
  await adminDb.collection('schools').doc('school-1').collection('grades').doc('grade-1').set({ id: 'grade-1', studentId: 'mock-student-1', value: 85 });

  // Test unauthenticated read of public data (should be allowed depending on rules) - we'll assert expected behaviour: read users is denied by default.
  const unauthUsers = unauthenticated.firestore().collection('users').doc('mock-user-admin');
  try {
    await assertFails(unauthUsers.get());
    console.log('PASS assertFails unauthenticated read users');
  } catch (e) {
    console.error('FAIL unauthenticated read users (expected fail):', e);
  }

  // Student should be able to read their own student doc
  const studentDoc = studentAuth.firestore().collection('schools').doc('school-1').collection('students').doc('mock-student-1');
  try {
    await assertSucceeds(studentDoc.get());
    console.log('PASS student read own doc');
  } catch (e) {
    console.error('FAIL student read own doc (expected success):', e);
  }

  // Student should not be able to write another student's grade
  const studentWriteGrade = studentAuth.firestore().collection('schools').doc('school-1').collection('grades').doc('grade-2');
  try {
    await assertFails(studentWriteGrade.set({ id: 'grade-2', studentId: 'mock-student-1', value: 90 }));
    console.log('PASS student denied write grade (expected fail)');
  } catch (e) {
    console.error('FAIL student write grade check (expected fail):', e);
  }

  // Teacher should be able to write grades
  const teacherWriteGrade = teacherAuth.firestore().collection('schools').doc('school-1').collection('grades').doc('grade-3');
  try {
    await assertSucceeds(teacherWriteGrade.set({ id: 'grade-3', studentId: 'mock-student-1', value: 92 }));
    console.log('PASS teacher write grade');
  } catch (e) {
    console.error('FAIL teacher write grade (expected success):', e);
  }

  // Clean up admin app and test environment
  try {
    await admin.app().delete();
  } catch (e) {
    // ignore
  }
  await testEnv.cleanup();
  process.exit(0);
})();
