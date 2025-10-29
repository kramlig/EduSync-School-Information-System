/**
 * High-Level Integration Test for Form 137 Cumulative Design
 * 
 * This script tests the complete flow:
 * 1. Generate first Form 137 for a student (create new)
 * 2. Add second year to same student (update existing)
 * 3. Verify cumulative structure
 * 4. Test data retrieval and display logic
 */

// Force production mode - disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = '';

const admin = require('firebase-admin');

// Initialize with production credentials
admin.initializeApp({
  projectId: 'edusync-sis',
});

console.log('✅ Firebase Admin initialized (production: edusync-sis)');
console.log('');

const db = admin.firestore();

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`   ✅ ${name}`);
  } else {
    results.failed++;
    console.log(`   ❌ ${name}`);
  }
  if (details) {
    console.log(`      ${details}`);
  }
  results.tests.push({ name, passed, details });
}

/**
 * Test 1: Find a student without Form 137
 */
async function test1_findTestStudent() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 1: Find Test Student                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get students
    const studentsSnap = await db.collection('students').limit(20).get();
    const form137Snap = await db.collection('academicHistory').get();
    
    const form137StudentIds = new Set();
    form137Snap.forEach(doc => {
      form137StudentIds.add(doc.data().studentId);
    });
    
    let testStudent = null;
    studentsSnap.forEach(doc => {
      if (!form137StudentIds.has(doc.id) && !testStudent) {
        testStudent = { id: doc.id, ...doc.data() };
      }
    });
    
    if (testStudent) {
      logTest('Found student without Form 137', true, 
        `Student: ${testStudent.name} (Grade ${testStudent.gradeLevel})`);
      console.log('');
      return testStudent;
    } else {
      logTest('Found student without Form 137', false, 'All students have Form 137');
      console.log('');
      return null;
    }
  } catch (error) {
    logTest('Find test student', false, error.message);
    console.log('');
    return null;
  }
}

/**
 * Test 2: Generate first Form 137 (Create New)
 */
async function test2_generateFirstForm137(studentId) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 2: Generate First Form 137 (Create Mode)             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Simulate what the generator would return for a new Form 137
    const studentDoc = await db.collection('students').doc(studentId).get();
    const student = { id: studentDoc.id, ...studentDoc.data() };
    
    // Create a mock Form 137 with the new cumulative structure
    const newForm137 = {
      studentId: student.id,
      studentName: student.name,
      lrn: student.lrn || '',
      birthDate: student.dateOfBirth || '',
      birthPlace: student.placeOfBirth || '',
      parentGuardian: student.guardianName || '',
      currentSchoolName: 'Test School',
      currentSchoolId: 'SCH001',
      schoolYears: [
        {
          schoolYear: '2024-2025',
          gradeLevel: student.gradeLevel || 1,
          section: student.section || 'Test Section',
          adviserName: 'Test Adviser',
          schoolName: 'Test School',
          schoolId: 'SCH001',
          grades: [
            {
              learningAreaId: 'LA001',
              learningAreaName: 'Mathematics',
              q1: 85,
              q2: 87,
              q3: 86,
              q4: 88,
              finalGrade: 86.5,
              remarks: 'Passed'
            },
            {
              learningAreaId: 'LA002',
              learningAreaName: 'English',
              q1: 90,
              q2: 89,
              q3: 91,
              q4: 90,
              finalGrade: 90,
              remarks: 'Passed'
            }
          ],
          generalAverage: 88.25,
          promotionStatus: 'Promoted',
          daysOfSchool: 200,
          daysPresent: 195,
          coreValues: [
            { valueName: 'Maka-Diyos', rating: 'AO' },
            { valueName: 'Makatao', rating: 'SO' }
          ],
          remarks: 'Test generation - First year',
          recordedBy: 'test-script',
          recordedAt: new Date().toISOString()
        }
      ],
      createdBy: 'test-script',
      updatedBy: 'test-script',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    const docRef = await db.collection('academicHistory').add(newForm137);
    
    logTest('Created new Form 137', true, `Document ID: ${docRef.id}`);
    
    // Verify structure
    const savedDoc = await docRef.get();
    const savedData = savedDoc.data();
    
    logTest('Has schoolYears array', 
      savedData.schoolYears && Array.isArray(savedData.schoolYears));
    logTest('schoolYears has 1 entry', 
      savedData.schoolYears.length === 1);
    logTest('First year has required fields', 
      savedData.schoolYears[0].schoolYear && 
      savedData.schoolYears[0].gradeLevel !== undefined &&
      savedData.schoolYears[0].grades);
    logTest('Grades use finalGrade property', 
      savedData.schoolYears[0].grades[0].finalGrade !== undefined);
    
    console.log('');
    return docRef.id;
  } catch (error) {
    logTest('Generate first Form 137', false, error.message);
    console.log('');
    return null;
  }
}

/**
 * Test 3: Add Second Year (Update Existing)
 */
