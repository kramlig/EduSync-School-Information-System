/**
 * Migrate learning_areas only (triggers already disabled by user in SQL Editor)
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
    const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&offset=${offset}&limit=1000`, {
      headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` }
    });
    if (!res.ok) { console.error(`Fetch error: ${res.status}`); break; }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    all = all.concat(rows);
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  return all;
}

async function main() {
  console.log('=== Migrate learning_areas (triggers disabled) ===\n');

  // First clear any partial data
  console.log('1. Clearing existing learning_areas in new DB...');
  const delRes = await fetch(`${NEW_URL}/rest/v1/learning_areas?id=gt.0`, {
    method: 'DELETE',
    headers: {
      'apikey': NEW_SERVICE_KEY,
      'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
    }
  });
  console.log(`   Delete: ${delRes.status} ${delRes.statusText}`);

  // Fetch from old
  console.log('\n2. Fetching learning_areas from old project...');
  const rows = await fetchAll('learning_areas');
  console.log(`   Fetched ${rows.length} rows`);

  // Fix invalid subject_group values
  const validGroups = new Set(['core_academic', 'mapeh', 'epp_tle_exploratory', 'tle_specialized', 'tvl_shs']);
  let fixed = 0;
  for (const row of rows) {
    if (row.subject_group && !validGroups.has(row.subject_group)) {
      if (row.subject_group === 'tle_skills_based') row.subject_group = 'tle_specialized';
      else row.subject_group = null;
      fixed++;
    }
  }
  if (fixed > 0) console.log(`   Fixed ${fixed} invalid subject_group values`);

  // Insert in batches
  console.log('\n3. Inserting into new project...');
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${NEW_URL}/rest/v1/learning_areas`, {
      method: 'POST',
      headers: {
        'apikey': NEW_SERVICE_KEY,
        'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`   ❌ Batch at ${i}: ${err.substring(0, 300)}`);
      process.exit(1);
    }
    process.stdout.write(`   ✅ ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}\r`);
  }
  console.log(`\n\n   learning_areas: ✅ ${rows.length} rows migrated!`);

  console.log('\n=== Done! Now re-enable triggers in SQL Editor: ===');
  console.log(`
CREATE TRIGGER trg_seed_learning_areas
  AFTER INSERT ON schools FOR EACH ROW
  EXECUTE FUNCTION seed_default_learning_areas();

CREATE TRIGGER trg_auto_assign_ecr_weights
  AFTER INSERT ON learning_areas FOR EACH ROW
  EXECUTE FUNCTION auto_assign_ecr_weights();
  `);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
