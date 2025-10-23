#!/usr/bin/env node
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

delete process.env.FIRESTORE_EMULATOR_HOST;
initializeApp({ projectId: 'edusync-sis' });
const db = getFirestore();

async function check() {
  const teachersSnap = await db.collection('teachers')
    .where('assignments', '!=', null)
    .limit(5)
    .get();
  
  console.log('\n📋 Teachers with Assignments:\n');
  
  teachersSnap.docs.forEach(doc => {
    const t = doc.data();
    const grades = t.assignments?.map(a => a.gradeLevel).join(', ') || 'none';
    const subjects = t.assignments?.map(a => a.learningAreaId).join(', ') || 'none';
    console.log(`👨‍🏫 ${t.name} (${t.email})`);
    console.log(`   Grade Levels: ${grades}`);
    console.log(`   Subjects: ${subjects}`);
    console.log('');
  });
  
  process.exit(0);
}

check().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
