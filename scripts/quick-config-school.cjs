#!/usr/bin/env node
/**
 * Quick School Configuration Script
 * Configures school type for flexible system
 */

const admin = require('firebase-admin');

// Use emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9100';

const projectId = 'edusync-local';

console.log('\n🔧 Quick School Configuration\n');
console.log('📍 Target: 🧪 EMULATOR (edusync-local)\n');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

// Get configuration from command line argument
const configType = process.argv[2] || 'hybrid'; // Default to hybrid

const CONFIGS = {
  public: {
    schoolType: 'public',
    enrollmentConfig: {
      requiresApplication: true,
      requiresDocuments: true,
      autoApprove: false,
      allowSelfRegistration: true
    }
  },
  private: {
    schoolType: 'private',
    financialConfig: {
      enabled: true,
      currency: 'PHP',
      requiresPayment: true,
      allowPartialPayment: true,
      gracePeriodDays: 7,
      penaltyRate: 0.02
    },
    enrollmentConfig: {
      requiresApplication: true,
      requiresDocuments: true,
      autoApprove: false,
      allowSelfRegistration: true
    }
  },
  hybrid: {
    schoolType: 'hybrid',
    financialConfig: {
      enabled: true,
      currency: 'PHP',
      requiresPayment: false,
      allowPartialPayment: true,
      gracePeriodDays: 30,
      penaltyRate: 0.01
    },
    enrollmentConfig: {
      requiresApplication: true,
      requiresDocuments: true,
      autoApprove: false,
      allowSelfRegistration: true
    }
  }
};

async function updateSchoolSettings() {
  try {
    const config = CONFIGS[configType];
    
    if (!config) {
      console.error(`❌ Invalid config type: ${configType}`);
      console.log('Valid options: public, private, hybrid');
      process.exit(1);
    }

    console.log(`🎯 Configuring as: ${configType.toUpperCase()} school\n`);

    // Get or create settings document
    const settingsRef = db.collection('settings').doc('school');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      console.log('⚠️  Settings document does not exist. Creating new one...');
      await settingsRef.set({
        schoolName: 'EduSync School',
        currentSchoolYear: '2023-2024',
        currentQuarter: 1,
        ...config,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('📝 Updating existing settings document...');
      await settingsRef.update({
        ...config,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log('\n✅ School settings updated successfully!\n');
    console.log('📊 Configuration:');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n🚀 You can now start building the enrollment system!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating settings:', error.message);
    process.exit(1);
  }
}

updateSchoolSettings();
