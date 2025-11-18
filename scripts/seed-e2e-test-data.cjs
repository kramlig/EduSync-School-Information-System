#!/usr/bin/env node
/**
 * E2E TEST DATA SEEDING SCRIPT
 * 
 * Purpose: Add test data specifically for comprehensive E2E tests
 * This script SUPPLEMENTS existing seed data (run after seed-complete.cjs)
 * 
 * What this adds:
 * - 15 Enrollment Applications (various statuses: submitted, under_review, approved, rejected)
 * - ELLN Assessment data for K-3 students
 * - Test parent accounts for enrollment testing
 * - Sample uploaded documents (mocked)
 * 
 * Target Environments:
 * - Emulator: npm run seed:e2e:emulator
 * - Production: npm run seed:e2e:production
 * 
 * Usage:
 *   # For emulator
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8086 node scripts/seed-e2e-test-data.cjs
 * 
 *   # For production
 *   node scripts/seed-e2e-test-data.cjs --production
 * 
 * SAFETY:
 * - Tags all documents with isE2ETest: true for easy cleanup
 * - Uses batched writes
 * - Can be run multiple times (idempotent)
 */

const admin = require('firebase-admin');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

// ===== CONFIGURATION =====
const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const projectArg = args.find(arg => arg.startsWith('--project='));
const projectAlias = projectArg ? projectArg.split('=')[1] : (isProduction ? 'production' : 'emulator');

// Map alias to actual project ID
const PROJECT_MAP = {
  'production': 'edusync-sis',
  'staging': 'edusync-staging',
  'emulator': 'edusync-local',
  'edusync-sis': 'edusync-sis',
  'edusync-staging': 'edusync-staging',
  'edusync-local': 'edusync-local'
};

const PROJECT_ID = PROJECT_MAP[projectAlias] || 'edusync-local';

const SCHOOL_ID = 'default';
const SCHOOL_YEAR = '2024-2025';
const E2E_TAG = true; // Mark as E2E test data

if (isProduction || projectAlias === 'staging' || projectAlias === 'production') {
  console.log(`🚀 [E2E SEED] Production/Staging Mode - Project: ${PROJECT_ID}`);
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
} else {
  console.log('🧪 [E2E SEED] Emulator Mode');
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';
  
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'edusync-local' });
  }
}

const db = admin.firestore();
const auth = admin.auth();

console.log('📊 [E2E SEED] Adding test data for comprehensive E2E tests\n');

// ===== BATCH HELPER =====
let currentBatch = db.batch();
let batchCount = 0;

async function commitBatch() {
  if (batchCount > 0) {
    await currentBatch.commit();
    console.log(`   ✓ Committed batch (${batchCount} documents)`);
    currentBatch = db.batch();
    batchCount = 0;
  }
}

function addToBatch(ref, data) {
  currentBatch.set(ref, { 
    ...data, 
    isE2ETest: E2E_TAG,
    schoolId: SCHOOL_ID,
    createdAt: data.createdAt || Timestamp.now()
  }, { merge: true });
  batchCount++;
  
  if (batchCount >= 450) {
    return commitBatch();
  }
}

// ===== MAIN SEEDING FUNCTION =====

