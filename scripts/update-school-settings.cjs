#!/usr/bin/env node
/**
 * Update School Settings to Support Flexible School Types
 * 
 * This script updates the school settings document to include:
 * - schoolType (public/private/hybrid)
 * - financialConfig (for private/hybrid schools)
 * - enrollmentConfig (for all schools)
 * 
 * Usage:
 * 1. For Emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8086 node scripts/update-school-settings.cjs
 * 2. For Production: node scripts/update-school-settings.cjs
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Check if running against emulator
const isEmulator = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = isEmulator ? 'edusync-local' : 'edusync-sis';

console.log('\n🔧 School Settings Update Script\n');
console.log(`📍 Target: ${isEmulator ? '🧪 EMULATOR' : '🔥 PRODUCTION'} (${projectId})\n`);

// Initialize Firebase Admin
if (isEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

// School type configurations
const SCHOOL_CONFIGS = {
  public: {
    schoolType: 'public',
    enrollmentConfig: {
      requiresApplication: true,
      requiresDocuments: true,
      autoApprove: false,
      allowSelfRegistration: true,
      academicYearStart: '2025-06-03',
      academicYearEnd: '2026-03-31'
    }
    // No financialConfig for public schools
  },
  
  private: {
    schoolType: 'private',
    enrollmentConfig: {
      requiresApplication: true,
      requiresDocuments: true,
      autoApprove: false,
      allowSelfRegistration: true,
      academicYearStart: '2025-06-03',
      academicYearEnd: '2026-03-31'
    },
    financialConfig: {
      enabled: true,
      currency: 'PHP',
      requiresPayment: true,
      allowPartialPayment: true,
      gracePeriodDays: 7,
      penaltyRate: 2 // 2% per month
    }
  },
  
  hybrid: {
    schoolType: 'hybrid',
    enrollmentConfig: {
      requiresApplication: true,
      requiresDocuments: true,
      autoApprove: false,
      allowSelfRegistration: true,
      academicYearStart: '2025-06-03',
      academicYearEnd: '2026-03-31'
    },
    financialConfig: {
      enabled: true,
      currency: 'PHP',
      requiresPayment: false, // Optional payment
      allowPartialPayment: true,
      gracePeriodDays: 30,
      penaltyRate: 0 // No penalties
    }
  }
};

// Interactive prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateSchoolSettings() {
  try {
    // Get current settings
    const settingsRef = db.collection('settings').doc('school');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
      console.error('❌ School settings document not found!');
      console.log('   Run the seed script first to create the settings document.');
      process.exit(1);
    }
    
    const currentSettings = settingsDoc.data();
    console.log('📋 Current School Settings:\n');
    console.log(`   School Name: ${currentSettings.schoolName}`);
    console.log(`   Region: ${currentSettings.region}`);
    console.log(`   School Year: ${currentSettings.schoolYear}`);
    console.log(`   Current Type: ${currentSettings.schoolType || 'Not set'}\n`);
    
    // Ask for school type
    console.log('🏫 Select School Type:\n');
    console.log('   1. Public School (No financial features)');
    console.log('   2. Private School (Full financial features)');
    console.log('   3. Hybrid School (Optional financial features)');
    console.log('   4. Cancel\n');
    
    const choice = await prompt('Enter choice (1-4): ');
    
    let schoolType;
    switch (choice) {
      case '1':
        schoolType = 'public';
        break;
      case '2':
        schoolType = 'private';
        break;
      case '3':
        schoolType = 'hybrid';
        break;
      case '4':
        console.log('\n❌ Update cancelled.\n');
        process.exit(0);
        break;
      default:
        console.log('\n❌ Invalid choice. Update cancelled.\n');
        process.exit(1);
    }
    
    const config = SCHOOL_CONFIGS[schoolType];
    
    console.log('\n📝 Configuration to apply:\n');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    
    const confirm = await prompt('Apply this configuration? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Update cancelled.\n');
      process.exit(0);
    }
    
    // Update the document
    console.log('\n🔄 Updating school settings...');
    await settingsRef.update(config);
    
    console.log('✅ School settings updated successfully!\n');
    
    // Show summary
    console.log('📊 Summary:\n');
    console.log(`   School Type: ${config.schoolType}`);
    console.log(`   Enrollment Application: ${config.enrollmentConfig.requiresApplication ? 'Required' : 'Optional'}`);
    console.log(`   Document Upload: ${config.enrollmentConfig.requiresDocuments ? 'Required' : 'Optional'}`);
    
    if (config.financialConfig) {
      console.log(`   Financial Features: ✅ Enabled`);
      console.log(`   Currency: ${config.financialConfig.currency}`);
      console.log(`   Payment Required: ${config.financialConfig.requiresPayment ? 'Yes' : 'No'}`);
      console.log(`   Partial Payment: ${config.financialConfig.allowPartialPayment ? 'Allowed' : 'Not allowed'}`);
      console.log(`   Grace Period: ${config.financialConfig.gracePeriodDays} days`);
      console.log(`   Late Penalty: ${config.financialConfig.penaltyRate}% per month`);
    } else {
      console.log(`   Financial Features: ❌ Disabled (Public school)`);
    }
    
    console.log('\n✨ Configuration complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error updating school settings:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
updateSchoolSettings();
