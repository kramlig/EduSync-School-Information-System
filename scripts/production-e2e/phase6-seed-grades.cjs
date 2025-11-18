#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 6: Seed Grades
 * 
 * Creates comprehensive grade data:
 * - 51 students × 11 subjects × 4 quarters = ~2,244 grade documents
 * - Realistic grades (75-95 range)
 * - Final grades calculated
 * - All quarters complete
 * 
 * Grade Structure:
 * - Written Work (WW): 40%
 * - Performance Task (PT): 40%
 * - Quarterly Assessment (QA): 20%
 * 
 * Usage:
 *   node scripts/production-e2e/phase6-seed-grades.cjs
 * 
 * Verification:
 *   - Login as teacher-demo@edusync.ph
 *   - Navigate to Gradebook
 *   - Should see all students with grades across all subjects
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n📊 PHASE 6: SEED GRADES');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('⚠️  This will create ~2,244 grade documents');
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    
    // Fetch all students
    console.log('\n1️⃣  Fetching students...');
    const studentsQuery = await db.collection('students')
      .where('schoolId', '==', schoolId)
      .get();
    
    console.log(`   ✅ ${studentsQuery.size} students found`);
    
    // Fetch all learning areas
    console.log('\n2️⃣  Fetching learning areas...');
    const learningAreasQuery = await db.collection('learningAreas')
      .where('schoolId', '==', schoolId)
      .get();
    
    console.log(`   ✅ ${learningAreasQuery.size} learning areas found`);
    
    const learningAreas = learningAreasQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Helper function to generate realistic grades
    function generateRealisticGrade(min = 75, max = 95) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Helper function to calculate quarterly grade
    function calculateQuarterlyGrade(ww, pt, qa) {
      return Math.round(ww * 0.4 + pt * 0.4 + qa * 0.2);
    }
    
    // Helper function to calculate final grade
    function calculateFinalGrade(q1, q2, q3, q4) {
      return Math.round((q1 + q2 + q3 + q4) / 4);
    }
    
    console.log('\n3️⃣  Creating grades...\n');
    console.log('   This may take a moment - creating ~2,244 documents...\n');
    
    let totalGrades = 0;
    const students = studentsQuery.docs;
    
    // Batch writes for better performance
    let batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore limit
    
    for (const studentDoc of students) {
      const student = studentDoc.data();
      const studentId = studentDoc.id;
      
      // Filter learning areas applicable to student's grade level
      const applicableLearningAreas = learningAreas.filter(la => 
        la.gradeLevel && la.gradeLevel.includes(student.gradeLevel)
      );
      
      for (const learningArea of applicableLearningAreas) {
        // Generate grades for all 4 quarters
        const quarterlyGrades = [];
        
        for (let quarter = 1; quarter <= 4; quarter++) {
          // Generate component scores
          const ww = generateRealisticGrade(76, 94);
          const pt = generateRealisticGrade(76, 94);
          const qa = generateRealisticGrade(76, 94);
          
          // Calculate quarterly grade
          const quarterlyGrade = calculateQuarterlyGrade(ww, pt, qa);
          quarterlyGrades.push(quarterlyGrade);
          
          // Create grade document
          const gradeId = `${studentId}_${learningArea.id}_q${quarter}`;
          const gradeData = {
            id: gradeId,
            schoolId: schoolId,
            
            // Student info
            studentId: studentId,
            studentName: student.name || `${student.firstName} ${student.lastName}`,
            gradeLevel: student.gradeLevel,
            sectionId: student.sectionId,
            
            // Learning area info
            learningAreaId: learningArea.id,
            learningAreaName: learningArea.name,
            
            // Quarter info
            quarter: quarter,
            schoolYear: '2024-2025',
            
            // Component scores
            writtenWork: ww,
            performanceTask: pt,
            quarterlyAssessment: qa,
            
            // Calculated grade
            quarterlyGrade: quarterlyGrade,
            
            // Metadata
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'production-e2e-setup',
            inputBy: 'teacher-demo@edusync.ph'
          };
          
          const gradeRef = db.collection('grades').doc(gradeId);
          batch.set(gradeRef, gradeData);
          batchCount++;
          totalGrades++;
          
          // Commit batch when reaching limit
          if (batchCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            console.log(`      ✅ Committed batch (${totalGrades} grades so far...)`);
            batch = db.batch();
            batchCount = 0;
          }
        }
        
        // Create final grade document
        const finalGradeId = `${studentId}_${learningArea.id}_final`;
        const finalGrade = calculateFinalGrade(...quarterlyGrades);
        
        const finalGradeData = {
          id: finalGradeId,
          schoolId: schoolId,
          
          // Student info
          studentId: studentId,
          studentName: student.name || `${student.firstName} ${student.lastName}`,
          gradeLevel: student.gradeLevel,
          sectionId: student.sectionId,
          
          // Learning area info
          learningAreaId: learningArea.id,
          learningAreaName: learningArea.name,
          
          // Final grade info
          quarter: 'final',
          schoolYear: '2024-2025',
          
          // Quarterly grades
          q1: quarterlyGrades[0],
          q2: quarterlyGrades[1],
          q3: quarterlyGrades[2],
          q4: quarterlyGrades[3],
          
          // Final grade
          finalGrade: finalGrade,
          
          // Metadata
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'production-e2e-setup'
        };
        
        const finalGradeRef = db.collection('grades').doc(finalGradeId);
        batch.set(finalGradeRef, finalGradeData);
        batchCount++;
        totalGrades++;
        
        // Commit batch when reaching limit
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`      ✅ Committed batch (${totalGrades} grades so far...)`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining grades in batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`      ✅ Committed final batch`);
    }
    
    console.log(`\n   ✅ Total grades created: ${totalGrades}`);
    
    // Verify grades
    console.log('\n4️⃣  Verifying grades...');
    const gradesQuery = await db.collection('grades')
      .where('schoolId', '==', schoolId)
      .get();
    
    console.log(`   ✅ Total grades in database: ${gradesQuery.size}`);
    
    // Count by quarter
    const q1Grades = gradesQuery.docs.filter(doc => doc.data().quarter === 1).length;
    const q2Grades = gradesQuery.docs.filter(doc => doc.data().quarter === 2).length;
    const q3Grades = gradesQuery.docs.filter(doc => doc.data().quarter === 3).length;
    const q4Grades = gradesQuery.docs.filter(doc => doc.data().quarter === 4).length;
    const finalGrades = gradesQuery.docs.filter(doc => doc.data().quarter === 'final').length;
    
    console.log(`   📊 Q1 grades: ${q1Grades}`);
    console.log(`   📊 Q2 grades: ${q2Grades}`);
    console.log(`   📊 Q3 grades: ${q3Grades}`);
    console.log(`   📊 Q4 grades: ${q4Grades}`);
    console.log(`   📊 Final grades: ${finalGrades}`);
    
    // Sample some grades
    console.log('\n5️⃣  Sample grades (first student):');
    const firstStudent = students[0];
    const firstStudentGrades = gradesQuery.docs.filter(doc => 
      doc.data().studentId === firstStudent.id
    );
    
    console.log(`   Student: ${firstStudent.data().name || 'Demo Student'}`);
    console.log(`   Total grades: ${firstStudentGrades.length}\n`);
    
    // Show first 3 subjects
    const subjectGrades = {};
    firstStudentGrades.forEach(doc => {
      const grade = doc.data();
      if (!subjectGrades[grade.learningAreaName]) {
        subjectGrades[grade.learningAreaName] = [];
      }
      subjectGrades[grade.learningAreaName].push(grade);
    });
    
    let subjectCount = 0;
    for (const [subject, grades] of Object.entries(subjectGrades)) {
      if (subjectCount >= 3) break;
      
      console.log(`   ${subject}:`);
      const q1 = grades.find(g => g.quarter === 1);
      const q2 = grades.find(g => g.quarter === 2);
      const q3 = grades.find(g => g.quarter === 3);
      const q4 = grades.find(g => g.quarter === 4);
      const final = grades.find(g => g.quarter === 'final');
      
      if (q1) console.log(`      Q1: ${q1.quarterlyGrade} (WW:${q1.writtenWork} PT:${q1.performanceTask} QA:${q1.quarterlyAssessment})`);
      if (q2) console.log(`      Q2: ${q2.quarterlyGrade} (WW:${q2.writtenWork} PT:${q2.performanceTask} QA:${q2.quarterlyAssessment})`);
      if (q3) console.log(`      Q3: ${q3.quarterlyGrade} (WW:${q3.writtenWork} PT:${q3.performanceTask} QA:${q3.quarterlyAssessment})`);
      if (q4) console.log(`      Q4: ${q4.quarterlyGrade} (WW:${q4.writtenWork} PT:${q4.performanceTask} QA:${q4.quarterlyAssessment})`);
      if (final) console.log(`      FINAL: ${final.finalGrade}`);
      console.log();
      
      subjectCount++;
    }
    
    // Summary
    console.log('\n6️⃣  PHASE 6 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${gradesQuery.size} total grade documents created`);
    console.log(`   ✅ ${students.length} students with complete grades`);
    console.log(`   ✅ ${learningAreas.length} subjects graded`);
    console.log('   ✅ All 4 quarters complete + final grades');
    console.log('   ✅ Realistic grade distribution (75-95 range)');
    console.log('   🎯 Ready for Phase 7 (Link Parent)');
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('   1. Login as teacher-demo@edusync.ph at https://edusync-sis.web.app');
    console.log('   2. Navigate to Gradebook/Assessment');
    console.log('   3. Select "Grade 10 - Section A"');
    console.log('   4. Should see 11 students with grades across all subjects');
    console.log('   5. Verify all quarters (Q1-Q4) and final grades are populated');
    console.log('\n   6. Login as student-demo@edusync.ph');
    console.log('   7. Navigate to Grades');
    console.log('   8. Should see own grades for all subjects');
    
    console.log('\n📋 NEXT STEP:');
    console.log('   node scripts/production-e2e/phase7-link-parent.cjs');
    
    console.log('\n✅ PHASE 6 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 6:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Ensure Phase 5 completed successfully');
    console.error('   2. Check students were created');
    console.error('   3. Verify learning areas exist');
    console.error('   4. Check Firestore batch write limits');
    process.exit(1);
  }
}

run();
