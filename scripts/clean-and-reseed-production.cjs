#!/usr/bin/env node
/**
 * Cleans production Firestore and reseeds with consistent sample data
 * Run: node scripts/clean-and-reseed-production.cjs
 * 
 * IMPORTANT: Make sure you're logged in with: firebase login
 */

const admin = require('firebase-admin');

// Initialize with production project
const projectId = 'edusync-sis';
admin.initializeApp({
  projectId: projectId,
});

console.log('[Clean & Reseed] 🚀 Initializing with project:', projectId);

const db = admin.firestore();

// Collections to clean
const COLLECTIONS_TO_CLEAN = [
  'students',
  'grades',
  'sections',
  'learningAreas',
  'teachers',
  'parents',
  'coreValues',
  'coreValueGrades',
  'attendanceRecords',
  'assignments',
  'studentAssignmentGrades',
  'lessonPlans',
  'announcements',
  'classSchedules',
  'substituteAssignments'
];

async function deleteCollection(collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[Clean] ✅ Deleted ${snapshot.size} documents`);

    // Recurse on the next batch
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

// Sample learning areas (DepEd K-12)
const learningAreas = [
  { id: 'la_filipino', name: 'Filipino', order: 1 },
  { id: 'la_english', name: 'English', order: 2 },
  { id: 'la_math', name: 'Mathematics', order: 3 },
  { id: 'la_science', name: 'Science', order: 4 },
  { id: 'la_ap', name: 'Araling Panlipunan', order: 5 },
  { id: 'la_esp', name: 'Edukasyon sa Pagpapakatao', order: 6 },
  { id: 'la_tle', name: 'Technology and Livelihood Education', order: 7 }
];

// Core values (DepEd)
const coreValues = [
  { id: 'cv_maka_diyos', name: 'Maka-Diyos', order: 1 },
  { id: 'cv_maka_tao', name: 'Maka-tao', order: 2 },
  { id: 'cv_maka_kalikasan', name: 'Maka-kalikasan', order: 3 },
  { id: 'cv_maka_bansa', name: 'Makabansa', order: 4 }
];

// Sample teachers
function generateTeachers() {
  return [
    { 
      id: 'teacher_001', 
      name: 'Maria Santos',
      email: 'maria.santos@school.edu.ph',
      role: 'teacher',
      department: 'Mathematics',
      createdAt: new Date().toISOString()
    },
    { 
      id: 'teacher_002', 
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@school.edu.ph',
      role: 'teacher',
      department: 'Science',
      createdAt: new Date().toISOString()
    },
    { 
      id: 'teacher_003', 
      name: 'Rosa Garcia',
      email: 'rosa.garcia@school.edu.ph',
      role: 'teacher',
      department: 'English',
      createdAt: new Date().toISOString()
    }
  ];
}

// Sample sections
const sections = [
  { id: 'sec_grade7_a', name: 'Grade 7 - Section A', gradeLevel: 7, adviserId: 'teacher_001', schoolYear: '2024-2025' },
  { id: 'sec_grade7_b', name: 'Grade 7 - Section B', gradeLevel: 7, adviserId: 'teacher_002', schoolYear: '2024-2025' },
  { id: 'sec_grade8_a', name: 'Grade 8 - Section A', gradeLevel: 8, adviserId: 'teacher_003', schoolYear: '2024-2025' }
];

// School settings
const schoolSettings = {
  schoolName: 'Sample Philippine School',
  schoolAddress: 'Sample Address, Manila, Philippines',
  schoolYear: '2024-2025',
  currentQuarter: 'q1',
  passingGrade: 75
};

// Generate 50 students across the 3 sections
function generateStudents() {
  const firstNames = [
    'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Sofia',
    'Luis', 'Carmen', 'Ramon', 'Isabella', 'Diego', 'Lucia', 'Fernando', 'Catalina', 'Antonio', 'Valentina',
    'Ricardo', 'Gabriela', 'Manuel', 'Alejandra', 'Francisco', 'Camila', 'Javier', 'Daniela', 'Rafael', 'Andrea',
    'Jorge', 'Mariana', 'Alberto', 'Paula', 'Enrique', 'Laura', 'Sergio', 'Natalia', 'Oscar', 'Patricia',
    'Roberto', 'Monica', 'Andres', 'Victoria', 'Eduardo', 'Cristina', 'Gabriel', 'Sandra', 'Rodrigo', 'Angela'
  ];
  const lastNames = [
    'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Rodriguez', 'Martinez', 'Gonzales', 'Lopez', 
    'Hernandez', 'Perez', 'Rivera', 'Ramos', 'Torres', 'Flores', 'Morales', 'Jimenez',
    'Alvarez', 'Romero', 'Gutierrez', 'Castillo'
  ];
  
  const students = [];
  const sectionIds = sections.map(s => s.id);
  
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / 2.5) % lastNames.length];
    const sectionId = sectionIds[i % sectionIds.length];
    const gradeLevel = sectionId.includes('grade7') ? 7 : 8;
    
    students.push({
      id: `s_${String(i + 1).padStart(4, '0')}`,
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      lrn: `1000${String(i + 1).padStart(9, '0')}`,
      sex: i % 2 === 0 ? 'Male' : 'Female',
      dateOfBirth: `200${Math.floor(i / 10) + 6}-0${(i % 9) + 1}-15`,
      sectionId: sectionId,
      gradeLevel: gradeLevel,
      enrollmentDate: '2024-08-15',
      status: 'active',
      guardianName: `Parent of ${firstName}`,
      guardianRelationship: i % 2 === 0 ? 'Father' : 'Mother',
      guardianContactNumber: `0912345${String(i).padStart(4, '0')}`,
      address: 'Sample Address, Philippines',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@student.edu.ph`
    });
  }
  
  return students;
}

