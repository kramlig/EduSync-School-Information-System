#!/usr/bin/env node
/**
 * Complete Test Setup Script
 * 
 * This script:
 * 1. Reseeds the emulator database with fresh data
 * 2. Sets custom claims for all test users
 * 3. Verifies the setup is correct
 * 4. Provides instructions for running Playwright tests
 * 
 * Usage:
 *   node scripts/setup-test-environment.cjs
 * 
 * Prerequisites:
 *   - Firebase emulators must be running (npm run emu:up in another terminal)
 */

const { spawnSync } = require('node:child_process');

const FIRESTORE_HOST = '127.0.0.1:8086';
const AUTH_HOST = '127.0.0.1:9100';

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function run(command, description) {
  log('🔄', description);
  
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      FIRESTORE_EMULATOR_HOST: FIRESTORE_HOST,
      FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST
    }
  });
  
  if (result.status !== 0) {
    error(`Failed: ${description}`);
    process.exit(1);
  }
  
  log('✅', `Completed: ${description}\n`);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('🚀', 'Setting up test environment...');
  console.log('='.repeat(60) + '\n');
  
  // Step 1: Verify emulator is running
  log('🔍', 'Checking if emulators are running...');
  const checkResult = spawnSync('node', ['scripts/emu-wait.cjs', '127.0.0.1', '8086', '--timeout=5000'], {
    stdio: 'pipe'
  });
  
  if (checkResult.status !== 0) {
    error('Emulators are not running!');
    console.log('\n📝 Please start the emulators first:');
    console.log('   npm run emu:up\n');
    process.exit(1);
  }
  
  log('✅', 'Emulators are running\n');
  
  // Step 2: Reseed database
  run('node scripts/seed-complete.cjs', 'Reseeding database with fresh data');
  
  // Step 3: Verify seed
  run('node scripts/verify-seed.cjs --projectId=edusync-local --emuHost=127.0.0.1 --emuPort=8086', 'Verifying seeded data');
  
  // Step 4: Set custom claims (redundant but ensures they're set)
  log('🔑', 'Setting custom claims...');
  const claimsResult = spawnSync('node', ['scripts/set-emulator-claims.cjs'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      FIRESTORE_EMULATOR_HOST: FIRESTORE_HOST,
      FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST
    }
  });
  
  if (claimsResult.status === 0) {
    log('✅', 'Custom claims set successfully\n');
  } else {
    log('⚠️', 'Custom claims script had issues (but seed script already set them)\n');
  }
  
  // Success!
  console.log('='.repeat(60));
  log('✨', 'Test environment is ready!');
  console.log('='.repeat(60) + '\n');
  
  console.log('📊 Test Accounts:');
  console.log('   Admin:  admin@edusync.local / admin123');
  console.log('   Parent: juan.garcia@test.com / parent123\n');
  
  console.log('🧪 Run Playwright Tests:');
  console.log('   npm run test:playwright');
  console.log('   npx playwright test tests/custom-claims-security.spec.ts\n');
  
  console.log('🌐 Access the application:');
  console.log('   http://localhost:5173\n');
  
  console.log('⚠️  IMPORTANT:');
  console.log('   If you were logged in before, you MUST:');
  console.log('   1. Open the app in browser');
  console.log('   2. Log out completely');
  console.log('   3. Clear browser cache (Ctrl+Shift+Del)');
  console.log('   4. Log back in with fresh credentials');
  console.log('   This ensures you get a new JWT token with custom claims!\n');
}

main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
