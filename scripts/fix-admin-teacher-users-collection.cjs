#!/usr/bin/env node
/**
 * Fix Admin/Teacher Users Collection
 * 
 * Creates missing 'users' collection entries for admins and teachers
 * in the emulator.
 */

const admin = require('firebase-admin');

// Force emulator connection
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({ 
    projectId: 'edusync-local'
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function fixUsersCollection() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         FIX ADMIN/TEACHER USERS COLLECTION                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  let created = 0;
  let existed = 0;
  let errors = 0;

  try {
    // Get all Firebase Auth users
    console.log('📋 Fetching all Firebase Auth users...\n');
    const listUsersResult = await auth.listUsers(1000);
    
    for (const userRecord of listUsersResult.users) {
      const uid = userRecord.uid;
      const email = userRecord.email;
      
      if (!email) {
        console.log(`   ⚠️  Skipping user ${uid} (no email)`);
        continue;
      }

      try {
        // Check if users doc exists
        const usersDoc = await db.collection('users').doc(uid).get();
        
        if (usersDoc.exists) {
          existed++;
          continue;
        }

        // Get custom claims to determine role
        const customClaims = userRecord.customClaims || {};
        const role = customClaims.role;
        const schools = customClaims.schools || ['default'];
        
        if (!role) {
          console.log(`   ⚠️  ${email}: No role in custom claims, skipping`);
          errors++;
          continue;
        }

        // Try to get additional data from role-specific collection
        let additionalData = {};
        
        if (role === 'teacher' || role === 'admin' || role === 'principal' || role === 'registrar') {
          const teacherDoc = await db.collection('teachers').doc(uid).get();
          if (teacherDoc.exists) {
            additionalData = teacherDoc.data();
          }
        }

        // Create users document
        const userData = {
          id: uid,
          email: email,
          name: userRecord.displayName || additionalData.name || email.split('@')[0],
          role: role,
          schoolId: schools[0] || 'default',
          schools: schools,
          emailVerified: userRecord.emailVerified || true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          ...( additionalData.firstName && { firstName: additionalData.firstName }),
          ...( additionalData.lastName && { lastName: additionalData.lastName }),
          ...( additionalData.assignedSection && { assignedSection: additionalData.assignedSection })
        };

        await db.collection('users').doc(uid).set(userData);
        
        console.log(`   ✅ Created users doc for ${email} (${role})`);
        created++;

      } catch (error) {
        console.error(`   ❌ Error processing ${email}:`, error.message);
        errors++;
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         SUMMARY                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ Created: ${created}`);
    console.log(`✓ Already existed: ${existed}`);
    console.log(`❌ Errors/Skipped: ${errors}`);
    
    if (created > 0) {
      console.log('\n🎉 Success! Login should now work for all users.\n');
    } else if (existed > 0) {
      console.log('\n✅ All users already have users collection entries.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixUsersCollection();
