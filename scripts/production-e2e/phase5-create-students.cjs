#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 5: Create Students
 * 
 * Creates 50 students across all 5 sections:
 * - Grade 7 Section A: 10 students
 * - Grade 7 Section B: 10 students
 * - Grade 7 Section C: 10 students
 * - Grade 10 Section A: 10 students (visible to demo teacher)
 * - Grade 10 Section B: 10 students
 * 
 * Also assigns the demo student account to Grade 10 Section A
 * 
 * Usage:
 *   node scripts/production-e2e/phase5-create-students.cjs
 * 
 * Verification:
 *   - Login as teacher-demo@edusync.ph
 *   - Navigate to Gradebook
 *   - Should see 10 students in Grade 10 - Section A
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n👨‍🎓 PHASE 5: CREATE STUDENTS');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    const demoStudentUID = 'RvW2AT6lyLX4rsI7YNdAsQquCFs2'; // From Phase 2
    
    // Verify sections exist
    console.log('\n1️⃣  Verifying sections...');
    const sectionsQuery = await db.collection('sections')
      .where('schoolId', '==', schoolId)
      .get();
    
    if (sectionsQuery.size < 5) {
      throw new Error(`Only ${sectionsQuery.size} sections found! Run Phase 3 first.`);
    }
    
    console.log(`   ✅ ${sectionsQuery.size} sections found`);
    
    // Student names for realistic data
    const firstNames = [
      'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Miguel', 'Elena', 'Carlos', 'Sofia',
      'Luis', 'Carmen', 'Diego', 'Isabel', 'Rafael', 'Laura', 'Antonio', 'Patricia', 'Manuel', 'Lucia',
      'Francisco', 'Teresa', 'Andres', 'Monica', 'Roberto', 'Angela', 'Ricardo', 'Sandra', 'Fernando', 'Diana',
      'Jorge', 'Gabriela', 'Pablo', 'Beatriz', 'Javier', 'Cristina', 'Alejandro', 'Valeria', 'Daniel', 'Adriana',
      'Marcos', 'Natalia', 'Sergio', 'Claudia', 'Eduardo', 'Silvia', 'Raul', 'Gloria', 'Victor', 'Mariana'
    ];
    
    const lastNames = [
      'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Ramos', 'Mendoza', 'Flores', 'Torres', 'Rivera',
      'Gonzales', 'Lopez', 'Perez', 'Dela Cruz', 'Hernandez', 'Martinez', 'Rodriguez', 'Fernandez', 'Castro', 'Morales'
    ];
    
    console.log('\n2️⃣  Creating students...\n');
    
    let totalCreated = 0;
    const sections = sectionsQuery.docs;
    
    for (const sectionDoc of sections) {
      const section = sectionDoc.data();
      const sectionId = sectionDoc.id;
      const studentsPerSection = 10;
      
      console.log(`   📚 Creating students for ${section.name}...`);
      
      for (let i = 1; i <= studentsPerSection; i++) {
        const studentIndex = totalCreated;
        const firstName = firstNames[studentIndex % firstNames.length];
        const lastName = lastNames[Math.floor(studentIndex / firstNames.length) % lastNames.length];
        
        const studentId = `demo_student_${section.gradeLevel}_${section.section.toLowerCase()}_${i.toString().padStart(2, '0')}`;
        const lrn = `LRN-DEMO-${section.gradeLevel}-${section.section}-${i.toString().padStart(3, '0')}`;
        
        const studentData = {
          id: studentId,
          schoolId: schoolId,
          
          // Personal Info
          firstName: firstName,
          lastName: lastName,
          middleName: 'Demo',
          name: `${firstName} ${lastName}`,
          
          // Academic Info
          lrn: lrn,
          gradeLevel: section.gradeLevel,
          sectionId: sectionId,
          sectionName: section.name,
          
          // Contact
          email: `${studentId}@demo.edusync.ph`,
          
          // Status
          isActive: true,
          enrollmentStatus: 'enrolled',
          
          // Metadata
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'production-e2e-setup'
        };
        
        await db.collection('students').doc(studentId).set(studentData);
        totalCreated++;
      }
      
      console.log(`      ✅ Created ${studentsPerSection} students`);
      
      // Update section student count
      await db.collection('sections').doc(sectionId).update({
        studentCount: studentsPerSection,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update demo student account to be in Grade 10 Section A
    console.log('\n3️⃣  Updating demo student account...');
    const grade10SectionA = sections.find(doc => 
      doc.data().gradeLevel === 10 && doc.data().section === 'A'
    );
    
    if (grade10SectionA) {
      await db.collection('students').doc(demoStudentUID).update({
        sectionId: grade10SectionA.id,
        sectionName: grade10SectionA.data().name,
        gradeLevel: 10,
        lrn: 'LRN-DEMO-001-MAIN',
        updatedAt: new Date().toISOString()
      });
      
      await db.collection('users').doc(demoStudentUID).update({
        sectionId: grade10SectionA.id,
        gradeLevel: 10,
        updatedAt: new Date().toISOString()
      });
      
      console.log('   ✅ Demo student assigned to Grade 10 - Section A');
      console.log(`      Email: student-demo@edusync.ph`);
      console.log(`      LRN: LRN-DEMO-001-MAIN`);
    }
    
    // Verify creation
    console.log('\n4️⃣  Verifying students...');
    const studentsQuery = await db.collection('students')
      .where('schoolId', '==', schoolId)
      .get();
    
    console.log(`   ✅ Total students created: ${studentsQuery.size}`);
    
    // Group by grade level
    const grade7Students = studentsQuery.docs.filter(doc => doc.data().gradeLevel === 7);
    const grade10Students = studentsQuery.docs.filter(doc => doc.data().gradeLevel === 10);
    
    console.log(`   📊 Grade 7 students: ${grade7Students.length}`);
    console.log(`   📊 Grade 10 students: ${grade10Students.length}`);
    
    // Count students in Grade 10 Section A (visible to demo teacher)
    const grade10SectionAStudents = studentsQuery.docs.filter(doc => 
      doc.data().sectionId === grade10SectionA?.id
    );
    console.log(`   📊 Grade 10 Section A students: ${grade10SectionAStudents.length} (visible to teacher-demo)`);
    
    // Summary
    console.log('\n5️⃣  PHASE 5 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${studentsQuery.size} students created`);
    console.log('   ✅ All students assigned to sections');
    console.log('   ✅ Demo student account updated');
    console.log('   ✅ Section student counts updated');
    console.log('   🎯 Ready for Phase 6 (Seed Grades)');
    
    console.log('\n📋 STUDENTS BY SECTION:');
    console.log('─'.repeat(80));
    
    for (const sectionDoc of sections) {
      const section = sectionDoc.data();
      const sectionStudents = studentsQuery.docs.filter(doc => 
        doc.data().sectionId === sectionDoc.id
      );
      
      console.log(`   ${section.name}: ${sectionStudents.length} students`);
      
      // Show first 3 students as sample
      if (sectionStudents.length > 0) {
        sectionStudents.slice(0, 3).forEach(doc => {
          const student = doc.data();
          console.log(`      • ${student.name} (${student.lrn})`);
        });
        if (sectionStudents.length > 3) {
          console.log(`      ... and ${sectionStudents.length - 3} more`);
        }
      }
      console.log();
    }
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('   1. Login as teacher-demo@edusync.ph at https://edusync-sis.web.app');
    console.log('   2. Navigate to Gradebook/Assessment');
    console.log('   3. Select "Grade 10 - Section A"');
    console.log(`   4. Should see ${grade10SectionAStudents.length} students listed`);
    console.log('\n   5. Login as student-demo@edusync.ph');
    console.log('   6. Should see Grade 10 - Section A on dashboard');
    
    console.log('\n📋 NEXT STEP:');
    console.log('   node scripts/production-e2e/phase6-seed-grades.cjs');
    
    console.log('\n✅ PHASE 5 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 5:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Ensure Phase 1-4 completed successfully');
    console.error('   2. Check demo student UID matches Phase 2');
    console.error('   3. Verify sections were created in Phase 3');
    process.exit(1);
  }
}

run();
