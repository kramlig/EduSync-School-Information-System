/**
 * Debug: Check teacher IDs vs Firebase Auth UIDs
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();
const auth = getAuth();

async function debugTeacherIds() {
  console.log('\n🔍 DEBUGGING TEACHER IDS\n');
  
  // Get one teacher
  const teachersSnap = await db.collection('teachers').limit(1).get();
  if (teachersSnap.empty) {
    console.log('❌ No teachers found');
    return;
  }
  
  const teacherDoc = teachersSnap.docs[0];
  const teacherData = teacherDoc.data();
  
  console.log('📋 Teacher Document:');
  console.log(`   Document ID: ${teacherDoc.id}`);
  console.log(`   Name: ${teacherData.name}`);
  console.log(`   Email: ${teacherData.email}`);
  
  // Get their classSchedule
  const schedulesSnap = await db.collection('classSchedules')
    .where('teacherId', '==', teacherDoc.id)
    .limit(1)
    .get();
  
  if (!schedulesSnap.empty) {
    const schedule = schedulesSnap.docs[0].data();
    console.log('\n📅 Class Schedule:');
    console.log(`   Teacher ID in schedule: ${schedule.teacherId}`);
    console.log(`   Section ID: ${schedule.sectionId}`);
  }
  
  // Get Firebase Auth user
  const authUsers = await auth.listUsers();
  const authUser = authUsers.users.find(u => u.email === teacherData.email);
  
  if (authUser) {
    console.log('\n🔐 Firebase Auth User:');
    console.log(`   UID: ${authUser.uid}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Custom Claims: ${JSON.stringify(authUser.customClaims || {})}`);
  }
  
  // Get users collection document
  const usersSnap = await db.collection('users')
    .where('email', '==', teacherData.email)
    .limit(1)
    .get();
  
  if (!usersSnap.empty) {
    const userDoc = usersSnap.docs[0];
    console.log('\n👤 Users Collection:');
    console.log(`   Document ID: ${userDoc.id}`);
    console.log(`   Role: ${userDoc.data().role}`);
  }
  
  console.log('\n❓ PROBLEM DIAGNOSIS:');
  console.log(`   Teacher Doc ID: ${teacherDoc.id}`);
  console.log(`   Firebase Auth UID: ${authUser?.uid || 'NOT FOUND'}`);
  console.log(`   ClassSchedule teacher ID: ${schedulesSnap.docs[0]?.data().teacherId || 'NO SCHEDULE'}`);
  console.log('\n   🔴 MISMATCH: classSchedule.teacherId should be Firebase Auth UID, not teacher doc ID!\n');
}

debugTeacherIds().catch(console.error);
