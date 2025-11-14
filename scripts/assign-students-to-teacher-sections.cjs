/**
 * Assign Students to Teacher Demo Sections
 * 
 * Assigns 10 students to each of the teacher's demo sections:
 * - Grade 7 - Bonifacio
 * - Grade 8 - Bonifacio
 * - Grade 11 - ABM Entrepreneurship
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'edusync-sis' });
}

const db = admin.firestore();

// Teacher sections that need students
const teacherSections = [
  { name: 'Grade 7 - Bonifacio', gradeLevel: 7, sourceSectionId: 'sec_grade7_a', studentsToMove: 10 },
  { name: 'Grade 8 - Bonifacio', gradeLevel: 8, sourceSectionId: 'sec_grade8_a', studentsToMove: 10 },
  { name: 'Grade 11 - ABM Entrepreneurship', gradeLevel: 11, sourceSectionId: 'sec_grade11_abm', studentsToMove: 10 }
];

async function assignStudentsToTeacherSections() {
  console.log('================================================================================');
  console.log('ASSIGNING STUDENTS TO TEACHER DEMO SECTIONS');
  console.log('================================================================================\n');

  for (const sectionInfo of teacherSections) {
    console.log(`\n${sectionInfo.name}:`);
    console.log('─'.repeat(80));

    // Get the target section ID
    const targetSectionSnap = await db.collection('sections')
      .where('name', '==', sectionInfo.name)
      .where('schoolId', '==', 'default')
      .get();

    if (targetSectionSnap.empty) {
      console.log(`❌ Section "${sectionInfo.name}" not found`);
      continue;
    }

    const targetSectionId = targetSectionSnap.docs[0].id;
    console.log(`✅ Found section: ${targetSectionId}`);

    // Get students from source section
    const studentsSnap = await db.collection('students')
      .where('schoolId', '==', 'default')
      .where('sectionId', '==', sectionInfo.sourceSectionId)
      .limit(sectionInfo.studentsToMove)
      .get();

    if (studentsSnap.empty) {
      console.log(`❌ No students found in source section ${sectionInfo.sourceSectionId}`);
      continue;
    }

    console.log(`✅ Found ${studentsSnap.size} students to move`);

    // Update each student's sectionId and sectionName
    const batch = db.batch();
    let count = 0;

    studentsSnap.forEach(doc => {
      const studentData = doc.data();
      batch.update(doc.ref, {
        sectionId: targetSectionId,
        sectionName: sectionInfo.name,
        gradeLevel: sectionInfo.gradeLevel
      });
      count++;
      console.log(`  → ${studentData.firstName} ${studentData.lastName}`);
    });

    await batch.commit();
    console.log(`✅ Successfully assigned ${count} students to ${sectionInfo.name}`);
  }

  console.log('\n================================================================================');
  console.log('ASSIGNMENT COMPLETE');
  console.log('================================================================================');
  console.log('\n🎉 All teacher sections now have students assigned!');
  console.log('🎬 Teachers can now see student rosters in their classes!\n');

  process.exit(0);
}

assignStudentsToTeacherSections().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
