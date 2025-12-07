/**
 * Create Division Auth Accounts in Firebase
 * 
 * This script creates Firebase Auth accounts for division users
 * so they can log in and test the Division-Level Access feature.
 * 
 * Usage:
 *   node scripts/create-division-auth-accounts.cjs
 * 
 * For emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/create-division-auth-accounts.cjs
 */

const admin = require('firebase-admin');

// Division user accounts to create
const DIVISION_ACCOUNTS = [
  {
    email: 'div.admin@zamboanga.deped.gov.ph',
    password: 'division123',
    displayName: 'Division Admin',
    firebaseUid: 'div_admin_zamboanga_001'
  },
  {
    email: 'supervisor@zamboanga.deped.gov.ph',
    password: 'division123',
    displayName: 'Division Supervisor',
    firebaseUid: 'div_supervisor_zamboanga_001'
  },
  {
    email: 'psds.west@zamboanga.deped.gov.ph',
    password: 'division123',
    displayName: 'PSDS West District',
    firebaseUid: 'div_psds_west_001'
  },
  {
    email: 'eps.math@zamboanga.deped.gov.ph',
    password: 'division123',
    displayName: 'EPS Mathematics',
    firebaseUid: 'div_eps_math_001'
  },
  {
    email: 'data.manager@zamboanga.deped.gov.ph',
    password: 'division123',
    displayName: 'Division Data Manager',
    firebaseUid: 'div_data_manager_001'
  }
];

async function initializeFirebase() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // Check for emulator
  const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
  
  if (isEmulator) {
    console.log('🔧 Running against Firebase Emulator');
    console.log(`   Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'not set'}`);
    console.log(`   Firestore: ${process.env.FIRESTORE_EMULATOR_HOST || 'not set'}`);
    
    // Initialize with demo project for emulator
    return admin.initializeApp({
      projectId: 'demo-edusync'
    });
  }

  // Production - use service account
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!serviceAccountPath) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    console.error('   For emulator, set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099');
    console.error('   For production, set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function createOrUpdateUser(account) {
  const auth = admin.auth();
  
  try {
    // Try to get existing user by email
    const existingUser = await auth.getUserByEmail(account.email).catch(() => null);
    
    if (existingUser) {
      console.log(`   ⚠️ User exists: ${account.email} (UID: ${existingUser.uid})`);
      
      // Update the user's password and display name
      await auth.updateUser(existingUser.uid, {
        password: account.password,
        displayName: account.displayName
      });
      console.log(`   ✅ Updated password and display name`);
      
      return { ...account, uid: existingUser.uid, action: 'updated' };
    }
    
    // Create new user with specific UID
    const userRecord = await auth.createUser({
      uid: account.firebaseUid,
      email: account.email,
      password: account.password,
      displayName: account.displayName,
      emailVerified: true // Skip email verification for demo accounts
    });
    
    console.log(`   ✅ Created: ${account.email} (UID: ${userRecord.uid})`);
    return { ...account, uid: userRecord.uid, action: 'created' };
    
  } catch (error) {
    // If UID already exists, try creating without specific UID
    if (error.code === 'auth/uid-already-exists') {
      try {
        const userRecord = await auth.createUser({
          email: account.email,
          password: account.password,
          displayName: account.displayName,
          emailVerified: true
        });
        console.log(`   ✅ Created with auto UID: ${account.email} (UID: ${userRecord.uid})`);
        return { ...account, uid: userRecord.uid, action: 'created' };
      } catch (innerError) {
        console.error(`   ❌ Failed to create ${account.email}:`, innerError.message);
        return { ...account, error: innerError.message, action: 'failed' };
      }
    }
    
    console.error(`   ❌ Failed: ${account.email}:`, error.message);
    return { ...account, error: error.message, action: 'failed' };
  }
}

async function updatePostgresqlFirebaseUids(results) {
  // Only update if we have successful creates with different UIDs
  const needsUpdate = results.filter(r => 
    r.action === 'created' && r.uid !== r.firebaseUid
  );
  
  if (needsUpdate.length === 0) {
    return;
  }
  
  console.log('\n📝 Updating PostgreSQL division_users with Firebase UIDs...');
  
  // Try to connect to Supabase/PostgreSQL
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('   ⚠️ Supabase credentials not found. Manual update required.');
      console.log('   Run these SQL updates:');
      needsUpdate.forEach(u => {
        console.log(`   UPDATE division_users SET firebase_uid = '${u.uid}' WHERE email = '${u.email}';`);
      });
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    for (const user of needsUpdate) {
      const { error } = await supabase
        .from('division_users')
        .update({ firebase_uid: user.uid })
        .eq('email', user.email);
      
      if (error) {
        console.log(`   ⚠️ Failed to update ${user.email}: ${error.message}`);
      } else {
        console.log(`   ✅ Updated firebase_uid for ${user.email}`);
      }
    }
  } catch (err) {
    console.log('   ⚠️ Could not connect to PostgreSQL:', err.message);
    console.log('   Manual update required for these users:');
    needsUpdate.forEach(u => {
      console.log(`   UPDATE division_users SET firebase_uid = '${u.uid}' WHERE email = '${u.email}';`);
    });
  }
}

async function main() {
  console.log('🚀 Creating Division Auth Accounts\n');
  
  await initializeFirebase();
  
  console.log('📋 Processing accounts...\n');
  
  const results = [];
  
  for (const account of DIVISION_ACCOUNTS) {
    const result = await createOrUpdateUser(account);
    results.push(result);
  }
  
  // Update PostgreSQL if needed
  await updatePostgresqlFirebaseUids(results);
  
  // Summary
  const created = results.filter(r => r.action === 'created').length;
  const updated = results.filter(r => r.action === 'updated').length;
  const failed = results.filter(r => r.action === 'failed').length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  
  console.log('\n🔐 Login Credentials:');
  console.log('   Password for all accounts: division123');
  console.log('');
  console.log('   Accounts:');
  DIVISION_ACCOUNTS.forEach(a => {
    console.log(`   - ${a.email} (${a.displayName})`);
  });
  
  console.log('\n✅ Done! You can now login with these accounts on the Staff tab.');
  console.log('   Division users will be automatically redirected to /division');
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
