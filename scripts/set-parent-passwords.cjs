/**
 * Set passwords for parent Firebase Auth accounts
 * The previous script created the accounts but didn't set passwords
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

const PARENT_PASSWORD = 'parent123';

async function setParentPasswords() {
  console.log('🔐 Setting passwords for parent accounts...\n');
  
  const stats = { updated: 0, errors: 0 };
  
  for (let i = 1; i <= 10; i++) {
    const email = `parent${i}@edusync-demo.ph`;
    const uid = `parent_${i}`;
    
    try {
      // Update the user with password
      await auth.updateUser(uid, {
        password: PARENT_PASSWORD,
        emailVerified: true
      });
      
      console.log(`✅ Set password for ${email}`);
      stats.updated++;
      
    } catch (error) {
      console.error(`❌ Error for ${email}:`, error.message);
      stats.errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Updated: ${stats.updated}`);
  console.log(`  ❌ Errors: ${stats.errors}`);
  console.log(`\n🔑 Password for all parents: ${PARENT_PASSWORD}`);
  
  process.exit(0);
}

setParentPasswords();
