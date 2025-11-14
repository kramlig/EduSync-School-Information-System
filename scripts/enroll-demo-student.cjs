/**
 * Enroll demo student and create sample data for testing
 */

const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

const STUDENT_ID = 'W0nWibNkePGk63mwBjvU'; // Juan La Cruz
const SECTION_ID = 'sec_grade1_a';
const SCHOOL_ID = 'default';

async function enrollStudent() {
  console.log('📚 Enrolling student and creating sample data...\n');
  
  try {
    // 1. Update student with section
    await db.collection('students').doc(STUDENT_ID).update({
      sectionId: SECTION_ID,
      gradeLevel: 1
    });
    console.log('✅ Updated student with section: Grade 1 - Section A\n');
    
    // 2. Get learning areas for Grade 1
    const learningAreasSnapshot = await db.collection('learningAreas')
      .where('schoolId', '==', SCHOOL_ID)
      .where('gradeLevel', '==', 1)
      .get();
    
    const learningAreas = [];
    learningAreasSnapshot.forEach(doc => {
      learningAreas.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${learningAreas.length} learning areas for Grade 1\n`);
    
    // 3. Create sample grades for each learning area
    const gradePromises = learningAreas.slice(0, 5).map((area, index) => {
      const gradeValue = 85 + (index * 2); // 85, 87, 89, 91, 93
      return db.collection('grades').add({
        studentId: STUDENT_ID,
        schoolId: SCHOOL_ID,
        sectionId: SECTION_ID,
        learningAreaId: area.id,
        learningAreaName: area.name,
        gradeLevel: 1,
        quarter: 'Q1',
        writtenWork: gradeValue - 2,
        performanceTask: gradeValue,
        quarterlyAssessment: gradeValue + 2,
        finalGrade: gradeValue,
        schoolYear: '2024-2025',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await Promise.all(gradePromises);
    console.log(`✅ Created ${gradePromises.length} sample grades\n`);
    
    // 4. Create attendance records for the past 10 days
    const attendancePromises = [];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const status = i === 0 ? 'present' : (i % 7 === 0 ? 'absent' : 'present');
      
      attendancePromises.push(
        db.collection('attendanceRecords').add({
          studentId: STUDENT_ID,
          schoolId: SCHOOL_ID,
          sectionId: SECTION_ID,
          date: date.toISOString().split('T')[0],
          status: status,
          remarks: status === 'absent' ? 'Sick' : '',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      );
    }
    
    await Promise.all(attendancePromises);
    console.log(`✅ Created ${attendancePromises.length} attendance records\n`);
    
    // 5. Summary
    console.log('📊 Summary:');
    console.log(`  Student: Juan La Cruz (${STUDENT_ID})`);
    console.log(`  Section: Grade 1 - Section A (${SECTION_ID})`);
    console.log(`  Grades: ${gradePromises.length} subjects`);
    console.log(`  Attendance: ${attendancePromises.length} days recorded`);
    console.log(`  Average Grade: ~89`);
    console.log('\n✅ Student is now enrolled with sample data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

enrollStudent();
