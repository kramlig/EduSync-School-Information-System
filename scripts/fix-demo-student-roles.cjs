#!/usr/bin/env node
const admin = require('firebase-admin');

delete process.env.FIRESTORE_EMULATOR_HOST;
admin.initializeApp({ projectId: 'edusync-sis' });
const auth = admin.auth();

const DEMO_STUDENTS = [
  'juan.delacruz@student.local',
  'maria.santos@student.local',
  'jose.reyes@student.local',
  'ana.garcia@student.local',
  'pedro.lopez@student.local'
];

async function fixCustomClaims() {
  console.log('🔧 Fixing custom claims for demo students...\n');
  
  for (const email of DEMO_STUDENTS) {
    try {
      const user = await auth.getUserByEmail(email);
      
      // Force set to student role
      await auth.setCustomUserClaims(user.uid, {
        role: 'student',
        schoolId: 'default'
      });
      
      console.log(`✅ ${email} → role: 'student'`);
    } catch (error) {
      console.error(`❌ ${email}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Custom claims fixed! Please log out and log back in for changes to take effect.');
  process.exit(0);
}

fixCustomClaims();
