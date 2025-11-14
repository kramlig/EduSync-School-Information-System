#!/usr/bin/env node
const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({ projectId: 'edusync-sis' });
const auth = admin.auth();

const TEACHERS = [
  'maria.cruz@teacher.local',
  'juan.santos@teacher.local',
  'ana.reyes@teacher.local'
];

async function fixTeacherRoles() {
  console.log('🔧 Fixing teacher custom claims...\n');
  
  for (const email of TEACHERS) {
    try {
      const user = await auth.getUserByEmail(email);
      
      await auth.setCustomUserClaims(user.uid, {
        role: 'teacher',
        schoolId: 'default'
      });
      
      console.log(`✅ ${email} → role: 'teacher'`);
    } catch (error) {
      console.error(`❌ ${email}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Teacher roles fixed! User must log out and log back in.');
  process.exit(0);
}

fixTeacherRoles();
