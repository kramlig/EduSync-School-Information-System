#!/usr/bin/env node
/**
 * Validate Setup - Ensures emulator configuration is consistent
 * Run this anytime you're unsure about your setup
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_CONFIG = {
  firestorePort: '8086',
  authPort: '9100',
  storagePort: '9200',
  vitePort: '5173',
  projectId: 'edusync-local'
};

const errors = [];
const warnings = [];

console.log('🔍 Validating EduSync Setup Configuration...\n');

// 1. Check firebase.json
try {
  const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  
  if (firebaseJson.emulators?.firestore?.port !== parseInt(EXPECTED_CONFIG.firestorePort)) {
    errors.push(`firebase.json: Firestore port should be ${EXPECTED_CONFIG.firestorePort}, found ${firebaseJson.emulators?.firestore?.port}`);
  } else {
    console.log('✅ firebase.json - Firestore port: 8086');
  }
  
  if (firebaseJson.emulators?.auth?.port !== parseInt(EXPECTED_CONFIG.authPort)) {
    errors.push(`firebase.json: Auth port should be ${EXPECTED_CONFIG.authPort}, found ${firebaseJson.emulators?.auth?.port}`);
  } else {
    console.log('✅ firebase.json - Auth port: 9100');
  }
  
  if (firebaseJson.emulators?.storage?.port !== parseInt(EXPECTED_CONFIG.storagePort)) {
    warnings.push(`firebase.json: Storage port should be ${EXPECTED_CONFIG.storagePort}, found ${firebaseJson.emulators?.storage?.port}`);
  } else {
    console.log('✅ firebase.json - Storage port: 9200');
  }
} catch (e) {
  errors.push(`firebase.json: Cannot read or parse - ${e.message}`);
}

// 2. Check .env.local
try {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  
  if (!envLocal.includes(`VITE_FIRESTORE_EMULATOR_PORT=${EXPECTED_CONFIG.firestorePort}`)) {
    errors.push(`.env.local: Should have VITE_FIRESTORE_EMULATOR_PORT=${EXPECTED_CONFIG.firestorePort}`);
  } else {
    console.log('✅ .env.local - Firestore emulator port: 8086');
  }
  
  if (!envLocal.includes('VITE_USE_FIREBASE_EMULATOR=true')) {
    errors.push('.env.local: Should have VITE_USE_FIREBASE_EMULATOR=true');
  } else {
    console.log('✅ .env.local - Emulator enabled');
  }
  
  if (!envLocal.includes(`VITE_FIREBASE_PROJECT_ID=${EXPECTED_CONFIG.projectId}`)) {
    errors.push(`.env.local: Should have VITE_FIREBASE_PROJECT_ID=${EXPECTED_CONFIG.projectId}`);
  } else {
    console.log('✅ .env.local - Project ID: edusync-local');
  }
} catch (e) {
  errors.push(`.env.local: Cannot read - ${e.message}`);
}

// 3. Check package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts['dev:emu'].includes(`emu-wait.cjs 127.0.0.1 ${EXPECTED_CONFIG.firestorePort}`)) {
    errors.push(`package.json: dev:emu should wait for port ${EXPECTED_CONFIG.firestorePort}`);
  } else {
    console.log('✅ package.json - dev:emu waits for correct port');
  }
} catch (e) {
  errors.push(`package.json: Cannot read or parse - ${e.message}`);
}

// 4. Check seed-complete.cjs
try {
  const seedComplete = fs.readFileSync('scripts/seed-complete.cjs', 'utf8');
  
  if (!seedComplete.includes(`FIRESTORE_EMULATOR_HOST = '127.0.0.1:${EXPECTED_CONFIG.firestorePort}'`)) {
    errors.push(`seed-complete.cjs: Should connect to 127.0.0.1:${EXPECTED_CONFIG.firestorePort}`);
  } else {
    console.log('✅ seed-complete.cjs - Connects to port 8086');
  }
} catch (e) {
  warnings.push(`seed-complete.cjs: Cannot read - ${e.message}`);
}

// 5. Check emu-seed-and-admin.cjs
try {
  const emuSeed = fs.readFileSync('scripts/emu-seed-and-admin.cjs', 'utf8');
  
  if (!emuSeed.includes('seed-complete.cjs')) {
    warnings.push('emu-seed-and-admin.cjs: Should use seed-complete.cjs for comprehensive seeding');
  } else {
    console.log('✅ emu-seed-and-admin.cjs - Uses seed-complete.cjs');
  }
  
  if (!emuSeed.includes(`FIRESTORE_EMULATOR_HOST: '127.0.0.1:${EXPECTED_CONFIG.firestorePort}'`)) {
    errors.push(`emu-seed-and-admin.cjs: Should set FIRESTORE_EMULATOR_HOST to 127.0.0.1:${EXPECTED_CONFIG.firestorePort}`);
  } else {
    console.log('✅ emu-seed-and-admin.cjs - Correct emulator host');
  }
} catch (e) {
  errors.push(`emu-seed-and-admin.cjs: Cannot read - ${e.message}`);
}

// Print summary
console.log('\n' + '='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ ALL CHECKS PASSED - Setup is correct!\n');
  console.log('You can confidently run:');
  console.log('  npm run dev:emu    - Start emulator + seed + dev server');
  console.log('  npm run dev:uat    - Connect to production Firebase');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} ERROR(S) FOUND:\n`);
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} WARNING(S):\n`);
    warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
  }
  
  console.log('\n🔧 To fix these issues, run:');
  console.log('   node scripts/fix-setup.cjs\n');
  
  process.exit(errors.length > 0 ? 1 : 0);
}
