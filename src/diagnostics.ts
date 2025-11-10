/**
 * Diagnostic utility to debug Firestore connection issues
 * Add this to your App.tsx to see what's happening
 */

import { getFirestoreInstance } from './services/firestoreService';
import { collection, getDocs } from 'firebase/firestore';

export async function runFirestoreDiagnostics() {
  console.log('\n🔍 ==================== FIRESTORE DIAGNOSTICS ====================');
  
  // FIRST: Test basic network connectivity to emulator
  console.log('🌐 Testing network connectivity to emulator...');
  try {
    const response = await fetch('http://127.0.0.1:8086/');
    console.log('  ✅ Emulator reachable via fetch!');
    console.log('  Response status:', response.status);
    const text = await response.text();
    console.log('  Response body:', text);
  } catch (fetchErr: any) {
    console.error('  ❌ Cannot reach emulator via fetch:', fetchErr.message);
    console.error('  This indicates a network/CORS/firewall issue!');
  }
  
  // 1. Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('  VITE_USE_FIREBASE_EMULATOR:', import.meta.env.VITE_USE_FIREBASE_EMULATOR);
  console.log('  VITE_FIRESTORE_EMULATOR_HOST:', import.meta.env.VITE_FIRESTORE_EMULATOR_HOST);
  console.log('  VITE_FIRESTORE_EMULATOR_PORT:', import.meta.env.VITE_FIRESTORE_EMULATOR_PORT);
  console.log('  MODE:', import.meta.env.MODE);
  
  // 2. Get Firestore instance
  console.log('\n📦 Getting Firestore instance...');
  const db = getFirestoreInstance();
  console.log('  Instance obtained:', !!db);
  console.log('  Instance type:', db?.type);
  console.log('  Instance app:', db?.app?.name);
  
  // 3. CRITICAL: Check what host Firestore is actually using
  console.log('\n🔍 CRITICAL HOST CHECK:');
  const dbInternal = db as any;
  
  // Try multiple paths to find the host
  const paths = [
    dbInternal?._settings?.host,
    dbInternal?._delegate?._settings?.host,
    dbInternal?._delegate?._firestore?._settings?.host,
    dbInternal?.app?.options?.projectId,
  ];
  
  console.log('  Trying different internal paths:');
  paths.forEach((val, i) => console.log(`    Path ${i}:`, val));
  
  // Log full settings object
  console.log('  Full _settings:', JSON.stringify(dbInternal?._settings, null, 2));
  console.log('  Full _delegate._settings:', JSON.stringify(dbInternal?._delegate?._settings, null, 2));
  
  // 4. Try to query teachers collection
  console.log('\n🔍 Querying teachers collection...');
  try {
    const teachersRef = collection(db, 'teachers');
    console.log('  Collection ref created:', !!teachersRef);
    
    // Force network fetch by using getDocsFromServer
    console.log('  ⚡ Forcing SERVER query (bypassing cache)...');
    const { getDocsFromServer } = await import('firebase/firestore');
    const snapshot = await getDocsFromServer(teachersRef);
    console.log('  ✅ SERVER Query successful!');
    console.log('  Teachers found:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('  First 5 teachers:');
      snapshot.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`    - ${doc.id}: ${data.email} (schoolId: ${data.schoolId})`);
      });
    } else {
      console.log('  ⚠️ No teachers found in database');
    }
  } catch (error: any) {
    console.error('  ❌ Query failed:', error);
    console.error('  Error code:', error.code);
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
  }
  
  // 5. Check if we can read test collection
  console.log('\n✍️ Testing read capability...');
  try {
    const testRef = collection(db, '_diagnostics_test');
    await getDocs(testRef);
    console.log('  ✅ Read test collection successful');
  } catch (error: any) {
    console.error('  ❌ Read test failed:', error.message);
  }
  
  console.log('\n🔍 ==================== END DIAGNOSTICS ====================');
}

// DISABLED: Auto-run diagnostics was interfering with normal app operation
// It was deleting IndexedDB cache and running blocking queries on every page load
// To run diagnostics manually, call runFirestoreDiagnostics() from browser console
if (false && import.meta.env.MODE === 'development') {
  console.log('🚀 Auto-running Firestore diagnostics in 2 seconds...');
  
  // CRITICAL: Clear IndexedDB cache for emulator
  console.log('🗑️ Clearing IndexedDB cache...');
  if (typeof indexedDB !== 'undefined') {
    indexedDB.databases().then(dbs => {
      console.log('  Found databases:', dbs.map(db => db.name));
      dbs.forEach(db => {
        if (db.name && db.name.includes('firestore')) {
          console.log('  Deleting Firestore database:', db.name);
          indexedDB.deleteDatabase(db.name);
        }
      });
    }).catch(err => console.error('  Failed to list databases:', err));
  }
  
  setTimeout(() => {
    runFirestoreDiagnostics().catch(err => {
      console.error('Diagnostics failed:', err);
    });
  }, 2000);
}

// Export for manual use in browser console
(globalThis as any).runFirestoreDiagnostics = runFirestoreDiagnostics;
console.log(' To run diagnostics manually, type: runFirestoreDiagnostics()');
