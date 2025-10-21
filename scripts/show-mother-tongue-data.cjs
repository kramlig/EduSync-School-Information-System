const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'edusync-sis' });

async function showMotherTongueSample() {
    const db = admin.firestore();
    
    console.log('\n' + '='.repeat(70));
    console.log('🌏 MOTHER TONGUE IMPLEMENTATION - SAMPLE DATA');
    console.log('='.repeat(70) + '\n');
    
    // Get Mother Tongue learning area
    const laDoc = await db.collection('learningAreas').doc('la_mother_tongue').get();
    const la = laDoc.data();
    
    console.log('📚 LEARNING AREA:');
    console.log(`   Name: ${la.name}`);
    console.log(`   ID: ${laDoc.id}`);
    console.log(`   Grades: ${la.gradeLevels.join(', ')}`);
    console.log(`   Category: ${la.category}`);
    console.log(`   Color: ${la.colorCode}`);
    console.log('');
    
    // Get sample grades
    const gradesSnap = await db.collection('grades')
        .where('learningAreaId', '==', 'la_mother_tongue')
        .limit(5)
        .get();
    
    console.log('📊 SAMPLE GRADES (5 students):');
    console.log('');
    
    for (const gradeDoc of gradesSnap.docs) {
        const grade = gradeDoc.data();
        
        // Get student info
        const studentDoc = await db.collection('students').doc(grade.studentId).get();
        const student = studentDoc.data();
        
        // Get section info
        const sectionDoc = await db.collection('sections').doc(student.sectionId).get();
        const section = sectionDoc.data();
        
        console.log(`👤 ${student.name}`);
        console.log(`   Section: ${section.name}`);
        console.log(`   Grades: Q1=${grade.q1} | Q2=${grade.q2} | Q3=${grade.q3} | Q4=${grade.q4}`);
        console.log(`   Final: ${grade.finalGrade} (${grade.remarks})`);
        console.log('');
    }
    
    // Get statistics
    const allGradesSnap = await db.collection('grades')
        .where('learningAreaId', '==', 'la_mother_tongue')
        .get();
    
    const stats = { total: 0, byGrade: {} };
    
    for (const doc of allGradesSnap.docs) {
        const grade = doc.data();
        const studentDoc = await db.collection('students').doc(grade.studentId).get();
        const student = studentDoc.data();
        const sectionDoc = await db.collection('sections').doc(student.sectionId).get();
        const section = sectionDoc.data();
        const gradeLevel = section.gradeLevel;
        
        stats.total++;
        stats.byGrade[gradeLevel] = (stats.byGrade[gradeLevel] || 0) + 1;
    }
    
    console.log('📈 STATISTICS:');
    console.log(`   Total Students Graded: ${stats.total}`);
    Object.keys(stats.byGrade).sort().forEach(grade => {
        console.log(`   Grade ${grade}: ${stats.byGrade[grade]} students`);
    });
    console.log('');
    
    console.log('='.repeat(70));
    console.log('✅ Mother Tongue is now active in the system!');
    console.log('🌐 Visit https://edusync-sis.web.app to verify in Academic Gradebook');
    console.log('='.repeat(70) + '\n');
    
    process.exit(0);
}

showMotherTongueSample();
