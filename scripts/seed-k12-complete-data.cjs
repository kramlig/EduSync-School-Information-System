/**
 * COMPLETE K-12 DATA SEEDING SCRIPT
 * 
 * Creates a comprehensive dataset that matches the K-12 curriculum:
 * - Elementary students (Grades 1-6) with elementary subjects
 * - Junior High students (Grades 7-10) with JHS subjects
 * - Senior High students (Grades 11-12) with track-specific subjects
 * 
 * This will replace existing student and grade data with a complete K-12 dataset.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

// ============================================
// STUDENT GENERATION
// ============================================

const FILIPINO_FIRST_NAMES = {
    male: ['Juan', 'Miguel', 'Rafael', 'Gabriel', 'Jose', 'Luis', 'Carlos', 'Antonio', 'Marco', 'Paolo', 
           'Joshua', 'Nathan', 'Daniel', 'Samuel', 'David', 'Ethan', 'Jacob', 'Ryan', 'Kevin', 'Christian'],
    female: ['Maria', 'Ana', 'Sofia', 'Isabella', 'Gabriela', 'Valentina', 'Camila', 'Samantha', 'Nicole', 'Andrea',
             'Sarah', 'Angela', 'Jessica', 'Michelle', 'Patricia', 'Jennifer', 'Kristine', 'Ashley', 'Sophia', 'Emma']
};

const FILIPINO_LAST_NAMES = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Lopez', 'Gonzales',
    'Ramos', 'Flores', 'Rivera', 'Gomez', 'Fernandez', 'De Leon', 'Villanueva', 'Castillo', 'Del Rosario', 'Manalo',
    'Aquino', 'Diaz', 'Marquez', 'Salazar', 'Herrera', 'Santiago', 'Pascual', 'Morales', 'Valdez', 'Miranda'
];

const generateStudentName = (sex) => {
    const firstNames = sex === 'Male' ? FILIPINO_FIRST_NAMES.male : FILIPINO_FIRST_NAMES.female;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = FILIPINO_LAST_NAMES[Math.floor(Math.random() * FILIPINO_LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
};

const generateLRN = (index) => {
    // LRN format: 12-digit number
    const year = '20';
    const region = '03'; // Example region
    const sequence = String(index + 1).padStart(8, '0');
    return `${year}${region}${sequence}`;
};

// Generate students for all grade levels
const generateStudents = () => {
    const students = [];
    let studentIndex = 0;

    // Elementary (K-6): 6 sections, 25 students per grade level = 150 students
    for (let grade = 1; grade <= 6; grade++) {
        for (let i = 0; i < 25; i++) {
            const sex = Math.random() > 0.5 ? 'Male' : 'Female';
            const sectionLetter = i < 25 ? 'A' : 'B'; // All in section A for simplicity
            
            students.push({
                id: `s_elem_${String(studentIndex + 1).padStart(4, '0')}`,
                name: generateStudentName(sex),
                email: `student.elem${grade}.${i + 1}@edusync.edu`,
                enrollmentDate: '2025-06-01',
                dateOfBirth: `${2025 - grade - 6}-03-15`, // Age appropriate
                sex,
                lrn: generateLRN(studentIndex),
                gradeLevel: grade,
                sectionId: `sec_grade${grade}_a`,
                status: 'active'
            });
            studentIndex++;
        }
    }

    // Junior High (7-10): 4 grades, 30 students per grade = 120 students
    for (let grade = 7; grade <= 10; grade++) {
        for (let i = 0; i < 30; i++) {
            const sex = Math.random() > 0.5 ? 'Male' : 'Female';
            const sectionLetter = i < 30 ? 'A' : 'B';
            
            students.push({
                id: `s_jhs_${String(studentIndex + 1).padStart(4, '0')}`,
                name: generateStudentName(sex),
                email: `student.jhs${grade}.${i + 1}@edusync.edu`,
                enrollmentDate: '2025-06-01',
                dateOfBirth: `${2025 - grade - 6}-05-10`,
                sex,
                lrn: generateLRN(studentIndex),
                gradeLevel: grade,
                sectionId: `sec_grade${grade}_a`,
                status: 'active'
            });
            studentIndex++;
        }
    }

    // Senior High (11-12): 2 grades, 4 tracks (STEM, ABM, HUMSS, GAS), 15 students per track = 120 students
    const tracks = ['STEM', 'ABM', 'HUMSS', 'GAS'];
    for (let grade = 11; grade <= 12; grade++) {
        tracks.forEach(track => {
            for (let i = 0; i < 15; i++) {
                const sex = Math.random() > 0.5 ? 'Male' : 'Female';
                
                students.push({
                    id: `s_shs_${track.toLowerCase()}_${grade}_${String(i + 1).padStart(3, '0')}`,
                    name: generateStudentName(sex),
                    email: `student.shs${grade}.${track.toLowerCase()}.${i + 1}@edusync.edu`,
                    enrollmentDate: '2025-06-01',
                    dateOfBirth: `${2025 - grade - 6}-07-20`,
                    sex,
                    lrn: generateLRN(studentIndex),
                    gradeLevel: grade,
                    track: track,
                    sectionId: `sec_grade${grade}_${track.toLowerCase()}`,
                    status: 'active'
                });
                studentIndex++;
            }
        });
    }

    console.log(`\n✅ Generated ${students.length} students:`);
    console.log(`   Elementary (1-6): ${students.filter(s => s.gradeLevel >= 1 && s.gradeLevel <= 6).length}`);
    console.log(`   Junior High (7-10): ${students.filter(s => s.gradeLevel >= 7 && s.gradeLevel <= 10).length}`);
    console.log(`   Senior High (11-12): ${students.filter(s => s.gradeLevel >= 11 && s.gradeLevel <= 12).length}`);

    return students;
};

// ============================================
// SECTION GENERATION
// ============================================

const generateSections = () => {
    const sections = [];

    // Elementary sections (1-6)
    for (let grade = 1; grade <= 6; grade++) {
        sections.push({
            id: `sec_grade${grade}_a`,
            gradeLevel: grade,
            name: `Grade ${grade} - Section A`,
            adviserId: `teacher_elem_${grade}`
        });
    }

    // Junior High sections (7-10)
    for (let grade = 7; grade <= 10; grade++) {
        sections.push({
            id: `sec_grade${grade}_a`,
            gradeLevel: grade,
            name: `Grade ${grade} - Section A`,
            adviserId: `teacher_jhs_${grade}`
        });
    }

    // Senior High sections (11-12) per track
    const tracks = ['STEM', 'ABM', 'HUMSS', 'GAS'];
    for (let grade = 11; grade <= 12; grade++) {
        tracks.forEach(track => {
            sections.push({
                id: `sec_grade${grade}_${track.toLowerCase()}`,
                gradeLevel: grade,
                name: `Grade ${grade} - ${track}`,
                track: track,
                adviserId: `teacher_shs_${track.toLowerCase()}_${grade}`
            });
        });
    }

    console.log(`\n✅ Generated ${sections.length} sections`);
    return sections;
};

// ============================================
// GRADE GENERATION
// ============================================

const generateRealisticGrade = () => {
    // Generate grades between 75-99 with realistic distribution
    // Most students get 80-95 range
    const rand = Math.random();
    if (rand < 0.05) return Math.floor(Math.random() * 5) + 75; // 75-79 (5%)
    if (rand < 0.25) return Math.floor(Math.random() * 5) + 80; // 80-84 (20%)
    if (rand < 0.60) return Math.floor(Math.random() * 5) + 85; // 85-89 (35%)
    if (rand < 0.85) return Math.floor(Math.random() * 5) + 90; // 90-94 (25%)
    return Math.floor(Math.random() * 5) + 95; // 95-99 (15%)
};

const generateGrades = async (students) => {
    console.log('\n🎓 Generating grades for all students...\n');

    // Get all learning areas
    const learningAreasSnap = await db.collection('learningAreas').get();
    const learningAreas = learningAreasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const grades = [];

    for (const student of students) {
        // Filter learning areas applicable to this student's grade level
        const applicableLAs = learningAreas.filter(la => {
            if (!la.gradeLevel || la.gradeLevel.length === 0) return false;
            
            // Check if student's grade is in the learning area's grade levels
            if (!la.gradeLevel.includes(student.gradeLevel)) return false;

            // For SHS, check track requirements
            if (student.track && la.trackRequired && la.trackRequired.length > 0) {
                return la.trackRequired.includes(student.track);
            }

            // For non-track-specific subjects, include them
            if (!la.trackRequired || la.trackRequired.length === 0) {
                return true;
            }

            return false;
        });

        // Generate grades for each applicable learning area
        for (const la of applicableLAs) {
            const gradeId = `grade_${student.id}_${la.id}`;

            // Check if this is semester-based (SHS) or quarterly (Elem/JHS)
            if (la.semesterBased) {
                // Senior High - semester grading
                const sem1Midterm = generateRealisticGrade();
                const sem1Final = generateRealisticGrade();
                const sem1Avg = Math.round((sem1Midterm + sem1Final) / 2);

                const sem2Midterm = generateRealisticGrade();
                const sem2Final = generateRealisticGrade();
                const sem2Avg = Math.round((sem2Midterm + sem2Final) / 2);

                const finalGrade = Math.round((sem1Avg + sem2Avg) / 2);

                grades.push({
                    id: gradeId,
                    studentId: student.id,
                    learningAreaId: la.id,
                    semester1: {
                        midterm: sem1Midterm,
                        final: sem1Final,
                        average: sem1Avg
                    },
                    semester2: {
                        midterm: sem2Midterm,
                        final: sem2Final,
                        average: sem2Avg
                    },
                    finalGrade,
                    remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
                });
            } else {
                // Elementary & Junior High - quarterly grading
                const q1 = generateRealisticGrade();
                const q2 = generateRealisticGrade();
                const q3 = generateRealisticGrade();
                const q4 = generateRealisticGrade();
                const finalGrade = Math.round((q1 + q2 + q3 + q4) / 4);

                grades.push({
                    id: gradeId,
                    studentId: student.id,
                    learningAreaId: la.id,
                    q1,
                    q2,
                    q3,
                    q4,
                    finalGrade,
                    remarks: finalGrade >= 75 ? 'Passed' : 'Failed'
                });
            }
        }
    }

    console.log(`✅ Generated ${grades.length} grade records`);
    return grades;
};

// ============================================
// FIRESTORE SEEDING
// ============================================

const clearExistingData = async () => {
    console.log('\n🗑️  Clearing existing students and grades...\n');

    // Delete all existing students
    const studentsSnap = await db.collection('students').get();
    const studentBatch = db.batch();
    studentsSnap.docs.forEach(doc => studentBatch.delete(doc.ref));
    if (studentsSnap.size > 0) await studentBatch.commit();
    console.log(`   Deleted ${studentsSnap.size} students`);

    // Delete all existing grades
    const gradesSnap = await db.collection('grades').get();
    let gradeCount = 0;
    
    // Process in batches of 500
    const gradeBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const doc of gradesSnap.docs) {
        currentBatch.delete(doc.ref);
        batchCount++;
        gradeCount++;

        if (batchCount >= 500) {
            gradeBatches.push(currentBatch);
            currentBatch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        gradeBatches.push(currentBatch);
    }

    for (const batch of gradeBatches) {
        await batch.commit();
    }
    console.log(`   Deleted ${gradeCount} grades`);

    // Delete existing sections
    const sectionsSnap = await db.collection('sections').get();
    const sectionBatch = db.batch();
    sectionsSnap.docs.forEach(doc => sectionBatch.delete(doc.ref));
    if (sectionsSnap.size > 0) await sectionBatch.commit();
    console.log(`   Deleted ${sectionsSnap.size} sections`);
};

const seedData = async (students, sections, grades) => {
    console.log('\n📝 Seeding new data to Firestore...\n');

    // Seed sections first
    console.log('Seeding sections...');
    const sectionBatch = db.batch();
    sections.forEach(section => {
        sectionBatch.set(db.collection('sections').doc(section.id), section);
    });
    await sectionBatch.commit();
    console.log(`   ✅ ${sections.length} sections created`);

    // Seed students
    console.log('Seeding students...');
    const studentBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const student of students) {
        currentBatch.set(db.collection('students').doc(student.id), student);
        batchCount++;

        if (batchCount >= 500) {
            studentBatches.push(currentBatch);
            currentBatch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        studentBatches.push(currentBatch);
    }

    for (const batch of studentBatches) {
        await batch.commit();
    }
    console.log(`   ✅ ${students.length} students created`);

    // Seed grades
    console.log('Seeding grades...');
    const gradeBatches = [];
    currentBatch = db.batch();
    batchCount = 0;

    for (const grade of grades) {
        currentBatch.set(db.collection('grades').doc(grade.id), grade);
        batchCount++;

        if (batchCount >= 500) {
            gradeBatches.push(currentBatch);
            currentBatch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        gradeBatches.push(currentBatch);
    }

    let completedGrades = 0;
    for (const batch of gradeBatches) {
        await batch.commit();
        completedGrades += Math.min(500, grades.length - completedGrades);
        if (grades.length > 500) {
            console.log(`   Progress: ${completedGrades}/${grades.length} grades...`);
        }
    }
    console.log(`   ✅ ${grades.length} grades created`);
};

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  K-12 COMPLETE DATA SEEDING TOOL       ║');
    console.log('╚════════════════════════════════════════╝');

    try {
        // Step 1: Clear existing data
        await clearExistingData();

        // Step 2: Generate new data
        console.log('\n📊 Generating K-12 compliant data...');
        const students = generateStudents();
        const sections = generateSections();
        const grades = await generateGrades(students);

        // Step 3: Seed to Firestore
        await seedData(students, sections, grades);

        // Step 4: Final summary
        console.log('\n========================================');
        console.log('✅ K-12 DATA SEEDING COMPLETED!');
        console.log('========================================\n');

        // Breakdown by level
        const elemStudents = students.filter(s => s.gradeLevel >= 1 && s.gradeLevel <= 6);
        const jhsStudents = students.filter(s => s.gradeLevel >= 7 && s.gradeLevel <= 10);
        const shsStudents = students.filter(s => s.gradeLevel >= 11 && s.gradeLevel <= 12);

        const elemGrades = grades.filter(g => g.q1 !== undefined); // Quarterly = Elem/JHS
        const shsGrades = grades.filter(g => g.semester1 !== undefined); // Semester = SHS

        console.log('📊 FINAL DATABASE STATE:\n');
        console.log('Students:');
        console.log(`   Elementary (1-6):    ${elemStudents.length} students`);
        console.log(`   Junior High (7-10):  ${jhsStudents.length} students`);
        console.log(`   Senior High (11-12): ${shsStudents.length} students`);
        console.log(`   TOTAL:               ${students.length} students\n`);

        console.log('Sections:');
        console.log(`   Elementary:          6 sections`);
        console.log(`   Junior High:         4 sections`);
        console.log(`   Senior High:         8 sections (4 tracks × 2 grades)`);
        console.log(`   TOTAL:               ${sections.length} sections\n`);

        console.log('Grades:');
        console.log(`   Quarterly (Elem/JHS): ${elemGrades.length} records`);
        console.log(`   Semester (SHS):       ${shsGrades.length} records`);
        console.log(`   TOTAL:                ${grades.length} grades\n`);

        console.log('🎓 SHS Tracks:');
        const stemStudents = shsStudents.filter(s => s.track === 'STEM');
        const abmStudents = shsStudents.filter(s => s.track === 'ABM');
        const humssStudents = shsStudents.filter(s => s.track === 'HUMSS');
        const gasStudents = shsStudents.filter(s => s.track === 'GAS');
        
        console.log(`   STEM:   ${stemStudents.length} students`);
        console.log(`   ABM:    ${abmStudents.length} students`);
        console.log(`   HUMSS:  ${humssStudents.length} students`);
        console.log(`   GAS:    ${gasStudents.length} students\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ SEEDING FAILED:', error);
        process.exit(1);
    }
}

main();