// Generate sample grades for each student and learning area
function generateGrades(students, learningAreas) {
  const grades = [];
  
  for (const student of students) {
    for (const la of learningAreas) {
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
        remarks: finalGrade >= 75 ? 'Passed' : 'Failed',
        schoolYear: '2024-2025'
      });
    }
  }
  
  return grades;
}

// Generate core value grades for each student
function generateCoreValueGrades(students, coreValues) {
  const ratings = ['Outstanding', 'Very Satisfactory', 'Satisfactory', 'Needs Improvement'];
  const coreValueGrades = [];
  
  for (const student of students) {
    for (const cv of coreValues) {
      ['q1', 'q2', 'q3', 'q4'].forEach(quarter => {
        coreValueGrades.push({
          id: `cvg_${student.id}_${cv.id}_${quarter}`,
          studentId: student.id,
          coreValueId: cv.id,
          quarter: quarter,
          rating: ratings[Math.floor(Math.random() * ratings.length)],
          schoolYear: '2024-2025'
        });
      });
    }
  }
  
  return coreValueGrades;
}

// Generate parents for students
function generateParents(students) {
  const parents = [];
  
  students.forEach((student, index) => {
    parents.push({
      id: `parent_${student.id}`,
      name: student.guardianName,
      email: `parent${index + 1}@email.com`,
      contactNumber: student.guardianContactNumber,
      relationship: student.guardianRelationship,
      studentIds: [student.id],
      address: student.address || 'Sample Address, Philippines'
    });
  });
  
  return parents;
}

// Generate sample announcements
function generateAnnouncements() {
  return [
    {
      id: 'ann_001',
      title: 'Welcome to School Year 2024-2025',
      content: 'Welcome back students! We are excited to start this new school year.',
      date: '2024-08-15',
      author: 'Principal Office',
      priority: 'high'
    },
    {
      id: 'ann_002',
      title: 'First Quarter Exam Schedule',
      content: 'First quarter examinations will be held from October 15-20, 2024.',
      date: '2024-09-01',
      author: 'Registrar',
      priority: 'normal'
    }
  ];
}

async function cleanDatabase() {
  console.log('\n[Clean] 🧹 Starting database cleanup...\n');
  
  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    try {
      console.log(`[Clean] 🗑️  Deleting collection: ${collectionName}`);
      await deleteCollection(collectionName);
      console.log(`[Clean] ✅ Collection ${collectionName} deleted\n`);
    } catch (error) {
      console.error(`[Clean] ❌ Error deleting ${collectionName}:`, error.message);
    }
  }
  
  console.log('[Clean] 🎉 Database cleanup complete!\n');
}

