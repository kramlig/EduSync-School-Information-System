const admin = require('firebase-admin');
// Dynamically get projectId from environment variables for emulator
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'edusync-local'; 
admin.initializeApp({
  projectId: projectId,
  // In Cloud Functions this uses ADC automatically. Locally, set GOOGLE_APPLICATION_CREDENTIALS or use firebase login emulators.
});

console.log('[Firebase Admin] Initializing with project ID:', admin.app().options.projectId);

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

  // Add sample section
  const sectionRef = db.collection('sections').doc('section_A');
  await sectionRef.set({
    id: 'section_A',
    name: 'Section A',
    gradeLevel: 3,
    adviserId: 'uid_teacher1',
    schoolId: 'school_123'
  });

  // Add sample students
  const studentsData = [
    { id: 's_001', name: 'Alice Smith', email: 'alice@school.edu', lrn: '100000000001', dateOfBirth: '2015-01-15', sex: 'Female', status: 'active', sectionId: 'section_A', guardianName: 'John Smith', guardianRelationship: 'Father', guardianContactNumber: '09123456789' },
    { id: 's_002', name: 'Bob Johnson', email: 'bob@school.edu', lrn: '100000000002', dateOfBirth: '2014-03-20', sex: 'Male', status: 'active', sectionId: 'section_A', guardianName: 'Mary Johnson', guardianRelationship: 'Mother', guardianContactNumber: '09123456780' },
    { id: 's_003', name: 'Charlie Brown', email: 'charlie@school.edu', lrn: '100000000003', dateOfBirth: '2015-07-01', sex: 'Male', status: 'active', sectionId: 'section_A', guardianName: 'Sally Brown', guardianRelationship: 'Mother', guardianContactNumber: '09123456781' },
    { id: 's_004', name: 'Diana Prince', email: 'diana@school.edu', lrn: '100000000004', dateOfBirth: '2014-11-11', sex: 'Female', status: 'active', sectionId: 'section_A', guardianName: 'Queen Hippolyta', guardianRelationship: 'Mother', guardianContactNumber: '09123456782' },
    { id: 's_005', name: 'Eve Adams', email: 'eve@school.edu', lrn: '100000000005', dateOfBirth: '2015-02-28', sex: 'Female', status: 'active', sectionId: 'section_A', guardianName: 'Adam Adams', guardianRelationship: 'Father', guardianContactNumber: '09123456783' }
  ];

  for (const student of studentsData) {
    await db.collection('students').doc(student.id).set(student);
  }

  console.log('Seed complete');
}

seed().catch(err => { console.error(err); process.exit(1); });
