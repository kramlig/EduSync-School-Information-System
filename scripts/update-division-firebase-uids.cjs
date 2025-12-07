/**
 * Update Division Users with Real Firebase UIDs
 * 
 * This script looks up Firebase UIDs for division user emails
 * and updates the division_users table.
 * 
 * Run with: 
 *   set GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
 *   node scripts/update-division-firebase-uids.cjs
 */

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize Firebase Admin
async function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!serviceAccountPath) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    console.error('   Set it to your Firebase service account JSON file path');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Supabase client
const supabase = createClient(
  'https://zjuxulhxxeeupcskkcok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0'
);

const DIVISION_EMAILS = [
  'div.admin@zamboanga.deped.gov.ph',
  'supervisor@zamboanga.deped.gov.ph',
  'psds.west@zamboanga.deped.gov.ph',
  'eps.math@zamboanga.deped.gov.ph',
  'data.manager@zamboanga.deped.gov.ph',
];

async function updateFirebaseUids() {
  await initializeFirebase();
  
  console.log('🔄 Updating division_users with real Firebase UIDs...\n');

  for (const email of DIVISION_EMAILS) {
    try {
      // Get Firebase user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      const firebaseUid = userRecord.uid;
      
      console.log(`📧 ${email}`);
      console.log(`   Firebase UID: ${firebaseUid}`);

      // Update Supabase division_users table
      const { data, error } = await supabase
        .from('division_users')
        .update({ firebase_uid: firebaseUid })
        .eq('email', email)
        .select();

      if (error) {
        console.log(`   ⚠️ Supabase update error: ${error.message}`);
        
        // If no row exists, insert one
        if (error.code === 'PGRST116' || data?.length === 0) {
          console.log(`   ℹ️ No existing record found. You may need to insert manually.`);
        }
      } else if (data && data.length > 0) {
        console.log(`   ✅ Updated successfully!`);
      } else {
        console.log(`   ℹ️ No rows updated (record may not exist for this email)`);
      }
      
      console.log('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`📧 ${email}`);
        console.log(`   ⚠️ Firebase user not found`);
        console.log('');
      } else {
        console.error(`❌ Error for ${email}:`, err.message);
      }
    }
  }

  console.log('✅ Done!');
  console.log('\nRun this SQL in Supabase to verify:');
  console.log('SELECT email, firebase_uid, name, role FROM division_users WHERE is_active = true;');
  
  process.exit(0);
}

updateFirebaseUids().catch(console.error);
