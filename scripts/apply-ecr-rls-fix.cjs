const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://zjuxulhxxeeupcskkcok.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  // Try exec_sql first
  const r1 = await s.rpc('exec_sql', {
    query: `
      DROP POLICY IF EXISTS "Teachers can create activities" ON ecr_activities;
      CREATE POLICY "Teachers can create activities" ON ecr_activities
        FOR INSERT TO authenticated, anon WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Teachers can manage scores" ON ecr_scores;
      CREATE POLICY "Teachers can manage scores" ON ecr_scores
        FOR INSERT TO authenticated, anon WITH CHECK (true);
    `
  });

  if (r1.error) {
    console.log('exec_sql not available:', r1.error.message);
    console.log('\n⚠️  Please run this SQL manually in the Supabase SQL Editor:');
    console.log('─'.repeat(50));
    console.log(`
DROP POLICY IF EXISTS "Teachers can create activities" ON ecr_activities;
CREATE POLICY "Teachers can create activities" ON ecr_activities
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can manage scores" ON ecr_scores;
CREATE POLICY "Teachers can manage scores" ON ecr_scores
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);
    `);
    console.log('─'.repeat(50));
    console.log('Or run: scripts/migrations/007_fix_ecr_rls_personal.sql');
  } else {
    console.log('✅ RLS policies updated successfully!');
  }
}

run();
