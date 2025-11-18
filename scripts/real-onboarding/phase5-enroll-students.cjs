/**
 * REAL SCHOOL ONBOARDING - PHASE 5
 * Enroll students (simulate bulk enrollment)
 * 
 * This simulates a school enrolling their first batch of students.
 * Creates realistic student data with proper structure.
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

// Realistic Filipino names
const FIRST_NAMES = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia'];
const LAST_NAMES = ['Santos', 'Cruz', 'Reyes', 'Garcia', 'Mendoza', 'Rivera', 'Torres', 'Ramos', 'Flores', 'Gonzales'];

function generateLRN() {
  // Format: 1234567890AB (12 chars)
  const year = '24'; // School year 2024
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return year + random;
}

function generateStudent(sectionId, sectionName, gradeLevel, index) {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const fullName = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@student.local`;
  
  return {
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    lrn: generateLRN(),
    email: email,
    sectionId: sectionId,
    sectionName: sectionName,
    gradeLevel: gradeLevel,
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    birthDate: '2010-01-01',
    enrollmentStatus: 'enrolled',
    schoolYear: '2024-2025'
  };
}

async function createStudentAccount(schoolId, studentData, password) {
  const { name, email, lrn } = studentData;
  
  try {
    // Create Firebase Auth user
    let authUser;
    try {
      authUser = await auth.createUser({
        email: email.toLowerCase(),
        password: password,
        emailVerified: true,
        displayName: name
      });
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        authUser = await auth.getUserByEmail(email.toLowerCase());
      } else {
        throw authError;
      }
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'student',
      schoolId: schoolId
    });
    
    // Create users collection document
    await db.collection('users').doc(authUser.uid).set({
      email: email.toLowerCase(),
      role: 'student',
      schoolId: schoolId,
      name: name,
      studentId: null, // Will be set after student doc created
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Create userRoles document
    await db.collection('userRoles').doc(authUser.uid).set({
      email: email.toLowerCase(),
      role: 'student',
      schoolId: schoolId,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: 'enrollment-system'
    }, { merge: true });
    
    // Create student document
    const studentRef = db.collection('students').doc();
    await studentRef.set({
      ...studentData,
      schoolId: schoolId,
      userId: authUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update users.studentId
    await db.collection('users').doc(authUser.uid).update({
      studentId: studentRef.id
    });
    
    return {
      uid: authUser.uid,
      studentId: studentRef.id,
      ...studentData
    };
    
  } catch (error) {
    console.error(`   ❌ Error creating ${name}:`, error.message);
    return null;
  }
}

async function enrollStudents() {
  console.log('\n🎓 PHASE 5: ENROLL STUDENTS\n');
  console.log('This simulates bulk student enrollment.\n');
  
  // Auto-detect school
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
  
  const studentsPerSection = parseInt(await question('Students per section (e.g., 10): '));
  const password = await question('Default password for all students: ');
  
  // Fetch all sections
  console.log('🔍 Fetching sections...');
  const sectionsSnap = await db.collection('sections')
    .where('schoolId', '==', schoolId)
    .get();
  
  if (sectionsSnap.empty) {
    console.log('❌ No sections found! Run Phase 3 first.');
    rl.close();
    return;
  }
  
  const sections = [];
  sectionsSnap.forEach(doc => {
    sections.push({ id: doc.id, ...doc.data() });
  });
  console.log(`✅ Found ${sections.length} sections`);
  
  const totalStudents = sections.length * studentsPerSection;
  console.log(`\n📋 Plan:`);
  console.log(`   Sections: ${sections.length}`);
  console.log(`   Students per section: ${studentsPerSection}`);
  console.log(`   Total students: ${totalStudents}`);
  
  const confirm = await question('\nProceed? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Enrolling students...\n');
  
  const allStudents = [];
  
  for (const section of sections) {
    console.log(`\n📍 Section: ${section.displayName}`);
    console.log(`   Creating ${studentsPerSection} students...`);
    
    const sectionStudents = [];
    
    for (let i = 0; i < studentsPerSection; i++) {
      const studentData = generateStudent(section.id, section.displayName, section.gradeLevel, i);
      const student = await createStudentAccount(schoolId, studentData, password);
      
      if (student) {
        sectionStudents.push(student.studentId);
        allStudents.push(student);
        process.stdout.write(`   ✅ ${student.name} (${i+1}/${studentsPerSection})\r`);
      }
    }
    
    // Update section's students array
    await db.collection('sections').doc(section.id).update({
      students: sectionStudents,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`\n   ✅ Section updated with ${sectionStudents.length} students`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ PHASE 5 COMPLETE: Students Enrolled Successfully!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   School: ${schoolData.name}`);
  console.log(`   Sections: ${sections.length}`);
  console.log(`   Total Students: ${allStudents.length}`);
  console.log(`   Password: ${password}`);
  
  console.log('\n📋 Students by Section:');
  sections.forEach(section => {
    const count = allStudents.filter(s => s.sectionId === section.id).length;
    console.log(`   ${section.displayName}: ${count} students`);
  });
  
  console.log('\n🔗 Test Student Login:');
  if (allStudents.length > 0) {
    const sample = allStudents[0];
    console.log(`   Email: ${sample.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Login URL: https://edusync.ph (Student tab)`);
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   Run Phase 6: Teacher enters grades');
  console.log('   Command: node scripts/real-onboarding/phase6-enter-grades.cjs');
  console.log('\n');
  
  rl.close();
}

enrollStudents().catch(console.error);
