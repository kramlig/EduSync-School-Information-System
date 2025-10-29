/**
 * Test Script: Form 137 Auto-Generation
 * 
 * Tests the auto-generation feature with real Firestore data
 * Verifies data fetching, transformation, and calculation logic
 */

// Force production mode - disable emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = '';

const admin = require('firebase-admin');

// Initialize with production credentials (uses application default credentials)
admin.initializeApp({
  projectId: 'edusync-sis',
});

console.log('✅ Firebase Admin initialized (production)');
console.log('🔒 Emulator disabled - connecting to production Firestore');

const db = admin.firestore();

/**
 * Fetch a student with their related data
 */
async function fetchStudentData(studentId) {
  console.log(`\n📊 Fetching data for student: ${studentId}`);
  
  try {
    // Get student
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      console.log('❌ Student not found');
      return null;
    }
    
    const student = { id: studentDoc.id, ...studentDoc.data() };
    console.log(`✅ Student: ${student.name}`);
    
    // Get section
    let section = null;
    if (student.sectionId) {
      const sectionDoc = await db.collection('sections').doc(student.sectionId).get();
      if (sectionDoc.exists) {
        section = { id: sectionDoc.id, ...sectionDoc.data() };
        console.log(`✅ Section: Grade ${section.gradeLevel} - ${section.name}`);
        
        // Get adviser
        if (section.adviserId) {
          const adviserDoc = await db.collection('teachers').doc(section.adviserId).get();
          if (adviserDoc.exists) {
            console.log(`✅ Adviser: ${adviserDoc.data().name}`);
          }
        }
      }
    }
    
    // Get grades
    const gradesSnapshot = await db.collection('grades')
      .where('studentId', '==', studentId)
      .get();
    const grades = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Grades: ${grades.length} records found`);
    
    // Show grade details
    if (grades.length > 0) {
      const learningAreasSnapshot = await db.collection('learningAreas').get();
      const learningAreasMap = new Map();
      learningAreasSnapshot.docs.forEach(doc => {
        learningAreasMap.set(doc.id, doc.data().name);
      });
      
      console.log('\n   Grade Details:');
      grades.forEach(grade => {
        const subjectName = learningAreasMap.get(grade.learningAreaId) || grade.learningAreaId;
        const q1 = typeof grade.q1 === 'number' ? grade.q1 : '-';
        const q2 = typeof grade.q2 === 'number' ? grade.q2 : '-';
        const q3 = typeof grade.q3 === 'number' ? grade.q3 : '-';
        const q4 = typeof grade.q4 === 'number' ? grade.q4 : '-';
        const final = grade.finalGrade || '-';
        console.log(`   - ${subjectName}: Q1=${q1}, Q2=${q2}, Q3=${q3}, Q4=${q4}, Final=${final}`);
      });
    }
    
    // Get attendance
    const attendanceSnapshot = await db.collection('attendanceRecords')
      .where('studentId', '==', studentId)
      .get();
    
    let totalDays = 0;
    let daysPresent = 0;
    
    if (!attendanceSnapshot.empty) {
      const attendanceRecord = attendanceSnapshot.docs[0].data();
      const dailyStatus = attendanceRecord.dailyStatus || {};
      
      Object.entries(dailyStatus).forEach(([date, status]) => {
        totalDays++;
        if (status === 'P') daysPresent++;
      });
      
      const attendanceRate = totalDays > 0 ? ((daysPresent / totalDays) * 100).toFixed(1) : 0;
      console.log(`✅ Attendance: ${daysPresent}/${totalDays} days (${attendanceRate}%)`);
    } else {
      console.log('⚠️  No attendance records found');
    }
    
    // Get core values
    const coreValuesSnapshot = await db.collection('coreValueGrades')
      .where('studentId', '==', studentId)
      .get();
    console.log(`✅ Core Values: ${coreValuesSnapshot.size} records found`);
    
    if (coreValuesSnapshot.size > 0) {
      const coreValuesCollSnapshot = await db.collection('coreValues').get();
      const coreValuesMap = new Map();
      coreValuesCollSnapshot.docs.forEach(doc => {
        coreValuesMap.set(doc.id, doc.data().name);
      });
      
      console.log('\n   Core Values Details:');
      coreValuesSnapshot.docs.forEach(doc => {
        const cvGrade = doc.data();
        const coreValueName = coreValuesMap.get(cvGrade.coreValueId) || cvGrade.coreValueId;
        
        // Get most recent quarter
        const q4 = cvGrade.q4;
        const q3 = cvGrade.q3;
        const q2 = cvGrade.q2;
        const q1 = cvGrade.q1;
        const latestQuarter = q4 || q3 || q2 || q1;
        
        if (latestQuarter) {
          const behaviors = Object.keys(latestQuarter);
          console.log(`   - ${coreValueName}: ${behaviors.length} behaviors assessed`);
        }
      });
    }
    
    return {
      student,
      section,
      grades,
      attendance: { totalDays, daysPresent },
      coreValuesCount: coreValuesSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    return null;
  }
}

/**
 * Test the generation logic (without saving)
 */
async function testGeneration(studentId) {
  console.log('\n\n🧪 Testing Form 137 Generation Logic');
  console.log('='.repeat(50));
  
  const data = await fetchStudentData(studentId);
  
  if (!data) {
    console.log('❌ Cannot proceed with generation - missing data');
    return;
  }
  
  console.log('\n✅ Data Summary:');
  console.log(`   - Student: ${data.student.name}`);
  console.log(`   - LRN: ${data.student.lrn || 'Not set'}`);
  console.log(`   - Section: ${data.section ? `Grade ${data.section.gradeLevel} - ${data.section.name}` : 'Not assigned'}`);
  console.log(`   - Grades: ${data.grades.length} subjects`);
  console.log(`   - Attendance: ${data.attendance.daysPresent}/${data.attendance.totalDays} days`);
  console.log(`   - Core Values: ${data.coreValuesCount} assessed`);
  
  // Calculate general average
  const finalGrades = data.grades
    .map(g => g.finalGrade)
    .filter(g => g && g > 0);
  
  if (finalGrades.length > 0) {
    const generalAverage = finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length;
    console.log(`\n📊 Calculated General Average: ${generalAverage.toFixed(2)}`);
    
    const promotionStatus = generalAverage >= 75 ? 'PROMOTED' : 'RETAINED';
    console.log(`📊 Promotion Status: ${promotionStatus}`);
  } else {
    console.log('\n⚠️  Cannot calculate general average - no final grades found');
  }
  
  console.log('\n✅ Generation logic test complete!');
  console.log('   All data can be successfully fetched and transformed.');
}

/**
 * List available students
 */
async function listStudents() {
  console.log('\n👥 Available Students:');
  console.log('='.repeat(50));
  
  const studentsSnapshot = await db.collection('students')
    .orderBy('name')
    .limit(10)
    .get();
  
  if (studentsSnapshot.empty) {
    console.log('❌ No students found in database');
    return [];
  }
  
  const students = [];
  studentsSnapshot.docs.forEach((doc, index) => {
    const student = { id: doc.id, ...doc.data() };
    students.push(student);
    console.log(`${index + 1}. ${student.name} (${student.id})`);
    if (student.lrn) console.log(`   LRN: ${student.lrn}`);
    if (student.sectionId) console.log(`   Section ID: ${student.sectionId}`);
  });
  
  return students;
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Form 137 Auto-Generation Test');
  console.log('='.repeat(50));
  
  try {
    // List available students
    const students = await listStudents();
    
    if (students.length === 0) {
      console.log('\n❌ No students to test with. Please seed data first.');
      return;
    }
    
    // Test with first student
    const testStudentId = students[0].id;
    await testGeneration(testStudentId);
    
    console.log('\n\n💡 To test in the UI:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Navigate to Forms → Form 137');
    console.log('   3. Click "Auto-Generate" button');
    console.log(`   4. Select: ${students[0].name}`);
    console.log('   5. Verify the generated form');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    // Cleanup
    process.exit(0);
  }
}

// Run the test
main();