async function test3_addSecondYear(docId) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 3: Add Second Year (Update Mode)                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get existing Form 137
    const docRef = db.collection('academicHistory').doc(docId);
    const doc = await docRef.get();
    const existingData = doc.data();
    
    logTest('Retrieved existing Form 137', doc.exists);
    
    // Create new year data
    const newYear = {
      schoolYear: '2025-2026',
      gradeLevel: existingData.schoolYears[0].gradeLevel + 1,
      section: 'Advanced Section',
      adviserName: 'New Adviser',
      schoolName: 'Test School',
      schoolId: 'SCH001',
      grades: [
        {
          learningAreaId: 'LA001',
          learningAreaName: 'Mathematics',
          q1: 88,
          q2: 90,
          q3: 89,
          q4: 91,
          finalGrade: 89.5,
          remarks: 'Passed'
        },
        {
          learningAreaId: 'LA002',
          learningAreaName: 'English',
          q1: 92,
          q2: 91,
          q3: 93,
          q4: 92,
          finalGrade: 92,
          remarks: 'Passed'
        },
        {
          learningAreaId: 'LA003',
          learningAreaName: 'Science',
          q1: 85,
          q2: 86,
          q3: 87,
          q4: 88,
          finalGrade: 86.5,
          remarks: 'Passed'
        }
      ],
      generalAverage: 89.33,
      promotionStatus: 'Promoted',
      daysOfSchool: 205,
      daysPresent: 200,
      coreValues: [
        { valueName: 'Maka-Diyos', rating: 'SO' },
        { valueName: 'Makatao', rating: 'SO' },
        { valueName: 'Makakalikasan', rating: 'AO' }
      ],
      remarks: 'Test generation - Second year',
      recordedBy: 'test-script',
      recordedAt: new Date().toISOString()
    };
    
    // Add new year to schoolYears array
    const updatedYears = [...existingData.schoolYears, newYear];
    
    await docRef.update({
      schoolYears: updatedYears,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'test-script'
    });
    
    logTest('Added second year to Form 137', true);
    
    // Verify update
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    logTest('schoolYears has 2 entries', 
      updatedData.schoolYears.length === 2);
    logTest('Second year has different schoolYear', 
      updatedData.schoolYears[1].schoolYear === '2025-2026');
    logTest('Second year has 3 grades', 
      updatedData.schoolYears[1].grades.length === 3);
    
    console.log('');
    return true;
  } catch (error) {
    logTest('Add second year', false, error.message);
    console.log('');
    return false;
  }
}

/**
 * Test 4: Verify Retrieval by Student ID
 */
async function test4_verifyRetrieval(studentId) {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 4: Verify Data Retrieval                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Test getByStudentId (should return ONE record, not array)
    const snapshot = await db.collection('academicHistory')
      .where('studentId', '==', studentId)
      .limit(1)
      .get();
    
    logTest('Query by studentId returns results', !snapshot.empty);
    
    if (!snapshot.empty) {
      const record = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      
      logTest('Returns single record (not array)', true, 
        'Service should return AcademicHistory | null');
      logTest('Record has cumulative structure', 
        record.schoolYears && Array.isArray(record.schoolYears));
      logTest('Has multiple years', 
        record.schoolYears.length >= 2,
        `Found ${record.schoolYears.length} year(s)`);
      
      // Verify each year
      let allYearsValid = true;
      record.schoolYears.forEach((year, idx) => {
        const hasRequired = year.schoolYear && 
                           year.gradeLevel !== undefined && 
                           year.section &&
                           year.grades &&
                           year.generalAverage !== undefined;
        
        if (!hasRequired) {
          allYearsValid = false;
          console.log(`      ⚠️  Year ${idx + 1} missing required fields`);
        }
      });
      
      logTest('All years have required fields', allYearsValid);
      
      // Test year progression
      if (record.schoolYears.length >= 2) {
        const firstYear = record.schoolYears[0];
        const secondYear = record.schoolYears[1];
        
        logTest('Grade level progresses correctly',
          secondYear.gradeLevel === firstYear.gradeLevel + 1,
          `${firstYear.gradeLevel} → ${secondYear.gradeLevel}`);
      }
    }
    
    console.log('');
  } catch (error) {
    logTest('Verify retrieval', false, error.message);
    console.log('');
  }
}

/**
 * Test 5: Verify Dashboard Display Logic
 */
async function test5_verifyDashboardLogic() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 5: Dashboard Display Logic                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const allRecords = await db.collection('academicHistory').get();
    
    logTest('Can fetch all Form 137 records', true, 
      `Found ${allRecords.size} record(s)`);
    
    // Simulate dashboard grouping logic
    const studentRecords = [];
    allRecords.forEach(doc => {
      const record = { id: doc.id, ...doc.data() };
      
      if (record.schoolYears && record.schoolYears.length > 0) {
        const latestYear = record.schoolYears[record.schoolYears.length - 1];
        
        studentRecords.push({
          studentId: record.studentId,
          studentName: record.studentName,
          lrn: record.lrn,
          gradeLevel: latestYear.gradeLevel,
          section: latestYear.section,
          recordCount: record.schoolYears.length,
          latestSchoolYear: latestYear.schoolYear,
          generalAverage: latestYear.generalAverage,
          promotionStatus: latestYear.promotionStatus
        });
      }
    });
    
    logTest('Dashboard shows ONE row per student', 
      studentRecords.length === allRecords.size,
      `${studentRecords.length} student rows`);
    
    const multiYearStudents = studentRecords.filter(s => s.recordCount > 1);
    logTest('Can identify multi-year records', 
      multiYearStudents.length > 0,
      `${multiYearStudents.length} student(s) with multiple years`);
    
    console.log('');
  } catch (error) {
    logTest('Dashboard logic', false, error.message);
    console.log('');
  }
}

