/**
 * Comprehensive Teacher Demo Data Seeding
 * 
 * Creates realistic, complete demo data for 3 teachers:
 * - Students with full profiles
 * - Grades with quarterly breakdown
 * - Lesson plans
 * - Assignments
 * - Attendance records
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'edusync-sis' });
}

const db = admin.firestore();
const auth = admin.auth();

// Demo teachers
const teachers = [
  {
    uid: '0zmqWQf0esd4wGyrMgptFFvujw33',
    email: 'maria.cruz@teacher.local',
    firstName: 'Maria',
    lastName: 'Cruz',
    subjects: [
      { name: 'Mathematics', grade: 7, section: 'sec_grade7_bonifacio', sectionName: 'Grade 7 - Bonifacio' },
      { name: 'Mathematics', grade: 8, section: 'sec_grade8_bonifacio', sectionName: 'Grade 8 - Bonifacio' },
      { name: 'Statistics and Probability', grade: 11, section: 'sec_grade11_abm_entrepreneurship', sectionName: 'Grade 11 - ABM Entrepreneurship' }
    ]
  },
  {
    uid: 'I8efnMqx0yeKVS7TePEbexZFUiF3',
    email: 'juan.santos@teacher.local',
    firstName: 'Juan',
    lastName: 'Santos',
    subjects: [
      { name: 'Science', grade: 7, section: 'sec_grade7_bonifacio', sectionName: 'Grade 7 - Bonifacio' },
      { name: 'Science', grade: 8, section: 'sec_grade8_bonifacio', sectionName: 'Grade 8 - Bonifacio' },
      { name: 'Earth and Life Science', grade: 11, section: 'sec_grade11_abm_entrepreneurship', sectionName: 'Grade 11 - ABM Entrepreneurship' }
    ]
  },
  {
    uid: 'to6WvvMmc3ekfSK0cX5ub7DDAVo1',
    email: 'ana.reyes@teacher.local',
    firstName: 'Ana',
    lastName: 'Reyes',
    subjects: [
      { name: 'English', grade: 7, section: 'sec_grade7_bonifacio', sectionName: 'Grade 7 - Bonifacio' },
      { name: 'English', grade: 8, section: 'sec_grade8_bonifacio', sectionName: 'Grade 8 - Bonifacio' },
      { name: 'Reading and Writing', grade: 11, section: 'sec_grade11_abm_entrepreneurship', sectionName: 'Grade 11 - ABM Entrepreneurship' }
    ]
  }
];

// Realistic Filipino student names
const studentNames = [
  { first: 'Juan', last: 'Dela Cruz' },
  { first: 'Maria', last: 'Santos' },
  { first: 'Jose', last: 'Reyes' },
  { first: 'Ana', last: 'Garcia' },
  { first: 'Pedro', last: 'Ramos' },
  { first: 'Carmen', last: 'Torres' },
  { first: 'Miguel', last: 'Flores' },
  { first: 'Rosa', last: 'Mendoza' },
  { first: 'Antonio', last: 'Castro' },
  { first: 'Elena', last: 'Morales' }
];

// Generate realistic grade (75-98 range with normal distribution)
function generateGrade(mean = 85, stdDev = 5) {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const grade = Math.round(mean + z * stdDev);
  return Math.max(75, Math.min(98, grade)); // Clamp to 75-98
}

// Calculate quarterly grade from written and performance
function calculateQuarterlyGrade(written, performance) {
  return Math.round(written * 0.4 + performance * 0.6);
}

// Calculate final grade from 4 quarters
function calculateFinalGrade(q1, q2, q3, q4) {
  return Math.round((q1 + q2 + q3 + q4) / 4);
}

/**
 * Fetch learning area IDs from the refined K-12 learning areas
 */
async function fetchLearningAreaIds() {
  console.log('Fetching learning area IDs from refined K-12 data...');
  
  const learningAreasSnapshot = await db.collection('learningAreas')
    .where('schoolId', '==', 'default')
    .get();
  
  const learningAreaMap = {};
  
  learningAreasSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const name = data.name;
    const grades = data.gradeLevel || [];
    
    // Map by subject name and grade level
    grades.forEach(grade => {
      const key = `${name}-${grade}`;
      learningAreaMap[key] = doc.id;
    });
  });
  
  console.log(`  ✓ Loaded ${Object.keys(learningAreaMap).length} learning area mappings\n`);
  return learningAreaMap;
}

