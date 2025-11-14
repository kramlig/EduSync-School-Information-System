/**
 * Create users collection document for admin@school.edu
 */

const admin = require('firebase-admin');

// Ensure we're NOT using emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdminUserDoc() {
  console.log('🔧 Creating users document for admin@school.edu...\n');
  
  try {
    // Get the admin user from Firebase Auth
    const adminAuth = await auth.getUserByEmail('admin@school.edu');
    console.log('Found Firebase Auth user:', adminAuth.uid);
    
    // Check if users doc already exists
    const usersDoc = await db.collection('users').doc(adminAuth.uid).get();
    if (usersDoc.exists) {
      console.log('✅ Users document already exists:', usersDoc.data());
      process.exit(0);
      return;
    }
    
    // Get admin data from teachers collection (assuming admin is a teacher)
    const teachersSnapshot = await db.collection('teachers')
      .where('email', '==', 'admin@school.edu')
      .limit(1)
      .get();
    
    if (teachersSnapshot.empty) {
      console.log('❌ No teacher document found for admin@school.edu');
      process.exit(1);
      return;
    }
    
    const teacherDoc = teachersSnapshot.docs[0];
    const teacherData = teacherDoc.data();
    
    console.log('Found teacher document:', teacherDoc.id);
    console.log('Teacher data:', {
      email: teacherData.email,
      name: teacherData.name,
      role: teacherData.role,
      schoolId: teacherData.schoolId
    });
    
    // Create users document
    await db.collection('users').doc(adminAuth.uid).set({
      id: adminAuth.uid,
      email: teacherData.email,
      name: teacherData.name,
      role: teacherData.role || 'admin',
      schoolId: teacherData.schoolId || 'default',
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('\n✅ Created users document for admin@school.edu');
    console.log('UID:', adminAuth.uid);
    console.log('Email:', teacherData.email);
    console.log('Role:', teacherData.role || 'admin');
    console.log('SchoolId:', teacherData.schoolId || 'default');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createAdminUserDoc();
