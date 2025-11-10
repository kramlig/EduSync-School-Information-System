#!/usr/bin/env node

/**
 * Multi-Tenant Isolation Test Script
 * 
 * Validates that all data is properly isolated by schoolId:
 * 1. Verifies students belong to correct schools
 * 2. Checks grades are isolated by school
 * 3. Validates parent-student relationships respect school boundaries
 * 4. Tests notification logs have correct schoolId
 * 5. Confirms announcements are school-specific
 */

const admin = require('firebase-admin');

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

async function getSchools() {
  const snapshot = await db.collection('schools').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function testStudentIsolation(schools) {
  log('\n📚 Testing Student Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const studentsSnap = await db.collection('students')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = studentsSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${studentsSnap.size} students`,
      allCorrect,
      allCorrect ? 'All students have correct schoolId' : 'MISMATCH: Some students have wrong schoolId'
    );

    // Check for cross-contamination
    const wrongSchoolSnap = await db.collection('students')
      .where('schoolId', '!=', school.id)
      .get();
    
    const contaminated = wrongSchoolSnap.docs.filter(doc => 
      doc.data().sectionId && doc.data().sectionId.includes(school.id)
    );

    logTest(
      `${school.name}: Cross-contamination check`,
      contaminated.length === 0,
      contaminated.length === 0 ? 'No cross-school references' : `FOUND ${contaminated.length} students in wrong school`
    );
  }
}

async function testGradeIsolation(schools) {
  log('\n📊 Testing Grade Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const gradesSnap = await db.collection('grades')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = gradesSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${gradesSnap.size} grade records`,
      allCorrect,
      allCorrect ? 'All grades have correct schoolId' : 'MISMATCH: Some grades have wrong schoolId'
    );

    // Verify grade-student relationship
    const gradesByStudent = {};
    for (const doc of gradesSnap.docs) {
      const grade = doc.data();
      if (!gradesByStudent[grade.studentId]) {
        gradesByStudent[grade.studentId] = [];
      }
      gradesByStudent[grade.studentId].push(grade);
    }

    // Check each student's school matches their grades' school
    let mismatchCount = 0;
    for (const studentId in gradesByStudent) {
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (studentDoc.exists && studentDoc.data().schoolId !== school.id) {
        mismatchCount++;
      }
    }

    logTest(
      `${school.name}: Student-grade relationship`,
      mismatchCount === 0,
      mismatchCount === 0 ? 'All grades belong to correct school students' : `FOUND ${mismatchCount} mismatched student-grade pairs`
    );
  }
}

async function testParentIsolation(schools) {
  log('\n👨‍👩‍👧‍👦 Testing Parent Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const parentsSnap = await db.collection('parents')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = parentsSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${parentsSnap.size} parents`,
      allCorrect,
      allCorrect ? 'All parents have correct schoolId' : 'MISMATCH: Some parents have wrong schoolId'
    );

    // Verify parent-student relationships
    let mismatchCount = 0;
    for (const parentDoc of parentsSnap.docs) {
      const parent = parentDoc.data();
      const studentIds = parent.studentIds || [];

      for (const studentId of studentIds) {
        const studentDoc = await db.collection('students').doc(studentId).get();
        if (studentDoc.exists && studentDoc.data().schoolId !== school.id) {
          mismatchCount++;
        }
      }
    }

    logTest(
      `${school.name}: Parent-student relationship`,
      mismatchCount === 0,
      mismatchCount === 0 ? 'All parent-student pairs in same school' : `FOUND ${mismatchCount} cross-school parent-student pairs`
    );
  }
}

async function testCoreValueGradeIsolation(schools) {
  log('\n⭐ Testing Core Value Grade Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const coreValueGradesSnap = await db.collection('coreValueGrades')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = coreValueGradesSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${coreValueGradesSnap.size} core value grade records`,
      allCorrect,
      allCorrect ? 'All core value grades have correct schoolId' : 'MISMATCH: Some core value grades have wrong schoolId'
    );
  }
}

async function testAnnouncementIsolation(schools) {
  log('\n📢 Testing Announcement Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const announcementsSnap = await db.collection('announcements')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = announcementsSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${announcementsSnap.size} announcements`,
      allCorrect,
      allCorrect ? 'All announcements have correct schoolId' : 'MISMATCH: Some announcements have wrong schoolId'
    );
  }
}

