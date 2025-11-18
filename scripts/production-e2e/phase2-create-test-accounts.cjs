#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 2: Create Test Accounts
 * 
 * Creates 5 Firebase Auth accounts for E2E testing
 * 
 * Accounts:
 * - superadmin-demo@edusync.ph (password: Demo123!)
 * - admin-demo@edusync.ph (password: Demo123!)
 * - teacher-demo@edusync.ph (password: Demo123!)
 * - student-demo@edusync.ph (password: Demo123!)
 * - parent-demo@edusync.ph (password: Demo123!)
 * 
 * Also creates user documents in Firestore (teachers/students/parents collections)
 * 
 * Usage:
 *   node scripts/production-e2e/phase2-create-test-accounts.cjs
 * 
 * Verification:
 *   - Login at https://edusync-sis.web.app with each account
 *   - Check Firebase Console → Authentication
 */

const projectId = 'edusync-sis'; // Production project

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const auth = getAuth();
  const db = getFirestore();

  console.log('\n👥 PHASE 2: CREATE TEST ACCOUNTS');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    const password = 'Demo123!';
    
    // Verify school exists
    console.log('\n1️⃣  Verifying demo school exists...');
    const schoolDoc = await db.collection('schools').doc(schoolId).get();
    if (!schoolDoc.exists) {
      throw new Error('Demo school not found! Run Phase 1 first.');
    }
    console.log('   ✅ Demo school found');
    
    // Account configurations
    const accounts = [
      {
        email: 'superadmin-demo@edusync.ph',
        password: password,
        displayName: 'Demo Superadmin',
        role: 'superadmin',
        claims: { role: 'superadmin', schoolId: null }, // Superadmin has no schoolId
        createUserDoc: false // Superadmin doesn't need user document
      },
      {
        email: 'admin-demo@edusync.ph',
        password: password,
        displayName: 'Demo Admin',
        role: 'admin',
        claims: { role: 'admin', schoolId: schoolId },
        collection: 'teachers',
        userData: {
          firstName: 'Demo',
          lastName: 'Admin',
          email: 'admin-demo@edusync.ph',
          role: 'admin',
          schoolId: schoolId,
          position: 'School Administrator',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      },
      {
        email: 'teacher-demo@edusync.ph',
        password: password,
        displayName: 'Demo Teacher',
        role: 'teacher',
        claims: { role: 'teacher', schoolId: schoolId },
        collection: 'teachers',
        userData: {
          firstName: 'Demo',
          lastName: 'Teacher',
          email: 'teacher-demo@edusync.ph',
          role: 'teacher',
          schoolId: schoolId,
          position: 'Subject Teacher',
          isActive: true,
          // CRITICAL: Empty assignments array (will be populated in Phase 4)
          assignments: [],
          createdAt: new Date().toISOString()
        }
      },
      {
        email: 'student-demo@edusync.ph',
        password: password,
        displayName: 'Demo Student',
        role: 'student',
        claims: { role: 'student', schoolId: schoolId },
        collection: 'students',
        userData: {
          firstName: 'Demo',
          lastName: 'Student',
          email: 'student-demo@edusync.ph',
          schoolId: schoolId,
          lrn: 'LRN-DEMO-001',
          gradeLevel: 10,
          // sectionId will be assigned in Phase 5
          sectionId: null,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      },
      {
        email: 'parent-demo@edusync.ph',
        password: password,
        displayName: 'Demo Parent',
        role: 'parent',
        claims: { role: 'parent', schoolId: schoolId },
        collection: 'parents',
        userData: {
          firstName: 'Demo',
          lastName: 'Parent',
          email: 'parent-demo@edusync.ph',
          schoolId: schoolId,
          relationship: 'Parent',
          // studentIds will be populated in Phase 7
          studentIds: [],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      }
    ];
    
    console.log('\n2️⃣  Creating Firebase Auth accounts...');
    const createdUsers = [];
    
    for (const account of accounts) {
      try {
        // Check if user already exists
        let user;
        try {
          user = await auth.getUserByEmail(account.email);
          console.log(`   ⚠️  ${account.email} already exists (UID: ${user.uid})`);
          
          // Update custom claims
          await auth.setCustomUserClaims(user.uid, account.claims);
          console.log(`   ✅ Updated custom claims for ${account.email}`);
          
        } catch (error) {
          // User doesn't exist, create it
          user = await auth.createUser({
            email: account.email,
            password: account.password,
            displayName: account.displayName,
            emailVerified: true // Skip email verification for demo
          });
          console.log(`   ✅ Created ${account.email} (UID: ${user.uid})`);
          
          // Set custom claims
          await auth.setCustomUserClaims(user.uid, account.claims);
          console.log(`   ✅ Set custom claims: ${JSON.stringify(account.claims)}`);
        }
        
        createdUsers.push({ ...account, uid: user.uid });
        
      } catch (error) {
        console.error(`   ❌ Failed to create ${account.email}:`, error.message);
      }
    }
    
    console.log('\n3️⃣  Creating Firestore user documents...');
    
    for (const account of createdUsers) {
      // Create users collection document (REQUIRED for login)
      try {
        const usersDocData = {
          id: account.uid,
          uid: account.uid,
          email: account.email,
          firstName: account.displayName.split(' ')[1] || 'Demo',
          lastName: account.displayName.split(' ')[0] || account.role,
          role: account.role,
          schoolId: account.claims.schoolId,
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await db.collection('users').doc(account.uid).set(usersDocData);
        console.log(`   ✅ Created users/${account.uid} for ${account.email}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create users doc for ${account.email}:`, error.message);
      }
      
      // Create role-specific collection document
      if (account.collection && account.userData) {
        try {
          // Add UID to user data
          const userDocData = {
            ...account.userData,
            id: account.uid,
            uid: account.uid
          };
          
          await db.collection(account.collection).doc(account.uid).set(userDocData);
          console.log(`   ✅ Created ${account.collection}/${account.uid} for ${account.email}`);
          
        } catch (error) {
          console.error(`   ❌ Failed to create user doc for ${account.email}:`, error.message);
        }
      }
    }
    
    // Summary
    console.log('\n4️⃣  PHASE 2 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${createdUsers.length}/5 accounts created/verified`);
    console.log('   ✅ Custom claims set (role + schoolId)');
    console.log('   ✅ Firestore user documents created');
    console.log('   🎯 Ready for Phase 3 (Create Sections)');
    
    console.log('\n📋 TEST ACCOUNTS:');
    console.log('─'.repeat(80));
    createdUsers.forEach(account => {
      console.log(`   ${account.role.padEnd(12)} | ${account.email.padEnd(30)} | ${password}`);
    });
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('   1. Open https://edusync-sis.web.app');
    console.log('   2. Try logging in with each account');
    console.log('   3. Verify each role sees appropriate dashboard');
    console.log('   4. Check Firebase Console → Authentication');
    
    console.log('\n📋 NEXT STEP:');
    console.log('   node scripts/production-e2e/phase3-create-sections.cjs');
    
    console.log('\n✅ PHASE 2 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 2:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Ensure Phase 1 completed successfully');
    console.error('   2. Check Firebase Auth is enabled');
    console.error('   3. Verify service account has Auth admin permissions');
    process.exit(1);
  }
}

run();
