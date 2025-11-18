#!/usr/bin/env node
/**
 * FIX PHASE 2: Create Missing Users Collection Documents
 * 
 * The login screen looks for documents in the 'users' collection,
 * but Phase 2 only created role-specific documents (teachers/students/parents).
 * 
 * This script creates the missing users collection documents.
 */

const projectId = 'edusync-sis';

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const auth = getAuth();
  const db = getFirestore();

  console.log('\n🔧 FIXING: Creating Users Collection Documents');
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    
    const accounts = [
      {
        email: 'superadmin-demo@edusync.ph',
        role: 'superadmin',
        schoolId: null,
        firstName: 'Demo',
        lastName: 'Superadmin'
      },
      {
        email: 'admin-demo@edusync.ph',
        role: 'admin',
        schoolId: schoolId,
        firstName: 'Demo',
        lastName: 'Admin'
      },
      {
        email: 'teacher-demo@edusync.ph',
        role: 'teacher',
        schoolId: schoolId,
        firstName: 'Demo',
        lastName: 'Teacher'
      },
      {
        email: 'student-demo@edusync.ph',
        role: 'student',
        schoolId: schoolId,
        firstName: 'Demo',
        lastName: 'Student'
      },
      {
        email: 'parent-demo@edusync.ph',
        role: 'parent',
        schoolId: schoolId,
        firstName: 'Demo',
        lastName: 'Parent'
      }
    ];

    console.log('\n📝 Creating users collection documents...\n');

    for (const account of accounts) {
      try {
        // Get UID from auth
        const user = await auth.getUserByEmail(account.email);
        
        // Create user document
        const userDoc = {
          id: user.uid,
          uid: user.uid,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          schoolId: account.schoolId,
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await db.collection('users').doc(user.uid).set(userDoc);
        
        console.log(`   ✅ users/${user.uid} created for ${account.email}`);
        console.log(`      Role: ${account.role}, SchoolId: ${account.schoolId || 'null'}`);
        
      } catch (error) {
        console.error(`   ❌ Failed for ${account.email}:`, error.message);
      }
    }

    console.log('\n✅ USERS COLLECTION DOCUMENTS CREATED!');
    console.log('\n📋 Verification:');
    console.log('   1. Try logging in at https://edusync-sis.web.app');
    console.log('   2. Use: admin-demo@edusync.ph / Demo123!');
    console.log('   3. Should now successfully reach dashboard\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

run();
