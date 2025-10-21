#!/usr/bin/env node
/**
 * Seed Academic Grades for All Students
 * 
 * Usage:
 *   Production: node scripts/seed-academic-grades.cjs
 *   Emulator: node scripts/seed-academic-grades.cjs --useEmulator=true
 */

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const useEmulator = String(args.useEmulator || '').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
    initializeApp({ projectId });
    console.log(`[Seed Academic Grades] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    initializeApp({ projectId });
    console.log('[Seed Academic Grades] Using production Firestore');
  }

  const db = getFirestore();
  
  console.log('\n📚 Seeding Academic Grades for All Students...\n');

  // Fetch all students
  const studentsSnapshot = await db.collection('students').get();
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (students.length === 0) {
    console.log('⚠️  No students found. Please seed students first.');
    return;
  }

  console.log(`📊 Found ${students.length} students`);

  // Fetch all learning areas
  const learningAreasSnapshot = await db.collection('learningAreas').get();
  const learningAreas = learningAreasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (learningAreas.length === 0) {
    console.log('⚠️  No learning areas found. Please seed learning areas first.');
    return;
  }

  console.log(`📚 Found ${learningAreas.length} learning areas`);

  console.log(`📚 Found ${learningAreas.length} learning areas`);

  // Helper function to generate realistic grades (70-100)
  const generateGrade = () => {
    const rand = Math.random();
    if (rand < 0.15) return Math.floor(Math.random() * 6) + 95; // 15% excellent (95-100)
    if (rand < 0.45) return Math.floor(Math.random() * 5) + 90; // 30% very good (90-94)
    if (rand < 0.75) return Math.floor(Math.random() * 5) + 85; // 30% good (85-89)
    if (rand < 0.92) return Math.floor(Math.random() * 5) + 80; // 17% satisfactory (80-84)
    return Math.floor(Math.random() * 5) + 75; // 8% passing (75-79)
  };

  const batch = db.batch();
  let gradeCount = 0;
  let batchCount = 0;

  for (const student of students) {
    for (const learningArea of learningAreas) {
      const gradeId = `grade_${student.id}_${learningArea.id}`;
      
      // Generate grades for all 4 quarters
      const q1 = generateGrade();
      const q2 = generateGrade();
      const q3 = generateGrade();
      const q4 = generateGrade();
      const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);

      const gradeData = {
        id: gradeId,
        studentId: student.id,
        learningAreaId: learningArea.id,
        q1: q1,
        q2: q2,
        q3: q3,
        q4: q4,
        finalGrade: finalGrade,
        remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
      };

      batch.set(db.collection('grades').doc(gradeId), gradeData); // No merge - complete replacement
      gradeCount++;

      // Commit in batches of 500 to avoid Firestore limits
      if (gradeCount % 500 === 0) {
        await batch.commit();
        batchCount++;
        console.log(`   ✓ Committed batch ${batchCount} (${gradeCount} grades so far...)`);
      }
    }
  }

  // Commit remaining grades
  if (gradeCount % 500 !== 0) {
    await batch.commit();
    batchCount++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Academic Grades Seeded Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Summary:`);
  console.log(`   Students: ${students.length}`);
  console.log(`   Learning Areas: ${learningAreas.length}`);
  console.log(`   Total Grades: ${gradeCount}`);
  console.log(`   Batches: ${batchCount}`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Environment: ${useEmulator ? 'Emulator' : 'Production'}`);
  console.log('\n🎯 Grade Distribution:');
  console.log('   95-100: 15% (Excellent)');
  console.log('   90-94:  30% (Very Good)');
  console.log('   85-89:  30% (Good)');
  console.log('   80-84:  17% (Satisfactory)');
  console.log('   75-79:  8%  (Passing)');
  console.log('');
}

run().catch(err => {
  console.error('❌ Error seeding academic grades:', err);
  process.exit(1);
});
