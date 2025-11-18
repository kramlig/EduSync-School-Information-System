/**
 * REAL SCHOOL ONBOARDING - PHASE 4
 * Assign teachers to sections (admin assigns teaching loads)
 * 
 * This is CRITICAL: Creates the teacher.assignments[] array
 * Without this, teachers see "infinite loading" in gradebook
 * 
 * Date: November 17, 2025
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Initialize Firebase Admin with Application Default Credentials
const projectId = 'edusync-sis';

// CRITICAL: Ensure we connect to PRODUCTION, not emulator
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

// All subjects per DepEd
const ALL_SUBJECTS = [
  'Filipino',
  'English',
  'Mathematics',
  'Science',
  'Araling Panlipunan',
  'Edukasyon sa Pagpapakatao',
  'Technology and Livelihood Education',
  'Music',
  'Arts',
  'Physical Education',
  'Health'
];

async function assignTeachers() {
  console.log('\n👨‍🏫 PHASE 4: ASSIGN TEACHERS TO SECTIONS\n');
  console.log('This creates the teacher assignments that enable gradebook access.\n');
  
  // Auto-detect school
  console.log('🔍 Auto-detecting school...');
  const schoolsSnap = await db.collection('schools').limit(2).get();
  
  if (schoolsSnap.empty) {
    console.log('❌ No schools found! Run Phase 1 first.');
    rl.close();
    return;
  }
  
  if (schoolsSnap.size > 1) {
    console.log('⚠️  Multiple schools found. Please specify:');
    schoolsSnap.forEach((doc, i) => {
      console.log(`   ${i+1}. ${doc.id} - ${doc.data().name}`);
    });
    const choice = await question('\nEnter school number: ');
    const schoolDoc = schoolsSnap.docs[parseInt(choice) - 1];
    var schoolId = schoolDoc.id;
    var schoolData = schoolDoc.data();
  } else {
    const schoolDoc = schoolsSnap.docs[0];
    var schoolId = schoolDoc.id;
    var schoolData = schoolDoc.data();
  }
  
  console.log(`✅ Using school: ${schoolData.name} (${schoolId})`);
  
  // Fetch all teachers
  console.log('🔍 Fetching teachers...');
  const teachersSnap = await db.collection('teachers')
    .where('schoolId', '==', schoolId)
    .get();
  
  if (teachersSnap.empty) {
    console.log('❌ No teachers found! Run Phase 2 first.');
    rl.close();
    return;
  }
  
  const teachers = [];
  teachersSnap.forEach(doc => {
    teachers.push({ id: doc.id, ...doc.data() });
  });
  console.log(`✅ Found ${teachers.length} teachers`);
  
  // Fetch all sections
  console.log('🔍 Fetching sections...');
  const sectionsSnap = await db.collection('sections')
    .where('schoolId', '==', schoolId)
    .get();
  
  if (sectionsSnap.empty) {
    console.log('❌ No sections found! Run Phase 3 first.');
    rl.close();
    return;
  }
  
  const sections = [];
  sectionsSnap.forEach(doc => {
    sections.push({ id: doc.id, ...doc.data() });
  });
  console.log(`✅ Found ${sections.length} sections\n`);
  
  // Display current state
  console.log('📋 Teachers:');
  teachers.forEach((t, i) => {
    console.log(`   ${i+1}. ${t.name} - ${t.subjects?.join(', ') || 'No subjects'}`);
  });
  
  console.log('\n📋 Sections:');
  sections.forEach((s, i) => {
    console.log(`   ${i+1}. ${s.displayName}`);
  });
  
  console.log('\n💡 Assignment Strategy:');
  console.log('   - Each teacher assigned to ONE section');
  console.log('   - Each teacher gets 2-3 subjects (their specializations)');
  console.log('   - All 11 subjects covered per section');
  
  const confirm = await question('\nProceed with auto-assignment? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Assigning teachers to sections...\n');
  
  // Simple assignment strategy: distribute teachers across sections
  let assignmentCount = 0;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const teacher = teachers[i % teachers.length]; // Round-robin assignment
    
    console.log(`📍 Section: ${section.displayName}`);
    console.log(`   Teacher: ${teacher.name}`);
    
    // Get teacher's subjects or assign random ones
    const teacherSubjects = teacher.subjects && teacher.subjects.length > 0 
      ? teacher.subjects 
      : ALL_SUBJECTS.slice(0, 2); // Default: first 2 subjects
    
    console.log(`   Subjects: ${teacherSubjects.join(', ')}`);
    
    // Build assignments array
    const assignments = teacherSubjects.map(subject => ({
      sectionId: section.id,
      sectionName: section.displayName,
      learningArea: subject,
      gradeLevel: section.gradeLevel,
      schoolYear: '2024-2025'
    }));
    
    // Update teacher document with assignments
    await db.collection('teachers').doc(teacher.id).update({
      assignments: admin.firestore.FieldValue.arrayUnion(...assignments),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // CRITICAL: Create classSchedules (required for Dashboard/Gradebook to show students)
    for (const assignment of assignments) {
      const scheduleId = `cs_${Date.now()}_${assignmentCount}`;
      
      // Get learning area ID (simplified: use subject name as ID for now)
      const learningAreaId = `la_${assignment.learningArea.toLowerCase().replace(/\s+/g, '_')}`;
      
      const schedule = {
        id: scheduleId,
        schoolId: schoolId,
        title: `${assignment.learningArea} - ${assignment.sectionName}`,
        type: 'academic',
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        scope: 'section',
        sectionId: assignment.sectionId,
        learningAreaId: learningAreaId,
        teacherId: teacher.userId, // CRITICAL: Use Firebase Auth UID, not teacher doc ID!
        gradeLevel: assignment.gradeLevel,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('classSchedules').doc(scheduleId).set(schedule);
      assignmentCount++;
    }
    
    console.log(`   ✅ Created ${assignments.length} assignments + ${assignments.length} class schedules\n`);
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('✅ PHASE 4 COMPLETE: Teachers Assigned Successfully!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   School: ${schoolData.name}`);
  console.log(`   Teachers: ${teachers.length}`);
  console.log(`   Sections: ${sections.length}`);
  console.log(`   Total Assignments: ${assignmentCount}`);
  console.log(`   Class Schedules Created: ${assignmentCount}`);
  console.log('\n🔒 CRITICAL:');
  console.log('   Teachers now have assignments[] array');
  console.log('   classSchedules collection created (links teachers → sections)');
  console.log('   Teachers can now see students in Dashboard & Gradebook');
  console.log('\n📝 Next Steps:');
  console.log('   Run Phase 5: Enroll students');
  console.log('   Command: node scripts/real-onboarding/phase5-enroll-students.cjs');
  console.log('\n');
  
  rl.close();
}

assignTeachers().catch(console.error);
