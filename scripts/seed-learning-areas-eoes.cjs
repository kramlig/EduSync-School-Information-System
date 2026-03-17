/**
 * Seed default DepEd elementary learning areas for Enrique Orencia Elementary School.
 * 
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-key"
 *   node scripts/seed-learning-areas-eoes.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SCHOOL_ID = 'b5142669-5dca-43cd-a7a7-aba174b569f4'; // Enrique Orencia Elementary School

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('\nSet it with:');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('  node scripts/seed-learning-areas-eoes.cjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const ELEMENTARY_SUBJECTS = [
  { code: 'MTB',   name: 'Mother Tongue',                grade_levels: [1,2,3],       category: 'core', display_order: 1, is_active: true, is_composite: false, components: null },
  { code: 'FIL',   name: 'Filipino',                     grade_levels: [1,2,3,4,5,6], category: 'core', display_order: 2, is_active: true, is_composite: false, components: null },
  { code: 'ENG',   name: 'English',                      grade_levels: [1,2,3,4,5,6], category: 'core', display_order: 3, is_active: true, is_composite: false, components: null },
  { code: 'MATH',  name: 'Mathematics',                  grade_levels: [1,2,3,4,5,6], category: 'core', display_order: 4, is_active: true, is_composite: false, components: null },
  { code: 'SCI',   name: 'Science',                      grade_levels: [3,4,5,6],     category: 'core', display_order: 5, is_active: true, is_composite: false, components: null },
  { code: 'AP',    name: 'Araling Panlipunan',           grade_levels: [1,2,3,4,5,6], category: 'core', display_order: 6, is_active: true, is_composite: false, components: null },
  { code: 'ESP',   name: 'Edukasyon sa Pagpapakatao',    grade_levels: [1,2,3,4,5,6], category: 'core', display_order: 7, is_active: true, is_composite: false, components: null },
  { code: 'EPP',   name: 'EPP/TLE',                      grade_levels: [4,5,6],       category: 'tle',  display_order: 8, is_active: true, is_composite: false, components: null },
  { code: 'MAPEH', name: 'MAPEH',                        grade_levels: [1,2,3,4,5,6], category: 'core', display_order: 9, is_active: true, is_composite: true,  components: ['Music','Arts','Physical Education','Health'] },
];

async function run() {
  console.log('\n📚 SEED LEARNING AREAS — Enrique Orencia Elementary School');
  console.log('═'.repeat(60));

  // 1. Verify the school exists
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .select('id, name')
    .eq('id', SCHOOL_ID)
    .single();

  if (schoolErr || !school) {
    console.error('❌ School not found:', schoolErr?.message);
    process.exit(1);
  }
  console.log(`✅ School found: ${school.name}`);

  // 2. Check if learning areas already exist
  const { data: existing, error: existErr } = await supabase
    .from('learning_areas')
    .select('id, code, name')
    .eq('school_id', SCHOOL_ID);

  if (existErr) {
    console.error('❌ Error checking existing learning areas:', existErr.message);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log(`⚠️  School already has ${existing.length} learning areas:`);
    existing.forEach(la => console.log(`   - ${la.code}: ${la.name}`));
    console.log('\nSkipping seed to avoid duplicates. Delete existing ones first if you want to re-seed.');
    process.exit(0);
  }

  // 3. Insert elementary subjects
  const rows = ELEMENTARY_SUBJECTS.map(s => ({ school_id: SCHOOL_ID, ...s }));
  const { data: inserted, error: insertErr } = await supabase
    .from('learning_areas')
    .insert(rows)
    .select('code, name');

  if (insertErr) {
    console.error('❌ Insert failed:', insertErr.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully seeded ${inserted.length} learning areas:`);
  inserted.forEach(la => console.log(`   ✓ ${la.code}: ${la.name}`));

  console.log('\n🎉 Done! Learning areas are now available for EOES.');
}

run().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
