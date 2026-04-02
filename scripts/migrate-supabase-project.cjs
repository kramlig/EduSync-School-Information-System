/**
 * Supabase Project Migration Script
 * 
 * Migrates ALL data from old Supabase project to new one via REST API.
 * Handles foreign key ordering and large table pagination.
 * 
 * Usage:
 *   node scripts/migrate-supabase-project.cjs
 * 
 * Environment variables (set before running):
 *   OLD_SUPABASE_URL, OLD_SUPABASE_KEY (anon or service_role from old project)
 *   NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY (service_role from new project)
 */

const { createClient } = require('@supabase/supabase-js');

// ======================== CONFIG ========================
const OLD_URL = process.env.OLD_SUPABASE_URL || 'https://zjuxulhxxeeupcskkcok.supabase.co';
const OLD_KEY = process.env.OLD_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const NEW_URL = process.env.NEW_SUPABASE_URL || 'https://ojahhzdibhfrjazgwvfw.supabase.co';
const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYWhoemRpYmhmcmphemd3dmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NDY4OSwiZXhwIjoyMDkwNTMwNjg5fQ.L8zdFElsYcnMDyd3ggthhgzYxPrbFMwEcHV4_at6vZ4';

const oldDb = createClient(OLD_URL, OLD_KEY, { auth: { persistSession: false } });
const newDb = createClient(NEW_URL, NEW_KEY, { auth: { persistSession: false } });

// Tables in FK dependency order (parents before children)
const TABLES_IN_ORDER = [
  'schools',
  'users',
  'superadmins',
  'division_users',
  'subscriptions',
  'teachers',
  'sections',
  'students',
  'parents',
  'parent_students',
  'learning_areas',
  'grades',
  'core_values',
  'core_value_grades',
  'attendance_records',
  'announcements',
  'teaching_assignments',
  'class_schedules',
  'enrollment_applications',
  'student_health_records',
  'ecr_weights',
  'ecr_activities',
  'ecr_scores',
  'ecr_component_grades',
  'fee_structures',
  'student_ledgers',
  'receipts',
  'billing_statements',
  'lesson_plans',
  'elln_assessments',
];

const BATCH_SIZE = 500; // Rows per insert batch
const PAGE_SIZE = 1000; // Rows per fetch page

// ======================== HELPERS ========================

async function fetchAllRows(table) {
  const rows = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await oldDb
      .from(table)
      .select('*')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('created_at', { ascending: true, nullsFirst: true });

    if (error) {
      // Try without ordering (some tables may not have created_at)
      const { data: data2, error: error2 } = await oldDb
        .from(table)
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (error2) {
        console.error(`  ❌ Error fetching ${table} at offset ${offset}:`, error2.message);
        return rows;
      }
      if (data2) rows.push(...data2);
      hasMore = data2 && data2.length === PAGE_SIZE;
    } else {
      if (data) rows.push(...data);
      hasMore = data && data.length === PAGE_SIZE;
    }
    
    offset += PAGE_SIZE;
    if (rows.length % 5000 === 0 && rows.length > 0) {
      process.stdout.write(`  ... ${rows.length} rows fetched\r`);
    }
  }

  return rows;
}

async function insertBatch(table, rows) {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    const { error } = await newDb
      .from(table)
      .insert(batch);

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/BATCH_SIZE)+1} error:`, error.message);
      
      // Try inserting one by one for failed batch
      for (const row of batch) {
        const { error: singleError } = await newDb.from(table).insert(row);
        if (singleError) {
          failed++;
          if (failed <= 3) {
            console.error(`    Row error (${table}):`, singleError.message, 'Row ID:', row.id || 'N/A');
          }
        } else {
          success++;
        }
      }
    } else {
      success += batch.length;
    }

    // Progress
    const total = Math.min(i + BATCH_SIZE, rows.length);
    process.stdout.write(`  Inserted ${total}/${rows.length} (${failed} failures)\r`);
  }

  return { success, failed };
}

// ======================== MAIN ========================

async function migrate() {
  console.log('🚀 Supabase Project Migration');
  console.log(`   From: ${OLD_URL}`);
  console.log(`   To:   ${NEW_URL}`);
  console.log('');

  // Verify connections
  const { data: oldTest } = await oldDb.from('schools').select('id').limit(1);
  if (!oldTest || oldTest.length === 0) {
    console.error('❌ Cannot connect to old project');
    process.exit(1);
  }
  console.log('✅ Old project accessible');

  const { error: newTest } = await newDb.from('schools').select('id').limit(1);
  if (newTest && newTest.code === '42P01') {
    console.log('ℹ️  New project tables not created yet — schema must be applied first!');
    console.log('   Run the schema SQL in the new project SQL Editor first.');
    console.log('   See: scripts/supabase-schema-export.sql');
    process.exit(1);
  }
  console.log('✅ New project accessible');
  console.log('');

  const results = {};

  for (const table of TABLES_IN_ORDER) {
    process.stdout.write(`📦 ${table}: fetching...`);
    
    const rows = await fetchAllRows(table);
    
    if (rows.length === 0) {
      console.log(`\r📦 ${table}: 0 rows (skipped)`);
      results[table] = { fetched: 0, success: 0, failed: 0 };
      continue;
    }

    process.stdout.write(`\r📦 ${table}: ${rows.length} rows → inserting...      \n`);
    
    const { success, failed } = await insertBatch(table, rows);
    
    console.log(`   ✅ ${success} inserted, ${failed} failed`);
    results[table] = { fetched: rows.length, success, failed };
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  
  let totalFetched = 0, totalSuccess = 0, totalFailed = 0;
  for (const [table, r] of Object.entries(results)) {
    if (r.fetched > 0) {
      const status = r.failed === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${table}: ${r.success}/${r.fetched} (${r.failed} failed)`);
    }
    totalFetched += r.fetched;
    totalSuccess += r.success;
    totalFailed += r.failed;
  }
  
  console.log('');
  console.log(`  Total: ${totalSuccess}/${totalFetched} rows migrated, ${totalFailed} failures`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 Migration complete! All data transferred successfully.');
  } else {
    console.log('\n⚠️  Migration complete with some failures. Review errors above.');
  }
}

migrate().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
