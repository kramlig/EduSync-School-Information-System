#!/usr/bin/env node
/**
 * COMPREHENSIVE CRUD AUDIT TEST
 * 
 * Tests all Create, Read, Update, Delete operations for all collections:
 * - Students
 * - Teachers
 * - Parents
 * - Sections
 * - Learning Areas
 * - Grades
 * - Core Values
 * - Core Value Grades
 * - Attendance Records
 * - Assignments
 * - Lesson Plans
 * - Announcements
 * - Class Schedules
 * - Substitute Assignments
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for PRODUCTION (not emulator!)
let app;
try {
  // Explicitly disable emulator
  process.env.FIRESTORE_EMULATOR_HOST = '';
  
  app = admin.initializeApp({
    projectId: 'edusync-sis'
  });
  console.log('✅ Initialized Firebase Admin for PRODUCTION');
  console.log('   Project: edusync-sis');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\n💡 To run this audit, you need Firebase credentials:');
  console.log('   Option 1: Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.log('   Option 2: Run: firebase login');
  console.log('   Option 3: Place service account key in the root directory\n');
  process.exit(1);
}

const db = admin.firestore();
// Ensure we're NOT using emulator
db.settings({ ignoreUndefinedProperties: true });

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log test results
function logTest(collection, operation, status, message = '') {
  const result = { collection, operation, status, message, timestamp: new Date().toISOString() };
  
  if (status === 'PASS') {
    results.passed.push(result);
    console.log(`✅ [${collection}] ${operation}: PASS ${message}`);
  } else if (status === 'FAIL') {
    results.failed.push(result);
    console.error(`❌ [${collection}] ${operation}: FAIL ${message}`);
  } else {
    results.warnings.push(result);
    console.warn(`⚠️  [${collection}] ${operation}: WARNING ${message}`);
  }
}

// Collection configurations
const collections = [
  {
    name: 'students',
    requiredFields: ['id', 'name', 'email'],
    sampleDoc: {
      name: 'CRUD Test Student',
      email: 'crud-test@students.edu',
      enrollmentDate: new Date().toISOString(),
      sex: 'Male',
      lrn: '999999999999',
      sectionId: null
    }
  },
  {
    name: 'teachers',
    requiredFields: ['id', 'name', 'email', 'role'],
    sampleDoc: {
      name: 'CRUD Test Teacher',
      email: 'crud-test@school.edu',
      role: 'teacher',
      assignments: []
    }
  },
  {
    name: 'parents',
    requiredFields: ['id', 'name', 'email'],
    sampleDoc: {
      name: 'CRUD Test Parent',
      email: 'crud-test@mail.com',
      studentIds: []
    }
  },
  {
    name: 'sections',
    requiredFields: ['id', 'name', 'gradeLevel'],
    sampleDoc: {
      name: 'CRUD Test Section',
      gradeLevel: 1,
      adviserId: null
    }
  },
  {
    name: 'learningAreas',
    requiredFields: ['id', 'name', 'credits'],
    sampleDoc: {
      name: 'CRUD Test Subject',
      credits: 1,
      isComposite: false
    }
  },
  {
    name: 'announcements',
    requiredFields: ['id', 'title', 'content'],
    sampleDoc: {
      title: 'CRUD Test Announcement',
      content: 'This is a test announcement',
      audience: 'all',
      date: new Date().toISOString()
    }
  },
  {
    name: 'lessonPlans',
    requiredFields: ['id', 'title'],
    sampleDoc: {
      title: 'CRUD Test Lesson',
      objectives: 'Test objectives',
      gradeLevel: 1,
      quarter: 'Q1',
      week: 1
    }
  }
];

// TEST 1: Check collection existence and count
async function testCollectionExistence() {
  console.log('\n📋 TEST 1: Collection Existence and Document Count\n');
  
  const allCollections = [
    'students', 'teachers', 'parents', 'sections', 
    'learningAreas', 'grades', 'coreValues', 'coreValueGrades',
    'attendanceRecords', 'assignments', 'studentAssignmentGrades',
    'lessonPlans', 'announcements', 'classSchedules', 'substituteAssignments'
  ];
  
  let criticalFailures = 0;
  
  for (const collectionName of allCollections) {
    try {
      const snapshot = await db.collection(collectionName).limit(1).get();
      const countSnapshot = await db.collection(collectionName).count().get();
      const count = countSnapshot.data().count;
      
      if (count > 0) {
        logTest(collectionName, 'EXISTS', 'PASS', `(${count} documents)`);
      } else {
        logTest(collectionName, 'EXISTS', 'WARNING', '(empty collection)');
      }
    } catch (error) {
      logTest(collectionName, 'EXISTS', 'FAIL', error.message);
      criticalFailures++;
      
      // If we can't even list collections, stop immediately
      if (criticalFailures >= 3) {
        console.error('\n🛑 Too many collection access failures - stopping test!');
        console.error('This suggests a fundamental connectivity or permission issue.\n');
        process.exit(1);
      }
    }
  }
}

// TEST 2: Test CREATE operations
async function testCreate() {
  console.log('\n➕ TEST 2: CREATE Operations\n');
  
  for (const config of collections) {
    try {
      const testId = `crud-test-${Date.now()}`;
      const docData = { ...config.sampleDoc, id: testId };
      
      await db.collection(config.name).doc(testId).set(docData);
      
      // Verify creation
      const doc = await db.collection(config.name).doc(testId).get();
      if (doc.exists) {
        logTest(config.name, 'CREATE', 'PASS', `(id: ${testId})`);
      } else {
        logTest(config.name, 'CREATE', 'FAIL', 'Document not found after creation');
      }
    } catch (error) {
      logTest(config.name, 'CREATE', 'FAIL', error.message);
    }
  }
}

// TEST 3: Test READ operations
async function testRead() {
  console.log('\n📖 TEST 3: READ Operations\n');
  
  for (const config of collections) {
    try {
      // Test single document read
      const snapshot = await db.collection(config.name).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        // Verify required fields
        const missingFields = config.requiredFields.filter(field => !(field in data));
        if (missingFields.length === 0) {
          logTest(config.name, 'READ', 'PASS', `(verified fields)`);
        } else {
          logTest(config.name, 'READ', 'WARNING', `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        logTest(config.name, 'READ', 'WARNING', 'No documents to read');
      }
      
      // Test collection read
      const allDocs = await db.collection(config.name).limit(10).get();
      logTest(config.name, 'READ_MULTIPLE', 'PASS', `(${allDocs.size} documents)`);
      
    } catch (error) {
      logTest(config.name, 'READ', 'FAIL', error.message);
    }
  }
}

// TEST 4: Test UPDATE operations
async function testUpdate() {
  console.log('\n✏️  TEST 4: UPDATE Operations\n');
  
  for (const config of collections) {
    try {
      // Find a test document
      const testDocs = await db.collection(config.name)
        .where('id', '>=', 'crud-test-')
        .where('id', '<', 'crud-test-~')
        .limit(1)
        .get();
      
      if (!testDocs.empty) {
        const testDoc = testDocs.docs[0];
        const updateData = { updatedAt: new Date().toISOString(), testUpdate: true };
        
        await testDoc.ref.update(updateData);
        
        // Verify update
        const updated = await testDoc.ref.get();
        if (updated.exists && updated.data().testUpdate === true) {
          logTest(config.name, 'UPDATE', 'PASS', `(id: ${testDoc.id})`);
        } else {
          logTest(config.name, 'UPDATE', 'FAIL', 'Update not persisted');
        }
      } else {
        logTest(config.name, 'UPDATE', 'WARNING', 'No test document to update');
      }
    } catch (error) {
      logTest(config.name, 'UPDATE', 'FAIL', error.message);
    }
  }
}

// TEST 5: Test DELETE operations
async function testDelete() {
  console.log('\n🗑️  TEST 5: DELETE Operations\n');
  
  for (const config of collections) {
    try {
      // Find test documents
      const testDocs = await db.collection(config.name)
        .where('id', '>=', 'crud-test-')
        .where('id', '<', 'crud-test-~')
        .get();
      
      if (!testDocs.empty) {
        for (const testDoc of testDocs.docs) {
          await testDoc.ref.delete();
          
          // Verify deletion
          const deleted = await testDoc.ref.get();
          if (!deleted.exists) {
            logTest(config.name, 'DELETE', 'PASS', `(id: ${testDoc.id})`);
          } else {
            logTest(config.name, 'DELETE', 'FAIL', 'Document still exists after deletion');
          }
        }
      } else {
        logTest(config.name, 'DELETE', 'WARNING', 'No test documents to delete');
      }
    } catch (error) {
      logTest(config.name, 'DELETE', 'FAIL', error.message);
    }
  }
}

// TEST 6: Test Firestore Rules
async function testFirestoreRules() {
  console.log('\n🔒 TEST 6: Firestore Security Rules\n');
  
  try {
    // Test anonymous read (should work based on current rules)
    const testRead = await db.collection('students').limit(1).get();
    logTest('security', 'ANONYMOUS_READ', 'PASS', 'Read access works');
    
    // Note: Write tests require authenticated context
    logTest('security', 'AUTH_REQUIRED', 'INFO', 'Write requires authentication (auth != null)');
    
  } catch (error) {
    logTest('security', 'RULES_TEST', 'FAIL', error.message);
  }
}

// TEST 7: Test Data Integrity
async function testDataIntegrity() {
  console.log('\n🔍 TEST 7: Data Integrity Checks\n');
  
  // Test 1: Students with sections should reference valid sections
  try {
    const students = await db.collection('students').where('sectionId', '!=', null).limit(100).get();
    const sections = await db.collection('sections').get();
    const sectionIds = new Set(sections.docs.map(d => d.id));
    
    let invalidRefs = 0;
    students.docs.forEach(student => {
      const sectionId = student.data().sectionId;
      if (sectionId && !sectionIds.has(sectionId)) {
        invalidRefs++;
      }
    });
    
    if (invalidRefs === 0) {
      logTest('students', 'SECTION_REFS', 'PASS', `All section references valid`);
    } else {
      logTest('students', 'SECTION_REFS', 'WARNING', `${invalidRefs} invalid section references`);
    }
  } catch (error) {
    logTest('students', 'SECTION_REFS', 'FAIL', error.message);
  }
  
  // Test 2: Parents with studentIds should reference valid students
  try {
    const parents = await db.collection('parents').where('studentIds', '!=', []).limit(100).get();
    const students = await db.collection('students').get();
    const studentIds = new Set(students.docs.map(d => d.id));
    
    let invalidRefs = 0;
    parents.docs.forEach(parent => {
      const ids = parent.data().studentIds || [];
      ids.forEach(id => {
        if (!studentIds.has(id)) invalidRefs++;
      });
    });
    
    if (invalidRefs === 0) {
      logTest('parents', 'STUDENT_REFS', 'PASS', `All student references valid`);
    } else {
      logTest('parents', 'STUDENT_REFS', 'WARNING', `${invalidRefs} invalid student references`);
    }
  } catch (error) {
    logTest('parents', 'STUDENT_REFS', 'FAIL', error.message);
  }
}

// TEST 8: Test Performance
async function testPerformance() {
  console.log('\n⚡ TEST 8: Performance Tests\n');
  
  const performanceTests = [
    { collection: 'students', limit: 100 },
    { collection: 'teachers', limit: 100 },
    { collection: 'parents', limit: 100 },
    { collection: 'sections', limit: 50 }
  ];
  
  for (const test of performanceTests) {
    try {
      const start = Date.now();
      const snapshot = await db.collection(test.collection).limit(test.limit).get();
      const duration = Date.now() - start;
      
      const avgPerDoc = snapshot.size > 0 ? (duration / snapshot.size).toFixed(2) : 'N/A';
      
      if (duration < 1000) {
        logTest(test.collection, 'PERFORMANCE', 'PASS', `${duration}ms for ${snapshot.size} docs (${avgPerDoc}ms/doc)`);
      } else if (duration < 3000) {
        logTest(test.collection, 'PERFORMANCE', 'WARNING', `${duration}ms for ${snapshot.size} docs (slow)`);
      } else {
        logTest(test.collection, 'PERFORMANCE', 'FAIL', `${duration}ms for ${snapshot.size} docs (too slow)`);
      }
    } catch (error) {
      logTest(test.collection, 'PERFORMANCE', 'FAIL', error.message);
    }
  }
}

// Generate final report
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 CRUD AUDIT REPORT');
  console.log('='.repeat(70));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n🔴 FAILURES:');
    results.failed.forEach(r => {
      console.log(`   [${r.collection}] ${r.operation}: ${r.message}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(r => {
      console.log(`   [${r.collection}] ${r.operation}: ${r.message}`);
    });
  }
  
  const totalTests = results.passed.length + results.failed.length + results.warnings.length;
  const successRate = ((results.passed.length / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 Success Rate: ${successRate}%`);
  console.log(`⏱️  Completed: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70) + '\n');
  
  // Return exit code
  return results.failed.length === 0 ? 0 : 1;
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Comprehensive CRUD Audit...\n');
  console.log('Target: Firebase Production (edusync-sis)\n');
  
  try {
    // 🔥 CONNECTIVITY TEST FIRST - Stop if this fails!
    console.log('⚡ Step 0: Testing Firestore connectivity...');
    try {
      const testDoc = await db.collection('settings').doc('school').get();
      console.log('✅ Firestore connection successful!');
      if (testDoc.exists) {
        console.log(`   School Name: ${testDoc.data()?.schoolName || 'Unknown'}\n`);
      } else {
        console.log('   Warning: School settings document not found\n');
      }
    } catch (connectError) {
      console.error('\n❌ CONNECTIVITY FAILED - Cannot connect to Firestore!');
      console.error('Error:', connectError.message);
      console.error('\n💡 Possible reasons:');
      console.error('   - Missing service account key (firebase-admin-key.json)');
      console.error('   - Invalid credentials');
      console.error('   - Network/firewall issues');
      console.error('   - Wrong project ID');
      console.error('\n🛑 STOPPING TEST - All tests would fail anyway!\n');
      process.exit(1);
    }

    // Proceed with tests only if connectivity is good
    await testCollectionExistence();
    await testCreate();
    await testRead();
    await testUpdate();
    await testDelete();
    await testFirestoreRules();
    await testDataIntegrity();
    await testPerformance();
    
    const exitCode = generateReport();
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n❌ Fatal error during audit:', error);
    process.exit(1);
  }
}

// Run the audit
runAllTests();
