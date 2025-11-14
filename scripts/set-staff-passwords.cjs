/**
 * Set passwords for staff Firebase Auth accounts
 */

const admin = require('firebase-admin');

// Ensure we're NOT using emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'edusync-sis'
});

const auth = admin.auth();

const STAFF_ACCOUNTS = [
  { email: 'admin@school.edu', password: 'admin123' },
  { email: 'principal@school.edu', password: 'principal123' },
  { email: 'registrar@school.edu', password: 'registrar123' },
  { email: 'superadmin@edusync-demo.ph', password: 'superadmin123' }
];

async function setStaffPasswords() {
  console.log('🔐 Setting passwords for staff accounts...\n');
  
  const stats = { updated: 0, errors: 0 };
  
  for (const account of STAFF_ACCOUNTS) {
    try {
      // Get user by email first
      const user = await auth.getUserByEmail(account.email);
      
      // Update the user with password
      await auth.updateUser(user.uid, {
        password: account.password,
        emailVerified: true
      });
      
      console.log(`✅ Set password for ${account.email} (password: ${account.password})`);
      stats.updated++;
      
    } catch (error) {
      console.error(`❌ Error for ${account.email}:`, error.message);
      stats.errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Updated: ${stats.updated}`);
  console.log(`  ❌ Errors: ${stats.errors}`);
  
  process.exit(0);
}

setStaffPasswords();
