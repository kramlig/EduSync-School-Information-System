#!/usr/bin/env node
/**
 * PRODUCTION E2E SETUP - PHASE 1: Create Demo School
 * 
 * Creates a single demo school for E2E testing in production
 * 
 * School ID: "demo-e2e-testing"
 * Purpose: Isolated tenant for comprehensive E2E tests
 * 
 * What this creates:
 * - 1 school document with demo settings
 * - Proper multi-tenant isolation (won't affect real schools)
 * - Ready for test accounts and data seeding
 * 
 * Usage:
 *   node scripts/production-e2e/phase1-create-demo-school.cjs
 * 
 * Verification:
 *   - School document exists in Firestore
 *   - schoolId = "demo-e2e-testing"
 *   - Has proper settings (school name, year, etc.)
 */

const projectId = 'edusync-sis'; // Production project

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  // CRITICAL: Don't use emulator - this is PRODUCTION
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  initializeApp({ projectId });
  const db = getFirestore();

  console.log('\n🏫 PHASE 1: CREATE DEMO SCHOOL FOR E2E TESTING');
  console.log('═'.repeat(80));
  console.log(`📍 Project: ${projectId} (PRODUCTION)`);
  console.log('⚠️  WARNING: This will create data in PRODUCTION Firestore');
  console.log('═'.repeat(80));

  try {
    const schoolId = 'demo-e2e-testing';
    
    // Check if school already exists
    console.log('\n1️⃣  Checking if demo school already exists...');
    const existingSchool = await db.collection('schools').doc(schoolId).get();
    
    if (existingSchool.exists) {
      console.log('   ⚠️  Demo school already exists!');
      console.log('   📄 Current data:', JSON.stringify(existingSchool.data(), null, 2));
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('   ❓ Overwrite existing school? (yes/no): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n   ✅ Keeping existing school. Exiting...\n');
        process.exit(0);
      }
      
      console.log('   🔄 Overwriting existing school...');
    }
    
    // Create demo school document
    console.log('\n2️⃣  Creating demo school document...');
    
    const schoolData = {
      id: schoolId,
      schoolId: schoolId, // For consistency with other docs
      
      // Basic Info
      schoolName: 'EduSync E2E Testing Demo School',
      shortName: 'E2E Demo School',
      
      // Administrative Details
      region: 'National Capital Region (NCR)',
      division: 'Division of City Schools - Manila',
      district: 'District I',
      
      // School Classification
      type: 'public', // or 'private'
      level: 'secondary', // elementary, secondary, or k-12
      
      // Current Academic Year
      currentSchoolYear: '2024-2025',
      schoolYear: '2024-2025',
      
      // Contact Information
      address: '123 Demo Street, Manila, Metro Manila',
      contactNumber: '+63-2-1234-5678',
      email: 'demo-e2e@edusync.ph',
      
      // Principal/Head
      principalName: 'Dr. Demo Principal',
      principalEmail: 'principal-demo@edusync.ph',
      
      // Settings
      settings: {
        enableOnlineEnrollment: true,
        enableGrading: true,
        enableAttendance: true,
        enableAssignments: true,
        enableReportCards: true,
        enableFinancialManagement: false, // Keep simple for E2E
        
        gradingSystem: 'numeric', // numeric (0-100) or letter (A-F)
        passingGrade: 75,
        
        // Academic Periods
        quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
        currentQuarter: 'Q2',
        
        // School Calendar
        schoolDaysPerMonth: {
          Aug: 22, Sep: 21, Oct: 22, Nov: 21, Dec: 10,
          Jan: 22, Feb: 20, Mar: 22, Apr: 10, May: 0
        },
        
        // Features
        features: {
          grading: { enabled: true },
          attendance: { enabled: true },
          assignments: { enabled: true },
          lessonPlans: { enabled: true },
          announcements: { enabled: true },
          messaging: { enabled: false }, // Keep simple
          reports: { enabled: true }
        }
      },
      
      // Status
      status: 'active',
      isDemo: true, // Flag to indicate this is a demo/test school
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'production-e2e-setup-script',
      
      // E2E Testing Metadata
      purpose: 'E2E Testing',
      canBeDeleted: true, // Safe to delete/recreate
      notes: 'Demo school for comprehensive E2E testing. Contains realistic test data.'
    };
    
    await db.collection('schools').doc(schoolId).set(schoolData);
    
    console.log('   ✅ Demo school created successfully!');
    console.log(`   📄 School ID: ${schoolId}`);
    console.log(`   🏫 School Name: ${schoolData.schoolName}`);
    console.log(`   📅 School Year: ${schoolData.currentSchoolYear}`);
    
    // Verify creation
    console.log('\n3️⃣  Verifying school document...');
    const verifySchool = await db.collection('schools').doc(schoolId).get();
    
    if (!verifySchool.exists) {
      throw new Error('School document not found after creation!');
    }
    
    const verifyData = verifySchool.data();
    console.log('   ✅ Verification passed!');
    console.log('   📊 Document size:', JSON.stringify(verifyData).length, 'bytes');
    
    // Summary
    console.log('\n4️⃣  PHASE 1 SUMMARY');
    console.log('═'.repeat(80));
    console.log('   ✅ Demo school created in production Firestore');
    console.log(`   📍 Location: schools/${schoolId}`);
    console.log('   🔒 Multi-tenant isolated (won\'t affect real schools)');
    console.log('   🎯 Ready for Phase 2 (Create Test Accounts)');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Verify in Firebase Console:');
    console.log('      https://console.firebase.google.com/project/edusync-sis/firestore');
    console.log(`      → Check schools/${schoolId}`);
    console.log('   2. Run Phase 2:');
    console.log('      node scripts/production-e2e/phase2-create-test-accounts.cjs');
    
    console.log('\n✅ PHASE 1 COMPLETE!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR in Phase 1:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check Firebase project ID is correct');
    console.error('   2. Verify you have Firestore write permissions');
    console.error('   3. Check internet connection');
    console.error('   4. Ensure GOOGLE_APPLICATION_CREDENTIALS is set');
    process.exit(1);
  }
}

run();
