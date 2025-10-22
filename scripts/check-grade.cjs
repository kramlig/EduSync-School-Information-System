#!/usr/bin/env node
/**
 * Check a specific grade document in Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('./edusync-sis-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'edusync-sis',
});

const db = admin.firestore();

async function checkGrade() {
  const gradeId = process.argv[2] || 'g_s_elem_0003_la_english_elem';
  
  console.log('\n🔍 Checking grade:', gradeId);
  console.log('─'.repeat(60));
  
  try {
    const docRef = db.collection('grades').doc(gradeId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ Grade document does NOT exist in Firestore!');
      console.log('\nChecking if there are ANY grades in the collection...');
      
      const snapshot = await db.collection('grades').limit(5).get();
      console.log(`Found ${snapshot.size} grades (showing first 5):`);
      snapshot.forEach(doc => {
        console.log(`  - ${doc.id}`);
      });
    } else {
      console.log('✅ Grade document EXISTS in Firestore');
      console.log('\nDocument data:');
      console.log(JSON.stringify(doc.data(), null, 2));
    }
    
    console.log('─'.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkGrade();
