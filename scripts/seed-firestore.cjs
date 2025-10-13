const admin = require('firebase-admin');
admin.initializeApp({
  // In Cloud Functions this uses ADC automatically. Locally, set GOOGLE_APPLICATION_CREDENTIALS or use firebase login emulators.
});

const db = admin.firestore();

async function seed() {
  const schoolRef = db.collection('schools').doc('school_123');
  await schoolRef.set({ name: 'Lincoln Elementary', createdAt: admin.firestore.FieldValue.serverTimestamp() });

  // Create a teacher user doc
  await db.collection('users').doc('uid_teacher1').set({
    displayName: 'Jane Teacher',
    email: 'jane@school.edu',
    role: 'teacher',
    schoolId: 'school_123'
  });

  // Add sample course
  await schoolRef.collection('courses').doc('course_567').set({
    title: 'Grade 3 - Science',
    teacherId: 'uid_teacher1',
    gradeLevel: 3,
    term: '2025-Fall'
  });

  console.log('Seed complete');
}

seed().catch(err => { console.error(err); process.exit(1); });