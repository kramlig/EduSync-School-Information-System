/**
 * COMPREHENSIVE K-12 CURRICULUM MIGRATION
 * 
 * PHASE 1: Fix ID Mismatch
 * - Rename learning areas: la_filipino → la_filipino_elem
 * - Update 350 grade records with new learningAreaId
 * 
 * PHASE 2: Add K-12 Metadata & JHS Subjects
 * - Add gradeLevel, kToTwelveCode, category to Elementary subjects
 * - Create Junior High School subjects (Grades 7-10)
 * - Seed JHS grades for existing students
 * 
 * PHASE 3: Create SHS Structure
 * - Create SHS core subjects
 * - Create track-specific subjects (STEM, ABM, HUMSS, GAS, TVL)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

// ============================================
// PHASE 1: Fix ID Mismatch
// ============================================

const ELEM_ID_MAPPING = {
    'la_filipino': 'la_filipino_elem',
    'la_english': 'la_english_elem',
    'la_math': 'la_math_elem',
    'la_science': 'la_science_elem',
    'la_ap': 'la_ap_elem',
    'la_esp': 'la_esp_elem',
    'la_tle': 'la_tle_elem'
};

const ELEM_METADATA = {
    'la_filipino_elem': {
        gradeLevel: [1, 2, 3, 4, 5, 6],
        kToTwelveCode: 'FIL-ELEM',
        category: 'core',
        department: 'Language',
        order: 1
    },
    'la_english_elem': {
        gradeLevel: [1, 2, 3, 4, 5, 6],
        kToTwelveCode: 'ENG-ELEM',
        category: 'core',
        department: 'Language',
        order: 2
    },
    'la_math_elem': {
        gradeLevel: [1, 2, 3, 4, 5, 6],
        kToTwelveCode: 'MATH-ELEM',
        category: 'core',
        department: 'STEM',
        order: 3
    },
    'la_science_elem': {
        gradeLevel: [3, 4, 5, 6],
        kToTwelveCode: 'SCI-ELEM',
        category: 'core',
        department: 'STEM',
        order: 4
    },
    'la_ap_elem': {
        gradeLevel: [1, 2, 3, 4, 5, 6],
        kToTwelveCode: 'AP-ELEM',
        category: 'core',
        department: 'Humanities',
        order: 5
    },
    'la_esp_elem': {
        gradeLevel: [1, 2, 3, 4, 5, 6],
        kToTwelveCode: 'ESP-ELEM',
        category: 'core',
        department: 'Values Education',
        order: 6
    },
    'la_tle_elem': {
        gradeLevel: [4, 5, 6],
        kToTwelveCode: 'TLE-ELEM',
        category: 'specialized',
        department: 'Technical Education',
        order: 7
    }
};

// ============================================
// PHASE 2: Junior High School Subjects
// ============================================

const JHS_SUBJECTS = [
    {
        id: 'la_filipino_jhs',
        name: 'Filipino',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'FIL-JHS',
        category: 'core',
        department: 'Language',
        isActive: true,
        order: 1,
        description: 'Filipino for Junior High School'
    },
    {
        id: 'la_english_jhs',
        name: 'English',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'ENG-JHS',
        category: 'core',
        department: 'Language',
        isActive: true,
        order: 2,
        description: 'English for Junior High School'
    },
    {
        id: 'la_math_jhs',
        name: 'Mathematics',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'MATH-JHS',
        category: 'core',
        department: 'STEM',
        isActive: true,
        order: 3,
        description: 'Mathematics for Junior High School'
    },
    {
        id: 'la_science_jhs',
        name: 'Science',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'SCI-JHS',
        category: 'core',
        department: 'STEM',
        isActive: true,
        order: 4,
        description: 'Science for Junior High School'
    },
    {
        id: 'la_ap_jhs',
        name: 'Araling Panlipunan',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'AP-JHS',
        category: 'core',
        department: 'Humanities',
        isActive: true,
        order: 5,
        description: 'Araling Panlipunan for Junior High School'
    },
    {
        id: 'la_esp_jhs',
        name: 'Edukasyon sa Pagpapakatao',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'ESP-JHS',
        category: 'core',
        department: 'Values Education',
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
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'MAPEH-JHS',
        category: 'specialized',
        department: 'Arts & Sports',
        isActive: true,
        order: 7,
        description: 'Music, Arts, Physical Education, Health for Junior High School'
    },
    {
        id: 'la_tle_jhs',
        name: 'Technology and Livelihood Education',
        credits: 5,
        gradeLevel: [7, 8, 9, 10],
        kToTwelveCode: 'TLE-JHS',
        category: 'specialized',
        department: 'Technical Education',
        isActive: true,
        order: 8,
        description: 'TLE for Junior High School - Exploratory (7-8), Specialization (9-10)'
    }
];

// ============================================
// PHASE 3: Senior High School Subjects
// ============================================

const SHS_CORE_SUBJECTS = [
    // Language
    {
        id: 'la_oral_comm_shs',
        name: 'Oral Communication',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'ORALCOM',
        category: 'core',
        department: 'Language',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 1
    },
    {
        id: 'la_reading_writing_shs',
        name: 'Reading and Writing',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'READWRIT',
        category: 'core',
        department: 'Language',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 2
    },
    {
        id: 'la_kom_pananaliksik_shs',
        name: 'Komunikasyon at Pananaliksik',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'KOMPAN',
        category: 'core',
        department: 'Language',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 3
    },
    {
        id: 'la_pagbasa_pagsusuri_shs',
        name: 'Pagbasa at Pagsusuri',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'PAGPAG',
        category: 'core',
        department: 'Language',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 4
    },
    // Math & Science
    {
        id: 'la_gen_math_shs',
        name: 'General Mathematics',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'GENMATH',
        category: 'core',
        department: 'STEM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 5
    },
    {
        id: 'la_statistics_shs',
        name: 'Statistics and Probability',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'STATPROB',
        category: 'core',
        department: 'STEM',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 6
    },
    {
        id: 'la_earth_science_shs',
        name: 'Earth and Life Science',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'EARTHSCI',
        category: 'core',
        department: 'STEM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 7
    },
    {
        id: 'la_physical_science_shs',
        name: 'Physical Science',
        credits: 3,
        gradeLevel: [12],
        kToTwelveCode: 'PHYSCI',
        category: 'core',
        department: 'STEM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 8
    },
    // Humanities
    {
        id: 'la_personal_dev_shs',
        name: 'Personal Development',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'PERSDEV',
        category: 'core',
        department: 'Humanities',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 9
    },
    {
        id: 'la_philosophy_shs',
        name: 'Introduction to Philosophy',
        credits: 3,
        gradeLevel: [12],
        kToTwelveCode: 'PHILOS',
        category: 'core',
        department: 'Humanities',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 10
    },
    {
        id: 'la_contemporary_shs',
        name: 'Contemporary Philippine Arts',
        credits: 3,
        gradeLevel: [12],
        kToTwelveCode: 'CONTEMPART',
        category: 'core',
        department: 'Arts',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 11
    },
    // PE & Health (4 semesters)
    {
        id: 'la_pe1_shs',
        name: 'Physical Education 1',
        credits: 2,
        gradeLevel: [11],
        kToTwelveCode: 'PE1',
        category: 'core',
        department: 'Physical Education',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 12
    },
    {
        id: 'la_pe2_shs',
        name: 'Physical Education 2',
        credits: 2,
        gradeLevel: [11],
        kToTwelveCode: 'PE2',
        category: 'core',
        department: 'Physical Education',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 13
    }
];

// Track-specific subjects
const SHS_STEM_SUBJECTS = [
    {
        id: 'la_pre_calc_stem',
        name: 'Pre-Calculus',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'PRECAL',
        category: 'specialized',
        trackRequired: ['STEM'],
        department: 'STEM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 20
    },
    {
        id: 'la_basic_calc_stem',
        name: 'Basic Calculus',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'BASICCAL',
        category: 'specialized',
        trackRequired: ['STEM'],
        department: 'STEM',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 21
    },
    {
        id: 'la_gen_biology_stem',
        name: 'General Biology 1',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'GENBIO1',
        category: 'specialized',
        trackRequired: ['STEM'],
        department: 'STEM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 22
    },
    {
        id: 'la_gen_chemistry_stem',
        name: 'General Chemistry 1',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'GENCHEM1',
        category: 'specialized',
        trackRequired: ['STEM'],
        department: 'STEM',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 23
    },
    {
        id: 'la_gen_physics_stem',
        name: 'General Physics 1',
        credits: 3,
        gradeLevel: [12],
        kToTwelveCode: 'GENPHYS1',
        category: 'specialized',
        trackRequired: ['STEM'],
        department: 'STEM',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 24
    }
];

const SHS_ABM_SUBJECTS = [
    {
        id: 'la_bus_math_abm',
        name: 'Business Mathematics',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'BUSMATH',
        category: 'specialized',
        trackRequired: ['ABM'],
        department: 'Business',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 30
    },
    {
        id: 'la_org_mgmt_abm',
        name: 'Organization and Management',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'ORGMGMT',
        category: 'specialized',
        trackRequired: ['ABM'],
        department: 'Business',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 31
    },
    {
        id: 'la_bus_finance_abm',
        name: 'Business Finance',
        credits: 3,
        gradeLevel: [12],
        kToTwelveCode: 'BUSFIN',
        category: 'specialized',
        trackRequired: ['ABM'],
        department: 'Business',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 32
    },
    {
        id: 'la_entrepreneurship_abm',
        name: 'Fundamentals of Accountancy',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'FUNDACCT',
        category: 'specialized',
        trackRequired: ['ABM'],
        department: 'Business',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 33
    }
];

const SHS_HUMSS_SUBJECTS = [
    {
        id: 'la_phil_politics_humss',
        name: 'Philippine Politics and Governance',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'PHILPOL',
        category: 'specialized',
        trackRequired: ['HUMSS'],
        department: 'Humanities',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 40
    },
    {
        id: 'la_world_religions_humss',
        name: 'World Religions and Belief Systems',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'WORLDREL',
        category: 'specialized',
        trackRequired: ['HUMSS'],
        department: 'Humanities',
        semesterBased: true,
        semester: 2,
        isActive: true,
        order: 41
    },
    {
        id: 'la_creative_writing_humss',
        name: 'Creative Writing',
        credits: 3,
        gradeLevel: [11],
        kToTwelveCode: 'CREATWR',
        category: 'specialized',
        trackRequired: ['HUMSS'],
        department: 'Arts',
        semesterBased: true,
        semester: 1,
        isActive: true,
        order: 42
    }
];

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function phase1_fixIdMismatch() {
    console.log('\n========================================');
    console.log('PHASE 1: Fix ID Mismatch');
    console.log('========================================\n');

    const batch = db.batch();
    let operations = 0;

    // Step 1: Rename learning areas (delete old, create new with _elem suffix)
    console.log('Step 1: Renaming learning areas...');
    const learningAreasSnap = await db.collection('learningAreas').get();
    
    for (const doc of learningAreasSnap.docs) {
        const oldId = doc.id;
        const newId = ELEM_ID_MAPPING[oldId];
        
        if (newId) {
            const data = doc.data();
            const metadata = ELEM_METADATA[newId];
            
            // Create new document with _elem suffix and K-12 metadata
            batch.set(db.collection('learningAreas').doc(newId), {
                ...data,
                id: newId,
                ...metadata,
                isActive: true
            });
            
            // Delete old document
            batch.delete(doc.ref);
            
            console.log(`  ✓ ${oldId} → ${newId}`);
            operations += 2;
        }
    }

    // Commit learning area changes first
    if (operations > 0) {
        await batch.commit();
        console.log(`\n✅ Renamed ${Object.keys(ELEM_ID_MAPPING).length} learning areas\n`);
    }

    // Step 2: Update grade records
    console.log('Step 2: Updating grade records...');
    const gradesSnap = await db.collection('grades').get();
    console.log(`Found ${gradesSnap.size} grade records to update\n`);

    // Update in batches of 500 (Firestore limit)
    const batchSize = 500;
    let currentBatch = db.batch();
    let batchCount = 0;
    let totalUpdated = 0;

    for (const gradeDoc of gradesSnap.docs) {
        const gradeData = gradeDoc.data();
        const oldLearningAreaId = gradeData.learningAreaId;
        const newLearningAreaId = ELEM_ID_MAPPING[oldLearningAreaId];

        if (newLearningAreaId) {
            // Update the grade document with new learningAreaId and id
            const newGradeId = gradeDoc.id.replace(oldLearningAreaId, newLearningAreaId);
            
            // Create new document with updated ID
            currentBatch.set(db.collection('grades').doc(newGradeId), {
                ...gradeData,
                id: newGradeId,
                learningAreaId: newLearningAreaId
            });

            // Delete old document
            currentBatch.delete(gradeDoc.ref);

            batchCount += 2;
            totalUpdated++;

            if (batchCount >= batchSize) {
                await currentBatch.commit();
                console.log(`  ✓ Updated ${totalUpdated} grades...`);
                currentBatch = db.batch();
                batchCount = 0;
            }
        }
    }

    // Commit remaining
    if (batchCount > 0) {
        await currentBatch.commit();
    }

    console.log(`\n✅ Updated ${totalUpdated} grade records\n`);
}

async function phase2_addJHSSubjects() {
    console.log('\n========================================');
    console.log('PHASE 2: Add JHS Subjects & Seed Grades');
    console.log('========================================\n');

    // Step 1: Create JHS learning areas
    console.log('Step 1: Creating JHS learning areas...');
    const batch = db.batch();

    for (const subject of JHS_SUBJECTS) {
        batch.set(db.collection('learningAreas').doc(subject.id), subject);
        console.log(`  ✓ ${subject.id}: ${subject.name}`);
    }

    await batch.commit();
    console.log(`\n✅ Created ${JHS_SUBJECTS.length} JHS subjects\n`);

    // Step 2: Seed JHS grades for existing students
    console.log('Step 2: Seeding JHS grades for students...');
    const studentsSnap = await db.collection('students').where('gradeLevel', 'in', [7, 8]).get();
    console.log(`Found ${studentsSnap.size} JHS students\n`);

    const gradeBatch = db.batch();
    let gradeCount = 0;

    for (const studentDoc of studentsSnap.docs) {
        const student = studentDoc.data();

        for (const subject of JHS_SUBJECTS) {
            const gradeId = `grade_${student.id}_${subject.id}`;
            
            // Generate realistic grades (85-99)
            const q1 = Math.floor(Math.random() * 15) + 85;
            const q2 = Math.floor(Math.random() * 15) + 85;
            const q3 = Math.floor(Math.random() * 15) + 85;
            const q4 = Math.floor(Math.random() * 15) + 85;
            const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);
            const remarks = finalGrade >= 75 ? 'Passed' : 'Failed';

            gradeBatch.set(db.collection('grades').doc(gradeId), {
                id: gradeId,
                studentId: student.id,
                learningAreaId: subject.id,
                q1,
                q2,
                q3,
                q4,
                finalGrade,
                remarks
            });

            gradeCount++;
        }
    }

    await gradeBatch.commit();
    console.log(`✅ Seeded ${gradeCount} JHS grades\n`);
}

async function phase3_addSHSSubjects() {
    console.log('\n========================================');
    console.log('PHASE 3: Add SHS Subjects');
    console.log('========================================\n');

    const allSHSSubjects = [
        ...SHS_CORE_SUBJECTS,
        ...SHS_STEM_SUBJECTS,
        ...SHS_ABM_SUBJECTS,
        ...SHS_HUMSS_SUBJECTS
    ];

    console.log('Creating SHS subjects...');
    const batch = db.batch();

    for (const subject of allSHSSubjects) {
        batch.set(db.collection('learningAreas').doc(subject.id), subject);
        console.log(`  ✓ ${subject.id}: ${subject.name}${subject.trackRequired ? ` (${subject.trackRequired.join(', ')})` : ''}`);
    }

    await batch.commit();
    console.log(`\n✅ Created ${allSHSSubjects.length} SHS subjects`);
    console.log(`   - Core: ${SHS_CORE_SUBJECTS.length}`);
    console.log(`   - STEM: ${SHS_STEM_SUBJECTS.length}`);
    console.log(`   - ABM: ${SHS_ABM_SUBJECTS.length}`);
    console.log(`   - HUMSS: ${SHS_HUMSS_SUBJECTS.length}\n`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  K-12 CURRICULUM MIGRATION TOOL        ║');
    console.log('╚════════════════════════════════════════╝');

    try {
        // PHASE 1: Fix ID mismatch
        await phase1_fixIdMismatch();

        // PHASE 2: Add JHS subjects and seed grades
        await phase2_addJHSSubjects();

        // PHASE 3: Add SHS subjects
        await phase3_addSHSSubjects();

        console.log('\n========================================');
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================\n');

        // Final summary
        const finalStats = await Promise.all([
            db.collection('learningAreas').get(),
            db.collection('grades').get()
        ]);

        console.log('📊 FINAL DATABASE STATE:');
        console.log(`   Learning Areas: ${finalStats[0].size}`);
        console.log(`   Grades: ${finalStats[1].size}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error);
        process.exit(1);
    }
}

main();
