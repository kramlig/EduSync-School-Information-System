#!/usr/bin/env node
/**
 * Seed Complete Grade Data for Staging Environment
 * 
 * This script generates comprehensive academic grades for ALL students
 * in their appropriate grade-level subjects.
 * 
 * Process:
 * 1. Fetch all students from staging Firestore
 * 2. Fetch all learning areas (subjects)
 * 3. Fetch all sections to determine student grade levels
 * 4. Match students to appropriate subjects based on grade level
 * 5. Generate realistic quarterly grades (Q1-Q4)
 * 6. Calculate final grades and remarks
 * 7. Batch commit to Firestore
 * 
 * Expected output: ~15,000 grade records for 253 students
 * 
 * Usage:
 *   node scripts/seed-staging-complete-grades.cjs
 */

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const projectId = args.projectId || 'edusync-staging';
const SCHOOL_ID = args.schoolId || 'default';

// K-12 Grade Level to Learning Area Mapping
const GRADE_LEVEL_SUBJECTS = {
  // Elementary (Grades 1-6)
  1: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_mapeh', 'la_esp'],
  2: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_mapeh', 'la_esp'],
  3: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_mapeh', 'la_esp'],
  4: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_mapeh', 'la_esp'],
  5: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_mapeh', 'la_esp'],
  6: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_mapeh', 'la_esp'],
  
  // Junior High School (Grades 7-10)
  7: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_esp', 'la_tle', 'la_music', 'la_arts', 'la_pe', 'la_health'],
  8: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_esp', 'la_tle', 'la_music', 'la_arts', 'la_pe', 'la_health'],
  9: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_esp', 'la_tle', 'la_music', 'la_arts', 'la_pe', 'la_health'],
  10: ['la_filipino', 'la_english', 'la_math', 'la_science', 'la_ap', 'la_esp', 'la_tle', 'la_music', 'la_arts', 'la_pe', 'la_health'],
  
  // Senior High School (Grades 11-12) - Core Subjects
  11: [
    'la_oral_comm', 'la_komunikasyon', 'la_gen_math', 'la_earth_science', 
    'la_personal_dev', 'la_physical_ed_11', 'la_esp', 'la_world_religions',
    'la_reading_writing', 'la_stat_prob', 'la_physical_science', 'la_disaster_ready'
  ],
  12: [
    'la_applied_econ', 'la_pagbasa_pagsusuri', 'la_earth_life_sci', 
    'la_physical_ed_12', 'la_esp', 'la_intro_philo', 'la_philippine_politics',
    'la_contemporary_issues', 'la_inquiries', 'la_entrepreneurship'
  ],
};

