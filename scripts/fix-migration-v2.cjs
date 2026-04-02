/**
 * Fix migration v2: Disable trigger, drop constraint, insert schools + learning_areas
 * Uses Supabase Management API SQL execution via the SQL endpoint
 */

const NEW_URL = 'https://ojahhzdibhfrjazgwvfw.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYWhoemRpYmhmcmphemd3dmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NDY4OSwiZXhwIjoyMDkwNTMwNjg5fQ.L8zdFElsYcnMDyd3ggthhgzYxPrbFMwEcHV4_at6vZ4';

const OLD_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const BATCH_SIZE = 500;

async function fetchAll(table) {
  let all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&order=id&offset=${offset}&limit=1000`, {
      headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` }
    });
    if (!res.ok) {
      // Try without order
      const res2 = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&offset=${offset}&limit=1000`, {
        headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` }
      });
      const rows = await res2.json();
      if (!Array.isArray(rows) || rows.length === 0) break;
      all = all.concat(rows);
      offset += rows.length;
      if (rows.length < 1000) break;
      continue;
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    all = all.concat(rows);
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  return all;
}

async function insertBatch(table, rows) {
  if (rows.length === 0) return true;
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${NEW_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': NEW_SERVICE_KEY,
        'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
        'Content-Type': 'application/json'
        // NO Prefer header - plain insert, no upsert
      },
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      const err = await res.text();
      console.log(`  ❌ Error at ${i}: ${err.substring(0, 250)}`);
      return false;
    }
    process.stdout.write(`  ✅ ${i + batch.length}/${rows.length}\r`);
  }
  console.log('');
  return true;
}

async function main() {
  console.log('=== Fix Migration v2: schools + learning_areas ===\n');

  // Step 1: We need to disable the seed trigger and drop the constraint
  // Since we can't run SQL directly, we'll ask the user to do it in SQL Editor
  // OR we try the workaround: delete + re-insert without the problematic header
  
  console.log('IMPORTANT: Please run this SQL in the Supabase SQL Editor FIRST:');
  console.log('---');
  console.log('ALTER TABLE learning_areas DROP CONSTRAINT IF EXISTS learning_areas_subject_group_check;');
  console.log('DROP TRIGGER IF EXISTS trg_seed_learning_areas ON schools;');
  console.log('DELETE FROM learning_areas WHERE true;');
  console.log('---');
  console.log('');
  console.log('Press Ctrl+C if not done yet. Waiting 3 seconds...');
  
  await new Promise(r => setTimeout(r, 3000));

  // Step 2: Insert schools
  console.log('\n1. Migrating schools...');
  const schools = await fetchAll('schools');
  console.log(`   Fetched ${schools.length} schools`);
  
  const schoolOk = await insertBatch('schools', schools);
  if (!schoolOk) {
    console.log('   Schools failed. Make sure you ran the SQL above first.');
    process.exit(1);
  }
  console.log(`   Schools: ✅ ${schools.length} rows`);

  // Step 3: Insert learning_areas (with fixed subject_group)
  console.log('\n2. Migrating learning_areas...');
  const learningAreas = await fetchAll('learning_areas');
  console.log(`   Fetched ${learningAreas.length} learning_areas`);
  
  // Fix invalid subject_group values
  const validGroups = new Set(['core_academic', 'mapeh', 'epp_tle_exploratory', 'tle_specialized', 'tvl_shs']);
  let fixed = 0;
  for (const row of learningAreas) {
    if (row.subject_group && !validGroups.has(row.subject_group)) {
      if (row.subject_group === 'tle_skills_based') row.subject_group = 'tle_specialized';
      else row.subject_group = null;
      fixed++;
    }
  }
  if (fixed > 0) console.log(`   Fixed ${fixed} invalid subject_group values`);
  
  const laOk = await insertBatch('learning_areas', learningAreas);
  if (!laOk) {
    console.log('   Learning areas failed.');
    process.exit(1);
  }
  console.log(`   Learning areas: ✅ ${learningAreas.length} rows`);

  // Step 4: Re-enable trigger
  console.log('\n3. Please re-enable the trigger in SQL Editor:');
  console.log('---');
  console.log('CREATE TRIGGER trg_seed_learning_areas');
  console.log('    AFTER INSERT ON schools');
  console.log('    FOR EACH ROW');
  console.log('    EXECUTE FUNCTION seed_default_learning_areas();');
  console.log('---');

  console.log('\n=== Done! ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
