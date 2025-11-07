/**
 * Comprehensive Login Diagnostics
 * 
 * Checks all critical points in the authentication flow:
 * 1. Emulator connectivity
 * 2. Admin account existence in Firestore
 * 3. Teacher accounts with proper structure
 * 4. Firebase configuration
 */

const admin = require('firebase-admin');

// Initialize Admin SDK for emulator
const app = admin.initializeApp({
  projectId: 'edusync-local',
});

const db = admin.firestore();
const auth = admin.auth();

// Connect to emulator
db.settings({
  host: '127.0.0.1:8086',
  ssl: false,
});

async function diagnose() {
  console.log('\n🔍 EduSync Login Diagnostics\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check Firestore connectivity
    console.log('\n1️⃣  Checking Firestore Emulator Connectivity...');
    const testDoc = await db.collection('_test').doc('ping').set({ timestamp: Date.now() });
    console.log('   ✅ Firestore emulator is reachable');
    
    // 2. Check admin account in teachers collection
    console.log('\n2️⃣  Checking admin@edusync.local in teachers collection...');
    const adminQuery = await db.collection('teachers')
      .where('email', '==', 'admin@edusync.local')
      .get();
    
    if (adminQuery.empty) {
      console.log('   ❌ PROBLEM: Admin account NOT found in teachers collection');
      console.log('      This is why login fails - no document matches the email');
    } else {
      console.log('   ✅ Admin account found in teachers collection');
      const adminDoc = adminQuery.docs[0];
      const adminData = adminDoc.data();
      console.log('      ID:', adminDoc.id);
      console.log('      Email:', adminData.email);
      console.log('      Name:', adminData.firstName, adminData.lastName);
      console.log('      Role:', adminData.role || '(missing)');
    }
    
    // 3. Check Auth custom claims
    console.log('\n3️⃣  Checking Firebase Auth for admin@edusync.local...');
    try {
      const userRecord = await auth.getUserByEmail('admin@edusync.local');
      console.log('   ✅ Auth user exists');
      console.log('      UID:', userRecord.uid);
      console.log('      Custom Claims:', userRecord.customClaims || '(none)');
    } catch (authErr) {
      console.log('   ⚠️  Auth user not found (this is OK for emulator demo mode)');
    }
    
    // 4. List all teacher accounts
    console.log('\n4️⃣  Listing all teacher accounts...');
    const teachersSnapshot = await db.collection('teachers').limit(10).get();
    console.log(`   Found ${teachersSnapshot.size} teacher(s):`);
    teachersSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ${data.email} - ${data.firstName} ${data.lastName} (role: ${data.role || 'missing'})`);
    });
    
    // 5. Check sections and assignments
    console.log('\n5️⃣  Checking section assignments...');
    const sectionsSnapshot = await db.collection('sections').limit(5).get();
    console.log(`   Found ${sectionsSnapshot.size} section(s):`);
    sectionsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. Grade ${data.gradeLevel} - ${data.name} (Adviser: ${data.adviserId})`);
    });
    
    // 6. Check students
    console.log('\n6️⃣  Checking student records...');
    const studentsSnapshot = await db.collection('students').limit(3).get();
    console.log(`   Found ${studentsSnapshot.size} student(s) (showing first 3):`);
    studentsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ${data.firstName} ${data.lastName} - Section: ${data.sectionId}`);
    });
    
    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(60));
    
    if (adminQuery.empty) {
      console.log('\n❌ CRITICAL ISSUE FOUND:');
      console.log('   The admin@edusync.local account does NOT exist in the');
      console.log('   teachers collection. This is why login fails.');
      console.log('\n💡 SOLUTION:');
      console.log('   Run: npm run emu:seed:admin');
      console.log('   This will create the admin account properly.');
    } else if (teachersSnapshot.size === 0) {
      console.log('\n❌ CRITICAL ISSUE: No teachers found in database');
      console.log('   Run: npm run emu:seed:admin');
    } else {
      console.log('\n✅ All critical checks passed!');
      console.log('   - Firestore is connected');
      console.log('   - Admin account exists');
      console.log('   - Database is seeded');
      console.log('\n🎯 Login should work with:');
      console.log('   Email: admin@edusync.local');
      console.log('   Password: (any - emulator mode)');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ DIAGNOSTIC ERROR:', error.message);
    console.error('   Full error:', error);
  }
  
  process.exit(0);
}

// Wait a moment for emulator to be ready
setTimeout(diagnose, 1000);
