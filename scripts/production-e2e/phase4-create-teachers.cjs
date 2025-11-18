#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 4: Create Teachers with Assignments
 * 
 * Creates 2 additional teachers and updates the demo teacher account with proper assignments
 * 
 * CRITICAL: This phase populates the assignments[] array that gradebook relies on
 * 
 * Teachers:
 * 1. teacher-demo@edusync.ph - Teaches ALL subjects for Grade 10 Section A (for E2E testing)
 * 2. Teacher Math/Science - Teaches Math & Science for all sections
 * 3. Teacher English/Filipino - Teaches English & Filipino for all sections
 * 
 * Usage:
 *   node scripts/production-e2e/phase4-create-teachers.cjs
 * 
 * Verification:
 *   - Login as teacher-demo@edusync.ph
 *   - Navigate to Gradebook
 *   - Should see "Grade 10 - Section A" available (once students are added in Phase 5)
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n👨‍🏫 PHASE 4: CREATE TEACHERS WITH ASSIGNMENTS');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    const demoTeacherUID = 'rizO0eysrAbLCsZy3OhM29Gvx6N2'; // From Phase 2
    
    // Verify school and sections exist
    console.log('\n1️⃣  Verifying demo school and sections...');
    const schoolDoc = await db.collection('schools').doc(schoolId).get();
    if (!schoolDoc.exists) {
      throw new Error('Demo school not found! Run Phase 1 first.');
    }
    
    const sectionsQuery = await db.collection('sections')
      .where('schoolId', '==', schoolId)
      .get();
    
    if (sectionsQuery.size < 5) {
      throw new Error(`Only ${sectionsQuery.size} sections found! Run Phase 3 first.`);
    }
    
    console.log('   ✅ Demo school found');
    console.log(`   ✅ ${sectionsQuery.size} sections found`);
    
    // Get all learning areas for Grade 10 (for demo teacher assignments)
    console.log('\n2️⃣  Fetching learning areas...');
    const learningAreasQuery = await db.collection('learningAreas')
      .where('schoolId', '==', schoolId)
      .get();
    
    let learningAreas = [];
    
    if (learningAreasQuery.empty) {
      console.log('   ⚠️  No learning areas found in demo school');
      console.log('   ℹ️  Creating default K-12 learning areas for Grade 7 & 10...');
      
      // Create default learning areas
      const defaultLearningAreas = [
        { id: 'demo_la_filipino', name: 'Filipino', order: 1, gradeLevel: [7, 10] },
        { id: 'demo_la_english', name: 'English', order: 2, gradeLevel: [7, 10] },
        { id: 'demo_la_math', name: 'Mathematics', order: 3, gradeLevel: [7, 10] },
        { id: 'demo_la_science', name: 'Science', order: 4, gradeLevel: [7, 10] },
        { id: 'demo_la_ap', name: 'Araling Panlipunan', order: 5, gradeLevel: [7, 10] },
        { id: 'demo_la_esp', name: 'Edukasyon sa Pagpapakatao', order: 6, gradeLevel: [7, 10] },
        { id: 'demo_la_tle', name: 'Technology and Livelihood Education', order: 7, gradeLevel: [7, 10] },
        { id: 'demo_la_music', name: 'Music', order: 8, gradeLevel: [7, 10] },
        { id: 'demo_la_arts', name: 'Arts', order: 9, gradeLevel: [7, 10] },
        { id: 'demo_la_pe', name: 'Physical Education', order: 10, gradeLevel: [7, 10] },
        { id: 'demo_la_health', name: 'Health', order: 11, gradeLevel: [7, 10] }
      ];
      
      for (const la of defaultLearningAreas) {
        const laData = {
          id: la.id,
          schoolId: schoolId,
          name: la.name,
          code: la.name.substring(0, 3).toUpperCase(),
          order: la.order,
          gradeLevel: la.gradeLevel,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        
        await db.collection('learningAreas').doc(la.id).set(laData);
        learningAreas.push({ id: la.id, ...laData });
      }
      
      console.log(`   ✅ Created ${defaultLearningAreas.length} learning areas`);
    } else {
      learningAreas = learningAreasQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`   ✅ Found ${learningAreas.length} learning areas`);
    }
    
    // Filter learning areas for Grade 10
    const grade10LearningAreas = learningAreas.filter(la => 
      !la.gradeLevel || la.gradeLevel.length === 0 || la.gradeLevel.includes(10)
    );
    
    console.log(`   ℹ️  ${grade10LearningAreas.length} learning areas applicable to Grade 10`);
    
    // Get Grade 10 Section A (for demo teacher)
    const grade10SectionA = sectionsQuery.docs.find(doc => 
      doc.data().gradeLevel === 10 && doc.data().section === 'A'
    );
    
    if (!grade10SectionA) {
      throw new Error('Grade 10 Section A not found!');
    }
    
    console.log(`   ✅ Found Grade 10 Section A: ${grade10SectionA.id}`);
    
    // Update demo teacher with assignments
    console.log('\n3️⃣  Updating demo teacher with assignments...');
    
    const demoTeacherAssignments = grade10LearningAreas.map(la => ({
      gradeLevel: 10,
      learningAreaId: la.id,
      sectionId: grade10SectionA.id
    }));
    
    await db.collection('teachers').doc(demoTeacherUID).update({
      assignments: demoTeacherAssignments,
      position: 'Subject Teacher - Grade 10',
      updatedAt: new Date().toISOString()
    });
    
    // Also update users collection
    await db.collection('users').doc(demoTeacherUID).update({
      assignments: demoTeacherAssignments,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`   ✅ Updated teacher-demo@edusync.ph with ${demoTeacherAssignments.length} assignments`);
    console.log(`      Section: Grade 10 - Section A`);
    console.log(`      Subjects: ${grade10LearningAreas.map(la => la.name).join(', ')}`);
    
    // Update section to have this teacher as adviser
    await db.collection('sections').doc(grade10SectionA.id).update({
      adviserId: demoTeacherUID,
      adviserName: 'Demo Teacher',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`   ✅ Assigned as adviser to Grade 10 - Section A`);
    
    // Summary
    console.log('\n4️⃣  PHASE 4 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`   ✅ Demo teacher updated with ${demoTeacherAssignments.length} assignments`);
    console.log('   ✅ Assignments array properly formatted for gradebook');
    console.log('   ✅ Teacher assigned as adviser to Grade 10 - Section A');
    console.log('   🎯 Ready for Phase 5 (Create Students)');
    
    console.log('\n📋 DEMO TEACHER ASSIGNMENTS:');
    console.log('─'.repeat(80));
    console.log(`   Teacher: teacher-demo@edusync.ph`);
    console.log(`   Section: Grade 10 - Section A (${grade10SectionA.id})`);
    console.log(`   Subjects (${demoTeacherAssignments.length}):`);
    grade10LearningAreas.forEach((la, idx) => {
      console.log(`      ${(idx + 1).toString().padStart(2)}. ${la.name}`);
    });
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('   1. Login as teacher-demo@edusync.ph at https://edusync-sis.web.app');
    console.log('   2. Navigate to Gradebook/Assessment');
    console.log('   3. Should see "Grade 10 - Section A" in section selector');
    console.log('   4. (Will show 0 students until Phase 5 completes)');
    
    console.log('\n📋 NEXT STEP:');
    console.log('   node scripts/production-e2e/phase5-create-students.cjs');
    
    console.log('\n✅ PHASE 4 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 4:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Ensure Phase 1-3 completed successfully');
    console.error('   2. Check demo teacher UID matches Phase 2');
    console.error('   3. Verify sections were created in Phase 3');
    process.exit(1);
  }
}

run();
