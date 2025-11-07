#!/usr/bin/env node
/**
 * Set Custom Claims for Emulator Users
 * 
 * Uses Firebase Admin SDK to set custom claims.
 * Works with both emulator and production when proper env vars are set.
 * 
 * Usage:
 *   node scripts/set-emulator-claims.cjs
 */

const admin = require('firebase-admin');

// Users to set claims for
// Only including users that actually exist in the seed data
const USERS_WITH_ROLES = [
  { email: 'admin@edusync.local', role: 'admin', uid: 'admin123' },
  { email: 'juan.garcia@test.com', role: 'parent', uid: 'parent-0001' },
  // Add more users here as they are created in seed-complete.cjs
];

// Initialize Firebase Admin
let app;
try {
  // Check if running against emulator
  const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
  
  if (isEmulator) {
    console.log('🔧 Connecting to Firebase Emulator...');
    app = admin.initializeApp({
      projectId: 'edusync-local'
    });
  } else {
    console.log('🔧 Connecting to Firebase Production...');
    app = admin.initializeApp();
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

/**
 * Main function
 */
async function main() {
  console.log('� Setting custom claims for emulator users...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  // Set claims for each configured user
  for (const userConfig of USERS_WITH_ROLES) {
    console.log(`🔄 Processing ${userConfig.email}...`);
    
    try {
      // Get user by email or UID
      let user;
      if (userConfig.uid) {
        // If UID is provided, use it directly (faster)
        try {
          user = await admin.auth().getUser(userConfig.uid);
        } catch (uidError) {
          // Fallback to email lookup if UID doesn't exist
          console.log(`   ⚠️  UID not found, looking up by email...`);
          user = await admin.auth().getUserByEmail(userConfig.email);
        }
      } else {
        // Otherwise, look up by email
        user = await admin.auth().getUserByEmail(userConfig.email);
      }
      
      // Set custom claims using Admin SDK
      await admin.auth().setCustomUserClaims(user.uid, {
        role: userConfig.role,
        schoolId: 'default'
      });
      
      console.log(`   ✅ Set role '${userConfig.role}' for ${userConfig.email} (UID: ${user.uid})\n`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }
  
  // Summary
  console.log('═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total configured: ${USERS_WITH_ROLES.length}`);
  console.log(`   Successful: ${successCount} ✅`);
  console.log(`   Failed: ${failCount} ❌`);
  
  if (successCount > 0) {
    console.log(`\n✨ Custom claims set successfully!`);
    console.log(`\n⚠️  IMPORTANT: Users must log out and log back in for claims to take effect.`);
  }
  
  if (failCount > 0) {
    console.log(`\n⚠️  Some users failed. Check if they exist in the emulator.`);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
