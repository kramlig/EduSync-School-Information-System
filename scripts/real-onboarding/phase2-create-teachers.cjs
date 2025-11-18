/**
 * REAL SCHOOL ONBOARDING - PHASE 2
 * Create teachers through UI simulation (what admin will actually do)
 * 
 * This simulates admin using the UI to add teachers:
 * 1. Creates Firebase Auth accounts
 * 2. Sets custom claims (role: teacher)
 * 3. Creates users collection documents
 * 4. Creates teachers collection documents
 * 
 * IMPORTANT: This tests the ACTUAL user creation flow
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

// Teacher templates (realistic data)
const TEACHER_TEMPLATES = [
  { name: 'Maria Santos', email: 'maria.santos@teacher.local', subjects: ['Filipino', 'AP'] },
  { name: 'Juan Cruz', email: 'juan.cruz@teacher.local', subjects: ['Mathematics', 'Science'] },
  { name: 'Ana Reyes', email: 'ana.reyes@teacher.local', subjects: ['English', 'TLE'] },
  { name: 'Pedro Garcia', email: 'pedro.garcia@teacher.local', subjects: ['MAPEH', 'Values'] },
  { name: 'Rosa Mendoza', email: 'rosa.mendoza@teacher.local', subjects: ['ESP', 'Music'] }
];

async function createTeacher(schoolId, teacherData, defaultPassword) {
  const { name, email, subjects } = teacherData;
  
  console.log(`\n   Creating: ${name} (${email})...`);
  
  try {
    // Step 1: Create Firebase Auth user
    let authUser;
    try {
      authUser = await auth.createUser({
        email: email.toLowerCase(),
        password: defaultPassword,
        emailVerified: true,
        displayName: name
      });
      console.log(`   ✅ Auth created: ${authUser.uid}`);
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        console.log(`   ⚠️  Email exists, using existing user`);
        authUser = await auth.getUserByEmail(email.toLowerCase());
      } else {
        throw authError;
      }
    }
    
    // Step 2: Set custom claims (CRITICAL for login)
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'teacher',
      schoolId: schoolId
    });
    console.log(`   ✅ Custom claims set (role: teacher)`);
    
    // Step 3: Create users collection document
    await db.collection('users').doc(authUser.uid).set({
      email: email.toLowerCase(),
      role: 'teacher',
      schoolId: schoolId,
      name: name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`   ✅ Users document created`);
    
    // Step 4: Create userRoles document (for priority system)
    await db.collection('userRoles').doc(authUser.uid).set({
      email: email.toLowerCase(),
      role: 'teacher',
      schoolId: schoolId,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: 'admin-ui'
    }, { merge: true });
    console.log(`   ✅ UserRoles document created`);
    
    // Step 5: Create teachers collection document
    const teacherRef = db.collection('teachers').doc();
    await teacherRef.set({
      userId: authUser.uid,
      schoolId: schoolId,
      name: name,
      email: email.toLowerCase(),
      subjects: subjects,
      assignments: [], // IMPORTANT: Will be populated in Phase 4
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`   ✅ Teachers document created: ${teacherRef.id}`);
    
    console.log(`   ✅ ${name} created successfully!\n`);
    
    return {
      uid: authUser.uid,
      teacherId: teacherRef.id,
      name: name,
      email: email,
      subjects: subjects
    };
    
  } catch (error) {
    console.error(`   ❌ Error creating ${name}:`, error.message);
    throw error;
  }
}

async function createTeachers() {
  console.log('\n👨‍🏫 PHASE 2: CREATE TEACHERS\n');
  console.log('This simulates admin using the UI to add teachers.\n');
  
  // Auto-detect school (should only be one)
  console.log('🔍 Auto-detecting school...');
  const schoolsSnap = await db.collection('schools').limit(2).get();
  
  if (schoolsSnap.empty) {
    console.log('❌ No schools found! Run Phase 1 first.');
    rl.close();
    return;
  }
  
  if (schoolsSnap.size > 1) {
    console.log('⚠️  Multiple schools found. Please specify:');
    schoolsSnap.forEach((doc, i) => {
      console.log(`   ${i+1}. ${doc.id} - ${doc.data().name}`);
    });
    const choice = await question('\nEnter school number: ');
    const schoolDoc = schoolsSnap.docs[parseInt(choice) - 1];
    var schoolId = schoolDoc.id;
    var schoolData = schoolDoc.data();
  } else {
    const schoolDoc = schoolsSnap.docs[0];
    var schoolId = schoolDoc.id;
    var schoolData = schoolDoc.data();
  }
  
  console.log(`✅ Using school: ${schoolData.name} (${schoolId})\n`);
  
  const defaultPassword = 'Teacher123!'; // Auto-generated password
  console.log(`🔐 Using default password: ${defaultPassword}\n`);
  
  console.log(`📋 Will create ${TEACHER_TEMPLATES.length} teachers:`);
  TEACHER_TEMPLATES.forEach((t, i) => {
    console.log(`   ${i+1}. ${t.name} - ${t.subjects.join(', ')}`);
  });
  
  console.log('\n🚀 Creating teachers...');
  
  const createdTeachers = [];
  
  for (const template of TEACHER_TEMPLATES) {
    try {
      const teacher = await createTeacher(schoolId, template, defaultPassword);
      createdTeachers.push(teacher);
    } catch (error) {
      console.error(`Failed to create ${template.name}, continuing...`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ PHASE 2 COMPLETE: Teachers Created Successfully!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   School: ${schoolData.name}`);
  console.log(`   Teachers Created: ${createdTeachers.length}`);
  console.log('\n👨‍🏫 Teacher Accounts:');
  createdTeachers.forEach(t => {
    console.log(`   - ${t.name}`);
    console.log(`     Email: ${t.email}`);
    console.log(`     Password: ${defaultPassword}`);
    console.log(`     Subjects: ${t.subjects.join(', ')}`);
    console.log(`     Firebase UID: ${t.uid}`);
    console.log(`     Teacher Doc ID: ${t.teacherId}\n`);
  });
  
  console.log('🔗 Login URL: https://edusync.ph');
  console.log('   Use the "Staff" tab to log in with any teacher account');
  console.log('\n📝 Next Steps:');
  console.log('   Run Phase 3: Create sections');
  console.log('   Command: node scripts/real-onboarding/phase3-create-sections.cjs');
  console.log('\n');
  
  rl.close();
}

createTeachers().catch(console.error);
