#!/usr/bin/env node
/**
 * CREATE ESSENTIAL DEMO ACCOUNTS
 * 
 * Creates one demo account for each user role for testing purposes.
 * This script requires the Firebase Admin SDK and proper authentication.
 * 
 * Usage:
 *   firebase use staging
 *   node scripts/create-demo-accounts.cjs
 * 
 * Demo Accounts Created:
 * 1. Super Admin - superadmin@edusync-demo.ph (admin123)
 * 2. Principal - principal@edusync-demo.ph (teacher123)
 * 3. Teacher - teacher@edusync-demo.ph (teacher123)
 * 4. Student - student@edusync-demo.ph (student123)
 * 5. Parent - parent@edusync-demo.ph (parent123)
 */

const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
// This will use the currently active project from `firebase use`
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

console.log('🔐 CREATE DEMO ACCOUNTS');
console.log('='.repeat(80));

// Demo accounts configuration
const DEMO_ACCOUNTS = [
  {
    email: 'superadmin@edusync-demo.ph',
    password: 'admin123',
    displayName: 'Super Admin',
    role: 'superadmin',
    schoolId: 'default',
    firestoreCollection: 'teachers',
    firestoreData: {
      firstName: 'Super',
      lastName: 'Admin',
      name: 'Super Admin',
      isSuperAdmin: true,
      schools: ['default'],
      status: 'active',
      employeeNumber: 'SUPER-001',
      specialization: 'System Administration',
      contactNumber: '09991234567'
    }
  },
  {
    email: 'principal@edusync-demo.ph',
    password: 'teacher123',
    displayName: 'Dr. Maria Santos',
    role: 'principal',
    schoolId: 'default',
    firestoreCollection: 'teachers',
    firestoreData: {
      firstName: 'Maria',
      lastName: 'Santos',
      name: 'Dr. Maria Santos',
      status: 'active',
      employeeNumber: 'PRIN-001',
      specialization: 'School Administration',
      contactNumber: '09991234568'
    }
  },
  {
    email: 'teacher@edusync-demo.ph',
    password: 'teacher123',
    displayName: 'Juan Dela Cruz',
    role: 'teacher',
    schoolId: 'default',
    firestoreCollection: 'teachers',
    firestoreData: {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      name: 'Juan Dela Cruz',
      status: 'active',
      employeeNumber: 'TEACH-001',
      specialization: 'Mathematics',
      contactNumber: '09991234569'
    }
  },
  {
    email: 'student@edusync-demo.ph',
    password: 'student123',
    displayName: 'Ana Reyes',
    role: 'student',
    schoolId: 'default',
    firestoreCollection: 'students',
    firestoreData: {
      firstName: 'Ana',
      lastName: 'Reyes',
      gradeLevel: 7,
      section: 'sec_grade7_rizal',
      sectionName: 'Grade 7 - Rizal',
      lrn: '100000000001',
      status: 'active',
      contactNumber: '09991234570',
      address: 'Manila, Philippines'
    }
  },
  {
    email: 'parent@edusync-demo.ph',
    password: 'parent123',
    displayName: 'Roberto Reyes',
    role: 'parent',
    schoolId: 'default',
    firestoreCollection: 'parents',
    firestoreData: {
      firstName: 'Roberto',
      lastName: 'Reyes',
      name: 'Roberto Reyes',
      contactNumber: '09991234571',
      address: 'Manila, Philippines',
      relationship: 'Father',
      students: [] // Will link to student if exists
    }
  }
];

async function createAccount(accountConfig) {
  const { email, password, displayName, role, schoolId, firestoreCollection, firestoreData } = accountConfig;
  
  console.log(`\n📝 Creating: ${email} (${role})`);
  
  try {
    // Step 1: Create Firebase Auth account
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
    
    // Step 2: Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role, schoolId });
    console.log(`   ✅ Custom claims set`);
    
    // Step 3: Create users collection document (required by LoginScreen)
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      displayName,
      role,
      schoolId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`   ✅ users collection updated`);
    
    // Step 4: Create role-specific Firestore document
    const firestoreDoc = {
      id: userRecord.uid,
      email,
      role,
      schoolId,
      isDemo: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...firestoreData
    };
    
    await db.collection(firestoreCollection).doc(userRecord.uid).set(firestoreDoc, { merge: true });
    console.log(`   ✅ ${firestoreCollection} collection updated`);
    
    console.log(`   ✅ Complete: ${email}`);
    return { success: true, uid: userRecord.uid };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('Starting demo account creation...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const account of DEMO_ACCOUNTS) {
    const result = await createAccount(account);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('\n📋 DEMO ACCOUNTS:');
  console.log('─'.repeat(80));
  
  DEMO_ACCOUNTS.forEach(account => {
    console.log(`${account.role.toUpperCase().padEnd(15)} | ${account.email.padEnd(35)} | ${account.password}`);
  });
  
  console.log('─'.repeat(80));
  console.log('\n💡 TEST LOGIN:');
  console.log('   1. Go to your app URL');
  console.log('   2. Use any email above with its password');
  console.log('   3. Select the correct login tab (Staff/Student/Parent)');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
