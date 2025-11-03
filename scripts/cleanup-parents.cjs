const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

try { 
  admin.app(); 
} catch(e) { 
  admin.initializeApp({ projectId: 'edusync-local' }); 
}

const db = admin.firestore();

async function cleanupDuplicateParents() {
  console.log('🧹 Cleaning up duplicate parent accounts...\n');
  
  const snap = await db.collection('parents').get();
  
  console.log(`Found ${snap.size} parent accounts`);
  
  // Delete all parents first
  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log('✅ Deleted all existing parents\n');
  
  // Get first student (Juan Garcia)
  const studentSnap = await db.collection('students')
    .where('firstName', '==', 'Juan')
    .where('lastName', '==', 'Garcia')
    .limit(1)
    .get();
  
  if (studentSnap.empty) {
    console.log('❌ Juan Garcia student not found');
    // Try by LRN
    const lrnSnap = await db.collection('students')
      .where('lrn', '==', '123456789001')
      .limit(1)
      .get();
    
    if (lrnSnap.empty) {
      console.log('❌ No student with LRN 123456789001 found');
      console.log('Getting any student...');
      const anyStudentSnap = await db.collection('students').limit(1).get();
      if (anyStudentSnap.empty) {
        console.log('❌ No students found at all!');
        process.exit(1);
      }
      var student = anyStudentSnap.docs[0];
    } else {
      var student = lrnSnap.docs[0];
    }
  } else {
    var student = studentSnap.docs[0];
  }
  
  const studentData = student.data();
  console.log(`👨‍🎓 Found student: ${studentData.firstName} ${studentData.lastName}`);
  console.log(`   ID: ${student.id}`);
  console.log(`   LRN: ${studentData.lrn}\n`);
  
  // Create ONE parent account
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
  
  console.log('✅ Created ONE parent account:');
  console.log('   ID:', parentRef.id);
  console.log('   Email: juan.garcia@test.com');
  console.log('   Password: parent123');
  console.log(`   Linked to student: ${student.id}\n`);
  
  // Update student with parent ID
  await student.ref.update({
    parentId: parentRef.id
  });
  
  console.log('✅ Linked student to parent\n');
  console.log('============================================================');
  console.log('✨ PARENT ACCOUNT READY!');
  console.log('============================================================\n');
  console.log('🔐 Login at: http://127.0.0.1:5173/admin');
  console.log('   Email: juan.garcia@test.com');
  console.log('   Password: parent123\n');
  console.log('💡 Refresh your browser page before logging in!');
  
  process.exit(0);
}

cleanupDuplicateParents().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
