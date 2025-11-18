#!/usr/bin/env node
/**
 * CHECK PRODUCTION FIRESTORE STATUS
 * Shows what data remains after cleanup
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';

async function checkProduction() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n📊 PRODUCTION FIRESTORE STATUS');
  console.log('═'.repeat(80));

  const collections = [
    'schools', 'students', 'teachers', 'sections', 'grades', 'studentGrades',
    'coreValues', 'coreValueGrades', 'attendance', 'learningAreas',
    'assignments', 'announcements', 'lessonPlans', 'parents', 
    'users', 'userRoles', 'enrollments', 'payments', 'forms'
  ];

  let totalDocs = 0;

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    
    if (!snapshot.empty) {
      console.log(`\n📁 ${collectionName}: ${snapshot.size} documents`);
      
      // Show first 5 documents
      let shown = 0;
      for (const doc of snapshot.docs) {
        if (shown < 5) {
          const data = doc.data();
          console.log(`   - ${doc.id}: schoolId=${data.schoolId || 'N/A'}, ${Object.keys(data).slice(0, 3).join(', ')}`);
          shown++;
        }
      }
      if (snapshot.size > 5) {
        console.log(`   ... and ${snapshot.size - 5} more`);
      }
      
      totalDocs += snapshot.size;
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`📊 Total Documents: ${totalDocs}`);
  console.log('═'.repeat(80) + '\n');
}

checkProduction()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
