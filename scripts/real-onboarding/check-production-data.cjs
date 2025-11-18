/**
 * Check what data exists in production
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

async function checkData() {
  console.log('\n🔍 CHECKING PRODUCTION DATA\n');
  
  // Check schools
  const schoolsSnap = await db.collection('schools').get();
  console.log(`📚 Schools: ${schoolsSnap.size}`);
  if (!schoolsSnap.empty) {
    const school = schoolsSnap.docs[0].data();
    console.log(`   Name: ${school.name}`);
    console.log(`   ID: ${schoolsSnap.docs[0].id}`);
  }
  
  // Check teachers
  const teachersSnap = await db.collection('teachers').get();
  console.log(`\n👨‍🏫 Teachers: ${teachersSnap.size}`);
  if (!teachersSnap.empty) {
    const teacher = teachersSnap.docs[0].data();
    console.log(`   Example: ${teacher.name}`);
    console.log(`   Assignments: ${teacher.assignments?.length || 0}`);
  }
  
  // Check sections
  const sectionsSnap = await db.collection('sections').get();
  console.log(`\n📚 Sections: ${sectionsSnap.size}`);
  if (!sectionsSnap.empty) {
    const section = sectionsSnap.docs[0].data();
    console.log(`   Example: ${section.displayName}`);
    console.log(`   Students: ${section.students?.length || 0}`);
  }
  
  // Check students
  const studentsSnap = await db.collection('students').get();
  console.log(`\n🎓 Students: ${studentsSnap.size}`);
  if (!studentsSnap.empty) {
    const student = studentsSnap.docs[0].data();
    console.log(`   Example: ${student.name}`);
    console.log(`   Section ID: ${student.sectionId || 'MISSING'}`);
  }
  
  // Check classSchedules
  const schedulesSnap = await db.collection('classSchedules').get();
  console.log(`\n📅 Class Schedules: ${schedulesSnap.size}`);
  if (!schedulesSnap.empty) {
    const schedule = schedulesSnap.docs[0].data();
    console.log(`   Example: ${schedule.title}`);
    console.log(`   Teacher ID: ${schedule.teacherId}`);
    console.log(`   Section ID: ${schedule.sectionId}`);
    console.log(`   School ID: ${schedule.schoolId}`);
  }
  
  console.log('\n');
}

checkData().catch(console.error);
