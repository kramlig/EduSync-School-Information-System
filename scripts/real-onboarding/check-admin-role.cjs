/**
 * Check admin.lipa role and custom claims
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = getFirestore();
const auth = getAuth();

async function checkAdmin() {
  console.log('\n🔍 CHECKING ADMIN.LIPA ROLE\n');
  
  // Get Firebase Auth user
  const authUser = await auth.getUserByEmail('admin.lipa@edusync.ph');
  
  console.log('🔐 Firebase Auth:');
  console.log(`   UID: ${authUser.uid}`);
  console.log(`   Email: ${authUser.email}`);
  console.log(`   Custom Claims: ${JSON.stringify(authUser.customClaims || {}, null, 2)}`);
  
  // Get users collection doc
  const userDoc = await db.collection('users').doc(authUser.uid).get();
  
  if (userDoc.exists) {
    const userData = userDoc.data();
    console.log('\n👤 Users Collection:');
    console.log(`   Role: ${userData.role}`);
    console.log(`   School ID: ${userData.schoolId || 'NONE'}`);
  }
  
  // Get userRoles doc
  const roleDoc = await db.collection('userRoles').doc(authUser.uid).get();
  
  if (roleDoc.exists) {
    const roleData = roleDoc.data();
    console.log('\n🔑 UserRoles Collection:');
    console.log(`   Role: ${roleData.role}`);
    console.log(`   School ID: ${roleData.schoolId || 'NONE'}`);
  }
  
  console.log('\n❓ WHAT SHOULD IT BE?');
  console.log('   Phase 1 created this as: role="superadmin"');
  console.log('   But superadmin should be PLATFORM admin, not school admin');
  console.log('   School admin should have role="admin" or "principal"\n');
}

checkAdmin().catch(console.error);
