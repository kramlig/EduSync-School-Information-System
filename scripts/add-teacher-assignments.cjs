#!/usr/bin/env node
/**
 * Add Assignments Array to Teacher Document
 * 
 * The gradebook relies on teacher.assignments[] to filter visible students.
 * This script creates assignments based on:
 * 1. Sections where teacher is adviser (gets all subjects for that section)
 * 2. Class schedules where teacher teaches specific subjects
 */

const projectId = 'edusync-staging';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  try {
    const teacherUID = '87YNvPlX90RaB2MWtQzKWiG5Osp2';
    
    console.log('\n🔧 CREATING TEACHER ASSIGNMENTS ARRAY');
    console.log('═'.repeat(80));
    
    // 1. Get teacher document
    const teacherDoc = await db.collection('teachers').doc(teacherUID).get();
    const teacherData = teacherDoc.data();
    
    console.log(`\n👨‍🏫 Teacher: ${teacherData.firstName} ${teacherData.lastName}`);
    console.log('   Email:', teacherData.email);
    
    // 2. Find sections where teacher is adviser
    console.log('\n📚 Finding sections where teacher is adviser...');
    const adviserSectionsQuery = await db.collection('sections')
      .where('schoolId', '==', 'default')
      .where('adviserId', '==', teacherUID)
      .get();
    
    console.log(`   Found ${adviserSectionsQuery.size} sections`);
    
    // 3. Get all learning areas for these sections
    const assignments = [];
    
    for (const sectionDoc of adviserSectionsQuery.docs) {
      const section = sectionDoc.data();
      console.log(`\n   Section: ${section.name} (${sectionDoc.id})`);
      console.log(`      Grade Level: ${section.gradeLevel}`);
      
      // Get learning areas appropriate for this grade level
      const learningAreasQuery = await db.collection('learningAreas')
        .where('schoolId', '==', 'default')
        .get();
      
      const applicableLearningAreas = learningAreasQuery.docs.filter(doc => {
        const la = doc.data();
        // If no gradeLevel specified, include for all grades
        if (!la.gradeLevel || la.gradeLevel.length === 0) return true;
        
        // Check if section's grade is in the allowed list
        const sectionGrade = typeof section.gradeLevel === 'number' 
          ? section.gradeLevel 
          : parseInt(section.gradeLevel.replace(/\D/g, ''), 10) || 10;
        
        return la.gradeLevel.includes(sectionGrade);
      });
      
      console.log(`      Applicable Learning Areas: ${applicableLearningAreas.length}`);
      
      // Create assignment for each learning area in this section
      for (const laDoc of applicableLearningAreas) {
        const la = laDoc.data();
        assignments.push({
          gradeLevel: section.gradeLevel,
          learningAreaId: laDoc.id,
          sectionId: sectionDoc.id
        });
        
        console.log(`         - ${la.name} (${laDoc.id})`);
      }
    }
    
    // 4. Also check classSchedules for explicit assignments
    console.log('\n📅 Checking class schedules for additional assignments...');
    const schedulesQuery = await db.collection('classSchedules')
      .where('schoolId', '==', 'default')
      .where('teacherId', '==', teacherUID)
      .get();
    
    console.log(`   Found ${schedulesQuery.size} class schedules`);
    
    for (const scheduleDoc of schedulesQuery.docs) {
      const schedule = scheduleDoc.data();
      
      // Check if this assignment already exists
      const exists = assignments.some(a => 
        a.sectionId === schedule.sectionId && 
        a.learningAreaId === schedule.learningAreaId
      );
      
      if (!exists && schedule.sectionId && schedule.learningAreaId) {
        // Get section to get grade level
        const sectionDoc = await db.collection('sections').doc(schedule.sectionId).get();
        const section = sectionDoc.data();
        
        assignments.push({
          gradeLevel: section.gradeLevel,
          learningAreaId: schedule.learningAreaId,
          sectionId: schedule.sectionId
        });
        
        console.log(`      Added: ${schedule.sectionId} - ${schedule.learningAreaId}`);
      }
    }
    
    console.log('\n📊 ASSIGNMENT SUMMARY:');
    console.log('═'.repeat(80));
    console.log(`   Total Assignments: ${assignments.length}`);
    
    // Group by section
    const bySection = assignments.reduce((acc, assignment) => {
      if (!acc[assignment.sectionId]) {
        acc[assignment.sectionId] = [];
      }
      acc[assignment.sectionId].push(assignment);
      return acc;
    }, {});
    
    for (const [sectionId, sectionAssignments] of Object.entries(bySection)) {
      console.log(`\n   ${sectionId}: ${sectionAssignments.length} subjects`);
    }
    
    // 5. Update teacher document
    console.log('\n💾 Updating teacher document...');
    
    await db.collection('teachers').doc(teacherUID).update({
      assignments: assignments,
      updatedAt: new Date().toISOString()
    });
    
    console.log('   ✅ Teacher document updated!');
    
    console.log('\n🎉 SUCCESS!');
    console.log('═'.repeat(80));
    console.log(`   Teacher now has ${assignments.length} assignments`);
    console.log('   Gradebook should now load properly!');
    console.log('\n   Next step: Re-run grading diagnostic test to verify\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();
