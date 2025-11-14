const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

async function fixAllParents() {
  try {
    console.log('Fixing all parent accounts to have realistic number of children...\n');
    
    const parentEmails = [
      'parent1@edusync-demo.ph',
      'parent2@edusync-demo.ph',
      'parent3@edusync-demo.ph',
      'parent4@edusync-demo.ph',
      'parent5@edusync-demo.ph',
      'parent6@edusync-demo.ph',
      'parent7@edusync-demo.ph',
      'parent8@edusync-demo.ph',
      'parent9@edusync-demo.ph',
      'parent10@edusync-demo.ph'
    ];
    
    for (const email of parentEmails) {
      try {
        const authUser = await admin.auth().getUserByEmail(email);
        const parentDoc = await db.collection('parents').doc(authUser.uid).get();
        
        if (parentDoc.exists) {
          const data = parentDoc.data();
          const currentCount = data.studentIds?.length || 0;
          
          // Assign realistic number: 1-3 children
          let childrenToKeep;
          const parentNum = parseInt(email.match(/\d+/)[0]);
          
          if (parentNum <= 3) {
            childrenToKeep = 2; // Parents 1-3 have 2 children
          } else if (parentNum <= 7) {
            childrenToKeep = 1; // Parents 4-7 have 1 child
          } else {
            childrenToKeep = 3; // Parents 8-10 have 3 children
          }
          
          if (currentCount !== childrenToKeep && data.studentIds) {
            const newStudentIds = data.studentIds.slice(0, childrenToKeep);
            
            // Update parents collection
            await db.collection('parents').doc(authUser.uid).update({
              studentIds: newStudentIds
            });
            
            // Update users collection
            await db.collection('users').doc(authUser.uid).update({
              studentIds: newStudentIds
            });
            
            console.log(`✅ ${email}: ${currentCount} → ${childrenToKeep} children`);
            
            // Show children names
            for (const studentId of newStudentIds) {
              const studentDoc = await db.collection('students').doc(studentId).get();
              if (studentDoc.exists) {
                const student = studentDoc.data();
                console.log(`   - ${student.name} (Grade ${student.gradeLevel})`);
              }
            }
            console.log('');
          } else {
            console.log(`✓ ${email}: Already has ${childrenToKeep} children (no change needed)`);
          }
        }
      } catch (err) {
        console.log(`⚠️  ${email}: ${err.message}`);
      }
    }
    
    console.log('\n✅ All parents updated to have realistic number of children');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

fixAllParents();