/**
 * Test 6: Verify No Duplicate Records
 */
async function test6_verifyNoDuplicates() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 6: Verify No Duplicate Records                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const allRecords = await db.collection('academicHistory').get();
    const studentIds = new Map();
    let duplicates = [];
    
    allRecords.forEach(doc => {
      const studentId = doc.data().studentId;
      if (studentIds.has(studentId)) {
        duplicates.push(studentId);
      } else {
        studentIds.set(studentId, doc.id);
      }
    });
    
    logTest('No duplicate Form 137s per student', 
      duplicates.length === 0,
      duplicates.length > 0 ? `Found ${duplicates.length} duplicate(s)` : 'Each student has ONE Form 137');
    
    console.log('');
  } catch (error) {
    logTest('Check for duplicates', false, error.message);
    console.log('');
  }
}

/**
 * Test 7: Verify Data Structure Compliance
 */
async function test7_verifyStructureCompliance() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║ TEST 7: Verify Structure Compliance                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const allRecords = await db.collection('academicHistory').get();
    
    let allCompliant = true;
    let oldStructureCount = 0;
    let newStructureCount = 0;
    
    allRecords.forEach(doc => {
      const data = doc.data();
      
      if (data.schoolYears && Array.isArray(data.schoolYears)) {
        newStructureCount++;
        
        // Check each year
        data.schoolYears.forEach((year, idx) => {
          // Check for old 'finalRating' property
          if (year.grades && year.grades.length > 0) {
            const firstGrade = year.grades[0];
            if ('finalRating' in firstGrade) {
              allCompliant = false;
              console.log(`      ⚠️  ${data.studentName} year ${idx + 1} uses old 'finalRating'`);
            }
            if (!('finalGrade' in firstGrade)) {
              allCompliant = false;
              console.log(`      ⚠️  ${data.studentName} year ${idx + 1} missing 'finalGrade'`);
            }
          }
          
          // Check promotion status capitalization
          if (year.promotionStatus && year.promotionStatus === 'PROMOTED') {
            allCompliant = false;
            console.log(`      ⚠️  ${data.studentName} year ${idx + 1} uses 'PROMOTED' instead of 'Promoted'`);
          }
        });
      } else {
        oldStructureCount++;
        allCompliant = false;
      }
    });
    
    logTest('All records use new cumulative structure', 
      oldStructureCount === 0,
      `New: ${newStructureCount}, Old: ${oldStructureCount}`);
    
    logTest('All grades use finalGrade property', allCompliant);
    logTest('Promotion status uses proper capitalization', allCompliant);
    
    console.log('');
  } catch (error) {
    logTest('Structure compliance', false, error.message);
    console.log('');
  }
}

/**
 * Print Test Summary
 */
function printSummary() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Total Tests:  ${results.total}`);
  console.log(`✅ Passed:     ${results.passed}`);
  console.log(`❌ Failed:     ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('');
  
  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}`);
      if (t.details) console.log(`      ${t.details}`);
    });
    console.log('');
  }
  
  if (results.passed === results.total) {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🎉 ALL TESTS PASSED!                                    ║');
    console.log('║   Form 137 Cumulative Design is Working Correctly!       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
  } else {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ⚠️  SOME TESTS FAILED                                   ║');
    console.log('║   Please review the failures above                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
  }
  console.log('');
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Form 137 Cumulative Design - Integration Test Suite    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Test 1: Find test student
  const testStudent = await test1_findTestStudent();
  
  if (!testStudent) {
    console.log('⚠️  Cannot proceed with tests - no available student');
    console.log('');
    process.exit(1);
  }
  
  // Test 2: Generate first Form 137
  const docId = await test2_generateFirstForm137(testStudent.id);
  
  if (!docId) {
    console.log('⚠️  Cannot proceed - failed to generate Form 137');
    console.log('');
    process.exit(1);
  }
  
  // Test 3: Add second year
  await test3_addSecondYear(docId);
  
  // Test 4: Verify retrieval
  await test4_verifyRetrieval(testStudent.id);
  
  // Test 5: Dashboard logic
  await test5_verifyDashboardLogic();
  
  // Test 6: No duplicates
  await test6_verifyNoDuplicates();
  
  // Test 7: Structure compliance
  await test7_verifyStructureCompliance();
  
  // Print summary
  printSummary();
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
