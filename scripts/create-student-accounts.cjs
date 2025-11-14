/**
 * Create Firebase Auth accounts and users collection docs for demo students
 */

const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();
const auth = admin.auth();

const DEMO_STUDENTS = [
  {
    id: 'W0nWibNkePGk63mwBjvU',
    email: 'juan.lacruz@student.local',
    password: 'student123',
    firstName: 'Juan',
    lastName: 'La Cruz'
  },
  {
    id: 'KhRwaYUGT3LOU6zbZXSK',
    email: 'markgil.dotillos@student.local',
    password: 'student123',
    firstName: 'Mark Gil',
    lastName: 'Dotillos'
  }
];

async function createStudentAccounts() {
  console.log('🎓 Creating Firebase Auth and users docs for demo students...\n');
  
  const stats = { created: 0, updated: 0, errors: 0 };
  
  for (const student of DEMO_STUDENTS) {
    try {
      // Get student data from Firestore
      const studentDoc = await db.collection('students').doc(student.id).get();
      
      if (!studentDoc.exists) {
        console.log(`❌ Student ${student.id} not found in Firestore`);
        stats.errors++;
        continue;
      }
      
      const studentData = studentDoc.data();
      
      // 1. Create/update Firebase Auth account
      let authUser;
      try {
        authUser = await auth.getUserByEmail(student.email);
        console.log(`   Found existing auth for ${student.email}`);
        
        // Update with password
        await auth.updateUser(authUser.uid, {
          password: student.password,
          emailVerified: true
        });
        console.log(`   Updated password for ${student.email}`);
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new auth account
          authUser = await auth.createUser({
            uid: student.id,
            email: student.email,
            password: student.password,
            emailVerified: true,
            displayName: `${student.firstName} ${student.lastName}`
          });
          console.log(`   ✅ Created auth account for ${student.email}`);
          stats.created++;
        } else {
          throw error;
        }
      }
      
      // 2. Set custom claims
      await auth.setCustomUserClaims(authUser.uid, {
        role: 'student',
        schoolId: studentData.schoolId || 'default'
      });
      console.log(`   Set custom claims for ${student.email}`);
      
      // 3. Create/update users collection document
      const userData = {
        id: authUser.uid,
        email: student.email,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        role: 'student',
        schoolId: studentData.schoolId || 'default',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Only add optional fields if they exist
      if (studentData.sectionId) userData.sectionId = studentData.sectionId;
      if (studentData.gradeLevel) userData.gradeLevel = studentData.gradeLevel;
      
      await db.collection('users').doc(authUser.uid).set(userData, { merge: true });
      
      console.log(`   ✅ Created/updated users doc for ${student.email}\n`);
      stats.updated++;
      
    } catch (error) {
      console.error(`❌ Error for ${student.email}:`, error.message);
      stats.errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Auth Created: ${stats.created}`);
  console.log(`  ✅ Users Updated: ${stats.updated}`);
  console.log(`  ❌ Errors: ${stats.errors}`);
  console.log(`\n🔑 Password for all students: student123`);
  console.log('\n📧 Demo Student Accounts:');
  DEMO_STUDENTS.forEach(s => {
    console.log(`  - ${s.email} / ${s.password}`);
  });
  
  process.exit(0);
}

createStudentAccounts();
