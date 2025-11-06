#!/usr/bin/env node
/**
 * Set Custom Claims for Emulator Users
 * 
 * The Firebase Emulator doesn't support setCustomUserClaims from Admin SDK,
 * so we need to use the Emulator REST API to set custom claims.
 * 
 * Usage:
 *   node scripts/set-emulator-claims.cjs
 */

const http = require('http');

// Emulator configuration
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_AUTH_PORT = 9100; // Changed from 9099 to match firebase.json
const PROJECT_ID = 'edusync-local';

// Users to set claims for
const USERS_WITH_ROLES = [
  { email: 'admin@edusync.local', role: 'admin' },
  { email: 'principal@edusync.local', role: 'principal' },
  { email: 'registrar@edusync.local', role: 'registrar' },
  // Teachers - add more as needed
  { email: 'teacher1@edusync.local', role: 'teacher' },
  { email: 'teacher2@edusync.local', role: 'teacher' },
  { email: 'teacher3@edusync.local', role: 'teacher' },
  { email: 'teacher4@edusync.local', role: 'teacher' },
  { email: 'teacher5@edusync.local', role: 'teacher' },
  // Parents - add more as needed
  { email: 'parent1@edusync.local', role: 'parent' },
  { email: 'parent2@edusync.local', role: 'parent' },
  { email: 'parent3@edusync.local', role: 'parent' },
];

/**
 * Make HTTP request to emulator
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Get all users from emulator
 */
async function getAllUsers() {
  const options = {
    hostname: EMULATOR_HOST,
    port: EMULATOR_AUTH_PORT,
    path: `/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query?key=fake-api-key`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  
  try {
    const response = await makeRequest(options, {});
    return response.users || [];
  } catch (error) {
    console.error('❌ Failed to get users:', error.message);
    return [];
  }
}

/**
 * Set custom claims for a user
 */
async function setCustomClaims(localId, email, role) {
  const options = {
    hostname: EMULATOR_HOST,
    port: EMULATOR_AUTH_PORT,
    path: `/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update?key=fake-api-key`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const data = {
    localId: localId,
    customAttributes: JSON.stringify({ role: role })
  };
  
  try {
    await makeRequest(options, data);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set claims for ${email}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Setting custom claims for emulator users...\n');
  
  // Get all users from emulator
  const allUsers = await getAllUsers();
  
  if (allUsers.length === 0) {
    console.error('❌ No users found in emulator. Make sure emulator is running and seeded.\n');
    process.exit(1);
  }
  
  console.log(`📋 Found ${allUsers.length} users in emulator\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Set claims for each configured user
  for (const userConfig of USERS_WITH_ROLES) {
    const user = allUsers.find(u => u.email === userConfig.email);
    
    if (!user) {
      console.log(`⚠️  User not found: ${userConfig.email} (skipping)`);
      failCount++;
      continue;
    }
    
    console.log(`🔑 Setting role '${userConfig.role}' for ${userConfig.email}...`);
    const success = await setCustomClaims(user.localId, userConfig.email, userConfig.role);
    
    if (success) {
      console.log(`   ✅ Success!\n`);
      successCount++;
    } else {
      console.log(`   ❌ Failed!\n`);
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
