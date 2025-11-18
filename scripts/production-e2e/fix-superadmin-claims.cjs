#!/usr/bin/env node
/**
 * FIX PHASE 2: Reset Superadmin Custom Claims
 * 
 * The superadmin account has incorrect custom claims from previous testing.
 * This script resets them to the correct values.
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const auth = getAuth();

  console.log('\n🔧 FIXING SUPERADMIN CUSTOM CLAIMS');
  console.log('═'.repeat(80));

  try {
    const email = 'superadmin-demo@edusync.ph';
    
    // Get current user
    const user = await auth.getUserByEmail(email);
    console.log(`\n📧 User: ${email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Current claims:`, user.customClaims);
    
    // Set correct claims
    const correctClaims = {
      role: 'superadmin',
      schoolId: null
    };
    
    await auth.setCustomUserClaims(user.uid, correctClaims);
    console.log(`\n   ✅ Updated to:`, correctClaims);
    
    // Verify
    const updatedUser = await auth.getUser(user.uid);
    console.log(`   ✅ Verified:`, updatedUser.customClaims);
    
    console.log('\n✅ SUPERADMIN FIXED!');
    console.log('\n📋 Next step:');
    console.log('   node scripts/production-e2e/verify-phase2.cjs\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

run();
