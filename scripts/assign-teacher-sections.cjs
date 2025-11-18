#!/usr/bin/env node
/**
 * Assign teacher@edusync-demo.ph to sections
 * Make them adviser of 2 sections so gradebook will work
 */

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId: 'edusync-staging' });
  const db = getFirestore();
  
  console.log('\n👩‍🏫 ASSIGNING TEACHER TO SECTIONS\n');
  
  // Get teacher ID
  const teachersSnapshot = await db.collection('teachers')
    .where('email', '==', 'teacher@edusync-demo.ph')
    .get();
  
  const teacherId = teachersSnapshot.docs[0].id;
  console.log(`Teacher ID: ${teacherId}`);
  
  // Get 2 sections that need advisers or have generic adviser
  const sections = await db.collection('sections')
    .where('schoolId', '==', 'default')
    .limit(3)
    .get();
  
  console.log(`\nAssigning teacher as adviser to sections:\n`);
  
  const batch = db.batch();
  let count = 0;
  
  for (const doc of sections.docs.slice(0, 2)) {
    const section = doc.data();
    console.log(`  ✅ Grade ${section.gradeLevel}-${section.name} (${doc.id})`);
    
    batch.update(doc.ref, { adviserId: teacherId });
    count++;
    
    // Count students
    const students = await db.collection('students')
      .where('sectionId', '==', doc.id)
      .get();
    console.log(`     Students in section: ${students.size}`);
  }
  
  await batch.commit();
  
  console.log(`\n✅ Teacher now assigned as adviser to ${count} sections`);
  console.log(`\n🎉 Gradebook should now work for teacher@edusync-demo.ph!\n`);
}

run().catch(console.error);
