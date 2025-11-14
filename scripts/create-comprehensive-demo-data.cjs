#!/usr/bin/env node
/**
 * Create comprehensive demo data for student accounts
 * - Grades for all subjects (4 quarters)
 * - Core value grades
 * - Attendance records (realistic pattern)
 * - Assignments with submissions
 * - Announcements
 */

const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({ projectId: 'edusync-sis' });
const db = admin.firestore();
const SCHOOL_ID = 'default';
const SCHOOL_YEAR = 'SY 2024-2025';

// Demo students with their sections
const DEMO_STUDENTS = [
  {
    email: 'juan.delacruz@student.local',
    firstName: 'Juan',
    lastName: 'De La Cruz',
    sectionId: 'sec_grade1_a',
    gradeLevel: 1
  },
  {
    email: 'maria.santos@student.local',
    firstName: 'Maria',
    lastName: 'Santos',
    sectionId: 'sec_grade2_emerald',
    gradeLevel: 2
  },
  {
    email: 'jose.reyes@student.local',
    firstName: 'Jose',
    lastName: 'Reyes',
    sectionId: 'sec_grade3_sapphire',
    gradeLevel: 3
  },
  {
    email: 'ana.garcia@student.local',
    firstName: 'Ana',
    lastName: 'Garcia',
    sectionId: 'sec_grade4_pearl',
    gradeLevel: 4
  },
  {
    email: 'pedro.lopez@student.local',
    firstName: 'Pedro',
    lastName: 'Lopez',
    sectionId: 'sec_grade5_ruby',
    gradeLevel: 5
  }
];

// Core values for grading
const CORE_VALUES = ['Maka-Diyos', 'Makatao', 'Makakalikasan', 'Makabansa'];

// Generate realistic grade (75-98 range)
function generateGrade(baseGrade = 85, variance = 8) {
  const grade = baseGrade + (Math.random() * variance * 2 - variance);
  return Math.max(75, Math.min(98, Math.round(grade)));
}

// Generate realistic attendance (mostly present)
function generateAttendanceStatus() {
  const rand = Math.random();
  if (rand < 0.85) return 'present';
  if (rand < 0.92) return 'late';
  if (rand < 0.97) return 'absent';
  return 'excused';
}

