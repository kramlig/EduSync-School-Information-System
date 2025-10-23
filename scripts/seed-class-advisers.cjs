#!/usr/bin/env node
/**
 * Seed missing class adviser teachers based on existing section adviserId references
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'edusync-sis';

// Ensure not using emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

initializeApp({ projectId });
const db = getFirestore();

const teacherNames = {
  // Elementary
  'teacher_elem_1': { name: 'Maria Santos', email: 'maria.santos@edusync.edu', role: 'teacher' },
  'teacher_elem_2': { name: 'Juan Dela Cruz', email: 'juan.delacruz@edusync.edu', role: 'teacher' },
  'teacher_elem_3': { name: 'Rosa Garcia', email: 'rosa.garcia@edusync.edu', role: 'teacher' },
  'teacher_elem_4': { name: 'Pedro Reyes', email: 'pedro.reyes@edusync.edu', role: 'teacher' },
  'teacher_elem_5': { name: 'Ana Lopez', email: 'ana.lopez@edusync.edu', role: 'teacher' },
  'teacher_elem_6': { name: 'Carlos Martinez', email: 'carlos.martinez@edusync.edu', role: 'teacher' },
  
  // Junior High School
  'teacher_jhs_7': { name: 'Isabel Torres', email: 'isabel.torres@edusync.edu', role: 'teacher' },
  'teacher_jhs_8': { name: 'Miguel Fernandez', email: 'miguel.fernandez@edusync.edu', role: 'teacher' },
  'teacher_jhs_9': { name: 'Carmen Gonzales', email: 'carmen.gonzales@edusync.edu', role: 'teacher' },
  'teacher_jhs_10': { name: 'Ricardo Aquino', email: 'ricardo.aquino@edusync.edu', role: 'teacher' },
  
  // Senior High School
  'teacher_shs_stem_11': { name: 'Dr. Elena Rodriguez', email: 'elena.rodriguez@edusync.edu', role: 'teacher' },
  'teacher_shs_stem_12': { name: 'Dr. Ramon Cruz', email: 'ramon.cruz@edusync.edu', role: 'teacher' },
  'teacher_shs_abm_11': { name: 'Prof. Patricia Castillo', email: 'patricia.castillo@edusync.edu', role: 'teacher' },
  'teacher_shs_abm_12': { name: 'Prof. Gabriel Ramos', email: 'gabriel.ramos@edusync.edu', role: 'teacher' },
  'teacher_shs_humss_11': { name: 'Prof. Sophia Mendoza', email: 'sophia.mendoza@edusync.edu', role: 'teacher' },
  'teacher_shs_humss_12': { name: 'Prof. Antonio Herrera', email: 'antonio.herrera@edusync.edu', role: 'teacher' },
  'teacher_shs_gas_11': { name: 'Prof. Jennifer Bautista', email: 'jennifer.bautista@edusync.edu', role: 'teacher' },
  'teacher_shs_gas_12': { name: 'Prof. Daniel Manalo', email: 'daniel.manalo@edusync.edu', role: 'teacher' },
};

async function seedTeachers() {
  console.log(`\n[Seed] Creating class adviser teachers...\n`);
  
  const batch = db.batch();
  let count = 0;
  
  for (const [teacherId, teacherData] of Object.entries(teacherNames)) {
    // Check if teacher already exists
    const existingTeacher = await db.collection('teachers').doc(teacherId).get();
    
    if (existingTeacher.exists) {
      console.log(`   ⏭️  Skipping ${teacherData.name} - already exists`);
      continue;
    }
    
    // Create teacher document
    const teacher = {
      id: teacherId,
      ...teacherData,
      assignments: [],
      createdAt: new Date().toISOString()
    };
    
    batch.set(db.collection('teachers').doc(teacherId), teacher);
    console.log(`   ✅ Creating: ${teacherData.name} (${teacherId})`);
    count++;
  }
  
  if (count > 0) {
    await batch.commit();
    console.log(`\n✅ Successfully created ${count} class adviser teachers!`);
  } else {
    console.log(`\n✅ All class advisers already exist!`);
  }
  
  // Verify section relationships now
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Verifying sections now have valid advisers...\n`);
  
  const sectionsSnap = await db.collection('sections').limit(5).get();
  for (const doc of sectionsSnap.docs) {
    const section = doc.data();
    if (section.adviserId) {
      const adviserSnap = await db.collection('teachers').doc(section.adviserId).get();
      if (adviserSnap.exists) {
        const adviser = adviserSnap.data();
        console.log(`   ✅ ${section.name} (Grade ${section.gradeLevel}) → ${adviser.name}`);
      } else {
        console.log(`   ❌ ${section.name} (Grade ${section.gradeLevel}) → Adviser not found: ${section.adviserId}`);
      }
    }
  }
}

seedTeachers()
  .then(() => {
    console.log(`\n✅ Seeding complete!\n`);
    process.exit(0);
  })
  .catch(e => {
    console.error('\n❌ Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  });
