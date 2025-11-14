#!/usr/bin/env node
const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({ projectId: 'edusync-sis' });
const db = admin.firestore();
const auth = admin.auth();

const DEMO_STUDENTS = [
  'juan.delacruz@student.local',
  'maria.santos@student.local',
  'jose.reyes@student.local',
  'ana.garcia@student.local',
  'pedro.lopez@student.local'
];

async function fixStudentDocumentIds() {
  console.log('🔧 Fixing student document IDs to match auth UIDs...\n');
  
  for (const email of DEMO_STUDENTS) {
    try {
      // Get auth UID
      const authUser = await auth.getUserByEmail(email);
      const authUid = authUser.uid;
      
      console.log(`📧 ${email}`);
      console.log(`   Auth UID: ${authUid}`);
      
      // Get existing student document
      const studentQuery = await db.collection('students')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (studentQuery.empty) {
        console.log(`   ❌ No student document found\n`);
        continue;
      }
      
      const oldDoc = studentQuery.docs[0];
      const oldId = oldDoc.id;
      const studentData = oldDoc.data();
      
      console.log(`   Old Doc ID: ${oldId}`);
      
      if (oldId === authUid) {
        console.log(`   ✅ Already matches!\n`);
        continue;
      }
      
      // Create new document with auth UID as ID
      await db.collection('students').doc(authUid).set(studentData);
      console.log(`   ✅ Created new document with ID: ${authUid}`);
      
      // Update all related collections with new studentId
      
      // 1. Update grades
      const gradesSnapshot = await db.collection('grades')
        .where('studentId', '==', oldId)
        .get();
      
      for (const gradeDoc of gradesSnapshot.docs) {
        await gradeDoc.ref.update({ studentId: authUid });
      }
      console.log(`   ✅ Updated ${gradesSnapshot.size} grade records`);
      
      // 2. Update coreValueGrades
      const cvGradesSnapshot = await db.collection('coreValueGrades')
        .where('studentId', '==', oldId)
        .get();
      
      for (const cvDoc of cvGradesSnapshot.docs) {
        await cvDoc.ref.update({ studentId: authUid });
      }
      console.log(`   ✅ Updated ${cvGradesSnapshot.size} core value grades`);
      
      // 3. Update attendanceRecords
      const attendanceSnapshot = await db.collection('attendanceRecords')
        .where('studentId', '==', oldId)
        .get();
      
      for (const attDoc of attendanceSnapshot.docs) {
        await attDoc.ref.update({ studentId: authUid });
      }
      console.log(`   ✅ Updated ${attendanceSnapshot.size} attendance records`);
      
      // 4. Update studentAssignmentGrades
      const assignmentGradesSnapshot = await db.collection('studentAssignmentGrades')
        .where('studentId', '==', oldId)
        .get();
      
      for (const agDoc of assignmentGradesSnapshot.docs) {
        await agDoc.ref.update({ studentId: authUid });
      }
      console.log(`   ✅ Updated ${assignmentGradesSnapshot.size} assignment submissions`);
      
      // 5. Delete old document
      await oldDoc.ref.delete();
      console.log(`   ✅ Deleted old document`);
      
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('✅ All student documents now use auth UID as document ID!');
  console.log('📝 Students can now see their own data in the UI');
  
  process.exit(0);
}

fixStudentDocumentIds();