async function cleanupOldDemoData() {
  console.log('================================================================================');
  console.log('STEP 1: CLEANING UP OLD DEMO DATA');
  console.log('================================================================================\n');

  const sections = ['sec_grade7_bonifacio', 'sec_grade8_bonifacio', 'sec_grade11_abm_entrepreneurship'];

  // Delete old students
  console.log('Deleting students in demo sections...');
  for (const sectionId of sections) {
    const studentsSnap = await db.collection('students')
      .where('sectionId', '==', sectionId)
      .get();
    
    if (studentsSnap.size > 0) {
      const batch = db.batch();
      studentsSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  ✓ Deleted ${studentsSnap.size} students from ${sectionId}`);
    }
  }

  // Delete old grades
  console.log('\nDeleting grades in demo sections...');
  for (const sectionId of sections) {
    const gradesSnap = await db.collection('grades')
      .where('sectionId', '==', sectionId)
      .get();
    
    if (gradesSnap.size > 0) {
      const batch = db.batch();
      gradesSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  ✓ Deleted ${gradesSnap.size} grade records from ${sectionId}`);
    }
  }

  console.log('\n✅ Cleanup complete\n');
}

async function updateTeacherAssignments() {
  console.log('================================================================================');
  console.log('STEP 1.5: UPDATING TEACHER ASSIGNMENTS');
  console.log('================================================================================\n');

  // Fetch learning areas to get correct IDs
  const learningAreasSnap = await db.collection('learningAreas')
    .where('schoolId', '==', 'default')
    .get();
  
  const laMap = {};
  learningAreasSnap.forEach(doc => {
    laMap[doc.data().name] = { id: doc.id, name: doc.data().name };
  });

  // Update Maria Cruz (0zmqWQf0esd4wGyrMgptFFvujw33)
  const mariaMathId = laMap['Mathematics'].id;
  const mariaStatsId = laMap['Statistics and Probability'].id;
  
  const mariaAssignments = [
    {
      learningAreaId: mariaMathId,
      learningAreaName: 'Mathematics',
      gradeLevel: 7,
      sectionId: 'sec_grade7_bonifacio',
      sectionName: 'Grade 7 - Bonifacio',
      schoolYear: 'SY 2024-2025'
    },
    {
      learningAreaId: mariaMathId,
      learningAreaName: 'Mathematics',
      gradeLevel: 8,
      sectionId: 'sec_grade8_bonifacio',
      sectionName: 'Grade 8 - Bonifacio',
      schoolYear: 'SY 2024-2025'
    },
    {
      learningAreaId: mariaStatsId,
      learningAreaName: 'Statistics and Probability',
      gradeLevel: 11,
      sectionId: 'sec_grade11_abm_entrepreneurship',
      sectionName: 'Grade 11 - ABM Entrepreneurship',
      schoolYear: 'SY 2024-2025'
    }
  ];

  await db.collection('users').doc('0zmqWQf0esd4wGyrMgptFFvujw33').update({
    assignments: mariaAssignments
  });

  console.log('✓ Updated Maria Cruz assignments:');
  console.log('  - Mathematics (Grade 7 - Bonifacio)');
  console.log('  - Mathematics (Grade 8 - Bonifacio)');
  console.log('  - Statistics and Probability (Grade 11 - ABM Entrepreneurship)');

  // Clean up old class schedules for demo teachers
  console.log('\n✓ Cleaning up old class schedules...');
  const demoSections = ['sec_grade7_bonifacio', 'sec_grade8_bonifacio', 'sec_grade11_abm_entrepreneurship'];
  const demoTeacherIds = ['0zmqWQf0esd4wGyrMgptFFvujw33', 'juan.santos.uid', 'ana.reyes.uid'];
  
  for (const teacherId of demoTeacherIds) {
    const schedulesSnap = await db.collection('classSchedules')
      .where('teacherId', '==', teacherId)
      .get();
    
    if (schedulesSnap.size > 0) {
      const batch = db.batch();
      let deleted = 0;
      schedulesSnap.forEach(doc => {
        const data = doc.data();
        if (!demoSections.includes(data.sectionId)) {
          batch.delete(doc.ref);
          deleted++;
        }
      });
      if (deleted > 0) {
        await batch.commit();
        console.log('  - Deleted ' + deleted + ' old schedules for teacher: ' + teacherId);
      }
    }
  }
  
  console.log('\n✅ Teacher assignments and schedules updated\n');
}

