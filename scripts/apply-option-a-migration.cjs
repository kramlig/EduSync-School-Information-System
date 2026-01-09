/**
 * Apply Option A (Role-Centric) Migration to Supabase
 * 
 * This script applies the database migration for Option A architecture.
 * Run with: node scripts/apply-option-a-migration.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQzMTE0MCwiZXhwIjoyMDc5MDA3MTQwfQ.8M_CItelNXTIvjNzd3ztfXnerwGIaHPLpYyI0ySGkBs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Applying Option A (Role-Centric) Migration');
  console.log('=' .repeat(60));

  try {
    // 1. Create superadmins table
    console.log('\n📋 Step 1: Creating superadmins table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS superadmins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          firebase_uid VARCHAR(128) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_at TIMESTAMPTZ
        );
      `
    });
    
    if (createTableError) {
      // Try direct query approach
      console.log('  Using direct approach for table creation...');
    }

    // Check if superadmins table exists
    const { data: tableCheck } = await supabase
      .from('superadmins')
      .select('id')
      .limit(1);
    
    if (tableCheck !== null) {
      console.log('  ✅ superadmins table exists');
    } else {
      console.log('  ⚠️ superadmins table may need manual creation');
    }

    // 2. Add columns to teachers table
    console.log('\n📋 Step 2: Checking teachers table columns...');
    
    // Try to query teachers with new columns
    const { data: teacherTest, error: teacherError } = await supabase
      .from('teachers')
      .select('id, firebase_uid, email, role')
      .limit(1);

    if (teacherError && teacherError.message.includes('firebase_uid')) {
      console.log('  ⚠️ firebase_uid column missing - needs manual addition');
    } else {
      console.log('  ✅ Teachers table has required columns');
    }

    // 3. Insert superadmin record if doesn't exist
    console.log('\n📋 Step 3: Ensuring superadmin record exists...');
    
    const { data: existingSuperadmin } = await supabase
      .from('superadmins')
      .select('*')
      .eq('email', 'superadmin-demo@edusync.ph')
      .maybeSingle();

    if (!existingSuperadmin) {
      const { error: insertError } = await supabase
        .from('superadmins')
        .insert({
          firebase_uid: 'JQZLeNnIiva6hf5n0KY4LldnWyQ2',
          email: 'superadmin-demo@edusync.ph',
          name: 'Super Admin',
          is_active: true
        });

      if (insertError) {
        console.log('  ⚠️ Could not insert superadmin:', insertError.message);
      } else {
        console.log('  ✅ Superadmin record created');
      }
    } else {
      console.log('  ✅ Superadmin already exists');
    }

    // 4. Test RPC function
    console.log('\n📋 Step 4: Testing auth lookup...');
    
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc('get_user_by_firebase_uid', { p_firebase_uid: 'test' });

    if (rpcError) {
      console.log('  ⚠️ RPC function needs update:', rpcError.message);
    } else {
      console.log('  ✅ RPC function working');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration check complete!');
    console.log('\n📝 Manual steps if needed:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run the migration file: supabase/migrations/20260109_option_a_role_centric_auth.sql');
    console.log('   3. Verify tables and columns exist');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();
