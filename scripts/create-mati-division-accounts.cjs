/**
 * Create Mati City Division Auth Accounts in Firebase
 * 
 * This script creates Firebase Auth accounts for Division of City of Mati users
 * and updates their firebase_uid in the PostgreSQL database.
 * 
 * Usage (Production):
 *   node scripts/create-mati-division-accounts.cjs
 * 
 * Environment Variables Required:
 *   - GOOGLE_APPLICATION_CREDENTIALS: Path to Firebase service account JSON
 *   - VITE_SUPABASE_URL or SUPABASE_URL: Supabase project URL
 *   - VITE_SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

const admin = require('firebase-admin');

// Mati City Division user accounts to create
const MATI_DIVISION_ACCOUNTS = [
  {
    email: 'div.admin@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Amelia R. Gutierrez',
    role: 'division_admin'
  },
  {
    email: 'supervisor@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Carlos M. Villanueva',
    role: 'division_supervisor'
  },
  {
    email: 'psds.central@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Roberto P. Salazar',
    role: 'psds'
  },
  {
    email: 'psds.north@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Marissa L. Aquino',
    role: 'psds'
  },
  {
    email: 'psds.south@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Ferdinand T. Reyes',
    role: 'psds'
  },
  {
    email: 'psds.east@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Lourdes C. Magpantay',
    role: 'psds'
  },
  {
    email: 'data.manager@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Mrs. Regina T. Santos',
    role: 'division_data_manager'
  },
  {
    email: 'eps.math@mati.deped.gov.ph',
    password: 'division123',
    displayName: 'Dr. Jonathan P. Reyes',
    role: 'eps'
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
    
    // Initialize with demo project for emulator
    return admin.initializeApp({
      projectId: 'demo-edusync'
    });
  }

  // Production - use service account
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!serviceAccountPath) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    console.error('');
    console.error('Please set the path to your Firebase service account JSON:');
    console.error('  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\serviceAccountKey.json"');
    console.error('');
    console.error('Or for emulator:');
    console.error('  $env:FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"');
    process.exit(1);
  }

  console.log(`📁 Using service account: ${serviceAccountPath}`);
  
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
      console.log(`   ⚠️ User exists: ${account.email}`);
      console.log(`      UID: ${existingUser.uid}`);
      
      // Update the user's password and display name
      await auth.updateUser(existingUser.uid, {
        password: account.password,
        displayName: account.displayName
      });
      console.log(`      ✅ Updated password and display name`);
      
      return { ...account, uid: existingUser.uid, action: 'updated' };
    }
    
    // Create new user
    const userRecord = await auth.createUser({
      email: account.email,
      password: account.password,
      displayName: account.displayName,
      emailVerified: true // Skip email verification for division accounts
    });
    
    console.log(`   ✅ Created: ${account.email}`);
    console.log(`      UID: ${userRecord.uid}`);
    return { ...account, uid: userRecord.uid, action: 'created' };
    
  } catch (error) {
    console.error(`   ❌ Failed: ${account.email}`);
    console.error(`      Error: ${error.message}`);
    return { ...account, error: error.message, action: 'failed' };
  }
}

async function updateSupabaseFirebaseUids(results) {
  const successfulUsers = results.filter(r => r.action !== 'failed' && r.uid);
  
  if (successfulUsers.length === 0) {
    console.log('   ⚠️ No users to update in database');
    return;
  }
  
  console.log('\n📝 Updating PostgreSQL division_users with Firebase UIDs...\n');
  
  // Try to connect to Supabase/PostgreSQL
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('   ⚠️ Supabase credentials not found in environment.');
      console.log('');
      console.log('   Set these environment variables:');
      console.log('     $env:VITE_SUPABASE_URL="your-supabase-url"');
      console.log('     $env:VITE_SUPABASE_SERVICE_KEY="your-service-role-key"');
      console.log('');
      console.log('   Or run these SQL updates manually in Supabase Dashboard:');
      console.log('   ================================================');
      successfulUsers.forEach(u => {
        console.log(`   UPDATE division_users SET firebase_uid = '${u.uid}' WHERE email = '${u.email}';`);
      });
      console.log('   ================================================');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    for (const user of successfulUsers) {
      const { data, error } = await supabase
        .from('division_users')
        .update({ firebase_uid: user.uid })
        .eq('email', user.email)
        .select();
      
      if (error) {
        console.log(`   ❌ Failed to update ${user.email}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`   ✅ Updated: ${user.email} → ${user.uid}`);
      } else {
        console.log(`   ⚠️ No matching record for ${user.email} in division_users table`);
      }
    }
    
    console.log('');
    console.log('   Database update complete!');
  } catch (err) {
    console.log('   ⚠️ Could not connect to PostgreSQL:', err.message);
    console.log('');
    console.log('   Manual update required. Run in Supabase Dashboard:');
    console.log('   ================================================');
    successfulUsers.forEach(u => {
      console.log(`   UPDATE division_users SET firebase_uid = '${u.uid}' WHERE email = '${u.email}';`);
    });
    console.log('   ================================================');
  }
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🏫 Creating Mati City Division Auth Accounts             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  await initializeFirebase();
  
  console.log('');
  console.log('📋 Creating Firebase Auth accounts...');
  console.log('');
  
  const results = [];
  
  for (const account of MATI_DIVISION_ACCOUNTS) {
    const result = await createOrUpdateUser(account);
    results.push(result);
  }
  
  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const created = results.filter(r => r.action === 'created');
  const updated = results.filter(r => r.action === 'updated');
  const failed = results.filter(r => r.action === 'failed');
  
  console.log(`   ✅ Created: ${created.length}`);
  console.log(`   🔄 Updated: ${updated.length}`);
  console.log(`   ❌ Failed:  ${failed.length}`);
  console.log('');
  
  // Update PostgreSQL
  await updateSupabaseFirebaseUids(results);
  
  // Print login info
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔑 Login Credentials');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('   Division Portal URL: https://your-app.web.app/division');
  console.log('   Password for all accounts: division123');
  console.log('');
  console.log('   Accounts:');
  results.filter(r => r.action !== 'failed').forEach(r => {
    console.log(`   • ${r.email} (${r.role})`);
  });
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
