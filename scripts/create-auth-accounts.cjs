/**
 * Create Firebase Auth accounts for teachers, students, and parents
 * Run this script AFTER seeding the database with seed-complete.cjs
 * 
 * Usage: node scripts/create-auth-accounts.cjs
 */

const admin = require('firebase-admin');

// Connect to Firebase Emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const projectId = process.env.FIREBASE_PROJECT_ID || 'edusync-local';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

console.log(`📡 Connected to emulators (Project: ${projectId})\n`);

const auth = admin.auth();
const db = admin.firestore();

/**
 * Create a Firebase Auth account
 */
async function createAuthAccount(email, password, displayName) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });
    console.log(`✅ Created: ${email} (${displayName})`);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  Already exists: ${email}`);
    } else {
      console.error(`❌ Error creating ${email}:`, error.message);
    }
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔐 Creating Firebase Auth Accounts...\n');

  try {
    // 1. Get all teachers from Firestore
    console.log('📚 Creating Teacher Accounts...');
    const teachersSnapshot = await db.collection('teachers').get();
    let teacherCount = 0;
    
    for (const doc of teachersSnapshot.docs) {
      const teacher = doc.data();
      const email = teacher.email;
      const firstName = teacher.firstName || '';
      const lastName = teacher.lastName || '';
      const displayName = `${firstName} ${lastName}`.trim();
      const password = 'teacher123'; // Simple password for demo
      
      await createAuthAccount(email, password, displayName);
      teacherCount++;
    }
    
    console.log(`\n✅ Created ${teacherCount} teacher accounts\n`);

    // 2. Get all students from Firestore
    console.log('🎓 Creating Student Accounts...');
    const studentsSnapshot = await db.collection('students').get();
    let studentCount = 0;
    
    for (const doc of studentsSnapshot.docs) {
      const student = doc.data();
      const email = student.email;
      const firstName = student.firstName || '';
      const lastName = student.lastName || '';
      const displayName = `${firstName} ${lastName}`.trim();
      const password = 'student123'; // Simple password for demo
      
      await createAuthAccount(email, password, displayName);
      studentCount++;
    }
    
    console.log(`\n✅ Created ${studentCount} student accounts\n`);

    // 3. Get all parents from Firestore
    console.log('👨‍👩‍👧‍👦 Creating Parent Accounts...');
    const parentsSnapshot = await db.collection('parents').get();
    let parentCount = 0;
    
    if (parentsSnapshot.empty) {
      console.log('⚠️  No parents found in database. Skipping parent accounts.');
    } else {
      for (const doc of parentsSnapshot.docs) {
        const parent = doc.data();
        const email = parent.email;
        const firstName = parent.firstName || '';
        const lastName = parent.lastName || '';
        const displayName = `${firstName} ${lastName}`.trim();
        const password = 'parent123'; // Simple password for demo
        
        await createAuthAccount(email, password, displayName);
        parentCount++;
      }
      console.log(`\n✅ Created ${parentCount} parent accounts\n`);
    }

    // 4. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ACCOUNT CREATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Teachers: ${teacherCount} accounts`);
    console.log(`Students: ${studentCount} accounts`);
    console.log(`Parents:  ${parentCount} accounts`);
    console.log(`Total:    ${teacherCount + studentCount + parentCount} new accounts`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔑 DEFAULT PASSWORDS:');
    console.log('  Teachers: teacher123');
    console.log('  Students: student123');
    console.log('  Parents:  parent123');
    console.log('  Admin:    admin123\n');

    console.log('✅ All accounts created successfully!');
    console.log('🚀 You can now log in with any user email and their default password\n');

  } catch (error) {
    console.error('❌ Error creating accounts:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