async function seedE2ETestData() {
  try {
    console.log('🌱 Starting E2E test data seeding...\n');

    // ============================================================
    // 1. ENROLLMENT APPLICATIONS (15 apps in various states)
    // ============================================================
    console.log('[1/3] 📝 Creating Enrollment Applications...');
    
    const enrollmentApps = [
      // SUBMITTED (5 apps - awaiting review)
      {
        id: 'ENR-2025-E2E001',
        status: 'submitted',
        studentInfo: {
          firstName: 'Maria',
          middleName: 'Santos',
          lastName: 'Dela Cruz',
          birthDate: '2012-05-15',
          birthPlace: 'Manila, Philippines',
          sex: 'Female',
          lrn: 'TEST123456789012',
          nationality: 'Filipino',
          photoURL: 'https://placehold.co/400x400/png?text=Maria+DC'
        },
        guardian1: {
          fullName: 'Juan Dela Cruz',
          relationship: 'Father',
          contactNumber: '09171234567',
          email: 'juan.delacruz.e2e@test.com',
          occupation: 'Engineer',
          employer: 'Test Engineering Inc.'
        },
        guardian2: {
          fullName: 'Rosa Dela Cruz',
          relationship: 'Mother',
          contactNumber: '09179876543',
          email: 'rosa.delacruz.e2e@test.com'
        },
        currentAddress: {
          houseNumber: '123',
          street: 'Test Street',
          barangay: 'San Antonio',
          city: 'Quezon City',
          province: 'Metro Manila',
          zipCode: '1105'
        },
        academicInfo: {
          gradeLevel: '7',
          previousSchool: 'Test Elementary School',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_maria.pdf',
            url: 'https://example.com/docs/birth_cert.pdf',
            uploadedAt: new Date('2024-11-01')
          },
          form137: {
            fileName: 'form137_maria.pdf',
            url: 'https://example.com/docs/form137.pdf',
            uploadedAt: new Date('2024-11-01')
          }
        },
        submittedAt: new Date('2024-11-01'),
        submittedBy: 'juan.delacruz.e2e@test.com'
      },
      
      {
        id: 'ENR-2025-E2E002',
        status: 'submitted',
        studentInfo: {
          firstName: 'Jose',
          middleName: 'Reyes',
          lastName: 'Santos',
          birthDate: '2013-08-20',
          birthPlace: 'Cebu City',
          sex: 'Male',
          lrn: 'TEST123456789013',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Pedro Santos',
          relationship: 'Father',
          contactNumber: '09181234568',
          email: 'pedro.santos.e2e@test.com',
          occupation: 'Teacher'
        },
        currentAddress: {
          barangay: 'Lahug',
          city: 'Cebu City',
          province: 'Cebu',
          zipCode: '6000'
        },
        academicInfo: {
          gradeLevel: '6',
          previousSchool: 'Cebu Test School',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_jose.pdf',
            url: 'https://example.com/docs/birth_cert2.pdf',
            uploadedAt: new Date('2024-11-02')
          }
        },
        submittedAt: new Date('2024-11-02'),
        submittedBy: 'pedro.santos.e2e@test.com'
      },
      
      {
        id: 'ENR-2025-E2E003',
        status: 'submitted',
        studentInfo: {
          firstName: 'Ana',
          middleName: 'Garcia',
          lastName: 'Rodriguez',
          birthDate: '2014-03-10',
          birthPlace: 'Davao City',
          sex: 'Female',
          lrn: 'TEST123456789014',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Carlos Rodriguez',
          relationship: 'Father',
          contactNumber: '09191234569',
          email: 'carlos.rodriguez.e2e@test.com',
          occupation: 'Business Owner'
        },
        currentAddress: {
          barangay: 'Poblacion',
          city: 'Davao City',
          province: 'Davao del Sur',
          zipCode: '8000'
        },
        academicInfo: {
          gradeLevel: '5',
          previousSchool: 'Davao Test Academy',
          yearLastAttended: '2024'
        },
        documents: {},
        submittedAt: new Date('2024-11-03'),
        submittedBy: 'carlos.rodriguez.e2e@test.com'
      },
      
      // UNDER REVIEW (3 apps - admin is reviewing)
      {
        id: 'ENR-2025-E2E004',
        status: 'under_review',
        studentInfo: {
          firstName: 'Miguel',
          middleName: 'Torres',
          lastName: 'Mendoza',
          birthDate: '2011-11-25',
          birthPlace: 'Makati City',
          sex: 'Male',
          lrn: 'TEST123456789015',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Luis Mendoza',
          relationship: 'Father',
          contactNumber: '09201234570',
          email: 'luis.mendoza.e2e@test.com',
          occupation: 'Lawyer'
        },
        currentAddress: {
          barangay: 'San Lorenzo',
          city: 'Makati City',
          province: 'Metro Manila',
          zipCode: '1223'
        },
        academicInfo: {
          gradeLevel: '8',
          previousSchool: 'Makati Test School',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_miguel.pdf',
            url: 'https://example.com/docs/birth_cert3.pdf',
            uploadedAt: new Date('2024-10-28')
          },
          form137: {
            fileName: 'form137_miguel.pdf',
            url: 'https://example.com/docs/form137_3.pdf',
            uploadedAt: new Date('2024-10-28')
          },
          goodMoral: {
            fileName: 'good_moral_miguel.pdf',
            url: 'https://example.com/docs/good_moral.pdf',
            uploadedAt: new Date('2024-10-28')
          }
        },
        submittedAt: new Date('2024-10-28'),
        submittedBy: 'luis.mendoza.e2e@test.com',
        reviewedAt: new Date('2024-10-30'),
        reviewedBy: 'admin@edusync.local'
      },
      
      {
        id: 'ENR-2025-E2E005',
        status: 'under_review',
        studentInfo: {
          firstName: 'Sofia',
          middleName: 'Castillo',
          lastName: 'Ramos',
          birthDate: '2012-07-18',
          birthPlace: 'Pasig City',
          sex: 'Female',
          lrn: 'TEST123456789016',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Ramon Ramos',
          relationship: 'Father',
          contactNumber: '09211234571',
          email: 'ramon.ramos.e2e@test.com',
          occupation: 'IT Professional'
        },
        currentAddress: {
          barangay: 'Kapitolyo',
          city: 'Pasig City',
          province: 'Metro Manila',
          zipCode: '1603'
        },
        academicInfo: {
          gradeLevel: '7',
          previousSchool: 'Pasig Test Elementary',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_sofia.pdf',
            url: 'https://example.com/docs/birth_cert4.pdf',
            uploadedAt: new Date('2024-10-29')
          }
        },
        submittedAt: new Date('2024-10-29'),
        submittedBy: 'ramon.ramos.e2e@test.com',
        reviewedAt: new Date('2024-10-31'),
        reviewedBy: 'admin@edusync.local'
      },
      
      // APPROVED (4 apps - ready for enrollment)
      {
        id: 'ENR-2025-E2E006',
        status: 'approved',
        studentInfo: {
          firstName: 'Elena',
          middleName: 'Bautista',
          lastName: 'Gonzales',
          birthDate: '2013-02-14',
          birthPlace: 'Antipolo City',
          sex: 'Female',
          lrn: 'TEST123456789017',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Antonio Gonzales',
          relationship: 'Father',
          contactNumber: '09221234572',
          email: 'antonio.gonzales.e2e@test.com',
          occupation: 'Doctor'
        },
        currentAddress: {
          barangay: 'San Roque',
          city: 'Antipolo City',
          province: 'Rizal',
          zipCode: '1870'
        },
        academicInfo: {
          gradeLevel: '6',
          previousSchool: 'Antipolo Test School',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_elena.pdf',
            url: 'https://example.com/docs/birth_cert5.pdf',
            uploadedAt: new Date('2024-10-20')
          },
          form137: {
            fileName: 'form137_elena.pdf',
            url: 'https://example.com/docs/form137_5.pdf',
            uploadedAt: new Date('2024-10-20')
          }
        },
        submittedAt: new Date('2024-10-20'),
        submittedBy: 'antonio.gonzales.e2e@test.com',
        reviewedAt: new Date('2024-10-22'),
        reviewedBy: 'admin@edusync.local',
        approvedAt: new Date('2024-10-22'),
        approvedBy: 'admin@edusync.local',
        reviewNotes: 'All documents verified. Student approved for enrollment.'
      },
      
      {
        id: 'ENR-2025-E2E007',
        status: 'approved',
        studentInfo: {
          firstName: 'Carlos',
          middleName: 'Lopez',
          lastName: 'Hernandez',
          birthDate: '2014-09-05',
          birthPlace: 'Taguig City',
          sex: 'Male',
          lrn: 'TEST123456789018',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Fernando Hernandez',
          relationship: 'Father',
          contactNumber: '09231234573',
          email: 'fernando.hernandez.e2e@test.com',
          occupation: 'Accountant'
        },
        currentAddress: {
          barangay: 'Fort Bonifacio',
          city: 'Taguig City',
          province: 'Metro Manila',
          zipCode: '1634'
        },
        academicInfo: {
          gradeLevel: '5',
          previousSchool: 'Taguig Test School',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_carlos.pdf',
            url: 'https://example.com/docs/birth_cert6.pdf',
            uploadedAt: new Date('2024-10-21')
          }
        },
        submittedAt: new Date('2024-10-21'),
        submittedBy: 'fernando.hernandez.e2e@test.com',
        reviewedAt: new Date('2024-10-23'),
        reviewedBy: 'admin@edusync.local',
        approvedAt: new Date('2024-10-23'),
        approvedBy: 'admin@edusync.local',
        reviewNotes: 'Approved. Ready for section assignment.'
      },
      
      // REJECTED (2 apps - incomplete/invalid)
      {
        id: 'ENR-2025-E2E008',
        status: 'rejected',
        studentInfo: {
          firstName: 'Isabella',
          middleName: 'Cruz',
          lastName: 'Martinez',
          birthDate: '2013-12-30',
          birthPlace: 'Manila',
          sex: 'Female',
          lrn: 'TEST123456789019',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Diego Martinez',
          relationship: 'Father',
          contactNumber: '09241234574',
          email: 'diego.martinez.e2e@test.com',
          occupation: 'Contractor'
        },
        currentAddress: {
          barangay: 'Sampaloc',
          city: 'Manila',
          province: 'Metro Manila',
          zipCode: '1008'
        },
        academicInfo: {
          gradeLevel: '6',
          previousSchool: 'Manila Test Elementary',
          yearLastAttended: '2024'
        },
        documents: {}, // Missing required documents
        submittedAt: new Date('2024-10-25'),
        submittedBy: 'diego.martinez.e2e@test.com',
        reviewedAt: new Date('2024-10-26'),
        reviewedBy: 'admin@edusync.local',
        rejectedAt: new Date('2024-10-26'),
        rejectedBy: 'admin@edusync.local',
        rejectionReason: 'Missing required documents: Birth Certificate and Form 137. Please resubmit with complete documentation.'
      },
      
      {
        id: 'ENR-2025-E2E009',
        status: 'rejected',
        studentInfo: {
          firstName: 'Gabriel',
          middleName: 'Perez',
          lastName: 'Flores',
          birthDate: '2015-04-12',
          birthPlace: 'Caloocan City',
          sex: 'Male',
          lrn: 'INVALID_LRN',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Lorenzo Flores',
          relationship: 'Father',
          contactNumber: '09251234575',
          email: 'lorenzo.flores.e2e@test.com',
          occupation: 'Sales Manager'
        },
        currentAddress: {
          barangay: 'Grace Park',
          city: 'Caloocan City',
          province: 'Metro Manila',
          zipCode: '1403'
        },
        academicInfo: {
          gradeLevel: '4',
          previousSchool: 'Caloocan Test School',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_gabriel.pdf',
            url: 'https://example.com/docs/birth_cert7.pdf',
            uploadedAt: new Date('2024-10-26')
          }
        },
        submittedAt: new Date('2024-10-26'),
        submittedBy: 'lorenzo.flores.e2e@test.com',
        reviewedAt: new Date('2024-10-27'),
        reviewedBy: 'admin@edusync.local',
        rejectedAt: new Date('2024-10-27'),
        rejectedBy: 'admin@edusync.local',
        rejectionReason: 'Invalid LRN format. Please verify and resubmit with correct Learner Reference Number.'
      },
      
      // ENROLLED (2 apps - fully processed)
      {
        id: 'ENR-2025-E2E010',
        status: 'enrolled',
        studentInfo: {
          firstName: 'Lucia',
          middleName: 'Rivera',
          lastName: 'Castro',
          birthDate: '2012-06-22',
          birthPlace: 'Paranaque City',
          sex: 'Female',
          lrn: 'TEST123456789020',
          nationality: 'Filipino'
        },
        guardian1: {
          fullName: 'Andres Castro',
          relationship: 'Father',
          contactNumber: '09261234576',
          email: 'andres.castro.e2e@test.com',
          occupation: 'Pilot'
        },
        currentAddress: {
          barangay: 'BF Homes',
          city: 'Paranaque City',
          province: 'Metro Manila',
          zipCode: '1720'
        },
        academicInfo: {
          gradeLevel: '7',
          previousSchool: 'Paranaque Test Elementary',
          yearLastAttended: '2024'
        },
        documents: {
          birthCertificate: {
            fileName: 'birth_cert_lucia.pdf',
            url: 'https://example.com/docs/birth_cert8.pdf',
            uploadedAt: new Date('2024-10-15')
          },
          form137: {
            fileName: 'form137_lucia.pdf',
            url: 'https://example.com/docs/form137_8.pdf',
            uploadedAt: new Date('2024-10-15')
          }
        },
        submittedAt: new Date('2024-10-15'),
        submittedBy: 'andres.castro.e2e@test.com',
        reviewedAt: new Date('2024-10-16'),
        reviewedBy: 'admin@edusync.local',
        approvedAt: new Date('2024-10-16'),
        approvedBy: 'admin@edusync.local',
        enrolledAt: new Date('2024-10-18'),
        enrolledBy: 'admin@edusync.local',
        studentId: 's_e2e_test_001', // Created student record
        sectionId: 'sec_grade7_rizal',
        reviewNotes: 'Application approved and student enrolled in Grade 7 - Rizal'
      }
    ];
    
    // Add all enrollment applications
    for (const app of enrollmentApps) {
      await addToBatch(db.collection('enrollmentApplications').doc(app.id), app);
    }
    await commitBatch();
    console.log(`   ✓ Created ${enrollmentApps.length} enrollment applications`);
    console.log('      - Submitted: 3');
    console.log('      - Under Review: 2');
    console.log('      - Approved: 2');
    console.log('      - Rejected: 2');
    console.log('      - Enrolled: 1');

    // ============================================================
    // 2. ELLN ASSESSMENT DATA (K-3 students)
    // ============================================================
    console.log('\n[2/3] 📊 Creating ELLN Assessment Data...');
    
    // Get K-3 students from existing data
    const studentsSnapshot = await db.collection('students')
      .where('schoolId', '==', SCHOOL_ID)
      .where('gradeLevel', '<=', 3)
      .limit(10)
      .get();
    
    const k3Students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (k3Students.length > 0) {
      console.log(`   Found ${k3Students.length} K-3 students for ELLN data`);
      
      const domains = ['literacy', 'numeracy'];
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      
      for (const student of k3Students) {
        for (const domain of domains) {
          for (const quarter of quarters) {
            const assessmentId = `elln_${student.id}_${domain}_${quarter}`;
            
            // Generate realistic proficiency scores
            // 90-100: Advanced, 80-89: Proficient, 65-79: Approaching, 50-64: Developing, 0-49: Beginning
            const baseScore = 70 + Math.floor(Math.random() * 20); // 70-89 (mostly proficient)
            const score = Math.min(100, Math.max(50, baseScore + Math.floor(Math.random() * 11) - 5));
            
            let proficiencyLevel;
            if (score >= 90) proficiencyLevel = 'Advanced';
            else if (score >= 80) proficiencyLevel = 'Proficient';
            else if (score >= 65) proficiencyLevel = 'Approaching Proficiency';
            else if (score >= 50) proficiencyLevel = 'Developing';
            else proficiencyLevel = 'Beginning';
            
            await addToBatch(db.collection('ellnAssessments').doc(assessmentId), {
              id: assessmentId,
              studentId: student.id,
              studentName: student.name,
              gradeLevel: student.gradeLevel,
              domain: domain,
              quarter: quarter,
              schoolYear: SCHOOL_YEAR,
              score: score,
              proficiencyLevel: proficiencyLevel,
              assessedBy: 'teacher_1',
              assessedAt: new Date(`2024-${quarter === 'Q1' ? '09' : quarter === 'Q2' ? '11' : quarter === 'Q3' ? '01' : '03'}-15`),
              notes: score < 65 ? 'Needs intervention support' : 'Progressing well'
            });
          }
        }
      }
      await commitBatch();
      console.log(`   ✓ Created ${k3Students.length * domains.length * quarters.length} ELLN assessments`);
    } else {
      console.log('   ⚠️  No K-3 students found. Run main seed script first.');
    }

    // ============================================================
    // 3. TEST PARENT ACCOUNTS FOR ENROLLMENT PORTAL
    // ============================================================
    console.log('\n[3/3] 👨‍👩‍👧 Creating Test Parent Accounts...');
    
    const testParents = [
      {
        id: 'parent_e2e_test_001',
        email: 'parent.test1@e2etest.com',
        password: 'TestParent123!',
        name: 'Test Parent One',
        phone: '09991234501',
        studentIds: [] // For testing new enrollment
      },
      {
        id: 'parent_e2e_test_002',
        email: 'parent.test2@e2etest.com',
        password: 'TestParent123!',
        name: 'Test Parent Two',
        phone: '09991234502',
        studentIds: [] // For testing new enrollment
      }
    ];
    
    for (const parent of testParents) {
      // Create in Firestore
      await addToBatch(db.collection('parents').doc(parent.id), {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        phone: parent.phone,
        studentIds: parent.studentIds,
        emailVerified: true,
        registrationDate: new Date('2024-11-01').toISOString(),
        notificationPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          absenceAlerts: true,
          gradeAlerts: true,
          announcementAlerts: true
        }
      });
      
      // Try to create in Auth (optional for emulator, required for production)
      try {
        await auth.createUser({
          uid: parent.id,
          email: parent.email,
          password: parent.password,
          displayName: parent.name,
          emailVerified: true
        });
        
        await auth.setCustomUserClaims(parent.id, {
          role: 'parent',
          schoolId: SCHOOL_ID
        });
        
        console.log(`   ✓ Created auth user: ${parent.email}`);
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-exists') {
          console.log(`   ℹ️  Auth user already exists: ${parent.email}`);
        } else {
          console.log(`   ⚠️  Could not create auth user: ${authErr.message}`);
        }
      }
    }
    await commitBatch();
    console.log(`   ✓ Created ${testParents.length} test parent accounts`);
    console.log('      Credentials: parent.test1@e2etest.com / TestParent123!');
    console.log('                   parent.test2@e2etest.com / TestParent123!');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ E2E TEST DATA SEEDING COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   - ${enrollmentApps.length} Enrollment Applications (various statuses)`);
    console.log(`   - ${k3Students.length > 0 ? k3Students.length * 8 : 0} ELLN Assessments (K-3)`);
    console.log(`   - ${testParents.length} Test Parent Accounts`);
    console.log('\n🏷️  All documents tagged with:');
    console.log('   - isE2ETest: true');
    console.log('   - schoolId: default');
    console.log('\n🧹 To clean up test data:');
    console.log('   db.collection("enrollmentApplications").where("isE2ETest", "==", true).get()');
    console.log('     .then(snap => snap.docs.forEach(doc => doc.ref.delete()))');
    console.log('\n🎯 Ready for E2E tests!');
    console.log('   npm test tests/comprehensive-e2e-production.spec.ts');
    console.log('='.repeat(80) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding E2E test data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedE2ETestData();
