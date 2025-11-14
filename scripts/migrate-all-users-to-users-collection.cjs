/**
 * COMPREHENSIVE MIGRATION: Create users collection documents for ALL existing users
 * This ensures the new login flow works for everyone (teachers, students, parents)
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

async function migrateAllUsers() {
  console.log('🔄 Starting comprehensive user migration...\n');
  
  const stats = {
    teachers: { created: 0, existed: 0, errors: 0 },
    students: { created: 0, existed: 0, errors: 0 },
    parents: { created: 0, existed: 0, errors: 0 }
  };
  
  try {
    // STEP 1: Migrate all teachers
    console.log('📚 Step 1: Migrating teachers...');
    const teachersSnapshot = await db.collection('teachers').get();
    console.log(`Found ${teachersSnapshot.size} teachers`);
    
    for (const teacherDoc of teachersSnapshot.docs) {
      const teacherData = teacherDoc.data();
      
      try {
        // Try to get Firebase Auth user by email
        let authUser;
        try {
          authUser = await auth.getUserByEmail(teacherData.email);
        } catch (authError) {
          // User doesn't exist in Firebase Auth, skip
          console.log(`  ⚠️  No Firebase Auth for ${teacherData.email}, skipping`);
          stats.teachers.errors++;
          continue;
        }
        
        // Check if users doc already exists
        const usersDoc = await db.collection('users').doc(authUser.uid).get();
        if (usersDoc.exists) {
          stats.teachers.existed++;
          continue;
        }
        
        // Create users document
        await db.collection('users').doc(authUser.uid).set({
          id: authUser.uid,
          email: teacherData.email,
          name: teacherData.name,
          role: teacherData.role || 'teacher',
          schoolId: teacherData.schoolId || 'default',
          emailVerified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`  ✅ Created users doc for ${teacherData.email} (${teacherData.role || 'teacher'})`);
        stats.teachers.created++;
        
      } catch (error) {
        console.error(`  ❌ Error migrating teacher ${teacherData.email}:`, error.message);
        stats.teachers.errors++;
      }
    }
    
    // STEP 2: Migrate all students
    console.log('\n👨‍🎓 Step 2: Migrating students...');
    const studentsSnapshot = await db.collection('students').get();
    console.log(`Found ${studentsSnapshot.size} students`);
    
    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      
      try {
        // Try to get Firebase Auth user by email
        let authUser;
        try {
          authUser = await auth.getUserByEmail(studentData.email);
        } catch (authError) {
          // User doesn't exist in Firebase Auth, skip
          stats.students.errors++;
          continue;
        }
        
        // Check if users doc already exists
        const usersDoc = await db.collection('users').doc(authUser.uid).get();
        if (usersDoc.exists) {
          stats.students.existed++;
          continue;
        }
        
        // Create users document
        await db.collection('users').doc(authUser.uid).set({
          id: authUser.uid,
          email: studentData.email,
          name: studentData.name,
          role: 'student',
          schoolId: studentData.schoolId || 'default',
          sectionId: studentData.sectionId,
          emailVerified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        stats.students.created++;
        
      } catch (error) {
        console.error(`  ❌ Error migrating student ${studentData.email}:`, error.message);
        stats.students.errors++;
      }
    }
    
    // STEP 3: Verify parents (should already be done)
    console.log('\n👨‍👩‍👧‍👦 Step 3: Verifying parents...');
    const parentsSnapshot = await db.collection('parents').get();
    console.log(`Found ${parentsSnapshot.size} parents`);
    
    for (const parentDoc of parentsSnapshot.docs) {
      const parentData = parentDoc.data();
      
      try {
        // Try to get Firebase Auth user by email
        let authUser;
        try {
          authUser = await auth.getUserByEmail(parentData.email);
        } catch (authError) {
          stats.parents.errors++;
          continue;
        }
        
        // Check if users doc already exists
        const usersDoc = await db.collection('users').doc(authUser.uid).get();
        if (usersDoc.exists) {
          stats.parents.existed++;
          continue;
        }
        
        // Create users document (should not happen if previous script ran)
        await db.collection('users').doc(authUser.uid).set({
          id: authUser.uid,
          email: parentData.email,
          name: parentData.name,
          role: 'parent',
          schoolId: parentData.schoolId || 'default',
          studentIds: parentData.studentIds || [],
          phone: parentData.phone,
          emailVerified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        stats.parents.created++;
        
      } catch (error) {
        console.error(`  ❌ Error migrating parent ${parentData.email}:`, error.message);
        stats.parents.errors++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log('═'.repeat(50));
    console.log('Teachers:');
    console.log(`  ✅ Created: ${stats.teachers.created}`);
    console.log(`  ✓ Already existed: ${stats.teachers.existed}`);
    console.log(`  ❌ Errors/Skipped: ${stats.teachers.errors}`);
    console.log('\nStudents:');
    console.log(`  ✅ Created: ${stats.students.created}`);
    console.log(`  ✓ Already existed: ${stats.students.existed}`);
    console.log(`  ❌ Errors/Skipped: ${stats.students.errors}`);
    console.log('\nParents:');
    console.log(`  ✅ Created: ${stats.parents.created}`);
    console.log(`  ✓ Already existed: ${stats.parents.existed}`);
    console.log(`  ❌ Errors/Skipped: ${stats.parents.errors}`);
    console.log('═'.repeat(50));
    
    const totalCreated = stats.teachers.created + stats.students.created + stats.parents.created;
    console.log(`\n🎉 Migration complete! Created ${totalCreated} users documents total.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateAllUsers();
