/**
 * SEED CORE VALUES FOR ALL K-12 STUDENTS
 * 
 * DepEd K-12 requires Core Values assessment for ALL grade levels (K-12).
 * This script seeds Core Values grades for all 390 students across:
 * - Elementary (Grades 1-6)
 * - Junior High (Grades 7-10)
 * - Senior High (Grades 11-12)
 * 
 * Core Values are assessed quarterly (Q1, Q2, Q3, Q4) with markings:
 * - AO (Always Observed)
 * - SO (Sometimes Observed)
 * - RO (Rarely Observed)
 * - NO (Not Observed)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

// Core Value Markings
const MARKINGS = ['AO', 'SO', 'RO', 'NO'];

// Weighted probability for realistic distribution
// Most students should get AO/SO, fewer get RO/NO
const getRandomMarking = () => {
    const rand = Math.random();
    if (rand < 0.45) return 'AO'; // 45% Always Observed
    if (rand < 0.85) return 'SO'; // 40% Sometimes Observed
    if (rand < 0.97) return 'RO'; // 12% Rarely Observed
    return 'NO'; // 3% Not Observed
};

// Default behaviors for each Core Value (if not in database)
const DEFAULT_BEHAVIORS = {
    'cv_maka_diyos': ['Expresses one\'s spiritual beliefs', 'Shows adherence to ethical principles'],
    'cv_maka_tao': ['Demonstrates respect for others', 'Exhibits sensitivity to individual needs'],
    'cv_makakalikasan': ['Cares for the environment', 'Practices conservation'],
    'cv_maka_bansa': ['Demonstrates pride in being a Filipino', 'Shows respect for national symbols'],
    'default': ['Behavior 1', 'Behavior 2', 'Behavior 3']
};

// Generate Core Value grades for a student
const generateCoreValueGrades = (studentId, coreValues) => {
    const grades = [];

    for (const coreValue of coreValues) {
        const gradeId = `cvg_${studentId}_${coreValue.id}`;

        // Get behaviors (from database or default)
        const behaviors = coreValue.behaviors || DEFAULT_BEHAVIORS[coreValue.id] || DEFAULT_BEHAVIORS.default;

        // Generate grades for each behavior across 4 quarters
        const q1 = {};
        const q2 = {};
        const q3 = {};
        const q4 = {};

        for (const behavior of behaviors) {
            // Simulate some progression/consistency across quarters
            const baseMarking = getRandomMarking();
            
            // Q1: Base marking
            q1[behavior] = baseMarking;
            
            // Q2-Q4: Slight variations (80% same, 20% change)
            q2[behavior] = Math.random() < 0.8 ? baseMarking : getRandomMarking();
            q3[behavior] = Math.random() < 0.8 ? baseMarking : getRandomMarking();
            q4[behavior] = Math.random() < 0.8 ? baseMarking : getRandomMarking();
        }

        grades.push({
            id: gradeId,
            studentId: studentId,
            coreValueId: coreValue.id,
            q1,
            q2,
            q3,
            q4
        });
    }

    return grades;
};

// Main seeding function
async function seedCoreValues() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  CORE VALUES K-12 SEEDING TOOL         ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
        // Step 1: Get all Core Values
        console.log('📚 Fetching Core Values...');
        const coreValuesSnap = await db.collection('coreValues').get();
        const coreValues = coreValuesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`   Found ${coreValues.length} Core Values\n`);

        if (coreValues.length === 0) {
            console.error('❌ No Core Values found! Please define Core Values first.');
            process.exit(1);
        }

        // Step 2: Get all students
        console.log('👥 Fetching students...');
        const studentsSnap = await db.collection('students').get();
        const students = studentsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`   Found ${students.length} students\n`);

        // Step 3: Check existing Core Value grades
        console.log('🔍 Checking existing Core Value grades...');
        const existingGradesSnap = await db.collection('coreValueGrades').get();
        const existingStudents = new Set();
        existingGradesSnap.docs.forEach(doc => {
            existingStudents.add(doc.data().studentId);
        });
        console.log(`   ${existingStudents.size} students already have grades`);
        console.log(`   ${students.length - existingStudents.size} students need grades\n`);

        // Step 4: Delete old grades (optional - for clean slate)
        if (existingGradesSnap.size > 0) {
            console.log('🗑️  Clearing existing Core Value grades...');
            const deleteBatches = [];
            let currentBatch = db.batch();
            let batchCount = 0;

            for (const doc of existingGradesSnap.docs) {
                currentBatch.delete(doc.ref);
                batchCount++;

                if (batchCount >= 500) {
                    deleteBatches.push(currentBatch);
                    currentBatch = db.batch();
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                deleteBatches.push(currentBatch);
            }

            for (const batch of deleteBatches) {
                await batch.commit();
            }
            console.log(`   Deleted ${existingGradesSnap.size} old grades\n`);
        }

        // Step 5: Generate new grades for all students
        console.log('🎓 Generating Core Value grades for all students...\n');
        
        const allGrades = [];
        let processedCount = 0;

        for (const student of students) {
            const studentGrades = generateCoreValueGrades(student.id, coreValues);
            allGrades.push(...studentGrades);
            processedCount++;

            if (processedCount % 50 === 0) {
                console.log(`   Processed ${processedCount}/${students.length} students...`);
            }
        }

        console.log(`   Generated ${allGrades.length} Core Value grade records\n`);

        // Step 6: Seed to Firestore
        console.log('💾 Seeding Core Value grades to Firestore...\n');

        const seedBatches = [];
        let currentBatch = db.batch();
        let batchCount = 0;
        let seededCount = 0;

        for (const grade of allGrades) {
            currentBatch.set(db.collection('coreValueGrades').doc(grade.id), grade);
            batchCount++;
            seededCount++;

            if (batchCount >= 500) {
                seedBatches.push(currentBatch);
                currentBatch = db.batch();
                batchCount = 0;
                console.log(`   Seeded ${seededCount}/${allGrades.length} grades...`);
            }
        }

        if (batchCount > 0) {
            seedBatches.push(currentBatch);
        }

        for (const batch of seedBatches) {
            await batch.commit();
        }

        // Step 7: Final summary
        console.log('\n========================================');
        console.log('✅ CORE VALUES SEEDING COMPLETED!');
        console.log('========================================\n');

        console.log('📊 SUMMARY:\n');
        console.log(`   Core Values:              ${coreValues.length}`);
        console.log(`   Students:                 ${students.length}`);
        console.log(`   Core Value Grades:        ${allGrades.length}`);
        console.log(`   Grades per Student:       ${coreValues.length}\n`);

        // Breakdown by grade level
        const elemStudents = students.filter(s => s.gradeLevel >= 1 && s.gradeLevel <= 6);
        const jhsStudents = students.filter(s => s.gradeLevel >= 7 && s.gradeLevel <= 10);
        const shsStudents = students.filter(s => s.gradeLevel >= 11 && s.gradeLevel <= 12);

        console.log('📚 COVERAGE BY LEVEL:\n');
        console.log(`   Elementary (1-6):         ${elemStudents.length} students × ${coreValues.length} = ${elemStudents.length * coreValues.length} grades`);
        console.log(`   Junior High (7-10):       ${jhsStudents.length} students × ${coreValues.length} = ${jhsStudents.length * coreValues.length} grades`);
        console.log(`   Senior High (11-12):      ${shsStudents.length} students × ${coreValues.length} = ${shsStudents.length * coreValues.length} grades\n`);

        console.log('✅ All K-12 students now have Core Values assessment!');
        console.log('🌐 View in Core Values Gradebook at: https://edusync-sis.web.app\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ SEEDING FAILED:', error);
        process.exit(1);
    }
}

seedCoreValues();
