#!/usr/bin/env node
/**
 * Create/Fix Superadmin Account for Production
 * 
 * Creates the superadmin account in:
 * 1. Firebase Authentication (with custom claims)
 * 2. PostgreSQL teachers table (with role='superadmin')
 * 
 * Usage:
 *   node scripts/create-superadmin-production.cjs
 * 
 * Credentials:
 *   Email: superadmin-demo@edusync.ph
 *   Password: Demo123!
 */

const { createClient } = require('@supabase/supabase-js');

// Production Supabase credentials
const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('\nSet it with:');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('  node scripts/create-superadmin-production.cjs');
  process.exit(1);
}

async function run() {
  const { initializeApp } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  
  // Initialize Firebase Admin for production
  delete process.env.FIRESTORE_EMULATOR_HOST;
  initializeApp({ projectId: 'edusync-sis' });
  const auth = getAuth();
  
  // Initialize Supabase with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
  
  console.log('\n👑 CREATE SUPERADMIN ACCOUNT');
  console.log('═'.repeat(60));
  console.log('📍 Firebase Project: edusync-sis (PRODUCTION)');
  console.log('📍 Supabase Project: pgszjvgbgsfyptrfsxny');
  console.log('═'.repeat(60));
  
  const email = 'superadmin-demo@edusync.ph';
  const password = 'Demo123!';
  const displayName = 'Demo Superadmin';
  
  try {
    // ==========================================
    // STEP 1: Firebase Auth
    // ==========================================
    console.log('\n1️⃣  Firebase Authentication...');
    
    let firebaseUid;
    try {
      // Check if exists
      const existingUser = await auth.getUserByEmail(email);
      firebaseUid = existingUser.uid;
      console.log(`   ⚠️  User already exists in Firebase Auth (UID: ${firebaseUid})`);
      
      // Update password
      await auth.updateUser(firebaseUid, { password: password });
      console.log('   ✅ Password updated');
    } catch (error) {
      // Create new user
      const newUser = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: true
      });
      firebaseUid = newUser.uid;
      console.log(`   ✅ Created new user (UID: ${firebaseUid})`);
    }
    
    // Set custom claims for superadmin
    await auth.setCustomUserClaims(firebaseUid, {
      role: 'superadmin',
      isSuperAdmin: true,
      schoolId: null,  // Superadmin has no specific school
      schoolIds: []    // Can access all schools
    });
    console.log('   ✅ Custom claims set (role: superadmin, isSuperAdmin: true)');
    
    // ==========================================
    // STEP 2: PostgreSQL (via Supabase)
    // ==========================================
    console.log('\n2️⃣  PostgreSQL Database...');
    
    // Check if exists in teachers table
    const { data: existing, error: checkError } = await supabase
      .from('teachers')
      .select('id, email, role')
      .eq('firebase_uid', firebaseUid)
      .single();
    
    if (existing) {
      console.log(`   ⚠️  User already exists in PostgreSQL (ID: ${existing.id})`);
      
      // Update role if needed
      if (existing.role !== 'superadmin') {
        const { error: updateError } = await supabase
          .from('teachers')
          .update({ role: 'superadmin' })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('   ❌ Failed to update role:', updateError.message);
        } else {
          console.log('   ✅ Role updated to superadmin');
        }
      }
    } else {
      // Insert new record with correct column names
      const { data: inserted, error: insertError } = await supabase
        .from('teachers')
        .insert({
          firebase_uid: firebaseUid,
          email: email,
          first_name: 'Demo',
          last_name: 'Superadmin',
          role: 'superadmin',
          school_id: null,  // Superadmin has no specific school
          status: 'active'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('   ❌ Failed to insert:', insertError.message);
        
        // Try checking if school_id null is allowed
        if (insertError.message.includes('violates foreign key') || insertError.message.includes('violates not-null')) {
          console.log('\n   💡 school_id constraint issue - superadmin may need special handling');
          console.log('   Attempting alternative: insert into users table only...');
          
          // Try users table instead
          const { error: userError } = await supabase
            .from('users')
            .insert({
              firebase_uid: firebaseUid,
              email: email,
              name: displayName,
              role: 'superadmin',
              is_active: true
            });
          
          if (userError) {
            console.error('   ❌ Users table insert also failed:', userError.message);
          } else {
            console.log('   ✅ Created record in users table');
          }
        }
      } else {
        console.log(`   ✅ Created record in teachers table (ID: ${inserted.id})`);
      }
    }
    
    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n' + '═'.repeat(60));
    console.log('✅ SUPERADMIN ACCOUNT READY');
    console.log('═'.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID:      ${firebaseUid}`);
    console.log('\n🎯 Login URL:');
    console.log('   https://edusync.ph/admin');
    console.log('   Select "Staff" tab → Enter credentials\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

run();
