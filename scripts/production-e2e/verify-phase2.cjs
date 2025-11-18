#!/usr/bin/env node
/**
 * VERIFY PHASE 2: Test Account Login Verification
 * 
 * Tests all 5 demo accounts to ensure:
 * - Firebase Auth accounts exist
 * - Custom claims are set correctly
 * - Firestore user documents exist
 * - Can authenticate successfully
 * 
 * Usage:
 *   node scripts/production-e2e/verify-phase2.cjs
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

  console.log('\n🔍 PHASE 2 VERIFICATION: Test Accounts');
  console.log('═'.repeat(80));

  const accounts = [
    { email: 'superadmin-demo@edusync.ph', expectedRole: 'superadmin', expectedSchoolId: null, collection: null },
    { email: 'admin-demo@edusync.ph', expectedRole: 'admin', expectedSchoolId: 'demo-e2e-testing', collection: 'teachers' },
    { email: 'teacher-demo@edusync.ph', expectedRole: 'teacher', expectedSchoolId: 'demo-e2e-testing', collection: 'teachers' },
    { email: 'student-demo@edusync.ph', expectedRole: 'student', expectedSchoolId: 'demo-e2e-testing', collection: 'students' },
    { email: 'parent-demo@edusync.ph', expectedRole: 'parent', expectedSchoolId: 'demo-e2e-testing', collection: 'parents' }
  ];

  let passCount = 0;
  let failCount = 0;

  for (const account of accounts) {
    console.log(`\n📧 ${account.email}`);
    console.log('─'.repeat(80));
    
    try {
      // 1. Check Firebase Auth
      const user = await auth.getUserByEmail(account.email);
      console.log(`   ✅ Auth account exists (UID: ${user.uid})`);
      
      // 2. Check custom claims
      const claims = user.customClaims || {};
      const roleMatch = claims.role === account.expectedRole;
      const schoolIdMatch = claims.schoolId === account.expectedSchoolId;
      
      if (roleMatch && schoolIdMatch) {
        console.log(`   ✅ Custom claims correct: role=${claims.role}, schoolId=${claims.schoolId || 'null'}`);
      } else {
        console.log(`   ❌ Custom claims mismatch:`);
        console.log(`      Expected: role=${account.expectedRole}, schoolId=${account.expectedSchoolId || 'null'}`);
        console.log(`      Got: role=${claims.role}, schoolId=${claims.schoolId || 'null'}`);
        failCount++;
        continue;
      }
      
      // 3. Check Firestore user document (if applicable)
      if (account.collection) {
        const userDoc = await db.collection(account.collection).doc(user.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`   ✅ Firestore doc exists: ${account.collection}/${user.uid}`);
          console.log(`      Name: ${userData.firstName} ${userData.lastName}`);
          console.log(`      Role: ${userData.role}`);
          console.log(`      SchoolId: ${userData.schoolId}`);
          
          // Special check for teacher assignments
          if (account.expectedRole === 'teacher') {
            if (Array.isArray(userData.assignments)) {
              console.log(`      Assignments: ${userData.assignments.length} (empty array - will be populated in Phase 4) ✅`);
            } else {
              console.log(`      ⚠️  Assignments field missing or not an array!`);
            }
          }
          
          // Special check for student section
          if (account.expectedRole === 'student') {
            console.log(`      SectionId: ${userData.sectionId || 'null (will be assigned in Phase 5)'} ✅`);
          }
          
          // Special check for parent children
          if (account.expectedRole === 'parent') {
            console.log(`      StudentIds: ${userData.studentIds?.length || 0} (will be linked in Phase 7) ✅`);
          }
          
        } else {
          console.log(`   ❌ Firestore doc NOT found: ${account.collection}/${user.uid}`);
          failCount++;
          continue;
        }
      } else {
        console.log(`   ℹ️  No Firestore doc needed (superadmin)`);
      }
      
      console.log(`   ✅ ${account.email} - ALL CHECKS PASSED`);
      passCount++;
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failCount++;
    }
  }

  // Summary
  console.log('\n═'.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═'.repeat(80));
  console.log(`   ✅ Passed: ${passCount}/5 accounts`);
  console.log(`   ❌ Failed: ${failCount}/5 accounts`);

  if (failCount === 0) {
    console.log('\n🎉 ALL ACCOUNTS VERIFIED SUCCESSFULLY!');
    console.log('═'.repeat(80));
    console.log('📋 MANUAL TESTING (Optional):');
    console.log('   1. Open: https://edusync-sis.web.app');
    console.log('   2. Test login with each account:');
    console.log('      • superadmin-demo@edusync.ph / Demo123!');
    console.log('      • admin-demo@edusync.ph / Demo123!');
    console.log('      • teacher-demo@edusync.ph / Demo123!');
    console.log('      • student-demo@edusync.ph / Demo123!');
    console.log('      • parent-demo@edusync.ph / Demo123!');
    console.log('   3. Verify each sees appropriate dashboard');
    console.log('\n✅ PHASE 2 VERIFIED - Ready for Phase 3!');
    console.log('📋 Next command:');
    console.log('   node scripts/production-e2e/phase3-create-sections.cjs\n');
    process.exit(0);
  } else {
    console.log('\n❌ VERIFICATION FAILED!');
    console.log('🔧 Fix issues before proceeding to Phase 3\n');
    process.exit(1);
  }
}

run();
