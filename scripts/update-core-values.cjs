#!/usr/bin/env node
/**
 * Update Core Values collection with official DepEd behavior statements
 * 
 * Usage:
 *   Production: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/update-core-values.cjs
 *   Emulator: node scripts/update-core-values.cjs --useEmulator=true
 */

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k,v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v || true; else acc[k] = v || true;
  return acc;
}, {});

const useEmulator = String(args.useEmulator || '').toLowerCase() === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const projectId = args.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'edusync-sis';

// Official DepEd Core Values with exact behavior statements
const defaultCoreValues = [
  {
    name: 'MAKADIYOS',
    description: 'Demonstrates belief in the supreme being and acceptance of moral and spiritual values in daily living',
    behaviors: [
      'Expresses one\'s spiritual beliefs while respecting the spiritual beliefs of others',
      'Shows adherence to ethical principles by upholding truth'
    ]
  },
  {
    name: 'MAKATAO',
    description: 'Demonstrates understanding of and concern for the welfare and dignity of all people',
    behaviors: [
      'Is sensitive to individual, social, and cultural differences',
      'Demonstrates contributions toward solidarity'
    ]
  },
  {
    name: 'MAKAKALIKASAN',
    description: 'Cares for the environment and demonstrates care for the earth and its resources',
    behaviors: [
      'Cares for the environment and utilizes resources wisely, judiciously, and economically'
    ]
  },
  {
    name: 'MAKABANSA',
    description: 'Demonstrates pride in being a Filipino and concern for the country',
    behaviors: [
      'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
      'Demonstrates appropriate behavior in carrying out activities in the school, community, and country'
    ]
  }
];

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
    initializeApp({ projectId });
    console.log(`[Update Core Values] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    initializeApp({ projectId });
    console.log('[Update Core Values] Using production Firestore');
  }

  const db = getFirestore();
  
  console.log('\n📚 Updating Core Values with official DepEd behavior statements...\n');

  // Get existing core values to preserve IDs if they exist
  const existingCoreValuesSnapshot = await db.collection('coreValues').get();
  const existingCoreValuesMap = new Map();
  existingCoreValuesSnapshot.docs.forEach(doc => {
    existingCoreValuesMap.set(doc.data().name, doc.id);
  });

  const batch = db.batch();
  const updates = [];

  for (const cv of defaultCoreValues) {
    // Use existing ID if available, otherwise create new one
    const docId = existingCoreValuesMap.get(cv.name) || `cv_${cv.name.toLowerCase()}_${Date.now()}`;
    const docRef = db.collection('coreValues').doc(docId);
    
    batch.set(docRef, {
      name: cv.name,
      description: cv.description,
      behaviors: cv.behaviors,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    updates.push({
      id: docId,
      name: cv.name,
      behaviorCount: cv.behaviors.length
    });

    console.log(`✅ ${cv.name}`);
    console.log(`   Description: ${cv.description}`);
    console.log(`   Behaviors (${cv.behaviors.length}):`);
    cv.behaviors.forEach((b, idx) => {
      console.log(`     ${idx + 1}. ${b}`);
    });
    console.log('');
  }

  await batch.commit();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Core Values Updated Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Summary:`);
  console.log(`   Total Core Values: ${updates.length}`);
  console.log(`   Total Behaviors: ${updates.reduce((sum, u) => sum + u.behaviorCount, 0)}`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Environment: ${useEmulator ? 'Emulator' : 'Production'}`);
  console.log('');

  // Optionally seed sample core value grades for existing students
  if (args.seedGrades === 'true') {
    console.log('\n📝 Seeding sample core value grades for students...\n');
    
    const studentsSnapshot = await db.collection('students').limit(100).get();
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (students.length === 0) {
      console.log('⚠️  No students found. Skipping grade seeding.');
    } else {
      const MARKS = ['AO', 'SO', 'RO', 'NO'];
      const pickMark = () => {
        const r = Math.random();
        if (r < 0.45) return 'AO';
        if (r < 0.8) return 'SO';
        if (r < 0.95) return 'RO';
        return 'NO';
      };

      const gradeBatch = db.batch();
      let gradeCount = 0;

      for (const student of students) {
        for (const cv of defaultCoreValues) {
          const gradeId = `cvg_${student.id}_${cv.name.toLowerCase()}`;
          const gradeData = {
            id: gradeId,
            studentId: student.id,
            coreValueId: updates.find(u => u.name === cv.name)?.id || `cv_${cv.name.toLowerCase()}`,
            q1: {},
            q2: {},
            q3: {},
            q4: {}
          };

          // Assign random marks for each behavior in each quarter
          for (const behavior of cv.behaviors) {
            gradeData.q1[behavior] = pickMark();
            gradeData.q2[behavior] = pickMark();
            gradeData.q3[behavior] = pickMark();
            gradeData.q4[behavior] = pickMark();
          }

          gradeBatch.set(db.collection('coreValueGrades').doc(gradeId), gradeData, { merge: true });
          gradeCount++;

          // Commit in batches of 400
          if (gradeCount % 400 === 0) {
            await gradeBatch.commit();
          }
        }
      }

      // Commit remaining grades
      if (gradeCount % 400 !== 0) {
        await gradeBatch.commit();
      }

      console.log(`✅ Seeded ${gradeCount} core value grade records for ${students.length} students`);
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('   1. The Core Values Gradebook will now display official DepEd behaviors');
  console.log('   2. Existing student grades will be preserved');
  console.log('   3. Teachers can now grade using the new spreadsheet layout');
  if (args.seedGrades !== 'true') {
    console.log('\n💡 Tip: Run with --seedGrades=true to seed sample grade data for existing students\n');
  } else {
    console.log('');
  }
}

run().catch(err => {
  console.error('❌ Error updating core values:', err);
  process.exit(1);
});
