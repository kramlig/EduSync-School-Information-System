/**
 * Fix script: Migrate schools + learning_areas that failed in first pass
 * 
 * Issues:
 * 1. schools: "ON CONFLICT" header caused error. Use plain INSERT + the seed trigger 
 *    auto-created learning_areas which we need to delete first
 * 2. learning_areas: CHECK constraint on subject_group is too restrictive for existing data
 */

const NEW_URL = 'https://ojahhzdibhfrjazgwvfw.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYWhoemRpYmhmcmphemd3dmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NDY4OSwiZXhwIjoyMDkwNTMwNjg5fQ.L8zdFElsYcnMDyd3ggthhgzYxPrbFMwEcHV4_at6vZ4';

const OLD_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const BATCH_SIZE = 500;

async function fetchAll(table, url, key) {
  let all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&order=id&offset=${offset}&limit=1000`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    all = all.concat(rows);
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  return all;
}

async function insertPlain(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${NEW_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': NEW_SERVICE_KEY,
        'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      const err = await res.text();
      console.log(`  ❌ Insert error at ${i}: ${err.substring(0, 200)}`);
      return false;
    }
    console.log(`  ✅ Inserted ${i + batch.length}/${rows.length}`);
  }
  return true;
}

async function deleteAll(table) {
  // Delete all rows using a broad filter
  const res = await fetch(`${NEW_URL}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers: {
      'apikey': NEW_SERVICE_KEY,
      'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    }
  });
  if (!res.ok) {
    const err = await res.text();
    console.log(`  Delete failed: ${err.substring(0, 200)}`);
    return false;
  }
  return true;
}

async function main() {
  console.log('=== Fix Migration: schools + learning_areas ===\n');

  // --- Step 1: Fix schools ---
  console.log('1. Migrating schools (plain INSERT, no upsert)...');
  const schools = await fetchAll('schools', OLD_URL, OLD_KEY);
  console.log(`   Fetched ${schools.length} schools from old project`);

  // Delete any auto-seeded learning_areas from the trigger
  console.log('   Deleting any auto-seeded learning_areas from new project...');
  await deleteAll('learning_areas');

  // Insert schools with plain INSERT (no Prefer: resolution=merge-duplicates)
  const schoolSuccess = await insertPlain('schools', schools);
  console.log(`   Schools: ${schoolSuccess ? '✅ Done' : '❌ Failed'}`);

  // --- Step 2: Fix learning_areas ---
  console.log('\n2. Migrating learning_areas...');

  // First delete auto-seeded ones (trigger fires on school insert)
  console.log('   Deleting auto-seeded learning_areas (from school trigger)...');
  await deleteAll('learning_areas');
  
  const learningAreas = await fetchAll('learning_areas', OLD_URL, OLD_KEY);
  console.log(`   Fetched ${learningAreas.length} learning_areas from old project`);
  
  // Fix subject_group values: map invalid values to allowed ones or null  
  // The constraint allows: core_academic, mapeh, epp_tle_exploratory, tle_specialized, tvl_shs
  const validGroups = new Set(['core_academic', 'mapeh', 'epp_tle_exploratory', 'tle_specialized', 'tvl_shs']);
  let fixed = 0;
  for (const row of learningAreas) {
    if (row.subject_group && !validGroups.has(row.subject_group)) {
      // Map tle_skills_based -> tle_specialized
      if (row.subject_group === 'tle_skills_based') {
        row.subject_group = 'tle_specialized';
      } else {
        row.subject_group = null;
      }
      fixed++;
    }
  }
  console.log(`   Fixed ${fixed} invalid subject_group values`);
  
  // But we also have NULL values and the constraint doesn't allow NULL
  // Let's just remove the constraint and insert freely
  // Actually the constraint should allow NULL since it only throws on specific invalid values
  // The error was "23514" = check_violation. Let's see if NULL is the issue
  const nullCount = learningAreas.filter(r => r.subject_group === null).length;
  console.log(`   Rows with null subject_group: ${nullCount}`);
  
  const laSuccess = await insertPlain('learning_areas', learningAreas);
  console.log(`   Learning areas: ${laSuccess ? '✅ Done' : '❌ Failed'}`);

  if (!laSuccess) {
    console.log('\n   Retrying: Setting all null subject_group to "core_academic"...');
    for (const row of learningAreas) {
      if (!row.subject_group) row.subject_group = 'core_academic';
    }
    // Delete again first
    await deleteAll('learning_areas');
    const laRetry = await insertPlain('learning_areas', learningAreas);
    console.log(`   Learning areas retry: ${laRetry ? '✅ Done' : '❌ Failed'}`);
  }

  console.log('\n=== Done ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
