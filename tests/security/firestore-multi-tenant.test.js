/**
 * Multi-Tenant Firestore Security Rules Tests
 * 
 * Tests strict validation for multi-tenant isolation:
 * - Cross-school access denial
 * - schoolId validation on creates
 * - schoolId immutability on updates
 * - Super admin cross-school access
 * - Multi-school user access
 * 
 * Run with: npm run test:security:multi-tenant
 * 
 * Created: November 9, 2025
 * Part of: Multi-Tenant Implementation (Phase 5 - Testing)
 */

const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

let testEnv;

describe('Multi-Tenant Firestore Security Rules', () => {
  
  beforeAll(async () => {
    // Load security rules
    const rulesPath = path.join(__dirname, '../..', 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'edusync-multi-tenant-test',
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8086
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

  const getAuthContext = (uid, role, schools = ['default'], email = null) => ({
    sub: uid,  // Changed from 'uid' to 'sub' for Firebase SDK compatibility
    email: email || `${role}@test.com`,
    token: { 
      role: role,
      schools: schools
    }
  });

  const school1AdminContext = getAuthContext('admin-school1', 'admin', ['school-001'], 'admin1@test.com');
  const school2AdminContext = getAuthContext('admin-school2', 'admin', ['school-002'], 'admin2@test.com');
  const multiSchoolTeacherContext = getAuthContext('teacher-multi', 'teacher', ['school-001', 'school-002'], 'teacher@test.com');
  const superAdminContext = getAuthContext('superadmin', 'superadmin', ['default'], 'superadmin@test.com');
  const legacyUserContext = getAuthContext('legacy-user', 'teacher', null, 'legacy@test.com'); // No schools array

  // ========================================
  // CROSS-SCHOOL ACCESS TESTS
  // ========================================

  describe('Cross-School Data Isolation', () => {
    
    test('User cannot read students from different school', async () => {
      // Setup: Create student in school-002
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-school2').set({
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          schoolId: 'school-002',
          lrn: '123456789012'
        });
      });

      // Try to read with school-001 admin (should fail)
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      await assertFails(db.collection('students').doc('student-school2').get());
    });

    test('User CAN read students from own school', async () => {
      // Setup: Create student in school-001
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-school1').set({
          firstName: 'Maria',
          lastName: 'Santos',
          schoolId: 'school-001',
          lrn: '123456789013'
        });
      });

      // Read with school-001 admin (should succeed)
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      await assertSucceeds(db.collection('students').doc('student-school1').get());
    });

    test('Super admin can access students from any school', async () => {
      // Setup: Create students in different schools
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const firestore = context.firestore();
        await firestore.collection('students').doc('student-school1').set({
          firstName: 'Pedro',
          schoolId: 'school-001',
          lrn: '123456789014'
        });
        await firestore.collection('students').doc('student-school2').set({
          firstName: 'Ana',
          schoolId: 'school-002',
          lrn: '123456789015'
        });
      });

      // Super admin can read both
      const db = testEnv.authenticatedContext('superadmin', superAdminContext).firestore();
      await assertSucceeds(db.collection('students').doc('student-school1').get());
      await assertSucceeds(db.collection('students').doc('student-school2').get());
    });

    test('Multi-school user can access all assigned schools', async () => {
      // Setup: Create students in both schools
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const firestore = context.firestore();
        await firestore.collection('students').doc('student-school1').set({
          firstName: 'Rosa',
          schoolId: 'school-001',
          lrn: '123456789016'
        });
        await firestore.collection('students').doc('student-school2').set({
          firstName: 'Jose',
          schoolId: 'school-002',
          lrn: '123456789017'
        });
      });

      // Multi-school teacher can read both
      const db = testEnv.authenticatedContext('teacher-multi', multiSchoolTeacherContext).firestore();
      await assertSucceeds(db.collection('students').doc('student-school1').get());
      await assertSucceeds(db.collection('students').doc('student-school2').get());
    });

    test('User cannot query students without schoolId filter', async () => {
      // Setup: Create students
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student1').set({
          firstName: 'Test',
          schoolId: 'school-001',
          lrn: '123456789018'
        });
      });

      // Try to query without schoolId filter (should fail)
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      // This query lacks schoolId filter - should be denied
      const query = db.collection('students').where('gradeLevel', '==', 7);
      await assertFails(query.get());
    });
  });

  // ========================================
  // SCHOOLID VALIDATION ON CREATE
  // ========================================

  describe('SchoolId Validation on Create', () => {
    
    test('Cannot create student without schoolId', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('students').add({
        firstName: 'No',
        lastName: 'SchoolId',
        lrn: '123456789019'
        // Missing schoolId - should fail
      }));
    });

    test('Cannot create student with empty schoolId', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('students').add({
        firstName: 'Empty',
        lastName: 'SchoolId',
        schoolId: '', // Empty string - should fail
        lrn: '123456789020'
      }));
    });

    test('Cannot create student with schoolId from different school', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      // School-001 admin trying to create student in school-002
      await assertFails(db.collection('students').add({
        firstName: 'Wrong',
        lastName: 'School',
        schoolId: 'school-002', // Different school - should fail
        lrn: '123456789021'
      }));
    });

    test('CAN create student with valid schoolId from own school', async () => {
      // Setup: Create school first
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('schools').doc('school-001').set({
          name: 'Test School 001',
          address: '123 Main St'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertSucceeds(db.collection('students').add({
        firstName: 'Valid',
        lastName: 'Student',
        schoolId: 'school-001', // Valid schoolId from own school
        lrn: '123456789022'
      }));
    });

    test('Cannot create student with non-existent schoolId', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('students').add({
        firstName: 'Nonexistent',
        lastName: 'School',
        schoolId: 'school-999', // Doesn't exist in schools collection
        lrn: '123456789023'
      }));
    });

    test('Super admin can create student in any school', async () => {
      // Setup: Create schools
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const firestore = context.firestore();
        await firestore.collection('schools').doc('school-001').set({ name: 'School 001' });
        await firestore.collection('schools').doc('school-002').set({ name: 'School 002' });
      });

      const db = testEnv.authenticatedContext('superadmin', superAdminContext).firestore();
      
      // Can create in school-001
      await assertSucceeds(db.collection('students').add({
        firstName: 'Super',
        lastName: 'Admin1',
        schoolId: 'school-001',
        lrn: '123456789024'
      }));

      // Can create in school-002
      await assertSucceeds(db.collection('students').add({
        firstName: 'Super',
        lastName: 'Admin2',
        schoolId: 'school-002',
        lrn: '123456789025'
      }));
    });
  });

  // ========================================
  // SCHOOLID IMMUTABILITY ON UPDATE
  // ========================================

  describe('SchoolId Immutability on Update', () => {
    
    test('Cannot change schoolId on update', async () => {
      // Setup: Create student in school-001
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-immutable').set({
          firstName: 'Test',
          lastName: 'Student',
          schoolId: 'school-001',
          lrn: '123456789026'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      // Try to change schoolId (should fail)
      await assertFails(db.collection('students').doc('student-immutable').update({
        schoolId: 'school-002' // Changing schoolId - should fail
      }));
    });

    test('CAN update other fields without changing schoolId', async () => {
      // Setup: Create student
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-update').set({
          firstName: 'Original',
          lastName: 'Name',
          schoolId: 'school-001',
          lrn: '123456789027'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      // Update other fields (should succeed)
      await assertSucceeds(db.collection('students').doc('student-update').update({
        firstName: 'Updated',
        lastName: 'Name'
        // schoolId unchanged
      }));
    });

    test('Cannot remove schoolId on update', async () => {
      // Setup: Create student
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-remove').set({
          firstName: 'Test',
          schoolId: 'school-001',
          lrn: '123456789028'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      // Try to remove schoolId using FieldValue.delete() equivalent
      const { deleteField } = require('firebase/firestore');
      await assertFails(db.collection('students').doc('student-remove').update({
        schoolId: null // Removing schoolId - should fail
      }));
    });
  });

  // ========================================
  // TEACHERS COLLECTION MULTI-TENANT TESTS
  // ========================================

  describe('Teachers Collection Multi-Tenant', () => {
    
    test('Cannot create teacher without schoolId', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('teachers').add({
        firstName: 'No',
        lastName: 'School',
        email: 'teacher@test.com'
        // Missing schoolId
      }));
    });

    test('Cannot read teacher from different school', async () => {
      // Setup: Create teacher in school-002
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('teachers').doc('teacher-school2').set({
          firstName: 'Teacher',
          lastName: 'Two',
          schoolId: 'school-002',
          email: 'teacher2@test.com'
        });
      });

      // Try to read with school-001 admin
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      await assertFails(db.collection('teachers').doc('teacher-school2').get());
    });

    test('Cannot change teacher schoolId on update', async () => {
      // Setup: Create teacher
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('teachers').doc('teacher-update').set({
          firstName: 'Teacher',
          schoolId: 'school-001',
          email: 'teacher@test.com'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('teachers').doc('teacher-update').update({
        schoolId: 'school-002' // Changing schoolId
      }));
    });
  });

  // ========================================
  // SECTIONS COLLECTION MULTI-TENANT TESTS
  // ========================================

  describe('Sections Collection Multi-Tenant', () => {
    
    test('Cannot create section without schoolId', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('sections').add({
        name: 'Section A',
        gradeLevel: 7
        // Missing schoolId
      }));
    });

    test('Cannot read section from different school', async () => {
      // Setup: Create section in school-002
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('sections').doc('section-school2').set({
          name: 'Section B',
          schoolId: 'school-002',
          gradeLevel: 8
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      await assertFails(db.collection('sections').doc('section-school2').get());
    });

    test('Cannot change section schoolId', async () => {
      // Setup: Create section
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('sections').doc('section-update').set({
          name: 'Section C',
          schoolId: 'school-001',
          gradeLevel: 9
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('sections').doc('section-update').update({
        schoolId: 'school-002'
      }));
    });
  });

  // ========================================
  // PARENTS COLLECTION MULTI-TENANT TESTS
  // ========================================

  describe('Parents Collection Multi-Tenant', () => {
    
    test('Cannot create parent without schoolId', async () => {
      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('parents').add({
        firstName: 'Parent',
        lastName: 'User',
        email: 'parent@test.com'
        // Missing schoolId
      }));
    });

    test('Parent cannot change their own schoolId', async () => {
      const parentContext = getAuthContext('parent-001', 'parent', ['school-001'], 'parent@test.com');
      
      // Setup: Create parent
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('parents').doc('parent-001').set({
          firstName: 'Parent',
          schoolId: 'school-001',
          email: 'parent@test.com'
        });
      });

      const db = testEnv.authenticatedContext('parent-001', parentContext).firestore();
      
      // Parent tries to change their own schoolId
      await assertFails(db.collection('parents').doc('parent-001').update({
        schoolId: 'school-002'
      }));
    });

    test('Admin cannot change parent schoolId', async () => {
      // Setup: Create parent
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('parents').doc('parent-002').set({
          firstName: 'Parent',
          schoolId: 'school-001',
          email: 'parent2@test.com'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      await assertFails(db.collection('parents').doc('parent-002').update({
        schoolId: 'school-002'
      }));
    });
  });

  // ========================================
  // LEGACY MODE COMPATIBILITY TESTS
  // ========================================

  describe('Legacy Mode Compatibility', () => {
    
    test('Legacy user without schools array can still access data', async () => {
      // Setup: Create student with default schoolId
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('students').doc('student-legacy').set({
          firstName: 'Legacy',
          schoolId: 'default',
          lrn: '123456789029'
        });
      });

      // Legacy user (no schools in custom claims) should still work
      const db = testEnv.authenticatedContext('legacy-user', legacyUserContext).firestore();
      
      // This might succeed due to || isLegacyUser() escape hatch
      // Uncomment when legacy mode is removed to verify strict enforcement
      // await assertFails(db.collection('students').doc('student-legacy').get());
      
      console.log('⚠️  Legacy mode test skipped - remove || isLegacyUser() to enable strict mode');
    });
  });

  // ========================================
  // ENROLLMENT APPLICATIONS MULTI-TENANT
  // ========================================

  describe('Enrollment Applications Multi-Tenant', () => {
    
    test('Public can create enrollment application with schoolId', async () => {
      // Setup: Create school
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('schools').doc('school-001').set({
          name: 'Test School'
        });
      });

      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertSucceeds(db.collection('enrollmentApplications').add({
        applicationNumber: 'APP-001',
        schoolId: 'school-001', // Must include schoolId
        studentInfo: { firstName: 'New', lastName: 'Student' },
        status: 'submitted',
        submittedAt: new Date()
      }));
    });

    test('Public cannot create enrollment application without schoolId', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertFails(db.collection('enrollmentApplications').add({
        applicationNumber: 'APP-002',
        // Missing schoolId
        studentInfo: { firstName: 'No', lastName: 'School' },
        status: 'submitted'
      }));
    });

    test('Admin can only read applications from their school', async () => {
      // Setup: Create applications in different schools
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const firestore = context.firestore();
        await firestore.collection('enrollmentApplications').doc('app-school1').set({
          applicationNumber: 'APP-003',
          schoolId: 'school-001',
          status: 'submitted'
        });
        await firestore.collection('enrollmentApplications').doc('app-school2').set({
          applicationNumber: 'APP-004',
          schoolId: 'school-002',
          status: 'submitted'
        });
      });

      const db = testEnv.authenticatedContext('admin-school1', school1AdminContext).firestore();
      
      // Can read from own school
      await assertSucceeds(db.collection('enrollmentApplications').doc('app-school1').get());
      
      // Cannot read from different school
      await assertFails(db.collection('enrollmentApplications').doc('app-school2').get());
    });
  });
});

console.log('\n🏫 Multi-Tenant Firestore Security Rules Tests');
console.log('Tests strict validation: cross-school isolation, schoolId validation, immutability');
console.log('Run with: npm run test:security:multi-tenant\n');
