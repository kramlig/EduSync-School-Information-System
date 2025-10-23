#!/usr/bin/env node
/**
 * Add assignments to class adviser teachers based on their sections
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

delete process.env.FIRESTORE_EMULATOR_HOST;
initializeApp({ projectId: 'edusync-sis' });
const db = getFirestore();

async function addAssignments() {
  console.log('\n📝 Adding assignments to class adviser teachers...\n');
  
  // Get all sections with advisers
  const sectionsSnap = await db.collection('sections').get();
  
  // Group sections by adviser
  const adviserSections = new Map();
  for (const doc of sectionsSnap.docs) {
    const section = doc.data();
    if (section.adviserId) {
      if (!adviserSections.has(section.adviserId)) {
        adviserSections.set(section.adviserId, []);
      }
      adviserSections.get(section.adviserId).push(section);
    }
  }
  
  // Get all learning areas
  const laSnap = await db.collection('learningAreas').get();
  const learningAreas = laSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`Found ${adviserSections.size} teachers with sections\n`);
  
  const batch = db.batch();
  let count = 0;
  
  for (const [teacherId, sections] of adviserSections.entries()) {
    const teacherRef = db.collection('teachers').doc(teacherId);
    const teacherSnap = await teacherRef.get();
    
    if (!teacherSnap.exists) {
      console.log(`⚠️  Teacher ${teacherId} not found, skipping`);
      continue;
    }
    
    const teacher = teacherSnap.data();
    const gradeLevels = [...new Set(sections.map(s => s.gradeLevel))];
    
    // Assign all subjects for their grade level(s)
    const assignments = [];
    for (const gradeLevel of gradeLevels) {
      // Get appropriate subjects for this grade level
      const subjects = learningAreas.filter(la => {
        if (!la.gradeLevel || !Array.isArray(la.gradeLevel)) return true;
        return la.gradeLevel.includes(gradeLevel);
      });
      
      // Add assignments for 2-3 random subjects per grade level
      const numSubjects = Math.min(3, subjects.length);
      const selectedSubjects = subjects.sort(() => Math.random() - 0.5).slice(0, numSubjects);
      
      for (const subject of selectedSubjects) {
        assignments.push({
          gradeLevel,
          learningAreaId: subject.id
        });
      }
    }
    
    batch.update(teacherRef, { assignments });
    console.log(`✅ ${teacher.name}: ${gradeLevels.join(', ')} - ${assignments.length} assignments`);
    count++;
  }
  
  if (count > 0) {
    await batch.commit();
    console.log(`\n✅ Updated ${count} teachers with assignments!`);
  }
  
  // Show example
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Example Teacher (for testing):\n');
  
  const exampleTeacher = await db.collection('teachers').doc('teacher_elem_1').get();
  if (exampleTeacher.exists) {
    const t = exampleTeacher.data();
    console.log(`👨‍🏫 ${t.name} (${t.email})`);
    console.log(`   Password: Use any password (debug mode)`);
    console.log(`   Assignments:`);
    t.assignments?.forEach(a => {
      const la = learningAreas.find(l => l.id === a.learningAreaId);
      console.log(`      - Grade ${a.gradeLevel}: ${la?.name || a.learningAreaId}`);
    });
  }
}

addAssignments()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  });
