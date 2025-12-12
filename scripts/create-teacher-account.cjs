/**
 * Create a Firebase Auth account for a specific teacher
 * Usage: node scripts/create-teacher-account.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin with production credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'edusync-sis'
  });
}

const auth = admin.auth();

async function createTeacherAccount() {
  const email = 'ml.mutia@deped.gov.ph';
  const password = 'Msat@2024!';
  const displayName = 'Ma Lynly B. MUTIA';

  try {
    console.log(`Creating Firebase Auth account for ${email}...`);
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });

    console.log('\n✅ Successfully created teacher account:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log('\n🔐 The teacher can now log in with these credentials.');
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`\n⚠️  Account already exists for ${email}`);
      console.log('   The teacher can log in with the existing password.');
    } else {
      console.error('\n❌ Error creating account:', error.message);
      throw error;
    }
  } finally {
    process.exit(0);
  }
}

createTeacherAccount();
