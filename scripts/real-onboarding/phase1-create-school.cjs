/**
 * REAL SCHOOL ONBOARDING - PHASE 1
 * Create a fresh school account (simulating new customer signup)
 * 
 * This mirrors what happens when a school first signs up:
 * 1. School document created
 * 2. School admin account created (principal/registrar)
 * 3. School settings initialized
 * 
 * Date: November 17, 2025
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Initialize Firebase Admin with Application Default Credentials
// Requires: firebase login (already authenticated)
const projectId = 'edusync-sis';

// CRITICAL: Ensure we connect to PRODUCTION, not emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();
const auth = getAuth();

async function createSchool() {
  console.log('\n🏫 PHASE 1: CREATE FRESH SCHOOL\n');
  console.log('This simulates a real school signing up for EduSync for the first time.\n');
  
  // Get school details
  const schoolName = await question('School Name (e.g., "San Jose High School"): ');
  const schoolId = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const adminEmail = await question('School Admin Email (e.g., "admin@sanjose.edu"): ');
  const adminPassword = await question('School Admin Password (min 6 chars): ');
  
  console.log('\n📋 School Details:');
  console.log(`   Name: ${schoolName}`);
  console.log(`   ID: ${schoolId}`);
  console.log(`   Admin Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  
  const confirm = await question('\nProceed? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Creating school...\n');
  
  try {
    // Step 1: Check if school already exists
    console.log('Step 1: Checking if school exists...');
    const schoolRef = db.collection('schools').doc(schoolId);
    const schoolSnap = await schoolRef.get();
    
    if (schoolSnap.exists) {
      console.log('⚠️  School already exists! Updating instead...');
    }
    
    // Step 2: Create school document
    console.log('Step 2: Creating school document...');
    await schoolRef.set({
      name: schoolName,
      address: '',
      contact: '',
      email: adminEmail,
      principal: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        schoolYear: '2024-2025',
        currentQuarter: 'Q1',
        gradingSystem: 'weighted',
        features: {
          enrollment: { enabled: true },
          grading: { enabled: true },
          coreValues: { enabled: true },
          financial: { enabled: false },
          reports: { enabled: true }
        }
      }
    }, { merge: true });
    console.log('✅ School document created');
    
    // Step 3: Create school admin Firebase Auth user
    console.log('Step 3: Creating school admin Firebase Auth account...');
    let authUser;
    try {
      authUser = await auth.createUser({
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        emailVerified: true,
        displayName: `${schoolName} Administrator`
      });
      console.log('✅ Firebase Auth user created:', authUser.uid);
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        console.log('⚠️  Email already exists, fetching existing user...');
        authUser = await auth.getUserByEmail(adminEmail.toLowerCase());
        console.log('✅ Using existing Firebase Auth user:', authUser.uid);
      } else {
        throw authError;
      }
    }
    
    // Step 4: Set custom claims for school admin
    console.log('Step 4: Setting custom claims (role: admin)...');
    await auth.setCustomUserClaims(adminUser.uid, {
      role: 'admin',
      schoolId: schoolId
    });
    console.log('✅ Custom claims set');
    
    // Step 5: Create users collection document
    console.log('Step 5: Creating users collection document...');
    await db.collection('users').doc(adminUser.uid).set({
      email: adminEmail.toLowerCase(),
      role: 'admin',
      schoolId: schoolId,
      name: `${schoolName} Administrator`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ Users document created');
    
    // Step 6: Create userRoles document (for role priority)
    console.log('Step 6: Creating userRoles document...');
    await db.collection('userRoles').doc(adminUser.uid).set({
      email: adminEmail.toLowerCase(),
      role: 'admin',
      schoolId: schoolId,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: 'system'
    }, { merge: true });
    console.log('✅ UserRoles document created');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ PHASE 1 COMPLETE: School Created Successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   School ID: ${schoolId}`);
    console.log(`   School Name: ${schoolData.name}`);
    console.log(`   School Admin Email: ${adminEmail}`);
    console.log(`   Firebase UID: ${authUser.uid}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🔗 Login URL: https://edusync.ph');
    console.log('   Use the "Staff" tab to log in');
    console.log('\n📝 Next Steps:');
    console.log('   Run Phase 2: Create teachers through UI simulation');
    console.log('   Command: node scripts/real-onboarding/phase2-create-teachers.cjs');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }
  
  rl.close();
}

createSchool().catch(console.error);
