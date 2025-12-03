/**
 * Sync Users from Firestore to PostgreSQL
 * 
 * This script migrates user data from Firestore "users" collection to PostgreSQL "users" table.
 * It maintains Firebase Auth as the authentication system and PostgreSQL as the data store.
 * 
 * Usage: node scripts/migration/sync-users-to-postgresql.js
 */

const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// Initialize Firebase Admin (emulator mode - no service account needed)
const projectId = process.env.GCLOUD_PROJECT || 'edusync-local';
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: projectId
  });
}

const db = admin.firestore();

// Connect to Firestore emulator
if (process.env.FIRESTORE_EMULATOR_HOST || projectId.includes('local')) {
  const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8086';
  process.env.FIRESTORE_EMULATOR_HOST = host;
  console.log(`🔧 Using Firestore emulator: ${host}`);
}

// Initialize Supabase
const supabaseUrl = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjUzNjQ1MCwiZXhwIjoyMDQ4MTEyNDUwfQ.pKqXRGTgBJMOPMPpuHU0xOqFTB0x_a1KU7R9yG0dShs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Role mapping: Firestore role → PostgreSQL enum
const VALID_ROLES = ['admin', 'teacher', 'student', 'parent', 'principal', 'registrar', 'superadmin'];

/**
 * Main sync function
 */
async function syncUsersToPostgreSQL() {
  console.log('🔄 Starting Firestore → PostgreSQL users sync...\n');

  try {
    // Step 1: Fetch all users from Firestore
    console.log('Step 1: Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    const firestoreUsers = [];

    usersSnapshot.forEach(doc => {
      firestoreUsers.push({
        id: doc.id, // Firebase Auth UID
        ...doc.data()
      });
    });

    console.log(`✅ Found ${firestoreUsers.length} users in Firestore\n`);

    if (firestoreUsers.length === 0) {
      console.log('⚠️  No users found in Firestore. Nothing to sync.');
      return;
    }

    // Step 2: Check existing users in PostgreSQL
    console.log('Step 2: Checking existing users in PostgreSQL...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('firebase_uid');

    if (fetchError) {
      console.error('❌ Error fetching existing users:', fetchError);
      throw fetchError;
    }

    const existingUids = new Set((existingUsers || []).map(u => u.firebase_uid));
    console.log(`✅ Found ${existingUids.size} existing users in PostgreSQL\n`);

    // Step 3: Prepare users for insertion/update
    console.log('Step 3: Preparing users for sync...');
    const usersToInsert = [];
    const usersToUpdate = [];
    let skipped = 0;

    for (const user of firestoreUsers) {
      // Validate required fields
      if (!user.email || !user.role || !user.schoolId) {
        console.warn(`⚠️  Skipping user ${user.id}: Missing required fields (email, role, or schoolId)`);
        skipped++;
        continue;
      }

      // Validate role
      if (!VALID_ROLES.includes(user.role)) {
        console.warn(`⚠️  Skipping user ${user.id}: Invalid role "${user.role}"`);
        skipped++;
        continue;
      }

      const postgresUser = {
        firebase_uid: user.id,
        school_id: user.schoolId,
        email: user.email.toLowerCase(),
        role: user.role,
        name: user.name || user.displayName || user.email.split('@')[0],
        avatar_url: user.photoURL || null,
        is_active: user.isActive !== false, // Default to true
        created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingUids.has(user.id)) {
        usersToUpdate.push(postgresUser);
      } else {
        usersToInsert.push(postgresUser);
      }
    }

    console.log(`✅ Prepared ${usersToInsert.length} new users, ${usersToUpdate.length} updates, ${skipped} skipped\n`);

    // Step 4: Insert new users
    if (usersToInsert.length > 0) {
      console.log(`Step 4a: Inserting ${usersToInsert.length} new users...`);
      
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(usersToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error inserting users:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully inserted ${inserted?.length || 0} users\n`);
    }

    // Step 5: Update existing users
    if (usersToUpdate.length > 0) {
      console.log(`Step 4b: Updating ${usersToUpdate.length} existing users...`);
      
      let updated = 0;
      for (const user of usersToUpdate) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            school_id: user.school_id,
            email: user.email,
            role: user.role,
            name: user.name,
            avatar_url: user.avatar_url,
            is_active: user.is_active,
            updated_at: user.updated_at
          })
          .eq('firebase_uid', user.firebase_uid);

        if (updateError) {
          console.error(`❌ Error updating user ${user.firebase_uid}:`, updateError);
        } else {
          updated++;
        }
      }

      console.log(`✅ Successfully updated ${updated} users\n`);
    }

    // Step 6: Verify sync
    console.log('Step 5: Verifying sync...');
    const { data: allUsers, error: verifyError } = await supabase
      .from('users')
      .select('firebase_uid, email, role, school_id');

    if (verifyError) {
      console.error('❌ Error verifying sync:', verifyError);
      throw verifyError;
    }

    console.log(`✅ Total users in PostgreSQL: ${allUsers?.length || 0}`);
    
    // Show sample users
    console.log('\nSample users:');
    (allUsers || []).slice(0, 5).forEach(u => {
      console.log(`  - ${u.email} (${u.role}) [${u.firebase_uid.substring(0, 8)}...]`);
    });

    console.log('\n🎉 Sync completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total Firestore users: ${firestoreUsers.length}`);
    console.log(`   New users inserted: ${usersToInsert.length}`);
    console.log(`   Existing users updated: ${usersToUpdate.length}`);
    console.log(`   Users skipped: ${skipped}`);
    console.log(`   Final PostgreSQL count: ${allUsers?.length || 0}`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncUsersToPostgreSQL()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
