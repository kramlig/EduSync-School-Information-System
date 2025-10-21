const admin = require('firebase-admin');

// Use Application Default Credentials for production
// Make sure you're logged in with: firebase login
const projectId = 'edusync-sis';

admin.initializeApp({
  projectId: projectId,
});

const db = admin.firestore();

async function checkAssignments() {
  try {
    console.log(`Checking assignments in project: ${projectId}\n`);
    
    // Get all assignments
    const assignmentsSnapshot = await db.collection('assignments').get();
    
    console.log(`Total assignments found: ${assignmentsSnapshot.size}\n`);
    
    if (assignmentsSnapshot.empty) {
      console.log('❌ No assignments exist in Firestore!');
      console.log('The collection will be created when the first assignment is added.\n');
    } else {
      console.log('✅ Assignments exist:\n');
      assignmentsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   Title: ${data.title}`);
        console.log(`   Section: ${data.sectionId}`);
        console.log(`   Learning Area: ${data.learningAreaId}`);
        console.log(`   Due Date: ${data.dueDate}`);
        console.log(`   Created: ${data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString() : 'N/A'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAssignments();
