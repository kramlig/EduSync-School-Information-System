const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

(async () => {
  const projectId = 'edusync-sis-tests';
  const rules = fs.readFileSync('firestore.rules', 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules }
  });

  try {
    // Seed required user docs with elevated context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await adminDb.collection('users').doc('uid_teacher1').set({ role: 'teacher', schoolId: 'school_123' });
      await adminDb.collection('users').doc('uid_parent1').set({ role: 'parent', schoolId: 'school_123', guardianIds: ['student_1'] });
      await adminDb.collection('users').doc('uid_admin').set({ role: 'admin', schoolId: 'school_123' });
    });

    // Create auth contexts
    const teacherDb = testEnv.authenticatedContext('uid_teacher1').firestore();
    const parentDb = testEnv.authenticatedContext('uid_parent1').firestore();
    const adminDb = testEnv.authenticatedContext('uid_admin').firestore();

    console.log('Running rule tests...');

    // Teacher should be able to create a lesson in their school
    await assertSucceeds(teacherDb.collection('schools').doc('school_123').collection('lessons').doc('lesson1').set({ creatorId: 'uid_teacher1', title: 'Plants' }));
    console.log('✓ teacher can create lesson');

    // Parent should NOT be able to create a lesson
    await assertFails(parentDb.collection('schools').doc('school_123').collection('lessons').doc('lesson2').set({ creatorId: 'uid_parent1', title: 'Bad' }));
    console.log('✓ parent cannot create lesson');

    // Admin should be able to read any user document
    await assertSucceeds(adminDb.collection('users').doc('uid_teacher1').get());
    console.log('✓ admin can read user doc');

    // Parent should be able to read school lessons (they are a school member)
    await assertSucceeds(parentDb.collection('schools').doc('school_123').collection('lessons').doc('lesson1').get());
    console.log('✓ parent can read lesson');

    console.log('All rule tests passed.');
    await testEnv.cleanup();
    process.exit(0);
  } catch (err) {
    console.error('Rule tests failed:', err);
    await testEnv.cleanup();
    process.exit(1);
  }
})();
