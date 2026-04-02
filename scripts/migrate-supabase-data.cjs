/**
 * Complete Supabase Project Migration Script
 * Migrates data from OLD project to NEW project via REST API
 * 
 * Usage: node scripts/migrate-supabase-data.cjs
 * 
 * Prerequisites:
 * - Schema must already be created in new project (run SQL files first)
 * - Both projects must be accessible via REST API
 */

const OLD_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const NEW_URL = 'https://ojahhzdibhfrjazgwvfw.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYWhoemRpYmhmcmphemd3dmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NDY4OSwiZXhwIjoyMDkwNTMwNjg5fQ.L8zdFElsYcnMDyd3ggthhgzYxPrbFMwEcHV4_at6vZ4';

const BATCH_SIZE = 500; // Rows per insert batch
const FETCH_BATCH = 1000; // Rows per fetch from old project

// Tables to migrate in dependency order (parent tables first)
const TABLES = [
  // Tier 1: No dependencies
  'schools',
  'superadmins',
  'users',
  'core_values',
  'divisions',
  'districts',
  'referral_codes',
  'referral_credits_per_year',

  // Tier 2: Depends on schools
  'teachers',
  'sections',
  'announcements',
  'fee_structures',
  'subscriptions',
  'class_schedules',
  'lesson_plans',
  'school_invitations',
  'books',
  'usage_tracking',
  'workspace_migrations',
  'monthly_enrollment_snapshots',

  // Tier 3: Depends on teachers/sections
  'students',
  'teaching_assignments',
  'substitute_assignments',
  'ancillary_responsibilities',
  'learning_areas',
  'ecr_weights',
  'assignments',

  // Tier 4: Depends on students/learning_areas
  'grades',
  'core_value_grades',
  'attendance_records',
  'enrollment_applications',
  'student_health_records',
  'student_movements',
  'promotion_records',
  'homeroom_guidance_grades',
  'elln_assessments',
  'ecr_activities',
  'student_ledgers',
  'billing_statements',
  'receipts',
  'payment_history',
  'payment_proofs',
  'book_issuances',
  'textbook_distributions',
  'parents',
  'referrals',

  // Tier 5: Depends on parents/activities
  'parent_students',
  'ecr_scores',
  'ecr_component_grades',
  'student_assignment_grades',

  // Tier 6: Audit/logging
  'division_users',
  'division_audit_logs',
  'audit_log',
  'login_audit',
  'rate_limit_blocks',
];

