#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 3: Create Sections
 * 
 * Creates 5 sections for Grade 7 and Grade 10
 * 
 * Sections:
 * - Grade 7: Section A, B, C (3 sections)
 * - Grade 10: Section A, B (2 sections)
 * 
 * Each section will hold 10 students (to be created in Phase 5)
 * 
 * Usage:
 *   node scripts/production-e2e/phase3-create-sections.cjs
 * 
 * Verification:
 *   - Login as admin-demo@edusync.ph
 *   - Navigate to Students → Sections
 *   - Should see 5 sections listed
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n📚 PHASE 3: CREATE SECTIONS');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    
    // Verify school exists
    console.log('\n1️⃣  Verifying demo school exists...');
    const schoolDoc = await db.collection('schools').doc(schoolId).get();
    if (!schoolDoc.exists) {
      throw new Error('Demo school not found! Run Phase 1 first.');
    }
    console.log('   ✅ Demo school found');
    
    // Define sections
    const sections = [
      // Grade 7 sections
      {
        id: 'demo_grade7_section_a',
        name: 'Grade 7 - Section A',
        gradeLevel: 7,
        section: 'A',
        capacity: 10,
        room: 'Room 7A'
      },
      {
        id: 'demo_grade7_section_b',
        name: 'Grade 7 - Section B',
        gradeLevel: 7,
        section: 'B',
        capacity: 10,
        room: 'Room 7B'
      },
      {
        id: 'demo_grade7_section_c',
        name: 'Grade 7 - Section C',
        gradeLevel: 7,
        section: 'C',
        capacity: 10,
        room: 'Room 7C'
      },
      
      // Grade 10 sections
      {
        id: 'demo_grade10_section_a',
        name: 'Grade 10 - Section A',
        gradeLevel: 10,
        section: 'A',
        capacity: 10,
        room: 'Room 10A'
      },
      {
        id: 'demo_grade10_section_b',
        name: 'Grade 10 - Section B',
        gradeLevel: 10,
        section: 'B',
        capacity: 10,
        room: 'Room 10B'
      }
    ];
    
    console.log('\n2️⃣  Creating sections...\n');
    
    for (const section of sections) {
      const sectionData = {
        id: section.id,
        schoolId: schoolId,
        name: section.name,
        gradeLevel: section.gradeLevel,
        section: section.section,
        room: section.room,
        capacity: section.capacity,
        
        // Adviser will be assigned in Phase 4
        adviserId: null,
        adviserName: null,
        
        // Students will be added in Phase 5
        studentCount: 0,
        
        // Status
        isActive: true,
        
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'production-e2e-setup'
      };
      
      await db.collection('sections').doc(section.id).set(sectionData);
      console.log(`   ✅ Created: ${section.name} (${section.id})`);
      console.log(`      Room: ${section.room}, Capacity: ${section.capacity}`);
    }
    
    // Verify creation
    console.log('\n3️⃣  Verifying sections...');
    const sectionsQuery = await db.collection('sections')
      .where('schoolId', '==', schoolId)
      .get();
    
    console.log(`   ✅ Total sections: ${sectionsQuery.size}`);
    
    // Group by grade level
    const grade7Sections = sectionsQuery.docs.filter(doc => doc.data().gradeLevel === 7);
    const grade10Sections = sectionsQuery.docs.filter(doc => doc.data().gradeLevel === 10);
    
    console.log(`   📊 Grade 7 sections: ${grade7Sections.length}`);
    console.log(`   📊 Grade 10 sections: ${grade10Sections.length}`);
    
    // Summary
    console.log('\n4️⃣  PHASE 3 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${sectionsQuery.size} sections created`);
    console.log('   ✅ All sections have schoolId: demo-e2e-testing');
    console.log('   ✅ Ready for students (Phase 5)');
    console.log('   🎯 Ready for Phase 4 (Create Teachers with Assignments)');
    
    console.log('\n📋 SECTIONS CREATED:');
    console.log('─'.repeat(80));
    console.log('   Grade 7:');
    grade7Sections.forEach(doc => {
      const section = doc.data();
      console.log(`      • ${section.name} (${section.room})`);
    });
    console.log('\n   Grade 10:');
    grade10Sections.forEach(doc => {
      const section = doc.data();
      console.log(`      • ${section.name} (${section.room})`);
    });
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('   1. Login as admin-demo@edusync.ph at https://edusync-sis.web.app');
    console.log('   2. Navigate to Students → Sections (or similar menu)');
    console.log('   3. Should see 5 sections listed');
    console.log('   4. Check Firebase Console:');
    console.log('      https://console.firebase.google.com/project/edusync-sis/firestore');
    console.log('      → Query: sections where schoolId == demo-e2e-testing');
    
    console.log('\n📋 NEXT STEP:');
    console.log('   node scripts/production-e2e/phase4-create-teachers.cjs');
    
    console.log('\n✅ PHASE 3 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 3:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Ensure Phase 1 completed successfully');
    console.error('   2. Check Firestore write permissions');
    console.error('   3. Verify schoolId matches Phase 1');
    process.exit(1);
  }
}

run();