async function createStudents() {
  console.log('================================================================================');
  console.log('STEP 2: CREATING REALISTIC STUDENTS');
  console.log('================================================================================\n');

  const sections = [
    { id: 'sec_grade7_bonifacio', name: 'Grade 7 - Bonifacio', grade: 7 },
    { id: 'sec_grade8_bonifacio', name: 'Grade 8 - Bonifacio', grade: 8 },
    { id: 'sec_grade11_abm_entrepreneurship', name: 'Grade 11 - ABM Entrepreneurship', grade: 11 }
  ];

  const createdStudents = {};

  for (const section of sections) {
    console.log(`\n${section.name}:`);
    console.log('─'.repeat(80));

    const students = [];

    for (let i = 0; i < 10; i++) {
      const name = studentNames[i];
      const lrn = `${100000000000 + (section.grade * 1000) + i}`;
      
      const fullName = `${name.first} ${name.last}`;
      
      const studentData = {
        firstName: name.first,
        lastName: name.last,
        middleName: '',
        name: fullName, // Add name field for UI compatibility
        lrn: lrn,
        gradeLevel: section.grade,
        sectionId: section.id,
        sectionName: section.name,
        schoolId: 'default',
        schoolYear: '2024-2025',
        status: 'active',
        gender: i % 2 === 0 ? 'Male' : 'Female',
        birthdate: new Date(2010 - section.grade, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase().replace(' ', '')}@student.edusync.ph`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = db.collection('students').doc();
      await docRef.set(studentData);
      students.push({ id: docRef.id, ...studentData });
      
      console.log(`  ✓ ${name.first} ${name.last} (LRN: ${lrn})`);
    }

    createdStudents[section.id] = students;
  }

  console.log('\n✅ Created 30 students total\n');
  return createdStudents;
}

async function createGrades(students) {
  console.log('================================================================================');
  console.log('STEP 3: GENERATING REALISTIC GRADES');
  console.log('================================================================================\n');

  // Get learning areas
  const learningAreasSnap = await db.collection('learningAreas')
    .where('schoolId', '==', 'default')
    .get();

  const learningAreasMap = {};
  learningAreasSnap.forEach(doc => {
    const data = doc.data();
    const grades = Array.isArray(data.gradeLevel) ? data.gradeLevel : [data.gradeLevel];
    grades.forEach(grade => {
      const key = `${data.name}-${grade}`;
      learningAreasMap[key] = { id: doc.id, ...data };
    });
  });

  for (const teacher of teachers) {
    console.log(`\n${teacher.firstName} ${teacher.lastName}:`);
    console.log('─'.repeat(80));

    for (const subject of teacher.subjects) {
      console.log(`\n  ${subject.name} - ${subject.sectionName}:`);

      const learningArea = learningAreasMap[`${subject.name}-${subject.grade}`];
      if (!learningArea) {
        console.log(`    ❌ Learning area not found`);
        continue;
      }

      const sectionStudents = students[subject.section];
      let gradesCreated = 0;

      for (const student of sectionStudents) {
        // Generate realistic grades with some variation
        const studentMean = 80 + Math.floor(Math.random() * 15); // 80-95 mean per student

        // Quarter 1
        const w1 = generateGrade(studentMean, 5);
        const p1 = generateGrade(studentMean - 2, 5);
        const q1 = calculateQuarterlyGrade(w1, p1);

        // Quarter 2 (usually improves)
        const w2 = generateGrade(studentMean + 2, 5);
        const p2 = generateGrade(studentMean, 5);
        const q2 = calculateQuarterlyGrade(w2, p2);

        // Quarter 3
        const w3 = generateGrade(studentMean + 3, 5);
        const p3 = generateGrade(studentMean + 1, 5);
        const q3 = calculateQuarterlyGrade(w3, p3);

        // Quarter 4 (final push)
        const w4 = generateGrade(studentMean + 4, 5);
        const p4 = generateGrade(studentMean + 2, 5);
        const q4 = calculateQuarterlyGrade(w4, p4);

        const finalGrade = calculateFinalGrade(q1, q2, q3, q4);
        const remarks = finalGrade >= 75 ? 'Passed' : 'Failed';

        const gradeData = {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          learningAreaId: learningArea.id,
          learningAreaName: subject.name,
          sectionId: subject.section,
          sectionName: subject.sectionName,
          teacherId: teacher.uid,
          gradeLevel: subject.grade,
          schoolYear: '2024-2025',
          schoolId: 'default',
          semester: 1,
          // Quarterly grades (these are what show in the UI)
          q1: q1,
          q2: q2,
          q3: q3,
          q4: q4,
          // Component breakdown (optional, for detailed view)
          written: {
            q1: w1,
            q2: w2,
            q3: w3,
            q4: w4
          },
          performance: {
            q1: p1,
            q2: p2,
            q3: p3,
            q4: p4
          },
          finalGrade: finalGrade,
          remarks: remarks,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('grades').add(gradeData);
        gradesCreated++;
      }

      console.log(`    ✓ Created ${gradesCreated} grade records (Avg: ${Math.round(sectionStudents.reduce((sum, s, i) => sum + (80 + Math.floor(Math.random() * 15)), 0) / sectionStudents.length)})`);
    }
  }

  console.log('\n✅ Created 90 realistic grade records\n');
}

async function createLessonPlans(students) {
  console.log('================================================================================');
  console.log('STEP 4: CREATING LESSON PLANS');
  console.log('================================================================================\n');

  const lessonTopics = {
    'Mathematics-7': ['Integers and Operations', 'Fractions and Decimals', 'Algebraic Expressions', 'Linear Equations'],
    'Mathematics-8': ['Linear Functions', 'Systems of Equations', 'Geometry Basics', 'Pythagorean Theorem'],
    'Statistics and Probability-11': ['Data Collection', 'Measures of Central Tendency', 'Probability Theory', 'Normal Distribution'],
    'Science-7': ['Scientific Method', 'Matter and Its Properties', 'Force and Motion', 'Energy and Work'],
    'Science-8': ['Cell Structure', 'Genetics and Heredity', 'Ecosystems', 'Chemical Reactions'],
    'Earth and Life Science-11': ['Earth Systems', 'Plate Tectonics', 'Evolution and Biodiversity', 'Climate Change'],
    'English-7': ['Parts of Speech', 'Sentence Structure', 'Reading Comprehension', 'Essay Writing'],
    'English-8': ['Literary Devices', 'Persuasive Writing', 'Critical Reading', 'Research Skills'],
    'Reading and Writing-11': ['Academic Writing', 'Research Methodologies', 'Critical Analysis', 'Thesis Development']
  };

  for (const teacher of teachers) {
    console.log(`\n${teacher.firstName} ${teacher.lastName}:`);
    console.log('─'.repeat(80));

    for (const subject of teacher.subjects) {
      const key = `${subject.name}-${subject.grade}`;
      const topics = lessonTopics[key] || ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4'];

      console.log(`\n  ${subject.name} - ${subject.sectionName}:`);

      for (let i = 0; i < topics.length; i++) {
        const lessonData = {
          teacherId: teacher.uid,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          sectionId: subject.section,
          sectionName: subject.sectionName,
          gradeLevel: subject.grade,
          subject: subject.name,
          title: topics[i],
          objectives: [`Understand ${topics[i]}`, `Apply ${topics[i]} concepts`, `Analyze real-world applications`],
          materials: ['Textbook', 'Whiteboard', 'Visual aids', 'Worksheets'],
          procedure: [
            'Introduction and review (10 mins)',
            'Main lesson presentation (20 mins)',
            'Guided practice (15 mins)',
            'Independent practice (10 mins)',
            'Assessment and closure (5 mins)'
          ],
          assessment: 'Quiz and class participation',
          status: 'completed',
          schoolYear: '2024-2025',
          quarter: Math.floor(i / 1) + 1,
          weekNumber: i + 1,
          schoolId: 'default',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('lessonPlans').add(lessonData);
        console.log(`    ✓ ${topics[i]}`);
      }
    }
  }

  console.log('\n✅ Created lesson plans for all subjects\n');
}

async function createAssignments(students) {
  console.log('================================================================================');
  console.log('STEP 5: CREATING ASSIGNMENTS');
  console.log('================================================================================\n');

  const assignmentTypes = ['Quiz', 'Worksheet', 'Project', 'Homework'];

  for (const teacher of teachers) {
    console.log(`\n${teacher.firstName} ${teacher.lastName}:`);
    console.log('─'.repeat(80));

    for (const subject of teacher.subjects) {
      console.log(`\n  ${subject.name} - ${subject.sectionName}:`);

      for (let i = 0; i < 4; i++) {
        const type = assignmentTypes[i % assignmentTypes.length];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i * 7));

        const assignmentData = {
          teacherId: teacher.uid,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          sectionId: subject.section,
          sectionName: subject.sectionName,
          gradeLevel: subject.grade,
          subject: subject.name,
          title: `${type} ${i + 1}: ${subject.name}`,
          description: `Complete the ${type.toLowerCase()} on the current topic`,
          type: type.toLowerCase(),
          dueDate: dueDate.toISOString().split('T')[0],
          maxScore: 100,
          status: 'active',
          schoolYear: '2024-2025',
          quarter: Math.floor(i / 1) + 1,
          schoolId: 'default',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('assignments').add(assignmentData);
        console.log(`    ✓ ${type} ${i + 1}`);
      }
    }
  }

  console.log('\n✅ Created assignments for all classes\n');
}

async function createAttendance(students) {
  console.log('================================================================================');
  console.log('STEP 6: GENERATING ATTENDANCE RECORDS');
  console.log('================================================================================\n');

  const startDate = new Date('2024-09-01');
  const endDate = new Date('2024-11-13');
  const schoolDays = [];

  // Generate school days (Mon-Fri)
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      schoolDays.push(new Date(d));
    }
  }

  console.log(`Generating attendance for ${schoolDays.length} school days...\n`);

  for (const sectionId in students) {
    const sectionStudents = students[sectionId];
    const sectionName = sectionStudents[0].sectionName;

    console.log(`${sectionName}:`);

    for (const student of sectionStudents) {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      for (const date of schoolDays) {
        // 95% present, 3% absent, 2% late
        const rand = Math.random();
        let status = 'present';
        
        if (rand < 0.03) {
          status = 'absent';
          absentCount++;
        } else if (rand < 0.05) {
          status = 'late';
          lateCount++;
        } else {
          presentCount++;
        }

        const attendanceData = {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          sectionId: sectionId,
          sectionName: sectionName,
          gradeLevel: student.gradeLevel,
          date: date.toISOString().split('T')[0],
          status: status,
          schoolYear: '2024-2025',
          schoolId: 'default',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('attendance').add(attendanceData);
      }

      console.log(`  ✓ ${student.firstName} ${student.lastName}: ${presentCount}P ${absentCount}A ${lateCount}L`);
    }

    console.log('');
  }

  console.log('✅ Created attendance records\n');
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         COMPREHENSIVE TEACHER DEMO DATA SEEDING                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    await cleanupOldDemoData();
    await updateTeacherAssignments();
    const students = await createStudents();
    await createGrades(students);
    await createLessonPlans(students);
    await createAssignments(students);
    await createAttendance(students);

    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                           SEEDING COMPLETE!                                ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📊 Summary:');
    console.log('   • 30 realistic students (10 per section)');
    console.log('   • 90 complete grade records (Q1-Q4 with Written/Performance tasks)');
    console.log('   • Lesson plans for all subjects');
    console.log('   • Assignments for all classes');
    console.log('   • Attendance records (95% attendance rate)');
    console.log('\n');
    console.log('🎬 Teachers can now log in and see realistic, complete data!');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
