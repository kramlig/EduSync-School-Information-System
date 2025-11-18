#!/usr/bin/env node
/**
 * PATCH MISSING DATA
 * Quick patch to add missing coreValues and feeStructures
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);
const projectArg = args.find(arg => arg.startsWith('--project='));
const projectAlias = projectArg ? projectArg.split('=')[1] : 'staging';

const PROJECT_MAP = {
  'production': 'edusync-sis',
  'staging': 'edusync-staging'
};

const PROJECT_ID = PROJECT_MAP[projectAlias] || 'edusync-staging';

console.log('🔧 PATCH MISSING DATA');
console.log(`📍 Project: ${PROJECT_ID}\n`);

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

const CORE_VALUES = [
  { id: 'cv_maka_diyos', name: 'Maka-Diyos', order: 1 },
  { id: 'cv_maka_tao', name: 'Maka-Tao', order: 2 },
  { id: 'cv_maka_kalikasan', name: 'Maka-Kalikasan', order: 3 },
  { id: 'cv_maka_bansa', name: 'Maka-Bansa', order: 4 },
  { id: 'cv_respect', name: 'Respect', order: 5 }
];

const FEE_STRUCTURES = [
  {
    id: 'fee_grade_1_6',
    name: 'Elementary Fee Structure',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    schoolYear: '2024-2025',
    fees: [
      { name: 'Miscellaneous Fee', amount: 500, required: true },
      { name: 'Laboratory Fee', amount: 200, required: true }
    ],
    totalAmount: 700,
    isActive: true
  },
  {
    id: 'fee_grade_7_10',
    name: 'Junior High Fee Structure',
    gradeLevel: [7, 8, 9, 10],
    schoolYear: '2024-2025',
    fees: [
      { name: 'Miscellaneous Fee', amount: 800, required: true },
      { name: 'Laboratory Fee', amount: 400, required: true },
      { name: 'Computer Fee', amount: 300, required: true }
    ],
    totalAmount: 1500,
    isActive: true
  },
  {
    id: 'fee_grade_11_12',
    name: 'Senior High Fee Structure',
    gradeLevel: [11, 12],
    schoolYear: '2024-2025',
    fees: [
      { name: 'Miscellaneous Fee', amount: 1000, required: true },
      { name: 'Laboratory Fee', amount: 600, required: true },
      { name: 'Computer Fee', amount: 500, required: true }
    ],
    totalAmount: 2100,
    isActive: true
  }
];

async function main() {
  try {
    // Add missing core values
    console.log('💎 Adding Core Values...');
    const cvBatch = db.batch();
    for (const cv of CORE_VALUES) {
      cvBatch.set(db.collection('coreValues').doc(cv.id), {
        ...cv,
        description: `DepEd Core Value: ${cv.name}`
      });
    }
    await cvBatch.commit();
    console.log(`   ✅ Created ${CORE_VALUES.length} core values\n`);

    // Add fee structures
    console.log('💰 Adding Fee Structures...');
    const feeBatch = db.batch();
    for (const fee of FEE_STRUCTURES) {
      feeBatch.set(db.collection('feeStructures').doc(fee.id), fee);
    }
    await feeBatch.commit();
    console.log(`   ✅ Created ${FEE_STRUCTURES.length} fee structures\n`);

    console.log('✅ PATCH COMPLETE!\n');
    console.log('💡 Run check again: node scripts/check-e2e-readiness.cjs --project=staging');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
