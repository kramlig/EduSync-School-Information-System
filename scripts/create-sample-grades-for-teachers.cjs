/**
 * Create Sample Grades for Teacher Demo Sections
 * 
 * Generates sample grades for students in teacher's sections
 * to populate the gradebook view
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'edusync-sis' });
}

const db = admin.firestore();

// Teacher sections and their learning areas
const teacherAssignments = [
  {
    teacherId: '0zmqWQf0esd4wGyrMgptFFvujw33', // Maria Cruz
    sectionName: 'Grade 7 - Bonifacio',
    subjectName: 'Mathematics',
    gradeLevel: 7
  },
  {
    teacherId: '0zmqWQf0esd4wGyrMgptFFvujw33',
    sectionName: 'Grade 8 - Bonifacio',
    subjectName: 'Mathematics',
    gradeLevel: 8
  },
  {
    teacherId: '0zmqWQf0esd4wGyrMgptFFvujw33',
    sectionName: 'Grade 11 - ABM Entrepreneurship',
    subjectName: 'Statistics and Probability',
    gradeLevel: 11
  },
  {
    teacherId: 'I8efnMqx0yeKVS7TePEbexZFUiF3', // Juan Santos
    sectionName: 'Grade 7 - Bonifacio',
    subjectName: 'Science',
    gradeLevel: 7
  },
  {
    teacherId: 'I8efnMqx0yeKVS7TePEbexZFUiF3',
    sectionName: 'Grade 8 - Bonifacio',
    subjectName: 'Science',
    gradeLevel: 8
  },
  {
    teacherId: 'I8efnMqx0yeKVS7TePEbexZFUiF3',
    sectionName: 'Grade 11 - ABM Entrepreneurship',
    subjectName: 'Earth and Life Science',
    gradeLevel: 11
  },
  {
    teacherId: 'to6WvvMmc3ekfSK0cX5ub7DDAVo1', // Ana Reyes
    sectionName: 'Grade 7 - Bonifacio',
    subjectName: 'English',
    gradeLevel: 7
  },
  {
    teacherId: 'to6WvvMmc3ekfSK0cX5ub7DDAVo1',
    sectionName: 'Grade 8 - Bonifacio',
    subjectName: 'English',
    gradeLevel: 8
  },
  {
    teacherId: 'to6WvvMmc3ekfSK0cX5ub7DDAVo1',
    sectionName: 'Grade 11 - ABM Entrepreneurship',
    subjectName: 'Reading and Writing',
    gradeLevel: 11
  }
];

// Sample grade data for quarters
const sampleGrades = {
  written: { quarter1: 85, quarter2: 87, quarter3: 88, quarter4: 90 },
  performance: { quarter1: 82, quarter2: 85, quarter3: 86, quarter4: 88 },
  quarterly: { quarter1: 84, quarter2: 86, quarter3: 87, quarter4: 89 }
};

async function createSampleGrades() {
  console.log('================================================================================');
  console.log('CREATING SAMPLE GRADES FOR TEACHER SECTIONS');
  console.log('================================================================================\n');

  for (const assignment of teacherAssignments) {
    console.log(`\n${assignment.sectionName} - ${assignment.subjectName}:`);
    console.log('─'.repeat(80));

    // Get section
    const sectionSnap = await db.collection('sections')
      .where('name', '==', assignment.sectionName)
      .where('schoolId', '==', 'default')
      .get();

    if (sectionSnap.empty) {
      console.log(`❌ Section not found`);
      continue;
    }

    const sectionId = sectionSnap.docs[0].id;

    // Get learning area
    const learningAreasSnap = await db.collection('learningAreas')
      .where('schoolId', '==', 'default')
      .where('name', '==', assignment.subjectName)
      .get();

    let learningAreaId = null;
    for (const doc of learningAreasSnap.docs) {
      const data = doc.data();
      const grades = Array.isArray(data.gradeLevel) ? data.gradeLevel : [data.gradeLevel];
      if (grades.includes(assignment.gradeLevel)) {
        learningAreaId = doc.id;
        break;
      }
    }

    if (!learningAreaId) {
      console.log(`❌ Learning area not found for ${assignment.subjectName} Grade ${assignment.gradeLevel}`);
      continue;
    }

    // Get students in this section
    const studentsSnap = await db.collection('students')
      .where('schoolId', '==', 'default')
      .where('sectionId', '==', sectionId)
      .get();

    console.log(`✅ Found ${studentsSnap.size} students`);

    // Create grades for each student
    const batch = db.batch();
    let count = 0;

    for (const studentDoc of studentsSnap.docs) {
      const studentData = studentDoc.data();
      const gradeData = {
        studentId: studentDoc.id,
        studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Unknown Student',
        learningAreaId: learningAreaId,
        learningAreaName: assignment.subjectName,
        sectionId: sectionId,
        sectionName: assignment.sectionName,
        teacherId: assignment.teacherId,
        gradeLevel: assignment.gradeLevel,
        schoolYear: '2024-2025',
        schoolId: 'default',
        semester: 1,
        ...sampleGrades,
        finalGrade: 87,
        remarks: 'Passed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const gradeRef = db.collection('grades').doc();
      batch.set(gradeRef, gradeData);
      count++;
    }

    await batch.commit();
    console.log(`✅ Created ${count} grade records`);
  }

  console.log('\n================================================================================');
  console.log('GRADE CREATION COMPLETE');
  console.log('================================================================================');
  console.log('\n🎉 All teacher sections now have sample grades!');
  console.log('🎬 Teachers can now see gradebook data with student grades!\n');

  process.exit(0);
}

createSampleGrades().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
