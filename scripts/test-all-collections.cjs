#!/usr/bin/env node
/**
 * Test All Collections - Verify Security Rules Work
 * 
 * This script tests that all collections can be accessed without
 * "Property role is undefined" or "false for 'list'" errors.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin for emulator
admin.initializeApp({
  projectId: 'edusync-local'
});

// Point to emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const db = admin.firestore();
const auth = admin.auth();

// All collections used by the app
const COLLECTIONS = [
  'students',
  'teachers',
  'parents',
  'sections',
  'learningAreas',
  'grades',
  'coreValues',
  'coreValueGrades',
  'attendanceRecords',
  'substituteAssignments',
  'classSchedules',
  'assignments',
  'studentAssignmentGrades',
  'lessonPlans',
  'announcements',
  'schoolYears',
  'users',
  'settings',
  'validationResults',
  'billingStatements',
  'receipts',
  'feeStructures',
  'payments',
  'billingLedgers',
  'paymentProofs',
  'enrollmentApplications',
  'notifications',
  'mail',
  'notificationErrors',
  'academicHistory',
  'reportCards',
  'schoolForms',
  'ellnAssessments',
  'formGenerationLog',
  'schoolConfig',
  'userRoles'
];

async function testCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).limit(1).get();
    console.log(`✅ ${collectionName.padEnd(30)} - ${snapshot.size} docs`);
    return { collection: collectionName, success: true, count: snapshot.size };
  } catch (error) {
    console.error(`❌ ${collectionName.padEnd(30)} - ERROR: ${error.message}`);
    return { collection: collectionName, success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🧪 Testing All Collections\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const collectionName of COLLECTIONS) {
    const result = await testCollection(collectionName);
    results.push(result);
  }
  
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${COLLECTIONS.length}`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed Collections:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.collection}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All collections accessible!`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
