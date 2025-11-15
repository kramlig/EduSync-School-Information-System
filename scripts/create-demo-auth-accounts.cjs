#!/usr/bin/env node
/**
 * CREATE DEMO AUTH ACCOUNTS
 * 
 * Creates essential demo accounts for each user role
 * This script uses Firebase Admin SDK without Application Default Credentials
 * 
 * Usage:
 *   node scripts/create-demo-auth-accounts.cjs --project=staging
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Parse arguments
const args = process.argv.slice(2);
const projectArg = args.find(arg => arg.startsWith('--project='));
const projectAlias = projectArg ? projectArg.split('=')[1] : 'production';

const PROJECT_MAP = {
  'production': 'edusync-sis',
  'staging': 'edusync-staging'
};

const PROJECT_ID = PROJECT_MAP[projectAlias] || 'edusync-sis';

console.log('🔐 CREATE DEMO AUTH ACCOUNTS');
console.log('='.repeat(80));
console.log(`🎯 Target Project: ${PROJECT_ID}`);
console.log('='.repeat(80));

// CRITICAL: Clear emulator environment variables to force production connection
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Initialize without credentials (will use firebase login session)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID
  });
}

const auth = getAuth();
const db = getFirestore();

// Demo accounts to create
const DEMO_ACCOUNTS = [
  {
    email: 'superadmin@edusync-demo.ph',
    password: 'admin123',
    displayName: 'Super Admin',
    role: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin',
    collection: 'teachers'
  },
  {
    email: 'admin@edusync-demo.ph',
    password: 'admin123',
    displayName: 'School Admin',
    role: 'admin',
    firstName: 'School',
    lastName: 'Admin',
    collection: 'teachers'
  },
  {
    email: 'teacher@edusync-demo.ph',
    password: 'teacher123',
    displayName: 'Demo Teacher',
    role: 'teacher',
    firstName: 'Demo',
    lastName: 'Teacher',
    collection: 'teachers'
  },
  {
    email: 'student@edusync-demo.ph',
    password: 'student123',
    displayName: 'Demo Student',
    role: 'student',
    firstName: 'Demo',
    lastName: 'Student',
    gradeLevel: 7,
    collection: 'students'
  },
  {
    email: 'parent@edusync-demo.ph',
    password: 'parent123',
    displayName: 'Demo Parent',
    role: 'parent',
    firstName: 'Demo',
    lastName: 'Parent',
    collection: 'parents'
  }
];

async function createAccount(account) {
  const { email, password, displayName, role, firstName, lastName, collection, gradeLevel } = account;
  
  try {
    console.log(`\n📝 Creating: ${email} (${role})`);
    
    // 1. Create Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true
      });
      console.log(`   ✅ Auth created: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`   ⚠️  Auth exists, fetching...`);
        userRecord = await auth.getUserByEmail(email);
        console.log(`   ✅ Auth found: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }
    
    // 2. Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      schoolId: 'default'
    });
    console.log(`   ✅ Custom claims set`);
    
    // 3. Create users collection document (required by LoginScreen)
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      displayName,
      role,
      schoolId: 'default',
      firstName,
      lastName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`   ✅ users collection created`);
    
    // 4. Create role-specific collection document
    const roleData = {
      id: userRecord.uid,
      email,
      name: displayName,
      firstName,
      lastName,
      role,
      schoolId: 'default',
      status: 'active',
      isDemo: true
    };
    
    if (collection === 'teachers') {
      roleData.employeeNumber = `DEMO-${role.toUpperCase()}`;
      roleData.specialization = 'General';
      if (role === 'superadmin') {
        roleData.isSuperAdmin = true;
        roleData.schools = ['default'];
      }
    }
    
    if (collection === 'students') {
      roleData.gradeLevel = gradeLevel;
      roleData.studentNumber = 'DEMO-STUDENT-001';
      roleData.sectionId = null;
    }
    
    if (collection === 'parents') {
      roleData.contactNumber = '09123456789';
      roleData.children = [];
    }
    
    await db.collection(collection).doc(userRecord.uid).set(roleData);
    console.log(`   ✅ ${collection} collection created`);
    
    console.log(`   ✅ COMPLETE: ${email}`);
    
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    console.log('\n🚀 Starting account creation...\n');
    
    for (const account of DEMO_ACCOUNTS) {
      await createAccount(account);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL DEMO ACCOUNTS CREATED!');
    console.log('='.repeat(80));
    console.log('\n📋 Login Credentials:\n');
    
    DEMO_ACCOUNTS.forEach(acc => {
      console.log(`   ${acc.role.toUpperCase().padEnd(12)} - ${acc.email.padEnd(35)} / ${acc.password}`);
    });
    
    console.log('\n💡 You can now login with any of these accounts!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