async function createComprehensiveDemoData() {
  console.log('🎓 Creating comprehensive demo data for student accounts...\n');

  try {
    // Step 1: Get learning areas by grade level
    console.log('📚 Fetching learning areas...');
    const learningAreasSnapshot = await db.collection('learningAreas')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    const learningAreasByGrade = {};
    learningAreasSnapshot.forEach(doc => {
      const la = { id: doc.id, ...doc.data() };
      if (la.gradeLevel && Array.isArray(la.gradeLevel)) {
        la.gradeLevel.forEach(grade => {
          if (!learningAreasByGrade[grade]) {
            learningAreasByGrade[grade] = [];
          }
          learningAreasByGrade[grade].push(la);
        });
      }
    });
    console.log(`   Found learning areas for grades 1-${Object.keys(learningAreasByGrade).length}`);

    // Step 2: Get core values
    console.log('💎 Fetching core values...');
    const coreValuesSnapshot = await db.collection('coreValues')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    const coreValuesMap = {};
    coreValuesSnapshot.forEach(doc => {
      const cv = doc.data();
      coreValuesMap[cv.name] = { id: doc.id, ...cv };
    });
    console.log(`   Found ${coreValuesSnapshot.size} core values\n`);

    // Step 3: Process each demo student
    for (const demoStudent of DEMO_STUDENTS) {
      console.log(`\n👤 Processing ${demoStudent.firstName} ${demoStudent.lastName} (Grade ${demoStudent.gradeLevel})...`);

      // Get student document
      const studentQuery = await db.collection('students')
        .where('email', '==', demoStudent.email)
        .where('schoolId', '==', SCHOOL_ID)
        .limit(1)
        .get();

      if (studentQuery.empty) {
        console.log(`   ⚠️  Student not found, skipping...`);
        continue;
      }

      const studentDoc = studentQuery.docs[0];
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();

      console.log(`   Student ID: ${studentId}`);
      console.log(`   Section: ${studentData.sectionId}`);

      // Get learning areas for this grade
      const studentLearningAreas = learningAreasByGrade[demoStudent.gradeLevel] || [];
      console.log(`   Learning areas: ${studentLearningAreas.length} subjects`);

      // Create grades for each learning area (4 quarters)
      console.log('   📊 Creating grades...');
      let gradesCreated = 0;
      
      for (const learningArea of studentLearningAreas) {
        const baseGrade = 80 + Math.random() * 15; // Base grade 80-95
        
        const q1 = generateGrade(baseGrade, 5);
        const q2 = generateGrade(baseGrade, 5);
        const q3 = generateGrade(baseGrade, 5);
        const q4 = generateGrade(baseGrade, 5);
        const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);

        // Check if grade already exists
        const existingGrade = await db.collection('grades')
          .where('studentId', '==', studentId)
          .where('learningAreaId', '==', learningArea.id)
          .where('schoolYear', '==', SCHOOL_YEAR)
          .limit(1)
          .get();

        if (existingGrade.empty) {
          await db.collection('grades').add({
            schoolId: SCHOOL_ID,
            studentId: studentId,
            learningAreaId: learningArea.id,
            schoolYear: SCHOOL_YEAR,
            gradeLevel: demoStudent.gradeLevel,
            sectionId: studentData.sectionId,
            q1, q2, q3, q4,
            finalGrade,
            remarks: finalGrade >= 75 ? 'Passed' : 'Failed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          gradesCreated++;
        }
      }
      console.log(`      ✅ Created ${gradesCreated} grade records`);

      // Create core value grades
      console.log('   💎 Creating core value grades...');
      let coreValueGradesCreated = 0;
      
      for (const cvName of CORE_VALUES) {
        const coreValue = coreValuesMap[cvName];
        if (!coreValue) continue;

        const q1 = ['AO', 'SO', 'NO'][Math.floor(Math.random() * 3)];
        const q2 = ['AO', 'SO', 'NO'][Math.floor(Math.random() * 3)];
        const q3 = ['AO', 'SO', 'NO'][Math.floor(Math.random() * 3)];
        const q4 = ['AO', 'SO', 'NO'][Math.floor(Math.random() * 3)];

        const existingCV = await db.collection('coreValueGrades')
          .where('studentId', '==', studentId)
          .where('coreValueId', '==', coreValue.id)
          .where('schoolYear', '==', SCHOOL_YEAR)
          .limit(1)
          .get();

        if (existingCV.empty) {
          await db.collection('coreValueGrades').add({
            schoolId: SCHOOL_ID,
            studentId: studentId,
            coreValueId: coreValue.id,
            schoolYear: SCHOOL_YEAR,
            gradeLevel: demoStudent.gradeLevel,
            sectionId: studentData.sectionId,
            q1, q2, q3, q4,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          coreValueGradesCreated++;
        }
      }
      console.log(`      ✅ Created ${coreValueGradesCreated} core value grades`);

      // Create attendance records (past 60 days)
      console.log('   📅 Creating attendance records...');
      const today = new Date();
      const attendanceRecords = [];
      let attendanceCreated = 0;

      for (let i = 60; i > 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const dateStr = date.toISOString().split('T')[0];
        const status = generateAttendanceStatus();

        const existingAttendance = await db.collection('attendanceRecords')
          .where('studentId', '==', studentId)
          .where('date', '==', dateStr)
          .limit(1)
          .get();

        if (existingAttendance.empty) {
          await db.collection('attendanceRecords').add({
            schoolId: SCHOOL_ID,
            studentId: studentId,
            sectionId: studentData.sectionId,
            gradeLevel: demoStudent.gradeLevel,
            date: dateStr,
            status: status,
            schoolYear: SCHOOL_YEAR,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          attendanceCreated++;
        }
      }
      console.log(`      ✅ Created ${attendanceCreated} attendance records`);

      // Create assignments and submissions
      console.log('   📝 Creating assignment submissions...');
      const assignmentsSnapshot = await db.collection('assignments')
        .where('schoolId', '==', SCHOOL_ID)
        .where('sectionId', '==', studentData.sectionId)
        .limit(10)
        .get();

      let assignmentGradesCreated = 0;
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        
        const existingSubmission = await db.collection('studentAssignmentGrades')
          .where('studentId', '==', studentId)
          .where('assignmentId', '==', assignmentDoc.id)
          .limit(1)
          .get();

        if (existingSubmission.empty && assignment.learningAreaId) {
          const score = generateGrade(85, 10);
          const maxScore = assignment.maxScore || 100;
          
          await db.collection('studentAssignmentGrades').add({
            schoolId: SCHOOL_ID,
            studentId: studentId,
            assignmentId: assignmentDoc.id,
            learningAreaId: assignment.learningAreaId,
            sectionId: studentData.sectionId,
            gradeLevel: demoStudent.gradeLevel,
            score: score,
            maxScore: maxScore,
            status: 'graded',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            gradedAt: admin.firestore.FieldValue.serverTimestamp(),
            remarks: score >= 75 ? 'Good work!' : 'Needs improvement',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          assignmentGradesCreated++;
        }
      }
      console.log(`      ✅ Created ${assignmentGradesCreated} assignment submissions`);

      console.log(`   ✅ Completed ${demoStudent.firstName} ${demoStudent.lastName}`);
    }

    console.log('\n\n🎉 Demo data creation complete!');
    console.log('\n📋 Summary:');
    console.log('   All demo students now have:');
    console.log('   ✅ Academic grades (all subjects, 4 quarters)');
    console.log('   ✅ Core value grades (4 quarters)');
    console.log('   ✅ Attendance records (past 60 school days)');
    console.log('   ✅ Assignment submissions with scores');
    console.log('\n🎓 Demo accounts ready for video recording!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

createComprehensiveDemoData();
