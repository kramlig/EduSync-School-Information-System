/**
 * Fix: Restore correct superadmin custom claims
 */

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

const projectId = 'edusync-sis';
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const auth = getAuth();

async function fixAdminRole() {
  console.log('\n🔧 FIXING ADMIN.LIPA CUSTOM CLAIMS\n');
  
  const authUser = await auth.getUserByEmail('admin.lipa@edusync.ph');
  
  console.log('Current custom claims:');
  console.log(JSON.stringify(authUser.customClaims, null, 2));
  
  // Set correct claims
  await auth.setCustomUserClaims(authUser.uid, {
    role: 'admin', // School admin (not platform superadmin)
    schoolId: 'lipa-city-elementary-school'
  });
  
  console.log('\n✅ Custom claims updated to:');
  console.log('   role: admin');
  console.log('   schoolId: lipa-city-elementary-school');
  
  console.log('\n📝 Note: Changed from "superadmin" to "admin"');
  console.log('   - "superadmin" = Platform management (EduSync staff)');
  console.log('   - "admin" = School administrator (school principal/registrar)');
  console.log('\n🔄 User must logout and login again for changes to take effect\n');
}

fixAdminRole().catch(console.error);
