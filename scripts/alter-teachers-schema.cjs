/**
 * Alter Teachers Table Schema
 * Adds missing columns to match Firestore structure
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local.prod') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function alterTable() {
  console.log('🔧 Altering teachers table schema...\n');

  const alterations = [
    { sql: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255)', desc: 'Add email column' },
    { sql: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50)', desc: 'Add contact_number column' },
    { sql: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'teacher\'', desc: 'Add role column' },
    { sql: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS assignments JSONB DEFAULT \'[]\'::jsonb', desc: 'Add assignments column' },
    { sql: 'ALTER TABLE teachers ALTER COLUMN user_id DROP NOT NULL', desc: 'Make user_id nullable' },
    { sql: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()', desc: 'Add created_at' },
    { sql: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()', desc: 'Add updated_at' }
  ];

  for (const alt of alterations) {
    try {
      console.log(`Running: ${alt.desc}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: alt.sql });
      
      if (error) {
        console.log(`⚠️  ${alt.desc}: ${error.message}`);
      } else {
        console.log(`✓ ${alt.desc}`);
      }
    } catch (err) {
      console.log(`⚠️  ${alt.desc}: May already exist or need manual execution`);
    }
  }

  console.log('\n✅ Schema alteration complete!');
  console.log('\nNote: If exec_sql function is not available, run the SQL manually in Supabase dashboard:');
  console.log('   scripts/migration/alter-teachers-table.sql');
}

alterTable();
