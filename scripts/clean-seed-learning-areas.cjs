#!/usr/bin/env node
/**
 * CLEAN SEED - Complete K-12 Learning Areas to Production
 * 
 * This script will:
 * 1. DELETE all existing learning areas
 * 2. SEED complete K-12 curriculum (42 subjects)
 * 
 * Prerequisites:
 * - Run: firebase login
 * - Ensure you're authenticated
 * 
 * Run: node scripts/clean-seed-learning-areas.cjs
 */

const admin = require('firebase-admin');

// Initialize with PRODUCTION project
const projectId = 'edusync-sis';
admin.initializeApp({
  projectId: projectId,
});

console.log('🚀 Connected to PRODUCTION:', projectId);
console.log('⚠️  This will DELETE all learning areas and reseed!\n');

const db = admin.firestore();

// ============================================
// COMPLETE K-12 CURRICULUM (42 SUBJECTS)
// ============================================

const COMPLETE_LEARNING_AREAS = [
  // ====== ELEMENTARY (9 subjects) ======
  {
    id: 'la_mother_tongue',
    name: 'Mother Tongue',
    credits: 3,
    category: 'core',
    gradeLevel: [1, 2, 3],
    department: 'Language',
    kToTwelveCode: 'MTB-MLE',
    isActive: true,
    order: 0,
    description: 'Mother Tongue-Based Multilingual Education (MTB-MLE)'
  },
  {
    id: 'la_filipino_elem',
    name: 'Filipino',
    credits: 3,
    category: 'core',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Language',
    kToTwelveCode: 'FIL-ELEM',
    isActive: true,
    order: 1,
    description: 'Filipino for Elementary'
  },
  {
    id: 'la_english_elem',
    name: 'English',
    credits: 3,
    category: 'core',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Language',
    kToTwelveCode: 'ENG-ELEM',
    isActive: true,
    order: 2,
    description: 'English for Elementary'
  },
  {
    id: 'la_math_elem',
    name: 'Mathematics',
    credits: 3,
    category: 'core',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'STEM',
    kToTwelveCode: 'MATH-ELEM',
    isActive: true,
    order: 3,
    description: 'Mathematics for Elementary'
  },
  {
    id: 'la_science_elem',
    name: 'Science',
    credits: 3,
    category: 'core',
    gradeLevel: [3, 4, 5, 6],
    department: 'STEM',
    kToTwelveCode: 'SCI-ELEM',
    isActive: true,
    order: 4,
    description: 'Science for Elementary (Grades 3-6)'
  },
  {
    id: 'la_ap_elem',
    name: 'Araling Panlipunan',
    credits: 3,
    category: 'core',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Humanities',
    kToTwelveCode: 'AP-ELEM',
    isActive: true,
    order: 5,
    description: 'Araling Panlipunan for Elementary'
  },
  {
    id: 'la_esp_elem',
    name: 'Edukasyon sa Pagpapakatao',
    credits: 2,
    category: 'core',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Values Education',
    kToTwelveCode: 'ESP-ELEM',
    isActive: true,
    order: 6,
    description: 'Values Education for Elementary'
  },
  {
    id: 'la_mapeh_elem',
    name: 'MAPEH',
    credits: 4,
    isComposite: true,
    subSubjects: ['Music', 'Arts', 'PE', 'Health'],
    category: 'specialized',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Arts & Sports',
    kToTwelveCode: 'MAPEH-ELEM',
    isActive: true,
    order: 7,
    description: 'Music, Arts, Physical Education, Health for Elementary'
  },
  {
    id: 'la_epp_elem',
    name: 'EPP/TLE',
    credits: 2,
    category: 'specialized',
    gradeLevel: [4, 5, 6],
    department: 'Technical Education',
    kToTwelveCode: 'EPP-ELEM',
    isActive: true,
    order: 8,
    description: 'Edukasyong Pantahanan at Pangkabuhayan for Elementary'
  },
  
  // ====== JUNIOR HIGH SCHOOL (8 subjects) ======
  {
    id: 'la_filipino_jhs',
    name: 'Filipino',
    credits: 5,
    category: 'core',
    gradeLevel: [7, 8, 9, 10],
    department: 'Language',
    kToTwelveCode: 'FIL-JHS',
    isActive: true,
    order: 1,
    description: 'Filipino for Junior High School'
  },
  {
    id: 'la_english_jhs',
    name: 'English',
    credits: 5,
    category: 'core',
    gradeLevel: [7, 8, 9, 10],
    department: 'Language',
    kToTwelveCode: 'ENG-JHS',
    isActive: true,
    order: 2,
    description: 'English for Junior High School'
  },
  {
    id: 'la_math_jhs',
    name: 'Mathematics',
    credits: 5,
    category: 'core',
    gradeLevel: [7, 8, 9, 10],
    department: 'STEM',
    kToTwelveCode: 'MATH-JHS',
    isActive: true,
    order: 3,
    description: 'Mathematics for Junior High School'
  },
  {
    id: 'la_science_jhs',
    name: 'Science',
    credits: 5,
    category: 'core',
    gradeLevel: [7, 8, 9, 10],
    department: 'STEM',
    kToTwelveCode: 'SCI-JHS',
    isActive: true,
    order: 4,
    description: 'Science for Junior High School'
  },
  {
    id: 'la_ap_jhs',
    name: 'Araling Panlipunan',
    credits: 5,
    category: 'core',
    gradeLevel: [7, 8, 9, 10],
    department: 'Humanities',
    kToTwelveCode: 'AP-JHS',
    isActive: true,
    order: 5,
    description: 'Araling Panlipunan for Junior High School'
  },
  {
    id: 'la_esp_jhs',
    name: 'Edukasyon sa Pagpapakatao',
    credits: 5,
    category: 'core',
    gradeLevel: [7, 8, 9, 10],
    department: 'Values Education',
    kToTwelveCode: 'ESP-JHS',
    isActive: true,
    order: 6,
    description: 'Values Education for Junior High School'
  },
  {
    id: 'la_mapeh_jhs',
    name: 'MAPEH',
    credits: 5,
    isComposite: true,
    subSubjects: ['Music', 'Arts', 'PE', 'Health'],
    category: 'specialized',
    gradeLevel: [7, 8, 9, 10],
    department: 'Arts & Sports',
    kToTwelveCode: 'MAPEH-JHS',
    isActive: true,
    order: 7,
    description: 'Music, Arts, Physical Education, Health for Junior High School'
  },
  {
    id: 'la_tle_jhs',
    name: 'Technology and Livelihood Education',
    credits: 5,
    category: 'specialized',
    gradeLevel: [7, 8, 9, 10],
    department: 'Technical Education',
    kToTwelveCode: 'TLE-JHS',
    isActive: true,
    order: 8,
    description: 'TLE for Junior High School'
  },
  
  // ====== SENIOR HIGH - CORE (6 subjects) ======
  {
    id: 'la_oral_comm',
    name: 'Oral Communication',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'Language',
    kToTwelveCode: 'ORALCOM',
    semesterBased: true,
    semester: 1,
    isActive: true,
    order: 1
  },
  {
    id: 'la_reading_writing',
    name: 'Reading and Writing',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'Language',
    kToTwelveCode: 'READWRIT',
    semesterBased: true,
    semester: 2,
    isActive: true,
    order: 2
  },
  {
    id: 'la_kom_pananaliksik',
    name: 'Komunikasyon at Pananaliksik',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'Language',
    kToTwelveCode: 'KOMPAN',
    semesterBased: true,
    semester: 1,
    isActive: true,
    order: 3
  },
  {
    id: 'la_pagbasa_pagsusuri',
    name: 'Pagbasa at Pagsusuri',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'Language',
    kToTwelveCode: 'PAGPAG',
    semesterBased: true,
    semester: 2,
    isActive: true,
    order: 4
  },
  {
    id: 'la_gen_math',
    name: 'General Mathematics',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'STEM',
    kToTwelveCode: 'GENMATH',
    semesterBased: true,
    semester: 1,
    isActive: true,
    order: 5
  },
  {
    id: 'la_stats_prob',
    name: 'Statistics and Probability',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'STEM',
    kToTwelveCode: 'STATPROB',
    semesterBased: true,
    semester: 2,
    isActive: true,
    order: 6
  },
  {
    id: 'la_earth_science',
    name: 'Earth and Life Science',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'STEM',
    kToTwelveCode: 'EARTHSCI',
    semesterBased: true,
    semester: 1,
    isActive: true,
    order: 7
  },
  {
    id: 'la_physical_science',
    name: 'Physical Science',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'STEM',
    kToTwelveCode: 'PHYSCI',
    semesterBased: true,
    semester: 2,
    isActive: true,
    order: 8
  },
  {
    id: 'la_personal_dev',
    name: 'Personal Development',
    credits: 3,
    category: 'core',
    gradeLevel: [11],
    department: 'Guidance',
    kToTwelveCode: 'PERSDEV',
    semesterBased: true,
    isActive: true,
    order: 9
  },
  {
    id: 'la_pe_health',
    name: 'Physical Education and Health',
    credits: 2,
    category: 'core',
    gradeLevel: [11, 12],
    department: 'Arts & Sports',
    kToTwelveCode: 'PEHEALTH',
    semesterBased: true,
    isActive: true,
    order: 10
  },
  
  // ====== SENIOR HIGH - STEM TRACK (5 subjects) ======
  {
    id: 'la_precalc_stem',
    name: 'Pre-Calculus',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11],
    department: 'STEM',
    kToTwelveCode: 'PRECALC',
    trackRequired: ['STEM'],
    semesterBased: true,
    isActive: true,
    order: 1
  },
  {
    id: 'la_basic_calc_stem',
    name: 'Basic Calculus',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11, 12],
    department: 'STEM',
    kToTwelveCode: 'BASICCALC',
    trackRequired: ['STEM'],
    semesterBased: true,
    isActive: true,
    order: 2
  },
  {
    id: 'la_gen_bio_stem',
    name: 'General Biology 1',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11, 12],
    department: 'STEM',
    kToTwelveCode: 'GENBIO',
    trackRequired: ['STEM'],
    semesterBased: true,
    isActive: true,
    order: 3
  },
  {
    id: 'la_gen_chem_stem',
    name: 'General Chemistry 1',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11, 12],
    department: 'STEM',
    kToTwelveCode: 'GENCHEM',
    trackRequired: ['STEM'],
    semesterBased: true,
    isActive: true,
    order: 4
  },
  {
    id: 'la_gen_physics_stem',
    name: 'General Physics 1',
    credits: 3,
    category: 'specialized',
    gradeLevel: [12],
    department: 'STEM',
    kToTwelveCode: 'GENPHYS',
    trackRequired: ['STEM'],
    semesterBased: true,
    isActive: true,
    order: 5
  },
  
  // ====== SENIOR HIGH - ABM TRACK (5 subjects) ======
  {
    id: 'la_fund_abm',
    name: 'Fundamentals of Accountancy',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11, 12],
    department: 'Business',
    kToTwelveCode: 'FUNDABM',
    trackRequired: ['ABM'],
    semesterBased: true,
    isActive: true,
    order: 1
  },
  {
    id: 'la_bus_math_abm',
    name: 'Business Mathematics',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11],
    department: 'Business',
    kToTwelveCode: 'BUSMATH',
    trackRequired: ['ABM'],
    semesterBased: true,
    isActive: true,
    order: 2
  },
  {
    id: 'la_bus_finance_abm',
    name: 'Business Finance',
    credits: 3,
    category: 'specialized',
    gradeLevel: [12],
    department: 'Business',
    kToTwelveCode: 'BUSFIN',
    trackRequired: ['ABM'],
    semesterBased: true,
    isActive: true,
    order: 3
  },
  {
    id: 'la_org_mgmt_abm',
    name: 'Organization and Management',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11],
    department: 'Business',
    kToTwelveCode: 'ORGMGMT',
    trackRequired: ['ABM'],
    semesterBased: true,
    isActive: true,
    order: 4
  },
  {
    id: 'la_prin_marketing_abm',
    name: 'Principles of Marketing',
    credits: 3,
    category: 'specialized',
    gradeLevel: [12],
    department: 'Business',
    kToTwelveCode: 'PRINMKT',
    trackRequired: ['ABM'],
    semesterBased: true,
    isActive: true,
    order: 5
  },
  
  // ====== SENIOR HIGH - HUMSS TRACK (5 subjects) ======
  {
    id: 'la_creative_writing_humss',
    name: 'Creative Writing',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11],
    department: 'Humanities',
    kToTwelveCode: 'CREWRIT',
    trackRequired: ['HUMSS'],
    semesterBased: true,
    isActive: true,
    order: 1
  },
  {
    id: 'la_creative_nonfic_humss',
    name: 'Contemporary Philippine Arts',
    credits: 3,
    category: 'specialized',
    gradeLevel: [12],
    department: 'Humanities',
    kToTwelveCode: 'CPART',
    trackRequired: ['HUMSS'],
    semesterBased: true,
    isActive: true,
    order: 2
  },
  {
    id: 'la_world_religions_humss',
    name: 'World Religions and Belief Systems',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11],
    department: 'Humanities',
    kToTwelveCode: 'WORLDREL',
    trackRequired: ['HUMSS'],
    semesterBased: true,
    isActive: true,
    order: 3
  },
  {
    id: 'la_phil_politics_humss',
    name: 'Philippine Politics and Governance',
    credits: 3,
    category: 'specialized',
    gradeLevel: [11],
    department: 'Humanities',
    kToTwelveCode: 'PHILPOL',
    trackRequired: ['HUMSS'],
    semesterBased: true,
    isActive: true,
    order: 4
  },
  {
    id: 'la_intro_phil_humss',
    name: 'Introduction to Philosophy',
    credits: 3,
    category: 'specialized',
    gradeLevel: [12],
    department: 'Humanities',
    kToTwelveCode: 'INTROPHIL',
    trackRequired: ['HUMSS'],
    semesterBased: true,
    isActive: true,
    order: 5
  },
  
  // ====== SENIOR HIGH - GAS TRACK (3 subjects) ======
  {
    id: 'la_humanities_gas',
    name: 'Humanities 1',
    credits: 3,
    category: 'elective',
    gradeLevel: [11],
    department: 'Humanities',
    kToTwelveCode: 'HUM1',
    trackRequired: ['GAS'],
    semesterBased: true,
    isActive: true,
    order: 1
  },
  {
    id: 'la_social_science_gas',
    name: 'Social Science 1',
    credits: 3,
    category: 'elective',
    gradeLevel: [11],
    department: 'Humanities',
    kToTwelveCode: 'SOCSCI1',
    trackRequired: ['GAS'],
    semesterBased: true,
    isActive: true,
    order: 2
  },
  {
    id: 'la_applied_subjects_gas',
    name: 'Applied Subjects',
    credits: 3,
    category: 'elective',
    gradeLevel: [11, 12],
    department: 'Applied',
    kToTwelveCode: 'APPSUB',
    trackRequired: ['GAS'],
    semesterBased: true,
    isActive: true,
    order: 3
  }
];

