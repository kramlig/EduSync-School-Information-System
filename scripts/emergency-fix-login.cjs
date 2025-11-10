const admin = require('firebase-admin');
const { readFileSync } = require('fs');

console.log('🔧 EMERGENCY FIX: Directly insert login account into running emulator\n');

// Initialize admin SDK pointing to emulator
const app = admin.initializeApp({
  projectId: 'edusync-local'
});

// Configure to use emulator
admin.firestore(app).settings({
  host: '127.0.0.1:8086',
  ssl: false
});

const db = admin.firestore(app);
const auth = admin.auth(app);

// Configure Auth emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

async function emergencyFix() {
  try {
    console.log('📊 Checking current database state...');
    
    // Check teachers
    const teachersSnap = await db.collection('teachers').get();
    console.log(`   Teachers in database: ${teachersSnap.size}`);
    
    // Check if admin-school1 exists
    const adminSnap = await db.collection('teachers')
      .where('email', '==', 'admin-school1@test.com')
      .get();
    
    if (!adminSnap.empty) {
      console.log('✅ admin-school1@test.com already exists!');
      const doc = adminSnap.docs[0];
      console.log('   Document ID:', doc.id);
      console.log('   Data:', doc.data());
      return;
    }
    
    console.log('\n❌ admin-school1@test.com NOT FOUND!');
    console.log('🔧 Creating emergency admin account...\n');
    
    // Create in Auth
    let uid;
    try {
      const userRecord = await auth.createUser({
        email: 'admin-school1@test.com',
        password: 'TestPass123!',
        displayName: 'Admin School 1'
      });
      uid = userRecord.uid;
      console.log('✅ Created in Firebase Auth, UID:', uid);
      
      // Set custom claims
      await auth.setCustomUserClaims(uid, {
        role: 'admin',
        schoolId: 'school-001'
      });
      console.log('✅ Set custom claims');
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        console.log('⚠️  Email exists in Auth, fetching user...');
        const user = await auth.getUserByEmail('admin-school1@test.com');
        uid = user.uid;
        await auth.setCustomUserClaims(uid, {
          role: 'admin',
          schoolId: 'school-001'
        });
      } else {
        throw err;
      }
    }
    
    // Create in Firestore
    await db.collection('teachers').doc(uid).set({
      email: 'admin-school1@test.com',
      firstName: 'Admin',
      lastName: 'School 1',
      role: 'admin',
      schoolId: 'school-001',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Created in Firestore teachers collection');
    
    // Verify
    const verifySnap = await db.collection('teachers')
      .where('email', '==', 'admin-school1@test.com')
      .get();
    
    console.log('\n📊 Verification:');
    console.log(`   Found ${verifySnap.size} documents`);
    verifySnap.forEach(doc => {
      console.log('   -', doc.id, doc.data());
    });
    
    console.log('\n✅ EMERGENCY FIX COMPLETE!');
    console.log('\n🔐 You can now login with:');
    console.log('   Email: admin-school1@test.com');
    console.log('   Password: TestPass123!');
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit(0);
  }
}

emergencyFix();
