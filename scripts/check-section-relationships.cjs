#!/usr/bin/env node
/**
 * Check current section relationships (adviser + students)
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'edusync-sis';

initializeApp({ projectId });
const db = getFirestore();

async function check() {
  console.log(`\n[Check] Checking sections with advisers and students...\n`);
  
  // Get all sections
  const sectionsSnap = await db.collection('sections').limit(10).get();
  
  if (sectionsSnap.empty) {
    console.log('❌ No sections found in database!');
    return;
  }
  
  console.log(`Found ${sectionsSnap.size} sections:\n`);
  
  for (const doc of sectionsSnap.docs) {
    const section = doc.data();
    console.log(`\n📚 Section: Grade ${section.gradeLevel} - ${section.name} (${doc.id})`);
    
    // Check if has adviser
    if (section.adviserId) {
      const adviserSnap = await db.collection('teachers').doc(section.adviserId).get();
      if (adviserSnap.exists) {
        const adviser = adviserSnap.data();
        console.log(`   👨‍🏫 Class Adviser: ${adviser.name} (${adviser.email})`);
      } else {
        console.log(`   ⚠️  Adviser ID exists but teacher not found: ${section.adviserId}`);
      }
    } else {
      console.log(`   ❌ No class adviser assigned`);
    }
    
    // Check students in this section
    const studentsSnap = await db.collection('students')
      .where('sectionId', '==', doc.id)
      .limit(5)
      .get();
    
    if (!studentsSnap.empty) {
      console.log(`   👥 Students (showing first 5 of ${studentsSnap.size}):`);
      studentsSnap.docs.forEach((studentDoc, i) => {
        const student = studentDoc.data();
        console.log(`      ${i+1}. ${student.name} (${student.email || student.lrn})`);
      });
    } else {
      console.log(`   ❌ No students in this section`);
    }
  }
  
  // Summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const teachersSnap = await db.collection('teachers').limit(1).get();
  const studentsSnap = await db.collection('students').limit(1).get();
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   Teachers: ${teachersSnap.size > 0 ? '✅ Found' : '❌ None'}`);
  console.log(`   Sections: ${sectionsSnap.size} found`);
  console.log(`   Students: ${studentsSnap.size > 0 ? '✅ Found' : '❌ None'}`);
}

check()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  });
