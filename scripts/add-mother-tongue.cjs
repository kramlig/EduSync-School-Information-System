#!/usr/bin/env node

/**
 * Add Mother Tongue (MTB-MLE) Learning Area and Seed Grades
 * 
 * Purpose: Add Mother Tongue as a learning area for Elementary Grades 1-3
 *          and seed realistic grade data for all students in those grades
 * 
 * Mother Tongue-Based Multilingual Education (MTB-MLE):
 * - Required for K-3 in the K-12 curriculum
 * - Uses local/regional language as medium of instruction
 * - Graded quarterly (Q1, Q2, Q3, Q4)
 * - For this implementation, we'll use "Mother Tongue" as the subject name
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'edusync-sis'
});

const db = admin.firestore();

// Grade distribution for realistic data
function generateRealisticGrade() {
    const rand = Math.random();
    // Distribution: 30% Outstanding (90-100), 50% Very Satisfactory (85-89), 
    //               15% Satisfactory (80-84), 5% Fairly Satisfactory (75-79)
    if (rand < 0.30) return Math.floor(Math.random() * 11) + 90; // 90-100
    if (rand < 0.80) return Math.floor(Math.random() * 5) + 85;  // 85-89
    if (rand < 0.95) return Math.floor(Math.random() * 5) + 80;  // 80-84
    return Math.floor(Math.random() * 6) + 75; // 75-80
}

async function addMotherTongueLearningArea() {
    console.log('📚 Adding Mother Tongue Learning Area...\n');
    
    const learningAreaData = {
        id: 'la_mother_tongue',
        name: 'Mother Tongue',
        description: 'Mother Tongue-Based Multilingual Education (MTB-MLE) - Uses local/regional language as medium of instruction and subject',
        gradeLevel: null, // Not using single gradeLevel
        gradeLevels: [1, 2, 3], // Grades 1-3
        category: 'core',
        colorCode: '#8B4513', // Brown color for Mother Tongue
        isActive: true,
        quarter: null, // Quarterly grading
        semester: null, // Not applicable
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('learningAreas').doc('la_mother_tongue').set(learningAreaData);
        console.log('✅ Mother Tongue learning area created successfully');
        console.log(`   - ID: la_mother_tongue`);
        console.log(`   - Grades: 1-3`);
        console.log(`   - Grading: Quarterly\n`);
        return true;
    } catch (error) {
        console.error('❌ Error creating Mother Tongue learning area:', error);
        return false;
    }
}

async function getGrades1to3Students() {
    console.log('👥 Fetching students in Grades 1-3...\n');
    
    const sectionsSnapshot = await db.collection('sections')
        .where('gradeLevel', '>=', 1)
        .where('gradeLevel', '<=', 3)
        .get();
    
    const sectionIds = sectionsSnapshot.docs.map(doc => doc.id);
    console.log(`   Found ${sectionIds.length} sections in Grades 1-3`);
    
    if (sectionIds.length === 0) {
        console.log('   No sections found for Grades 1-3');
        return [];
    }
    
    // Firestore 'in' query limit is 10, so we need to batch if more sections
    const students = [];
    for (let i = 0; i < sectionIds.length; i += 10) {
        const batch = sectionIds.slice(i, i + 10);
        const studentsSnapshot = await db.collection('students')
            .where('sectionId', 'in', batch)
            .get();
        
        studentsSnapshot.docs.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
    }
    
    console.log(`   Found ${students.length} students in Grades 1-3\n`);
    
    // Group by grade level for display
    const byGrade = students.reduce((acc, s) => {
        const section = sectionsSnapshot.docs.find(d => d.id === s.sectionId);
        const grade = section?.data().gradeLevel || 0;
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});
    
    Object.keys(byGrade).sort().forEach(grade => {
        console.log(`   - Grade ${grade}: ${byGrade[grade]} students`);
    });
    console.log('');
    
    return students;
}

async function seedMotherTongueGrades(students) {
    console.log('📝 Seeding Mother Tongue grades...\n');
    
    const batch = db.batch();
    let count = 0;
    const quarters = ['q1', 'q2', 'q3', 'q4'];
    
    for (const student of students) {
        // Check if grade already exists
        const existingGrade = await db.collection('grades')
            .where('studentId', '==', student.id)
            .where('learningAreaId', '==', 'la_mother_tongue')
            .limit(1)
            .get();
        
        if (!existingGrade.empty) {
            console.log(`   ⏭️  Skipping ${student.name} - already has Mother Tongue grades`);
            continue;
        }
        
        // Generate quarterly grades
        const quarterlyGrades = {};
        quarters.forEach(q => {
            quarterlyGrades[q] = generateRealisticGrade();
        });
        
        // Calculate final grade (average of 4 quarters)
        const finalGrade = Math.round(
            (quarterlyGrades.q1 + quarterlyGrades.q2 + quarterlyGrades.q3 + quarterlyGrades.q4) / 4
        );
        
        const gradeData = {
            studentId: student.id,
            learningAreaId: 'la_mother_tongue',
            schoolYear: '2024-2025',
            q1: quarterlyGrades.q1,
            q2: quarterlyGrades.q2,
            q3: quarterlyGrades.q3,
            q4: quarterlyGrades.q4,
            finalGrade: finalGrade,
            remarks: finalGrade >= 75 ? 'Passed' : 'Failed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const gradeRef = db.collection('grades').doc();
        batch.set(gradeRef, gradeData);
        count++;
        
        if (count % 10 === 0) {
            console.log(`   📊 Generated ${count} grade records...`);
        }
    }
    
    if (count > 0) {
        await batch.commit();
        console.log(`\n✅ Successfully seeded ${count} Mother Tongue grade records`);
        
        // Show statistics
        console.log('\n📊 Grade Statistics:');
        const gradesSnapshot = await db.collection('grades')
            .where('learningAreaId', '==', 'la_mother_tongue')
            .get();
        
        const stats = {
            total: 0,
            outstanding: 0,  // 90-100
            verySatisfactory: 0, // 85-89
            satisfactory: 0, // 80-84
            fairlySatisfactory: 0, // 75-79
            didNotMeet: 0 // below 75
        };
        
        gradesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const grade = data.finalGrade;
            stats.total++;
            
            if (grade >= 90) stats.outstanding++;
            else if (grade >= 85) stats.verySatisfactory++;
            else if (grade >= 80) stats.satisfactory++;
            else if (grade >= 75) stats.fairlySatisfactory++;
            else stats.didNotMeet++;
        });
        
        console.log(`   Total grades: ${stats.total}`);
        console.log(`   Outstanding (90-100): ${stats.outstanding} (${Math.round(stats.outstanding/stats.total*100)}%)`);
        console.log(`   Very Satisfactory (85-89): ${stats.verySatisfactory} (${Math.round(stats.verySatisfactory/stats.total*100)}%)`);
        console.log(`   Satisfactory (80-84): ${stats.satisfactory} (${Math.round(stats.satisfactory/stats.total*100)}%)`);
        console.log(`   Fairly Satisfactory (75-79): ${stats.fairlySatisfactory} (${Math.round(stats.fairlySatisfactory/stats.total*100)}%)`);
        if (stats.didNotMeet > 0) {
            console.log(`   Did Not Meet (below 75): ${stats.didNotMeet} (${Math.round(stats.didNotMeet/stats.total*100)}%)`);
        }
    } else {
        console.log('\n⚠️  No new grades to seed (all students already have Mother Tongue grades)');
    }
    
    return count;
}

async function main() {
    console.log('='.repeat(60));
    console.log('🌏 MOTHER TONGUE (MTB-MLE) LEARNING AREA SETUP');
    console.log('='.repeat(60));
    console.log('');
    
    try {
        // Step 1: Add Mother Tongue learning area
        const learningAreaAdded = await addMotherTongueLearningArea();
        
        if (!learningAreaAdded) {
            console.log('❌ Failed to add Mother Tongue learning area. Exiting...');
            process.exit(1);
        }
        
        // Step 2: Get students in Grades 1-3
        const students = await getGrades1to3Students();
        
        if (students.length === 0) {
            console.log('⚠️  No students found in Grades 1-3. No grades to seed.');
            console.log('\n✅ Mother Tongue learning area added successfully (no students to grade yet)');
            process.exit(0);
        }
        
        // Step 3: Seed Mother Tongue grades
        const gradesSeeded = await seedMotherTongueGrades(students);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ MOTHER TONGUE SETUP COMPLETE!');
        console.log('='.repeat(60));
        console.log(`   Learning Area: Mother Tongue (Grades 1-3)`);
        console.log(`   Students Graded: ${gradesSeeded}`);
        console.log(`   Grading System: Quarterly (Q1, Q2, Q3, Q4)`);
        console.log('\n📌 Next Steps:');
        console.log('   1. Verify in Academic Gradebook');
        console.log('   2. Select a Grade 1-3 section');
        console.log('   3. Check that "Mother Tongue" appears in learning areas');
        console.log('   4. Verify grades are properly displayed');
        console.log('');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during Mother Tongue setup:', error);
        process.exit(1);
    }
}

// Run the script
main();
