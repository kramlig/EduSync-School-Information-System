/**
 * Production E2E Phase 6B: Seed Core Values
 * 
 * Creates Core Values and Core Value Grades for all demo students
 * 
 * Requirements:
 * - phase5 must be completed (students created)
 * - Creates 4 Core Values (DepEd standard)
 * - Creates Core Value Grades for all 51 students × 4 quarters
 * 
 * Expected Output:
 * - 4 Core Values documents
 * - ~204 Core Value Grade documents (51 students × 4 core values)
 */

const admin = require('firebase-admin');

const SCHOOL_ID = 'demo-e2e-testing';

// DepEd Core Values (Standard K-12)
const DEFAULT_CORE_VALUES = [
  { 
    id: 'cv_makadiyos', 
    name: 'MAKADIYOS', 
    schoolId: SCHOOL_ID, 
    behaviors: [
      "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others",
      'Shows adherence to ethical principles by upholding truth',
    ]
  },
  { 
    id: 'cv_makatao', 
    name: 'MAKATAO', 
    schoolId: SCHOOL_ID, 
    behaviors: [
      'Is sensitive to individual, social, and cultural differences',
      'Demonstrates contributions toward solidarity',
    ]
  },
  { 
    id: 'cv_makakalikasan', 
    name: 'MAKAKALIKASAN', 
    schoolId: SCHOOL_ID, 
    behaviors: [
      'Cares for the environment and utilizes resources wisely, judiciously, and economically',
    ]
  },
  { 
    id: 'cv_makabansa', 
    name: 'MAKABANSA', 
    schoolId: SCHOOL_ID, 
    behaviors: [
      'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen',
      'Demonstrates appropriate behavior in carrying out activities in the school, community, and country',
    ]
  },
];

// Core Value Markings: AO (Always Observed), SO (Sometimes Observed), RO (Rarely Observed), NO (Not Observed)
const MARKINGS = ['AO', 'SO', 'RO', 'NO'];

/**
 * Pick a random marking with realistic distribution
 * - 45% Always Observed (AO)
 * - 35% Sometimes Observed (SO)
 * - 15% Rarely Observed (RO)
 * - 5% Not Observed (NO)
 */
function pickRealisticMarking() {
  const random = Math.random();
  if (random < 0.45) return 'AO';
  if (random < 0.80) return 'SO';
  if (random < 0.95) return 'RO';
  return 'NO';
}

async function run() {
  try {
    console.log('='.repeat(80));
    console.log('PRODUCTION E2E - PHASE 6B: SEED CORE VALUES');
    console.log('='.repeat(80));
    console.log('Target School:', SCHOOL_ID);
    console.log('Firebase Project:', process.env.GCLOUD_PROJECT || 'NOT SET');
    console.log('');

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    const db = admin.firestore();

    // =====================================================================
    // STEP 1: Create Core Values
    // =====================================================================
    console.log('[1/3] Creating Core Values...');
    
    const coreValuesBatch = db.batch();
    for (const cv of DEFAULT_CORE_VALUES) {
      const ref = db.collection('coreValues').doc(cv.id);
      coreValuesBatch.set(ref, cv);
    }
    await coreValuesBatch.commit();
    
    console.log(`✅ Created ${DEFAULT_CORE_VALUES.length} Core Values`);
    console.log('   - MAKADIYOS (2 behaviors)');
    console.log('   - MAKATAO (2 behaviors)');
    console.log('   - MAKAKALIKASAN (1 behavior)');
    console.log('   - MAKABANSA (2 behaviors)');
    console.log('');

    // =====================================================================
    // STEP 2: Get all demo students
    // =====================================================================
    console.log('[2/3] Fetching demo students...');
    
    const studentsSnap = await db.collection('students')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    
    const students = studentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${students.length} students`);
    console.log('');

    // =====================================================================
    // STEP 3: Create Core Value Grades
    // =====================================================================
    console.log('[3/3] Creating Core Value Grades...');
    
    const coreValueGrades = [];
    
    for (const student of students) {
      for (const cv of DEFAULT_CORE_VALUES) {
        const gradeRecord = {
          id: `cvg_${student.id}_${cv.id}`,
          studentId: student.id,
          coreValueId: cv.id,
          schoolId: SCHOOL_ID,
          q1: {},
          q2: {},
          q3: {},
          q4: {},
        };
        
        // Assign random markings for each behavior in each quarter
        for (const behavior of cv.behaviors) {
          gradeRecord.q1[behavior] = pickRealisticMarking();
          gradeRecord.q2[behavior] = pickRealisticMarking();
          gradeRecord.q3[behavior] = pickRealisticMarking();
          gradeRecord.q4[behavior] = pickRealisticMarking();
        }
        
        coreValueGrades.push(gradeRecord);
      }
    }
    
    // Write in batches of 400 (Firestore limit is 500)
    const BATCH_SIZE = 400;
    let writtenCount = 0;
    
    for (let i = 0; i < coreValueGrades.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = coreValueGrades.slice(i, i + BATCH_SIZE);
      
      for (const grade of chunk) {
        const ref = db.collection('coreValueGrades').doc(grade.id);
        batch.set(ref, grade);
      }
      
      await batch.commit();
      writtenCount += chunk.length;
      console.log(`   Written ${writtenCount}/${coreValueGrades.length} Core Value Grades...`);
    }
    
    console.log(`✅ Created ${coreValueGrades.length} Core Value Grade documents`);
    console.log('');

    // =====================================================================
    // VERIFICATION
    // =====================================================================
    console.log('='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));
    
    // Verify Core Values
    const coreValuesVerify = await db.collection('coreValues')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    console.log(`✅ Core Values: ${coreValuesVerify.size}/4`);
    
    // Verify Core Value Grades
    const coreValueGradesVerify = await db.collection('coreValueGrades')
      .where('schoolId', '==', SCHOOL_ID)
      .get();
    console.log(`✅ Core Value Grades: ${coreValueGradesVerify.size}/${students.length * 4}`);
    
    // Sample data inspection
    console.log('');
    console.log('Sample Core Value Grade:');
    if (coreValueGradesVerify.size > 0) {
      const sample = coreValueGradesVerify.docs[0].data();
      console.log(JSON.stringify(sample, null, 2));
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('PHASE 6B COMPLETE!');
    console.log('='.repeat(80));
    console.log(`✅ ${DEFAULT_CORE_VALUES.length} Core Values created`);
    console.log(`✅ ${coreValueGrades.length} Core Value Grade documents created`);
    console.log(`✅ All ${students.length} students have Core Values for Q1-Q4`);
    console.log('');
    console.log('Next: Run Playwright tests that include Core Values scenarios');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in Phase 6B:', error);
    process.exit(1);
  }
}

run();
