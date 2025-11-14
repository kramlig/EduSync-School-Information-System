/**
 * Create Grade 1 subjects and grades for demo student
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

const GRADE_1_SUBJECTS = [
  { name: 'Mother Tongue', code: 'MTB' },
  { name: 'Filipino', code: 'FIL' },
  { name: 'English', code: 'ENG' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Araling Panlipunan (AP)', code: 'AP' },
  { name: 'MAPEH', code: 'MAPEH' },
  { name: 'Edukasyon sa Pagpapakatao (EsP)', code: 'ESP' }
];

async function createSubjectsAndGrades() {
  console.log('📚 Creating Grade 1 subjects and grades...\n');
  
  try {
    const learningAreaIds = [];
    
    // 1. Create learning areas if they don't exist
    for (const subject of GRADE_1_SUBJECTS) {
      const learningAreaRef = await db.collection('learningAreas').add({
        name: subject.name,
        code: subject.code,
        gradeLevel: 1,
        schoolId: SCHOOL_ID,
        description: subject.name + ' for Grade 1',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      learningAreaIds.push({ id: learningAreaRef.id, ...subject });
      console.log(`✅ Created subject: ${subject.name}`);
    }
    
    console.log(`\n✅ Created ${learningAreaIds.length} learning areas\n`);
    
    // 2. Create grades for each subject
    const gradeValues = [88, 92, 85, 90, 87, 89, 91]; // Different grade for each subject
    
    for (let i = 0; i < learningAreaIds.length; i++) {
      const area = learningAreaIds[i];
      const baseGrade = gradeValues[i];
      
      await db.collection('grades').add({
        studentId: STUDENT_ID,
        schoolId: SCHOOL_ID,
        sectionId: SECTION_ID,
        learningAreaId: area.id,
        learningAreaName: area.name,
        gradeLevel: 1,
        quarter: 'Q1',
        writtenWork: baseGrade - 2,
        performanceTask: baseGrade,
        quarterlyAssessment: baseGrade + 2,
        finalGrade: baseGrade,
        schoolYear: '2024-2025',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Created grade for ${area.name}: ${baseGrade}`);
    }
    
    const average = Math.round(gradeValues.reduce((a, b) => a + b) / gradeValues.length);
    
    console.log('\n📊 Summary:');
    console.log(`  Student: Juan La Cruz`);
    console.log(`  Subjects: ${learningAreaIds.length}`);
    console.log(`  Grades created: ${learningAreaIds.length}`);
    console.log(`  General Average: ${average}`);
    console.log('\n✅ All done! Student now has grades to display!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createSubjectsAndGrades();