async function seedDatabase() {
  try {
    console.log('[Seed] 📝 Generating sample data...');
    
    const teachers = generateTeachers();
    const students = generateStudents();
    const grades = generateGrades(students, learningAreas);
    const coreValueGrades = generateCoreValueGrades(students, coreValues);
    const parents = generateParents(students);
    const announcements = generateAnnouncements();
    
    console.log('[Seed] Generated:');
    console.log(`  - ${learningAreas.length} learning areas`);
    console.log(`  - ${coreValues.length} core values`);
    console.log(`  - ${teachers.length} teachers`);
    console.log(`  - ${sections.length} sections`);
    console.log(`  - ${students.length} students`);
    console.log(`  - ${grades.length} grades`);
    console.log(`  - ${coreValueGrades.length} core value grades`);
    console.log(`  - ${parents.length} parents`);
    console.log(`  - ${announcements.length} announcements`);
    console.log(`  - 1 school settings`);
    
    // Write to Firestore in batches
    console.log('\n[Seed] 📤 Writing to Firestore...\n');
    
    // Learning Areas
    console.log('[Seed] Writing learning areas...');
    for (const la of learningAreas) {
      await db.collection('learningAreas').doc(la.id).set(la);
    }
    console.log('[Seed] ✅ Learning areas written\n');
    
    // Core Values
    console.log('[Seed] Writing core values...');
    for (const cv of coreValues) {
      await db.collection('coreValues').doc(cv.id).set(cv);
    }
    console.log('[Seed] ✅ Core values written\n');
    
    // Teachers
    console.log('[Seed] Writing teachers...');
    for (const teacher of teachers) {
      await db.collection('teachers').doc(teacher.id).set(teacher);
    }
    console.log('[Seed] ✅ Teachers written\n');
    
    // Sections
    console.log('[Seed] Writing sections...');
    for (const section of sections) {
      await db.collection('sections').doc(section.id).set(section);
    }
    console.log('[Seed] ✅ Sections written\n');
    
    // Students
    console.log('[Seed] Writing students...');
    for (const student of students) {
      await db.collection('students').doc(student.id).set(student);
    }
    console.log('[Seed] ✅ Students written\n');
    
    // Parents
    console.log('[Seed] Writing parents...');
    for (const parent of parents) {
      await db.collection('parents').doc(parent.id).set(parent);
    }
    console.log('[Seed] ✅ Parents written\n');
    
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
    console.log();
    
    // Core Value Grades (in batches of 500)
    console.log('[Seed] Writing core value grades...');
    for (let i = 0; i < coreValueGrades.length; i += batchSize) {
      const batch = db.batch();
      const chunk = coreValueGrades.slice(i, i + batchSize);
      
      for (const cvg of chunk) {
        const ref = db.collection('coreValueGrades').doc(cvg.id);
        batch.set(ref, cvg);
      }
      
      await batch.commit();
      console.log(`[Seed] ✅ Wrote core value grades ${i + 1} to ${Math.min(i + batchSize, coreValueGrades.length)}`);
    }
    console.log();
    
    // Announcements
    console.log('[Seed] Writing announcements...');
    for (const announcement of announcements) {
      await db.collection('announcements').doc(announcement.id).set(announcement);
    }
    console.log('[Seed] ✅ Announcements written\n');
    
    // Settings
    console.log('[Seed] Writing school settings...');
    await db.collection('settings').doc('default').set(schoolSettings);
    console.log('[Seed] ✅ School settings written\n');
    
    console.log('\n[Seed] 🎉 Seeding complete!');
    console.log('[Seed] Summary:');
    console.log(`  ✅ ${learningAreas.length} learning areas`);
    console.log(`  ✅ ${coreValues.length} core values`);
    console.log(`  ✅ ${teachers.length} teachers`);
    console.log(`  ✅ ${sections.length} sections`);
    console.log(`  ✅ ${students.length} students`);
    console.log(`  ✅ ${grades.length} grades`);
    console.log(`  ✅ ${coreValueGrades.length} core value grades`);
    console.log(`  ✅ ${parents.length} parents`);
    console.log(`  ✅ ${announcements.length} announcements`);
    console.log(`  ✅ 1 school settings`);
    
  } catch (error) {
    console.error('[Seed] ❌ Error during seeding:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  🚨 PRODUCTION DATABASE CLEANUP & RESEED 🚨           ║');
    console.log('║                                                        ║');
    console.log('║  This will DELETE ALL DATA and reseed with samples!   ║');
    console.log('║  Project: edusync-sis                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    // Clean database
    await cleanDatabase();
    
    // Seed database
    await seedDatabase();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ CLEANUP & RESEED COMPLETE!                        ║');
    console.log('║                                                        ║');
    console.log('║  You can now test the gradebook at:                   ║');
    console.log('║  https://edusync-sis.web.app                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('[Main] Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  });