async function fetchCount(table) {
  const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&limit=0`, {
    method: 'HEAD',
    headers: {
      'apikey': OLD_KEY,
      'Authorization': `Bearer ${OLD_KEY}`,
      'Prefer': 'count=exact'
    }
  });
  const range = res.headers.get('content-range');
  if (!range) return 0;
  const match = range.match(/\/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

async function fetchBatch(table, offset, limit) {
  const res = await fetch(
    `${OLD_URL}/rest/v1/${table}?select=*&order=id&offset=${offset}&limit=${limit}`, {
    headers: {
      'apikey': OLD_KEY,
      'Authorization': `Bearer ${OLD_KEY}`
    }
  });
  if (!res.ok) {
    // Try without ordering by id (some tables might not have id)
    const res2 = await fetch(
      `${OLD_URL}/rest/v1/${table}?select=*&offset=${offset}&limit=${limit}`, {
      headers: {
        'apikey': OLD_KEY,
        'Authorization': `Bearer ${OLD_KEY}`
      }
    });
    if (!res2.ok) {
      const err = await res2.text();
      throw new Error(`Fetch ${table} failed: ${res2.status} ${err}`);
    }
    return res2.json();
  }
  return res.json();
}

async function insertBatch(table, rows) {
  if (rows.length === 0) return { success: true, count: 0 };

  const res = await fetch(`${NEW_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': NEW_SERVICE_KEY,
      'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates' // Upsert on conflict
    },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const err = await res.text();
    // If upsert fails, try plain insert
    if (err.includes('405') || err.includes('ON CONFLICT')) {
      const res2 = await fetch(`${NEW_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': NEW_SERVICE_KEY,
          'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(rows)
      });
      if (!res2.ok) {
        const err2 = await res2.text();
        return { success: false, error: err2, count: 0 };
      }
      return { success: true, count: rows.length };
    }
    return { success: false, error: err, count: 0 };
  }
  return { success: true, count: rows.length };
}

async function migrateTable(table) {
  const startTime = Date.now();
  let totalCount;

  try {
    totalCount = await fetchCount(table);
  } catch (e) {
    console.log(`  ⚠ ${table}: Could not fetch count (table may not exist) - skipping`);
    return { table, status: 'skipped', count: 0, error: e.message };
  }

  if (totalCount === 0) {
    console.log(`  ⏭ ${table}: Empty (0 rows) - skipping`);
    return { table, status: 'empty', count: 0 };
  }

  console.log(`  📦 ${table}: ${totalCount} rows to migrate`);

  let offset = 0;
  let migrated = 0;
  let errors = [];

  while (offset < totalCount) {
    // Fetch batch from old project
    let rows;
    try {
      rows = await fetchBatch(table, offset, FETCH_BATCH);
    } catch (e) {
      console.log(`    ❌ Fetch error at offset ${offset}: ${e.message}`);
      errors.push(`Fetch@${offset}: ${e.message}`);
      offset += FETCH_BATCH;
      continue;
    }

    if (rows.length === 0) break;

    // Insert in smaller batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const result = await insertBatch(table, batch);
      if (result.success) {
        migrated += result.count;
      } else {
        console.log(`    ❌ Insert error at offset ${offset + i}: ${result.error.substring(0, 150)}`);
        errors.push(`Insert@${offset + i}: ${result.error.substring(0, 200)}`);
      }
    }

    offset += rows.length;
    if (totalCount > 1000) {
      const pct = Math.round((offset / totalCount) * 100);
      process.stdout.write(`    Progress: ${offset}/${totalCount} (${pct}%)\r`);
    }
  }

  if (totalCount > 1000) process.stdout.write('\n');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const status = errors.length === 0 ? 'success' : 'partial';
  console.log(`  ${status === 'success' ? '✅' : '⚠'} ${table}: ${migrated}/${totalCount} rows migrated in ${elapsed}s`);

  if (errors.length > 0) {
    console.log(`    Errors: ${errors.length}`);
  }

  return { table, status, count: migrated, total: totalCount, errors, elapsed };
}

async function main() {
  console.log('===================================');
  console.log('Supabase Data Migration');
  console.log('===================================');
  console.log(`From: ${OLD_URL}`);
  console.log(`To:   ${NEW_URL}`);
  console.log(`Tables: ${TABLES.length}`);
  console.log('');

  // First verify both projects are accessible
  console.log('Verifying connections...');

  try {
    const oldRes = await fetch(`${OLD_URL}/rest/v1/`, {
      headers: { 'apikey': OLD_KEY }
    });
    console.log(`  Old project: ${oldRes.ok ? '✅' : '❌'} (${oldRes.status})`);
    if (!oldRes.ok) throw new Error('Old project not accessible');
  } catch (e) {
    console.error('❌ Cannot reach old project:', e.message);
    process.exit(1);
  }

  try {
    const newRes = await fetch(`${NEW_URL}/rest/v1/`, {
      headers: { 'apikey': NEW_SERVICE_KEY }
    });
    console.log(`  New project: ${newRes.ok ? '✅' : '❌'} (${newRes.status})`);
    if (!newRes.ok) throw new Error('New project not accessible');
  } catch (e) {
    console.error('❌ Cannot reach new project:', e.message);
    process.exit(1);
  }

  console.log('\nStarting migration...\n');

  const results = [];
  const startTime = Date.now();

  for (const table of TABLES) {
    const result = await migrateTable(table);
    results.push(result);
  }

  // Summary
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n===================================');
  console.log('Migration Summary');
  console.log('===================================');

  const successful = results.filter(r => r.status === 'success');
  const partial = results.filter(r => r.status === 'partial');
  const skipped = results.filter(r => r.status === 'skipped' || r.status === 'empty');
  const totalRows = results.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log(`Total time: ${totalElapsed}s`);
  console.log(`Rows migrated: ${totalRows.toLocaleString()}`);
  console.log(`Tables successful: ${successful.length}`);
  console.log(`Tables partial: ${partial.length}`);
  console.log(`Tables skipped: ${skipped.length}`);

  if (partial.length > 0) {
    console.log('\n⚠ Tables with errors:');
    partial.forEach(r => {
      console.log(`  ${r.table}: ${r.count}/${r.total} rows`);
      r.errors?.forEach(e => console.log(`    - ${e}`));
    });
  }

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('migration_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to migration_results.json');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
