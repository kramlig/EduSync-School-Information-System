#!/usr/bin/env node
/**
 * Seeds production Firestore with sample data
 * Run: node scripts/seed-production.cjs
 * 
 * IMPORTANT: Make sure you're logged in with: firebase login
 */

const admin = require('firebase-admin');

// Initialize with production project
const projectId = 'edusync-sis';
admin.initializeApp({
  projectId: projectId,
});

console.log('[Seed Production] 🚀 Initializing with project:', projectId);

const db = admin.firestore();

// Sample learning areas (DepEd K-12)
const learningAreas = [
  { id: 'la_filipino', name: 'Filipino', order: 1 },
  { id: 'la_english', name: 'English', order: 2 },
  { id: 'la_math', name: 'Mathematics', order: 3 },
  { id: 'la_science', name: 'Science', order: 4 },
  { id: 'la_ap', name: 'Araling Panlipunan', order: 5 },
  { id: 'la_esp', name: 'Edukasyon sa Pagpapakatao', order: 6 },
  { id: 'la_tle', name: 'Technology and Livelihood Education', order: 7 },
  { id: 'la_mapeh', name: 'MAPEH', order: 8, components: ['Music', 'Arts', 'PE', 'Health'] }
];

// Sample sections
const sections = [
  { id: 'sec_grade7_a', name: 'Grade 7 - Section A', gradeLevel: 7, adviserId: null },
  { id: 'sec_grade7_b', name: 'Grade 7 - Section B', gradeLevel: 7, adviserId: null },
  { id: 'sec_grade8_a', name: 'Grade 8 - Section A', gradeLevel: 8, adviserId: null }
];

// Sample students (20 students across 3 sections)
function generateStudents() {
  const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia', 'Luis', 'Carmen', 'Ramon', 'Isabella', 'Diego', 'Lucia', 'Fernando', 'Catalina', 'Antonio', 'Valentina'];
  const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Rodriguez', 'Martinez', 'Gonzales', 'Lopez', 'Hernandez', 'Perez'];
  
  const students = [];
  const sectionIds = sections.map(s => s.id);
  
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / 2) % lastNames.length];
    const sectionId = sectionIds[i % sectionIds.length];
    const gradeLevel = sectionId.includes('grade7') ? 7 : 8;
    
    students.push({
      id: `s_${String(i + 1).padStart(3, '0')}`,
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      lrn: `1000${String(i + 1).padStart(8, '0')}`,
      sex: i % 2 === 0 ? 'Male' : 'Female',
      dateOfBirth: `200${Math.floor(i / 10) + 6}-0${(i % 9) + 1}-15`,
      sectionId: sectionId,
      gradeLevel: gradeLevel,
      enrollmentDate: '2024-08-15',
      status: 'active',
      guardianName: `Parent of ${firstName}`,
      guardianRelationship: i % 2 === 0 ? 'Father' : 'Mother',
      guardianContactNumber: `0912345${String(i).padStart(4, '0')}`
    });
  }
  
  return students;
}

// Generate sample grades for each student and learning area
function generateGrades(students, learningAreas) {
  const grades = [];
  
  for (const student of students) {
    for (const la of learningAreas) {
      // Skip MAPEH for now (it needs component grades)
      if (la.id === 'la_mapeh') {
        continue;
      }
      
      // Generate random grades between 75-95
      const q1 = Math.floor(Math.random() * 21) + 75; // 75-95
      const q2 = Math.floor(Math.random() * 21) + 75;
      const q3 = Math.floor(Math.random() * 21) + 75;
      const q4 = Math.floor(Math.random() * 21) + 75;
      
      const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);
      
      grades.push({
        id: `grade_${student.id}_${la.id}`,
        studentId: student.id,
        learningAreaId: la.id,
        q1: q1,
        q2: q2,
        q3: q3,
        q4: q4,
        finalGrade: finalGrade,
        remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
      });
    }
  }
  
  return grades;
}

async function seed() {
  try {
    console.log('[Seed] 📝 Generating sample data...');
    
    const students = generateStudents();
    const grades = generateGrades(students, learningAreas);
    
    console.log('[Seed] Generated:');
    console.log(`  - ${learningAreas.length} learning areas`);
    console.log(`  - ${sections.length} sections`);
    console.log(`  - ${students.length} students`);
    console.log(`  - ${grades.length} grades`);
    
    // Write to Firestore in batches
    console.log('\n[Seed] 📤 Writing to Firestore...');
    
    // Learning Areas
    console.log('[Seed] Writing learning areas...');
    for (const la of learningAreas) {
      await db.collection('learningAreas').doc(la.id).set(la);
    }
    console.log('[Seed] ✅ Learning areas written');
    
    // Sections
    console.log('[Seed] Writing sections...');
    for (const section of sections) {
      await db.collection('sections').doc(section.id).set(section);
    }
    console.log('[Seed] ✅ Sections written');
    
    // Students
    console.log('[Seed] Writing students...');
    for (const student of students) {
      await db.collection('students').doc(student.id).set(student);
    }
    console.log('[Seed] ✅ Students written');
    
    // Grades (in batches of 500)
    console.log('[Seed] Writing grades...');
    const batchSize = 500;
    for (let i = 0; i < grades.length; i += batchSize) {
      const batch = db.batch();
      const chunk = grades.slice(i, i + batchSize);
      
      for (const grade of chunk) {
        const ref = db.collection('grades').doc(grade.id);
        batch.set(ref, grade);
      }
      
      await batch.commit();
      console.log(`[Seed] ✅ Wrote grades ${i + 1} to ${Math.min(i + batchSize, grades.length)}`);
    }
    
    console.log('\n[Seed] 🎉 Seeding complete!');
    console.log('[Seed] Summary:');
    console.log(`  ✅ ${learningAreas.length} learning areas`);
    console.log(`  ✅ ${sections.length} sections`);
    console.log(`  ✅ ${students.length} students`);
    console.log(`  ✅ ${grades.length} grades`);
    
  } catch (error) {
    console.error('[Seed] ❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('[Seed] Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Seed] Fatal error:', error);
    process.exit(1);
  });
