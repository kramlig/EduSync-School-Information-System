const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

async function checkAndFixParent1() {
  try {
    // First, find parent1's UID
    const authUser = await admin.auth().getUserByEmail('parent1@edusync-demo.ph');
    console.log('Parent1 UID:', authUser.uid);
    
    // Check parent document
    const parentDoc = await db.collection('parents').doc(authUser.uid).get();
    
    if (parentDoc.exists) {
      const data = parentDoc.data();
      console.log('\n=== CURRENT PARENT DATA ===');
      console.log('Name:', data.name);
      console.log('Email:', data.email);
      console.log('Number of children:', data.studentIds?.length || 0);
      console.log('Student IDs:', data.studentIds);
      
      // Get student details
      if (data.studentIds && data.studentIds.length > 0) {
        console.log('\n=== CHILDREN DETAILS ===');
        for (const studentId of data.studentIds.slice(0, 5)) {
          const studentDoc = await db.collection('students').doc(studentId).get();
          if (studentDoc.exists) {
            const student = studentDoc.data();
            console.log(`- ${student.name} (Grade ${student.gradeLevel})`);
          }
        }
        if (data.studentIds.length > 5) {
          console.log(`... and ${data.studentIds.length - 5} more`);
        }
      }
      
      // Fix: Keep only first 2 children (realistic)
      if (data.studentIds && data.studentIds.length > 2) {
        console.log('\n=== FIXING PARENT1 ===');
        const realisticChildren = data.studentIds.slice(0, 2);
        
        await db.collection('parents').doc(authUser.uid).update({
          studentIds: realisticChildren
        });
        
        console.log('✅ Updated parent1 to have only 2 children');
        console.log('New student IDs:', realisticChildren);
        
        // Show updated children
        console.log('\n=== NEW CHILDREN ===');
        for (const studentId of realisticChildren) {
          const studentDoc = await db.collection('students').doc(studentId).get();
          if (studentDoc.exists) {
            const student = studentDoc.data();
            console.log(`- ${student.name} (Grade ${student.gradeLevel})`);
          }
        }
      } else {
        console.log('\n✅ Parent already has realistic number of children');
      }
    } else {
      console.log('❌ Parent document not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkAndFixParent1();
