#!/usr/bin/env node
/**
 * CREATE FIREBASE AUTH ACCOUNTS FOR SEEDED USERS
 * 
 * Purpose: Add Firebase Authentication accounts for users already in Firestore
 * This is needed because the login now uses Firebase Auth (signInWithEmailAndPassword)
 * 
 * Usage:
 *   node scripts/create-auth-for-seeded-users.cjs                    # Uses edusync-sis
 *   node scripts/create-auth-for-seeded-users.cjs --project=staging  # Uses edusync-staging
 * 
 * What this does:
 * 1. Reads all teachers from Firestore
 * 2. Creates Firebase Auth account for each (if not exists)
 * 3. Reads all students from Firestore
 * 4. Creates Firebase Auth account for each (if not exists)
 * 5. Reads all parents from Firestore
 * 6. Creates Firebase Auth account for each (if not exists)
 * 7. Creates corresponding 'users' collection documents (for login)
 * 
 * Password Strategy:
 * - Teachers: "teacher123"
 * - Students: "student123"
 * - Parents: "parent123"
 * - Super Admin: "admin123"
 */

const admin = require('firebase-admin');

// ===== CONFIGURATION =====
const args = process.argv.slice(2);
const projectArg = args.find(arg => arg.startsWith('--project='));
const projectAlias = projectArg ? projectArg.split('=')[1] : 'production';

const PROJECT_MAP = {
  'production': 'edusync-sis',
  'staging': 'edusync-staging',
  'edusync-sis': 'edusync-sis',
  'edusync-staging': 'edusync-staging'
};

const PROJECT_ID = PROJECT_MAP[projectAlias] || 'edusync-sis';

console.log('🔐 CREATE FIREBASE AUTH ACCOUNTS');
console.log('='.repeat(80));
console.log(`🎯 Target Project: ${PROJECT_ID} (alias: ${projectAlias})`);
console.log('='.repeat(80));

// Clear emulator environment variables (force production/staging)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

const auth = admin.auth();
const db = admin.firestore();

console.log('🚀 Starting Auth Account Creation...');
console.log(`📍 Project: ${PROJECT_ID}\n`);

// ===== HELPER FUNCTIONS =====

/**
 * Create a Firebase Auth account with error handling
 */
async function createAuthAccount(email, password, displayName, role, schoolId) {
  try {
    // Try to create the user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true // Pre-verify for demo/testing
    });
    
    console.log(`   ✅ Created Auth: ${email} (${displayName})`);
    
    // Set custom claims for role-based access
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      schoolId
    });
    
    // Also create in 'users' collection (required by LoginScreen)
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      displayName,
      role,
      schoolId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`   ✅ Created users doc: ${userRecord.uid}`);
    
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`   ⚠️  Auth exists: ${email} - updating users collection...`);
      
      // Get existing user UID
      try {
        const existingUser = await auth.getUserByEmail(email);
        
        // Update custom claims
        await auth.setCustomUserClaims(existingUser.uid, {
          role,
          schoolId
        });
        
        // Create/update users collection document
        await db.collection('users').doc(existingUser.uid).set({
          id: existingUser.uid,
          email,
          displayName,
          role,
          schoolId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`   ✅ Updated users doc: ${existingUser.uid}`);
        
        return { success: true, uid: existingUser.uid, existed: true };
      } catch (updateError) {
        console.error(`   ❌ Error updating ${email}:`, updateError.message);
        return { success: false, error: updateError.message };
      }
    } else {
      console.error(`   ❌ Error creating ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Process teachers
 */
async function processTeachers() {
  console.log('👨‍🏫 [1/3] Processing Teachers...\n');
  
  const teachersSnapshot = await db.collection('teachers').get();
  console.log(`   Found ${teachersSnapshot.size} teachers in Firestore`);
  
  let created = 0;
  let existed = 0;
  let failed = 0;
  
  for (const doc of teachersSnapshot.docs) {
    const teacher = doc.data();
    const email = teacher.email;
    const displayName = teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    const role = teacher.role || 'teacher';
    const schoolId = teacher.schoolId || 'default';
    
    const result = await createAuthAccount(email, 'teacher123', displayName, role, schoolId);
    
    if (result.success) {
      if (result.existed) {
        existed++;
      } else {
        created++;
      }
    } else {
      failed++;
    }
  }
  
  console.log(`\n   📊 Teachers Summary:`);
  console.log(`      ✅ Created: ${created}`);
  console.log(`      ⚠️  Existed: ${existed}`);
  console.log(`      ❌ Failed: ${failed}`);
  console.log('');
}

/**
 * Process students
 */
async function processStudents() {
  console.log('👨‍🎓 [2/3] Processing Students...\n');
  
  const studentsSnapshot = await db.collection('students').get();
  console.log(`   Found ${studentsSnapshot.size} students in Firestore`);
  
  let created = 0;
  let existed = 0;
  let failed = 0;
  
  for (const doc of studentsSnapshot.docs) {
    const student = doc.data();
    const email = student.email;
    const displayName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const schoolId = student.schoolId || 'default';
    
    const result = await createAuthAccount(email, 'student123', displayName, 'student', schoolId);
    
    if (result.success) {
      if (result.existed) {
        existed++;
      } else {
        created++;
      }
    } else {
      failed++;
    }
  }
  
  console.log(`\n   📊 Students Summary:`);
  console.log(`      ✅ Created: ${created}`);
  console.log(`      ⚠️  Existed: ${existed}`);
  console.log(`      ❌ Failed: ${failed}`);
  console.log('');
}

/**
 * Process parents
 */
async function processParents() {
  console.log('👨‍👩‍👧‍👦 [3/3] Processing Parents...\n');
  
  const parentsSnapshot = await db.collection('parents').get();
  console.log(`   Found ${parentsSnapshot.size} parents in Firestore`);
  
  let created = 0;
  let existed = 0;
  let failed = 0;
  
  for (const doc of parentsSnapshot.docs) {
    const parent = doc.data();
    const email = parent.email;
    const displayName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim();
    const schoolId = parent.schoolId || 'default';
    
    const result = await createAuthAccount(email, 'parent123', displayName, 'parent', schoolId);
    
    if (result.success) {
      if (result.existed) {
        existed++;
      } else {
        created++;
      }
    } else {
      failed++;
    }
  }
  
  console.log(`\n   📊 Parents Summary:`);
  console.log(`      ✅ Created: ${created}`);
  console.log(`      ⚠️  Existed: ${existed}`);
  console.log(`      ❌ Failed: ${failed}`);
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('⏳ Starting...\n');
    
    await processTeachers();
    await processStudents();
    await processParents();
    
    console.log('='.repeat(80));
    console.log('✅ COMPLETE!');
    console.log('='.repeat(80));
    console.log('\n📋 Default Passwords:');
    console.log('   Teachers: teacher123');
    console.log('   Students: student123');
    console.log('   Parents: parent123');
    console.log('   Super Admin: admin123');
    console.log('\n💡 Test Login:');
    console.log('   Email: superadmin@edusync-demo.ph');
    console.log('   Password: admin123');
    console.log('');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
