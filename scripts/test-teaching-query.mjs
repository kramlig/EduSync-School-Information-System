/**
 * Test teaching_assignments query directly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testQuery() {
  console.log('🧪 Testing teaching_assignments query...\n');

  // Test 1: Basic count
  const { count, error: countError } = await supabase
    .from('teaching_assignments')
    .select('*', { count: 'exact', head: true });

  console.log('1️⃣ Total records:', count);
  if (countError) console.error('   Error:', countError);

  // Test 2: Get a teacher ID
  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, name')
    .limit(1);

  if (teachers && teachers.length > 0) {
    const testTeacher = teachers[0];
    console.log(`\n2️⃣ Testing with teacher: ${testTeacher.name} (${testTeacher.id})`);

    // Test 3: Query assignments for that teacher
    const { data: assignments, error: assignError } = await supabase
      .from('teaching_assignments')
      .select(`
        *,
        section:sections(id, name),
        learning_area:learning_areas(id, name, code)
      `)
      .eq('teacher_id', testTeacher.id)
      .is('deleted_at', null)
      .eq('is_active', true);

    console.log(`   Found ${assignments?.length || 0} assignments`);
    if (assignError) {
      console.error('   ❌ Error:', assignError);
    } else if (assignments && assignments.length > 0) {
      console.log('   ✅ Sample assignment:');
      console.log(JSON.stringify(assignments[0], null, 2));
    }
  }

  // Test 4: Check a teacher with section adviser assignment
  const { data: sectionsData } = await supabase
    .from('sections')
    .select('adviser_id')
    .not('adviser_id', 'is', null)
    .limit(1);

  if (sectionsData && sectionsData[0]) {
    const adviserTeacherId = sectionsData[0].adviser_id;
    console.log(`\n3️⃣ Testing section adviser: ${adviserTeacherId}`);

    const { data: adviserAssignments, error: adviserError } = await supabase
      .from('teaching_assignments')
      .select('*')
      .eq('teacher_id', adviserTeacherId)
      .eq('is_advisory', true);

    console.log(`   Found ${adviserAssignments?.length || 0} adviser assignments`);
    if (adviserError) {
      console.error('   ❌ Error:', adviserError);
    } else if (adviserAssignments && adviserAssignments.length > 0) {
      console.log('   ✅ Sample:');
      console.table(adviserAssignments);
    }
  }
}

testQuery().catch(console.error);
