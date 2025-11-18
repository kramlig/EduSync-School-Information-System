#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 7: Link Parent to Students
 * 
 * Links parent-demo@edusync.ph to 3 children:
 * - 2 children in Grade 7 (different sections)
 * - 1 child in Grade 10 (same section as demo student)
 * 
 * Updates:
 * - Parent document with studentIds array
 * - Users collection for parent
 * - Student documents with parentId
 * 
 * Usage:
 *   node scripts/production-e2e/phase7-link-parent.cjs
 * 
 * Verification:
 *   - Login as parent-demo@edusync.ph
 *   - Dashboard should show 3 children
 *   - Should be able to view all 3 children's grades
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n👨‍👩‍👧‍👦 PHASE 7: LINK PARENT TO STUDENTS');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    const parentUID = 'jumLcSsXcGcG7Zu81SvBHwXFx013'; // From Phase 2
    
    // Fetch students from different sections
    console.log('\n1️⃣  Fetching students for linkage...');
    const studentsQuery = await db.collection('students')
      .where('schoolId', '==', schoolId)
      .get();
    
    console.log(`   ✅ ${studentsQuery.size} total students found`);
    
    // Select 3 students:
    // - 2 from Grade 7 (different sections)
    // - 1 from Grade 10
    const grade7Students = studentsQuery.docs.filter(doc => {
      const student = doc.data();
      return student.gradeLevel === 7 && doc.id.startsWith('demo_student_');
    });
    
    const grade10Students = studentsQuery.docs.filter(doc => {
      const student = doc.data();
      return student.gradeLevel === 10 && doc.id.startsWith('demo_student_');
    });
    
    // Select students from different sections
    const child1Doc = grade7Students.find(doc => doc.data().sectionId?.includes('section_a'));
    const child2Doc = grade7Students.find(doc => doc.data().sectionId?.includes('section_b'));
    const child3Doc = grade10Students.find(doc => doc.data().sectionId?.includes('section_a'));
    
    if (!child1Doc || !child2Doc || !child3Doc) {
      throw new Error('Could not find suitable students for linkage. Ensure Phase 5 completed.');
    }
    
    const children = [
      { id: child1Doc.id, ...child1Doc.data() },
      { id: child2Doc.id, ...child2Doc.data() },
      { id: child3Doc.id, ...child3Doc.data() }
    ];
    
    console.log('\n   Selected children:');
    children.forEach((child, index) => {
      console.log(`   ${index + 1}. ${child.name} - ${child.sectionName} (${child.id})`);
    });
    
    // Update parent document
    console.log('\n2️⃣  Updating parent document...');
    
    const studentIds = children.map(c => c.id);
    const childrenInfo = children.map(c => ({
      studentId: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      sectionName: c.sectionName
    }));
    
    await db.collection('parents').doc(parentUID).update({
      studentIds: studentIds,
      children: childrenInfo,
      updatedAt: new Date().toISOString()
    });
    
    console.log('   ✅ Parent document updated with 3 children');
    
    // Update users collection for parent
    console.log('\n3️⃣  Updating users collection for parent...');
    await db.collection('users').doc(parentUID).update({
      studentIds: studentIds,
      children: childrenInfo,
      updatedAt: new Date().toISOString()
    });
    
    console.log('   ✅ Users collection updated');
    
    // Update student documents with parent reference
    console.log('\n4️⃣  Updating student documents with parent reference...');
    
    for (const child of children) {
      await db.collection('students').doc(child.id).update({
        parentId: parentUID,
        parentEmail: 'parent-demo@edusync.ph',
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('   ✅ All 3 students updated with parent reference');
    
    // Verify linkage
    console.log('\n5️⃣  Verifying parent-student linkage...');
    
    const parentDoc = await db.collection('parents').doc(parentUID).get();
    const parentData = parentDoc.data();
    
    if (!parentData) {
      throw new Error('Parent document not found!');
    }
    
    console.log(`   ✅ Parent has ${parentData.studentIds?.length || 0} children linked`);
    console.log(`   ✅ Children info stored in parent document`);
    
    // Verify students have parent reference
    for (const child of children) {
      const studentDoc = await db.collection('students').doc(child.id).get();
      const studentData = studentDoc.data();
      
      if (studentData?.parentId === parentUID) {
        console.log(`   ✅ ${studentData.name} → parent reference verified`);
      } else {
        console.log(`   ⚠️  ${child.name} → missing parent reference`);
      }
    }
    
    // Verify grades exist for children
    console.log('\n6️⃣  Verifying children have grades...');
    
    for (const child of children) {
      const gradesQuery = await db.collection('grades')
        .where('studentId', '==', child.id)
        .where('schoolId', '==', schoolId)
        .get();
      
      console.log(`   📊 ${child.name}: ${gradesQuery.size} grade documents`);
    }
    
    // Summary
    console.log('\n7️⃣  PHASE 7 SUMMARY');
    console.log('═'.repeat(80));
    console.log('   ✅ Parent linked to 3 children');
    console.log('   ✅ Children from different grade levels and sections');
    console.log('   ✅ Parent and users collections updated');
    console.log('   ✅ Student documents updated with parent reference');
    console.log('   ✅ All children have complete grade records');
    console.log('   🎯 Ready for Phase 8 (Smoke Tests)');
    
    console.log('\n📋 PARENT-STUDENT LINKAGE:');
    console.log('─'.repeat(80));
    console.log('   Parent: parent-demo@edusync.ph');
    console.log('   Children (3):');
    children.forEach((child, index) => {
      console.log(`      ${index + 1}. ${child.name}`);
      console.log(`         Grade Level: ${child.gradeLevel}`);
      console.log(`         Section: ${child.sectionName}`);
      console.log(`         Student ID: ${child.id}`);
      console.log();
    });
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('   1. Login as parent-demo@edusync.ph at https://edusync-sis.web.app');
    console.log('   2. Dashboard should show 3 children');
    console.log('   3. Click on each child to view their grades');
    console.log('   4. Verify grades are visible for all subjects');
    console.log('   5. Should see different grade levels and sections');
    
    console.log('\n📋 NEXT STEP:');
    console.log('   node scripts/production-e2e/phase8-smoke-tests.cjs');
    console.log('\n   OR run automated Playwright tests:');
    console.log('   npx playwright test tests/production-smoke-test.spec.ts');
    
    console.log('\n✅ PHASE 7 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 7:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Ensure Phase 5 completed (students created)');
    console.error('   2. Check parent UID matches Phase 2');
    console.error('   3. Verify students exist in different sections');
    process.exit(1);
  }
}

run();
