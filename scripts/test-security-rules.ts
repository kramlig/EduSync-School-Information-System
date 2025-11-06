/**
 * Comprehensive Security Rules Testing Script
 * 
 * Tests all security rules after implementation to ensure:
 * 1. Admin can access everything
 * 2. Teachers can read/write their sections
 * 3. Parents can only see their children
 * 4. Data isolation is enforced
 * 
 * Usage: ts-node scripts/test-security-rules.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  where,
  setDoc,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

// Firebase config (emulator)
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test accounts (must exist in emulator)
const TEST_USERS = {
  admin: { email: 'admin@test.com', password: 'test123', role: 'admin' },
  teacher: { email: 'teacher@test.com', password: 'test123', role: 'teacher' },
  parent: { email: 'parent@test.com', password: 'test123', role: 'parent' }
};

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ test: name, passed, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error && !passed) console.log(`   Error: ${error}`);
}

async function testAdminAccess() {
  console.log('\n🔑 Testing Admin Access...');
  
  try {
    await signInWithEmailAndPassword(
      auth,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );
    
    // Test 1: Read students
    try {
      const studentsSnap = await getDocs(collection(db, 'students'));
      logTest('Admin can read students', studentsSnap.size >= 0);
    } catch (error) {
      logTest('Admin can read students', false, String(error));
    }
    
    // Test 2: Read teachers
    try {
      const teachersSnap = await getDocs(collection(db, 'teachers'));
      logTest('Admin can read teachers', teachersSnap.size >= 0);
    } catch (error) {
      logTest('Admin can read teachers', false, String(error));
    }
    
    // Test 3: Read grades
    try {
      const gradesSnap = await getDocs(collection(db, 'grades'));
      logTest('Admin can read grades', gradesSnap.size >= 0);
    } catch (error) {
      logTest('Admin can read grades', false, String(error));
    }
    
    // Test 4: Read settings
    try {
      await getDoc(doc(db, 'settings', 'schoolConfig'));
      logTest('Admin can read settings', true);
    } catch (error) {
      logTest('Admin can read settings', false, String(error));
    }
    
    // Test 5: Write to students (create)
    try {
      const testDoc = await addDoc(collection(db, 'students'), {
        firstName: 'Test',
        lastName: 'Student',
        lrn: 'TEST-' + Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid
      });
      logTest('Admin can create students', true);
      
      // Cleanup
      await deleteDoc(testDoc);
    } catch (error) {
      logTest('Admin can create students', false, String(error));
    }
    
    await signOut(auth);
  } catch (error) {
    console.error('❌ Admin login failed:', error);
  }
}

async function testTeacherAccess() {
  console.log('\n👨‍🏫 Testing Teacher Access...');
  
  try {
    await signInWithEmailAndPassword(
      auth,
      TEST_USERS.teacher.email,
      TEST_USERS.teacher.password
    );
    
    // Test 1: Read students (should work)
    try {
      const studentsSnap = await getDocs(collection(db, 'students'));
      logTest('Teacher can read students', studentsSnap.size >= 0);
    } catch (error) {
      logTest('Teacher can read students', false, String(error));
    }
    
    // Test 2: Read teachers (should work)
    try {
      const teachersSnap = await getDocs(collection(db, 'teachers'));
      logTest('Teacher can read teachers', teachersSnap.size >= 0);
    } catch (error) {
      logTest('Teacher can read teachers', false, String(error));
    }
    
    // Test 3: Read grades (should work)
    try {
      const gradesSnap = await getDocs(collection(db, 'grades'));
      logTest('Teacher can read grades', gradesSnap.size >= 0);
    } catch (error) {
      logTest('Teacher can read grades', false, String(error));
    }
    
    // Test 4: Write to settings (should fail)
    try {
      await setDoc(doc(db, 'settings', 'schoolConfig'), {
        test: true
      });
      logTest('Teacher CANNOT write to settings', false, 'Should have been denied');
    } catch (error) {
      logTest('Teacher CANNOT write to settings', true);
    }
    
    // Test 5: Delete students (should fail)
    try {
      await deleteDoc(doc(db, 'students', 'fake-id'));
      logTest('Teacher CANNOT delete students', false, 'Should have been denied');
    } catch (error) {
      logTest('Teacher CANNOT delete students', true);
    }
    
    await signOut(auth);
  } catch (error) {
    console.error('❌ Teacher login failed:', error);
  }
}

async function testParentAccess() {
  console.log('\n👪 Testing Parent Access...');
  
  try {
    await signInWithEmailAndPassword(
      auth,
      TEST_USERS.parent.email,
      TEST_USERS.parent.password
    );
    
    const parentUid = auth.currentUser?.uid;
    
    // Test 1: Read own children only
    try {
      const studentsSnap = await getDocs(
        query(collection(db, 'students'), where('parentIds', 'array-contains', parentUid))
      );
      logTest('Parent can read own children', studentsSnap.size >= 0);
    } catch (error) {
      logTest('Parent can read own children', false, String(error));
    }
    
    // Test 2: Read all students (should fail)
    try {
      const allStudents = await getDocs(collection(db, 'students'));
      // Check if result is limited to parent's children
      const hasOwnChildrenOnly = allStudents.docs.every(doc => {
        const data = doc.data();
        return data.parentIds?.includes(parentUid);
      });
      logTest('Parent can ONLY read own children', hasOwnChildrenOnly);
    } catch (error) {
      // If permission denied, that's also correct
      logTest('Parent can ONLY read own children', true);
    }
    
    // Test 3: Write to students (should fail)
    try {
      await setDoc(doc(db, 'students', 'fake-id'), {
        firstName: 'Hacked'
      });
      logTest('Parent CANNOT write to students', false, 'Should have been denied');
    } catch (error) {
      logTest('Parent CANNOT write to students', true);
    }
    
    // Test 4: Read grades for own children
    try {
      const gradesSnap = await getDocs(collection(db, 'grades'));
      logTest('Parent can read grades', gradesSnap.size >= 0);
    } catch (error) {
      logTest('Parent can read grades', false, String(error));
    }
    
    // Test 5: Write to grades (should fail)
    try {
      await setDoc(doc(db, 'grades', 'fake-id'), {
        score: 100
      });
      logTest('Parent CANNOT write to grades', false, 'Should have been denied');
    } catch (error) {
      logTest('Parent CANNOT write to grades', true);
    }
    
    await signOut(auth);
  } catch (error) {
    console.error('❌ Parent login failed:', error);
  }
}

async function testUnauthenticatedAccess() {
  console.log('\n🚫 Testing Unauthenticated Access...');
  
  // Ensure logged out
  await signOut(auth);
  
  // Test 1: Read students (should fail)
  try {
    await getDocs(collection(db, 'students'));
    logTest('Unauthenticated CANNOT read students', false, 'Should have been denied');
  } catch (error) {
    logTest('Unauthenticated CANNOT read students', true);
  }
  
  // Test 2: Write to students (should fail)
  try {
    await setDoc(doc(db, 'students', 'fake-id'), {
      firstName: 'Hacked'
    });
    logTest('Unauthenticated CANNOT write to students', false, 'Should have been denied');
  } catch (error) {
    logTest('Unauthenticated CANNOT write to students', true);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Security Rules Testing...\n');
  console.log('⚠️  Make sure the Firebase emulator is running with seeded data!\n');
  
  try {
    await testAdminAccess();
    await testTeacherAccess();
    await testParentAccess();
    await testUnauthenticatedAccess();
    
    console.log('\n📊 Test Results Summary\n');
    console.log('═'.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:\n');
      results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • ${r.test}`);
          if (r.error) console.log(`    ${r.error}`);
        });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (failed === 0) {
      console.log('\n🎉 All security tests passed! Rules are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Review security rules configuration.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
