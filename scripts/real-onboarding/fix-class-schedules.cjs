/**
 * FIX CRITICAL BUG: Create classSchedules collection
 * 
 * PROBLEM:
 * - Phase 4 only created teacher.assignments[] array
 * - Dashboard and Gradebook rely on classSchedules collection to determine which students teachers can see
 * - Teachers see 0 students because no classSchedules exist
 * 
 * SOLUTION:
 * - Read teacher assignments from teachers collection
 * - Create corresponding classSchedules documents
 * 
 * Date: November 17, 2025
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

async function createClassSchedules() {
  console.log('\n🔧 FIX: CREATE CLASS SCHEDULES\n');
  console.log('This creates the classSchedules collection that links teachers to sections.\n');
  
  // Get school
  const schoolsSnap = await db.collection('schools').limit(1).get();
  if (schoolsSnap.empty) {
    console.log('❌ No school found!');
    return;
  }
  
  const schoolDoc = schoolsSnap.docs[0];
  const schoolId = schoolDoc.id;
  const schoolData = schoolDoc.data();
  
  console.log(`📍 School: ${schoolData.name} (${schoolId})\n`);
  
  // Get all teachers with assignments
  const teachersSnap = await db.collection('teachers')
    .where('schoolId', '==', schoolId)
    .get();
  
  if (teachersSnap.empty) {
    console.log('❌ No teachers found!');
    return;
  }
  
  let scheduleCount = 0;
  const batch = db.batch();
  
  for (const teacherDoc of teachersSnap.docs) {
    const teacher = teacherDoc.data();
    const teacherId = teacherDoc.id;
    const teacherName = teacher.name || teacher.email;
    
    console.log(`👨‍🏫 ${teacherName}:`);
    
    if (!teacher.assignments || teacher.assignments.length === 0) {
      console.log('   ⚠️  No assignments found\n');
      continue;
    }
    
    // Create a classSchedule for each assignment
    for (const assignment of teacher.assignments) {
      const scheduleId = `cs_${Date.now()}_${scheduleCount}`;
      
      // Find the learning area to get its ID
      const learningAreasSnap = await db.collection('learningAreas')
        .where('name', '==', assignment.learningArea)
        .limit(1)
        .get();
      
      const learningAreaId = !learningAreasSnap.empty 
        ? learningAreasSnap.docs[0].id 
        : `la_${assignment.learningArea.toLowerCase().replace(/\s+/g, '_')}`;
      
      const schedule = {
        id: scheduleId,
        schoolId: schoolId,
        title: `${assignment.learningArea} - ${assignment.sectionName}`,
        type: 'academic',
        dayOfWeek: 'Monday', // Default day
        startTime: '08:00',
        endTime: '09:00',
        scope: 'section',
        sectionId: assignment.sectionId,
        learningAreaId: learningAreaId,
        teacherId: teacherId,
        gradeLevel: assignment.gradeLevel,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const scheduleRef = db.collection('classSchedules').doc(scheduleId);
      batch.set(scheduleRef, schedule);
      
      scheduleCount++;
      console.log(`   ✅ ${assignment.learningArea} → ${assignment.sectionName}`);
    }
    
    console.log('');
  }
  
  // Commit all schedules
  await batch.commit();
  
  console.log('='.repeat(60));
  console.log('✅ FIX COMPLETE: Class Schedules Created!');
  console.log('='.repeat(60));
  console.log(`\n📊 Created ${scheduleCount} class schedules`);
  console.log('\n🎯 Impact:');
  console.log('   - Teachers can now see their students in dashboard');
  console.log('   - Gradebook will show students');
  console.log('   - Student list will appear correctly');
  console.log('\n📝 Next: Refresh the browser and check dashboard\n');
}

createClassSchedules().catch(console.error);
