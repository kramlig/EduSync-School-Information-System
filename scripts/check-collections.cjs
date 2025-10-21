const admin = require('firebase-admin');

// Initialize with production credentials
admin.initializeApp({
  projectId: 'edusync-sis',
});

const db = admin.firestore();

async function checkCollections() {
  console.log('Checking Firestore collections...\n');
  
  const collections = await db.listCollections();
  console.log('Existing collections:');
  collections.forEach(col => console.log(`  - ${col.id}`));
  
  console.log('\n---\n');
  
  // Check if assignments collection exists
  const assignmentsSnapshot = await db.collection('assignments').limit(1).get();
  console.log(`Assignments collection exists: ${!assignmentsSnapshot.empty}`);
  console.log(`Assignments count (sample): ${assignmentsSnapshot.size}`);
  
  // Get actual count
  const assignmentsCount = await db.collection('assignments').count().get();
  console.log(`Total assignments: ${assignmentsCount.data().count}`);
  
  // Check studentAssignmentGrades
  const gradesSnapshot = await db.collection('studentAssignmentGrades').limit(1).get();
  console.log(`\nStudentAssignmentGrades collection exists: ${!gradesSnapshot.empty}`);
  const gradesCount = await db.collection('studentAssignmentGrades').count().get();
  console.log(`Total studentAssignmentGrades: ${gradesCount.data().count}`);
  
  process.exit(0);
}

checkCollections().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
