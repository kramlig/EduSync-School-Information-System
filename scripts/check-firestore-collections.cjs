#!/usr/bin/env node

/**
 * Script to check what collections exist in Firestore
 * and specifically look for core value grades collection
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found!');
  console.log('Please download from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCollections() {
  console.log('🔍 Checking Firestore collections...\n');
  
  try {
    // List all collections
    const collections = await db.listCollections();
    
    console.log('📚 Found collections:');
    collections.forEach(col => {
      console.log(`  - ${col.id}`);
    });
    
    console.log('\n🎯 Looking for core value grades collection...\n');
    
    // Check various possible names
    const possibleNames = [
      'coreValueGrades',
      'corevaluesgrades',
      'core_value_grades',
      'CoreValueGrades',
      'core-value-grades',
      'coreValuesGrades',
      'corevaluesGrades'
    ];
    
    for (const name of possibleNames) {
      try {
        const snapshot = await db.collection(name).limit(1).get();
        if (!snapshot.empty) {
          console.log(`✅ Found collection: "${name}" with ${snapshot.size} document(s)`);
          
          // Show sample document
          const doc = snapshot.docs[0];
          console.log(`   Sample document ID: ${doc.id}`);
          console.log(`   Sample data:`, JSON.stringify(doc.data(), null, 2));
        } else {
          const collectionRef = db.collection(name);
          const exists = collections.some(c => c.id === name);
          if (exists) {
            console.log(`⚠️  Collection "${name}" exists but is EMPTY`);
          }
        }
      } catch (error) {
        // Collection doesn't exist
      }
    }
    
    console.log('\n✅ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCollections();
