const admin = require('firebase-admin');

console.log('🔍 Checking schools collection in emulator...\n');

const app = admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore(app);
db.settings({
  host: '127.0.0.1',
  port: 8086,
  ssl: false
});

async function checkSchools() {
  try {
    // Check schools collection
    const schoolsSnap = await db.collection('schools').get();
    console.log(`📚 Schools found: ${schoolsSnap.size}\n`);
    
    if (schoolsSnap.empty) {
      console.log('❌ NO SCHOOLS COLLECTION FOUND!\n');
    } else {
      schoolsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`✅ School: ${doc.id}`);
        console.log(`   Name: ${data.name}`);
        console.log(`   School ID: ${data.schoolId}`);
        console.log('');
      });
    }
    
    // Check teachers with schoolId
    const teachersSnap = await db.collection('teachers').limit(5).get();
    console.log(`👨‍🏫 Sample teachers (showing schoolId):\n`);
    teachersSnap.forEach(doc => {
      const data = doc.data();
      console.log(`   ${data.email} → schoolId: ${data.schoolId || 'MISSING'}`);
    });
    
    // Check students with schoolId
    const studentsSnap = await db.collection('students').limit(5).get();
    console.log(`\n👨‍🎓 Sample students (showing schoolId):\n`);
    studentsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`   ${data.firstName} ${data.lastName} → schoolId: ${data.schoolId || 'MISSING'}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkSchools();
