/**
 * Quick script to fix parent portal data issues
 * - Creates announcements with correct field name
 * - Creates a test parent account
 * - Creates sample assignments
 */

const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

// Initialize only if not already initialized
// IMPORTANT: Use same projectId as seed-complete.cjs
let app;
try {
  app = admin.app();
} catch (e) {
  app = admin.initializeApp({ projectId: 'edusync-local' });
}
const db = admin.firestore();

async function main() {
  console.log('🔧 Fixing parent portal data...\n');

  // 1. Clear and recreate announcements with correct field
  console.log('📢 Fixing announcements...');
  const announcementsSnap = await db.collection('announcements').get();
  const batch1 = db.batch();
  announcementsSnap.forEach(doc => batch1.delete(doc.ref));
  await batch1.commit();

  const announcements = [
    { title: 'Welcome to Parent Portal', content: 'Thank you for registering! You can now view your child\'s grades, attendance, and assignments.', target: 'parents', date: '2025-11-03', authorId: 'admin123' },
    { title: 'Parent-Teacher Conference', content: 'Q2 Parent-Teacher Conference on November 15, 2025', target: 'parents', date: '2025-11-02', authorId: 'admin123' },
    { title: 'Holiday Notice', content: 'Classes suspended on November 10, 2025', target: 'all', date: '2025-11-01', authorId: 'admin123' }
  ];

  const batch2 = db.batch();
  announcements.forEach(a => {
    const ref = db.collection('announcements').doc();
    batch2.set(ref, { ...a, createdAt: new Date(), updatedAt: new Date() });
  });
  await batch2.commit();
  console.log('  ✅ Created 3 announcements\n');

  // 2. Get first student
  const studentSnap = await db.collection('students').limit(1).get();
  if (studentSnap.empty) {
    console.error('❌ No students found! Run seed script first.');
    process.exit(1);
  }

  const student = studentSnap.docs[0];
  const studentData = student.data();

  console.log('👤 Creating parent account...');
  console.log('   Student:', studentData.name);
  console.log('   LRN:', studentData.lrn);

  // 3. Create parent
  const parentRef = db.collection('parents').doc();
  await parentRef.set({
    name: 'Juan Garcia',
    email: 'juan.garcia@test.com',
    password: 'parent123',
    studentIds: [student.id],
    phone: '09171234567',
    emailVerified: false,
    registrationDate: new Date().toISOString(),
    notificationPreferences: {
      emailEnabled: true,
      smsEnabled: false,
      absenceAlerts: true,
      gradeAlerts: true,
      announcementAlerts: true
    }
  });

  // 4. Link parent to student
  await student.ref.update({
    parentIds: admin.firestore.FieldValue.arrayUnion(parentRef.id)
  });
  console.log('  ✅ Parent created and linked to student\n');

  // 5. Create assignments
  console.log('📝 Creating assignments...');
  const batch3 = db.batch();

  const assignment1 = db.collection('assignments').doc();
  batch3.set(assignment1, {
    title: 'Math Homework - Chapter 5',
    description: 'Complete exercises 1-10 on page 45',
    sectionId: studentData.sectionId,
    subject: 'Mathematics',
    dueDate: '2025-11-10',
    assignedDate: '2025-11-03',
    teacherId: 'teacher-001',
    status: 'active',
    createdAt: new Date()
  });

  const assignment2 = db.collection('assignments').doc();
  batch3.set(assignment2, {
    title: 'Science Project - Solar System',
    description: 'Create a model of the solar system',
    sectionId: studentData.sectionId,
    subject: 'Science',
    dueDate: '2025-11-15',
    assignedDate: '2025-11-01',
    teacherId: 'teacher-001',
    status: 'active',
    createdAt: new Date()
  });

  await batch3.commit();
  console.log('  ✅ Created 2 assignments\n');

  console.log('=' .repeat(60));
  console.log('✨ PARENT PORTAL DATA READY!');
  console.log('=' .repeat(60));
  console.log('\n🔐 Parent Login Credentials:');
  console.log('   Email: juan.garcia@test.com');
  console.log('   Password: parent123');
  console.log('\n📊 Data Summary:');
  console.log('   • Announcements: 3 (with correct \'target\' field)');
  console.log('   • Parent Accounts: 1');
  console.log('   • Assignments: 2');
  console.log('\n🌐 Next Steps:');
  console.log('   1. Refresh the browser page (Ctrl+R or F5)');
  console.log('   2. Logout if currently logged in');
  console.log('   3. Login as parent with credentials above');
  console.log('   4. Check announcements and assignments pages\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
