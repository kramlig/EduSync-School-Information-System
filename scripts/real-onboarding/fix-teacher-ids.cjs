/**
 * FIX: Update classSchedules to use Firebase Auth UIDs instead of teacher doc IDs
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

async function fixClassScheduleTeacherIds() {
  console.log('\n🔧 FIXING CLASS SCHEDULE TEACHER IDS\n');
  
  // Get all teachers
  const teachersSnap = await db.collection('teachers').get();
  
  // Build mapping: teacher email → Firebase Auth UID
  const emailToUid = new Map();
  
  const authUsers = await auth.listUsers();
  authUsers.users.forEach(user => {
    emailToUid.set(user.email, user.uid);
  });
  
  console.log(`📋 Found ${teachersSnap.size} teachers`);
  console.log(`🔐 Found ${emailToUid.size} auth users\n`);
  
  // Get all classSchedules
  const schedulesSnap = await db.collection('classSchedules').get();
  console.log(`📅 Found ${schedulesSnap.size} class schedules to fix\n`);
  
  const batch = db.batch();
  let fixCount = 0;
  
  for (const scheduleDoc of schedulesSnap.docs) {
    const schedule = scheduleDoc.data();
    const oldTeacherId = schedule.teacherId;
    
    // Find teacher by doc ID
    const teacherDoc = await db.collection('teachers').doc(oldTeacherId).get();
    if (!teacherDoc.exists) {
      console.log(`⚠️  Teacher not found for schedule: ${scheduleDoc.id}`);
      continue;
    }
    
    const teacherEmail = teacherDoc.data().email;
    const firebaseUid = emailToUid.get(teacherEmail);
    
    if (!firebaseUid) {
      console.log(`⚠️  No Firebase Auth UID for ${teacherEmail}`);
      continue;
    }
    
    // Update the schedule
    batch.update(db.collection('classSchedules').doc(scheduleDoc.id), {
      teacherId: firebaseUid
    });
    
    console.log(`✅ ${schedule.title}`);
    console.log(`   Old: ${oldTeacherId}`);
    console.log(`   New: ${firebaseUid}\n`);
    
    fixCount++;
  }
  
  await batch.commit();
  
  console.log('='.repeat(60));
  console.log('✅ CLASS SCHEDULE IDS FIXED!');
  console.log('='.repeat(60));
  console.log(`\n📊 Updated ${fixCount} class schedules`);
  console.log('\n🎯 Impact:');
  console.log('   - Teachers can now see students in dashboard');
  console.log('   - Gradebook will work correctly');
  console.log('\n📝 Next: Refresh browser\n');
}

fixClassScheduleTeacherIds().catch(console.error);
