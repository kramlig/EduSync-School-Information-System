#!/usr/bin/env node
/**
 * Fix Emulator Users Collection
 * 
 * Creates missing 'users' collection entries for students and parents
 * to match the new production login flow.
 * 
 * Background: Production login was updated to use a 3-step process:
 * 1. Firebase Auth authentication
 * 2. Fetch from 'users' collection (primary source)
 * 3. Merge role-specific data from teachers/students/parents collections
 * 
 * The emulator seed script only creates users collection for teachers/admin,
 * but not for students or parents. This script fixes that.
 */

const admin = require('firebase-admin');

// Force emulator connection
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({ 
    projectId: 'edusync-local'
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createUsersCollectionEntries() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         FIX EMULATOR USERS COLLECTION                                      ║');
  console.log('║         Creating missing users collection entries                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const stats = {
    students: { created: 0, existed: 0, errors: 0 },
    parents: { created: 0, existed: 0, errors: 0 }
  };

  try {
    // Process students
    console.log('📚 Processing students...\n');
    const studentsSnapshot = await db.collection('students').get();
    console.log(`   Found ${studentsSnapshot.size} student documents`);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const studentId = studentDoc.id;

      try {
        // Check if auth user exists
        let authUser;
        try {
          authUser = await auth.getUserByEmail(studentData.email);
        } catch (authError) {
          // Auth user doesn't exist, skip
          console.log(`   ⚠️  No auth user for ${studentData.email}, skipping`);
          stats.students.errors++;
          continue;
        }

        // Check if users doc already exists
        const usersDoc = await db.collection('users').doc(authUser.uid).get();
        if (usersDoc.exists()) {
          stats.students.existed++;
          continue;
        }

        // Create users document
        await db.collection('users').doc(authUser.uid).set({
          id: authUser.uid,
          email: studentData.email,
          name: studentData.name || `${studentData.firstName} ${studentData.lastName}`,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          role: 'student',
          schoolId: studentData.schoolId || 'default',
          sectionId: studentData.sectionId,
          gradeLevel: studentData.gradeLevel,
          emailVerified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`   ✅ Created users doc for ${studentData.email}`);
        stats.students.created++;

      } catch (error) {
        console.error(`   ❌ Error processing student ${studentData.email}:`, error.message);
        stats.students.errors++;
      }
    }

    // Process parents
    console.log('\n\n👨‍👩‍👧 Processing parents...\n');
    const parentsSnapshot = await db.collection('parents').get();
    console.log(`   Found ${parentsSnapshot.size} parent documents`);

    for (const parentDoc of parentsSnapshot.docs) {
      const parentData = parentDoc.data();
      const parentId = parentDoc.id;

      try {
        // Check if auth user exists
        let authUser;
        try {
          authUser = await auth.getUserByEmail(parentData.email);
        } catch (authError) {
          // Auth user doesn't exist, skip
          console.log(`   ⚠️  No auth user for ${parentData.email}, skipping`);
          stats.parents.errors++;
          continue;
        }

        // Check if users doc already exists
        const usersDoc = await db.collection('users').doc(authUser.uid).get();
        if (usersDoc.exists()) {
          stats.parents.existed++;
          continue;
        }

        // Create users document
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

        console.log(`   ✅ Created users doc for ${parentData.email}`);
        stats.parents.created++;

      } catch (error) {
        console.error(`   ❌ Error processing parent ${parentData.email}:`, error.message);
        stats.parents.errors++;
      }
    }

    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         SUMMARY                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Students:');
    console.log(`   ✅ Created: ${stats.students.created}`);
    console.log(`   ✓ Already existed: ${stats.students.existed}`);
    console.log(`   ❌ Errors/Skipped: ${stats.students.errors}`);

    console.log('\n👨‍👩‍👧 Parents:');
    console.log(`   ✅ Created: ${stats.parents.created}`);
    console.log(`   ✓ Already existed: ${stats.parents.existed}`);
    console.log(`   ❌ Errors/Skipped: ${stats.parents.errors}`);

    const totalCreated = stats.students.created + stats.parents.created;

    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         COMPLETE!                                                          ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    console.log(`🎉 Created ${totalCreated} users collection documents`);
    console.log('\n✅ Emulator login should now work for students and parents!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

createUsersCollectionEntries();
