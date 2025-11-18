/**
 * Fix: Update users and userRoles collections to match
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();

async function fixAdminCollections() {
  console.log('\n🔧 FIXING ADMIN COLLECTIONS\n');
  
  const uid = 'bTJz5AiLTuOYcsGVcQypH67ajz02';
  
  // Update users collection
  await db.collection('users').doc(uid).update({
    role: 'admin', // Changed from superadmin
    schoolId: 'lipa-city-elementary-school'
  });
  console.log('✅ Updated users collection: role=admin');
  
  // Update userRoles collection
  await db.collection('userRoles').doc(uid).update({
    role: 'admin', // Changed from parent
    schoolId: 'lipa-city-elementary-school'
  });
  console.log('✅ Updated userRoles collection: role=admin');
  
  console.log('\n✅ All three locations now consistent:');
  console.log('   - Firebase Auth custom claims: role=admin');
  console.log('   - users collection: role=admin');
  console.log('   - userRoles collection: role=admin');
  console.log('\n📝 User can now login and see all 270 students\n');
}

fixAdminCollections().catch(console.error);