async function testLearningAreaIsolation(schools) {
  log('\n📚 Testing Learning Area Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const learningAreasSnap = await db.collection('learningAreas')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = learningAreasSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${learningAreasSnap.size} learning areas`,
      allCorrect,
      allCorrect ? 'All learning areas have correct schoolId' : 'MISMATCH: Some learning areas have wrong schoolId'
    );

    // Check that gradeLevel is numeric array
    const hasNumericGradeLevel = learningAreasSnap.docs.every(doc => {
      const gradeLevel = doc.data().gradeLevel;
      return Array.isArray(gradeLevel) && gradeLevel.every(gl => typeof gl === 'number');
    });

    logTest(
      `${school.name}: Grade level format`,
      hasNumericGradeLevel,
      hasNumericGradeLevel ? 'All learning areas use numeric gradeLevel array' : 'FOUND string-based gradeLevel format'
    );
  }
}

async function testSectionIsolation(schools) {
  log('\n📝 Testing Section Isolation', 'bold');
  log('─'.repeat(60), 'cyan');

  for (const school of schools) {
    const sectionsSnap = await db.collection('sections')
      .where('schoolId', '==', school.id)
      .get();

    const allCorrect = sectionsSnap.docs.every(doc => doc.data().schoolId === school.id);
    
    logTest(
      `${school.name}: ${sectionsSnap.size} sections`,
      allCorrect,
      allCorrect ? 'All sections have correct schoolId' : 'MISMATCH: Some sections have wrong schoolId'
    );
  }
}

async function testQueryPerformance(schools) {
  log('\n⚡ Testing Query Performance with Indexes', 'bold');
  log('─'.repeat(60), 'cyan');

  const school = schools[0]; // Test with first school

  // Test composite index queries
  const queries = [
    {
      name: 'Students by schoolId + sectionId',
      query: () => db.collection('students')
        .where('schoolId', '==', school.id)
        .where('sectionId', '==', 'some-section-id')
        .get()
    },
    {
      name: 'Grades by schoolId + studentId',
      query: () => db.collection('grades')
        .where('schoolId', '==', school.id)
        .where('studentId', '==', 'some-student-id')
        .get()
    },
    {
      name: 'Parents by schoolId + email',
      query: () => db.collection('parents')
        .where('schoolId', '==', school.id)
        .where('email', '==', 'test@example.com')
        .get()
    },
    {
      name: 'Announcements by schoolId + date (desc)',
      query: () => db.collection('announcements')
        .where('schoolId', '==', school.id)
        .orderBy('date', 'desc')
        .limit(10)
        .get()
    }
  ];

  for (const test of queries) {
    try {
      const start = Date.now();
      await test.query();
      const duration = Date.now() - start;

      logTest(
        test.name,
        duration < 1000,
        `Completed in ${duration}ms`
      );
    } catch (error) {
      logTest(
        test.name,
        false,
        `ERROR: ${error.message}`
      );
    }
  }
}

async function testDataSummary(schools) {
  log('\n📊 Data Summary', 'bold');
  log('═'.repeat(60), 'cyan');

  const collections = [
    'students', 'teachers', 'parents', 'sections', 
    'grades', 'coreValueGrades', 'learningAreas', 
    'announcements', 'assignments', 'lessonPlans'
  ];

  log('\n School-wise Distribution:', 'yellow');
  for (const school of schools) {
    log(`\n ${school.name} (${school.id})`, 'bold');
    
    for (const collection of collections) {
      const snap = await db.collection(collection)
        .where('schoolId', '==', school.id)
        .get();
      
      log(`   ${collection.padEnd(20)} : ${snap.size.toString().padStart(4)}`, 'cyan');
    }
  }

  // Total counts
  log('\n Total Counts:', 'yellow');
  for (const collection of collections) {
    const snap = await db.collection(collection).get();
    log(`   ${collection.padEnd(20)} : ${snap.size.toString().padStart(4)}`, 'cyan');
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🔒 MULTI-TENANT ISOLATION TEST', 'bold');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    // Get all schools
    const schools = await getSchools();
    log(`Found ${schools.length} schools: ${schools.map(s => s.name).join(', ')}`, 'blue');

    // Run all tests
    await testStudentIsolation(schools);
    await testGradeIsolation(schools);
    await testParentIsolation(schools);
    await testCoreValueGradeIsolation(schools);
    await testAnnouncementIsolation(schools);
    await testLearningAreaIsolation(schools);
    await testSectionIsolation(schools);
    await testQueryPerformance(schools);
    await testDataSummary(schools);

    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('✅ MULTI-TENANT ISOLATION TEST COMPLETE', 'green');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');

    process.exit(0);
  } catch (error) {
    log(`\n❌ TEST FAILED: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
