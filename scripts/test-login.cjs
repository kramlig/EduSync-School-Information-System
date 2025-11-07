// Test script to verify Ana Reyes login
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Set emulator before initialization
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const app = initializeApp({ projectId: 'edusync-local' });
const db = getFirestore(app);

async function testLogin() {
  console.log('🔍 Testing Ana Reyes login query...\n');
  
  const email = 'ana.reyes@edusync.local';
  const collectionName = 'teachers';
  
  try {
    console.log(`1️⃣ Querying collection: ${collectionName}`);
    console.log(`2️⃣ Searching for email: ${email}`);
    
    const snapshot = await db
      .collection(collectionName)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    console.log(`3️⃣ Query result: ${snapshot.size} document(s) found\n`);
    
    if (snapshot.empty) {
      console.log('❌ NO DOCUMENTS FOUND');
      console.log('   Checking all teachers in collection...\n');
      
      const allTeachers = await db.collection('teachers').get();
      console.log(`   Total teachers in collection: ${allTeachers.size}`);
      
      allTeachers.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.firstName} ${data.lastName} (${data.email})`);
      });
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('✅ DOCUMENT FOUND:');
        console.log(`   ID: ${doc.id}`);
        console.log(`   Name: ${data.firstName} ${data.lastName}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Specialization: ${data.specialization}`);
        console.log(`   Grade Levels: ${JSON.stringify(data.gradeLevels)}`);
        console.log(`   Assignments: ${data.assignments?.length || 0} classes`);
        
        if (data.assignments && data.assignments.length > 0) {
          console.log('\n   📚 Class Assignments:');
          data.assignments.forEach(a => {
            console.log(`      - Grade ${a.gradeLevel}: ${a.learningAreaName} (${a.learningAreaId})`);
          });
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testLogin();
