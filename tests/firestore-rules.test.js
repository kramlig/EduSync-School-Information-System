/**
 * Firestore Security Rules Tests
 * 
 * Run with: npm run test:firestore-rules
 * 
 * Tests role-based access control for all major collections
 */

const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

let testEnv;

describe('Firestore Security Rules', () => {
  
  beforeAll(async () => {
    // Load security rules
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'edusync-test',
      firestore: {
        rules: rules,
        host: 'localhost',
        port: 8080
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const getAuthContext = (uid, role, email = null) => ({
    uid: uid,
    email: email || `${role}@test.com`,
    token: { role: role }
  });

  const adminContext = getAuthContext('admin-uid', 'admin', 'admin@test.com');
  const teacherContext = getAuthContext('teacher-uid', 'teacher', 'teacher@test.com');
  const parentContext = getAuthContext('parent-uid', 'parent', 'parent@test.com');
  const registrarContext = getAuthContext('registrar-uid', 'registrar', 'registrar@test.com');
  const principalContext = getAuthContext('principal-uid', 'principal', 'principal@test.com');

  // ========================================
  // STUDENTS COLLECTION
  // ========================================

  describe('Students Collection', () => {
    
    test('Admin can read students', async () => {
      const db = testEnv.authenticatedContext('admin-uid', adminContext).firestore();
      await assertSucceeds(db.collection('students').doc('student1').get());
    });

    test('Teacher can read students', async () => {
      const db = testEnv.authenticatedContext('teacher-uid', teacherContext).firestore();
      await assertSucceeds(db.collection('students').doc('student1').get());
    });

    test('Parent can read own child', async () => {
      // Setup: Create student with parent ID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student1').set({
          name: 'Test Student',
          parentIds: ['parent-uid']
        });
      });

      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertSucceeds(db.collection('students').doc('student1').get());
    });

    test('Parent cannot read other students', async () => {
      // Setup: Create student without parent ID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student2').set({
          name: 'Other Student',
          parentIds: ['other-parent-uid']
        });
      });

      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertFails(db.collection('students').doc('student2').get());
    });

    test('Registrar can create students', async () => {
      const db = testEnv.authenticatedContext('registrar-uid', registrarContext).firestore();
      await assertSucceeds(db.collection('students').doc('new-student').set({
        name: 'New Student',
        lrn: '123456789012'
      }));
    });

    test('Parent cannot create students', async () => {
      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertFails(db.collection('students').doc('new-student').set({
        name: 'Unauthorized Student'
      }));
    });

    test('Teacher cannot delete students', async () => {
      // Setup: Create student
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student1').set({
          name: 'Test Student'
        });
      });

      const db = testEnv.authenticatedContext('teacher-uid', teacherContext).firestore();
      await assertFails(db.collection('students').doc('student1').delete());
    });

    test('Admin can delete students', async () => {
      // Setup: Create student
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student1').set({
          name: 'Test Student'
        });
      });

      const db = testEnv.authenticatedContext('admin-uid', adminContext).firestore();
      await assertSucceeds(db.collection('students').doc('student1').delete());
    });
  });

  // ========================================
  // GRADES COLLECTION
  // ========================================

  describe('Grades Collection', () => {
    
    test('Teacher can create grades', async () => {
      const db = testEnv.authenticatedContext('teacher-uid', teacherContext).firestore();
      await assertSucceeds(db.collection('grades').doc('grade1').set({
        studentId: 'student1',
        subject: 'Math',
        grade: 90
      }));
    });

    test('Parent can read own child grades', async () => {
      // Setup: Create grade
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('grades').doc('grade1').set({
          studentId: 'student1',
          parentId: 'parent-uid',
          grade: 90
        });
      });

      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertSucceeds(db.collection('grades').doc('grade1').get());
    });

    test('Parent cannot modify grades', async () => {
      // Setup: Create grade
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('grades').doc('grade1').set({
          studentId: 'student1',
          parentId: 'parent-uid',
          grade: 85
        });
      });

      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertFails(db.collection('grades').doc('grade1').update({
        grade: 100  // Parent trying to boost grade!
      }));
    });

    test('Registrar cannot create grades', async () => {
      const db = testEnv.authenticatedContext('registrar-uid', registrarContext).firestore();
      await assertFails(db.collection('grades').doc('grade1').set({
        grade: 90
      }));
    });
  });

  // ========================================
  // PAYMENTS COLLECTION
  // ========================================

  describe('Payments Collection', () => {
    
    test('Registrar can create payments', async () => {
      const db = testEnv.authenticatedContext('registrar-uid', registrarContext).firestore();
      await assertSucceeds(db.collection('payments').doc('payment1').set({
        amount: 1000,
        studentId: 'student1',
        receiptNumber: 'OR-001'
      }));
    });

    test('Parent can read own payments', async () => {
      // Setup: Create payment
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('payments').doc('payment1').set({
          parentId: 'parent-uid',
          amount: 1000
        });
      });

      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertSucceeds(db.collection('payments').doc('payment1').get());
    });

    test('Parent cannot create payments directly', async () => {
      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertFails(db.collection('payments').doc('payment1').set({
        amount: 1000
      }));
    });

    test('Teacher cannot delete payments', async () => {
      // Setup: Create payment
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('payments').doc('payment1').set({
          amount: 1000
        });
      });

      const db = testEnv.authenticatedContext('teacher-uid', teacherContext).firestore();
      await assertFails(db.collection('payments').doc('payment1').delete());
    });
  });

  // ========================================
  // ENROLLMENT APPLICATIONS
  // ========================================

  describe('Enrollment Applications', () => {
    
    test('Unauthenticated user can create enrollment application', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(db.collection('enrollmentApplications').doc('app1').set({
        applicationNumber: 'APP-001',
        studentInfo: { firstName: 'John', lastName: 'Doe' },
        guardian1: { name: 'Jane Doe' },
        currentAddress: { city: 'Manila' },
        academicInfo: { gradeLevel: 'Grade 1' },
        status: 'submitted',
        submittedAt: new Date()
      }));
    });

    test('Unauthenticated user cannot read applications', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('enrollmentApplications').doc('app1').get());
    });

    test('Staff can read applications', async () => {
      // Setup: Create application
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('enrollmentApplications').doc('app1').set({
          applicationNumber: 'APP-001',
          status: 'submitted'
        });
      });

      const db = testEnv.authenticatedContext('registrar-uid', registrarContext).firestore();
      await assertSucceeds(db.collection('enrollmentApplications').doc('app1').get());
    });

    test('Registrar can approve application', async () => {
      // Setup: Create application
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('enrollmentApplications').doc('app1').set({
          applicationNumber: 'APP-001',
          status: 'submitted'
        });
      });

      const db = testEnv.authenticatedContext('registrar-uid', registrarContext).firestore();
      await assertSucceeds(db.collection('enrollmentApplications').doc('app1').update({
        status: 'approved',
        reviewedBy: 'registrar-uid',
        reviewedAt: new Date()
      }));
    });

    test('Parent cannot approve applications', async () => {
      // Setup: Create application
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('enrollmentApplications').doc('app1').set({
          applicationNumber: 'APP-001',
          status: 'submitted'
        });
      });

      const db = testEnv.authenticatedContext('parent-uid', parentContext).firestore();
      await assertFails(db.collection('enrollmentApplications').doc('app1').update({
        status: 'approved'
      }));
    });
  });

  // ========================================
  // SETTINGS COLLECTION
  // ========================================

  describe('Settings Collection', () => {
    
    test('Unauthenticated user can read settings', async () => {
      // Setup: Create settings
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('settings').doc('schoolConfig').set({
          enrollmentEnabled: true
        });
      });

      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(db.collection('settings').doc('schoolConfig').get());
    });

    test('Admin can update settings', async () => {
      // Setup: Create settings
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('settings').doc('schoolConfig').set({
          enrollmentEnabled: false
        });
      });

      const db = testEnv.authenticatedContext('admin-uid', adminContext).firestore();
      await assertSucceeds(db.collection('settings').doc('schoolConfig').update({
        enrollmentEnabled: true
      }));
    });

    test('Teacher cannot update settings', async () => {
      // Setup: Create settings
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('settings').doc('schoolConfig').set({
          enrollmentEnabled: false
        });
      });

      const db = testEnv.authenticatedContext('teacher-uid', teacherContext).firestore();
      await assertFails(db.collection('settings').doc('schoolConfig').update({
        enrollmentEnabled: true
      }));
    });
  });

  // ========================================
  // UNMATCHED COLLECTIONS (Should Deny All)
  // ========================================

  describe('Unmatched Collections', () => {
    
    test('Admin cannot access undefined collection', async () => {
      const db = testEnv.authenticatedContext('admin-uid', adminContext).firestore();
      await assertFails(db.collection('undefinedCollection').doc('doc1').get());
    });

    test('No one can write to undefined collection', async () => {
      const db = testEnv.authenticatedContext('admin-uid', adminContext).firestore();
      await assertFails(db.collection('undefinedCollection').doc('doc1').set({
        data: 'test'
      }));
    });
  });
});

console.log('\n🧪 Firestore Security Rules Tests');
console.log('Run with: npm test or npm run test:firestore-rules\n');