// ============================================
// MAIN FUNCTION
// ============================================

async function cleanAndSeed() {
  try {
    console.log('📊 Total subjects to seed:', COMPLETE_LEARNING_AREAS.length);
    console.log('   - Elementary: 9');
    console.log('   - Junior High: 8');
    console.log('   - Senior High Core: 10');
    console.log('   - STEM Track: 5');
    console.log('   - ABM Track: 5');
    console.log('   - HUMSS Track: 5');
    console.log('   - GAS Track: 3');
    console.log('');
    
    // STEP 1: Delete all existing learning areas
    console.log('🗑️  STEP 1: Deleting all existing learning areas...');
    const snapshot = await db.collection('learningAreas').get();
    console.log(`   Found ${snapshot.size} existing documents`);
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('   ✅ Deleted all existing learning areas\n');
    
    // STEP 2: Seed complete K-12 curriculum
    console.log('📚 STEP 2: Seeding complete K-12 curriculum...');
    
    let count = 0;
    for (const area of COMPLETE_LEARNING_AREAS) {
      const docData = {
        ...area,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('learningAreas').doc(area.id).set(docData);
      count++;
      
      if (count % 10 === 0) {
        console.log(`   Progress: ${count}/${COMPLETE_LEARNING_AREAS.length}`);
      }
    }
    
    console.log(`   ✅ Seeded ${count} learning areas\n`);
    
    // STEP 3: Verify
    console.log('✅ STEP 3: Verifying...');
    const verifySnap = await db.collection('learningAreas').get();
    console.log(`   Total in database: ${verifySnap.size}`);
    
    console.log('\n🎉 COMPLETE! Learning areas successfully reseeded.');
    console.log('🔄 Refresh your Learning Areas page to see all subjects.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run it
cleanAndSeed();
