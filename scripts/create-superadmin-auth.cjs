#!/usr/bin/env node
/**
 * Create Super Admin in Firebase Authentication
 * 
 * This script creates a super admin user with the necessary custom claims
 * for accessing School Management features.
 * 
 * Usage: node scripts/create-superadmin-auth.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for PRODUCTION
admin.initializeApp({
  projectId: 'edusync-sis'
});

const auth = admin.auth();

async function createSuperAdmin() {
  console.log('\n👑 Creating Super Admin in Firebase Authentication...\n');
  
  const email = 'superadmin@edusync-demo.ph';
  const password = 'admin123';
  
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('ℹ️  User already exists, updating...');
    } catch (error) {
      // User doesn't exist, create it
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: 'Super Admin',
        emailVerified: true
      });
      console.log('✅ Created user in Firebase Auth');
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      isSuperAdmin: true,
      schoolId: 'default',
      schoolIds: ['default']
    });
    
    console.log('✅ Set custom claims');
    console.log('\n📋 User Details:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   UID:', userRecord.uid);
    console.log('   Role: superadmin');
    console.log('   isSuperAdmin: true');
    console.log('\n🎯 You can now:');
    console.log('   1. Log in at https://edusync-sis.web.app');
    console.log('   2. Access School Management features');
    console.log('   3. Create and manage multiple schools\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