// Generate random grade between 75-100 (realistic passing grades)
function generateGrade() {
  const rand = Math.random();
  if (rand < 0.15) return Math.floor(Math.random() * 10) + 90; // 15% excellent (90-100)
  if (rand < 0.50) return Math.floor(Math.random() * 8) + 82;  // 35% good (82-89)
  if (rand < 0.85) return Math.floor(Math.random() * 7) + 75;  // 35% passing (75-81)
  return Math.floor(Math.random() * 5) + 70; // 15% struggling (70-74, some below passing)
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function run() {
  console.log('\n📚 SEEDING COMPLETE GRADE DATA FOR STAGING');
  console.log('═'.repeat(80));
  
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  
  // Ensure NOT using emulator
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();
  
  console.log(`\n1️⃣  FETCHING EXISTING DATA`);
  console.log('─'.repeat(80));
  
  // Fetch students
  const studentsSnapshot = await db.collection('students').where('schoolId', '==', SCHOOL_ID).get();
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`   ✅ Students: ${students.length}`);
  
  if (students.length === 0) {
    console.log('   ❌ No students found! Cannot seed grades.');
    process.exit(1);
  }
  
  // Fetch sections to determine grade levels
  const sectionsSnapshot = await db.collection('sections').where('schoolId', '==', SCHOOL_ID).get();
  const sectionsMap = new Map();
  sectionsSnapshot.docs.forEach(doc => {
    sectionsMap.set(doc.id, doc.data());
  });
  console.log(`   ✅ Sections: ${sectionsSnapshot.size}`);
  
  // Fetch learning areas
  const learningAreasSnapshot = await db.collection('learningAreas').get();
  const learningAreasMap = new Map();
  learningAreasSnapshot.docs.forEach(doc => {
    learningAreasMap.set(doc.id, doc.data());
  });
  console.log(`   ✅ Learning Areas: ${learningAreasSnapshot.size}`);
  
  // Check existing grades to avoid duplicates
  const existingGradesSnapshot = await db.collection('grades').where('schoolId', '==', SCHOOL_ID).get();
  const existingGradesSet = new Set();
  existingGradesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    existingGradesSet.add(`${data.studentId}_${data.learningAreaId}`);
  });
  console.log(`   ℹ️  Existing Grades: ${existingGradesSnapshot.size}`);
  
  console.log(`\n2️⃣  GENERATING GRADE RECORDS`);
  console.log('─'.repeat(80));
  
  const gradesToCreate = [];
  let skipped = 0;
  
  for (const student of students) {
    // Get student's grade level from section
    const section = student.sectionId ? sectionsMap.get(student.sectionId) : null;
    
    if (!section || !section.gradeLevel) {
      console.log(`   ⚠️  Skipping ${student.name} - no section/grade level`);
      skipped++;
      continue;
    }
    
    const gradeLevel = section.gradeLevel;
    const subjectIds = GRADE_LEVEL_SUBJECTS[gradeLevel];
    
    if (!subjectIds) {
      console.log(`   ⚠️  Skipping ${student.name} - no subjects for grade ${gradeLevel}`);
      skipped++;
      continue;
    }
    
    // Generate grades for each subject
    for (const learningAreaId of subjectIds) {
      // Skip if already exists
      const gradeKey = `${student.id}_${learningAreaId}`;
      if (existingGradesSet.has(gradeKey)) {
        continue;
      }
      
      // Check if learning area exists
      if (!learningAreasMap.has(learningAreaId)) {
        continue; // Skip non-existent subjects
      }
      
      const q1 = generateGrade();
      const q2 = generateGrade();
      const q3 = generateGrade();
      const q4 = generateGrade();
      const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);
      const remarks = finalGrade >= 75 ? 'Passed' : 'Failed';
      
      gradesToCreate.push({
        id: `grade_${student.id}_${learningAreaId}`,
        studentId: student.id,
        learningAreaId: learningAreaId,
        schoolId: SCHOOL_ID,
        q1,
        q2,
        q3,
        q4,
        finalGrade,
        remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  console.log(`   📊 Grades to create: ${gradesToCreate.length}`);
  console.log(`   ⏭️  Grades skipped (already exist): ${(students.length * 7) - gradesToCreate.length - skipped}`);
  console.log(`   ⚠️  Students skipped (no section): ${skipped}`);
  
  if (gradesToCreate.length === 0) {
    console.log('\n   ✅ All grades already exist! Nothing to do.');
    process.exit(0);
  }
  
  console.log(`\n3️⃣  COMMITTING GRADES TO FIRESTORE`);
  console.log('─'.repeat(80));
  
  const batches = chunk(gradesToCreate, 500); // Firestore batch limit
  let totalCommitted = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = db.batch();
    const batchGrades = batches[i];
    
    batchGrades.forEach(grade => {
      const docRef = db.collection('grades').doc(grade.id);
      batch.set(docRef, grade);
    });
    
    await batch.commit();
    totalCommitted += batchGrades.length;
    
    const percent = Math.round((totalCommitted / gradesToCreate.length) * 100);
    console.log(`   ✅ Batch ${i + 1}/${batches.length}: ${batchGrades.length} grades committed (${totalCommitted}/${gradesToCreate.length} - ${percent}%)`);
  }
  
  console.log(`\n4️⃣  VERIFICATION`);
  console.log('─'.repeat(80));
  
  const finalGradesSnapshot = await db.collection('grades').where('schoolId', '==', SCHOOL_ID).get();
  console.log(`   📊 Total grades in database: ${finalGradesSnapshot.size}`);
  
  // Sample some grades to verify
  console.log(`\n   Sample grades created:`);
  gradesToCreate.slice(0, 3).forEach(g => {
    const la = learningAreasMap.get(g.learningAreaId);
    console.log(`     - Student: ${g.studentId}, Subject: ${la?.name || g.learningAreaId}`);
    console.log(`       Q1: ${g.q1}, Q2: ${g.q2}, Q3: ${g.q3}, Q4: ${g.q4}`);
    console.log(`       Final: ${g.finalGrade}, Remarks: ${g.remarks}`);
  });
  
  console.log('\n═'.repeat(80));
  console.log('✅ GRADE SEEDING COMPLETE!');
  console.log('═'.repeat(80));
  console.log(`\n📈 Summary:`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Grades created: ${totalCommitted}`);
  console.log(`   - Total grades now: ${finalGradesSnapshot.size}`);
  console.log(`\n🎉 Your staging grading system should now work properly!\n`);
}

run().catch(e => {
  console.error('\n❌ SEEDING FAILED:', e && e.stack ? e.stack : e);
  process.exit(1);
});
